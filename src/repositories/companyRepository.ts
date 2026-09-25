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
 *
 * ============================================================================
 * SINCRONIZACIÓN
 * ============================================================================
 *
 * Toda creación o modificación local deja la empresa en estado:
 *
 * pending
 *
 * y genera un operationId nuevo.
 *
 * Esto permitirá que posteriormente SyncService envíe únicamente los
 * cambios pendientes a UNIESAP API.
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

/*
 * ============================================================================
 * CAMPOS EDITABLES
 * ============================================================================
 *
 * Una pantalla puede modificar datos empresariales, pero NO puede modificar:
 *
 * id
 * createdAt
 * updatedAt
 * deletedAt
 * sync
 *
 * Esos campos pertenecen al repositorio y al sistema de sincronización.
 */
export type UpdateCompanyInput = Partial<
  Pick<
    Company,
    | "name"
    | "legalName"
    | "rfc"
    | "state"
    | "city"
    | "phone"
    | "email"
    | "branding"
    | "status"
  >
>;

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
 * Se generan DOS identificadores diferentes:
 *
 * company.id
 *   identifica permanentemente la empresa.
 *
 * sync.operationId
 *   identifica esta operación concreta de sincronización.
 *
 * Ambos se generan antes de cualquier comunicación con la API.
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

    sync: {
      status: "pending",

      serverVersion: 0,

      operationId: createUuid(),
    },
  };

  companyRepositoryItems.unshift(company);

  try {
    await adapter.insert(company);

    return cloneCompany(company);
  } catch (error) {
    removeCompanyFromMemory(company.id);

    throw error;
  }
}

/*
 * ============================================================================
 * ACTUALIZAR EMPRESA
 * ============================================================================
 *
 * Cada edición local:
 *
 * 1. conserva id;
 * 2. conserva createdAt;
 * 3. actualiza updatedAt;
 * 4. conserva serverVersion;
 * 5. genera un nuevo operationId;
 * 6. cambia sync.status a pending;
 * 7. limpia el error anterior.
 *
 * El servidor utilizará serverVersion para detectar posteriormente
 * posibles conflictos.
 */
export async function updateCompany(
  id: string,
  changes: UpdateCompanyInput,
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
     * La fecha original de creación tampoco cambia.
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
     * Toda edición local genera nueva fecha.
     */
    updatedAt: new Date().toISOString(),

    /*
     * La eliminación lógica no puede modificarse desde una pantalla
     * mediante updateCompany().
     */
    ...(previous.deletedAt
      ? {
          deletedAt: previous.deletedAt,
        }
      : {}),

    /*
     * Toda modificación local vuelve a quedar pendiente.
     *
     * serverVersion se conserva porque representa la última versión
     * conocida del servidor, no la versión del cambio local.
     */
    sync: {
      status: "pending",

      serverVersion: previous.sync.serverVersion,

      operationId: createUuid(),
    },
  };

  companyRepositoryItems[index] = updated;

  try {
    await adapter.replace(updated);

    return cloneCompany(updated);
  } catch (error) {
    companyRepositoryItems[index] = previous;

    throw error;
  }
}

/*
 * ============================================================================
 * ELIMINAR EMPRESA
 * ============================================================================
 *
 * TEMPORAL:
 *
 * Esta operación todavía conserva el comportamiento físico existente.
 *
 * En la siguiente etapa la convertiremos a soft delete:
 *
 * deletedAt = fecha
 * sync.status = pending
 *
 * No se cambia todavía para no mezclar la migración de metadatos con
 * el comportamiento funcional de eliminación.
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
 *
 * Ahora también clonamos sync para que ningún consumidor pueda
 * modificar accidentalmente los metadatos internos.
 */
function cloneCompany(company: Company): Company {
  return {
    ...company,

    branding: {
      ...company.branding,
    },

    sync: {
      ...company.sync,
    },
  };
}
