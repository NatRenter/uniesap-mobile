export type ReportFormat = "excel" | "pdf";

export type ReportStatus = "pending" | "generated";

export type Report = {
  id: string;

  companyId: string;
  propertyId: string;
  inspectionId: string;

  title: string;

  format: ReportFormat;
  status: ReportStatus;

  includeEvidence: boolean;

  createdAt: string;

  fileUri?: string;
};
