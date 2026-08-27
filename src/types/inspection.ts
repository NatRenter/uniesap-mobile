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

  /*
   * Fecha general de la inspección.
   *
   * Se conserva por compatibilidad con pantallas,
   * reportes y datos existentes.
   */
  date: string;

  /*
   * Momento exacto en que se creó el registro.
   */
  createdAt: string;

  /*
   * Momento exacto de la última modificación.
   *
   * Dashboard y Trabajo utilizan este campo
   * para ordenar por actividad real.
   */
  updatedAt: string;

  status: InspectionStatus;

  responses: InspectionResponse[];

  evidenceIds: string[];

  integration?: InspectionIntegration;
};
