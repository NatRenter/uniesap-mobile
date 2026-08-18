import type {
    KoboAssetReference,
    KoboSubmissionData,
    KoboSubmissionId,
    KoboSubmissionReference,
} from "./types";

export interface KoboService {
  /*
   * Obtener información básica
   * del formulario/proyecto Kobo.
   */
  getAsset(assetUid: string): Promise<KoboAssetReference>;

  /*
   * Obtener las capturas de
   * un formulario Kobo.
   */
  getSubmissions(assetUid: string): Promise<KoboSubmissionReference[]>;

  /*
   * Obtener una captura específica.
   */
  getSubmission(
    assetUid: string,
    submissionId: KoboSubmissionId,
  ): Promise<KoboSubmissionData>;
}
