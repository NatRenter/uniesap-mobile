import { getFormById } from "@/repositories/formRepository";

import {
  getEvidenceById,
  getEvidencesByInspectionId,
  updateEvidence,
} from "@/repositories/evidenceRepository";

import {
  getInspectionById,
  updateInspection,
} from "@/repositories/inspectionRepository";

import {
  exportKoboSubmission,
  uploadKoboAttachment,
} from "@/services/koboInspectionService";

import { getNetworkAvailability } from "@/services/networkService";

import type { Inspection } from "@/types/inspection";

export type InspectionSyncResult =
  | {
      status: "synced";
      inspection: Inspection;
    }
  | {
      status: "skipped";
      inspection: Inspection;
      reason: string;
    }
  | {
      status: "error";
      inspection: Inspection;
      error: string;
    };

/*
 * ============================================================================
 * FALLO SIMULADO DESPUÉS DE LA SUBMISSION
 * ============================================================================
 *
 * Prueba anterior:
 *
 * Kobo acepta la submission
 *        ↓
 * UNIESAP falla antes de guardar el resultado local.
 *
 * Es una prueba one-shot:
 * después de ejecutarse se desarma automáticamente.
 */

let failAfterSubmissionOnce = false;

export function armInspectionSyncFailureAfterSubmission(): void {
  failAfterSubmissionOnce = true;
}

export function isInspectionSyncFailureAfterSubmissionArmed(): boolean {
  return failAfterSubmissionOnce;
}

function consumeInspectionSyncFailureAfterSubmission(): boolean {
  if (!failAfterSubmissionOnce) {
    return false;
  }

  failAfterSubmissionOnce = false;

  return true;
}

/*
 * ============================================================================
 * FALLO SIMULADO DESPUÉS DE QUE KOBO ACEPTA 1 ATTACHMENT
 * ============================================================================
 *
 * Esta prueba cubre el escenario más delicado de una evidencia:
 *
 * Mock/Kobo acepta la fotografía
 *        ↓
 * la referencia idempotente queda persistida
 *        ↓
 * UNIESAP falla ANTES de marcar Evidence como synced
 *        ↓
 * reintento
 *        ↓
 * Kobo reconoce uploadOperationId
 *        ↓
 * devuelve el mismo attachmentId
 *
 * Es one-shot y se desarma automáticamente al utilizarse.
 */

let failAfterAttachmentAcceptedOnce = false;

export function armInspectionSyncFailureAfterAttachmentAccepted(): void {
  failAfterAttachmentAcceptedOnce = true;
}

export function isInspectionSyncFailureAfterAttachmentAcceptedArmed(): boolean {
  return failAfterAttachmentAcceptedOnce;
}

function consumeInspectionSyncFailureAfterAttachmentAccepted(): boolean {
  if (!failAfterAttachmentAcceptedOnce) {
    return false;
  }

  failAfterAttachmentAcceptedOnce = false;

  return true;
}

/*
 * ============================================================================
 * FALLO SIMULADO DESPUÉS DE N ATTACHMENTS
 * ============================================================================
 *
 * Nueva prueba:
 *
 * foto 1 → synced
 * foto 2 → synced
 * foto 3 → todavía pendiente
 *        ↓
 * fallo simulado
 *
 * El valor guarda cuántas evidencias nuevas deben subirse
 * antes de provocar el fallo.
 */

let failAfterAttachmentCountOnce: number | null = null;

export function armInspectionSyncFailureAfterAttachments(
  attachmentCount: number,
): void {
  if (!Number.isInteger(attachmentCount) || attachmentCount < 1) {
    throw new Error(
      "La cantidad de evidencias para la prueba debe ser un entero mayor o igual a 1.",
    );
  }

  failAfterAttachmentCountOnce = attachmentCount;
}

export function isInspectionSyncFailureAfterAttachmentsArmed(): boolean {
  return failAfterAttachmentCountOnce !== null;
}

function shouldFailAfterAttachmentUpload(
  uploadedCount: number,
  currentIndex: number,
  totalAttachments: number,
): boolean {
  const targetCount = failAfterAttachmentCountOnce;

  if (targetCount === null) {
    return false;
  }

  /*
   * Queremos que el fallo ocurra a mitad del proceso.
   *
   * Si ya estamos en el último attachment,
   * dejamos terminar normalmente.
   */
  const hasMoreAttachments = currentIndex < totalAttachments - 1;

  if (uploadedCount < targetCount || !hasMoreAttachments) {
    return false;
  }

  /*
   * One-shot:
   * se desarma antes de lanzar el error.
   */
  failAfterAttachmentCountOnce = null;

  return true;
}

/*
 * ============================================================================
 * SINCRONIZAR INSPECCIÓN
 * ============================================================================
 */

export async function syncInspection(
  inspectionId: string,
): Promise<InspectionSyncResult> {
  const inspection = getInspectionById(inspectionId);

  if (!inspection) {
    throw new Error(`Inspección no encontrada: ${inspectionId}`);
  }

  /*
   * Borradores o capturas en proceso nunca deben enviarse a Kobo.
   */
  if (inspection.status !== "completed") {
    return {
      status: "skipped",
      inspection,
      reason: "La inspección todavía no está finalizada.",
    };
  }

  /*
   * Una inspección ya sincronizada no vuelve a enviarse.
   */
  if (inspection.integration?.syncStatus === "synced") {
    return {
      status: "skipped",
      inspection,
      reason: "La inspección ya está sincronizada.",
    };
  }

  const form = getFormById(inspection.formId);

  if (!form) {
    return markSyncError(
      inspection,
      `Formulario no encontrado: ${inspection.formId}`,
    );
  }

  /*
   * Formularios locales que no utilizan Kobo.
   */
  if (!form.integration || form.integration.provider !== "kobo") {
    const localInspection = await updateInspection(inspection.id, {
      integration: {
        ...inspection.integration,
        syncStatus: "local",
        lastSyncError: undefined,
      },
    });

    if (!localInspection) {
      throw new Error(
        `No fue posible actualizar la inspección ${inspection.id}.`,
      );
    }

    return {
      status: "skipped",
      inspection: localInspection,
      reason: "El formulario no utiliza Kobo.",
    };
  }

  /*
   * ==========================================================================
   * CONECTIVIDAD
   * ==========================================================================
   */

  let networkAvailable: boolean;

  try {
    networkAvailable = await getNetworkAvailability();
  } catch (error) {
    console.warn(
      "No fue posible comprobar la conectividad antes de sincronizar:",
      error,
    );

    return {
      status: "skipped",
      inspection,
      reason: "No fue posible comprobar la conexión a Internet.",
    };
  }

  if (!networkAvailable) {
    return {
      status: "skipped",
      inspection,
      reason: "Sin conexión a Internet. La inspección permanece pendiente.",
    };
  }

  /*
   * ==========================================================================
   * IDENTIDAD IDEMPOTENTE DE LA INSPECCIÓN
   * ==========================================================================
   *
   * La misma inspección siempre conserva el mismo syncOperationId.
   */

  const syncOperationId =
    inspection.integration?.syncOperationId ??
    createSyncOperationId(inspection.id);

  const syncAttempt = (inspection.integration?.syncAttempt ?? 0) + 1;

  const syncingInspection = await updateInspection(inspection.id, {
    integration: {
      ...inspection.integration,
      syncStatus: "syncing",
      syncOperationId,
      syncAttempt,
      lastSyncError: undefined,
    },
  });

  if (!syncingInspection) {
    throw new Error(
      `No fue posible marcar la inspección ${inspection.id} como syncing.`,
    );
  }

  try {
    const evidences = getEvidencesByInspectionId(inspection.id);

    /*
     * ========================================================================
     * PASO 1 — SUBMISSION PRINCIPAL
     * ========================================================================
     *
     * createSubmission() ya es idempotente mediante syncOperationId.
     */

    const exported = await exportKoboSubmission(
      inspection.formId,
      inspection.responses,
      syncOperationId,
      evidences,
    );

    /*
     * Prueba anterior:
     * fallo justo después de que Kobo acepta la submission.
     */
    if (consumeInspectionSyncFailureAfterSubmission()) {
      console.warn(
        "FALLO SIMULADO: Kobo aceptó la submission, pero UNIESAP falla antes de guardar el resultado local.",
        {
          inspectionId: inspection.id,
          syncOperationId,
          syncAttempt,
          submissionId: exported.submission.submissionId,
        },
      );

      throw new Error("Fallo simulado después de crear la submission Kobo.");
    }

    /*
     * ========================================================================
     * PASO 2 — ATTACHMENTS
     * ========================================================================
     *
     * Las evidencias se procesan una por una.
     *
     * uploadedAttachmentCount solamente cuenta evidencias
     * realmente procesadas durante ESTE intento.
     */

    let uploadedAttachmentCount = 0;

    for (const [
      attachmentIndex,
      attachment,
    ] of exported.attachments.entries()) {
      const currentEvidence = getEvidenceById(attachment.evidenceId);

      if (!currentEvidence) {
        throw new Error(
          `Evidencia no encontrada durante sincronización: ${attachment.evidenceId}`,
        );
      }

      /*
       * Si ya existe attachmentId y la evidencia está synced,
       * la fotografía ya fue confirmada anteriormente.
       *
       * No la volvemos a subir.
       */
      if (
        currentEvidence.status === "synced" &&
        currentEvidence.integration?.kobo?.attachmentId
      ) {
        console.log("Attachment omitido porque ya está sincronizado:", {
          evidenceId: currentEvidence.id,
          attachmentId: currentEvidence.integration.kobo.attachmentId,
        });

        continue;
      }

      /*
       * Guardamos uploadOperationId ANTES de la subida.
       *
       * Si la app se cierra aquí, el mismo identificador
       * estará disponible durante el reintento.
       */
      await updateEvidence(currentEvidence.id, {
        integration: {
          kobo: {
            provider: "kobo",
            uploadOperationId: attachment.uploadOperationId,

            ...(currentEvidence.integration?.kobo?.attachmentId
              ? {
                  attachmentId: currentEvidence.integration.kobo.attachmentId,
                }
              : {}),

            ...(currentEvidence.integration?.kobo?.assetUid
              ? {
                  assetUid: currentEvidence.integration.kobo.assetUid,
                }
              : {}),

            ...(currentEvidence.integration?.kobo?.submissionId !== undefined
              ? {
                  submissionId: currentEvidence.integration.kobo.submissionId,
                }
              : {}),

            ...(currentEvidence.integration?.kobo?.uploadedAt
              ? {
                  uploadedAt: currentEvidence.integration.kobo.uploadedAt,
                }
              : {}),

            lastUploadError: undefined,
          },
        },
      });

      /*
       * La subida individual tiene su propio try/catch.
       *
       * Si solamente una fotografía falla:
       * - esa evidencia queda pending;
       * - la inspección queda error;
       * - las fotos anteriores conservan synced.
       */
      try {
        const uploaded = await uploadKoboAttachment(
          exported.assetUid,
          exported.submission.submissionId,
          attachment,
        );

        /*
         * ================================================================
         * FALLO DESPUÉS DE ACEPTACIÓN REMOTA
         * ================================================================
         *
         * En este punto Mock/Kobo YA aceptó la evidencia y guardó:
         *
         * uploadOperationId → attachmentId
         *
         * Pero UNIESAP todavía NO ha marcado Evidence como synced.
         *
         * Esto reproduce un cierre o fallo justo en la ventana más peligrosa.
         */
        if (consumeInspectionSyncFailureAfterAttachmentAccepted()) {
          console.warn(
            "FALLO SIMULADO: Kobo aceptó la evidencia, pero UNIESAP falla antes de guardar su estado local.",
            {
              inspectionId: inspection.id,
              evidenceId: attachment.evidenceId,
              uploadOperationId: attachment.uploadOperationId,
              attachmentId: uploaded.attachmentId,
              submissionId: uploaded.submissionId,
            },
          );

          throw new Error(
            `Fallo simulado después de que Kobo aceptó la evidencia ${attachment.evidenceId}.`,
          );
        }

        await updateEvidence(attachment.evidenceId, {
          status: "synced",

          integration: {
            kobo: {
              provider: "kobo",
              uploadOperationId: attachment.uploadOperationId,
              attachmentId: uploaded.attachmentId,
              assetUid: uploaded.assetUid,
              submissionId: uploaded.submissionId,
              uploadedAt: uploaded.uploadedAt ?? new Date().toISOString(),
              lastUploadError: undefined,
            },
          },
        });
      } catch (attachmentError) {
        const message = getErrorMessage(attachmentError);

        await updateEvidence(attachment.evidenceId, {
          status: "pending",

          integration: {
            kobo: {
              provider: "kobo",
              uploadOperationId: attachment.uploadOperationId,
              lastUploadError: message,
            },
          },
        });

        throw new Error(
          `No fue posible sincronizar la evidencia ${attachment.evidenceId}: ${message}`,
        );
      }

      /*
       * La evidencia ya quedó confirmada y persistida.
       */
      uploadedAttachmentCount += 1;

      /*
       * ======================================================================
       * FALLO SIMULADO A MITAD DE ATTACHMENTS
       * ======================================================================
       *
       * Se ejecuta FUERA del try/catch de uploadAttachment().
       *
       * Esto es importante:
       * las fotografías ya aceptadas permanecen synced.
       */
      if (
        shouldFailAfterAttachmentUpload(
          uploadedAttachmentCount,
          attachmentIndex,
          exported.attachments.length,
        )
      ) {
        console.warn(
          "FALLO SIMULADO: UNIESAP se interrumpe después de sincronizar evidencias individuales.",
          {
            inspectionId: inspection.id,
            syncOperationId,
            syncAttempt,
            uploadedAttachmentCount,
            totalAttachments: exported.attachments.length,
            lastEvidenceId: attachment.evidenceId,
          },
        );

        throw new Error(
          `Fallo simulado después de sincronizar ${uploadedAttachmentCount} evidencia(s).`,
        );
      }
    }

    /*
     * =========================================================================
     * PASO 3 — FINALIZAR INSPECCIÓN
     * =========================================================================
     *
     * Solo llegamos aquí cuando todas las evidencias compatibles
     * quedaron procesadas.
     */

    const syncedInspection = await updateInspection(inspection.id, {
      integration: {
        ...syncingInspection.integration,
        syncStatus: "synced",
        syncOperationId,
        syncAttempt,

        kobo: {
          provider: "kobo",
          assetUid: exported.assetUid,
          submissionId: exported.submission.submissionId,

          ...(exported.submission.uuid
            ? {
                uuid: exported.submission.uuid,
              }
            : {}),

          syncedAt: exported.submission.syncedAt ?? new Date().toISOString(),
        },

        lastSyncError: undefined,
      },
    });

    if (!syncedInspection) {
      throw new Error(
        `No fue posible registrar el resultado Kobo de la inspección ${inspection.id}.`,
      );
    }

    console.log("Inspección sincronizada mediante InspectionSyncService:", {
      inspectionId: inspection.id,
      syncOperationId,
      syncAttempt,
      submission: exported.submission,
      attachmentCount: exported.attachments.length,
    });

    return {
      status: "synced",
      inspection: syncedInspection,
    };
  } catch (error) {
    /*
     * Conservamos syncOperationId y syncAttempt
     * porque usamos syncingInspection.
     */
    return markSyncError(syncingInspection, getErrorMessage(error));
  }
}

/*
 * ============================================================================
 * MARCAR ERROR
 * ============================================================================
 */

async function markSyncError(
  inspection: Inspection,
  message: string,
): Promise<InspectionSyncResult> {
  const failedInspection = await updateInspection(inspection.id, {
    integration: {
      ...inspection.integration,
      syncStatus: "error",
      lastSyncError: message,
    },
  });

  if (!failedInspection) {
    throw new Error(
      `No fue posible guardar el error de sincronización de ${inspection.id}.`,
    );
  }

  console.error("Inspección marcada con error de sincronización:", {
    inspectionId: inspection.id,
    syncOperationId: failedInspection.integration?.syncOperationId,
    syncAttempt: failedInspection.integration?.syncAttempt,
    error: message,
  });

  return {
    status: "error",
    inspection: failedInspection,
    error: message,
  };
}

/*
 * La misma inspección produce siempre la misma clave.
 */
function createSyncOperationId(inspectionId: string): string {
  return `sync-${inspectionId}`;
}

/*
 * Convierte cualquier error a texto legible.
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Ocurrió un error desconocido.";
}
