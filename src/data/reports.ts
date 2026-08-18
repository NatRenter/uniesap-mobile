import type { Report } from "@/types/report";

export const reports: Report[] = [
  {
    id: "report-001",

    companyId: "company-001",
    propertyId: "property-001",
    inspectionId: "inspection-001",

    title: "Reporte de análisis de riesgos",

    format: "excel",
    status: "generated",

    includeEvidence: true,

    createdAt: "2026-08-10",
  },

  {
    id: "report-002",

    companyId: "company-001",
    propertyId: "property-001",
    inspectionId: "inspection-002",

    title: "Reporte de inspección de extintores",

    format: "excel",
    status: "pending",

    includeEvidence: true,

    createdAt: "2026-08-12",
  },

  {
    id: "report-003",

    companyId: "company-002",
    propertyId: "property-004",
    inspectionId: "inspection-004",

    title: "Reporte de análisis de riesgos - LALA",

    format: "pdf",
    status: "generated",

    includeEvidence: true,

    createdAt: "2026-08-14",
  },
];

export function getReportById(id: string) {
  return reports.find((report) => report.id === id);
}

export function getReportsByCompanyId(companyId: string) {
  return reports.filter((report) => report.companyId === companyId);
}

export function getReportsByInspectionId(inspectionId: string) {
  return reports.filter((report) => report.inspectionId === inspectionId);
}
