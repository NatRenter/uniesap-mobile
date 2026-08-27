import type { Inspection } from "@/types/inspection";

/*
 * ============================================================================
 * DATOS INICIALES DE INSPECCIONES
 * ============================================================================
 *
 * Estos registros sustituyen los mocks que anteriormente
 * vivían directamente dentro de inspectionRepository.
 *
 * Solamente se insertarán cuando la base de datos esté vacía.
 *
 * IMPORTANTE:
 *
 * No deben confundirse con datos obligatorios del sistema.
 * Son únicamente información inicial de desarrollo.
 *
 * createdAt y updatedAt se incluyen para que el orden por actividad
 * funcione también con estos registros de prueba.
 */

export const initialInspections: Inspection[] = [
  {
    id: "inspection-001",

    companyId: "company-001",

    propertyId: "property-001",

    formId: "form-001",

    inspector: "Alexis",

    date: "2026-08-10",

    createdAt: "2026-08-10T09:00:00.000Z",

    updatedAt: "2026-08-10T10:30:00.000Z",

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

    /*
     * Estas inspecciones son anteriores
     * a nuestra integración Kobo.
     *
     * Por eso se consideran locales.
     */
    integration: {
      syncStatus: "local",
    },
  },

  {
    id: "inspection-002",

    companyId: "company-001",

    propertyId: "property-001",

    formId: "form-002",

    inspector: "Alexis",

    date: "2026-08-12",

    createdAt: "2026-08-12T09:00:00.000Z",

    updatedAt: "2026-08-12T11:15:00.000Z",

    status: "in_progress",

    responses: [
      {
        questionId: "question-005",

        value: "EXT-001",
      },
    ],

    evidenceIds: ["evidence-003"],

    integration: {
      syncStatus: "local",
    },
  },

  {
    id: "inspection-003",

    companyId: "company-001",

    propertyId: "property-003",

    formId: "form-003",

    inspector: "Alexis",

    date: "2026-08-13",

    createdAt: "2026-08-13T09:00:00.000Z",

    updatedAt: "2026-08-13T09:00:00.000Z",

    status: "draft",

    responses: [],

    evidenceIds: [],

    integration: {
      syncStatus: "local",
    },
  },

  {
    id: "inspection-004",

    companyId: "company-002",

    propertyId: "property-004",

    formId: "form-001",

    inspector: "Alexis",

    date: "2026-08-14",

    createdAt: "2026-08-14T09:00:00.000Z",

    updatedAt: "2026-08-14T12:00:00.000Z",

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

    integration: {
      syncStatus: "local",
    },
  },
];
