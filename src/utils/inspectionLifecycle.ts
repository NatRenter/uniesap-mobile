import type {
    Inspection,
    InspectionResponse,
    InspectionStatus,
    InspectionSyncStatus,
} from "@/types/inspection";

/*
 * ============================================================================
 * CICLO DE VIDA DE UNA INSPECCIÓN
 * ============================================================================
 *
 * UNIESAP mantiene separados dos conceptos:
 *
 * 1. Estado de trabajo:
 *    draft | in_progress | completed
 *
 * 2. Estado de sincronización:
 *    local | pending | syncing | synced | error
 *
 * Esta separación evita convertir "sincronizada" en un estado de captura.
 */

export type InspectionLifecycleStage =
  | "draft"
  | "in_progress"
  | "completed_local"
  | "pending_sync"
  | "syncing"
  | "synced"
  | "sync_error";

/*
 * Determina si una inspección ya tiene contenido real.
 *
 * Las respuestas recibidas desde CaptureScreen ya contienen únicamente
 * valores contestados, por lo que basta con revisar su cantidad.
 *
 * Las evidencias también cuentan como progreso aunque todavía no existan
 * respuestas de texto.
 */
export function hasInspectionActivity(
  responses: InspectionResponse[],
  evidenceIds: string[],
): boolean {
  return responses.length > 0 || evidenceIds.length > 0;
}

/*
 * Resuelve el estado que debe utilizarse al guardar sin finalizar.
 *
 * Sin respuestas/evidencias → draft
 * Con respuestas/evidencias → in_progress
 */
export function resolveEditableInspectionStatus(
  responses: InspectionResponse[],
  evidenceIds: string[],
): InspectionStatus {
  return hasInspectionActivity(responses, evidenceIds)
    ? "in_progress"
    : "draft";
}

/*
 * Una inspección completed queda bloqueada para edición.
 *
 * La sincronización puede seguir cambiando después, pero las respuestas
 * capturadas ya no deben modificarse accidentalmente.
 */
export function canEditInspection(inspection: Inspection): boolean {
  return inspection.status !== "completed";
}

/*
 * Resume el estado completo combinando trabajo + sincronización.
 */
export function resolveInspectionLifecycleStage(
  inspection: Inspection,
): InspectionLifecycleStage {
  if (inspection.status === "draft") {
    return "draft";
  }

  if (inspection.status === "in_progress") {
    return "in_progress";
  }

  const syncStatus: InspectionSyncStatus =
    inspection.integration?.syncStatus ?? "local";

  switch (syncStatus) {
    case "pending":
      return "pending_sync";

    case "syncing":
      return "syncing";

    case "synced":
      return "synced";

    case "error":
      return "sync_error";

    case "local":
    default:
      return "completed_local";
  }
}
