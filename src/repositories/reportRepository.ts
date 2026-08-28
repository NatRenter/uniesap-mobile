import { initialReports } from "@/database/reportSeed";

import type { Report, ReportFormat, ReportStatus } from "@/types/report";

/*
 * ============================================================================
 * REPORT REPOSITORY
 * ============================================================================
 *
 * Fuente central de reportes dentro de UNIESAP.
 *
 * Persistencia:
 *
 * Android / iOS → SQLite
 * Web           → localStorage
 *
 * Las pantallas NO deben modificar directamente el arreglo interno.
 */

export type ReportPersistenceAdapter = {
  loadAll: () => Promise<Report[] | null>;

  insert: (report: Report) => Promise<void>;

  replace: (report: Report) => Promise<void>;

  delete: (id: string) => Promise<boolean>;
};

/*
 * ============================================================================
 * CREAR REPORTE
 * ============================================================================
 *
 * Representa únicamente el registro del reporte.
 *
 * Todavía NO significa que exista físicamente:
 *
 * - un Excel;
 * - un PDF.
 *
 * Cuando integremos el generador real:
 *
 * createReport()
 *      ↓
 * status = pending
 *      ↓
 * generador de archivo
 *      ↓
 * updateReport()
 *      ↓
 * status = generated
 * fileUri = ...
 */
export type CreateReportInput = {
  companyId: string;

  propertyId: string;

  inspectionId: string;

  title: string;

  format: ReportFormat;

  includeEvidence: boolean;

  status?: ReportStatus;

  fileUri?: string;
};

let persistenceAdapter: ReportPersistenceAdapter | null = null;

let hydrationPromise: Promise<void> | null = null;

let hydrated = false;

/*
 * ============================================================================
 * ESTADO EN MEMORIA
 * ============================================================================
 */
export const reportRepositoryItems: Report[] = initialReports.map(cloneReport);

/*
 * ============================================================================
 * CONFIGURAR PERSISTENCIA
 * ============================================================================
 */
export function configureReportRepositoryPersistence(
  adapter: ReportPersistenceAdapter,
): void {
  persistenceAdapter = adapter;
}

/*
 * ============================================================================
 * HIDRATAR
 * ============================================================================
 *
 * Si storage está vacío:
 *
 * seed
 *   ↓
 * persistencia
 *
 * Si ya existen registros:
 *
 * persistencia
 *   ↓
 * memoria
 */
export async function hydrateReportRepository(): Promise<void> {
  if (hydrated) {
    return;
  }

  if (hydrationPromise) {
    return hydrationPromise;
  }

  hydrationPromise = hydrateInternal();

  return hydrationPromise;
}

async function hydrateInternal(): Promise<void> {
  const adapter = requirePersistenceAdapter();

  const persisted = await adapter.loadAll();

  if (persisted === null) {
    for (const report of reportRepositoryItems) {
      await adapter.insert(cloneReport(report));
    }

    hydrated = true;

    console.log(
      `Repositorio de reportes inicializado con ${reportRepositoryItems.length} registro(s).`,
    );

    return;
  }

  reportRepositoryItems.splice(
    0,

    reportRepositoryItems.length,

    ...persisted.map(cloneReport),
  );

  hydrated = true;

  console.log(
    `Repositorio de reportes hidratado con ${reportRepositoryItems.length} registro(s).`,
  );
}

/*
 * ============================================================================
 * CONSULTAS
 * ============================================================================
 */

export function getReports(): Report[] {
  return reportRepositoryItems.map(cloneReport);
}

export function getReportById(id: string): Report | undefined {
  const report = reportRepositoryItems.find((item) => item.id === id);

  return report ? cloneReport(report) : undefined;
}

export function getReportsByCompanyId(companyId: string): Report[] {
  return reportRepositoryItems
    .filter((report) => report.companyId === companyId)
    .map(cloneReport);
}

export function getReportsByPropertyId(propertyId: string): Report[] {
  return reportRepositoryItems
    .filter((report) => report.propertyId === propertyId)
    .map(cloneReport);
}

export function getReportsByInspectionId(inspectionId: string): Report[] {
  return reportRepositoryItems
    .filter((report) => report.inspectionId === inspectionId)
    .map(cloneReport);
}

/*
 * ============================================================================
 * CREAR REPORTE
 * ============================================================================
 */
export async function createReport(input: CreateReportInput): Promise<Report> {
  const adapter = requirePersistenceAdapter();

  const report: Report = {
    id: createReportId(),

    companyId: input.companyId,

    propertyId: input.propertyId,

    inspectionId: input.inspectionId,

    title: input.title.trim(),

    format: input.format,

    /*
     * Hasta que exista un generador físico,
     * un reporte nuevo comienza como pending.
     */
    status: input.status ?? "pending",

    includeEvidence: input.includeEvidence,

    createdAt: new Date().toISOString(),

    ...(input.fileUri
      ? {
          fileUri: input.fileUri,
        }
      : {}),
  };

  /*
   * Actualizamos memoria primero.
   */
  reportRepositoryItems.unshift(report);

  try {
    await adapter.insert(report);

    return cloneReport(report);
  } catch (error) {
    removeReportFromMemory(report.id);

    throw error;
  }
}

/*
 * ============================================================================
 * ACTUALIZAR REPORTE
 * ============================================================================
 *
 * Permitirá posteriormente pasar:
 *
 * pending
 *    ↓
 * generated
 *
 * además de almacenar fileUri.
 */
export async function updateReport(
  id: string,

  changes: Partial<Report>,
): Promise<Report | undefined> {
  const adapter = requirePersistenceAdapter();

  const index = reportRepositoryItems.findIndex((report) => report.id === id);

  if (index === -1) {
    return undefined;
  }

  const previous = cloneReport(reportRepositoryItems[index]);

  const updated: Report = {
    ...previous,

    ...changes,

    /*
     * El identificador nunca cambia.
     */
    id: previous.id,

    /*
     * Tampoco cambiamos la fecha original
     * de creación.
     */
    createdAt: previous.createdAt,
  };

  reportRepositoryItems[index] = updated;

  try {
    await adapter.replace(updated);

    return cloneReport(updated);
  } catch (error) {
    reportRepositoryItems[index] = previous;

    throw error;
  }
}

/*
 * ============================================================================
 * ELIMINAR REPORTE
 * ============================================================================
 *
 * Todavía no conectaremos esta función a la interfaz.
 */
export async function deleteReport(id: string): Promise<boolean> {
  const adapter = requirePersistenceAdapter();

  const index = reportRepositoryItems.findIndex((report) => report.id === id);

  if (index === -1) {
    return false;
  }

  const previous = cloneReport(reportRepositoryItems[index]);

  reportRepositoryItems.splice(index, 1);

  try {
    const deleted = await adapter.delete(id);

    if (!deleted) {
      throw new Error(
        `No fue posible confirmar la eliminación del reporte ${id}.`,
      );
    }

    return true;
  } catch (error) {
    reportRepositoryItems.splice(index, 0, previous);

    throw error;
  }
}

/*
 * ============================================================================
 * UTILIDADES INTERNAS
 * ============================================================================
 */

function requirePersistenceAdapter(): ReportPersistenceAdapter {
  if (!persistenceAdapter) {
    throw new Error(
      "ReportRepository todavía no tiene un adaptador de persistencia configurado.",
    );
  }

  return persistenceAdapter;
}

/*
 * Genera un identificador local único.
 */
function createReportId(): string {
  return `report-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/*
 * Rollback cuando falla una inserción.
 */
function removeReportFromMemory(id: string): void {
  const index = reportRepositoryItems.findIndex((report) => report.id === id);

  if (index !== -1) {
    reportRepositoryItems.splice(index, 1);
  }
}

/*
 * Report solamente contiene valores simples,
 * por lo que una copia superficial es suficiente.
 */
function cloneReport(report: Report): Report {
  return {
    ...report,
  };
}
