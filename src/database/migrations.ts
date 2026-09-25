import { getDatabase } from "@/database/database";

type TableInfoRow = {
  name: string;
};

/*
 * ============================================================================
 * MIGRACIONES SQLITE
 * ============================================================================
 *
 * Este archivo centraliza la estructura persistente de UNIESAP.
 *
 * IMPORTANTE:
 *
 * Aquí definimos únicamente el ESQUEMA de SQLite:
 *
 * - tablas;
 * - columnas;
 * - índices;
 * - relaciones.
 *
 * Las migraciones de DATOS que necesitan información cargada posteriormente
 * por los repositories utilizan migration_history para ejecutarse
 * una sola vez después de la inicialización correspondiente.
 *
 * ============================================================================
 * PROPERTY ↔ FORM
 * ============================================================================
 *
 * El esquema moderno utiliza:
 *
 * properties
 *      ↓
 * property_forms
 *      ↓
 * forms
 *
 * Ya NO se crea:
 *
 * properties.form_ids_json
 *
 * Las instalaciones antiguas que todavía tengan esa columna
 * son atendidas por:
 *
 * migrateLegacyPropertyFormsIfNeeded()
 *
 * y posteriormente:
 *
 * removeLegacyPropertyFormColumnIfNeeded()
 *
 * dentro de PropertyDatabase.
 */
export async function runDatabaseMigrations() {
  const database = await getDatabase();

  /*
   * ==========================================================================
   * FOREIGN KEYS
   * ==========================================================================
   */
  await database.execAsync(`
    PRAGMA foreign_keys = ON;
  `);

  /*
   * ==========================================================================
   * HISTORIAL DE MIGRACIONES
   * ==========================================================================
   *
   * Registra migraciones de datos o estructura que solamente
   * deben ejecutarse una vez.
   *
   * Ejemplos actuales:
   *
   * property_forms_from_legacy_json_v1
   * properties_remove_form_ids_json_v1
   */
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS migration_history (
      id TEXT PRIMARY KEY NOT NULL,

      applied_at TEXT NOT NULL
    );
  `);

  /*
   * ==========================================================================
   * PERFIL DE USUARIO
   * ==========================================================================
   */
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS user_profile (
      id TEXT PRIMARY KEY NOT NULL,

      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,

      email TEXT NOT NULL,
      phone TEXT,

      profession TEXT,
      position TEXT,

      photo_uri TEXT,

      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  /*
   * ==========================================================================
   * EMPRESAS
   * ==========================================================================
   *
   * La relación Company → Property se obtiene mediante:
   *
   * properties.company_id
   */
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY NOT NULL,

      name TEXT NOT NULL,
      legal_name TEXT NOT NULL,

      rfc TEXT,

      state TEXT NOT NULL,
      city TEXT NOT NULL,

      phone TEXT,
      email TEXT,

      primary_color TEXT NOT NULL,
      secondary_color TEXT,

      logo TEXT,

      status TEXT NOT NULL,

      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,

      /*
       * ================================================================
       * SINCRONIZACIÓN UNIESAP
       * ================================================================
       *
       * deleted_at funciona como tombstone para soft delete.
       *
       * Los demás campos permiten conocer el estado local respecto
       * a UNIESAP API.
       */
      deleted_at TEXT,

      sync_status TEXT NOT NULL DEFAULT 'pending',

      server_version INTEGER NOT NULL DEFAULT 0,

      sync_operation_id TEXT,

      last_synced_at TEXT,

      last_sync_error TEXT
    );
  `);

  /*
   * ==========================================================================
   * MIGRACIÓN DE SINCRONIZACIÓN DE EMPRESAS
   * ==========================================================================
   *
   * Las instalaciones existentes ya tienen la tabla companies.
   *
   * CREATE TABLE IF NOT EXISTS no agrega columnas nuevas a esas bases,
   * por lo que evolucionamos la tabla columna por columna.
   *
   * Ninguna empresa existente se elimina.
   */
  await addColumnIfMissing("companies", "deleted_at", "TEXT");

  await addColumnIfMissing(
    "companies",
    "sync_status",
    "TEXT NOT NULL DEFAULT 'pending'",
  );

  await addColumnIfMissing(
    "companies",
    "server_version",
    "INTEGER NOT NULL DEFAULT 0",
  );

  await addColumnIfMissing("companies", "sync_operation_id", "TEXT");

  await addColumnIfMissing("companies", "last_synced_at", "TEXT");

  await addColumnIfMissing("companies", "last_sync_error", "TEXT");

  /*
   * ==========================================================================
   * INMUEBLES

  /*
   * ==========================================================================
   * INMUEBLES
   * ==========================================================================
   *
   * ESQUEMA MODERNO
   *
   * Esta tabla ya NO contiene:
   *
   * form_ids_json
   *
   * La relación Property ↔ Form vive exclusivamente en:
   *
   * property_forms
   */
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS properties (
      id TEXT PRIMARY KEY NOT NULL,

      company_id TEXT NOT NULL,

      name TEXT NOT NULL,
      type TEXT NOT NULL,

      state TEXT NOT NULL,
      city TEXT NOT NULL,

      address TEXT,

      workers INTEGER NOT NULL DEFAULT 0,

      status TEXT NOT NULL,

      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,

      FOREIGN KEY (company_id)
        REFERENCES companies(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
    );
  `);

  /*
   * ==========================================================================
   * INSPECCIONES
   * ==========================================================================
   */
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS inspections (
      id TEXT PRIMARY KEY NOT NULL,

      company_id TEXT NOT NULL,
      property_id TEXT NOT NULL,

      form_id TEXT NOT NULL,

      inspector TEXT NOT NULL,

      date TEXT NOT NULL,

      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,

      status TEXT NOT NULL,

      sync_status TEXT NOT NULL,

      sync_operation_id TEXT,

      sync_attempt INTEGER NOT NULL DEFAULT 0,

      kobo_asset_uid TEXT,
      kobo_submission_id TEXT,
      kobo_uuid TEXT,
      kobo_synced_at TEXT,

      last_sync_error TEXT
    );
  `);

  /*
   * Instalaciones anteriores pueden no contener
   * todavía estas columnas.
   */
  await addColumnIfMissing("inspections", "created_at", "TEXT");

  await addColumnIfMissing("inspections", "updated_at", "TEXT");

  await addColumnIfMissing("inspections", "sync_operation_id", "TEXT");

  await addColumnIfMissing(
    "inspections",
    "sync_attempt",
    "INTEGER NOT NULL DEFAULT 0",
  );

  /*
   * ==========================================================================
   * BACKFILL DE FECHAS DE INSPECCIONES ANTIGUAS
   * ==========================================================================
   */
  await database.execAsync(`
    UPDATE inspections
    SET created_at =
      CASE
        WHEN created_at IS NOT NULL
          AND TRIM(created_at) <> ''
          THEN created_at

        WHEN INSTR(date, 'T') > 0
          THEN date

        ELSE date || 'T00:00:00.000Z'
      END;
  `);

  await database.execAsync(`
    UPDATE inspections
    SET updated_at =
      CASE
        WHEN updated_at IS NOT NULL
          AND TRIM(updated_at) <> ''
          THEN updated_at

        WHEN created_at IS NOT NULL
          AND TRIM(created_at) <> ''
          THEN created_at

        WHEN INSTR(date, 'T') > 0
          THEN date

        ELSE date || 'T00:00:00.000Z'
      END;
  `);

  /*
   * ==========================================================================
   * RESPUESTAS
   * ==========================================================================
   */
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS inspection_responses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      inspection_id TEXT NOT NULL,

      question_id TEXT NOT NULL,

      value TEXT,

      value_type TEXT NOT NULL,

      FOREIGN KEY (inspection_id)
        REFERENCES inspections(id)
        ON DELETE CASCADE
    );
  `);

  /*
   * ==========================================================================
   * EVIDENCIAS
   * ==========================================================================
   */
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS evidences (
      id TEXT PRIMARY KEY NOT NULL,

      company_id TEXT NOT NULL,
      property_id TEXT NOT NULL,
      inspection_id TEXT NOT NULL,

      question_id TEXT,

      title TEXT NOT NULL,

      type TEXT NOT NULL,

      status TEXT NOT NULL,

      date TEXT NOT NULL,

      description TEXT,

      local_uri TEXT,
      remote_uri TEXT,

      mime_type TEXT,
      file_name TEXT,
      file_size INTEGER,

      created_at TEXT,

      kobo_upload_operation_id TEXT,
      kobo_attachment_id TEXT,

      kobo_asset_uid TEXT,
      kobo_submission_id TEXT,

      kobo_uploaded_at TEXT,

      last_upload_error TEXT,

      FOREIGN KEY (inspection_id)
        REFERENCES inspections(id)
        ON DELETE CASCADE
    );
  `);

  await addColumnIfMissing("evidences", "kobo_upload_operation_id", "TEXT");

  await addColumnIfMissing("evidences", "kobo_attachment_id", "TEXT");

  await addColumnIfMissing("evidences", "kobo_asset_uid", "TEXT");

  await addColumnIfMissing("evidences", "kobo_submission_id", "TEXT");

  await addColumnIfMissing("evidences", "kobo_uploaded_at", "TEXT");

  await addColumnIfMissing("evidences", "last_upload_error", "TEXT");

  /*
   * ==========================================================================
   * RELACIÓN INSPECCIÓN ↔ EVIDENCIA
   * ==========================================================================
   */
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS inspection_evidences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      inspection_id TEXT NOT NULL,

      evidence_id TEXT NOT NULL,

      FOREIGN KEY (inspection_id)
        REFERENCES inspections(id)
        ON DELETE CASCADE
    );
  `);

  /*
   * ==========================================================================
   * MOCK KOBO - SUBMISSIONS
   * ==========================================================================
   */
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS mock_kobo_submissions (
      operation_key TEXT PRIMARY KEY NOT NULL,

      asset_uid TEXT NOT NULL,

      operation_id TEXT NOT NULL,

      reference_json TEXT NOT NULL,

      package_json TEXT NOT NULL,

      created_at TEXT NOT NULL
    );
  `);

  /*
   * ==========================================================================
   * MOCK KOBO - ATTACHMENTS
   * ==========================================================================
   */
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS mock_kobo_attachments (
      operation_key TEXT PRIMARY KEY NOT NULL,

      asset_uid TEXT NOT NULL,

      submission_id TEXT NOT NULL,

      upload_operation_id TEXT NOT NULL,

      evidence_id TEXT NOT NULL,

      reference_json TEXT NOT NULL,

      attachment_json TEXT NOT NULL,

      created_at TEXT NOT NULL
    );
  `);

  /*
   * ==========================================================================
   * REPORTES
   * ==========================================================================
   */
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY NOT NULL,

      company_id TEXT NOT NULL,

      property_id TEXT NOT NULL,

      inspection_id TEXT NOT NULL,

      title TEXT NOT NULL,

      format TEXT NOT NULL,

      status TEXT NOT NULL,

      include_evidence INTEGER NOT NULL DEFAULT 0,

      created_at TEXT NOT NULL,

      file_uri TEXT,

      FOREIGN KEY (company_id)
        REFERENCES companies(id),

      FOREIGN KEY (property_id)
        REFERENCES properties(id),

      FOREIGN KEY (inspection_id)
        REFERENCES inspections(id)
    );
  `);

  /*
   * ==========================================================================
   * FORMULARIOS
   * ==========================================================================
   */
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS forms (
      id TEXT PRIMARY KEY NOT NULL,

      title TEXT NOT NULL,

      description TEXT NOT NULL,

      version TEXT NOT NULL,

      status TEXT NOT NULL,

      questions_json TEXT NOT NULL DEFAULT '[]',

      integration_json TEXT
    );
  `);

  /*
   * ==========================================================================
   * PROPERTY ↔ FORM
   * ==========================================================================
   *
   * Relación normalizada oficial entre:
   *
   * Property
   *    ↕
   * Form
   *
   * Esta tabla es la única fuente persistente de las asignaciones
   * entre inmuebles y formularios en SQLite.
   */
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS property_forms (
      property_id TEXT NOT NULL,

      form_id TEXT NOT NULL,

      status TEXT NOT NULL DEFAULT 'active',

      assigned_at TEXT NOT NULL,

      PRIMARY KEY (
        property_id,
        form_id
      ),

      FOREIGN KEY (property_id)
        REFERENCES properties(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

      FOREIGN KEY (form_id)
        REFERENCES forms(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
    );
  `);

  /*
   * ==========================================================================
   * ÍNDICES - EMPRESAS
   * ==========================================================================
   */
  await database.execAsync(`
    CREATE INDEX IF NOT EXISTS
      idx_companies_updated_at
    ON companies(updated_at);
  `);

  await database.execAsync(`
    CREATE INDEX IF NOT EXISTS
      idx_companies_status
    ON companies(status);
  `);

  /*
   * ==========================================================================
   * ÍNDICES - INMUEBLES
   * ==========================================================================
   */
  await database.execAsync(`
    CREATE INDEX IF NOT EXISTS
      idx_properties_company_id
    ON properties(company_id);
  `);

  await database.execAsync(`
    CREATE INDEX IF NOT EXISTS
      idx_properties_updated_at
    ON properties(updated_at);
  `);

  await database.execAsync(`
    CREATE INDEX IF NOT EXISTS
      idx_properties_status
    ON properties(status);
  `);

  /*
   * ==========================================================================
   * ÍNDICES - FORMULARIOS
   * ==========================================================================
   */
  await database.execAsync(`
    CREATE INDEX IF NOT EXISTS
      idx_forms_status
    ON forms(status);
  `);

  /*
   * ==========================================================================
   * ÍNDICES - PROPERTY_FORMS
   * ==========================================================================
   */
  await database.execAsync(`
    CREATE INDEX IF NOT EXISTS
      idx_property_forms_property_id
    ON property_forms(property_id);
  `);

  await database.execAsync(`
    CREATE INDEX IF NOT EXISTS
      idx_property_forms_form_id
    ON property_forms(form_id);
  `);

  await database.execAsync(`
    CREATE INDEX IF NOT EXISTS
      idx_property_forms_status
    ON property_forms(status);
  `);

  /*
   * ==========================================================================
   * ÍNDICES - INSPECCIONES
   * ==========================================================================
   */
  await database.execAsync(`
    CREATE INDEX IF NOT EXISTS
      idx_inspections_property_id
    ON inspections(property_id);
  `);

  await database.execAsync(`
    CREATE INDEX IF NOT EXISTS
      idx_inspections_company_id
    ON inspections(company_id);
  `);

  await database.execAsync(`
    CREATE INDEX IF NOT EXISTS
      idx_inspections_updated_at
    ON inspections(updated_at);
  `);

  await database.execAsync(`
    CREATE UNIQUE INDEX IF NOT EXISTS
      idx_inspections_sync_operation_id
    ON inspections(sync_operation_id)
    WHERE sync_operation_id IS NOT NULL;
  `);

  /*
   * ==========================================================================
   * ÍNDICES - RESPUESTAS
   * ==========================================================================
   */
  await database.execAsync(`
    CREATE INDEX IF NOT EXISTS
      idx_inspection_responses_inspection_id
    ON inspection_responses(inspection_id);
  `);

  /*
   * ==========================================================================
   * ÍNDICES - EVIDENCIAS
   * ==========================================================================
   */
  await database.execAsync(`
    CREATE INDEX IF NOT EXISTS
      idx_inspection_evidences_inspection_id
    ON inspection_evidences(inspection_id);
  `);

  await database.execAsync(`
    CREATE INDEX IF NOT EXISTS
      idx_evidences_company_id
    ON evidences(company_id);
  `);

  await database.execAsync(`
    CREATE INDEX IF NOT EXISTS
      idx_evidences_property_id
    ON evidences(property_id);
  `);

  await database.execAsync(`
    CREATE INDEX IF NOT EXISTS
      idx_evidences_inspection_id
    ON evidences(inspection_id);
  `);

  await database.execAsync(`
    CREATE INDEX IF NOT EXISTS
      idx_evidences_question_id
    ON evidences(question_id);
  `);

  await database.execAsync(`
    CREATE INDEX IF NOT EXISTS
      idx_evidences_status
    ON evidences(status);
  `);

  await database.execAsync(`
    CREATE UNIQUE INDEX IF NOT EXISTS
      idx_evidences_kobo_upload_operation
    ON evidences(kobo_upload_operation_id)
    WHERE kobo_upload_operation_id IS NOT NULL;
  `);

  /*
   * ==========================================================================
   * ÍNDICES - REPORTES
   * ==========================================================================
   */
  await database.execAsync(`
    CREATE INDEX IF NOT EXISTS
      idx_reports_company_id
    ON reports(company_id);
  `);

  await database.execAsync(`
    CREATE INDEX IF NOT EXISTS
      idx_reports_property_id
    ON reports(property_id);
  `);

  await database.execAsync(`
    CREATE INDEX IF NOT EXISTS
      idx_reports_inspection_id
    ON reports(inspection_id);
  `);

  await database.execAsync(`
    CREATE INDEX IF NOT EXISTS
      idx_reports_status
    ON reports(status);
  `);

  /*
   * ==========================================================================
   * ÍNDICES - MOCK KOBO
   * ==========================================================================
   */
  await database.execAsync(`
    CREATE UNIQUE INDEX IF NOT EXISTS
      idx_mock_kobo_asset_operation
    ON mock_kobo_submissions(
      asset_uid,
      operation_id
    );
  `);

  await database.execAsync(`
    CREATE UNIQUE INDEX IF NOT EXISTS
      idx_mock_kobo_attachment_operation
    ON mock_kobo_attachments(
      asset_uid,
      submission_id,
      upload_operation_id
    );
  `);

  await database.execAsync(`
    CREATE INDEX IF NOT EXISTS
      idx_mock_kobo_attachment_submission
    ON mock_kobo_attachments(
      asset_uid,
      submission_id
    );
  `);
}

/*
 * ============================================================================
 * AGREGAR COLUMNA SI NO EXISTE
 * ============================================================================
 *
 * Permite evolucionar instalaciones existentes
 * sin borrar información.
 */
async function addColumnIfMissing(
  tableName: string,
  columnName: string,
  definition: string,
): Promise<void> {
  const database = await getDatabase();

  const columns = await database.getAllAsync<TableInfoRow>(
    `PRAGMA table_info(${tableName});`,
  );

  if (columns.some((column) => column.name === columnName)) {
    return;
  }

  await database.execAsync(
    `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition};`,
  );

  console.log(`Migración SQLite aplicada: ${tableName}.${columnName}`);
}
