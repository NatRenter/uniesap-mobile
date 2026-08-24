import { getDatabase } from "@/database/database";

import type { Evidence } from "@/types/evidence";

type EvidenceRow = {
  id: string;
  company_id: string;
  property_id: string;
  inspection_id: string;
  question_id: string | null;
  title: string;
  type: Evidence["type"];
  status: Evidence["status"];
  date: string;
  description: string | null;
  local_uri: string | null;
  remote_uri: string | null;
  mime_type: string | null;
  file_name: string | null;
  file_size: number | null;
  created_at: string | null;
};

export async function countEvidences(): Promise<number> {
  const database = await getDatabase();

  const row = await database.getFirstAsync<{ count: number }>(`
    SELECT COUNT(*) AS count
    FROM evidences;
  `);

  return row?.count ?? 0;
}

export async function selectAllEvidences(): Promise<Evidence[]> {
  const database = await getDatabase();

  const rows = await database.getAllAsync<EvidenceRow>(`
    SELECT
      id,
      company_id,
      property_id,
      inspection_id,
      question_id,
      title,
      type,
      status,
      date,
      description,
      local_uri,
      remote_uri,
      mime_type,
      file_name,
      file_size,
      created_at
    FROM evidences
    ORDER BY created_at ASC, date ASC, id ASC;
  `);

  return rows.map(mapEvidenceRow);
}

export async function insertEvidence(evidence: Evidence): Promise<void> {
  const database = await getDatabase();

  await database.runAsync(
    `
      INSERT INTO evidences (
        id,
        company_id,
        property_id,
        inspection_id,
        question_id,
        title,
        type,
        status,
        date,
        description,
        local_uri,
        remote_uri,
        mime_type,
        file_name,
        file_size,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `,
    evidence.id,
    evidence.companyId,
    evidence.propertyId,
    evidence.inspectionId,
    evidence.questionId ?? null,
    evidence.title,
    evidence.type,
    evidence.status,
    evidence.date,
    evidence.description ?? null,
    evidence.localUri ?? null,
    evidence.remoteUri ?? null,
    evidence.mimeType ?? null,
    evidence.fileName ?? null,
    evidence.fileSize ?? null,
    evidence.createdAt ?? null,
  );
}

export async function replaceEvidence(evidence: Evidence): Promise<void> {
  const database = await getDatabase();

  await database.runAsync(
    `
      INSERT OR REPLACE INTO evidences (
        id,
        company_id,
        property_id,
        inspection_id,
        question_id,
        title,
        type,
        status,
        date,
        description,
        local_uri,
        remote_uri,
        mime_type,
        file_name,
        file_size,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `,
    evidence.id,
    evidence.companyId,
    evidence.propertyId,
    evidence.inspectionId,
    evidence.questionId ?? null,
    evidence.title,
    evidence.type,
    evidence.status,
    evidence.date,
    evidence.description ?? null,
    evidence.localUri ?? null,
    evidence.remoteUri ?? null,
    evidence.mimeType ?? null,
    evidence.fileName ?? null,
    evidence.fileSize ?? null,
    evidence.createdAt ?? null,
  );
}

export async function deleteEvidenceFromDatabase(id: string): Promise<boolean> {
  const database = await getDatabase();

  const result = await database.runAsync(
    `
      DELETE FROM evidences
      WHERE id = ?;
    `,
    id,
  );

  return result.changes > 0;
}

function mapEvidenceRow(row: EvidenceRow): Evidence {
  return {
    id: row.id,
    companyId: row.company_id,
    propertyId: row.property_id,
    inspectionId: row.inspection_id,
    ...(row.question_id ? { questionId: row.question_id } : {}),
    title: row.title,
    type: row.type,
    status: row.status,
    date: row.date,
    ...(row.description ? { description: row.description } : {}),
    ...(row.local_uri ? { localUri: row.local_uri } : {}),
    ...(row.remote_uri ? { remoteUri: row.remote_uri } : {}),
    ...(row.mime_type ? { mimeType: row.mime_type } : {}),
    ...(row.file_name ? { fileName: row.file_name } : {}),
    ...(row.file_size !== null ? { fileSize: row.file_size } : {}),
    ...(row.created_at ? { createdAt: row.created_at } : {}),
  };
}
