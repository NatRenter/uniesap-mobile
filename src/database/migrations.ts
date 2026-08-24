import { getDatabase } from "@/database/database";

export async function runDatabaseMigrations() {
  const database = await getDatabase();

  await database.execAsync(`
    PRAGMA foreign_keys = ON;
  `);

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
      kobo_asset_uid TEXT,
      kobo_submission_id TEXT,
      kobo_uuid TEXT,
      kobo_synced_at TEXT,
      last_sync_error TEXT
    );
  `);

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
      FOREIGN KEY (inspection_id)
      REFERENCES inspections(id)
      ON DELETE CASCADE
    );
  `);

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
      idx_inspection_responses_inspection_id
    ON inspection_responses(inspection_id);
  `);

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
}
