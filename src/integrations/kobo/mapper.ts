import type { FormDefinition, FormQuestion } from "@/types/form";

import type {
  InspectionResponse,
  InspectionResponseValue,
} from "@/types/inspection";

import type { KoboSubmissionData } from "./types";

/* -------------------------------------------------------------------------- */
/*                         KOBO → UNIESAP                                     */
/* -------------------------------------------------------------------------- */

/*
 * Convierte una submission proveniente de Kobo
 * al modelo interno utilizado por UNIESAP.
 *
 * Para lectura mantenemos compatibilidad temporal
 * con question.id como fallback.
 *
 * Esto permite seguir leyendo datos antiguos
 * mientras terminamos la migración.
 */
export function mapKoboSubmissionToResponses(
  submission: KoboSubmissionData,
  form: FormDefinition,
): InspectionResponse[] {
  return form.questions.map((question) => {
    const fieldName = resolveKoboFieldNameForReading(question);

    const rawValue = submission[fieldName];

    return {
      questionId: question.id,

      value: normalizeKoboValue(rawValue, question),
    };
  });
}

/* -------------------------------------------------------------------------- */
/*                         UNIESAP → KOBO                                     */
/* -------------------------------------------------------------------------- */

/*
 * Convierte las respuestas internas de UNIESAP
 * a una submission compatible con nuestra
 * integración de Kobo.
 *
 * IMPORTANTE:
 *
 * Para ESCRITURA ya no usamos question.id
 * como fallback.
 *
 * Una pregunta solamente se envía a Kobo
 * cuando tiene:
 *
 * integration.koboFieldName
 *
 * Esto evita producir accidentalmente:
 *
 * {
 *   "question-008": "warning"
 * }
 *
 * cuando Kobo no tiene un campo con ese nombre.
 */
export function mapResponsesToKoboSubmission(
  responses: InspectionResponse[],
  form: FormDefinition,
): KoboSubmissionData {
  return responses.reduce<KoboSubmissionData>((result, response) => {
    const question = form.questions.find(
      (item) => item.id === response.questionId,
    );

    /*
     * La respuesta pertenece a una pregunta
     * que ya no existe en esta versión
     * del formulario.
     */
    if (!question) {
      return result;
    }

    const fieldName = resolveKoboFieldNameForWriting(question);

    /*
     * Preguntas internas de UNIESAP
     * simplemente no se incluyen en
     * el payload externo.
     */
    if (!fieldName) {
      return result;
    }

    result[fieldName] = normalizeUniesapValueForKobo(response.value, question);

    return result;
  }, {});
}

/* -------------------------------------------------------------------------- */
/*                           FIELD NAME                                       */
/* -------------------------------------------------------------------------- */

/*
 * LECTURA
 *
 * Conservamos temporalmente question.id
 * como fallback por compatibilidad.
 */
function resolveKoboFieldNameForReading(question: FormQuestion) {
  return question.integration?.koboFieldName ?? question.id;
}

/*
 * ESCRITURA
 *
 * No utilizamos fallback.
 *
 * Si no existe koboFieldName,
 * la pregunta pertenece únicamente a UNIESAP
 * o todavía no ha sido configurada correctamente.
 */
function resolveKoboFieldNameForWriting(question: FormQuestion) {
  return question.integration?.koboFieldName;
}

/* -------------------------------------------------------------------------- */
/*                         NORMALIZACIÓN DE ENTRADA                           */
/* -------------------------------------------------------------------------- */

function normalizeKoboValue(
  value: unknown,
  question: FormQuestion,
): InspectionResponseValue {
  if (value === undefined || value === null) {
    return null;
  }

  /*
   * Kobo puede representar valores booleanos
   * de distintas formas dependiendo del formulario
   * o de la transformación realizada por el backend.
   */
  if (question.type === "boolean" && typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (
      normalized === "true" ||
      normalized === "yes" ||
      normalized === "sí" ||
      normalized === "si" ||
      normalized === "1"
    ) {
      return true;
    }

    if (normalized === "false" || normalized === "no" || normalized === "0") {
      return false;
    }
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  return null;
}

/* -------------------------------------------------------------------------- */
/*                         NORMALIZACIÓN DE SALIDA                            */
/* -------------------------------------------------------------------------- */

/*
 * De momento conservamos los valores de UNIESAP.
 *
 * Esta función queda separada deliberadamente
 * porque más adelante podremos transformar:
 *
 * boolean → "yes" / "no"
 * select  → códigos Kobo
 * photo   → referencia de attachment
 *
 * sin tocar el resto del mapper.
 */
function normalizeUniesapValueForKobo(
  value: InspectionResponseValue,
  question: FormQuestion,
): InspectionResponseValue {
  switch (question.type) {
    case "boolean":
    case "text":
    case "textarea":
    case "number":
    case "select":
    case "photo":
      return value;

    default:
      return value;
  }
}
