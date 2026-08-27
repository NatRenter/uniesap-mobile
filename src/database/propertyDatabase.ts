import { getDatabase } from "@/database/database";

import type { Property } from "@/types/property";

/*
 * ============================================================================
 * FILA SQLITE DE INMUEBLE
 * ============================================================================
 *
 * Representa la estructura almacenada dentro de SQLite.
 */
type PropertyRow = {
  id: string;

  company_id: string;

  name: string;
  type: string;

  state: string;
  city: string;

  address: string | null;

  workers: number;

  form_ids_json: string;

  status: Property["status"];

  created_at: string;
  updated_at: string;
};

/*
 * ============================================================================
 * CONTAR INMUEBLES
 * ============================================================================
 */
export async function countProperties(): Promise<number> {
  const database = await getDatabase();

  const row = await database.getFirstAsync<{
    count: number;
  }>(`
    SELECT COUNT(*) AS count
    FROM properties;
  `);

  return row?.count ?? 0;
}

/*
 * ============================================================================
 * OBTENER TODOS LOS INMUEBLES
 * ============================================================================
 *
 * Recupera todos los inmuebles almacenados localmente.
 */
export async function selectAllProperties(): Promise<Property[]> {
  const database = await getDatabase();

  const rows = await database.getAllAsync<PropertyRow>(`
    SELECT
      id,
      company_id,
      name,
      type,
      state,
      city,
      address,
      workers,
      form_ids_json,
      status,
      created_at,
      updated_at
    FROM properties
    ORDER BY updated_at DESC, name ASC;
  `);

  return rows.map(mapPropertyRow);
}

/*
 * ============================================================================
 * INSERTAR INMUEBLE
 * ============================================================================
 *
 * Inserta un inmueble nuevo.
 *
 * companyId debe corresponder con una empresa existente
 * debido a la FOREIGN KEY configurada en SQLite.
 */
export async function insertProperty(property: Property): Promise<void> {
  const database = await getDatabase();

  await database.runAsync(
    `
      INSERT INTO properties (
        id,
        company_id,
        name,
        type,
        state,
        city,
        address,
        workers,
        form_ids_json,
        status,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `,
    property.id,
    property.companyId,
    property.name,
    property.type,
    property.state,
    property.city,
    property.address ?? null,
    property.workers,
    JSON.stringify(property.formIds),
    property.status,
    property.createdAt,
    property.updatedAt,
  );
}

/*
 * ============================================================================
 * REEMPLAZAR INMUEBLE
 * ============================================================================
 *
 * Persiste los cambios realizados sobre un inmueble.
 */
export async function replaceProperty(property: Property): Promise<void> {
  const database = await getDatabase();

  await database.runAsync(
    `
      INSERT OR REPLACE INTO properties (
        id,
        company_id,
        name,
        type,
        state,
        city,
        address,
        workers,
        form_ids_json,
        status,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `,
    property.id,
    property.companyId,
    property.name,
    property.type,
    property.state,
    property.city,
    property.address ?? null,
    property.workers,
    JSON.stringify(property.formIds),
    property.status,
    property.createdAt,
    property.updatedAt,
  );
}

/*
 * ============================================================================
 * ELIMINAR INMUEBLE
 * ============================================================================
 */
export async function deletePropertyFromDatabase(id: string): Promise<boolean> {
  const database = await getDatabase();

  const result = await database.runAsync(
    `
      DELETE FROM properties
      WHERE id = ?;
    `,
    id,
  );

  return result.changes > 0;
}

/*
 * ============================================================================
 * SQLITE → PROPERTY
 * ============================================================================
 */
function mapPropertyRow(row: PropertyRow): Property {
  return {
    id: row.id,

    companyId: row.company_id,

    name: row.name,
    type: row.type,

    state: row.state,
    city: row.city,

    ...(row.address
      ? {
          address: row.address,
        }
      : {}),

    workers: row.workers,

    /*
     * SQLite no tiene un tipo Array.
     *
     * Temporalmente los formularios asignados al inmueble
     * se almacenan como JSON.
     */
    formIds: parseFormIds(row.form_ids_json),

    status: row.status,

    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/*
 * ============================================================================
 * LEER FORM IDS
 * ============================================================================
 *
 * Convierte el JSON almacenado en SQLite nuevamente en string[].
 *
 * Si por algún motivo el valor almacenado está dañado,
 * devolvemos [] para evitar que la aplicación deje de iniciar.
 */
function parseFormIds(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item): item is string => typeof item === "string");
  } catch (error) {
    console.warn("No fue posible leer formIds del inmueble:", error);

    return [];
  }
}
