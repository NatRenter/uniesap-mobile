import type { Company } from "@/types/company";

/*
 * ============================================================================
 * COMPANY WEB STORAGE
 * ============================================================================
 *
 * Persistencia de empresas para Web.
 *
 * Actualmente utiliza localStorage.
 *
 * Company ya no almacena relaciones con inmuebles.
 * Esa información pertenece a PropertyRepository.
 */

const STORAGE_KEY = "uniesap.companies.v1";

/*
 * ============================================================================
 * LEER
 * ============================================================================
 */
export function loadWebCompanies(): Company[] | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Company[];

    return parsed.map(cloneCompany);
  } catch (error) {
    console.error("No fue posible leer empresas desde localStorage:", error);

    return null;
  }
}

/*
 * ============================================================================
 * GUARDAR
 * ============================================================================
 */
export function saveWebCompanies(companies: Company[]): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    STORAGE_KEY,

    JSON.stringify(companies),
  );
}

/*
 * Copia defensiva para no compartir
 * referencias mutables de branding.
 */
function cloneCompany(company: Company): Company {
  return {
    ...company,

    branding: {
      ...company.branding,
    },
  };
}
