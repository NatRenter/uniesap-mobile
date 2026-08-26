export type EvidenceType = "photo" | "document";

export type EvidenceStatus = "pending" | "synced";

/*
 * ============================================================================
 * INTEGRACIÓN KOBO DE UNA EVIDENCIA
 * ============================================================================
 *
 * Cada archivo conserva su propia identidad de subida.
 *
 * Esto permite que una inspección con muchas fotografías pueda reintentarse
 * sin volver a subir las que ya fueron aceptadas.
 */
export type EvidenceKoboIntegration = {
  provider: "kobo";

  /*
   * Clave estable para esta evidencia.
   *
   * No cambia aunque la aplicación se reinicie.
   */
  uploadOperationId: string;

  /*
   * Referencia devuelta por Kobo/Mock cuando el archivo fue aceptado.
   */
  attachmentId?: string;

  assetUid?: string;

  submissionId?: string | number;

  uploadedAt?: string;

  /*
   * Último error individual de esta evidencia.
   */
  lastUploadError?: string;
};

export type EvidenceIntegration = {
  kobo?: EvidenceKoboIntegration;
};

export type Evidence = {
  id: string;

  companyId: string;
  propertyId: string;
  inspectionId: string;

  questionId?: string;

  title: string;

  type: EvidenceType;
  status: EvidenceStatus;

  date: string;

  description?: string;

  localUri?: string;
  remoteUri?: string;

  mimeType?: string;
  fileName?: string;
  fileSize?: number;

  createdAt?: string;

  /*
   * Metadatos de sincronización del archivo.
   */
  integration?: EvidenceIntegration;
};
