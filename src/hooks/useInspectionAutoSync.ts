import { useEffect, useRef } from "react";

import {
    getNetworkAvailability,
    subscribeToNetworkAvailability,
} from "@/services/networkService";

import {
    getInspectionSyncQueueCount,
    processInspectionSyncQueue,
} from "@/services/inspectionSyncQueueService";

/*
 * ============================================================================
 * SINCRONIZACIÓN AUTOMÁTICA DE INSPECCIONES
 * ============================================================================
 *
 * Este hook conecta:
 *
 * conectividad
 *      ↓
 * cola de sincronización
 *
 *
 * Su comportamiento actual es deliberadamente conservador:
 *
 * ONLINE
 *   ↓
 * procesa pending
 *   ↓
 * recupera syncing interrumpidas
 *
 *
 * ERROR
 *
 * No se reintenta automáticamente todavía.
 * El usuario conserva el control mediante el botón manual.
 */

export type UseInspectionAutoSyncOptions = {
  /*
   * Permite mantener instalado el hook pero impedir
   * que actúe hasta que la aplicación esté preparada.
   *
   * En Android será true después de:
   *
   * SQLite
   * +
   * hydrateInspectionRepository()
   */
  enabled?: boolean;
};

export function useInspectionAutoSync({
  enabled = true,
}: UseInspectionAutoSyncOptions = {}) {
  /*
   * Conservamos el último estado conocido para detectar:
   *
   * offline → online
   *
   * y no reaccionar innecesariamente varias veces
   * ante el mismo estado.
   */
  const previousOnlineState = useRef<boolean | null>(null);

  useEffect(() => {
    if (!enabled) {
      previousOnlineState.current = null;

      return;
    }

    let active = true;

    /*
     * ================================================================
     * PROCESAR SI EXISTE TRABAJO PENDIENTE
     * ================================================================
     */
    async function processPendingInspections() {
      if (!active) {
        return;
      }

      /*
       * Importante:
       *
       * includeErrors = false
       *
       * Los errores anteriores NO se reintentan
       * automáticamente todavía.
       *
       * includeInterrupted = true
       *
       * Una inspección que quedó en "syncing"
       * por un cierre inesperado sí puede recuperarse.
       */
      const pendingCount = getInspectionSyncQueueCount({
        includeErrors: false,

        includeInterrupted: true,
      });

      if (pendingCount === 0) {
        return;
      }

      console.log(
        `Conectividad disponible. Procesando ${pendingCount} inspección(es) pendiente(s).`,
      );

      try {
        const result = await processInspectionSyncQueue({
          includeErrors: false,

          includeInterrupted: true,
        });

        if (!active) {
          return;
        }

        console.log("Sincronización automática finalizada:", {
          candidatos: result.totalCandidates,

          sincronizadas: result.synced,

          errores: result.failed,

          omitidas: result.skipped,
        });
      } catch (error) {
        /*
         * La cola individual maneja normalmente
         * los errores Kobo.
         *
         * Este catch protege principalmente contra
         * fallos inesperados del repositorio o almacenamiento.
         */
        console.error(
          "Error inesperado durante la sincronización automática:",
          error,
        );
      }
    }

    /*
     * ================================================================
     * COMPROBACIÓN INICIAL
     * ================================================================
     *
     * Si la aplicación arranca con Internet y existen
     * inspecciones pending de una sesión anterior,
     * intentamos procesarlas.
     */
    async function initializeNetworkState() {
      try {
        const online = await getNetworkAvailability();

        if (!active) {
          return;
        }

        previousOnlineState.current = online;

        if (online) {
          await processPendingInspections();
        }
      } catch (error) {
        console.error(
          "No fue posible obtener el estado inicial de conectividad:",
          error,
        );
      }
    }

    void initializeNetworkState();

    /*
     * ================================================================
     * CAMBIOS DE CONECTIVIDAD
     * ================================================================
     */
    const unsubscribe = subscribeToNetworkAvailability((online) => {
      if (!active) {
        return;
      }

      const previous = previousOnlineState.current;

      previousOnlineState.current = online;

      /*
       * Solo nos interesa especialmente:
       *
       * offline
       *    ↓
       * online
       */
      const connectionRecovered = previous === false && online === true;

      /*
       * Si NetInfo emite el primer estado antes de que
       * fetch() haya terminado también podemos procesar
       * los pendientes.
       */
      const firstOnlineState = previous === null && online === true;

      if (connectionRecovered || firstOnlineState) {
        console.log(
          connectionRecovered ? "Conexión recuperada." : "Conexión disponible.",
        );

        void processPendingInspections();
      }
    });

    return () => {
      active = false;

      unsubscribe();
    };
  }, [enabled]);
}
