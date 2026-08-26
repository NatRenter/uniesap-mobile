export type InspectionResponseValue = string | number | boolean | null;

export type InspectionResponse = {
  questionId: string;
  value: InspectionResponseValue;
};

export type InspectionStatus = "draft" | "in_progress" | "completed";

export type InspectionSyncStatus =
  | "local"
  | "pending"
  | "synced"
  | "error"
  | "syncing";

export type InspectionKoboReference = {
  provider: "kobo";

  assetUid: string;

  submissionId: string | number;

  uuid?: string;

  syncedAt?: string;
};

export type InspectionIntegration = {
  syncStatus: InspectionSyncStatus;

  /*
   * Identificador estable de la operación de sincronización.
   *
   * Se genera una sola vez y se reutiliza en todos los reintentos.
   */
  syncOperationId?: string;

  /*
   * Número de intentos realizados para esta misma operación.
   */
  syncAttempt?: number;

  kobo?: InspectionKoboReference;

  lastSyncError?: string;
};

export type Inspection = {
  id: string;

  companyId: string;

  propertyId: string;

  formId: string;

  inspector: string;

  date: string;

  status: InspectionStatus;

  responses: InspectionResponse[];

  evidenceIds: string[];

  integration?: InspectionIntegration;
};
