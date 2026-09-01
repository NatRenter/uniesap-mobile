import { useEffect, useRef } from "react";

import {
  getNetworkAvailability,
  subscribeToNetworkAvailability,
} from "@/services/networkService";

import {
  getInspectionSyncQueueCount,
  processInspectionSyncQueue,
} from "@/services/inspectionSyncQueueService";

import { subscribeToInspectionSyncRequests } from "@/services/inspectionSyncTriggerService";

/*
 * ============================================================================
 * SINCRONIZACIÓN AUTOMÁTICA DE INSPECCIONES
 * ============================================================================
 *
 * Este hook conecta tres fuentes de activación con una única cola:
 *
 * 1. ARRANQUE ONLINE
 *
 *    La aplicación termina de hidratar sus repositorios y descubre que
 *    ya existe conectividad.
 *
 *          ↓
 *
 *    procesa inspecciones pending.
 *
 *
 * 2. OFFLINE → ONLINE
 *
 *    El usuario capturó información sin Internet y después recupera
 *    conectividad.
 *
 *          ↓
 *
 *    procesa inspecciones pending.
 *
 *
 * 3. NUEVO PENDING MIENTRAS YA ESTAMOS ONLINE
 *
 *    El usuario finaliza una inspección cuando el dispositivo ya tenía
 *    Internet.
 *
 *    Como NetInfo no observa una transición de red, CaptureScreen emite
 *    una señal mediante inspectionSyncTriggerService.
 *
 *          ↓
 *
 *    este hook vuelve a revisar la cola.
 *
 *
 * IMPORTANTE:
 *
 * La UI nunca llama directamente a:
 *
 * - syncInspection();
 * - Kobo;
 * - attachments.
 *
 * Toda sincronización real continúa pasando por:
 *
 * InspectionSyncQueueService
 *        ↓
 * InspectionSyncService
 *        ↓
 * KoboInspectionService
 *
 * Esto mantiene:
 *
 * - protección contra procesos simultáneos;
 * - reintentos;
 * - recuperación de sincronizaciones interrumpidas;
 * - manejo de evidencias/attachments;
 * - una única ruta de sincronización.
 */

export type UseInspectionAutoSyncOptions = {
  /*
   * Permite instalar el hook antes de que los repositorios estén preparados.
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
   *   → todavía no conocemos el estado.
   *
   * false
   *   → offline.
   *
   * true
   *   → online.
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
     * Evita que el propio hook ejecute dos ciclos de AutoSync al mismo tiempo.
     *
     * InspectionSyncQueueService ya protege su proceso global con
     * activeQueueProcess, pero esta bandera evita además:
     *
     * - consultas redundantes;
     * - logs duplicados;
     * - ciclos paralelos dentro del hook.
     */
    let processing = false;

    /*
     * Si entra una nueva solicitud mientras ya estamos procesando,
     * recordamos que debemos revisar la cola una vez más al terminar.
     */
    let processAgain = false;

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
       * El AutoSync únicamente procesa la cola cuando conocemos
       * explícitamente que existe conectividad.
       *
       * Si todavía estamos en null, la comprobación inicial de red
       * terminará llamando handleNetworkState() y procesará la cola.
       */
      if (previousOnlineState.current !== true) {
        return;
      }

      /*
       * Si ya existe un ciclo ejecutándose no iniciamos otro.
       *
       * Solamente dejamos una marca para repetir la revisión
       * cuando finalice el ciclo actual.
       */
      if (processing) {
        processAgain = true;

        return;
      }

      processing = true;

      try {
        do {
          /*
           * Consumimos la solicitud acumulada.
           *
           * Si durante este ciclo aparece otra inspección pending,
           * requestInspectionSync() volverá a colocar processAgain = true.
           */
          processAgain = false;

          if (!active || previousOnlineState.current !== true) {
            return;
          }

          /*
           * Los errores anteriores NO se reintentan automáticamente.
           *
           * Las sincronizaciones interrumpidas sí pueden recuperarse.
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

          /*
           * NO repetimos la cola únicamente porque quede algún candidato.
           *
           * Algunos candidatos pueden ser omitidos por reglas internas
           * y repetir indefinidamente produciría un ciclo innecesario.
           *
           * Solamente repetimos si mientras estábamos procesando llegó
           * explícitamente una nueva señal de trabajo.
           */
        } while (
          active &&
          previousOnlineState.current === true &&
          processAgain
        );
      } catch (error) {
        /*
         * Los errores individuales de Kobo normalmente son tratados
         * por la propia cola.
         *
         * Este bloque captura fallos inesperados relacionados con:
         *
         * - repositorios;
         * - persistencia;
         * - infraestructura;
         * - ejecución de la cola.
         */
        console.error(
          "Error inesperado durante la sincronización automática:",
          error,
        );
      } finally {
        processing = false;
      }
    }

    /*
     * ========================================================================
     * ESTADO DE CONECTIVIDAD
     * ========================================================================
     *
     * Tanto:
     *
     * getNetworkAvailability()
     *
     * como:
     *
     * subscribeToNetworkAvailability()
     *
     * utilizan el mismo manejador.
     *
     * Actualizamos previousOnlineState ANTES de iniciar cualquier proceso
     * async para evitar que la comprobación inicial y el primer evento
     * de NetInfo disparen dos sincronizaciones.
     */

    function handleNetworkState(online: boolean) {
      if (!active) {
        return;
      }

      const previous = previousOnlineState.current;

      /*
       * Actualizamos primero para cerrar la posible carrera entre:
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
       * true  → true
       * false → false
       *
       * No hacemos nada.
       *
       * Las inspecciones nuevas creadas mientras permanecemos true → true
       * son cubiertas por inspectionSyncTriggerService.
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
         * Todo pasa por handleNetworkState().
         *
         * De esta forma la comprobación inicial y NetInfo comparten
         * exactamente las mismas reglas.
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
     */

    const unsubscribeNetwork = subscribeToNetworkAvailability((online) => {
      handleNetworkState(online);
    });

    /*
     * ========================================================================
     * NUEVO TRABAJO PENDIENTE
     * ========================================================================
     *
     * Cubre este caso:
     *
     * Internet ya disponible
     *          ↓
     * usuario finaliza inspección
     *          ↓
     * inspection.syncStatus = pending
     *          ↓
     * la red nunca cambió
     *          ↓
     * NetInfo no tiene una transición que anunciar
     *          ↓
     * requestInspectionSync()
     *          ↓
     * procesamos la cola.
     *
     * Si estamos offline, la señal se ignora de forma segura porque
     * la inspección ya quedó persistida. La transición posterior
     * offline → online se encargará de recuperarla.
     */

    const unsubscribeSyncRequests = subscribeToInspectionSyncRequests(() => {
      if (!active) {
        return;
      }

      if (previousOnlineState.current !== true) {
        return;
      }

      console.log(
        "Nueva inspección pendiente detectada. Solicitando sincronización automática.",
      );

      void processPendingInspections();
    });

    /*
     * ========================================================================
     * CLEANUP
     * ========================================================================
     */

    return () => {
      active = false;

      unsubscribeNetwork();
      unsubscribeSyncRequests();
    };
  }, [enabled]);
}
