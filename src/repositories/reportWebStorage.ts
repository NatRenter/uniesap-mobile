import type { Report } from "@/types/report";

/*
 * ============================================================================
 * REPORT WEB STORAGE
 * ============================================================================
 *
 * Persistencia de reportes para navegador.
 *
 * Android / iOS utiliza SQLite.
 * Web utiliza localStorage.
 */

const STORAGE_KEY = "uniesap.reports.v1";

/*
 * ============================================================================
 * LEER
 * ============================================================================
 */
export function loadWebReports(): Report[] | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) {
      return null;
    }

    return parsed.map((report) => cloneReport(report as Report));
  } catch (error) {
    console.error("No fue posible leer reportes desde localStorage:", error);

    return null;
  }
}

/*
 * ============================================================================
 * GUARDAR
 * ============================================================================
 */
export function saveWebReports(reports: Report[]): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    STORAGE_KEY,

    JSON.stringify(reports),
  );
}

function cloneReport(report: Report): Report {
  return {
    ...report,
  };
}
