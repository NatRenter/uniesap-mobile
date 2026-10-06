import {
    getCompanyByIdIncludingDeleted,
    updateCompanySyncMetadata,
} from "@/repositories/companyRepository";

import { upsertCompanyToApi } from "@/services/companyApiService";
import { getNetworkAvailability } from "@/services/networkService";

import type { Company } from "@/types/company";

/*
 * ============================================================================
 * COMPANY SYNC SERVICE
 * ============================================================================
 *
 * Sincroniza UNA empresa con la API central de UNIESAP.
 *
 * Esta capa:
 *
 * - obtiene Company desde el repository;
 * - comprueba conectividad;
 * - cambia el estado local de sync;
 * - llama a CompanyApiService;
 * - registra éxito o error.
 *
 * Esta capa NO:
 *
 * - conoce la interfaz;
 * - procesa una cola completa;
 * - conoce Kobo;
 * - crea un operationId nuevo durante un reintento.
 */

/* -------------------------------------------------------------------------- */
/*                              RESULTADO                                     */
/* -------------------------------------------------------------------------- */

export type CompanySyncResult =
  | {
      status: "synced";
      company: Company;
    }
  | {
      status: "skipped";
      company: Company;
      reason: string;
    }
  | {
      status: "error";
      company: Company;
      error: string;
    };

/* -------------------------------------------------------------------------- */
/*                         SINCRONIZAR EMPRESA                                */
/* -------------------------------------------------------------------------- */

export async function syncCompany(
  companyId: string,
): Promise<CompanySyncResult> {
  /*
   * Usamos la consulta interna porque también debemos poder
   * sincronizar empresas eliminadas lógicamente.
   */
  const company = getCompanyByIdIncludingDeleted(companyId);

  if (!company) {
    throw new Error(`Empresa no encontrada: ${companyId}`);
  }

  /*
   * Una empresa confirmada como synced no necesita volver a enviarse.
   */
  if (company.sync.status === "synced") {
    return {
      status: "skipped",
      company,
      reason: "La empresa ya está sincronizada.",
    };
  }

  /*
   * Toda operación que llegue hasta este servicio debe tener
   * una identidad idempotente.
   *
   * NO generamos una nueva aquí.
   *
   * El operationId fue creado cuando ocurrió:
   *
   * - createCompany();
   * - updateCompany();
   * - deleteCompany().
   */
  if (!company.sync.operationId) {
    return markCompanySyncError(
      company,
      "La empresa no tiene operationId para sincronizar.",
    );
  }

  /*
   * ==========================================================================
   * CONECTIVIDAD
   * ==========================================================================
   *
   * Si no hay Internet dejamos intacto el estado actual.
   *
   * La falta de conectividad no significa que los datos sean inválidos
   * ni que el servidor haya rechazado la operación.
   */
  let networkAvailable: boolean;

  try {
    networkAvailable = await getNetworkAvailability();
  } catch (error) {
    console.warn(
      "No fue posible comprobar la conectividad antes de sincronizar Company:",
      error,
    );

    return {
      status: "skipped",
      company,
      reason: "No fue posible comprobar la conexión a Internet.",
    };
  }

  if (!networkAvailable) {
    return {
      status: "skipped",
      company,
      reason: "Sin conexión a Internet. La empresa permanece pendiente.",
    };
  }

  /*
   * ==========================================================================
   * MARCAR COMO SYNCING
   * ==========================================================================
   *
   * updateCompanySyncMetadata() NO genera un operationId nuevo.
   *
   * Esto es fundamental para mantener idempotencia durante los reintentos.
   */
  const syncingCompany = await updateCompanySyncMetadata(company.id, {
    status: "syncing",

    /*
     * Conservamos explícitamente la operación actual.
     */
    operationId: company.sync.operationId,

    /*
     * Un intento nuevo limpia el error anterior.
     */
    lastSyncError: undefined,
  });

  if (!syncingCompany) {
    throw new Error(
      `No fue posible marcar la empresa ${company.id} como syncing.`,
    );
  }

  try {
    /*
     * =========================================================================
     * ENVÍO A UNIESAP API
     * =========================================================================
     *
     * CompanyApiService utiliza PUT como UPSERT.
     *
     * El mismo flujo sirve para:
     *
     * - creación;
     * - actualización;
     * - tombstone.
     */
    const response = await upsertCompanyToApi(syncingCompany);

    /*
     * =========================================================================
     * VALIDAR RESPUESTA
     * =========================================================================
     *
     * La respuesta debe pertenecer exactamente a:
     *
     * - esta Company;
     * - esta operación.
     *
     * Esto evita confirmar localmente una respuesta que no corresponde
     * al cambio que acabamos de enviar.
     */
    if (response.companyId !== syncingCompany.id) {
      throw new Error(
        `UNIESAP API respondió con companyId inesperado. Esperado: ${syncingCompany.id}. Recibido: ${response.companyId}.`,
      );
    }

    if (response.operationId !== syncingCompany.sync.operationId) {
      throw new Error(
        `UNIESAP API respondió con operationId inesperado para la empresa ${syncingCompany.id}.`,
      );
    }

    if (
      !Number.isInteger(response.serverVersion) ||
      response.serverVersion < 1
    ) {
      throw new Error(
        `UNIESAP API devolvió serverVersion inválido para la empresa ${syncingCompany.id}.`,
      );
    }

    if (
      typeof response.syncedAt !== "string" ||
      response.syncedAt.trim().length === 0
    ) {
      throw new Error(
        `UNIESAP API devolvió syncedAt inválido para la empresa ${syncingCompany.id}.`,
      );
    }

    /*
     * =========================================================================
     * CONFIRMAR SINCRONIZACIÓN
     * =========================================================================
     *
     * serverVersion pasa a representar la versión que el servidor
     * acaba de confirmar.
     *
     * Conservamos operationId como referencia de la última operación
     * confirmada. La siguiente edición local generará uno nuevo.
     */
    const syncedCompany = await updateCompanySyncMetadata(company.id, {
      status: "synced",

      serverVersion: response.serverVersion,

      operationId: syncingCompany.sync.operationId,

      lastSyncedAt: response.syncedAt,

      lastSyncError: undefined,
    });

    if (!syncedCompany) {
      throw new Error(
        `No fue posible registrar la sincronización de la empresa ${company.id}.`,
      );
    }

    console.log("Empresa sincronizada mediante CompanySyncService:", {
      companyId: syncedCompany.id,
      operationId: syncedCompany.sync.operationId,
      serverVersion: syncedCompany.sync.serverVersion,
      deletedAt: syncedCompany.deletedAt,
    });

    return {
      status: "synced",
      company: syncedCompany,
    };
  } catch (error) {
    /*
     * syncingCompany conserva:
     *
     * - operationId;
     * - serverVersion anterior;
     * - tombstone si existe.
     *
     * Por eso un reintento puede enviar exactamente la misma operación.
     */
    return markCompanySyncError(syncingCompany, getErrorMessage(error));
  }
}

/* -------------------------------------------------------------------------- */
/*                             MARCAR ERROR                                   */
/* -------------------------------------------------------------------------- */

async function markCompanySyncError(
  company: Company,
  message: string,
): Promise<CompanySyncResult> {
  const failedCompany = await updateCompanySyncMetadata(company.id, {
    status: "error",

    /*
     * Conservamos la identidad de la operación.
     */
    operationId: company.sync.operationId,

    lastSyncError: message,
  });

  if (!failedCompany) {
    throw new Error(
      `No fue posible guardar el error de sincronización de la empresa ${company.id}.`,
    );
  }

  console.error("Empresa marcada con error de sincronización:", {
    companyId: failedCompany.id,
    operationId: failedCompany.sync.operationId,
    serverVersion: failedCompany.sync.serverVersion,
    error: message,
  });

  return {
    status: "error",
    company: failedCompany,
    error: message,
  };
}

/* -------------------------------------------------------------------------- */
/*                          NORMALIZAR ERRORES                                */
/* -------------------------------------------------------------------------- */

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Ocurrió un error desconocido.";
}
