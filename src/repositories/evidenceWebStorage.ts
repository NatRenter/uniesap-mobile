import type { Evidence } from "@/types/evidence";

const STORAGE_KEY = "uniesap.evidences.v1";

export function loadWebEvidences(): Evidence[] | null {
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
        "El contenido persistido de evidencias web no tiene un formato válido.",
      );

      return null;
    }

    return parsed as Evidence[];
  } catch (error) {
    console.error("No fue posible leer evidencias desde localStorage:", error);

    return null;
  }
}

export function saveWebEvidences(evidences: Evidence[]): void {
  if (typeof window === "undefined") {
    throw new Error("localStorage no está disponible en este entorno.");
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(evidences));
  } catch (error) {
    console.error("No fue posible guardar evidencias en localStorage:", error);

    throw error;
  }
}

export function clearWebEvidences(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}
