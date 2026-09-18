import * as XLSX from "xlsx";

import type { Company } from "@/types/company";
import type { Evidence } from "@/types/evidence";
import type { FormDefinition, FormQuestion } from "@/types/form";
import type { Inspection, InspectionResponseValue } from "@/types/inspection";
import type { Property } from "@/types/property";
import type { Report } from "@/types/report";

/*
 * ============================================================================
 * GENERADOR EXCEL DE REPORTES
 * ============================================================================
 *
 * Esta capa solamente transforma datos de UNIESAP a un archivo XLSX en memoria.
 *
 * NO conoce:
 *
 * - SQLite;
 * - localStorage;
 * - expo-file-system;
 * - navegación;
 * - compartir archivos.
 *
 * Gracias a esta separación, más adelante podremos cambiar la forma de guardar
 * el archivo sin tener que volver a construir la lógica del Excel.
 */

export type ExcelReportGeneratorInput = {
  report: Report;
  company: Company;
  property: Property;
  inspection: Inspection;
  form: FormDefinition;
  evidences: Evidence[];
};

export type GeneratedExcelReport = {
  bytes: Uint8Array;
  fileName: string;
  mimeType: string;
};

const XLSX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/*
 * Genera el workbook completo y devuelve sus bytes.
 */
export function generateExcelReport(
  input: ExcelReportGeneratorInput,
): GeneratedExcelReport {
  const { report, company, property, inspection, form, evidences } = input;

  const workbook = XLSX.utils.book_new();

  /* ------------------------------------------------------------------------ */
  /* RESUMEN                                                                  */
  /* ------------------------------------------------------------------------ */

  const summaryRows: [string, string | number][] = [
    ["Reporte", report.title],
    ["Empresa", company.name],
    ["Razón social", company.legalName],
    ["RFC", company.rfc ?? "No registrado"],
    ["Inmueble", property.name],
    ["Tipo de inmueble", property.type],
    ["Ubicación", buildLocation(property)],
    ["Trabajadores registrados", property.workers],
    ["Formulario", form.title],
    ["Versión del formulario", form.version],
    ["Inspector UNIESAP", inspection.inspector],
    ["Fecha de inspección", formatDateForReport(inspection.date)],
    ["Estado de inspección", resolveInspectionStatusLabel(inspection.status)],
    [
      "Estado de sincronización",
      resolveSyncStatusLabel(inspection.integration?.syncStatus ?? "local"),
    ],
    ["Evidencias registradas", evidences.length],
    ["Evidencias solicitadas en paquete", report.includeEvidence ? "Sí" : "No"],
    ["Generado por UNIESAP", formatDateTimeForReport(new Date().toISOString())],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet([
    ["UNIESAP - RESUMEN DEL REPORTE"],
    [],
    ["Campo", "Valor"],
    ...summaryRows,
  ]);

  summarySheet["!cols"] = [{ wch: 34 }, { wch: 72 }];

  XLSX.utils.book_append_sheet(workbook, summarySheet, "Resumen");

  /* ------------------------------------------------------------------------ */
  /* RESPUESTAS                                                               */
  /* ------------------------------------------------------------------------ */

  const responseMap = new Map(
    inspection.responses.map((response) => [
      response.questionId,
      response.value,
    ]),
  );

  const responseRows = form.questions.map((question, index) => {
    const responseValue = responseMap.has(question.id)
      ? responseMap.get(question.id)
      : null;

    return {
      No: index + 1,
      Pregunta: question.label,
      Tipo: resolveQuestionTypeLabel(question.type),
      Obligatoria: question.required ? "Sí" : "No",
      Respuesta: formatResponseValue(responseValue ?? null, question),
    };
  });

  const responsesSheet = XLSX.utils.json_to_sheet(responseRows, {
    header: ["No", "Pregunta", "Tipo", "Obligatoria", "Respuesta"],
  });

  responsesSheet["!cols"] = [
    { wch: 8 },
    { wch: 52 },
    { wch: 18 },
    { wch: 14 },
    { wch: 72 },
  ];

  if (responseRows.length > 0) {
    responsesSheet["!autofilter"] = {
      ref: `A1:E${responseRows.length + 1}`,
    };
  }

  XLSX.utils.book_append_sheet(workbook, responsesSheet, "Respuestas");

  /* ------------------------------------------------------------------------ */
  /* EVIDENCIAS                                                               */
  /* ------------------------------------------------------------------------ */

  const evidenceRows = evidences.map((evidence, index) => ({
    No: index + 1,
    Evidencia: evidence.title,
    Pregunta: resolveEvidenceQuestionLabel(evidence, form),
    Tipo: evidence.type === "photo" ? "Fotografía" : "Documento",
    Archivo: evidence.fileName ?? resolveFileNameFromUri(evidence.localUri),
    MIME: evidence.mimeType ?? "No registrado",
    Fecha: formatDateForReport(evidence.date),
    Estado: evidence.status === "synced" ? "Sincronizada" : "Pendiente",
    Kobo: evidence.integration?.kobo?.attachmentId
      ? "Attachment registrado"
      : "Sin attachment",
  }));

  const evidencesSheet = XLSX.utils.json_to_sheet(evidenceRows, {
    header: [
      "No",
      "Evidencia",
      "Pregunta",
      "Tipo",
      "Archivo",
      "MIME",
      "Fecha",
      "Estado",
      "Kobo",
    ],
  });

  evidencesSheet["!cols"] = [
    { wch: 8 },
    { wch: 34 },
    { wch: 48 },
    { wch: 16 },
    { wch: 38 },
    { wch: 32 },
    { wch: 16 },
    { wch: 18 },
    { wch: 24 },
  ];

  if (evidenceRows.length > 0) {
    evidencesSheet["!autofilter"] = {
      ref: `A1:I${evidenceRows.length + 1}`,
    };
  }

  XLSX.utils.book_append_sheet(workbook, evidencesSheet, "Evidencias");

  /* ------------------------------------------------------------------------ */
  /* METADATOS                                                                */
  /* ------------------------------------------------------------------------ */

  const metadataSheet = XLSX.utils.aoa_to_sheet([
    ["Dato técnico", "Valor"],
    ["reportId", report.id],
    ["companyId", company.id],
    ["propertyId", property.id],
    ["inspectionId", inspection.id],
    ["formId", form.id],
    ["formVersion", form.version],
    ["inspectionCreatedAt", inspection.createdAt],
    ["inspectionUpdatedAt", inspection.updatedAt],
    ["reportCreatedAt", report.createdAt],
    ["syncOperationId", inspection.integration?.syncOperationId ?? ""],
    ["koboAssetUid", inspection.integration?.kobo?.assetUid ?? ""],
    [
      "koboSubmissionId",
      inspection.integration?.kobo?.submissionId !== undefined
        ? String(inspection.integration.kobo.submissionId)
        : "",
    ],
  ]);

  metadataSheet["!cols"] = [{ wch: 28 }, { wch: 72 }];

  XLSX.utils.book_append_sheet(workbook, metadataSheet, "Metadatos");

  /* ------------------------------------------------------------------------ */
  /* PROPIEDADES DEL ARCHIVO                                                  */
  /* ------------------------------------------------------------------------ */

  workbook.Props = {
    Title: report.title,
    Subject: form.title,
    Author: "UNIESAP",
    Company: company.name,
    Comments: "Reporte generado por UNIESAP Mobile.",
    CreatedDate: new Date(),
  };

  /*
   * type: "array" funciona tanto en navegador como en React Native.
   */
  const output = XLSX.write(workbook, {
    type: "array",
    bookType: "xlsx",
    compression: true,
  });

  const bytes =
    output instanceof Uint8Array
      ? output
      : new Uint8Array(output as ArrayBuffer);

  return {
    bytes,
    fileName: `${createSafeFileBaseName(report.title)}.xlsx`,
    mimeType: XLSX_MIME_TYPE,
  };
}

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

function buildLocation(property: Property): string {
  const locationParts = [
    property.address,
    property.city,
    property.state,
  ].filter((value): value is string => Boolean(value?.trim()));

  return locationParts.length > 0 ? locationParts.join(", ") : "No registrada";
}

function resolveEvidenceQuestionLabel(
  evidence: Evidence,
  form: FormDefinition,
): string {
  if (!evidence.questionId) {
    return "Evidencia general de la inspección";
  }

  return (
    form.questions.find((question) => question.id === evidence.questionId)
      ?.label ?? evidence.questionId
  );
}

function formatResponseValue(
  value: InspectionResponseValue,
  question: FormQuestion,
): string {
  if (value === null) {
    if (question.type === "photo") {
      return "Consultar hoja Evidencias";
    }

    return "Sin respuesta";
  }

  if (typeof value === "boolean") {
    return value ? "Sí" : "No";
  }

  if (question.type === "select" && typeof value === "string") {
    const option = question.options?.find((item) => item.value === value);

    return option?.label ?? value;
  }

  return String(value);
}

function resolveQuestionTypeLabel(type: FormQuestion["type"]): string {
  switch (type) {
    case "textarea":
      return "Texto largo";

    case "number":
      return "Número";

    case "boolean":
      return "Sí / No";

    case "select":
      return "Selección";

    case "photo":
      return "Fotografía";

    case "text":
    default:
      return "Texto";
  }
}

function resolveInspectionStatusLabel(status: Inspection["status"]): string {
  switch (status) {
    case "completed":
      return "Finalizada";

    case "in_progress":
      return "En proceso";

    case "draft":
    default:
      return "Borrador";
  }
}

function resolveSyncStatusLabel(
  status: NonNullable<Inspection["integration"]>["syncStatus"],
): string {
  switch (status) {
    case "pending":
      return "Pendiente de sincronización";

    case "syncing":
      return "Sincronizando";

    case "synced":
      return "Sincronizada";

    case "error":
      return "Error de sincronización";

    case "local":
    default:
      return "Local";
  }
}

function formatDateForReport(value: string): string {
  const normalized = value.includes("T") ? value.split("T")[0] : value;
  const parts = normalized.split("-");

  if (parts.length !== 3) {
    return value;
  }

  const [year, month, day] = parts;

  return `${day}/${month}/${year}`;
}

function formatDateTimeForReport(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("es-MX");
}

function resolveFileNameFromUri(uri?: string): string {
  if (!uri) {
    return "No registrado";
  }

  const cleanUri = uri.split("?")[0];
  const rawName = cleanUri.split("/").pop();

  return rawName ? decodeURIComponentSafely(rawName) : "Archivo de evidencia";
}

function createSafeFileBaseName(value: string): string {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

  return normalized || "reporte-uniesap";
}

function decodeURIComponentSafely(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
