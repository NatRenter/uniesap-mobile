import type {
  MockKoboPersistence,
  PersistedMockKoboAttachment,
  PersistedMockKoboSubmission,
} from "./mockKoboPersistenceTypes";

/*
 * ============================================================================
 * FALLBACK EN MEMORIA
 * ============================================================================
 *
 * Android usa .native.ts y Web usa .web.ts.
 *
 * Este archivo mantiene un respaldo válido para otros entornos.
 */

const submissions = new Map<string, PersistedMockKoboSubmission>();

const attachments = new Map<string, PersistedMockKoboAttachment>();

export const mockKoboPersistence: MockKoboPersistence = {
  async getByOperation(assetUid, operationId) {
    return submissions.get(createSubmissionKey(assetUid, operationId)) ?? null;
  },

  async getBySubmissionId(assetUid, submissionId) {
    return (
      Array.from(submissions.values()).find(
        (item) =>
          item.assetUid === assetUid &&
          String(item.reference.submissionId) === String(submissionId),
      ) ?? null
    );
  },

  async getAllByAsset(assetUid) {
    return Array.from(submissions.values()).filter(
      (item) => item.assetUid === assetUid,
    );
  },

  async save(record) {
    submissions.set(
      createSubmissionKey(record.assetUid, record.operationId),
      cloneSubmission(record),
    );
  },

  async getAttachmentByOperation(assetUid, submissionId, uploadOperationId) {
    return (
      attachments.get(
        createAttachmentKey(assetUid, submissionId, uploadOperationId),
      ) ?? null
    );
  },

  async getAttachmentsBySubmission(assetUid, submissionId) {
    return Array.from(attachments.values()).filter(
      (item) =>
        item.assetUid === assetUid &&
        String(item.submissionId) === String(submissionId),
    );
  },

  async saveAttachment(record) {
    attachments.set(
      createAttachmentKey(
        record.assetUid,
        record.submissionId,
        record.uploadOperationId,
      ),
      cloneAttachment(record),
    );
  },
};

function createSubmissionKey(assetUid: string, operationId: string): string {
  return `${assetUid}:${operationId}`;
}

function createAttachmentKey(
  assetUid: string,
  submissionId: string | number,
  uploadOperationId: string,
): string {
  return `${assetUid}:${submissionId}:${uploadOperationId}`;
}

function cloneSubmission(
  record: PersistedMockKoboSubmission,
): PersistedMockKoboSubmission {
  return JSON.parse(JSON.stringify(record)) as PersistedMockKoboSubmission;
}

function cloneAttachment(
  record: PersistedMockKoboAttachment,
): PersistedMockKoboAttachment {
  return JSON.parse(JSON.stringify(record)) as PersistedMockKoboAttachment;
}
