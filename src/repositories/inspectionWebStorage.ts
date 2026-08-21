import type { Inspection } from "@/types/inspection";

/*
 * ============================================================================
 * PERSISTENCIA WEB DE INSPECCIONES
 * ============================================================================
 *
 * Web utiliza localStorage mientras Android/iOS utilizan SQLite.
 *
 * Este módulo no conoce nada de la interfaz ni de Kobo.
 * Su única responsabilidad es leer y escribir la copia persistente
 * de inspecciones utilizada por el repositorio.
 */

const STORAGE_KEY = "uniesap.inspections.v1";

/* -------------------------------------------------------------------------- */
/*                                  LEER                                      */
/* -------------------------------------------------------------------------- */

export function loadWebInspections(): Inspection[] | null {
  /*
   * Protección para renderizado fuera del navegador.
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
      console.warn(
        "El contenido persistido de inspecciones web no tiene un formato válido.",
      );

      return null;
    }

    return parsed as Inspection[];
  } catch (error) {
    /*
     * Un fallo de lectura no impide iniciar UNIESAP.
     *
     * En ese caso el repositorio utilizará el seed
     * de desarrollo como fallback.
     */
    console.error(
      "No fue posible leer inspecciones desde localStorage:",
      error,
    );

    return null;
  }
}

/* -------------------------------------------------------------------------- */
/*                                  GUARDAR                                   */
/* -------------------------------------------------------------------------- */

export function saveWebInspections(inspections: Inspection[]): void {
  if (typeof window === "undefined") {
    throw new Error("localStorage no está disponible en este entorno.");
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(inspections));
  } catch (error) {
    /*
     * IMPORTANTE:
     *
     * A diferencia de loadWebInspections(), aquí propagamos
     * el error al repositorio.
     *
     * Esto permite que createInspection()/updateInspection()
     * sepan que la persistencia NO quedó confirmada y puedan
     * revertir su cambio temporal en memoria.
     */
    console.error(
      "No fue posible guardar inspecciones en localStorage:",
      error,
    );

    throw error;
  }
}

/* -------------------------------------------------------------------------- */
/*                                  LIMPIAR                                   */
/* -------------------------------------------------------------------------- */

/*
 * Herramienta destinada principalmente a desarrollo/pruebas.
 */
export function clearWebInspections(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}
