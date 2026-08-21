import { getDatabase } from "@/database/database";

/*
 * ============================================================================
 * MIGRACIONES DE BASE DE DATOS
 * ============================================================================
 *
 * Cada vez que iniciemos UNIESAP podremos ejecutar
 * esta función de forma segura.
 *
 * CREATE TABLE IF NOT EXISTS evita destruir
 * información existente.
 */

export async function runDatabaseMigrations() {
  const database = await getDatabase();

  /*
   * Activamos claves foráneas.
   */
  await database.execAsync(`
    PRAGMA foreign_keys = ON;
  `);

  /*
   * --------------------------------------------------------------------------
   * INSPECCIONES
   * --------------------------------------------------------------------------
   *
   * Aquí almacenamos los datos generales y
   * el estado de sincronización.
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

      kobo_asset_uid TEXT,

      kobo_submission_id TEXT,

      kobo_uuid TEXT,

      kobo_synced_at TEXT,

      last_sync_error TEXT
    );
  `);

  /*
   * --------------------------------------------------------------------------
   * RESPUESTAS
   * --------------------------------------------------------------------------
   *
   * Cada respuesta vive en una fila independiente.
   *
   * Esto nos permitirá posteriormente:
   *
   * - consultar respuestas específicas
   * - generar reportes
   * - filtrar información
   * - trabajar con formularios grandes
   */
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS inspection_responses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      inspection_id TEXT NOT NULL,

      question_id TEXT NOT NULL,

      value TEXT,

      value_type TEXT NOT NULL,

      FOREIGN KEY (
        inspection_id
      )
      REFERENCES inspections(id)
      ON DELETE CASCADE
    );
  `);

  /*
   * --------------------------------------------------------------------------
   * EVIDENCIAS
   * --------------------------------------------------------------------------
   *
   * Por ahora únicamente relacionamos IDs.
   *
   * Más adelante podremos ampliar esta tabla
   * con:
   *
   * local_uri
   * remote_uri
   * mime_type
   * tamaño
   * hash
   * estado de carga
   */
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS inspection_evidences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      inspection_id TEXT NOT NULL,

      evidence_id TEXT NOT NULL,

      FOREIGN KEY (
        inspection_id
      )
      REFERENCES inspections(id)
      ON DELETE CASCADE
    );
  `);

  /*
   * --------------------------------------------------------------------------
   * ÍNDICES
   * --------------------------------------------------------------------------
   *
   * Estos índices acelerarán las consultas más comunes:
   *
   * inmueble → inspecciones
   * empresa  → inspecciones
   * inspección → respuestas
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
      idx_inspection_responses_inspection_id
    ON inspection_responses(inspection_id);
  `);

  await database.execAsync(`
    CREATE INDEX IF NOT EXISTS
      idx_inspection_evidences_inspection_id
    ON inspection_evidences(inspection_id);
  `);
}
