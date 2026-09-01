import { getDatabase } from "@/database/database";

import {
  replacePropertyFormAssignmentsInsideTransaction,
  selectAllPropertyFormAssignments,
} from "@/database/propertyFormDatabase";

import type { PropertyFormAssignment } from "@/database/propertyFormDatabase";

import type { Property } from "@/types/property";

/*
 * ============================================================================
 * PROPERTY DATABASE
 * ============================================================================
 *
 * Persistencia SQLite de:
 *
 * Property
 *
 * ============================================================================
 * RESPONSABILIDAD
 * ============================================================================
 *
 * Este archivo administra únicamente los datos principales almacenados en:
 *
 * properties
 *
 * Las relaciones:
 *
 * Property
 *    ↕
 * Form
 *
 * pertenecen a:
 *
 * PropertyFormDatabase
 *
 * ============================================================================
 * ARQUITECTURA
 * ============================================================================
 *
 * PropertyRepository
 *        ↓
 * PropertyDatabase
 *        ↓
 *     properties
 *
 *
 * PropertyDatabase
 *        ↓
 * PropertyFormDatabase
 *        ↓
 *   property_forms
 *
 * ============================================================================
 * PROPERTY.FORMIDS
 * ============================================================================
 *
 * Property.formIds sigue existiendo como parte del modelo de dominio.
 *
 * Sin embargo, NO se almacena dentro de properties.
 *
 * Durante la lectura:
 *
 * properties
 *      +
 * property_forms
 *      ↓
 * Property
 *
 * Durante escritura:
 *
 * PropertyDatabase
 *      ├── properties
 *      └── PropertyFormDatabase
 *              ↓
 *         property_forms
 */

/*
 * ============================================================================
 * FILA SQLITE
 * ============================================================================
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
 * PropertyDatabase consulta:
 *
 * properties
 *
 * y solicita las relaciones a:
 *
 * PropertyFormDatabase.
 */

export async function selectAllProperties(): Promise<Property[]> {
  const database = await getDatabase();

  /*
   * ================================================================
   * PROPERTIES
   * ================================================================
   */
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
        status,
        created_at,
        updated_at
      FROM properties
      ORDER BY updated_at DESC, name ASC;
    `);

  /*
   * ================================================================
   * PROPERTY ↔ FORM
   * ================================================================
   */
  const assignments = await selectAllPropertyFormAssignments();

  /*
   * Creamos una proyección:
   *
   * propertyId
   *      ↓
   * formIds[]
   */
  const formIdsByProperty = buildFormIdsByProperty(assignments);

  /*
   * Reconstruimos Property.
   */
  return rows.map((row) =>
    mapPropertyRow(row, formIdsByProperty.get(row.id) ?? []),
  );
}

/*
 * ============================================================================
 * INSERTAR INMUEBLE
 * ============================================================================
 *
 * La operación completa es atómica.
 *
 * Una misma transacción guarda:
 *
 * properties
 *      +
 * property_forms
 */

export async function insertProperty(property: Property): Promise<void> {
  const database = await getDatabase();

  await database.withTransactionAsync(async () => {
    /*
     * ================================================================
     * PROPERTY
     * ================================================================
     */
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
            status,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `,
      property.id,
      property.companyId,
      property.name,
      property.type,
      property.state,
      property.city,
      property.address ?? null,
      property.workers,
      property.status,
      property.createdAt,
      property.updatedAt,
    );

    /*
     * ================================================================
     * PROPERTY ↔ FORM
     * ================================================================
     *
     * PropertyFormDatabase participa en la misma
     * transacción ya abierta por PropertyDatabase.
     */
    await replacePropertyFormAssignmentsInsideTransaction(
      property.id,
      property.formIds,
    );
  });
}

/*
 * ============================================================================
 * ACTUALIZAR INMUEBLE
 * ============================================================================
 *
 * properties y property_forms se actualizan
 * dentro de una única transacción.
 */

export async function replaceProperty(property: Property): Promise<void> {
  const database = await getDatabase();

  await database.withTransactionAsync(async () => {
    /*
     * ================================================================
     * PROPERTY
     * ================================================================
     */
    const result = await database.runAsync(
      `
            UPDATE properties
            SET
              company_id = ?,
              name = ?,
              type = ?,
              state = ?,
              city = ?,
              address = ?,
              workers = ?,
              status = ?,
              created_at = ?,
              updated_at = ?
            WHERE id = ?;
          `,
      property.companyId,
      property.name,
      property.type,
      property.state,
      property.city,
      property.address ?? null,
      property.workers,
      property.status,
      property.createdAt,
      property.updatedAt,
      property.id,
    );

    if (result.changes === 0) {
      throw new Error(
        `No fue posible actualizar el inmueble ${property.id} porque no existe en SQLite.`,
      );
    }

    /*
     * ================================================================
     * PROPERTY ↔ FORM
     * ================================================================
     */
    await replacePropertyFormAssignmentsInsideTransaction(
      property.id,
      property.formIds,
    );
  });
}

/*
 * ============================================================================
 * ELIMINAR INMUEBLE
 * ============================================================================
 *
 * property_forms utiliza:
 *
 * ON DELETE CASCADE
 *
 * Por ello las relaciones desaparecen automáticamente
 * al eliminar un Property.
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

function mapPropertyRow(row: PropertyRow, formIds: string[]): Property {
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
     * Property.formIds es una proyección
     * obtenida desde property_forms.
     */
    formIds: [...formIds],

    status: row.status,

    createdAt: row.created_at,

    updatedAt: row.updated_at,
  };
}

/*
 * ============================================================================
 * CONSTRUIR PROYECCIÓN PROPERTY → FORM IDS
 * ============================================================================
 */

function buildFormIdsByProperty(
  assignments: PropertyFormAssignment[],
): Map<string, string[]> {
  const map = new Map<string, string[]>();

  for (const assignment of assignments) {
    /*
     * Property.formIds contiene únicamente
     * asignaciones activas.
     */
    if (assignment.status !== "active") {
      continue;
    }

    const current = map.get(assignment.propertyId) ?? [];

    if (!current.includes(assignment.formId)) {
      current.push(assignment.formId);
    }

    map.set(assignment.propertyId, current);
  }

  return map;
}
