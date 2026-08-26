import type {
  KoboAssetReference,
  KoboAttachmentReference,
  KoboSubmissionAttachment,
  KoboSubmissionData,
  KoboSubmissionId,
  KoboSubmissionPackage,
  KoboSubmissionReference,
} from "./types";

/*
 * ============================================================================
 * CONTRATO DEL SERVICIO KOBO
 * ============================================================================
 *
 * Todas las implementaciones de Kobo deben cumplir este contrato:
 *
 * - MockKoboService
 * - RemoteKoboService
 *
 * De esta forma el resto de UNIESAP no necesita saber
 * si está trabajando con Kobo Mock o con Kobo real.
 */

export interface KoboService {
  /*
   * --------------------------------------------------------------------------
   * OBTENER ASSET
   * --------------------------------------------------------------------------
   *
   * Recupera información básica de un formulario/proyecto Kobo.
   */
  getAsset(assetUid: string): Promise<KoboAssetReference>;

  /*
   * --------------------------------------------------------------------------
   * LISTAR SUBMISSIONS
   * --------------------------------------------------------------------------
   *
   * Devuelve las submissions conocidas para un asset.
   */
  getSubmissions(assetUid: string): Promise<KoboSubmissionReference[]>;

  /*
   * --------------------------------------------------------------------------
   * OBTENER UNA SUBMISSION
   * --------------------------------------------------------------------------
   *
   * Recupera los datos normales almacenados en una submission.
   */
  getSubmission(
    assetUid: string,
    submissionId: KoboSubmissionId,
  ): Promise<KoboSubmissionData>;

  /*
   * --------------------------------------------------------------------------
   * CREAR SUBMISSION
   * --------------------------------------------------------------------------
   *
   * Crea o recupera la submission principal de una inspección.
   *
   * KoboSubmissionPackage incluye:
   *
   * - operationId;
   * - data;
   * - attachments.
   *
   * operationId permite que un reintento no cree
   * otra submission para la misma inspección.
   */
  createSubmission(
    assetUid: string,
    submission: KoboSubmissionPackage,
  ): Promise<KoboSubmissionReference>;

  /*
   * --------------------------------------------------------------------------
   * SUBIR ATTACHMENT
   * --------------------------------------------------------------------------
   *
   * Procesa UNA evidencia individual.
   *
   * Esto es diferente de createSubmission():
   *
   * createSubmission()
   *      ↓
   * registra la inspección principal
   *
   * uploadAttachment()
   *      ↓
   * registra cada fotografía/documento
   *
   *
   * Cada KoboSubmissionAttachment contiene:
   *
   * uploadOperationId
   *
   * que funciona como identificador idempotente de esa evidencia.
   *
   * Gracias a esto, si una inspección tiene 20 fotografías
   * y solamente se subieron 12 antes de un fallo:
   *
   * reintento
   *   ↓
   * fotos 1-12 → reconocidas
   * fotos 13-20 → continúan
   */
  uploadAttachment(
    assetUid: string,
    submissionId: KoboSubmissionId,
    attachment: KoboSubmissionAttachment,
  ): Promise<KoboAttachmentReference>;
}
