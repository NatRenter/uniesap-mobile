import { getFormById } from "@/data/forms";

import {
  getInspectionById,
  updateInspection,
} from "@/repositories/inspectionRepository";

import { getNetworkAvailability } from "@/services/networkService";

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
 * Esta función es el ÚNICO punto desde el cual una inspección
 * debe intentar sincronizarse con Kobo.
 *
 *
 * Flujo:
 *
 * Inspection
 *    ↓
 * validar estado
 *    ↓
 * validar conectividad
 *    ↓
 * syncing
 *    ↓
 * exportKoboSubmission()
 *    ↓
 * synced / error
 *
 *
 * Gracias a esta validación central:
 *
 * - CaptureScreen no conoce Kobo;
 * - /sync-test no puede saltarse la conectividad;
 * - Reintentar sincronización tampoco puede saltársela;
 * - MockKoboService no falsea nuestras pruebas offline.
 */

export async function syncInspection(
  inspectionId: string,
): Promise<InspectionSyncResult> {
  /*
   * ==========================================================================
   * OBTENER INSPECCIÓN
   * ==========================================================================
   */

  const inspection = getInspectionById(inspectionId);

  if (!inspection) {
    throw new Error(`Inspección no encontrada: ${inspectionId}`);
  }

  /*
   * ==========================================================================
   * VALIDAR QUE ESTÉ TERMINADA
   * ==========================================================================
   *
   * Borradores y capturas en proceso nunca deben
   * crear submissions Kobo.
   */

  if (inspection.status !== "completed") {
    return {
      status: "skipped",

      inspection,

      reason: "La inspección todavía no está finalizada.",
    };
  }

  /*
   * ==========================================================================
   * EVITAR DUPLICADOS
   * ==========================================================================
   *
   * Una inspección que ya está synced no debe
   * crear otra submission.
   */

  if (inspection.integration?.syncStatus === "synced") {
    return {
      status: "skipped",

      inspection,

      reason: "La inspección ya está sincronizada.",
    };
  }

  /*
   * ==========================================================================
   * RESOLVER FORMULARIO
   * ==========================================================================
   */

  const form = getFormById(inspection.formId);

  if (!form) {
    return markSyncError(
      inspection,

      `Formulario no encontrado: ${inspection.formId}`,
    );
  }

  /*
   * ==========================================================================
   * FORMULARIOS INTERNOS
   * ==========================================================================
   *
   * Algunos formularios podrán pertenecer únicamente
   * a UNIESAP y no tener integración Kobo.
   *
   * Estos registros permanecen como:
   *
   * completed + local
   */

  if (!form.integration || form.integration.provider !== "kobo") {
    const localInspection = await updateInspection(
      inspection.id,

      {
        integration: {
          ...inspection.integration,

          syncStatus: "local",

          lastSyncError: undefined,
        },
      },
    );

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
   * VALIDAR CONECTIVIDAD
   * ==========================================================================
   *
   * Esta comprobación ocurre ANTES de cambiar el estado
   * de la inspección a "syncing".
   *
   * Es especialmente importante mientras usamos
   * MockKoboService, porque el Mock podría responder
   * correctamente aunque físicamente no exista Internet.
   *
   *
   * OFFLINE:
   *
   * pending
   *    ↓
   * permanece pending
   *
   *
   * error
   *    ↓
   * permanece error
   *
   *
   * syncing interrumpido
   *    ↓
   * permanece syncing hasta que vuelva a procesarse
   */

  let networkAvailable: boolean;

  try {
    networkAvailable = await getNetworkAvailability();
  } catch (error) {
    /*
     * Si ni siquiera podemos determinar el estado
     * de red, actuamos de forma conservadora.
     *
     * No intentamos Kobo.
     */

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
    console.log(
      "Sincronización omitida porque el dispositivo está sin conexión:",
      {
        inspectionId: inspection.id,

        syncStatus: inspection.integration?.syncStatus ?? "local",
      },
    );

    return {
      status: "skipped",

      inspection,

      reason: "Sin conexión a Internet. La inspección permanece pendiente.",
    };
  }

  /*
   * ==========================================================================
   * MARCAR COMO SYNCING
   * ==========================================================================
   *
   * Llegados aquí sabemos que:
   *
   * ✓ está completada;
   * ✓ necesita Kobo;
   * ✓ no está sincronizada;
   * ✓ existe conectividad.
   */

  const syncingInspection = await updateInspection(
    inspection.id,

    {
      integration: {
        ...inspection.integration,

        syncStatus: "syncing",

        lastSyncError: undefined,
      },
    },
  );

  if (!syncingInspection) {
    throw new Error(
      `No fue posible marcar la inspección ${inspection.id} como syncing.`,
    );
  }

  /*
   * ==========================================================================
   * SINCRONIZAR CON KOBO
   * ==========================================================================
   */

  try {
    /*
     * koboInspectionService se encarga de:
     *
     * InspectionResponse[]
     *          ↓
     * mapper
     *          ↓
     * KoboSubmissionData
     *          ↓
     * KoboService.createSubmission()
     */

    const exported = await exportKoboSubmission(
      inspection.formId,

      inspection.responses,
    );

    /*
     * =========================================================================
     * GUARDAR REFERENCIA KOBO
     * =========================================================================
     */

    const syncedInspection = await updateInspection(
      inspection.id,

      {
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
      },
    );

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
    /*
     * =========================================================================
     * ERROR KOBO
     * =========================================================================
     *
     * La inspección NO se pierde.
     *
     * Se mantiene persistida como:
     *
     * completed + error
     *
     * y podrá entrar nuevamente a la cola.
     */

    return markSyncError(
      inspection,

      getErrorMessage(error),
    );
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
  const failedInspection = await updateInspection(
    inspection.id,

    {
      integration: {
        ...inspection.integration,

        syncStatus: "error",

        lastSyncError: message,
      },
    },
  );

  if (!failedInspection) {
    throw new Error(
      `No fue posible guardar el error de sincronización de ${inspection.id}.`,
    );
  }

  console.error("Inspección marcada con error de sincronización:", {
    inspectionId: inspection.id,

    error: message,
  });

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
