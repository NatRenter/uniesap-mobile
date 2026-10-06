import { uniesapApiRequest } from "@/api/uniesap/client";

import type { Company } from "@/types/company";

/*
 * ============================================================================
 * COMPANY API SERVICE
 * ============================================================================
 *
 * Esta capa traduce Company, que pertenece al dominio local de UNIESAP,
 * al contrato HTTP utilizado por nuestra API central.
 *
 * IMPORTANTE:
 *
 * - NO conoce SQLite;
 * - NO modifica estados de sincronización;
 * - NO conoce Kobo;
 * - NO decide cuándo reintentar;
 * - NO procesa colas.
 *
 * Su única responsabilidad es comunicarse con UNIESAP API.
 */

/* -------------------------------------------------------------------------- */
/*                           CONTRATO DE ENVÍO                                 */
/* -------------------------------------------------------------------------- */

/*
 * Representa una operación local de Company que debe ser aceptada
 * idempotentemente por el servidor.
 *
 * operationId identifica ESTA operación concreta.
 *
 * companyId identifica permanentemente la empresa.
 *
 * serverVersion representa la última versión del servidor que el cliente
 * conocía cuando se produjo el cambio local.
 */
export type CompanyUpsertRequest = {
  operationId: string;

  companyId: string;

  serverVersion: number;

  company: {
    name: string;

    legalName: string;

    rfc?: string;

    state: string;

    city: string;

    phone?: string;

    email?: string;

    branding: Company["branding"];

    status: Company["status"];

    createdAt: string;

    updatedAt: string;

    deletedAt?: string;
  };
};

/* -------------------------------------------------------------------------- */
/*                         CONTRATO DE RESPUESTA                               */
/* -------------------------------------------------------------------------- */

/*
 * Respuesta mínima que necesitaremos para confirmar una sincronización.
 *
 * El servidor devuelve:
 *
 * - la empresa aceptada;
 * - la nueva versión monotónica del recurso;
 * - la fecha en que confirmó la operación.
 */
export type CompanyUpsertResponse = {
  companyId: string;

  operationId: string;

  serverVersion: number;

  syncedAt: string;
};

/* -------------------------------------------------------------------------- */
/*                          CREAR PAYLOAD                                      */
/* -------------------------------------------------------------------------- */

/*
 * Convierte Company al contrato de transporte.
 *
 * Los metadatos locales completos de sync NO se envían como parte
 * de los datos empresariales.
 *
 * Solamente enviamos los campos técnicos necesarios:
 *
 * operationId
 * serverVersion
 */
export function createCompanyUpsertRequest(
  company: Company,
): CompanyUpsertRequest {
  const operationId = company.sync.operationId;

  if (!operationId) {
    throw new Error(
      `La empresa ${company.id} no tiene operationId para sincronizar.`,
    );
  }

  return {
    operationId,

    companyId: company.id,

    serverVersion: company.sync.serverVersion,

    company: {
      name: company.name,

      legalName: company.legalName,

      ...(company.rfc
        ? {
            rfc: company.rfc,
          }
        : {}),

      state: company.state,

      city: company.city,

      ...(company.phone
        ? {
            phone: company.phone,
          }
        : {}),

      ...(company.email
        ? {
            email: company.email,
          }
        : {}),

      branding: {
        ...company.branding,
      },

      status: company.status,

      createdAt: company.createdAt,

      updatedAt: company.updatedAt,

      ...(company.deletedAt
        ? {
            deletedAt: company.deletedAt,
          }
        : {}),
    },
  };
}

/* -------------------------------------------------------------------------- */
/*                           SINCRONIZAR COMPANY                               */
/* -------------------------------------------------------------------------- */

/*
 * PUT funciona como UPSERT.
 *
 * Esto permite que el mismo flujo sirva para:
 *
 * - creación;
 * - modificación;
 * - eliminación lógica.
 *
 * El servidor debe utilizar operationId para garantizar idempotencia.
 */
export async function upsertCompanyToApi(
  company: Company,
): Promise<CompanyUpsertResponse> {
  const request = createCompanyUpsertRequest(company);

  return uniesapApiRequest<CompanyUpsertResponse, CompanyUpsertRequest>(
    `/api/v1/companies/${encodeURIComponent(company.id)}`,
    {
      method: "PUT",

      body: request,
    },
  );
}
