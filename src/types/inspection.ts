export type InspectionResponseValue = string | number | boolean | null;

export type InspectionResponse = {
  questionId: string;
  value: InspectionResponseValue;
};

export type InspectionStatus = "draft" | "in_progress" | "completed";

export type InspectionSyncStatus = "local" | "pending" | "synced" | "error";

export type InspectionKoboReference = {
  provider: "kobo";

  assetUid: string;

  submissionId: string | number;

  uuid?: string;

  syncedAt?: string;
};

export type InspectionIntegration = {
  syncStatus: InspectionSyncStatus;

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
