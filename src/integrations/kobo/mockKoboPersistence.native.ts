import { getDatabase } from "@/database/database";

import type {
  MockKoboPersistence,
  PersistedMockKoboAttachment,
  PersistedMockKoboSubmission,
} from "./mockKoboPersistenceTypes";

type MockKoboSubmissionRow = {
  asset_uid: string;
  operation_id: string;
  reference_json: string;
  package_json: string;
};

type MockKoboAttachmentRow = {
  asset_uid: string;
  submission_id: string;
  upload_operation_id: string;
  evidence_id: string;
  reference_json: string;
  attachment_json: string;
};

export const mockKoboPersistence: MockKoboPersistence = {
  async getByOperation(assetUid, operationId) {
    const database = await getDatabase();

    const row = await database.getFirstAsync<MockKoboSubmissionRow>(
      `
          SELECT
            asset_uid,
            operation_id,
            reference_json,
            package_json
          FROM mock_kobo_submissions
          WHERE asset_uid = ?
            AND operation_id = ?
          LIMIT 1;
        `,
      assetUid,
      operationId,
    );

    return row ? mapSubmissionRow(row) : null;
  },

  async getBySubmissionId(assetUid, submissionId) {
    const database = await getDatabase();

    const rows = await database.getAllAsync<MockKoboSubmissionRow>(
      `
          SELECT
            asset_uid,
            operation_id,
            reference_json,
            package_json
          FROM mock_kobo_submissions
          WHERE asset_uid = ?
          ORDER BY created_at ASC;
        `,
      assetUid,
    );

    const record = rows
      .map(mapSubmissionRow)
      .find(
        (item) => String(item.reference.submissionId) === String(submissionId),
      );

    return record ?? null;
  },

  async getAllByAsset(assetUid) {
    const database = await getDatabase();

    const rows = await database.getAllAsync<MockKoboSubmissionRow>(
      `
          SELECT
            asset_uid,
            operation_id,
            reference_json,
            package_json
          FROM mock_kobo_submissions
          WHERE asset_uid = ?
          ORDER BY created_at ASC;
        `,
      assetUid,
    );

    return rows.map(mapSubmissionRow);
  },

  async save(record) {
    const database = await getDatabase();

    await database.runAsync(
      `
        INSERT OR REPLACE INTO mock_kobo_submissions (
          operation_key,
          asset_uid,
          operation_id,
          reference_json,
          package_json,
          created_at
        )
        VALUES (?, ?, ?, ?, ?, ?);
      `,
      createSubmissionOperationKey(record.assetUid, record.operationId),
      record.assetUid,
      record.operationId,
      JSON.stringify(record.reference),
      JSON.stringify(record.submissionPackage),
      new Date().toISOString(),
    );
  },

  async getAttachmentByOperation(assetUid, submissionId, uploadOperationId) {
    const database = await getDatabase();

    const row = await database.getFirstAsync<MockKoboAttachmentRow>(
      `
          SELECT
            asset_uid,
            submission_id,
            upload_operation_id,
            evidence_id,
            reference_json,
            attachment_json
          FROM mock_kobo_attachments
          WHERE asset_uid = ?
            AND submission_id = ?
            AND upload_operation_id = ?
          LIMIT 1;
        `,
      assetUid,
      String(submissionId),
      uploadOperationId,
    );

    return row ? mapAttachmentRow(row) : null;
  },

  async getAttachmentsBySubmission(assetUid, submissionId) {
    const database = await getDatabase();

    const rows = await database.getAllAsync<MockKoboAttachmentRow>(
      `
          SELECT
            asset_uid,
            submission_id,
            upload_operation_id,
            evidence_id,
            reference_json,
            attachment_json
          FROM mock_kobo_attachments
          WHERE asset_uid = ?
            AND submission_id = ?
          ORDER BY created_at ASC;
        `,
      assetUid,
      String(submissionId),
    );

    return rows.map(mapAttachmentRow);
  },

  async saveAttachment(record) {
    const database = await getDatabase();

    await database.runAsync(
      `
        INSERT OR REPLACE INTO mock_kobo_attachments (
          operation_key,
          asset_uid,
          submission_id,
          upload_operation_id,
          evidence_id,
          reference_json,
          attachment_json,
          created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?);
      `,
      createAttachmentOperationKey(
        record.assetUid,
        record.submissionId,
        record.uploadOperationId,
      ),
      record.assetUid,
      String(record.submissionId),
      record.uploadOperationId,
      record.evidenceId,
      JSON.stringify(record.reference),
      JSON.stringify(record.attachment),
      new Date().toISOString(),
    );
  },
};

function createSubmissionOperationKey(
  assetUid: string,
  operationId: string,
): string {
  return `${assetUid}:${operationId}`;
}

function createAttachmentOperationKey(
  assetUid: string,
  submissionId: string | number,
  uploadOperationId: string,
): string {
  return `${assetUid}:${submissionId}:${uploadOperationId}`;
}

function mapSubmissionRow(
  row: MockKoboSubmissionRow,
): PersistedMockKoboSubmission {
  return {
    assetUid: row.asset_uid,

    operationId: row.operation_id,

    reference: JSON.parse(
      row.reference_json,
    ) as PersistedMockKoboSubmission["reference"],

    submissionPackage: JSON.parse(
      row.package_json,
    ) as PersistedMockKoboSubmission["submissionPackage"],
  };
}

function mapAttachmentRow(
  row: MockKoboAttachmentRow,
): PersistedMockKoboAttachment {
  return {
    assetUid: row.asset_uid,

    submissionId: row.submission_id,

    uploadOperationId: row.upload_operation_id,

    evidenceId: row.evidence_id,

    reference: JSON.parse(
      row.reference_json,
    ) as PersistedMockKoboAttachment["reference"],

    attachment: JSON.parse(
      row.attachment_json,
    ) as PersistedMockKoboAttachment["attachment"],
  };
}
