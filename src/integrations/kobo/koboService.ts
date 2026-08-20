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

  /*
   * Crear una nueva captura.
   *
   * Este método será utilizado por
   * CaptureScreen después de transformar:
   *
   * InspectionResponse[]
   *        ↓
   * KoboSubmissionData
   */
  createSubmission(
    assetUid: string,
    data: KoboSubmissionData,
  ): Promise<KoboSubmissionReference>;
}
