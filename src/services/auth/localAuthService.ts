import {
  clearAuthSession,
  setAuthSession,
} from "@/repositories/authSessionRepository";

import type { AuthService } from "@/services/auth/authService";

import type { AuthSession, LoginInput, RegisterInput } from "@/types/auth";

/*
 * ============================================================================
 * AUTENTICACIÓN LOCAL DE DESARROLLO
 * ============================================================================
 *
 * Permite desarrollar el flujo de identidad antes de conectar
 * el proveedor real.
 *
 * IMPORTANTE:
 *
 * NO almacenamos contraseñas.
 *
 * La sesión creada durante registro sí puede persistirse porque
 * solamente contiene identidad básica y no credenciales secretas.
 */

export const localAuthService: AuthService = {
  async registerWithEmail(input: RegisterInput): Promise<AuthSession> {
    const normalized = normalizeRegisterInput(input);

    validateRegisterInput(normalized);

    const session: AuthSession = {
      user: {
        id: createLocalUserId(),

        email: normalized.email,

        /*
         * El registro público siempre crea inspectores.
         *
         * El rol admin deberá asignarse posteriormente
         * desde una operación administrativa autorizada.
         */
        role: "inspector",

        provider: "email",
      },

      createdAt: new Date().toISOString(),
    };

    return setAuthSession(session);
  },

  async loginWithEmail(input: LoginInput): Promise<AuthSession> {
    const email = normalizeEmail(input.email);

    if (!email) {
      throw new Error("Ingresa tu correo electrónico.");
    }

    if (!isValidEmail(email)) {
      throw new Error("Ingresa un correo electrónico válido.");
    }

    if (!input.password) {
      throw new Error("Ingresa tu contraseña.");
    }

    /*
     * Todavía no existe un proveedor seguro contra el cual
     * validar las credenciales.
     *
     * No simulamos esa validación guardando contraseñas
     * en SQLite o localStorage.
     */
    throw new Error(
      "El inicio de sesión por correo estará disponible al conectar el proveedor de autenticación.",
    );
  },

  async logout(): Promise<void> {
    await clearAuthSession();
  },
};

function normalizeRegisterInput(input: RegisterInput): RegisterInput {
  return {
    firstName: input.firstName.trim(),

    lastName: input.lastName.trim(),

    email: normalizeEmail(input.email),

    password: input.password,

    confirmPassword: input.confirmPassword,

    phone: normalizeOptional(input.phone),

    profession: normalizeOptional(input.profession),

    position: normalizeOptional(input.position),
  };
}

function validateRegisterInput(input: RegisterInput): void {
  if (!input.firstName) {
    throw new Error("Ingresa tu nombre.");
  }

  if (!input.lastName) {
    throw new Error("Ingresa tus apellidos.");
  }

  if (!input.email) {
    throw new Error("Ingresa tu correo electrónico.");
  }

  if (!isValidEmail(input.email)) {
    throw new Error("Ingresa un correo electrónico válido.");
  }

  if (!input.password) {
    throw new Error("Ingresa una contraseña.");
  }

  if (input.password.length < 8) {
    throw new Error("La contraseña debe contener al menos 8 caracteres.");
  }

  if (input.password !== input.confirmPassword) {
    throw new Error("Las contraseñas no coinciden.");
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizeOptional(value: string | undefined): string | undefined {
  const normalized = value?.trim();

  return normalized || undefined;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function createLocalUserId(): string {
  return `local-user-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
