import { getDatabase } from "@/database/database";

import type {
  Inspection,
  InspectionResponse,
  InspectionResponseValue,
} from "@/types/inspection";

/*
 * ============================================================================
 * CONTAR INSPECCIONES
 * ============================================================================
 *
 * Se utiliza durante la inicialización para decidir
 * si deben insertarse los datos iniciales.
 */

export async function countInspections(): Promise<number> {
  const database = await getDatabase();

  const result = await database.getFirstAsync<{
    total: number;
  }>(
    `
      SELECT COUNT(*) AS total
      FROM inspections;
      `,
  );

  return result?.total ?? 0;
}

/*
 * ============================================================================
 * FILA SQL DE INSPECCIÓN
 * ============================================================================
 */

type InspectionRow = {
  id: string;

  company_id: string;

  property_id: string;

  form_id: string;

  inspector: string;

  date: string;

  created_at: string | null;

  updated_at: string | null;

  status: "draft" | "in_progress" | "completed";

  sync_status: "local" | "pending" | "syncing" | "synced" | "error";

  sync_operation_id: string | null;

  sync_attempt: number | null;

  kobo_asset_uid: string | null;

  kobo_submission_id: string | null;

  kobo_uuid: string | null;

  kobo_synced_at: string | null;

  last_sync_error: string | null;
};

type ResponseRow = {
  question_id: string;

  value: string | null;

  value_type: string;
};

type EvidenceRow = {
  evidence_id: string;
};

/*
 * ============================================================================
 * GUARDAR INSPECCIÓN
 * ============================================================================
 */

export async function insertInspection(inspection: Inspection) {
  const database = await getDatabase();

  /*
   * Utilizamos una transacción para garantizar
   * que inspección + respuestas + evidencias
   * se guarden como una sola operación lógica.
   */
  await database.withTransactionAsync(async () => {
    await database.runAsync(
      `
        INSERT INTO inspections (
          id,
          company_id,
          property_id,
          form_id,
          inspector,
          date,
          created_at,
          updated_at,
          status,
          sync_status,
          sync_operation_id,
          sync_attempt,
          kobo_asset_uid,
          kobo_submission_id,
          kobo_uuid,
          kobo_synced_at,
          last_sync_error
        )
        VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        );
        `,
      inspection.id,
      inspection.companyId,
      inspection.propertyId,
      inspection.formId,
      inspection.inspector,
      inspection.date,
      inspection.createdAt,
      inspection.updatedAt,
      inspection.status,
      inspection.integration?.syncStatus ?? "local",
      inspection.integration?.syncOperationId ?? null,
      inspection.integration?.syncAttempt ?? 0,
      inspection.integration?.kobo?.assetUid ?? null,
      inspection.integration?.kobo?.submissionId != null
        ? String(inspection.integration.kobo.submissionId)
        : null,
      inspection.integration?.kobo?.uuid ?? null,
      inspection.integration?.kobo?.syncedAt ?? null,
      inspection.integration?.lastSyncError ?? null,
    );

    /*
     * Respuestas.
     */
    for (const response of inspection.responses) {
      const serialized = serializeResponseValue(response.value);

      await database.runAsync(
        `
          INSERT INTO inspection_responses (
            inspection_id,
            question_id,
            value,
            value_type
          )
          VALUES (?, ?, ?, ?);
          `,
        inspection.id,
        response.questionId,
        serialized.value,
        serialized.type,
      );
    }

    /*
     * Evidencias.
     */
    for (const evidenceId of inspection.evidenceIds) {
      await database.runAsync(
        `
          INSERT INTO inspection_evidences (
            inspection_id,
            evidence_id
          )
          VALUES (?, ?);
          `,
        inspection.id,
        evidenceId,
      );
    }
  });
}

/*
 * ============================================================================
 * ACTUALIZAR INSPECCIÓN COMPLETA
 * ============================================================================
 *
 * Esta estrategia reemplaza respuestas/evidencias
 * asociadas para mantener SQLite exactamente alineado
 * con nuestro modelo Inspection actual.
 */

export async function replaceInspection(inspection: Inspection) {
  const database = await getDatabase();

  await database.withTransactionAsync(async () => {
    await database.runAsync(
      `
        UPDATE inspections
        SET
          company_id = ?,
          property_id = ?,
          form_id = ?,
          inspector = ?,
          date = ?,
          created_at = ?,
          updated_at = ?,
          status = ?,
          sync_status = ?,
          sync_operation_id = ?,
          sync_attempt = ?,
          kobo_asset_uid = ?,
          kobo_submission_id = ?,
          kobo_uuid = ?,
          kobo_synced_at = ?,
          last_sync_error = ?
        WHERE id = ?;
        `,
      inspection.companyId,
      inspection.propertyId,
      inspection.formId,
      inspection.inspector,
      inspection.date,
      inspection.createdAt,
      inspection.updatedAt,
      inspection.status,
      inspection.integration?.syncStatus ?? "local",
      inspection.integration?.syncOperationId ?? null,
      inspection.integration?.syncAttempt ?? 0,
      inspection.integration?.kobo?.assetUid ?? null,
      inspection.integration?.kobo?.submissionId != null
        ? String(inspection.integration.kobo.submissionId)
        : null,
      inspection.integration?.kobo?.uuid ?? null,
      inspection.integration?.kobo?.syncedAt ?? null,
      inspection.integration?.lastSyncError ?? null,
      inspection.id,
    );

    /*
     * Reemplazamos respuestas.
     */
    await database.runAsync(
      `
        DELETE FROM inspection_responses
        WHERE inspection_id = ?;
        `,
      inspection.id,
    );

    for (const response of inspection.responses) {
      const serialized = serializeResponseValue(response.value);

      await database.runAsync(
        `
          INSERT INTO inspection_responses (
            inspection_id,
            question_id,
            value,
            value_type
          )
          VALUES (?, ?, ?, ?);
          `,
        inspection.id,
        response.questionId,
        serialized.value,
        serialized.type,
      );
    }

    /*
     * Reemplazamos evidencias.
     */
    await database.runAsync(
      `
        DELETE FROM inspection_evidences
        WHERE inspection_id = ?;
        `,
      inspection.id,
    );

    for (const evidenceId of inspection.evidenceIds) {
      await database.runAsync(
        `
          INSERT INTO inspection_evidences (
            inspection_id,
            evidence_id
          )
          VALUES (?, ?);
          `,
        inspection.id,
        evidenceId,
      );
    }
  });
}

/*
 * ============================================================================
 * CONSULTAS
 * ============================================================================
 */

export async function selectInspectionById(
  id: string,
): Promise<Inspection | undefined> {
  const database = await getDatabase();

  const row = await database.getFirstAsync<InspectionRow>(
    `
      SELECT *
      FROM inspections
      WHERE id = ?;
      `,
    id,
  );

  if (!row) {
    return undefined;
  }

  return hydrateInspection(row);
}

export async function selectInspectionsByCompanyId(
  companyId: string,
): Promise<Inspection[]> {
  const database = await getDatabase();

  const rows = await database.getAllAsync<InspectionRow>(
    `
      SELECT *
      FROM inspections
      WHERE company_id = ?
      ORDER BY updated_at DESC, date DESC;
      `,
    companyId,
  );

  return Promise.all(rows.map(hydrateInspection));
}

export async function selectInspectionsByPropertyId(
  propertyId: string,
): Promise<Inspection[]> {
  const database = await getDatabase();

  const rows = await database.getAllAsync<InspectionRow>(
    `
      SELECT *
      FROM inspections
      WHERE property_id = ?
      ORDER BY updated_at DESC, date DESC;
      `,
    propertyId,
  );

  return Promise.all(rows.map(hydrateInspection));
}

export async function selectAllInspections(): Promise<Inspection[]> {
  const database = await getDatabase();

  const rows = await database.getAllAsync<InspectionRow>(
    `
      SELECT *
      FROM inspections
      ORDER BY updated_at DESC, date DESC;
      `,
  );

  return Promise.all(rows.map(hydrateInspection));
}

/*
 * ============================================================================
 * ELIMINAR
 * ============================================================================
 */

export async function deleteInspectionFromDatabase(id: string) {
  const database = await getDatabase();

  const result = await database.runAsync(
    `
      DELETE FROM inspections
      WHERE id = ?;
      `,
    id,
  );

  return result.changes > 0;
}

/*
 * ============================================================================
 * HIDRATAR INSPECCIÓN
 * ============================================================================
 *
 * Reconstruye el modelo Inspection a partir
 * de las tablas relacionales.
 */

async function hydrateInspection(row: InspectionRow): Promise<Inspection> {
  const database = await getDatabase();

  const responseRows = await database.getAllAsync<ResponseRow>(
    `
      SELECT
        question_id,
        value,
        value_type
      FROM inspection_responses
      WHERE inspection_id = ?
      ORDER BY id ASC;
      `,
    row.id,
  );

  const evidenceRows = await database.getAllAsync<EvidenceRow>(
    `
      SELECT evidence_id
      FROM inspection_evidences
      WHERE inspection_id = ?
      ORDER BY id ASC;
      `,
    row.id,
  );

  const responses: InspectionResponse[] = responseRows.map((response) => ({
    questionId: response.question_id,

    value: deserializeResponseValue(response.value, response.value_type),
  }));

  const evidenceIds = evidenceRows.map((evidence) => evidence.evidence_id);

  const inspection: Inspection = {
    id: row.id,

    companyId: row.company_id,

    propertyId: row.property_id,

    formId: row.form_id,

    inspector: row.inspector,

    date: row.date,

    /*
     * Bases antiguas pueden contener null durante una migración incompleta.
     * Usamos date como respaldo seguro.
     */
    createdAt: normalizeInspectionTimestamp(row.created_at, row.date),

    updatedAt: normalizeInspectionTimestamp(
      row.updated_at,
      row.created_at ?? row.date,
    ),

    status: row.status,

    responses,

    evidenceIds,

    integration: {
      syncStatus: row.sync_status,

      ...(row.sync_operation_id
        ? {
            syncOperationId: row.sync_operation_id,
          }
        : {}),

      syncAttempt: row.sync_attempt ?? 0,

      ...(row.kobo_asset_uid && row.kobo_submission_id
        ? {
            kobo: {
              provider: "kobo" as const,

              assetUid: row.kobo_asset_uid,

              submissionId: parseSubmissionId(row.kobo_submission_id),

              ...(row.kobo_uuid
                ? {
                    uuid: row.kobo_uuid,
                  }
                : {}),

              ...(row.kobo_synced_at
                ? {
                    syncedAt: row.kobo_synced_at,
                  }
                : {}),
            },
          }
        : {}),

      ...(row.last_sync_error
        ? {
            lastSyncError: row.last_sync_error,
          }
        : {}),
    },
  };

  return inspection;
}

/*
 * ============================================================================
 * NORMALIZAR TIMESTAMP
 * ============================================================================
 *
 * Protege lecturas provenientes de bases antiguas.
 *
 * Si el valor ya es ISO lo conservamos.
 * Si solamente existe YYYY-MM-DD agregamos hora UTC.
 */
function normalizeInspectionTimestamp(
  value: string | null,
  fallback: string,
): string {
  const source = value?.trim() || fallback.trim();

  if (source.includes("T")) {
    return source;
  }

  return `${source}T00:00:00.000Z`;
}

/*
 * ============================================================================
 * SERIALIZACIÓN DE RESPUESTAS
 * ============================================================================
 */

function serializeResponseValue(value: InspectionResponseValue): {
  value: string | null;
  type: string;
} {
  if (value === null) {
    return {
      value: null,
      type: "null",
    };
  }

  switch (typeof value) {
    case "string":
      return {
        value,
        type: "string",
      };

    case "number":
      return {
        value: String(value),

        type: "number",
      };

    case "boolean":
      return {
        value: value ? "1" : "0",

        type: "boolean",
      };

    default:
      return {
        value: null,
        type: "null",
      };
  }
}

function deserializeResponseValue(
  value: string | null,
  type: string,
): InspectionResponseValue {
  switch (type) {
    case "string":
      return value ?? "";

    case "number": {
      const parsed = Number(value);

      return Number.isNaN(parsed) ? null : parsed;
    }

    case "boolean":
      return value === "1";

    case "null":
    default:
      return null;
  }
}

/*
 * Conservamos IDs numéricos como number
 * cuando provienen de Kobo.
 */
function parseSubmissionId(value: string): string | number {
  const parsed = Number(value);

  if (Number.isFinite(parsed) && String(parsed) === value) {
    return parsed;
  }

  return value;
}
