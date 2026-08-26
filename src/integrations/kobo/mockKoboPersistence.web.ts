import type {
  MockKoboPersistence,
  PersistedMockKoboAttachment,
  PersistedMockKoboSubmission,
} from "./mockKoboPersistenceTypes";

const SUBMISSION_STORAGE_KEY = "uniesap.mock-kobo-submissions.v1";

const ATTACHMENT_STORAGE_KEY = "uniesap.mock-kobo-attachments.v1";

export const mockKoboPersistence: MockKoboPersistence = {
  async getByOperation(assetUid, operationId) {
    return (
      loadSubmissions().find(
        (item) =>
          item.assetUid === assetUid && item.operationId === operationId,
      ) ?? null
    );
  },

  async getBySubmissionId(assetUid, submissionId) {
    return (
      loadSubmissions().find(
        (item) =>
          item.assetUid === assetUid &&
          String(item.reference.submissionId) === String(submissionId),
      ) ?? null
    );
  },

  async getAllByAsset(assetUid) {
    return loadSubmissions().filter((item) => item.assetUid === assetUid);
  },

  async save(record) {
    const records = loadSubmissions();

    const index = records.findIndex(
      (item) =>
        item.assetUid === record.assetUid &&
        item.operationId === record.operationId,
    );

    if (index === -1) {
      records.push(record);
    } else {
      records[index] = record;
    }

    saveJson(SUBMISSION_STORAGE_KEY, records);
  },

  async getAttachmentByOperation(assetUid, submissionId, uploadOperationId) {
    return (
      loadAttachments().find(
        (item) =>
          item.assetUid === assetUid &&
          String(item.submissionId) === String(submissionId) &&
          item.uploadOperationId === uploadOperationId,
      ) ?? null
    );
  },

  async getAttachmentsBySubmission(assetUid, submissionId) {
    return loadAttachments().filter(
      (item) =>
        item.assetUid === assetUid &&
        String(item.submissionId) === String(submissionId),
    );
  },

  async saveAttachment(record) {
    const records = loadAttachments();

    const index = records.findIndex(
      (item) =>
        item.assetUid === record.assetUid &&
        String(item.submissionId) === String(record.submissionId) &&
        item.uploadOperationId === record.uploadOperationId,
    );

    if (index === -1) {
      records.push(record);
    } else {
      records[index] = record;
    }

    saveJson(ATTACHMENT_STORAGE_KEY, records);
  },
};

function loadSubmissions(): PersistedMockKoboSubmission[] {
  return loadJson<PersistedMockKoboSubmission[]>(SUBMISSION_STORAGE_KEY, []);
}

function loadAttachments(): PersistedMockKoboAttachment[] {
  return loadJson<PersistedMockKoboAttachment[]>(ATTACHMENT_STORAGE_KEY, []);
}

function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);

    if (!raw) {
      return fallback;
    }

    return JSON.parse(raw) as T;
  } catch (error) {
    console.error(`No fue posible leer ${key}:`, error);

    return fallback;
  }
}

function saveJson(key: string, value: unknown): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}
