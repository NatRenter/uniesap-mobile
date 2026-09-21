import * as SecureStore from "expo-secure-store";

import type { AuthSession } from "@/types/auth";

/*
 * ============================================================================
 * PERSISTENCIA NATIVA DE SESIÓN
 * ============================================================================
 *
 * Android / iOS utilizan SecureStore.
 *
 * Aquí se almacena únicamente el estado necesario para restaurar
 * una sesión.
 *
 * NO se almacenan contraseñas.
 *
 * Cuando exista la API UNIESAP, esta misma capa podrá almacenar
 * los tokens o datos de sesión entregados por el servidor.
 */

const AUTH_SESSION_KEY = "uniesap.auth-session.v1";

/*
 * Recupera la sesión almacenada en el dispositivo.
 */
export async function loadPersistedAuthSession(): Promise<AuthSession | null> {
  try {
    const raw = await SecureStore.getItemAsync(AUTH_SESSION_KEY);

    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as AuthSession;
  } catch (error) {
    console.error(
      "No fue posible recuperar la sesión segura de UNIESAP:",
      error,
    );

    return null;
  }
}

/*
 * Guarda la sesión de manera segura.
 */
export async function savePersistedAuthSession(
  session: AuthSession,
): Promise<void> {
  await SecureStore.setItemAsync(AUTH_SESSION_KEY, JSON.stringify(session));
}

/*
 * Elimina la sesión persistida.
 *
 * Se utiliza durante logout.
 */
export async function removePersistedAuthSession(): Promise<void> {
  await SecureStore.deleteItemAsync(AUTH_SESSION_KEY);
}
