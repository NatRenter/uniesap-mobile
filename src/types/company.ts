import type { SyncMetadata } from "@/types/sync";

/*
 * ============================================================================
 * BRANDING DE EMPRESA
 * ============================================================================
 */
export type CompanyBranding = {
  primaryColor: string;

  secondaryColor?: string;

  logo?: string;
};

/*
 * ============================================================================
 * EMPRESA
 * ============================================================================
 *
 * Company representa una empresa dentro del dominio de UNIESAP.
 *
 * La identidad es creada localmente y posteriormente será conservada
 * por UNIESAP API.
 */
export type Company = {
  /*
   * Identificador interno de UNIESAP.
   *
   * Las empresas nuevas utilizan UUID.
   *
   * Los identificadores legacy se mantienen compatibles mientras
   * existan registros antiguos.
   */
  id: string;

  name: string;

  legalName: string;

  rfc?: string;

  state: string;

  city: string;

  phone?: string;

  email?: string;

  branding: CompanyBranding;

  /*
   * La relación con los inmuebles NO se almacena aquí.
   *
   * La fuente real es:
   *
   * Property.companyId
   */
  status: "active" | "inactive";

  /*
   * Fecha de creación del registro.
   */
  createdAt: string;

  /*
   * Última modificación real de la empresa.
   *
   * Esta fecha pertenece al dominio local.
   * No se utilizará como único cursor de sincronización.
   */
  updatedAt: string;

  /*
   * ==========================================================================
   * SOFT DELETE
   * ==========================================================================
   *
   * Cuando tenga valor, la empresa fue eliminada lógicamente.
   *
   * No eliminaremos inmediatamente el registro porque otro dispositivo
   * necesita poder recibir esta eliminación.
   *
   * Ejemplo:
   *
   * Teléfono A
   *     ↓
   * deletedAt = fecha
   *     ↓
   * API
   *     ↓
   * Teléfono B
   *     ↓
   * deja de mostrar Company
   */
  deletedAt?: string;

  /*
   * ==========================================================================
   * SINCRONIZACIÓN UNIESAP
   * ==========================================================================
   *
   * Metadatos técnicos para sincronización con nuestra API.
   *
   * Esto es independiente de Kobo.
   */
  sync: SyncMetadata;
};
