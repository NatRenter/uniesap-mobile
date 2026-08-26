import type {
  KoboAttachmentReference,
  KoboSubmissionAttachment,
  KoboSubmissionPackage,
  KoboSubmissionReference,
} from "./types";

export type PersistedMockKoboSubmission = {
  assetUid: string;

  operationId: string;

  reference: KoboSubmissionReference;

  submissionPackage: KoboSubmissionPackage;
};

/*
 * Registro persistente de una evidencia aceptada.
 */
export type PersistedMockKoboAttachment = {
  assetUid: string;

  submissionId: string | number;

  uploadOperationId: string;

  evidenceId: string;

  reference: KoboAttachmentReference;

  attachment: KoboSubmissionAttachment;
};

export type MockKoboPersistence = {
  getByOperation: (
    assetUid: string,
    operationId: string,
  ) => Promise<PersistedMockKoboSubmission | null>;

  getBySubmissionId: (
    assetUid: string,
    submissionId: string | number,
  ) => Promise<PersistedMockKoboSubmission | null>;

  getAllByAsset: (assetUid: string) => Promise<PersistedMockKoboSubmission[]>;

  save: (record: PersistedMockKoboSubmission) => Promise<void>;

  /*
   * Operaciones de attachments.
   */
  getAttachmentByOperation: (
    assetUid: string,
    submissionId: string | number,
    uploadOperationId: string,
  ) => Promise<PersistedMockKoboAttachment | null>;

  getAttachmentsBySubmission: (
    assetUid: string,
    submissionId: string | number,
  ) => Promise<PersistedMockKoboAttachment[]>;

  saveAttachment: (record: PersistedMockKoboAttachment) => Promise<void>;
};
