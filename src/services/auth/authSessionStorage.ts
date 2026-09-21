import type { AuthSession } from "@/types/auth";

/*
 * ============================================================================
 * PERSISTENCIA DE SESIÓN - IMPLEMENTACIÓN BASE
 * ============================================================================
 *
 * Este archivo mantiene el mismo patrón de resolución por plataforma
 * que ya utiliza UNIESAP en otros servicios:
 *
 * authSessionStorage.ts
 * authSessionStorage.native.ts
 * authSessionStorage.web.ts
 *
 * Durante la ejecución:
 *
 * Android / iOS
 *   -> authSessionStorage.native.ts
 *   -> SecureStore
 *
 * Web
 *   -> authSessionStorage.web.ts
 *   -> localStorage
 *
 * Este archivo funciona como implementación base y permite que
 * TypeScript y ESLint resuelvan correctamente el módulo.
 *
 * IMPORTANTE:
 *
 * Aquí no se almacenan contraseñas, tokens ni secretos.
 * La implementación base solamente mantiene compatibilidad
 * cuando no existe una implementación específica de plataforma.
 */

let fallbackSession: AuthSession | null = null;

/*
 * Recupera la sesión disponible en la implementación base.
 */
export async function loadPersistedAuthSession(): Promise<AuthSession | null> {
  return cloneSession(fallbackSession);
}

/*
 * Guarda temporalmente una sesión en memoria.
 *
 * Android/iOS y Web reemplazan esta implementación mediante
 * sus respectivos archivos específicos de plataforma.
 */
export async function savePersistedAuthSession(
  session: AuthSession,
): Promise<void> {
  fallbackSession = cloneSession(session);
}

/*
 * Elimina la sesión almacenada por la implementación base.
 */
export async function removePersistedAuthSession(): Promise<void> {
  fallbackSession = null;
}

/*
 * Crea una copia para evitar que otros módulos modifiquen
 * accidentalmente la referencia interna.
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
