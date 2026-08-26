import { getDatabase } from "@/database/database";

type TableInfoRow = {
  name: string;
};

export async function runDatabaseMigrations() {
  const database = await getDatabase();

  await database.execAsync(`
    PRAGMA foreign_keys = ON;
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

  await addColumnIfMissing("inspections", "sync_operation_id", "TEXT");

  await addColumnIfMissing(
    "inspections",
    "sync_attempt",
    "INTEGER NOT NULL DEFAULT 0",
  );

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

  /*
   * Bases actuales ya tienen evidences.
   *
   * Agregamos los campos nuevos sin borrar fotografías existentes.
   */
  await addColumnIfMissing("evidences", "kobo_upload_operation_id", "TEXT");

  await addColumnIfMissing("evidences", "kobo_attachment_id", "TEXT");

  await addColumnIfMissing("evidences", "kobo_asset_uid", "TEXT");

  await addColumnIfMissing("evidences", "kobo_submission_id", "TEXT");

  await addColumnIfMissing("evidences", "kobo_uploaded_at", "TEXT");

  await addColumnIfMissing("evidences", "last_upload_error", "TEXT");

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
   *
   * Cada evidencia aceptada tiene su propia clave idempotente.
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
   * ÍNDICES
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
    CREATE UNIQUE INDEX IF NOT EXISTS
      idx_inspections_sync_operation_id
    ON inspections(sync_operation_id)
    WHERE sync_operation_id IS NOT NULL;
  `);

  await database.execAsync(`
    CREATE INDEX IF NOT EXISTS
      idx_inspection_responses_inspection_id
    ON inspection_responses(inspection_id);
  `);

  await database.execAsync(`
    CREATE INDEX IF NOT EXISTS
      idx_evidences_inspection_id
    ON evidences(inspection_id);
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
 * Agrega una columna solamente cuando todavía no existe.
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
