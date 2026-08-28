import type { FormDefinition } from "@/types/form";

/*
 * ============================================================================
 * FORM SEED
 * ============================================================================
 *
 * Este archivo contiene formularios iniciales de desarrollo.
 *
 * Se utilizarán únicamente cuando la persistencia de formularios
 * todavía esté vacía.
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
 * Las pantallas NO deben importar directamente este archivo.
 *
 * Los formularios podrán existir:
 *
 * - solo dentro de UNIESAP;
 * - vinculados con Kobo;
 * - y posteriormente vinculados con otros proveedores.
 */
export const initialForms: FormDefinition[] = [
  {
    id: "form-001",

    title: "Análisis de riesgos",

    description: "Evaluación general de condiciones y agentes de riesgo.",

    version: "1.0",

    status: "active",

    /*
     * Integración opcional con Kobo.
     *
     * El formulario sigue perteneciendo a UNIESAP;
     * Kobo solamente funciona como proveedor externo.
     */
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

        /*
         * Nombre técnico del campo externo.
         *
         * Este dato solamente se usa cuando
         * el formulario se sincroniza con Kobo.
         */
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

        /*
         * Las opciones quedan dentro de la definición
         * del formulario.
         *
         * CaptureScreen podrá renderizarlas directamente.
         */
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

  {
    id: "form-003",

    title: "Señalización",

    description: "Evaluación de señalización preventiva y rutas.",

    version: "1.0",

    status: "active",

    /*
     * Este formulario no tiene integración externa.
     *
     * Eso demuestra que FormDefinition no depende
     * obligatoriamente de Kobo.
     */
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
      },

      {
        id: "question-009",

        label: "Ubicación",

        type: "text",

        required: true,
      },

      {
        id: "question-010",

        label: "¿La señal es visible?",

        type: "boolean",

        required: true,
      },
    ],
  },
];
