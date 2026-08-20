import { getFormById } from "@/data/forms";

import {
  getKoboService,
  mapKoboSubmissionToResponses,
  mapResponsesToKoboSubmission,
  type KoboSubmissionData,
  type KoboSubmissionId,
  type KoboSubmissionReference,
} from "@/integrations/kobo";

import type { InspectionResponse } from "@/types/inspection";

/* -------------------------------------------------------------------------- */
/*                         RESULTADO DE IMPORTACIÓN                            */
/* -------------------------------------------------------------------------- */

/*
 * Representa una captura que vino desde Kobo
 * y ya fue convertida al modelo interno de UNIESAP.
 */
export type ImportedKoboInspection = {
  formId: string;

  assetUid: string;

  submissionId: KoboSubmissionId;

  responses: InspectionResponse[];
};

/* -------------------------------------------------------------------------- */
/*                         RESULTADO DE EXPORTACIÓN                            */
/* -------------------------------------------------------------------------- */

/*
 * Representa una captura generada desde UNIESAP
 * y enviada al servicio Kobo.
 *
 * Conservamos también el payload utilizado para que
 * podamos inspeccionarlo durante desarrollo.
 *
 * Será especialmente útil dentro de /kobo-test.
 */
export type ExportedKoboInspection = {
  formId: string;

  assetUid: string;

  /*
   * Datos producidos por el mapper.
   *
   * Ejemplo:
   *
   * {
   *   "datos_generales/responsable": "Alexis",
   *   "riesgos/condiciones_riesgo": true
   * }
   */
  payload: KoboSubmissionData;

  /*
   * Referencia devuelta después de crear
   * la submission.
   */
  submission: KoboSubmissionReference;
};

/* -------------------------------------------------------------------------- */
/*                              IMPORTAR                                      */
/* -------------------------------------------------------------------------- */

/*
 * Obtiene una submission desde Kobo
 * y la convierte al formato interno
 * utilizado por UNIESAP.
 *
 *
 * Kobo
 *   ↓
 * KoboSubmissionData
 *   ↓
 * mapper
 *   ↓
 * InspectionResponse[]
 */
export async function importKoboSubmission(
  formId: string,
  submissionId: KoboSubmissionId,
): Promise<ImportedKoboInspection> {
  /*
   * Resolvemos y validamos el formulario.
   *
   * Esta función evita duplicar las mismas
   * comprobaciones entre importación y exportación.
   */
  const { form, assetUid } = resolveKoboForm(formId);

  const kobo = getKoboService();

  /*
   * Obtenemos la captura externa.
   */
  const submission = await kobo.getSubmission(assetUid, submissionId);

  /*
   * Convertimos:
   *
   * campos Kobo
   *      ↓
   * questionId
   */
  const responses = mapKoboSubmissionToResponses(submission, form);

  return {
    formId: form.id,

    assetUid,

    submissionId,

    responses,
  };
}

/* -------------------------------------------------------------------------- */
/*                              EXPORTAR                                      */
/* -------------------------------------------------------------------------- */

/*
 * Envía respuestas generadas dentro de UNIESAP
 * hacia el servicio Kobo configurado actualmente.
 *
 *
 * InspectionResponse[]
 *          ↓
 * FormDefinition
 *          ↓
 * mapper
 *          ↓
 * KoboSubmissionData
 *          ↓
 * KoboService.createSubmission()
 *
 *
 * IMPORTANTE:
 *
 * Actualmente KoboClient está configurado en:
 *
 * MODE = "mock"
 *
 * por lo tanto esta función todavía NO enviará
 * datos al servidor Kobo real.
 */
export async function exportKoboSubmission(
  formId: string,
  responses: InspectionResponse[],
): Promise<ExportedKoboInspection> {
  /*
   * Recuperamos el mismo contexto utilizado
   * durante la importación.
   */
  const { form, assetUid } = resolveKoboForm(formId);

  /*
   * Convertimos las respuestas internas
   * a los nombres técnicos utilizados
   * por la integración Kobo.
   */
  const payload = mapResponsesToKoboSubmission(responses, form);

  /*
   * Antes de crear una submission comprobamos
   * que exista al menos un campo exportable.
   *
   * Esto evita crear accidentalmente
   * submissions completamente vacías.
   */
  if (Object.keys(payload).length === 0) {
    throw new Error(
      `El formulario ${form.title} no generó campos compatibles con Kobo.`,
    );
  }

  const kobo = getKoboService();

  /*
   * En este momento esta llamada irá a:
   *
   * MockKoboService.createSubmission()
   *
   * porque KoboClient todavía está
   * configurado en modo "mock".
   */
  const submission = await kobo.createSubmission(assetUid, payload);

  return {
    formId: form.id,

    assetUid,

    payload,

    submission,
  };
}

/* -------------------------------------------------------------------------- */
/*                       RESOLVER FORMULARIO KOBO                             */
/* -------------------------------------------------------------------------- */

/*
 * Centraliza todas las validaciones necesarias
 * antes de utilizar un FormDefinition con Kobo.
 *
 * Tanto importKoboSubmission()
 * como exportKoboSubmission()
 * pasan primero por aquí.
 */
function resolveKoboForm(formId: string) {
  const form = getFormById(formId);

  if (!form) {
    throw new Error(`Formulario no encontrado: ${formId}`);
  }

  /*
   * Un formulario puede existir únicamente
   * dentro de UNIESAP.
   *
   * En ese caso no debe intentarse utilizar
   * la integración Kobo.
   */
  if (!form.integration) {
    throw new Error(`El formulario ${form.title} no está vinculado con Kobo.`);
  }

  if (form.integration.provider !== "kobo") {
    throw new Error(
      `Proveedor de integración no soportado: ${form.integration.provider}`,
    );
  }

  const assetUid = form.integration.assetUid;

  if (!assetUid.trim()) {
    throw new Error(
      `El formulario ${form.title} no tiene un Asset UID de Kobo válido.`,
    );
  }

  return {
    form,
    assetUid,
  };
}
