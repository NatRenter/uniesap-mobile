import type { UserProfile } from "@/types/userProfile";

/*
 * ============================================================================
 * PERSISTENCIA WEB DEL PERFIL
 * ============================================================================
 *
 * Web utiliza localStorage.
 *
 * Mantenemos la misma entidad UserProfile que utiliza SQLite
 * para que las pantallas no dependan de la plataforma.
 */

const STORAGE_KEY = "uniesap.user-profile.v1";

export function loadWebUserProfile(): UserProfile | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as UserProfile;
  } catch (error) {
    console.error(
      "No fue posible leer el perfil del usuario desde localStorage:",
      error,
    );

    return null;
  }
}

export function saveWebUserProfile(profile: UserProfile): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}
