/*
 * ============================================================================
 * INSPECTION SYNC TRIGGER SERVICE
 * ============================================================================
 *
 * Este servicio NO sincroniza inspecciones y NO conoce Kobo.
 *
 * Su única responsabilidad es emitir una señal en memoria indicando:
 *
 * "Acaba de aparecer trabajo nuevo que podría necesitar sincronización."
 *
 * Flujo:
 *
 * CaptureScreen
 *      ↓
 * requestInspectionSync()
 *      ↓
 * useInspectionAutoSync()
 *      ↓
 * InspectionSyncQueueService
 *      ↓
 * InspectionSyncService
 *      ↓
 * Kobo
 *
 * Esta separación evita que una pantalla:
 *
 * - procese directamente la cola;
 * - invoque syncInspection();
 * - conozca detalles de Kobo;
 * - duplique responsabilidades del motor de sincronización.
 *
 * IMPORTANTE:
 *
 * La señal es deliberadamente efímera.
 *
 * Si se emite estando offline, no pasa nada: la inspección ya está
 * persistida como "pending" y, cuando regrese Internet, el listener
 * de conectividad de useInspectionAutoSync() volverá a consultar la cola.
 */

type InspectionSyncRequestListener = () => void;

/*
 * Conjunto de consumidores actualmente suscritos.
 *
 * Utilizamos Set para:
 *
 * - evitar listeners duplicados;
 * - permitir alta/baja sencilla;
 * - no depender de React dentro de este servicio.
 */
const listeners = new Set<InspectionSyncRequestListener>();

/*
 * ============================================================================
 * SOLICITAR REVISIÓN DE LA COLA
 * ============================================================================
 *
 * No realiza trabajo async.
 *
 * Únicamente informa a los listeners activos de que conviene volver
 * a revisar InspectionSyncQueueService.
 */
export function requestInspectionSync(): void {
  for (const listener of listeners) {
    listener();
  }
}

/*
 * ============================================================================
 * SUSCRIBIRSE
 * ============================================================================
 *
 * Devuelve una función de cleanup compatible con useEffect().
 */
export function subscribeToInspectionSyncRequests(
  listener: InspectionSyncRequestListener,
): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}
