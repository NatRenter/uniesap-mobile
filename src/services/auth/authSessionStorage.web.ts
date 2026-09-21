import type { AuthSession } from "@/types/auth";

/*
 * ============================================================================
 * PERSISTENCIA WEB DE SESIÓN
 * ============================================================================
 *
 * SecureStore no está disponible en Web.
 *
 * Durante esta etapa local utilizamos localStorage para conservar
 * únicamente nuestro AuthSession de desarrollo.
 *
 * IMPORTANTE:
 *
 * - NO se almacenan contraseñas.
 * - NO se almacenan secretos reales.
 * - NO se almacenan tokens de producción.
 *
 * Cuando exista la API UNIESAP, la autenticación web deberá evolucionar
 * hacia la estrategia definida por el backend.
 */

const AUTH_SESSION_KEY = "uniesap.auth-session.v1";

export async function loadPersistedAuthSession(): Promise<AuthSession | null> {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(AUTH_SESSION_KEY);

    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as AuthSession;
  } catch (error) {
    console.error("No fue posible recuperar la sesión Web de UNIESAP:", error);

    return null;
  }
}

export async function savePersistedAuthSession(
  session: AuthSession,
): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
}

export async function removePersistedAuthSession(): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_SESSION_KEY);
}
