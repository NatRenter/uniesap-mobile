import {
  loadPersistedAuthSession,
  removePersistedAuthSession,
  savePersistedAuthSession,
} from "@/services/auth/authSessionStorage";

import type { AuthSession } from "@/types/auth";

/*
 * ============================================================================
 * REPOSITORIO DE SESIÓN
 * ============================================================================
 *
 * Es la fuente de verdad de la sesión actual durante la ejecución.
 *
 * Responsabilidades:
 *
 * - mantener AuthSession en memoria;
 * - restaurarla al iniciar UNIESAP;
 * - persistir cambios;
 * - eliminarla durante logout;
 * - notificar cambios a las pantallas.
 *
 * La forma concreta de almacenamiento depende de la plataforma:
 *
 * Native -> SecureStore
 * Web    -> localStorage durante desarrollo
 */

type AuthSessionListener = (session: AuthSession | null) => void;

let currentSession: AuthSession | null = null;

let hydrated = false;

let hydrationPromise: Promise<void> | null = null;

const listeners = new Set<AuthSessionListener>();

/*
 * Devuelve la sesión que actualmente está cargada en memoria.
 */
export function getAuthSession(): AuthSession | null {
  return cloneSession(currentSession);
}

/*
 * Indica si existe una sesión activa.
 */
export function isAuthenticated(): boolean {
  return currentSession !== null;
}

/*
 * Permite conocer si ya intentamos restaurar la sesión persistida.
 */
export function isAuthSessionHydrated(): boolean {
  return hydrated;
}

/*
 * Restaura la sesión al iniciar la aplicación.
 *
 * Varias llamadas simultáneas reutilizan la misma Promise.
 */
export async function hydrateAuthSessionRepository(): Promise<void> {
  if (hydrated) {
    return;
  }

  if (hydrationPromise) {
    return hydrationPromise;
  }

  hydrationPromise = (async () => {
    try {
      const persistedSession = await loadPersistedAuthSession();

      currentSession = cloneSession(persistedSession);

      hydrated = true;

      notifyListeners();
    } finally {
      hydrationPromise = null;
    }
  })();

  return hydrationPromise;
}

/*
 * Establece y persiste una nueva sesión.
 */
export async function setAuthSession(
  session: AuthSession,
): Promise<AuthSession> {
  const previousSession = cloneSession(currentSession);

  const nextSession = cloneSession(session)!;

  currentSession = nextSession;

  try {
    await savePersistedAuthSession(nextSession);

    hydrated = true;

    notifyListeners();

    return cloneSession(nextSession)!;
  } catch (error) {
    currentSession = previousSession;

    throw error;
  }
}

/*
 * Elimina tanto la sesión en memoria como la persistida.
 */
export async function clearAuthSession(): Promise<void> {
  const previousSession = cloneSession(currentSession);

  currentSession = null;

  try {
    await removePersistedAuthSession();

    hydrated = true;

    notifyListeners();
  } catch (error) {
    currentSession = previousSession;

    throw error;
  }
}

/*
 * Permite reaccionar a login, registro, restauración y logout.
 */
export function subscribeToAuthSession(
  listener: AuthSessionListener,
): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners(): void {
  const snapshot = cloneSession(currentSession);

  for (const listener of listeners) {
    listener(snapshot);
  }
}

/*
 * Evita exponer referencias internas modificables.
 */
function cloneSession(session: AuthSession | null): AuthSession | null {
  if (!session) {
    return null;
  }

  return {
    ...session,

    user: {
      ...session.user,
    },
  };
}
