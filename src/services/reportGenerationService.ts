import { Platform } from "react-native";

import JSZip from "jszip";

import { getCompanyById } from "@/repositories/companyRepository";
import { getEvidencesByInspectionId } from "@/repositories/evidenceRepository";
import { getFormById } from "@/repositories/formRepository";
import { getInspectionById } from "@/repositories/inspectionRepository";
import { getPropertyById } from "@/repositories/propertyRepository";
import { getReportById, updateReport } from "@/repositories/reportRepository";

import { generateExcelReport } from "@/services/excelReportGenerator";
import {
    downloadArtifactOnWeb,
    isWebReportUri,
    localReportFileExists,
    persistReportArtifact,
    presentNativeReportFile,
    readUriAsBytes,
    shareArtifactOnWeb,
} from "@/services/reportFileService";

import type { Evidence } from "@/types/evidence";
import type { Report } from "@/types/report";

/*
 * ============================================================================
 * GENERACIÓN DE REPORTES
 * ============================================================================
 *
 * Esta es la capa orquestadora.
 *
 * ReportRepository
 *        ↓
 * relaciones del reporte
 *        ↓
 * ExcelReportGenerator
 *        ↓
 * XLSX en memoria
 *        ↓
 * opcional: JSZip + evidencias
 *        ↓
 * ReportFileService
 *        ↓
 * archivo físico / descarga web
 *        ↓
 * ReportRepository.updateReport()
 *        ↓
 * generated + fileUri
 */

const ZIP_MIME_TYPE = "application/zip";

export type ReportGenerationOptions = {
  /*
   * En Web indica si la generación debe descargar inmediatamente el archivo.
   * Native siempre guarda el archivo dentro de Documents/reports.
   */
  downloadOnWeb?: boolean;
};

export type ReportGenerationWarning = {
  evidenceId: string;
  message: string;
};

export type ReportGenerationResult = {
  report: Report;
  fileName: string;
  mimeType: string;
  includedEvidenceCount: number;
  requestedEvidenceCount: number;
  warnings: ReportGenerationWarning[];
};

type BuiltReportArtifact = {
  bytes: Uint8Array;
  fileName: string;
  mimeType: string;
  includedEvidenceCount: number;
  requestedEvidenceCount: number;
  warnings: ReportGenerationWarning[];
};

/*
 * Genera o regenera físicamente un Report existente.
 */
export async function generateReportFile(
  reportId: string,
  options: ReportGenerationOptions = {},
): Promise<ReportGenerationResult> {
  const report = requireReport(reportId);
  const artifact = await buildReportArtifact(report);

  const fileUri = await persistReportArtifact({
    reportId: report.id,
    fileName: artifact.fileName,
    mimeType: artifact.mimeType,
    bytes: artifact.bytes,
    downloadOnWeb: options.downloadOnWeb ?? true,
  });

  const updatedReport = await updateReport(report.id, {
    status: "generated",
    fileUri,
  });

  if (!updatedReport) {
    throw new Error(
      `El archivo fue generado, pero no fue posible actualizar el reporte ${report.id}.`,
    );
  }

  return {
    report: updatedReport,
    fileName: artifact.fileName,
    mimeType: artifact.mimeType,
    includedEvidenceCount: artifact.includedEvidenceCount,
    requestedEvidenceCount: artifact.requestedEvidenceCount,
    warnings: artifact.warnings,
  };
}

/*
 * Abre/descarga un reporte ya generado.
 *
 * Web:
 *   el archivo se reconstruye porque un Blob local no puede persistirse de
 *   forma fiable entre recargas usando únicamente localStorage.
 *
 * Native:
 *   se utiliza el fileUri persistido. Si el archivo fue eliminado por fuera de
 *   la aplicación, se regenera automáticamente.
 */
export async function openGeneratedReport(reportId: string): Promise<void> {
  const report = requireReport(reportId);

  if (report.format !== "excel") {
    throw new Error(
      "La apertura de reportes PDF todavía no está implementada.",
    );
  }

  if (Platform.OS === "web") {
    const artifact = await buildReportArtifact(report);

    downloadArtifactOnWeb(artifact.bytes, artifact.fileName, artifact.mimeType);

    return;
  }

  const readyReport = await ensureNativeGeneratedReport(report);

  if (!readyReport.fileUri) {
    throw new Error("El reporte no tiene un archivo disponible.");
  }

  await presentNativeReportFile(readyReport.fileUri, {
    mimeType: resolveArtifactMimeType(readyReport),
    dialogTitle: "Abrir reporte con...",
  });
}

/*
 * Comparte el reporte.
 *
 * En Web intentamos Web Share. Si no está disponible, descargamos el archivo
 * como alternativa segura y predecible.
 */
export async function shareGeneratedReport(reportId: string): Promise<{
  shared: boolean;
  downloaded: boolean;
}> {
  const report = requireReport(reportId);

  if (report.format !== "excel") {
    throw new Error("Compartir reportes PDF todavía no está implementado.");
  }

  if (Platform.OS === "web") {
    const artifact = await buildReportArtifact(report);

    return shareArtifactOnWeb(
      artifact.bytes,
      artifact.fileName,
      artifact.mimeType,
    );
  }

  const readyReport = await ensureNativeGeneratedReport(report);

  if (!readyReport.fileUri) {
    throw new Error("El reporte no tiene un archivo disponible.");
  }

  await presentNativeReportFile(readyReport.fileUri, {
    mimeType: resolveArtifactMimeType(readyReport),
    dialogTitle: "Compartir reporte",
  });

  return {
    shared: true,
    downloaded: false,
  };
}

/* -------------------------------------------------------------------------- */
/* CONSTRUIR ARTEFACTO                                                        */
/* -------------------------------------------------------------------------- */

async function buildReportArtifact(
  report: Report,
): Promise<BuiltReportArtifact> {
  if (report.format !== "excel") {
    throw new Error(
      "El generador PDF todavía no está disponible. Selecciona formato Excel.",
    );
  }

  const company = getCompanyById(report.companyId);
  const property = getPropertyById(report.propertyId);
  const inspection = getInspectionById(report.inspectionId);

  if (!company) {
    throw new Error(`Empresa no encontrada: ${report.companyId}`);
  }

  if (!property) {
    throw new Error(`Inmueble no encontrado: ${report.propertyId}`);
  }

  if (!inspection) {
    throw new Error(`Inspección no encontrada: ${report.inspectionId}`);
  }

  if (inspection.status !== "completed") {
    throw new Error(
      "Solo es posible generar un reporte a partir de una inspección finalizada.",
    );
  }

  if (
    inspection.companyId !== report.companyId ||
    inspection.propertyId !== report.propertyId
  ) {
    throw new Error(
      "Las relaciones Empresa/Inmueble del reporte no coinciden con la inspección.",
    );
  }

  const form = getFormById(inspection.formId);

  if (!form) {
    throw new Error(`Formulario no encontrado: ${inspection.formId}`);
  }

  const evidences = getEvidencesByInspectionId(inspection.id);

  const excel = generateExcelReport({
    report,
    company,
    property,
    inspection,
    form,
    evidences,
  });

  /*
   * Sin evidencias solicitadas entregamos directamente el XLSX.
   */
  if (!report.includeEvidence) {
    return {
      bytes: excel.bytes,
      fileName: excel.fileName,
      mimeType: excel.mimeType,
      includedEvidenceCount: 0,
      requestedEvidenceCount: 0,
      warnings: [],
    };
  }

  /*
   * Si se solicitaron evidencias, generamos siempre un ZIP.
   *
   * Incluso con cero evidencias el ZIP contiene:
   *
   * - reporte.xlsx
   * - evidencias/MANIFIESTO.txt
   */
  const zip = new JSZip();
  const warnings: ReportGenerationWarning[] = [];
  const manifestLines: string[] = [
    "UNIESAP - MANIFIESTO DE EVIDENCIAS",
    "",
    `Reporte: ${report.title}`,
    `Inspección: ${inspection.id}`,
    `Evidencias registradas: ${evidences.length}`,
    "",
  ];

  zip.file(excel.fileName, excel.bytes);

  let includedEvidenceCount = 0;

  for (let index = 0; index < evidences.length; index += 1) {
    const evidence = evidences[index];
    const sourceUri = evidence.localUri ?? evidence.remoteUri;

    if (!sourceUri) {
      const message = "Sin URI local o remota disponible.";

      warnings.push({
        evidenceId: evidence.id,
        message,
      });

      manifestLines.push(
        `OMITIDA | ${evidence.id} | ${resolveEvidenceDisplayName(evidence)} | ${message}`,
      );

      continue;
    }

    try {
      const bytes = await readUriAsBytes(sourceUri);
      const fileName = createEvidencePackageFileName(evidence, index);

      zip.file(`evidencias/${fileName}`, bytes);

      includedEvidenceCount += 1;

      manifestLines.push(
        `INCLUIDA | ${evidence.id} | ${fileName} | ${evidence.title}`,
      );
    } catch (error) {
      const message = getErrorMessage(error);

      warnings.push({
        evidenceId: evidence.id,
        message,
      });

      manifestLines.push(
        `OMITIDA | ${evidence.id} | ${resolveEvidenceDisplayName(evidence)} | ${message}`,
      );
    }
  }

  manifestLines.push(
    "",
    `Incluidas: ${includedEvidenceCount}`,
    `Omitidas: ${warnings.length}`,
  );

  zip.file("evidencias/MANIFIESTO.txt", manifestLines.join("\n"));

  const zipBytes = await zip.generateAsync({
    type: "uint8array",
    compression: "DEFLATE",
    compressionOptions: {
      level: 6,
    },
  });

  return {
    bytes: zipBytes,
    fileName: `${removeExtension(excel.fileName)}-con-evidencias.zip`,
    mimeType: ZIP_MIME_TYPE,
    includedEvidenceCount,
    requestedEvidenceCount: evidences.length,
    warnings,
  };
}

/* -------------------------------------------------------------------------- */
/* NATIVE                                                                     */
/* -------------------------------------------------------------------------- */

async function ensureNativeGeneratedReport(report: Report): Promise<Report> {
  if (
    report.status === "generated" &&
    report.fileUri &&
    !isWebReportUri(report.fileUri) &&
    (await localReportFileExists(report.fileUri))
  ) {
    return report;
  }

  const generated = await generateReportFile(report.id, {
    downloadOnWeb: false,
  });

  return generated.report;
}

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

function requireReport(reportId: string): Report {
  const report = getReportById(reportId);

  if (!report) {
    throw new Error(`Reporte no encontrado: ${reportId}`);
  }

  return report;
}

function resolveArtifactMimeType(report: Report): string {
  if (report.includeEvidence) {
    return ZIP_MIME_TYPE;
  }

  return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
}

function createEvidencePackageFileName(
  evidence: Evidence,
  index: number,
): string {
  const sequence = String(index + 1).padStart(3, "0");
  const originalName = resolveEvidenceDisplayName(evidence);
  const safeName = sanitizeFileName(originalName);

  return `${sequence}-${safeName}`;
}

function resolveEvidenceDisplayName(evidence: Evidence): string {
  if (evidence.fileName?.trim()) {
    return evidence.fileName.trim();
  }

  const sourceUri = evidence.localUri ?? evidence.remoteUri;

  if (sourceUri) {
    const rawName = sourceUri.split("?")[0].split("/").pop();

    if (rawName) {
      return decodeURIComponentSafely(rawName);
    }
  }

  const extension = resolveEvidenceExtension(evidence);

  return `${evidence.id}${extension}`;
}

function resolveEvidenceExtension(evidence: Evidence): string {
  switch (evidence.mimeType) {
    case "image/jpeg":
      return ".jpg";

    case "image/png":
      return ".png";

    case "image/webp":
      return ".webp";

    case "application/pdf":
      return ".pdf";

    default:
      return evidence.type === "photo" ? ".jpg" : ".bin";
  }
}

function sanitizeFileName(value: string): string {
  const parts = value.split(".");
  const extension = parts.length > 1 ? `.${parts.pop()}` : "";
  const base = parts.join(".") || "evidencia";

  const safeBase = base
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

  const safeExtension = extension.replace(/[^a-zA-Z0-9.]/g, "").slice(0, 12);

  return `${safeBase || "evidencia"}${safeExtension}`;
}

function removeExtension(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, "");
}

function decodeURIComponentSafely(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Ocurrió un error desconocido.";
}
