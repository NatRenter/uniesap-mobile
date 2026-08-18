import type { InspectionResponse } from "@/types/inspection";

import type { FormDefinition, FormQuestion } from "@/types/form";

import type { KoboSubmissionData } from "./types";

/*
 * Convierte una submission proveniente
 * de Kobo al modelo interno utilizado
 * por UNIESAP.
 */
export function mapKoboSubmissionToResponses(
  submission: KoboSubmissionData,
  form: FormDefinition,
): InspectionResponse[] {
  return form.questions.map((question) => {
    const fieldName = resolveKoboFieldName(question);

    const rawValue = submission[fieldName];

    return {
      questionId: question.id,

      value: normalizeKoboValue(rawValue, question),
    };
  });
}

/*
 * Convierte las respuestas internas
 * de UNIESAP a campos entendibles
 * por Kobo.
 */
export function mapResponsesToKoboSubmission(
  responses: InspectionResponse[],
  form: FormDefinition,
): KoboSubmissionData {
  return responses.reduce<KoboSubmissionData>((result, response) => {
    const question = form.questions.find(
      (item) => item.id === response.questionId,
    );

    if (!question) {
      return result;
    }

    const fieldName = resolveKoboFieldName(question);

    result[fieldName] = response.value;

    return result;
  }, {});
}

/*
 * Decide qué nombre debe utilizarse
 * para localizar una pregunta dentro
 * de una submission Kobo.
 *
 * Si existe un koboFieldName,
 * lo utilizamos.
 *
 * Durante la migración mantenemos
 * question.id como fallback.
 */
function resolveKoboFieldName(question: FormQuestion) {
  return question.integration?.koboFieldName ?? question.id;
}

/*
 * Convierte el valor externo
 * a uno soportado por el modelo
 * de respuestas de UNIESAP.
 */
function normalizeKoboValue(
  value: unknown,
  question: FormQuestion,
): string | number | boolean | null {
  if (value === undefined || value === null) {
    return null;
  }

  /*
   * Para preguntas booleanas queremos
   * tolerar algunos formatos que podrían
   * provenir de una fuente externa.
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
