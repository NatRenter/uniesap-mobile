import type { FormDefinition } from "@/types/form";

export const forms: FormDefinition[] = [
  {
    id: "form-001",

    title: "Análisis de riesgos",

    description: "Evaluación general de condiciones y agentes de riesgo.",

    version: "1.0",

    status: "active",

    questions: [
      {
        id: "question-001",
        label: "Responsable de la inspección",
        type: "text",
        required: true,
      },

      {
        id: "question-002",
        label: "¿Se identificaron condiciones de riesgo?",
        type: "boolean",
        required: true,
      },

      {
        id: "question-003",
        label: "Observaciones",
        type: "textarea",
      },

      {
        id: "question-004",
        label: "Evidencia fotográfica",
        type: "photo",
      },
    ],
  },

  {
    id: "form-002",

    title: "Inspección de extintores",

    description: "Revisión visual y funcional de equipos contra incendio.",

    version: "1.2",

    status: "active",

    questions: [
      {
        id: "question-005",
        label: "Número de extintor",
        type: "text",
      },

      {
        id: "question-006",
        label: "Estado general",
        type: "select",
      },

      {
        id: "question-007",
        label: "Fotografía del equipo",
        type: "photo",
      },
    ],
  },

  {
    id: "form-003",

    title: "Señalización",

    description: "Evaluación de señalización preventiva y rutas.",

    version: "1.0",

    status: "active",

    questions: [
      {
        id: "question-008",
        label: "Tipo de señal",
        type: "select",
      },

      {
        id: "question-009",
        label: "Ubicación",
        type: "text",
      },

      {
        id: "question-010",
        label: "¿La señal es visible?",
        type: "boolean",
      },
    ],
  },
];

export function getFormById(id: string) {
  return forms.find((form) => form.id === id);
}

export function getFormsByIds(ids: string[]) {
  return forms.filter((form) => ids.includes(form.id));
}
