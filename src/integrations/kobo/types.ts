export type KoboAssetUid = string;

export type KoboSubmissionId = string | number;

export type KoboAssetReference = {
  assetUid: KoboAssetUid;

  deploymentStatus?: "draft" | "deployed" | "archived";

  versionUid?: string;

  syncedAt?: string;
};

export type KoboSubmissionReference = {
  assetUid: KoboAssetUid;

  submissionId: KoboSubmissionId;

  uuid?: string;

  submittedAt?: string;

  syncedAt?: string;
};

export type KoboSubmissionData = Record<
  string,
  string | number | boolean | null
>;

/*
 * ============================================================================
 * ATTACHMENT KOBO
 * ============================================================================
 *
 * Cada evidencia lleva una clave estable uploadOperationId.
 *
 * Esa clave permite reintentar una foto sin crear otra subida.
 */
export type KoboSubmissionAttachment = {
  evidenceId: string;

  questionId: string;

  uploadOperationId: string;

  fieldName: string;

  fileName: string;

  mimeType?: string;

  fileSize?: number;

  localUri?: string;

  remoteUri?: string;
};

/*
 * Referencia devuelta después de aceptar una evidencia.
 */
export type KoboAttachmentReference = {
  assetUid: KoboAssetUid;

  submissionId: KoboSubmissionId;

  attachmentId: string;

  evidenceId: string;

  uploadOperationId: string;

  fileName: string;

  uploadedAt?: string;
};

/*
 * ============================================================================
 * PAQUETE DE SUBMISSION
 * ============================================================================
 *
 * createSubmission registra la submission principal.
 *
 * attachments se mantienen en el paquete para diagnóstico/auditoría,
 * pero cada archivo se confirma individualmente mediante uploadAttachment().
 */
export type KoboSubmissionPackage = {
  operationId: string;

  data: KoboSubmissionData;

  attachments: KoboSubmissionAttachment[];
};

export type KoboConnectionStatus =
  | "unknown"
  | "connected"
  | "disconnected"
  | "error";
