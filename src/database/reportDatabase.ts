import { getDatabase } from "@/database/database";

import type { Report } from "@/types/report";

/*
 * ============================================================================
 * REPORT DATABASE
 * ============================================================================
 *
 * Conecta ReportRepository con SQLite.
 *
 * Este archivo solamente administra el REGISTRO del reporte.
 *
 * El archivo Excel/PDF real será generado posteriormente
 * por una capa independiente.
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
 * LEER REPORTES
 * ============================================================================
 */
export async function selectAllReports(): Promise<Report[]> {
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

  return rows.map(mapReportRow);
}

/*
 * ============================================================================
 * INSERTAR REPORTE
 * ============================================================================
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

    report.includeEvidence ? 1 : 0,

    report.createdAt,

    report.fileUri ?? null,
  );
}

/*
 * ============================================================================
 * REEMPLAZAR REPORTE
 * ============================================================================
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

    includeEvidence: row.include_evidence === 1,

    createdAt: row.created_at,

    ...(row.file_uri
      ? {
          fileUri: row.file_uri,
        }
      : {}),
  };
}
