/*
 * ============================================================================
 * TIPOS DE AUTENTICACIÓN
 * ============================================================================
 *
 * Estos tipos representan la identidad y la sesión de un usuario de UNIESAP.
 *
 * IMPORTANTE:
 *
 * AuthUser NO es lo mismo que UserProfile.
 *
 * AuthUser:
 * - identidad;
 * - correo;
 * - rol;
 * - proveedor de autenticación.
 *
 * UserProfile:
 * - nombre;
 * - apellidos;
 * - teléfono;
 * - profesión;
 * - cargo;
 * - fotografía.
 *
 * Esta separación permite conectar posteriormente:
 *
 * - autenticación por correo;
 * - Google;
 * - API UNIESAP;
 *
 * sin acoplar las pantallas a un proveedor específico.
 */

export type AuthProvider = "email" | "google";

export type UserRole = "inspector" | "admin";

/*
 * Identidad mínima del usuario autenticado.
 */
export type AuthUser = {
  id: string;

  email: string;

  role: UserRole;

  provider: AuthProvider;
};

/*
 * Sesión activa dentro de UNIESAP.
 *
 * En esta primera etapa local no existe todavía access token
 * ni refresh token.
 *
 * Cuando llegue la API UNIESAP podremos ampliar este tipo
 * sin modificar las pantallas.
 */
export type AuthSession = {
  user: AuthUser;

  createdAt: string;
};

/*
 * Información necesaria para registrar una cuenta mediante correo.
 *
 * Los campos profesionales alimentarán posteriormente UserProfile.
 */
export type RegisterInput = {
  firstName: string;

  lastName: string;

  email: string;

  password: string;

  confirmPassword: string;

  phone?: string;

  profession?: string;

  position?: string;
};

/*
 * Credenciales utilizadas para iniciar sesión.
 */
export type LoginInput = {
  email: string;

  password: string;
};
