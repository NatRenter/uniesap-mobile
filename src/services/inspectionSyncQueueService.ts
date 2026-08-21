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
 * 3. delegar cada sincronización a syncInspection();
 * 4. evitar ejecuciones simultáneas de la cola;
 * 5. devolver un resumen del proceso.
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
/*                       CONTROL DE EJECUCIÓN                                 */
/* -------------------------------------------------------------------------- */

/*
 * ============================================================================
 * SINGLE-FLIGHT
 * ============================================================================
 *
 * Solamente permitimos UNA ejecución de la cola
 * al mismo tiempo.
 *
 * Esto será importante cuando posteriormente existan
 * diferentes disparadores:
 *
 * - botón manual
 * - recuperación de conexión
 * - inicio de la aplicación
 * - sincronización automática
 *
 * Si alguien llama processInspectionSyncQueue()
 * mientras ya existe una ejecución activa,
 * devolvemos exactamente la misma Promise.
 */

let activeQueueProcess: Promise<InspectionSyncQueueResult> | null = null;

/* -------------------------------------------------------------------------- */
/*                      OBTENER CANDIDATOS                                    */
/* -------------------------------------------------------------------------- */

/*
 * Devuelve las inspecciones que actualmente
 * deberían formar parte de la cola.
 *
 * Esta función NO modifica estados.
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
         * en proceso NO deben sincronizarse.
         */
        if (inspection.status !== "completed") {
          return false;
        }

        const syncStatus = inspection.integration?.syncStatus ?? "local";

        /*
         * pending:
         *
         * candidato principal.
         */
        if (syncStatus === "pending") {
          return true;
        }

        /*
         * error:
         *
         * puede reintentarse cuando
         * includeErrors sea true.
         */
        if (syncStatus === "error" && includeErrors) {
          return true;
        }

        /*
         * syncing:
         *
         * puede significar que la aplicación
         * se cerró o interrumpió mientras
         * sincronizaba.
         */
        if (syncStatus === "syncing" && includeInterrupted) {
          return true;
        }

        /*
         * local:
         *
         * formulario interno.
         *
         * No necesita Kobo.
         *
         *
         * synced:
         *
         * ya terminó correctamente.
         */
        return false;
      })
      /*
       * FIFO:
       *
       * primero procesamos las inspecciones
       * más antiguas.
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
/*                     CONSULTAR ESTADO DE LA COLA                            */
/* -------------------------------------------------------------------------- */

/*
 * Permite saber si actualmente
 * existe una sincronización activa.
 */
export function isInspectionSyncQueueProcessing(): boolean {
  return activeQueueProcess !== null;
}

/*
 * Devuelve la Promise activa.
 *
 * Puede ser útil posteriormente para:
 *
 * - indicadores globales;
 * - herramientas de desarrollo;
 * - esperar a que termine una sincronización;
 * - evitar lanzar procesos duplicados.
 */
export function getActiveInspectionSyncQueueProcess(): Promise<InspectionSyncQueueResult> | null {
  return activeQueueProcess;
}

/* -------------------------------------------------------------------------- */
/*                     PROCESAR COLA - FUNCIÓN PÚBLICA                        */
/* -------------------------------------------------------------------------- */

/*
 * ============================================================================
 * processInspectionSyncQueue()
 * ============================================================================
 *
 * Esta es la función que utilizarán:
 *
 * - sync-test
 * - futuro detector de conectividad
 * - futuro sincronizador automático
 *
 * Si ya existe una ejecución activa,
 * NO generamos otra.
 */
export function processInspectionSyncQueue(
  options: InspectionSyncQueueOptions = {},
): Promise<InspectionSyncQueueResult> {
  /*
   * Ya existe un proceso.
   *
   * Reutilizamos la misma Promise.
   */
  if (activeQueueProcess) {
    console.log("La cola de sincronización ya se encuentra en ejecución.");

    return activeQueueProcess;
  }

  /*
   * Creamos una nueva ejecución.
   */
  activeQueueProcess = processQueueInternal(options).finally(() => {
    /*
     * Tanto si finaliza correctamente
     * como si ocurre un error inesperado,
     * liberamos el bloqueo.
     */
    activeQueueProcess = null;
  });

  return activeQueueProcess;
}

/* -------------------------------------------------------------------------- */
/*                    PROCESAR COLA - IMPLEMENTACIÓN                          */
/* -------------------------------------------------------------------------- */

/*
 * La implementación real está separada de la función pública.
 *
 * Esto evita que una llamada recursiva o simultánea
 * pueda saltarse el control single-flight.
 */
async function processQueueInternal(
  options: InspectionSyncQueueOptions = {},
): Promise<InspectionSyncQueueResult> {
  /*
   * Tomamos una fotografía de la cola
   * en el momento de comenzar.
   *
   * Si aparece una inspección nueva mientras
   * estamos procesando, quedará para la
   * siguiente ejecución.
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
   * PROCESAMIENTO SECUENCIAL.
   *
   * No usamos Promise.all().
   *
   * Motivos:
   *
   * - mantiene orden FIFO;
   * - reduce carga sobre Kobo;
   * - facilita depuración;
   * - simplifica reintentos;
   * - evita varias submissions simultáneas.
   */
  for (const inspection of candidates) {
    const previousStatus = inspection.integration?.syncStatus ?? "local";

    try {
      /*
       * Cada inspección utiliza el mismo
       * servicio centralizado.
       */
      const syncResult = await syncInspection(inspection.id);

      result.processed += 1;

      /*
       * Clasificamos el resultado.
       */
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

      /*
       * Conservamos el resultado individual
       * para herramientas de diagnóstico
       * y futuras interfaces.
       */
      result.items.push({
        inspectionId: inspection.id,

        previousStatus,

        result: syncResult,
      });
    } catch (error) {
      /*
       * Normalmente syncInspection()
       * convierte errores Kobo en:
       *
       * status: "error"
       *
       * Este catch está pensado para fallos
       * inesperados:
       *
       * - almacenamiento;
       * - repositorio;
       * - programación;
       * - datos corruptos.
       */
      result.processed += 1;

      result.failed += 1;

      console.error(
        `Error inesperado procesando la inspección ${inspection.id}:`,
        error,
      );
    }
  }

  /*
   * Resumen útil para desarrollo.
   */
  console.log("Cola de sincronización procesada:", {
    totalCandidates: result.totalCandidates,

    processed: result.processed,

    synced: result.synced,

    failed: result.failed,

    skipped: result.skipped,
  });

  return result;
}
