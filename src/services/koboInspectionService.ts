import { getFormById } from "@/data/forms";

import {
  getKoboService,
  mapKoboSubmissionToResponses,
  mapResponsesToKoboSubmission,
  type KoboAttachmentReference,
  type KoboSubmissionAttachment,
  type KoboSubmissionData,
  type KoboSubmissionId,
  type KoboSubmissionPackage,
  type KoboSubmissionReference,
} from "@/integrations/kobo";

import type { Evidence } from "@/types/evidence";
import type { FormDefinition } from "@/types/form";
import type { InspectionResponse } from "@/types/inspection";

export type ImportedKoboInspection = {
  formId: string;

  assetUid: string;

  submissionId: KoboSubmissionId;

  responses: InspectionResponse[];
};

export type ExportedKoboInspection = {
  formId: string;

  assetUid: string;

  payload: KoboSubmissionData;

  attachments: KoboSubmissionAttachment[];

  submissionPackage: KoboSubmissionPackage;

  submission: KoboSubmissionReference;
};

export async function importKoboSubmission(
  formId: string,
  submissionId: KoboSubmissionId,
): Promise<ImportedKoboInspection> {
  const { form, assetUid } = resolveKoboForm(formId);

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

export async function exportKoboSubmission(
  formId: string,
  responses: InspectionResponse[],
  operationId: string,
  evidences: Evidence[] = [],
): Promise<ExportedKoboInspection> {
  const { form, assetUid } = resolveKoboForm(formId);

  const payload = mapResponsesToKoboSubmission(responses, form);

  const attachments = mapEvidencesToKoboAttachments(evidences, form);

  if (Object.keys(payload).length === 0 && attachments.length === 0) {
    throw new Error(
      `El formulario ${form.title} no generó datos ni evidencias compatibles con Kobo.`,
    );
  }

  const submissionPackage: KoboSubmissionPackage = {
    operationId,

    data: payload,

    attachments,
  };

  const kobo = getKoboService();

  const submission = await kobo.createSubmission(assetUid, submissionPackage);

  return {
    formId: form.id,

    assetUid,

    payload,

    attachments,

    submissionPackage,

    submission,
  };
}

/*
 * Sube una evidencia individual.
 *
 * InspectionSyncService utiliza esta función para procesar
 * una fotografía por vez.
 */
export async function uploadKoboAttachment(
  assetUid: string,
  submissionId: KoboSubmissionId,
  attachment: KoboSubmissionAttachment,
): Promise<KoboAttachmentReference> {
  const kobo = getKoboService();

  return kobo.uploadAttachment(assetUid, submissionId, attachment);
}

function mapEvidencesToKoboAttachments(
  evidences: Evidence[],
  form: FormDefinition,
): KoboSubmissionAttachment[] {
  const attachments: KoboSubmissionAttachment[] = [];

  for (const evidence of evidences) {
    if (evidence.type !== "photo") {
      continue;
    }

    if (!evidence.questionId) {
      continue;
    }

    const question = form.questions.find(
      (item) => item.id === evidence.questionId,
    );

    if (!question) {
      continue;
    }

    const fieldName = question.integration?.koboFieldName;

    if (!fieldName) {
      continue;
    }

    if (!evidence.fileName) {
      continue;
    }

    if (!evidence.localUri && !evidence.remoteUri) {
      continue;
    }

    /*
     * Si la evidencia ya tiene operationId lo reutilizamos.
     *
     * Si todavía no existe, generamos uno determinista usando evidence.id.
     */
    const uploadOperationId =
      evidence.integration?.kobo?.uploadOperationId ??
      createEvidenceUploadOperationId(evidence.id);

    attachments.push({
      evidenceId: evidence.id,

      questionId: evidence.questionId,

      uploadOperationId,

      fieldName,

      fileName: evidence.fileName,

      ...(evidence.mimeType
        ? {
            mimeType: evidence.mimeType,
          }
        : {}),

      ...(evidence.fileSize !== undefined
        ? {
            fileSize: evidence.fileSize,
          }
        : {}),

      ...(evidence.localUri
        ? {
            localUri: evidence.localUri,
          }
        : {}),

      ...(evidence.remoteUri
        ? {
            remoteUri: evidence.remoteUri,
          }
        : {}),
    });
  }

  return attachments;
}

/*
 * La misma evidencia siempre produce la misma clave.
 */
function createEvidenceUploadOperationId(evidenceId: string): string {
  return `upload-${evidenceId}`;
}

function resolveKoboForm(formId: string) {
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
