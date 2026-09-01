import { getDatabase } from "@/database/database";

/*
 * ============================================================================
 * PROPERTY FORM DATABASE
 * ============================================================================
 *
 * Administra exclusivamente la persistencia de la relación:
 *
 * Property
 *    ↕
 * Form
 *
 * La relación se almacena de forma normalizada en:
 *
 * property_forms
 *
 * La estructura SQL de esta tabla NO se crea aquí.
 *
 * Toda creación y evolución del esquema pertenece exclusivamente a:
 *
 * src/database/migrations.ts
 *
 * ============================================================================
 * ARQUITECTURA
 * ============================================================================
 *
 * SQLite
 *   ↓
 * property_forms
 *   ↓
 * PropertyFormDatabase
 *   ↓
 * PropertyDatabase
 *   ↓
 * PropertyRepository
 *   ↓
 * Property.formIds
 *
 * Property.formIds es solamente una proyección de dominio.
 *
 * La fuente persistente de verdad es:
 *
 * property_forms
 *
 * ============================================================================
 * TRANSACCIONES
 * ============================================================================
 *
 * Este módulo ofrece dos formas de reemplazar relaciones:
 *
 * 1. replacePropertyFormAssignments()
 *
 *    Abre su propia transacción.
 *
 *    Se utiliza cuando PropertyFormDatabase realiza la operación
 *    independientemente.
 *
 * 2. replacePropertyFormAssignmentsInsideTransaction()
 *
 *    NO abre una nueva transacción.
 *
 *    Se utiliza cuando otro módulo, por ejemplo PropertyDatabase,
 *    ya se encuentra dentro de:
 *
 *    database.withTransactionAsync(...)
 *
 * Esto permite guardar:
 *
 * properties
 *      +
 * property_forms
 *
 * dentro de una única operación atómica.
 */

/*
 * ============================================================================
 * TIPOS
 * ============================================================================
 */

export type PropertyFormStatus = "active" | "inactive";

export type PropertyFormAssignment = {
  propertyId: string;

  formId: string;

  status: PropertyFormStatus;

  assignedAt: string;
};

/*
 * Representación directa de SQLite.
 */
type PropertyFormRow = {
  property_id: string;

  form_id: string;

  status: PropertyFormStatus;

  assigned_at: string;
};

/*
 * ============================================================================
 * CONTAR RELACIONES
 * ============================================================================
 */

export async function countPropertyFormAssignments(): Promise<number> {
  const database = await getDatabase();

  const row = await database.getFirstAsync<{
    count: number;
  }>(`
    SELECT COUNT(*) AS count
    FROM property_forms;
  `);

  return row?.count ?? 0;
}

/*
 * ============================================================================
 * OBTENER TODAS LAS RELACIONES
 * ============================================================================
 *
 * Útil para:
 *
 * - reconstruir Property.formIds;
 * - diagnóstico;
 * - pruebas;
 * - migraciones;
 * - herramientas administrativas.
 */

export async function selectAllPropertyFormAssignments(): Promise<
  PropertyFormAssignment[]
> {
  const database = await getDatabase();

  const rows = await database.getAllAsync<PropertyFormRow>(`
    SELECT
      property_id,
      form_id,
      status,
      assigned_at
    FROM property_forms
    ORDER BY property_id ASC, assigned_at ASC, form_id ASC;
  `);

  return rows.map(mapPropertyFormRow);
}

/*
 * ============================================================================
 * OBTENER FORMULARIOS ACTIVOS DE UN INMUEBLE
 * ============================================================================
 *
 * Ejemplo:
 *
 * property-001
 *
 * devuelve:
 *
 * [
 *   "form-001",
 *   "form-002",
 *   "form-003"
 * ]
 *
 * Esta consulta reconstruye Property.formIds a partir
 * de property_forms.
 */

export async function selectFormIdsByPropertyId(
  propertyId: string,
): Promise<string[]> {
  const database = await getDatabase();

  const rows = await database.getAllAsync<{
    form_id: string;
  }>(
    `
      SELECT form_id
      FROM property_forms
      WHERE property_id = ?
        AND status = 'active'
      ORDER BY assigned_at ASC, form_id ASC;
    `,
    propertyId,
  );

  return rows.map((row) => row.form_id);
}

/*
 * ============================================================================
 * OBTENER INMUEBLES ASIGNADOS A UN FORMULARIO
 * ============================================================================
 */

export async function selectPropertyIdsByFormId(
  formId: string,
): Promise<string[]> {
  const database = await getDatabase();

  const rows = await database.getAllAsync<{
    property_id: string;
  }>(
    `
      SELECT property_id
      FROM property_forms
      WHERE form_id = ?
        AND status = 'active'
      ORDER BY property_id ASC;
    `,
    formId,
  );

  return rows.map((row) => row.property_id);
}

/*
 * ============================================================================
 * OBTENER RELACIONES COMPLETAS DE UN INMUEBLE
 * ============================================================================
 *
 * Devuelve:
 *
 * - propertyId;
 * - formId;
 * - status;
 * - assignedAt.
 */

export async function selectPropertyFormAssignmentsByPropertyId(
  propertyId: string,
): Promise<PropertyFormAssignment[]> {
  const database = await getDatabase();

  const rows = await database.getAllAsync<PropertyFormRow>(
    `
      SELECT
        property_id,
        form_id,
        status,
        assigned_at
      FROM property_forms
      WHERE property_id = ?
      ORDER BY assigned_at ASC, form_id ASC;
    `,
    propertyId,
  );

  return rows.map(mapPropertyFormRow);
}

/*
 * ============================================================================
 * COMPROBAR ASIGNACIÓN
 * ============================================================================
 *
 * Devuelve true únicamente cuando existe una relación activa.
 */

export async function hasPropertyFormAssignment(
  propertyId: string,
  formId: string,
): Promise<boolean> {
  const database = await getDatabase();

  const row = await database.getFirstAsync<{
    count: number;
  }>(
    `
      SELECT COUNT(*) AS count
      FROM property_forms
      WHERE property_id = ?
        AND form_id = ?
        AND status = 'active';
    `,
    propertyId,
    formId,
  );

  return (row?.count ?? 0) > 0;
}

/*
 * ============================================================================
 * ASIGNAR FORMULARIO A INMUEBLE
 * ============================================================================
 *
 * Si la relación no existe:
 *
 * INSERT
 *
 * Si existe pero está inactiva:
 *
 * UPDATE → active
 */

export async function assignFormToProperty(
  propertyId: string,
  formId: string,
  assignedAt = new Date().toISOString(),
): Promise<void> {
  const database = await getDatabase();

  await database.runAsync(
    `
      INSERT INTO property_forms (
        property_id,
        form_id,
        status,
        assigned_at
      )
      VALUES (?, ?, 'active', ?)

      ON CONFLICT(property_id, form_id)
      DO UPDATE SET
        status = 'active',
        assigned_at = excluded.assigned_at;
    `,
    propertyId,
    formId,
    assignedAt,
  );
}

/*
 * ============================================================================
 * DESACTIVAR FORMULARIO DE INMUEBLE
 * ============================================================================
 */

export async function deactivateFormFromProperty(
  propertyId: string,
  formId: string,
): Promise<boolean> {
  const database = await getDatabase();

  const result = await database.runAsync(
    `
      UPDATE property_forms
      SET status = 'inactive'
      WHERE property_id = ?
        AND form_id = ?;
    `,
    propertyId,
    formId,
  );

  return result.changes > 0;
}

/*
 * ============================================================================
 * ELIMINAR UNA RELACIÓN
 * ============================================================================
 */

export async function deletePropertyFormAssignment(
  propertyId: string,
  formId: string,
): Promise<boolean> {
  const database = await getDatabase();

  const result = await database.runAsync(
    `
      DELETE FROM property_forms
      WHERE property_id = ?
        AND form_id = ?;
    `,
    propertyId,
    formId,
  );

  return result.changes > 0;
}

/*
 * ============================================================================
 * REEMPLAZAR FORMULARIOS
 * ============================================================================
 *
 * Esta versión abre su PROPIA transacción.
 *
 * Debe utilizarse cuando la operación se ejecuta directamente
 * desde PropertyFormDatabase.
 */

export async function replacePropertyFormAssignments(
  propertyId: string,
  formIds: string[],
): Promise<void> {
  const database = await getDatabase();

  const normalizedFormIds = normalizeFormIds(formIds);

  await database.withTransactionAsync(async () => {
    await replacePropertyFormAssignmentsInsideTransaction(
      propertyId,
      normalizedFormIds,
    );
  });
}

/*
 * ============================================================================
 * REEMPLAZAR FORMULARIOS DENTRO DE UNA TRANSACCIÓN EXISTENTE
 * ============================================================================
 *
 * IMPORTANTE:
 *
 * Esta función NO abre:
 *
 * database.withTransactionAsync(...)
 *
 * Está diseñada específicamente para ser utilizada por módulos
 * que ya se encuentran dentro de una transacción.
 *
 * Ejemplo:
 *
 * PropertyDatabase:
 *
 * database.withTransactionAsync(async () => {
 *
 *   INSERT / UPDATE properties
 *
 *   await replacePropertyFormAssignmentsInsideTransaction(...)
 *
 * })
 *
 * De esta manera:
 *
 * properties
 *      +
 * property_forms
 *
 * se confirman o revierten conjuntamente.
 */

export async function replacePropertyFormAssignmentsInsideTransaction(
  propertyId: string,
  formIds: string[],
): Promise<void> {
  const database = await getDatabase();

  const normalizedFormIds = normalizeFormIds(formIds);

  /*
   * Eliminamos la configuración anterior.
   */
  await database.runAsync(
    `
      DELETE FROM property_forms
      WHERE property_id = ?;
    `,
    propertyId,
  );

  /*
   * Utilizamos una sola fecha para todo el conjunto.
   *
   * Así todas las relaciones creadas durante el mismo reemplazo
   * quedan temporalmente agrupadas.
   */
  const assignedAt = new Date().toISOString();

  /*
   * Insertamos la configuración nueva.
   */
  for (const formId of normalizedFormIds) {
    await database.runAsync(
      `
        INSERT INTO property_forms (
          property_id,
          form_id,
          status,
          assigned_at
        )
        VALUES (?, ?, 'active', ?);
      `,
      propertyId,
      formId,
      assignedAt,
    );
  }
}

/*
 * ============================================================================
 * ELIMINAR TODAS LAS RELACIONES DE UN INMUEBLE
 * ============================================================================
 *
 * Normalmente:
 *
 * ON DELETE CASCADE
 *
 * se encargará de esto al eliminar properties.
 *
 * Conservamos esta función para:
 *
 * - mantenimiento;
 * - pruebas;
 * - migraciones;
 * - operaciones administrativas.
 */

export async function deletePropertyFormAssignmentsByPropertyId(
  propertyId: string,
): Promise<number> {
  const database = await getDatabase();

  const result = await database.runAsync(
    `
      DELETE FROM property_forms
      WHERE property_id = ?;
    `,
    propertyId,
  );

  return result.changes;
}

/*
 * ============================================================================
 * SQLITE → TYPESCRIPT
 * ============================================================================
 */

function mapPropertyFormRow(row: PropertyFormRow): PropertyFormAssignment {
  return {
    propertyId: row.property_id,

    formId: row.form_id,

    status: row.status,

    assignedAt: row.assigned_at,
  };
}

/*
 * ============================================================================
 * NORMALIZAR FORM IDS
 * ============================================================================
 *
 * Centralizamos aquí la normalización utilizada por:
 *
 * - replacePropertyFormAssignments();
 * - replacePropertyFormAssignmentsInsideTransaction().
 *
 * Evitamos:
 *
 * - IDs duplicados;
 * - strings vacíos;
 * - espacios accidentales.
 */

function normalizeFormIds(formIds: string[]): string[] {
  return [
    ...new Set(
      formIds
        .map((formId) => formId.trim())
        .filter((formId) => formId.length > 0),
    ),
  ];
}
