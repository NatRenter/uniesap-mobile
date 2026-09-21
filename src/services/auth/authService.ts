import type { AuthSession, LoginInput, RegisterInput } from "@/types/auth";

/*
 * ============================================================================
 * CONTRATO DE AUTENTICACIÓN
 * ============================================================================
 *
 * Las pantallas de UNIESAP no deben conocer cómo funciona realmente
 * el proveedor de autenticación.
 *
 * Solamente conocen este contrato.
 *
 * Actualmente:
 *
 * AuthService
 *      ↓
 * LocalAuthService
 *
 * Futuro:
 *
 * AuthService
 *      ↓
 * API UNIESAP / proveedor real
 *      ↓
 * Email / Google
 */

export type AuthService = {
  /*
   * Registra una cuenta mediante correo.
   */
  registerWithEmail(input: RegisterInput): Promise<AuthSession>;

  /*
   * Inicia sesión mediante correo y contraseña.
   */
  loginWithEmail(input: LoginInput): Promise<AuthSession>;

  /*
   * Cierra la sesión actual.
   */
  logout(): Promise<void>;
};
