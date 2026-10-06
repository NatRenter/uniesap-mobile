import { getCompaniesPendingSync } from "@/repositories/companyRepository";

import {
    syncCompany,
    type CompanySyncResult,
} from "@/services/companySyncService";

import type { Company } from "@/types/company";

/*
 * ============================================================================
 * COLA DE SINCRONIZACIÓN DE EMPRESAS
 * ============================================================================
 *
 * Esta capa procesa las empresas que necesitan sincronización con
 * la API central de UNIESAP.
 *
 * La cola NO:
 *
 * - conoce la interfaz;
 * - realiza peticiones HTTP directamente;
 * - conoce Kobo;
 * - crea operationId;
 * - modifica datos empresariales.
 *
 * Su responsabilidad es:
 *
 * 1. localizar empresas pendientes;
 * 2. ordenar los candidatos;
 * 3. procesarlos uno por uno;
 * 4. delegar cada operación a syncCompany();
 * 5. impedir ejecuciones simultáneas.
 *
 * Arquitectura:
 *
 * companyRepository
 *        ↓
 * companySyncQueueService
 *        ↓
 * companySyncService
 *        ↓
 * companyApiService
 *        ↓
 * uniesapApiRequest
 *        ↓
 * UNIESAP API
 */

/* -------------------------------------------------------------------------- */
/*                              OPCIONES                                      */
/* -------------------------------------------------------------------------- */

export type CompanySyncQueueOptions = {
  /*
   * Permite limitar la ejecución a empresas concretas.
   *
   * Si se omite, se procesa toda la cola.
   */
  companyIds?: string[];

  /*
   * Permite incluir registros que anteriormente terminaron en error.
   *
   * Por defecto:
   *
   * true
   */
  includeErrors?: boolean;

  /*
   * Permite recuperar registros que quedaron en syncing porque la
   * aplicación se cerró o el proceso fue interrumpido.
   *
   * Por defecto:
   *
   * true
   */
  includeInterrupted?: boolean;

  /*
   * Los registros "local" se consideran candidatos por compatibilidad
   * con datos creados durante etapas anteriores del prototipo.
   *
   * Por defecto:
   *
   * true
   */
  includeLocal?: boolean;
};

/* -------------------------------------------------------------------------- */
/*                         RESULTADO INDIVIDUAL                               */
/* -------------------------------------------------------------------------- */

export type CompanySyncQueueItemResult = {
  companyId: string;

  previousStatus: Company["sync"]["status"];

  result: CompanySyncResult;
};

/* -------------------------------------------------------------------------- */
/*                           RESULTADO GLOBAL                                 */
/* -------------------------------------------------------------------------- */

export type CompanySyncQueueResult = {
  totalCandidates: number;

  processed: number;

  synced: number;

  failed: number;

  skipped: number;

  items: CompanySyncQueueItemResult[];
};

/* -------------------------------------------------------------------------- */
/*                           SINGLE-FLIGHT                                    */
/* -------------------------------------------------------------------------- */

/*
 * Solo permitimos una ejecución global de esta cola al mismo tiempo.
 *
 * Si dos disparadores intentan sincronizar simultáneamente:
 *
 * - inicio de aplicación;
 * - recuperación de conexión;
 * - botón manual;
 *
 * ambos compartirán la misma Promise.
 */
let activeQueueProcess: Promise<CompanySyncQueueResult> | null = null;

/* -------------------------------------------------------------------------- */
/*                         OBTENER CANDIDATOS                                 */
/* -------------------------------------------------------------------------- */

export function getCompanySyncQueue(
  options: CompanySyncQueueOptions = {},
): Company[] {
  const {
    companyIds,
    includeErrors = true,
    includeInterrupted = true,
    includeLocal = true,
  } = options;

  /*
   * Esta consulta incluye también tombstones.
   */
  const companies = getCompaniesPendingSync();

  const allowedCompanyIds = companyIds ? new Set(companyIds) : undefined;

  return (
    companies
      .filter((company) => {
        /*
         * Si la cola fue limitada a determinados IDs,
         * descartamos el resto.
         */
        if (allowedCompanyIds && !allowedCompanyIds.has(company.id)) {
          return false;
        }

        const syncStatus = company.sync.status;

        /*
         * pending es el candidato normal.
         */
        if (syncStatus === "pending") {
          return true;
        }

        /*
         * error representa una operación que puede reintentarse.
         */
        if (syncStatus === "error") {
          return includeErrors;
        }

        /*
         * syncing puede representar una ejecución interrumpida.
         */
        if (syncStatus === "syncing") {
          return includeInterrupted;
        }

        /*
         * local se mantiene como compatibilidad con registros antiguos
         * que todavía no hayan recibido metadata pending.
         */
        if (syncStatus === "local") {
          return includeLocal;
        }

        return false;
      })
      /*
       * FIFO:
       *
       * primero procesamos los cambios empresariales más antiguos.
       *
       * updatedAt representa cuándo ocurrió la última modificación
       * real del registro.
       */
      .sort(
        (first, second) =>
          new Date(first.updatedAt).getTime() -
          new Date(second.updatedAt).getTime(),
      )
  );
}

/* -------------------------------------------------------------------------- */
/*                            CONTAR COLA                                     */
/* -------------------------------------------------------------------------- */

export function getCompanySyncQueueCount(
  options: CompanySyncQueueOptions = {},
): number {
  return getCompanySyncQueue(options).length;
}

/* -------------------------------------------------------------------------- */
/*                       CONSULTAR EJECUCIÓN                                  */
/* -------------------------------------------------------------------------- */

export function isCompanySyncQueueProcessing(): boolean {
  return activeQueueProcess !== null;
}

export function getActiveCompanySyncQueueProcess(): Promise<CompanySyncQueueResult> | null {
  return activeQueueProcess;
}

/* -------------------------------------------------------------------------- */
/*                          PROCESAR COLA                                     */
/* -------------------------------------------------------------------------- */

export function processCompanySyncQueue(
  options: CompanySyncQueueOptions = {},
): Promise<CompanySyncQueueResult> {
  /*
   * Si ya existe una ejecución activa reutilizamos exactamente
   * la misma Promise.
   */
  if (activeQueueProcess) {
    console.log(
      "La cola de sincronización de empresas ya se encuentra en ejecución.",
    );

    return activeQueueProcess;
  }

  activeQueueProcess = processQueueInternal(options).finally(() => {
    /*
     * Liberamos single-flight independientemente del resultado.
     */
    activeQueueProcess = null;
  });

  return activeQueueProcess;
}

/* -------------------------------------------------------------------------- */
/*                     IMPLEMENTACIÓN INTERNA                                 */
/* -------------------------------------------------------------------------- */

async function processQueueInternal(
  options: CompanySyncQueueOptions = {},
): Promise<CompanySyncQueueResult> {
  /*
   * Tomamos una fotografía de los candidatos al comenzar.
   *
   * Si aparece una nueva operación mientras estamos procesando,
   * quedará para la siguiente ejecución.
   */
  const candidates = getCompanySyncQueue(options);

  const result: CompanySyncQueueResult = {
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
   * procesamiento SECUENCIAL.
   *
   * No utilizamos Promise.all().
   *
   * Esto:
   *
   * - conserva FIFO;
   * - reduce concurrencia innecesaria;
   * - facilita depuración;
   * - simplifica reintentos;
   * - prepara el camino para dependencias futuras.
   */
  for (const company of candidates) {
    const previousStatus = company.sync.status;

    try {
      const syncResult = await syncCompany(company.id);

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
        companyId: company.id,

        previousStatus,

        result: syncResult,
      });
    } catch (error) {
      /*
       * syncCompany() normalmente convierte los fallos de transporte
       * en status: "error".
       *
       * Este catch queda reservado para errores inesperados del
       * repository, persistencia o programación.
       */
      result.processed += 1;

      result.failed += 1;

      console.error(
        `Error inesperado procesando la empresa ${company.id}:`,
        error,
      );
    }
  }

  console.log("Cola de sincronización de empresas procesada:", {
    totalCandidates: result.totalCandidates,

    processed: result.processed,

    synced: result.synced,

    failed: result.failed,

    skipped: result.skipped,
  });

  return result;
}
