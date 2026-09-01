import { getDatabase } from "@/database/database";

import type { Report } from "@/types/report";

/*
 * ============================================================================
 * REPORT DATABASE
 * ============================================================================
 *
 * Conecta ReportRepository con SQLite.
 *
 * Este archivo administra únicamente el REGISTRO del reporte.
 *
 * El archivo físico:
 *
 * - Excel
 * - PDF
 *
 * será generado posteriormente por una capa independiente.
 *
 * ============================================================================
 * IMPORTANTE SOBRE loadAll()
 * ============================================================================
 *
 * ReportRepository diferencia entre:
 *
 * null
 *   → todavía no existen reportes persistidos;
 *   → se debe utilizar ReportSeed.
 *
 * []
 *   → la persistencia ya existe, pero actualmente no contiene reportes.
 *
 * Esta diferencia es importante porque permite que, si en el futuro
 * el usuario elimina todos sus reportes, estos NO vuelvan a aparecer
 * automáticamente desde el seed.
 */

/*
 * ============================================================================
 * FILA SQLITE
 * ============================================================================
 *
 * Representación de un Report dentro de SQLite.
 *
 * SQLite utiliza snake_case mientras que nuestra aplicación utiliza
 * camelCase.
 */
type ReportRow = {
  id: string;

  company_id: string;

  property_id: string;

  inspection_id: string;

  title: string;

  format: Report["format"];

  status: Report["status"];

  include_evidence: number;

  created_at: string;

  file_uri: string | null;
};

/*
 * ============================================================================
 * CONTAR REPORTES
 * ============================================================================
 *
 * Devuelve la cantidad de reportes actualmente almacenados en SQLite.
 *
 * Esta función también nos sirve para diagnóstico y futuras migraciones.
 */
export async function countReports(): Promise<number> {
  const database = await getDatabase();

  const row = await database.getFirstAsync<{
    count: number;
  }>(`
    SELECT COUNT(*) AS count
    FROM reports;
  `);

  return row?.count ?? 0;
}

/*
 * ============================================================================
 * LEER TODOS LOS REPORTES
 * ============================================================================
 *
 * Devuelve:
 *
 * Report[]
 *   cuando existen registros.
 *
 * null
 *   cuando la tabla está completamente vacía.
 *
 * ============================================================================
 * ¿POR QUÉ NO DEVOLVER []?
 * ============================================================================
 *
 * ReportRepository utiliza null como señal para ejecutar el seed inicial.
 *
 * Primer arranque:
 *
 * SQLite vacío
 *      ↓
 * selectAllReports()
 *      ↓
 * null
 *      ↓
 * ReportRepository
 *      ↓
 * initialReports
 *      ↓
 * SQLite
 *
 * Después:
 *
 * SQLite contiene reportes
 *      ↓
 * selectAllReports()
 *      ↓
 * Report[]
 *      ↓
 * ReportRepository
 *
 * NOTA:
 *
 * Más adelante podremos reemplazar esta estrategia por una tabla de
 * metadata/migraciones que permita distinguir con mayor precisión:
 *
 * - base recién creada;
 * - base inicializada pero vacía intencionalmente.
 */
export async function selectAllReports(): Promise<Report[] | null> {
  const database = await getDatabase();

  const rows = await database.getAllAsync<ReportRow>(`
    SELECT
      id,
      company_id,
      property_id,
      inspection_id,
      title,
      format,
      status,
      include_evidence,
      created_at,
      file_uri
    FROM reports
    ORDER BY created_at DESC, id DESC;
  `);

  /*
   * Si no existe ningún reporte persistido,
   * devolvemos null.
   *
   * Esto permite que ReportRepository ejecute
   * initialReports solamente durante la inicialización.
   */
  if (rows.length === 0) {
    return null;
  }

  return rows.map(mapReportRow);
}

/*
 * ============================================================================
 * INSERTAR REPORTE
 * ============================================================================
 *
 * Inserta un nuevo Report en SQLite.
 */
export async function insertReport(report: Report): Promise<void> {
  const database = await getDatabase();

  await database.runAsync(
    `
      INSERT INTO reports (
        id,
        company_id,
        property_id,
        inspection_id,
        title,
        format,
        status,
        include_evidence,
        created_at,
        file_uri
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `,

    report.id,

    report.companyId,

    report.propertyId,

    report.inspectionId,

    report.title,

    report.format,

    report.status,

    /*
     * SQLite no tiene un tipo boolean tradicional.
     *
     * Guardamos:
     *
     * true  → 1
     * false → 0
     */
    report.includeEvidence ? 1 : 0,

    report.createdAt,

    report.fileUri ?? null,
  );
}

/*
 * ============================================================================
 * REEMPLAZAR REPORTE
 * ============================================================================
 *
 * Actualiza un reporte existente.
 *
 * INSERT OR REPLACE mantiene la misma estrategia
 * utilizada por los demás módulos de persistencia.
 */
export async function replaceReport(report: Report): Promise<void> {
  const database = await getDatabase();

  await database.runAsync(
    `
      INSERT OR REPLACE INTO reports (
        id,
        company_id,
        property_id,
        inspection_id,
        title,
        format,
        status,
        include_evidence,
        created_at,
        file_uri
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `,

    report.id,

    report.companyId,

    report.propertyId,

    report.inspectionId,

    report.title,

    report.format,

    report.status,

    report.includeEvidence ? 1 : 0,

    report.createdAt,

    report.fileUri ?? null,
  );
}

/*
 * ============================================================================
 * ELIMINAR REPORTE
 * ============================================================================
 *
 * Elimina un reporte por identificador.
 *
 * Devuelve:
 *
 * true
 *   → se eliminó al menos una fila.
 *
 * false
 *   → no existía ningún reporte con ese ID.
 */
export async function deleteReportFromDatabase(id: string): Promise<boolean> {
  const database = await getDatabase();

  const result = await database.runAsync(
    `
      DELETE FROM reports
      WHERE id = ?;
    `,

    id,
  );

  return result.changes > 0;
}

/*
 * ============================================================================
 * SQLITE → REPORT
 * ============================================================================
 *
 * Convierte una fila proveniente de SQLite
 * al modelo Report utilizado por UNIESAP.
 */
function mapReportRow(row: ReportRow): Report {
  return {
    id: row.id,

    companyId: row.company_id,

    propertyId: row.property_id,

    inspectionId: row.inspection_id,

    title: row.title,

    format: row.format,

    status: row.status,

    /*
     * SQLite:
     *
     * 1 → true
     * 0 → false
     */
    includeEvidence: row.include_evidence === 1,

    createdAt: row.created_at,

    /*
     * fileUri es opcional dentro de Report.
     *
     * Si SQLite contiene NULL simplemente
     * omitimos la propiedad.
     */
    ...(row.file_uri
      ? {
          fileUri: row.file_uri,
        }
      : {}),
  };
}
