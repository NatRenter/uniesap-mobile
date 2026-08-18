import { getFormById } from "@/data/forms";

import {
    getKoboService,
    mapKoboSubmissionToResponses,
    type KoboSubmissionId,
} from "@/integrations/kobo";

import type { InspectionResponse } from "@/types/inspection";

export type ImportedKoboInspection = {
  formId: string;

  assetUid: string;

  submissionId: KoboSubmissionId;

  responses: InspectionResponse[];
};

/*
 * Obtiene una submission desde Kobo
 * y la convierte al formato interno
 * utilizado por UNIESAP.
 */
export async function importKoboSubmission(
  formId: string,
  submissionId: KoboSubmissionId,
): Promise<ImportedKoboInspection> {
  const form = getFormById(formId);

  if (!form) {
    throw new Error(`Formulario no encontrado: ${formId}`);
  }

  if (!form.integration) {
    throw new Error(`El formulario ${form.title} no está vinculado con Kobo.`);
  }

  if (form.integration.provider !== "kobo") {
    throw new Error(
      `Proveedor de integración no soportado: ${form.integration.provider}`,
    );
  }

  const assetUid = form.integration.assetUid;

  const kobo = getKoboService();

  const submission = await kobo.getSubmission(assetUid, submissionId);

  const responses = mapKoboSubmissionToResponses(submission, form);

  return {
    formId: form.id,

    assetUid,

    submissionId,

    responses,
  };
}
