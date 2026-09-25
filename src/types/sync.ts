/*
 * ============================================================================
 * SINCRONIZACIÓN GENERAL DE UNIESAP
 * ============================================================================
 *
 * Este archivo contiene los tipos comunes que utilizarán las entidades
 * sincronizables de UNIESAP.
 *
 * Ejemplos:
 *
 * Company
 * Property
 * Form
 * Inspection
 * Evidence
 *
 * La sincronización general con UNIESAP API es independiente de
 * integraciones externas como Kobo.
 */

/*
 * ============================================================================
 * ESTADO DE SINCRONIZACIÓN
 * ============================================================================
 *
 * local
 *   El registro solamente existe localmente.
 *
 * pending
 *   Existe un cambio local que debe enviarse a UNIESAP API.
 *
 * syncing
 *   El cambio está siendo enviado.
 *
 * synced
 *   La versión local coincide con la última versión conocida del servidor.
 *
 * error
 *   El último intento de sincronización falló.
 */
export type SyncStatus = "local" | "pending" | "syncing" | "synced" | "error";

/*
 * ============================================================================
 * METADATOS DE SINCRONIZACIÓN
 * ============================================================================
 *
 * Estos datos NO forman parte del contenido empresarial de una entidad.
 *
 * Son información técnica utilizada para coordinar:
 *
 * SQLite
 *    ↕
 * UNIESAP API
 *    ↕
 * Base central
 */
export type SyncMetadata = {
  /*
   * Estado actual de sincronización.
   */
  status: SyncStatus;

  /*
   * Versión conocida del registro en el servidor.
   *
   * 0 significa que el registro todavía no tiene una versión
   * confirmada por UNIESAP API.
   *
   * Ejemplo:
   *
   * dispositivo crea Company
   * serverVersion = 0
   *
   * API acepta Company
   * serverVersion = 1
   *
   * Company vuelve a modificarse
   * servidor genera versión 2
   */
  serverVersion: number;

  /*
   * Identificador de una operación de sincronización.
   *
   * Permitirá que la API detecte reintentos de una misma operación
   * y evite crear registros duplicados.
   */
  operationId?: string;

  /*
   * Última sincronización confirmada por UNIESAP API.
   */
  lastSyncedAt?: string;

  /*
   * Último error conocido durante sincronización.
   *
   * Se conserva para diagnóstico y para informar al usuario
   * sin perder el registro local.
   */
  lastSyncError?: string;
};
