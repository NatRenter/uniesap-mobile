import type { FormDefinition } from "@/types/form";

/*
 * ============================================================================
 * FORM WEB STORAGE
 * ============================================================================
 *
 * Persistencia de formularios para Web.
 *
 * Web utiliza localStorage.
 *
 * Android / iOS utilizarán SQLite
 * mediante formDatabase.ts.
 */

const STORAGE_KEY = "uniesap.forms.v1";

/*
 * ============================================================================
 * LEER FORMULARIOS
 * ============================================================================
 *
 * Devuelve:
 *
 * null
 *   → todavía no existe información persistida.
 *
 * FormDefinition[]
 *   → ya existen formularios guardados.
 */
export function loadWebForms(): FormDefinition[] | null {
  /*
   * Protección para entornos donde window
   * todavía no está disponible.
   */
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  /*
   * No existe información persistida.
   *
   * FormRepository utilizará entonces
   * el FormSeed inicial.
   */
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;

    /*
     * El valor almacenado debe ser un arreglo.
     */
    if (!Array.isArray(parsed)) {
      console.warn(
        "Los formularios Web almacenados no tienen un formato válido.",
      );

      return null;
    }

    /*
     * Devolvemos clones completos
     * para evitar referencias compartidas.
     */
    return parsed.map((form) => cloneForm(form as FormDefinition));
  } catch (error) {
    /*
     * Si localStorage contiene JSON corrupto,
     * dejamos registro para diagnóstico.
     */
    console.error("No fue posible leer formularios desde localStorage:", error);

    return null;
  }
}

/*
 * ============================================================================
 * GUARDAR FORMULARIOS
 * ============================================================================
 *
 * Reemplaza el contenido completo
 * de la colección persistida.
 */
export function saveWebForms(forms: FormDefinition[]): void {
  if (typeof window === "undefined") {
    return;
  }

  /*
   * Guardamos el arreglo completo.
   *
   * Esta estrategia es suficiente para el volumen
   * actual de formularios.
   */
  window.localStorage.setItem(
    STORAGE_KEY,

    JSON.stringify(forms),
  );
}

/*
 * ============================================================================
 * CLONAR FORMULARIO
 * ============================================================================
 *
 * FormDefinition contiene:
 *
 * questions
 * options
 * integration
 *
 * Por eso necesitamos copiar
 * también las estructuras anidadas.
 */
function cloneForm(form: FormDefinition): FormDefinition {
  return {
    ...form,

    /*
     * Clonamos las preguntas.
     */
    questions: form.questions.map((question) => ({
      ...question,

      /*
       * Las opciones son opcionales.
       */
      ...(question.options
        ? {
            options: question.options.map((option) => ({
              ...option,
            })),
          }
        : {}),

      /*
       * La integración de una pregunta
       * también es opcional.
       */
      ...(question.integration
        ? {
            integration: {
              ...question.integration,
            },
          }
        : {}),
    })),

    /*
     * La integración del formulario
     * solamente existe cuando utiliza Kobo.
     */
    ...(form.integration
      ? {
          integration: {
            ...form.integration,
          },
        }
      : {}),
  };
}
