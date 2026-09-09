import type { FormDefinition } from "@/types/form";

/*
 * ============================================================================
 * FORM SEED
 * ============================================================================
 *
 * Este archivo contiene las definiciones iniciales de formularios utilizadas
 * durante el desarrollo de UNIESAP.
 *
 * Flujo:
 *
 * FormSeed
 *    ↓
 * FormRepository
 *    ↓
 * SQLite / localStorage
 *
 * IMPORTANTE:
 *
 * El formulario continúa perteneciendo a UNIESAP.
 *
 * La propiedad:
 *
 * integration.provider = "kobo"
 *
 * únicamente indica que una inspección finalizada puede sincronizarse con
 * Kobo mediante InspectionSyncQueueService.
 *
 * Las pantallas NO deben importar este archivo directamente.
 */

export const initialForms: FormDefinition[] = [
  /*
   * ==========================================================================
   * FORM-001
   * ANÁLISIS DE RIESGOS
   * ==========================================================================
   */
  {
    id: "form-001",

    title: "Análisis de riesgos",

    description: "Evaluación general de condiciones y agentes de riesgo.",

    version: "1.0",

    status: "active",

    integration: {
      provider: "kobo",

      assetUid: "mock-asset-risk",

      versionUid: "mock-version-risk-001",
    },

    questions: [
      {
        id: "question-001",

        label: "Responsable de la inspección",

        type: "text",

        required: true,

        integration: {
          koboFieldName: "datos_generales/responsable",
        },
      },

      {
        id: "question-002",

        label: "¿Se identificaron condiciones de riesgo?",

        type: "boolean",

        required: true,

        integration: {
          koboFieldName: "riesgos/condiciones_riesgo",
        },
      },

      {
        id: "question-003",

        label: "Observaciones",

        type: "textarea",

        integration: {
          koboFieldName: "riesgos/observaciones",
        },
      },

      {
        id: "question-004",

        label: "Evidencia fotográfica",

        type: "photo",

        integration: {
          koboFieldName: "riesgos/evidencia",
        },
      },
    ],
  },

  /*
   * ==========================================================================
   * FORM-002
   * INSPECCIÓN DE EXTINTORES
   * ==========================================================================
   */
  {
    id: "form-002",

    title: "Inspección de extintores",

    description: "Revisión visual y funcional de equipos contra incendio.",

    version: "1.2",

    status: "active",

    integration: {
      provider: "kobo",

      assetUid: "mock-asset-extinguishers",

      versionUid: "mock-version-extinguishers-001",
    },

    questions: [
      {
        id: "question-005",

        label: "Número de extintor",

        type: "text",

        required: true,

        integration: {
          koboFieldName: "extintor/numero",
        },
      },

      {
        id: "question-006",

        label: "Estado general",

        type: "select",

        required: true,

        options: [
          {
            label: "Buen estado",
            value: "good",
          },

          {
            label: "Requiere atención",
            value: "attention",
          },

          {
            label: "Fuera de servicio",
            value: "out_of_service",
          },
        ],

        integration: {
          koboFieldName: "extintor/estado",
        },
      },

      {
        id: "question-007",

        label: "Fotografía del equipo",

        type: "photo",

        integration: {
          koboFieldName: "extintor/fotografia",
        },
      },
    ],
  },

  /*
   * ==========================================================================
   * FORM-003
   * SEÑALIZACIÓN
   * ==========================================================================
   *
   * ANTES:
   *
   * Este formulario era exclusivamente local.
   *
   * Por eso las inspecciones terminaban con:
   *
   * syncStatus = "local"
   *
   * AHORA:
   *
   * También participa en la integración Kobo.
   *
   * Mientras utilizamos Mock Kobo los UID son identificadores de desarrollo.
   * Cuando exista un proyecto Kobo real de señalización sustituiremos:
   *
   * - assetUid;
   * - versionUid;
   * - koboFieldName;
   *
   * por los valores reales del formulario desplegado.
   */
  {
    id: "form-003",

    title: "Señalización",

    description: "Evaluación de señalización preventiva y rutas.",

    version: "1.0",

    status: "active",

    integration: {
      provider: "kobo",

      assetUid: "mock-asset-signage",

      versionUid: "mock-version-signage-001",
    },

    questions: [
      {
        id: "question-008",

        label: "Tipo de señal",

        type: "select",

        required: true,

        options: [
          {
            label: "Prohibición",
            value: "prohibition",
          },

          {
            label: "Obligación",
            value: "mandatory",
          },

          {
            label: "Advertencia",
            value: "warning",
          },

          {
            label: "Condición segura",
            value: "safe_condition",
          },

          {
            label: "Equipo contra incendio",
            value: "fire_equipment",
          },
        ],

        /*
         * Campo Mock Kobo.
         *
         * Posteriormente deberá coincidir exactamente con el nombre
         * técnico existente en el formulario Kobo real.
         */
        integration: {
          koboFieldName: "senalizacion/tipo",
        },
      },

      {
        id: "question-009",

        label: "Ubicación",

        type: "text",

        required: true,

        integration: {
          koboFieldName: "senalizacion/ubicacion",
        },
      },

      {
        id: "question-010",

        label: "¿La señal es visible?",

        type: "boolean",

        required: true,

        integration: {
          koboFieldName: "senalizacion/visible",
        },
      },
    ],
  },
];
