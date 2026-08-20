import type {
    Inspection,
    InspectionResponse,
    InspectionStatus,
    InspectionSyncStatus,
} from "@/types/inspection";

/*
 * ============================================================================
 * REPOSITORIO DE INSPECCIONES
 * ============================================================================
 *
 * Esta será la fuente única de inspecciones dentro de UNIESAP.
 *
 * En esta etapa seguimos utilizando almacenamiento en memoria.
 *
 * Más adelante podremos cambiar internamente esta implementación por:
 *
 * - SQLite
 * - almacenamiento persistente local
 * - backend de UNIESAP
 * - sincronización offline
 *
 * sin necesidad de cambiar las pantallas que consumen el repositorio.
 */

/* -------------------------------------------------------------------------- */
/*                          DATOS INICIALES MOCK                              */
/* -------------------------------------------------------------------------- */

/*
 * Movemos aquí las inspecciones que anteriormente vivían
 * en src/data/inspections.ts.
 *
 * Así conservamos las capturas de demostración existentes,
 * pero desde ahora pertenecen al mismo almacén donde se
 * crearán las nuevas inspecciones.
 */
export const inspections: Inspection[] = [
  {
    id: "inspection-001",

    companyId: "company-001",
    propertyId: "property-001",
    formId: "form-001",

    inspector: "Alexis",

    date: "2026-08-10",

    status: "completed",

    responses: [
      {
        questionId: "question-001",
        value: "Alexis",
      },

      {
        questionId: "question-002",
        value: true,
      },

      {
        questionId: "question-003",
        value: "Se identificaron condiciones que requieren seguimiento.",
      },
    ],

    evidenceIds: ["evidence-001", "evidence-002"],
  },

  {
    id: "inspection-002",

    companyId: "company-001",
    propertyId: "property-001",
    formId: "form-002",

    inspector: "Alexis",

    date: "2026-08-12",

    status: "in_progress",

    responses: [
      {
        questionId: "question-005",
        value: "EXT-001",
      },
    ],

    evidenceIds: ["evidence-003"],
  },

  {
    id: "inspection-003",

    companyId: "company-001",
    propertyId: "property-003",
    formId: "form-003",

    inspector: "Alexis",

    date: "2026-08-13",

    status: "draft",

    responses: [],

    evidenceIds: [],
  },

  {
    id: "inspection-004",

    companyId: "company-002",
    propertyId: "property-004",
    formId: "form-001",

    inspector: "Alexis",

    date: "2026-08-14",

    status: "completed",

    responses: [
      {
        questionId: "question-001",
        value: "Alexis",
      },

      {
        questionId: "question-002",
        value: true,
      },
    ],

    evidenceIds: ["evidence-004"],
  },
];

/* -------------------------------------------------------------------------- */
/*                           TIPOS DE CREACIÓN                                */
/* -------------------------------------------------------------------------- */

export type CreateInspectionInput = {
  companyId: string;

  propertyId: string;

  formId: string;

  inspector: string;

  responses: InspectionResponse[];

  status: InspectionStatus;

  syncStatus: InspectionSyncStatus;

  /*
   * Permitimos asociar evidencias desde la creación,
   * aunque actualmente CaptureScreen todavía no genera
   * evidencias reales.
   */
  evidenceIds?: string[];
};

/* -------------------------------------------------------------------------- */
/*                              CONSULTAS                                     */
/* -------------------------------------------------------------------------- */

export function getInspections(): Inspection[] {
  /*
   * Devolvemos una copia para evitar que una pantalla
   * modifique accidentalmente el arreglo original.
   */
  return [...inspections];
}

export function getInspectionById(id: string): Inspection | undefined {
  return inspections.find((inspection) => inspection.id === id);
}

export function getInspectionsByCompanyId(companyId: string): Inspection[] {
  return inspections.filter((inspection) => inspection.companyId === companyId);
}

export function getInspectionsByPropertyId(propertyId: string): Inspection[] {
  return inspections.filter(
    (inspection) => inspection.propertyId === propertyId,
  );
}

/* -------------------------------------------------------------------------- */
/*                               CREACIÓN                                     */
/* -------------------------------------------------------------------------- */

export function createInspection(input: CreateInspectionInput): Inspection {
  const inspection: Inspection = {
    id: createInspectionId(),

    companyId: input.companyId,

    propertyId: input.propertyId,

    formId: input.formId,

    inspector: input.inspector,

    date: new Date().toISOString(),

    status: input.status,

    responses: [...input.responses],

    evidenceIds: [...(input.evidenceIds ?? [])],

    integration: {
      syncStatus: input.syncStatus,
    },
  };

  /*
   * IMPORTANTE:
   *
   * Usamos unshift() en vez de sustituir completamente
   * el arreglo.
   *
   * Esto mantiene viva la misma referencia exportada por
   * este módulo y permite que src/data/inspections.ts
   * funcione como fachada de compatibilidad.
   */
  inspections.unshift(inspection);

  return inspection;
}

/* -------------------------------------------------------------------------- */
/*                             ACTUALIZACIÓN                                  */
/* -------------------------------------------------------------------------- */

export function updateInspection(
  id: string,
  changes: Partial<Inspection>,
): Inspection | undefined {
  const inspectionIndex = inspections.findIndex(
    (inspection) => inspection.id === id,
  );

  if (inspectionIndex === -1) {
    return undefined;
  }

  const currentInspection = inspections[inspectionIndex];

  /*
   * Fusionamos integration por separado.
   *
   * Así podemos modificar únicamente syncStatus
   * sin perder, por ejemplo:
   *
   * kobo.assetUid
   * kobo.submissionId
   * kobo.uuid
   */
  const updatedInspection: Inspection = {
    ...currentInspection,

    ...changes,

    integration:
      changes.integration !== undefined
        ? {
            ...currentInspection.integration,
            ...changes.integration,
          }
        : currentInspection.integration,
  };

  /*
   * También modificamos la posición existente
   * en lugar de crear otro arreglo.
   */
  inspections[inspectionIndex] = updatedInspection;

  return updatedInspection;
}

/* -------------------------------------------------------------------------- */
/*                               ELIMINACIÓN                                  */
/* -------------------------------------------------------------------------- */

export function deleteInspection(id: string): boolean {
  const inspectionIndex = inspections.findIndex(
    (inspection) => inspection.id === id,
  );

  if (inspectionIndex === -1) {
    return false;
  }

  inspections.splice(inspectionIndex, 1);

  return true;
}

/* -------------------------------------------------------------------------- */
/*                           ESTADO DE SINCRONIZACIÓN                         */
/* -------------------------------------------------------------------------- */

/*
 * Helper para modificar únicamente el estado
 * relacionado con sincronización.
 *
 * Más adelante será útil para:
 *
 * local
 *   ↓
 * pending
 *   ↓
 * synced / error
 */
export function updateInspectionSyncStatus(
  id: string,
  syncStatus: InspectionSyncStatus,
  lastSyncError?: string,
): Inspection | undefined {
  const inspection = getInspectionById(id);

  if (!inspection) {
    return undefined;
  }

  return updateInspection(id, {
    integration: {
      ...inspection.integration,

      syncStatus,

      /*
       * Si ya no existe error, eliminamos
       * el mensaje anterior.
       */
      lastSyncError: lastSyncError,
    },
  });
}

/* -------------------------------------------------------------------------- */
/*                                UTILIDADES                                  */
/* -------------------------------------------------------------------------- */

function createInspectionId(): string {
  return `inspection-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
