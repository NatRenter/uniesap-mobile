import { getDatabase } from "@/database/database";

import { countPropertyFormAssignments } from "@/database/propertyFormDatabase";

import { getPropertyFormIntegrityDiagnostic } from "@/database/propertyDiagnosticDatabase";

/*
 * ============================================================================
 * PROPERTY MIGRATION DATABASE
 * ============================================================================
 *
 * Centraliza exclusivamente migraciones históricas relacionadas
 * con:
 *
 * Property
 *    ↕
 * Form
 *
 * ============================================================================
 * CONTEXTO HISTÓRICO
 * ============================================================================
 *
 * La arquitectura antigua almacenaba formularios mediante:
 *
 * properties.form_ids_json
 *
 * La arquitectura moderna utiliza:
 *
 * properties
 *      ↓
 * property_forms
 *      ↓
 * forms
 *
 * Para mantener compatibilidad con instalaciones antiguas
 * existen dos migraciones:
 *
 * 1. property_forms_from_legacy_json_v1
 *
 *    Copia:
 *
 *    properties.form_ids_json
 *             ↓
 *       property_forms
 *
 * 2. properties_remove_form_ids_json_v1
 *
 *    Después de comprobar la integridad:
 *
 *    elimina físicamente:
 *
 *    properties.form_ids_json
 *
 * ============================================================================
 * IMPORTANTE
 * ============================================================================
 *
 * Este archivo puede contener SQL legacy deliberadamente.
 *
 * Eso NO significa que el runtime moderno dependa de esa estructura.
 *
 * Su única función es permitir actualizar bases antiguas de manera segura.
 */

const PROPERTY_FORM_LEGACY_MIGRATION_ID = "property_forms_from_legacy_json_v1";

const REMOVE_PROPERTY_FORM_IDS_JSON_MIGRATION_ID =
  "properties_remove_form_ids_json_v1";

/*
 * ============================================================================
 * SQLITE TABLE INFO
 * ============================================================================
 */

type SQLiteTableColumn = {
  cid: number;

  name: string;

  type: string;

  notnull: number;

  dflt_value: string | null;

  pk: number;
};

/*
 * ============================================================================
 * RESULTADO DE ELIMINACIÓN DE COLUMNA LEGACY
 * ============================================================================
 */

export type RemoveLegacyPropertyFormColumnResult = {
  applied: boolean;

  columnExisted: boolean;

  propertyCount: number;

  relationshipCount: number;

  orphanPropertyRelations: number;

  orphanFormRelations: number;
};

/*
 * ============================================================================
 * MIGRACIÓN 1
 * ============================================================================
 *
 * properties.form_ids_json
 *          ↓
 * property_forms
 */

export async function migrateLegacyPropertyFormsIfNeeded(): Promise<{
  applied: boolean;

  inserted: number;

  total: number;
}> {
  const database = await getDatabase();

  /*
   * ==========================================================================
   * COMPROBAR HISTORIAL
   * ==========================================================================
   */
  const existingMigration = await database.getFirstAsync<{
    id: string;
  }>(
    `
        SELECT id
        FROM migration_history
        WHERE id = ?;
      `,
    PROPERTY_FORM_LEGACY_MIGRATION_ID,
  );

  /*
   * Ya fue ejecutada anteriormente.
   */
  if (existingMigration) {
    const total = await countPropertyFormAssignments();

    console.log("Migración legacy Property ↔ Form ya aplicada:", {
      migrationId: PROPERTY_FORM_LEGACY_MIGRATION_ID,

      total,
    });

    return {
      applied: false,

      inserted: 0,

      total,
    };
  }

  /*
   * ==========================================================================
   * COMPROBAR COLUMNA LEGACY
   * ==========================================================================
   *
   * Las instalaciones modernas nacen directamente
   * sin form_ids_json.
   */
  const hasLegacyColumn = await propertyColumnExists("form_ids_json");

  /*
   * Si la columna nunca existió, simplemente registramos
   * la migración como completada.
   */
  if (!hasLegacyColumn) {
    await recordMigration(PROPERTY_FORM_LEGACY_MIGRATION_ID);

    const total = await countPropertyFormAssignments();

    console.log(
      "Migración legacy Property ↔ Form omitida porque form_ids_json no existe:",
      {
        migrationId: PROPERTY_FORM_LEGACY_MIGRATION_ID,

        total,
      },
    );

    return {
      applied: true,

      inserted: 0,

      total,
    };
  }

  /*
   * ==========================================================================
   * PRIMERA EJECUCIÓN
   * ==========================================================================
   */
  const before = await countPropertyFormAssignments();

  /*
   * Toda la migración es atómica:
   *
   * 1. copiar relaciones;
   * 2. registrar migration_history.
   */
  await database.withTransactionAsync(async () => {
    /*
     * Este SQL existe únicamente por compatibilidad
     * con versiones antiguas de UNIESAP.
     */
    await database.execAsync(`
        INSERT OR IGNORE INTO property_forms (
          property_id,
          form_id,
          status,
          assigned_at
        )
        SELECT
          properties.id,
          CAST(json_each.value AS TEXT),
          'active',
          COALESCE(
            NULLIF(properties.updated_at, ''),
            NULLIF(properties.created_at, ''),
            CURRENT_TIMESTAMP
          )
        FROM properties
        JOIN json_each(properties.form_ids_json)
        JOIN forms
          ON forms.id = CAST(json_each.value AS TEXT)
        WHERE properties.form_ids_json IS NOT NULL
          AND json_valid(properties.form_ids_json) = 1
          AND json_type(properties.form_ids_json) = 'array';
      `);

    /*
     * Registrar migración.
     */
    await database.runAsync(
      `
          INSERT INTO migration_history (
            id,
            applied_at
          )
          VALUES (?, ?);
        `,
      PROPERTY_FORM_LEGACY_MIGRATION_ID,
      new Date().toISOString(),
    );
  });

  const total = await countPropertyFormAssignments();

  const inserted = Math.max(0, total - before);

  console.log("Migración legacy Property ↔ Form aplicada:", {
    before,

    total,

    inserted,
  });

  return {
    applied: true,

    inserted,

    total,
  };
}

/*
 * ============================================================================
 * MIGRACIÓN 2
 * ============================================================================
 *
 * Elimina:
 *
 * properties.form_ids_json
 *
 * solamente después de confirmar que:
 *
 * - la migración anterior terminó;
 * - no existen relaciones huérfanas.
 */

export async function removeLegacyPropertyFormColumnIfNeeded(): Promise<RemoveLegacyPropertyFormColumnResult> {
  const database = await getDatabase();

  /*
   * ==========================================================================
   * ¿YA SE EJECUTÓ?
   * ==========================================================================
   */
  const existingMigration = await database.getFirstAsync<{
    id: string;
  }>(
    `
        SELECT id
        FROM migration_history
        WHERE id = ?;
      `,
    REMOVE_PROPERTY_FORM_IDS_JSON_MIGRATION_ID,
  );

  if (existingMigration) {
    const diagnostic = await getPropertyFormIntegrityDiagnostic();

    const columnExists = await propertyColumnExists("form_ids_json");

    console.log("Migración de eliminación de form_ids_json ya aplicada:", {
      migrationId: REMOVE_PROPERTY_FORM_IDS_JSON_MIGRATION_ID,

      columnExists,

      ...diagnostic,
    });

    return {
      applied: false,

      columnExisted: columnExists,

      ...diagnostic,
    };
  }

  /*
   * ==========================================================================
   * COMPROBAR MIGRACIÓN ANTERIOR
   * ==========================================================================
   */
  const legacyMigration = await database.getFirstAsync<{
    id: string;
  }>(
    `
        SELECT id
        FROM migration_history
        WHERE id = ?;
      `,
    PROPERTY_FORM_LEGACY_MIGRATION_ID,
  );

  if (!legacyMigration) {
    throw new Error(
      "No se puede eliminar properties.form_ids_json porque la migración Property ↔ Form todavía no ha sido aplicada.",
    );
  }

  /*
   * ==========================================================================
   * COMPROBAR EXISTENCIA DE COLUMNA
   * ==========================================================================
   */
  const columnExists = await propertyColumnExists("form_ids_json");

  /*
   * Instalación moderna.
   *
   * La columna nunca fue creada.
   */
  if (!columnExists) {
    await recordMigration(REMOVE_PROPERTY_FORM_IDS_JSON_MIGRATION_ID);

    const diagnostic = await getPropertyFormIntegrityDiagnostic();

    console.log(
      "form_ids_json ya no existe. Migración registrada sin DROP COLUMN:",
      {
        migrationId: REMOVE_PROPERTY_FORM_IDS_JSON_MIGRATION_ID,

        ...diagnostic,
      },
    );

    return {
      applied: true,

      columnExisted: false,

      ...diagnostic,
    };
  }

  /*
   * ==========================================================================
   * DIAGNÓSTICO PREVIO
   * ==========================================================================
   */
  const before = await getPropertyFormIntegrityDiagnostic();

  if (before.orphanPropertyRelations > 0 || before.orphanFormRelations > 0) {
    throw new Error(
      [
        "No se puede eliminar properties.form_ids_json.",
        "",
        "La integridad de property_forms no es válida.",
        "",
        `Relaciones sin inmueble: ${before.orphanPropertyRelations}.`,
        `Relaciones sin formulario: ${before.orphanFormRelations}.`,
      ].join("\n"),
    );
  }

  /*
   * ==========================================================================
   * ELIMINAR COLUMNA
   * ==========================================================================
   */
  await database.withTransactionAsync(async () => {
    await database.execAsync(`
        ALTER TABLE properties
        DROP COLUMN form_ids_json;
      `);

    /*
     * Comprobación inmediata.
     */
    const columns = await getPropertyColumns();

    const stillExists = columns.some(
      (column) => column.name === "form_ids_json",
    );

    if (stillExists) {
      throw new Error(
        "SQLite ejecutó la migración, pero form_ids_json todavía aparece dentro de properties.",
      );
    }

    /*
     * Registrar migración solamente después de que
     * el DROP COLUMN haya sido confirmado.
     */
    await database.runAsync(
      `
          INSERT INTO migration_history (
            id,
            applied_at
          )
          VALUES (?, ?);
        `,
      REMOVE_PROPERTY_FORM_IDS_JSON_MIGRATION_ID,
      new Date().toISOString(),
    );
  });

  /*
   * ==========================================================================
   * DIAGNÓSTICO POSTERIOR
   * ==========================================================================
   */
  const after = await getPropertyFormIntegrityDiagnostic();

  const stillExistsAfterMigration = await propertyColumnExists("form_ids_json");

  if (stillExistsAfterMigration) {
    throw new Error(
      "La migración fue registrada, pero form_ids_json continúa existiendo.",
    );
  }

  console.log("Migración form_ids_json completada correctamente:", {
    migrationId: REMOVE_PROPERTY_FORM_IDS_JSON_MIGRATION_ID,

    before,

    after,

    columnExistsAfter: stillExistsAfterMigration,
  });

  return {
    applied: true,

    columnExisted: true,

    ...after,
  };
}

/*
 * ============================================================================
 * OBTENER COLUMNAS DE PROPERTIES
 * ============================================================================
 */

async function getPropertyColumns(): Promise<SQLiteTableColumn[]> {
  const database = await getDatabase();

  return database.getAllAsync<SQLiteTableColumn>(`
    PRAGMA table_info(properties);
  `);
}

/*
 * ============================================================================
 * COMPROBAR EXISTENCIA DE COLUMNA
 * ============================================================================
 */

async function propertyColumnExists(columnName: string): Promise<boolean> {
  const columns = await getPropertyColumns();

  return columns.some((column) => column.name === columnName);
}

/*
 * ============================================================================
 * REGISTRAR MIGRACIÓN
 * ============================================================================
 */

async function recordMigration(migrationId: string): Promise<void> {
  const database = await getDatabase();

  await database.runAsync(
    `
      INSERT OR IGNORE INTO migration_history (
        id,
        applied_at
      )
      VALUES (?, ?);
    `,
    migrationId,
    new Date().toISOString(),
  );
}
