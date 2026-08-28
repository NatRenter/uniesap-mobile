import type { Report } from "@/types/report";

/*
 * ============================================================================
 * REPORT SEED
 * ============================================================================
 *
 * Estos reportes son datos iniciales de desarrollo.
 *
 * Solamente se utilizarán cuando la persistencia de reportes
 * todavía esté completamente vacía.
 *
 * A diferencia de src/data/reports.ts, este archivo NO será
 * consultado directamente por las pantallas.
 *
 * Flujo:
 *
 * ReportSeed
 *     ↓
 * ReportRepository
 *     ↓
 * SQLite / localStorage
 */

export const initialReports: Report[] = [
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
