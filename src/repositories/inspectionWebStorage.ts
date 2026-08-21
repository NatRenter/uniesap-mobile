import type { Inspection } from "@/types/inspection";

/*
 * ============================================================================
 * PERSISTENCIA WEB DE INSPECCIONES
 * ============================================================================
 *
 * Web utiliza localStorage mientras Android/iOS utilizan SQLite.
 *
 * Esto nos permite conservar inspecciones al refrescar el navegador
 * sin introducir SQLite Web en esta etapa del proyecto.
 */

const STORAGE_KEY = "uniesap.inspections.v1";

/* -------------------------------------------------------------------------- */
/*                                  READ                                      */
/* -------------------------------------------------------------------------- */

export function loadWebInspections(): Inspection[] | null {
  /*
   * Protección por si este módulo alguna vez fuera
   * evaluado fuera del navegador.
   */
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) {
      return null;
    }

    return parsed as Inspection[];
  } catch (error) {
    console.error(
      "No fue posible leer inspecciones desde localStorage:",
      error,
    );

    return null;
  }
}

/* -------------------------------------------------------------------------- */
/*                                  WRITE                                     */
/* -------------------------------------------------------------------------- */

export function saveWebInspections(inspections: Inspection[]): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(inspections));
  } catch (error) {
    console.error(
      "No fue posible guardar inspecciones en localStorage:",
      error,
    );
  }
}

/* -------------------------------------------------------------------------- */
/*                                 CLEAR                                      */
/* -------------------------------------------------------------------------- */

/*
 * Solo para desarrollo/pruebas.
 */
export function clearWebInspections(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}
