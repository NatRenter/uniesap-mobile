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
 * Comportamiento:
 *
 * ARRANQUE ONLINE
 *      ↓
 * procesa pending una sola vez
 *
 *
 * OFFLINE
 *      ↓
 * ONLINE
 *      ↓
 * procesa pending
 *
 *
 * IMPORTANTE:
 *
 * Tanto la comprobación inicial como NetInfo pueden informar
 * prácticamente al mismo tiempo que existe conexión.
 *
 * Por eso toda transición de red pasa ahora por:
 *
 * handleNetworkState()
 *
 * De esta forma solo el primer evento válido puede disparar
 * el procesamiento.
 */

export type UseInspectionAutoSyncOptions = {
  /*
   * Permite instalar el hook antes de que
   * los repositorios estén preparados.
   *
   * Android:
   *
   * SQLite
   *   +
   * hydrateInspectionRepository()
   *   +
   * hydrateEvidenceRepository()
   *          ↓
   * enabled = true
   */
  enabled?: boolean;
};

export function useInspectionAutoSync({
  enabled = true,
}: UseInspectionAutoSyncOptions = {}) {
  /*
   * ==========================================================================
   * ÚLTIMO ESTADO DE RED
   * ==========================================================================
   *
   * null
   *   → todavía no conocemos el estado
   *
   * false
   *   → offline
   *
   * true
   *   → online
   */
  const previousOnlineState = useRef<boolean | null>(null);

  /*
   * ==========================================================================
   * EFECTO PRINCIPAL
   * ==========================================================================
   */

  useEffect(() => {
    if (!enabled) {
      /*
       * Si los repositorios dejan de estar preparados,
       * descartamos el estado anterior.
       */
      previousOnlineState.current = null;

      return;
    }

    let active = true;

    /*
     * ========================================================================
     * PROCESAR TRABAJO PENDIENTE
     * ========================================================================
     */

    async function processPendingInspections() {
      if (!active) {
        return;
      }

      /*
       * Los errores anteriores NO se reintentan
       * automáticamente todavía.
       *
       * Las sincronizaciones interrumpidas sí
       * pueden recuperarse.
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
         * Los errores individuales de Kobo son
         * tratados normalmente por la cola.
         *
         * Este bloque captura fallos inesperados
         * relacionados con repositorios,
         * almacenamiento o infraestructura.
         */
        console.error(
          "Error inesperado durante la sincronización automática:",
          error,
        );
      }
    }

    /*
     * ========================================================================
     * ESTADO DE CONECTIVIDAD
     * ========================================================================
     *
     * ESTA ES LA PARTE IMPORTANTE DEL CAMBIO.
     *
     * Tanto:
     *
     * getNetworkAvailability()
     *
     * como:
     *
     * subscribeToNetworkAvailability()
     *
     * utilizan esta misma función.
     *
     * Debido a que actualizamos previousOnlineState
     * ANTES de lanzar cualquier proceso async,
     * un segundo evento online inmediatamente posterior
     * ya encontrará:
     *
     * previous === true
     *
     * y no iniciará otro procesamiento.
     */

    function handleNetworkState(online: boolean) {
      if (!active) {
        return;
      }

      const previous = previousOnlineState.current;

      /*
       * Actualizamos primero.
       *
       * Esto es esencial para evitar la carrera entre:
       *
       * comprobación inicial
       *      +
       * primer evento NetInfo.
       */
      previousOnlineState.current = online;

      /*
       * ----------------------------------------------------------------------
       * PRIMER ESTADO CONOCIDO
       * ----------------------------------------------------------------------
       */

      if (previous === null) {
        if (online) {
          console.log("Conexión disponible.");

          void processPendingInspections();
        } else {
          console.log("Sin conexión.");
        }

        return;
      }

      /*
       * ----------------------------------------------------------------------
       * SIN CAMBIO REAL
       * ----------------------------------------------------------------------
       *
       * true → true
       *
       * false → false
       *
       * No hacemos nada.
       */

      if (previous === online) {
        return;
      }

      /*
       * ----------------------------------------------------------------------
       * OFFLINE → ONLINE
       * ----------------------------------------------------------------------
       */

      if (previous === false && online === true) {
        console.log("Conexión recuperada.");

        void processPendingInspections();

        return;
      }

      /*
       * ----------------------------------------------------------------------
       * ONLINE → OFFLINE
       * ----------------------------------------------------------------------
       */

      if (previous === true && online === false) {
        console.log("Conexión perdida.");
      }
    }

    /*
     * ========================================================================
     * COMPROBACIÓN INICIAL
     * ========================================================================
     */

    async function initializeNetworkState() {
      try {
        const online = await getNetworkAvailability();

        /*
         * Ya no procesamos la cola directamente aquí.
         *
         * Todo pasa por handleNetworkState().
         */
        handleNetworkState(online);
      } catch (error) {
        if (!active) {
          return;
        }

        console.error(
          "No fue posible obtener el estado inicial de conectividad:",
          error,
        );
      }
    }

    /*
     * Lanzamos la comprobación inicial.
     */
    void initializeNetworkState();

    /*
     * ========================================================================
     * CAMBIOS DE CONECTIVIDAD
     * ========================================================================
     *
     * NetInfo también utiliza exactamente
     * el mismo manejador.
     */

    const unsubscribe = subscribeToNetworkAvailability((online) => {
      handleNetworkState(online);
    });

    /*
     * ========================================================================
     * CLEANUP
     * ========================================================================
     */

    return () => {
      active = false;

      unsubscribe();
    };
  }, [enabled]);
}
