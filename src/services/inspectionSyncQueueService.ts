import { getInspections } from "@/repositories/inspectionRepository";

import {
    syncInspection,
    type InspectionSyncResult,
} from "@/services/inspectionSyncService";

import type { Inspection, InspectionSyncStatus } from "@/types/inspection";

/*
 * ============================================================================
 * COLA DE SINCRONIZACIÓN DE INSPECCIONES
 * ============================================================================
 *
 * Esta capa NO conoce la interfaz.
 *
 * Su responsabilidad es:
 *
 * 1. localizar inspecciones pendientes;
 * 2. procesarlas una por una;
 * 3. delegar la sincronización individual a syncInspection();
 * 4. devolver un resumen del proceso.
 *
 *
 * Arquitectura:
 *
 * inspectionRepository
 *        ↓
 * inspectionSyncQueueService
 *        ↓
 * inspectionSyncService
 *        ↓
 * koboInspectionService
 *        ↓
 * KoboService
 */

/* -------------------------------------------------------------------------- */
/*                            TIPOS DE COLA                                   */
/* -------------------------------------------------------------------------- */

export type SyncQueueCandidateStatus = "pending" | "error" | "syncing";

export type InspectionSyncQueueOptions = {
  /*
   * Permite decidir si las inspecciones que anteriormente
   * fallaron deben intentarse nuevamente.
   *
   * Por defecto:
   *
   * true
   */
  includeErrors?: boolean;

  /*
   * Si la aplicación se cerró cuando una inspección estaba
   * en "syncing", al volver a iniciar podemos considerarla
   * nuevamente candidata.
   *
   * Por defecto:
   *
   * true
   */
  includeInterrupted?: boolean;
};

export type InspectionSyncQueueItemResult = {
  inspectionId: string;

  previousStatus: InspectionSyncStatus;

  result: InspectionSyncResult;
};

export type InspectionSyncQueueResult = {
  totalCandidates: number;

  processed: number;

  synced: number;

  failed: number;

  skipped: number;

  items: InspectionSyncQueueItemResult[];
};

/* -------------------------------------------------------------------------- */
/*                      OBTENER CANDIDATOS                                    */
/* -------------------------------------------------------------------------- */

/*
 * Devuelve las inspecciones que actualmente
 * deberían formar parte de la cola.
 *
 * No modifica ningún estado.
 */
export function getInspectionSyncQueue(
  options: InspectionSyncQueueOptions = {},
): Inspection[] {
  const { includeErrors = true, includeInterrupted = true } = options;

  const inspections = getInspections();

  return (
    inspections
      .filter((inspection) => {
        /*
         * Los borradores y capturas todavía
         * en proceso no deben enviarse.
         */
        if (inspection.status !== "completed") {
          return false;
        }

        const syncStatus = inspection.integration?.syncStatus ?? "local";

        /*
         * pending:
         *
         * candidato principal de la cola.
         */
        if (syncStatus === "pending") {
          return true;
        }

        /*
         * error:
         *
         * opcionalmente permitimos reintento.
         */
        if (syncStatus === "error" && includeErrors) {
          return true;
        }

        /*
         * syncing:
         *
         * puede significar que la aplicación
         * se cerró durante una sincronización.
         *
         * En esta primera versión volvemos
         * a intentarla.
         */
        if (syncStatus === "syncing" && includeInterrupted) {
          return true;
        }

        return false;
      })
      /*
       * Procesamos primero las inspecciones
       * más antiguas.
       *
       * Esto hace que la cola tenga un
       * comportamiento similar a FIFO.
       */
      .sort(
        (first, second) =>
          new Date(first.date).getTime() - new Date(second.date).getTime(),
      )
  );
}

/* -------------------------------------------------------------------------- */
/*                       CONTAR PENDIENTES                                    */
/* -------------------------------------------------------------------------- */

export function getInspectionSyncQueueCount(
  options: InspectionSyncQueueOptions = {},
): number {
  return getInspectionSyncQueue(options).length;
}

/* -------------------------------------------------------------------------- */
/*                       PROCESAR COLA                                        */
/* -------------------------------------------------------------------------- */

export async function processInspectionSyncQueue(
  options: InspectionSyncQueueOptions = {},
): Promise<InspectionSyncQueueResult> {
  /*
   * Tomamos una fotografía de la cola
   * al inicio del proceso.
   *
   * Si durante la sincronización aparece
   * otra inspección nueva, quedará para
   * la siguiente ejecución.
   */
  const candidates = getInspectionSyncQueue(options);

  const result: InspectionSyncQueueResult = {
    totalCandidates: candidates.length,

    processed: 0,

    synced: 0,

    failed: 0,

    skipped: 0,

    items: [],
  };

  /*
   * Primera versión:
   *
   * Procesamiento SECUENCIAL.
   *
   * No utilizamos Promise.all porque:
   *
   * - reduce carga sobre Kobo;
   * - facilita depuración;
   * - conserva orden FIFO;
   * - permite implementar límites/reintentos posteriormente.
   */
  for (const inspection of candidates) {
    const previousStatus = inspection.integration?.syncStatus ?? "local";

    try {
      const syncResult = await syncInspection(inspection.id);

      result.processed += 1;

      switch (syncResult.status) {
        case "synced":
          result.synced += 1;

          break;

        case "error":
          result.failed += 1;

          break;

        case "skipped":
          result.skipped += 1;

          break;
      }

      result.items.push({
        inspectionId: inspection.id,

        previousStatus,

        result: syncResult,
      });
    } catch (error) {
      /*
       * syncInspection normalmente convierte
       * los errores Kobo en status: "error".
       *
       * Este catch protege la cola contra errores
       * inesperados del repositorio o del propio servicio.
       */
      result.processed += 1;

      result.failed += 1;

      console.error(
        `Error inesperado procesando la inspección ${inspection.id}:`,
        error,
      );
    }
  }

  console.log("Cola de sincronización procesada:", {
    totalCandidates: result.totalCandidates,

    processed: result.processed,

    synced: result.synced,

    failed: result.failed,

    skipped: result.skipped,
  });

  return result;
}
