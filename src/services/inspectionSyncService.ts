import { getFormById } from "@/data/forms";

import {
  getInspectionById,
  updateInspection,
} from "@/repositories/inspectionRepository";

import { exportKoboSubmission } from "@/services/koboInspectionService";

import type { Inspection } from "@/types/inspection";

/*
 * ============================================================================
 * RESULTADO DE SINCRONIZACIÓN
 * ============================================================================
 */

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
 * SINCRONIZAR UNA INSPECCIÓN
 * ============================================================================
 *
 * Esta función concentra todo el proceso:
 *
 * Inspection
 *    ↓
 * pending
 *    ↓
 * syncing
 *    ↓
 * exportKoboSubmission()
 *    ↓
 * synced / error
 *
 * CaptureScreen ya no necesita conocer los detalles
 * de cómo se actualizan los estados Kobo.
 */

export async function syncInspection(
  inspectionId: string,
): Promise<InspectionSyncResult> {
  const inspection = getInspectionById(inspectionId);

  if (!inspection) {
    throw new Error(`Inspección no encontrada: ${inspectionId}`);
  }

  /*
   * Las inspecciones no terminadas no deben
   * sincronizarse todavía.
   */
  if (inspection.status !== "completed") {
    return {
      status: "skipped",
      inspection,
      reason: "La inspección todavía no está finalizada.",
    };
  }

  /*
   * Una inspección que ya está sincronizada
   * no debe crear otra submission Kobo.
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
   * Formularios exclusivamente internos
   * permanecen locales.
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
   * Marcamos explícitamente que el proceso
   * de sincronización comenzó.
   */
  const syncingInspection = await updateInspection(inspection.id, {
    integration: {
      ...inspection.integration,

      syncStatus: "syncing",

      lastSyncError: undefined,
    },
  });

  if (!syncingInspection) {
    throw new Error(
      `No fue posible marcar la inspección ${inspection.id} como syncing.`,
    );
  }

  try {
    /*
     * Toda la conversión:
     *
     * InspectionResponse[]
     *        ↓
     * KoboSubmissionData
     *        ↓
     * KoboService
     *
     * sigue concentrada en koboInspectionService.
     */
    const exported = await exportKoboSubmission(
      inspection.formId,
      inspection.responses,
    );

    const syncedInspection = await updateInspection(inspection.id, {
      integration: {
        syncStatus: "synced",

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

      submission: exported.submission,
    });

    return {
      status: "synced",
      inspection: syncedInspection,
    };
  } catch (error) {
    return markSyncError(inspection, getErrorMessage(error));
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

  return {
    status: "error",
    inspection: failedInspection,
    error: message,
  };
}

/*
 * ============================================================================
 * UTILIDAD
 * ============================================================================
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
