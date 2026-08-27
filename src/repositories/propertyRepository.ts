import { initialProperties } from "@/database/propertySeed";

import type { Property } from "@/types/property";

/*
 * ============================================================================
 * PROPERTY REPOSITORY
 * ============================================================================
 *
 * Fuente central de inmuebles.
 *
 * Property.companyId es la relación principal con Company.
 */

export type PropertyPersistenceAdapter = {
  loadAll: () => Promise<Property[] | null>;
  insert: (property: Property) => Promise<void>;
  replace: (property: Property) => Promise<void>;
  delete: (id: string) => Promise<boolean>;
};

export type CreatePropertyInput = {
  companyId: string;

  name: string;
  type: string;

  state: string;
  city: string;

  address?: string;

  workers?: number;

  formIds?: string[];

  status?: Property["status"];
};

let persistenceAdapter: PropertyPersistenceAdapter | null = null;

let hydrationPromise: Promise<void> | null = null;

let hydrated = false;

export const propertyRepositoryItems: Property[] =
  initialProperties.map(cloneProperty);

const legacyPropertyIds: Record<string, string> = {
  "1": "property-001",
  "2": "property-002",
  "3": "property-003",
  "4": "property-004",
};

export function configurePropertyRepositoryPersistence(
  adapter: PropertyPersistenceAdapter,
): void {
  persistenceAdapter = adapter;
}

export async function hydratePropertyRepository(): Promise<void> {
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
    for (const property of propertyRepositoryItems) {
      await adapter.insert(cloneProperty(property));
    }

    hydrated = true;

    console.log(
      `Repositorio de inmuebles inicializado con ${propertyRepositoryItems.length} registro(s).`,
    );

    return;
  }

  propertyRepositoryItems.splice(
    0,
    propertyRepositoryItems.length,
    ...persisted.map(cloneProperty),
  );

  hydrated = true;

  console.log(
    `Repositorio de inmuebles hidratado con ${propertyRepositoryItems.length} registro(s).`,
  );
}

export function getProperties(): Property[] {
  return propertyRepositoryItems.map(cloneProperty);
}

export function getPropertiesByCompanyId(companyId: string): Property[] {
  return propertyRepositoryItems
    .filter((property) => property.companyId === companyId)
    .map(cloneProperty);
}

export function getPropertyById(id: string): Property | undefined {
  const resolvedId = resolvePropertyId(id);

  const property = propertyRepositoryItems.find(
    (item) => item.id === resolvedId,
  );

  return property ? cloneProperty(property) : undefined;
}

export function resolvePropertyId(id: string): string {
  return legacyPropertyIds[id] ?? id;
}

/*
 * Crea un inmueble nuevo.
 *
 * workers inicia en 0 y formIds vacío cuando la pantalla
 * todavía no capture esos datos.
 */
export async function createProperty(
  input: CreatePropertyInput,
): Promise<Property> {
  const adapter = requirePersistenceAdapter();

  const now = new Date().toISOString();

  const property: Property = {
    id: createPropertyId(),

    companyId: input.companyId,

    name: input.name.trim(),
    type: input.type.trim(),

    state: input.state.trim(),
    city: input.city.trim(),

    ...(input.address?.trim()
      ? {
          address: input.address.trim(),
        }
      : {}),

    workers: input.workers ?? 0,

    formIds: [...(input.formIds ?? [])],

    status: input.status ?? "active",

    createdAt: now,
    updatedAt: now,
  };

  propertyRepositoryItems.unshift(property);

  try {
    await adapter.insert(property);

    return cloneProperty(property);
  } catch (error) {
    removePropertyFromMemory(property.id);

    throw error;
  }
}

export async function updateProperty(
  id: string,
  changes: Partial<Property>,
): Promise<Property | undefined> {
  const adapter = requirePersistenceAdapter();

  const resolvedId = resolvePropertyId(id);

  const index = propertyRepositoryItems.findIndex(
    (property) => property.id === resolvedId,
  );

  if (index === -1) {
    return undefined;
  }

  const previous = cloneProperty(propertyRepositoryItems[index]);

  const updated: Property = {
    ...previous,
    ...changes,

    id: previous.id,
    createdAt: previous.createdAt,

    formIds: changes.formIds ? [...changes.formIds] : [...previous.formIds],

    updatedAt: new Date().toISOString(),
  };

  propertyRepositoryItems[index] = updated;

  try {
    await adapter.replace(updated);

    return cloneProperty(updated);
  } catch (error) {
    propertyRepositoryItems[index] = previous;

    throw error;
  }
}

export async function deleteProperty(id: string): Promise<boolean> {
  const adapter = requirePersistenceAdapter();

  const resolvedId = resolvePropertyId(id);

  const index = propertyRepositoryItems.findIndex(
    (property) => property.id === resolvedId,
  );

  if (index === -1) {
    return false;
  }

  const previous = cloneProperty(propertyRepositoryItems[index]);

  propertyRepositoryItems.splice(index, 1);

  try {
    const deleted = await adapter.delete(resolvedId);

    if (!deleted) {
      throw new Error(
        `No fue posible confirmar la eliminación del inmueble ${resolvedId}.`,
      );
    }

    return true;
  } catch (error) {
    propertyRepositoryItems.splice(index, 0, previous);

    throw error;
  }
}

function requirePersistenceAdapter(): PropertyPersistenceAdapter {
  if (!persistenceAdapter) {
    throw new Error(
      "PropertyRepository todavía no tiene un adaptador de persistencia configurado.",
    );
  }

  return persistenceAdapter;
}

function createPropertyId(): string {
  return `property-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function removePropertyFromMemory(id: string): void {
  const index = propertyRepositoryItems.findIndex(
    (property) => property.id === id,
  );

  if (index !== -1) {
    propertyRepositoryItems.splice(index, 1);
  }
}

function cloneProperty(property: Property): Property {
  return {
    ...property,

    formIds: [...property.formIds],
  };
}
