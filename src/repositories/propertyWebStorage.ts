import type { Property } from "@/types/property";

/*
 * ============================================================================
 * PROPERTY WEB STORAGE
 * ============================================================================
 *
 * Persistencia Web temporal basada en localStorage.
 */

const STORAGE_KEY = "uniesap.properties.v1";

export function loadWebProperties(): Property[] | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Property[];

    return parsed.map(cloneProperty);
  } catch (error) {
    console.error("No fue posible leer inmuebles desde localStorage:", error);

    return null;
  }
}

export function saveWebProperties(properties: Property[]): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(properties));
}

function cloneProperty(property: Property): Property {
  return {
    ...property,

    formIds: [...property.formIds],
  };
}
