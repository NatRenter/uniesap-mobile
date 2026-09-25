import { getDatabase } from "@/database/database";

import type { Company } from "@/types/company";
import type { SyncStatus } from "@/types/sync";

/*
 * ============================================================================
 * COMPANY DATABASE
 * ============================================================================
 *
 * Conecta CompanyRepository con SQLite.
 *
 * La tabla companies NO almacena relaciones de inmuebles.
 *
 * La relación real es:
 *
 * properties.company_id
 *
 * ============================================================================
 * SINCRONIZACIÓN
 * ============================================================================
 *
 * CompanyDatabase también persiste los metadatos técnicos necesarios
 * para sincronizar una empresa con UNIESAP API.
 */

type CompanyRow = {
  id: string;

  name: string;

  legal_name: string;

  rfc: string | null;

  state: string;

  city: string;

  phone: string | null;

  email: string | null;

  primary_color: string;

  secondary_color: string | null;

  logo: string | null;

  status: Company["status"];

  created_at: string;

  updated_at: string;

  /*
   * Soft delete.
   */
  deleted_at: string | null;

  /*
   * Sincronización UNIESAP.
   */
  sync_status: SyncStatus;

  server_version: number;

  sync_operation_id: string | null;

  last_synced_at: string | null;

  last_sync_error: string | null;
};

/*
 * ============================================================================
 * CONTAR
 * ============================================================================
 */
export async function countCompanies(): Promise<number> {
  const database = await getDatabase();

  const row = await database.getFirstAsync<{
    count: number;
  }>(`
      SELECT COUNT(*) AS count
      FROM companies;
    `);

  return row?.count ?? 0;
}

/*
 * ============================================================================
 * LEER TODAS
 * ============================================================================
 */
export async function selectAllCompanies(): Promise<Company[]> {
  const database = await getDatabase();

  const rows = await database.getAllAsync<CompanyRow>(`
      SELECT
        id,
        name,
        legal_name,
        rfc,
        state,
        city,
        phone,
        email,
        primary_color,
        secondary_color,
        logo,
        status,
        created_at,
        updated_at,
        deleted_at,
        sync_status,
        server_version,
        sync_operation_id,
        last_synced_at,
        last_sync_error
      FROM companies
      ORDER BY
        updated_at DESC,
        name ASC;
    `);

  return rows.map(mapCompanyRow);
}

/*
 * ============================================================================
 * INSERTAR
 * ============================================================================
 */
export async function insertCompany(company: Company): Promise<void> {
  const database = await getDatabase();

  await database.runAsync(
    `
      INSERT INTO companies (
        id,
        name,
        legal_name,
        rfc,
        state,
        city,
        phone,
        email,
        primary_color,
        secondary_color,
        logo,
        status,
        created_at,
        updated_at,
        deleted_at,
        sync_status,
        server_version,
        sync_operation_id,
        last_synced_at,
        last_sync_error
      )
      VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?
      );
    `,

    company.id,

    company.name,

    company.legalName,

    company.rfc ?? null,

    company.state,

    company.city,

    company.phone ?? null,

    company.email ?? null,

    company.branding.primaryColor,

    company.branding.secondaryColor ?? null,

    company.branding.logo ?? null,

    company.status,

    company.createdAt,

    company.updatedAt,

    company.deletedAt ?? null,

    company.sync.status,

    company.sync.serverVersion,

    company.sync.operationId ?? null,

    company.sync.lastSyncedAt ?? null,

    company.sync.lastSyncError ?? null,
  );
}

/*
 * ============================================================================
 * REEMPLAZAR
 * ============================================================================
 *
 * Actualiza el registro completo, incluidos sus metadatos de sincronización.
 *
 * Se conserva INSERT OR REPLACE por compatibilidad con el comportamiento
 * actual del repositorio.
 */
export async function replaceCompany(company: Company): Promise<void> {
  const database = await getDatabase();

  await database.runAsync(
    `
      INSERT OR REPLACE INTO companies (
        id,
        name,
        legal_name,
        rfc,
        state,
        city,
        phone,
        email,
        primary_color,
        secondary_color,
        logo,
        status,
        created_at,
        updated_at,
        deleted_at,
        sync_status,
        server_version,
        sync_operation_id,
        last_synced_at,
        last_sync_error
      )
      VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?
      );
    `,

    company.id,

    company.name,

    company.legalName,

    company.rfc ?? null,

    company.state,

    company.city,

    company.phone ?? null,

    company.email ?? null,

    company.branding.primaryColor,

    company.branding.secondaryColor ?? null,

    company.branding.logo ?? null,

    company.status,

    company.createdAt,

    company.updatedAt,

    company.deletedAt ?? null,

    company.sync.status,

    company.sync.serverVersion,

    company.sync.operationId ?? null,

    company.sync.lastSyncedAt ?? null,

    company.sync.lastSyncError ?? null,
  );
}

/*
 * ============================================================================
 * ELIMINAR FÍSICAMENTE
 * ============================================================================
 *
 * Esta función se conserva temporalmente porque CompanyRepository todavía
 * utiliza eliminación física.
 *
 * En la siguiente etapa deleteCompany() evolucionará a soft delete.
 */
export async function deleteCompanyFromDatabase(id: string): Promise<boolean> {
  const database = await getDatabase();

  const result = await database.runAsync(
    `
        DELETE FROM companies
        WHERE id = ?;
      `,

    id,
  );

  return result.changes > 0;
}

/*
 * ============================================================================
 * SQLITE → COMPANY
 * ============================================================================
 */
function mapCompanyRow(row: CompanyRow): Company {
  return {
    id: row.id,

    name: row.name,

    legalName: row.legal_name,

    ...(row.rfc
      ? {
          rfc: row.rfc,
        }
      : {}),

    state: row.state,

    city: row.city,

    ...(row.phone
      ? {
          phone: row.phone,
        }
      : {}),

    ...(row.email
      ? {
          email: row.email,
        }
      : {}),

    branding: {
      primaryColor: row.primary_color,

      ...(row.secondary_color
        ? {
            secondaryColor: row.secondary_color,
          }
        : {}),

      ...(row.logo
        ? {
            logo: row.logo,
          }
        : {}),
    },

    status: row.status,

    createdAt: row.created_at,

    updatedAt: row.updated_at,

    ...(row.deleted_at
      ? {
          deletedAt: row.deleted_at,
        }
      : {}),

    sync: {
      status: row.sync_status,

      serverVersion: row.server_version,

      ...(row.sync_operation_id
        ? {
            operationId: row.sync_operation_id,
          }
        : {}),

      ...(row.last_synced_at
        ? {
            lastSyncedAt: row.last_synced_at,
          }
        : {}),

      ...(row.last_sync_error
        ? {
            lastSyncError: row.last_sync_error,
          }
        : {}),
    },
  };
}
