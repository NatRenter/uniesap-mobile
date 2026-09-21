import { getAuthSession } from "@/repositories/authSessionRepository";

import { getUserProfile } from "@/repositories/userProfileRepository";

import type { UserRole } from "@/types/auth";

/*
 * ============================================================================
 * USUARIO ACTUAL DE UNIESAP
 * ============================================================================
 *
 * Esta capa concentra la identidad del usuario que trabaja actualmente
 * dentro de UNIESAP.
 *
 * Las pantallas de captura NO necesitan conocer:
 *
 * - AuthSession;
 * - Google;
 * - correo/contraseña;
 * - tokens;
 * - proveedor de autenticación.
 *
 * Solamente consumen CurrentUser.
 *
 * Esto permite sustituir posteriormente la autenticación local
 * por la API UNIESAP sin modificar la lógica de inspecciones.
 */

export type CurrentUser = {
  id: string;

  name: string;

  email: string;

  role: UserRole;
};

/*
 * Devuelve el usuario asociado a la sesión actual.
 *
 * El nombre visible procede de UserProfile porque ahí vive
 * la información personal del usuario.
 */
export function getCurrentUser(): CurrentUser | null {
  const session = getAuthSession();

  if (!session) {
    return null;
  }

  const profile = getUserProfile();

  const fullName = `${profile.firstName} ${profile.lastName}`.trim();

  return {
    id: session.user.id,

    name: fullName || session.user.email,

    email: session.user.email,

    role: session.user.role,
  };
}

/*
 * Devuelve el nombre que se guarda como inspector
 * dentro de una inspección.
 *
 * Mientras no exista sesión devolvemos un valor neutral.
 *
 * Más adelante, cuando todas las rutas estén completamente
 * protegidas, una captura nunca debería ejecutarse sin sesión.
 */
export function getCurrentInspectorName(): string {
  const user = getCurrentUser();

  return user?.name ?? "Usuario UNIESAP";
}
