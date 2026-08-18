export type InspectionStatus = "draft" | "in_progress" | "completed";

export type InspectionResponse = {
  questionId: string;
  value: string | number | boolean | null;
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
};
