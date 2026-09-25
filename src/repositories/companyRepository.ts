import { initialCompanies } from "@/database/companySeed";

import type { Company, CompanyBranding } from "@/types/company";

import { createUuid } from "@/utils/idUtils";

/*
 * ============================================================================
 * COMPANY REPOSITORY
 * ============================================================================
 *
 * Fuente central de empresas en memoria.
 *
 * Persistencia:
 *
 * Android / iOS → SQLite
 * Web           → localStorage
 *
 * IMPORTANTE:
 *
 * Company ya no almacena propertyIds.
 *
 * Para obtener inmuebles se utiliza:
 *
 * getPropertiesByCompanyId(company.id)
 */

export type CompanyPersistenceAdapter = {
  loadAll: () => Promise<Company[] | null>;

  insert: (company: Company) => Promise<void>;

  replace: (company: Company) => Promise<void>;

  delete: (id: string) => Promise<boolean>;
};

export type CreateCompanyInput = {
  name: string;

  legalName: string;

  rfc?: string;

  state: string;

  city: string;

  phone?: string;

  email?: string;

  branding: CompanyBranding;

  status?: Company["status"];
};

let persistenceAdapter: CompanyPersistenceAdapter | null = null;

let hydrationPromise: Promise<void> | null = null;

let hydrated = false;

/*
 * ============================================================================
 * ESTADO EN MEMORIA
 * ============================================================================
 *
 * Inicialmente contiene el seed.
 *
 * Al hidratarse, este contenido se reemplaza por
 * SQLite/localStorage cuando existen datos persistidos.
 */
export const companyRepositoryItems: Company[] =
  initialCompanies.map(cloneCompany);

/*
 * IDs antiguos utilizados durante las primeras
 * versiones del prototipo.
 *
 * Se conservan para mantener compatibilidad con
 * datos existentes.
 */
const legacyCompanyIds: Record<string, string> = {
  "1": "company-001",

  "2": "company-002",
};

/*
 * ============================================================================
 * CONFIGURAR PERSISTENCIA
 * ============================================================================
 */
export function configureCompanyRepositoryPersistence(
  adapter: CompanyPersistenceAdapter,
): void {
  persistenceAdapter = adapter;
}

/*
 * ============================================================================
 * HIDRATACIÓN
 * ============================================================================
 *
 * Se ejecuta una sola vez durante el arranque.
 *
 * Si storage está vacío:
 *
 * seed
 *   ↓
 * persistencia
 *
 * Si ya existen registros:
 *
 * persistencia
 *   ↓
 * memoria
 */
export async function hydrateCompanyRepository(): Promise<void> {
  if (hydrated) {
    return;
  }

  if (hydrationPromise) {
    return hydrationPromise;
  }

  hydrationPromise = hydrateInternal();

  return hydrationPromise;
}

async function hydrateInternal(): Promise<void> {
  const adapter = requirePersistenceAdapter();

  const persisted = await adapter.loadAll();

  if (persisted === null) {
    for (const company of companyRepositoryItems) {
      await adapter.insert(cloneCompany(company));
    }

    hydrated = true;

    console.log(
      `Repositorio de empresas inicializado con ${companyRepositoryItems.length} registro(s).`,
    );

    return;
  }

  companyRepositoryItems.splice(
    0,

    companyRepositoryItems.length,

    ...persisted.map(cloneCompany),
  );

  hydrated = true;

  console.log(
    `Repositorio de empresas hidratado con ${companyRepositoryItems.length} registro(s).`,
  );
}

/*
 * ============================================================================
 * CONSULTAS
 * ============================================================================
 */

export function getCompanies(): Company[] {
  return companyRepositoryItems.map(cloneCompany);
}

export function getCompanyById(id: string): Company | undefined {
  const resolvedId = resolveCompanyId(id);

  const company = companyRepositoryItems.find((item) => item.id === resolvedId);

  return company ? cloneCompany(company) : undefined;
}

/*
 * Convierte IDs legacy al formato utilizado
 * por las primeras versiones del prototipo.
 *
 * Los UUID nuevos no necesitan ninguna conversión.
 */
export function resolveCompanyId(id: string): string {
  return legacyCompanyIds[id] ?? id;
}

/*
 * ============================================================================
 * CREAR EMPRESA
 * ============================================================================
 *
 * Toda empresa nueva recibe inmediatamente un UUID.
 *
 * El ID se genera ANTES de escribir en SQLite y antes
 * de cualquier futura comunicación con la API.
 *
 * De esta forma una empresa puede crearse completamente
 * offline y conservar posteriormente la misma identidad
 * en el servidor.
 */
export async function createCompany(
  input: CreateCompanyInput,
): Promise<Company> {
  const adapter = requirePersistenceAdapter();

  const now = new Date().toISOString();

  const company: Company = {
    id: createUuid(),

    name: input.name.trim(),

    legalName: input.legalName.trim(),

    ...(input.rfc?.trim()
      ? {
          rfc: input.rfc.trim(),
        }
      : {}),

    state: input.state.trim(),

    city: input.city.trim(),

    ...(input.phone?.trim()
      ? {
          phone: input.phone.trim(),
        }
      : {}),

    ...(input.email?.trim()
      ? {
          email: input.email.trim(),
        }
      : {}),

    branding: {
      ...input.branding,
    },

    status: input.status ?? "active",

    createdAt: now,

    updatedAt: now,
  };

  /*
   * Primero actualizamos memoria para mantener
   * la interfaz reactiva.
   */
  companyRepositoryItems.unshift(company);

  try {
    await adapter.insert(company);

    return cloneCompany(company);
  } catch (error) {
    /*
     * Si falla persistencia hacemos rollback
     * del cambio en memoria.
     */
    removeCompanyFromMemory(company.id);

    throw error;
  }
}

/*
 * ============================================================================
 * ACTUALIZAR EMPRESA
 * ============================================================================
 *
 * id y createdAt son inmutables.
 *
 * updatedAt se actualiza automáticamente.
 */
export async function updateCompany(
  id: string,

  changes: Partial<Company>,
): Promise<Company | undefined> {
  const adapter = requirePersistenceAdapter();

  const resolvedId = resolveCompanyId(id);

  const index = companyRepositoryItems.findIndex(
    (company) => company.id === resolvedId,
  );

  if (index === -1) {
    return undefined;
  }

  const previous = cloneCompany(companyRepositoryItems[index]);

  const updated: Company = {
    ...previous,

    ...changes,

    /*
     * El ID nunca se modifica.
     */
    id: previous.id,

    /*
     * La fecha original de creación
     * tampoco cambia.
     */
    createdAt: previous.createdAt,

    /*
     * Branding puede actualizarse parcialmente.
     */
    branding: {
      ...previous.branding,

      ...(changes.branding ?? {}),
    },

    /*
     * Toda edición genera nueva fecha
     * de actividad.
     */
    updatedAt: new Date().toISOString(),
  };

  companyRepositoryItems[index] = updated;

  try {
    await adapter.replace(updated);

    return cloneCompany(updated);
  } catch (error) {
    /*
     * Rollback en memoria.
     */
    companyRepositoryItems[index] = previous;

    throw error;
  }
}

/*
 * ============================================================================
 * ELIMINAR EMPRESA
 * ============================================================================
 *
 * Todavía conserva la eliminación física actual.
 *
 * En una siguiente etapa esta operación evolucionará
 * hacia soft delete para permitir sincronizar tombstones
 * entre dispositivos.
 *
 * SQLite impedirá eliminar una empresa
 * mientras tenga inmuebles asociados.
 */
export async function deleteCompany(id: string): Promise<boolean> {
  const adapter = requirePersistenceAdapter();

  const resolvedId = resolveCompanyId(id);

  const index = companyRepositoryItems.findIndex(
    (company) => company.id === resolvedId,
  );

  if (index === -1) {
    return false;
  }

  const previous = cloneCompany(companyRepositoryItems[index]);

  companyRepositoryItems.splice(index, 1);

  try {
    const deleted = await adapter.delete(resolvedId);

    if (!deleted) {
      throw new Error(
        `No fue posible confirmar la eliminación de la empresa ${resolvedId}.`,
      );
    }

    return true;
  } catch (error) {
    companyRepositoryItems.splice(index, 0, previous);

    throw error;
  }
}

/*
 * ============================================================================
 * UTILIDADES INTERNAS
 * ============================================================================
 */

function requirePersistenceAdapter(): CompanyPersistenceAdapter {
  if (!persistenceAdapter) {
    throw new Error(
      "CompanyRepository todavía no tiene un adaptador de persistencia configurado.",
    );
  }

  return persistenceAdapter;
}

/*
 * Rollback utilizado cuando falla
 * la inserción persistente.
 */
function removeCompanyFromMemory(id: string): void {
  const index = companyRepositoryItems.findIndex(
    (company) => company.id === id,
  );

  if (index !== -1) {
    companyRepositoryItems.splice(index, 1);
  }
}

/*
 * Evita devolver referencias mutables
 * del estado interno.
 */
function cloneCompany(company: Company): Company {
  return {
    ...company,

    branding: {
      ...company.branding,
    },
  };
}
