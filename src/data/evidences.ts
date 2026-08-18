import type { Evidence } from "@/types/evidence";

export const evidences: Evidence[] = [
  {
    id: "evidence-001",

    companyId: "company-001",
    propertyId: "property-001",
    inspectionId: "inspection-001",

    title: "Condición de ruta de evacuación",

    type: "photo",
    status: "synced",

    date: "2026-08-10",

    description:
      "Registro visual de las condiciones encontradas durante la inspección.",
  },

  {
    id: "evidence-002",

    companyId: "company-001",
    propertyId: "property-001",
    inspectionId: "inspection-001",

    title: "Área con condición de riesgo",

    type: "photo",
    status: "synced",

    date: "2026-08-10",

    description: "Evidencia complementaria asociada al análisis de riesgos.",
  },

  {
    id: "evidence-003",

    companyId: "company-001",
    propertyId: "property-001",
    inspectionId: "inspection-002",

    title: "Extintor área de ventas",

    type: "photo",
    status: "pending",

    date: "2026-08-12",

    description: "Fotografía registrada durante la revisión del equipo.",
  },

  {
    id: "evidence-004",

    companyId: "company-002",
    propertyId: "property-004",
    inspectionId: "inspection-004",

    title: "Evidencia LALA La Piedad",

    type: "photo",
    status: "synced",

    date: "2026-08-14",
  },
];

export function getEvidenceById(id: string) {
  return evidences.find((evidence) => evidence.id === id);
}

export function getEvidencesByCompanyId(companyId: string) {
  return evidences.filter((evidence) => evidence.companyId === companyId);
}

export function getEvidencesByInspectionId(inspectionId: string) {
  return evidences.filter((evidence) => evidence.inspectionId === inspectionId);
}
