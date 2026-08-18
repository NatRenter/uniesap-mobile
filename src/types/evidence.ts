export type EvidenceType = "photo" | "document";

export type EvidenceStatus = "pending" | "synced";

export type Evidence = {
  id: string;

  companyId: string;
  propertyId: string;
  inspectionId: string;

  title: string;

  type: EvidenceType;
  status: EvidenceStatus;

  date: string;

  description?: string;

  localUri?: string;
  remoteUri?: string;
};
