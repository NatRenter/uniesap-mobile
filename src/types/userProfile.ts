/*
 * ============================================================================
 * PERFIL DE USUARIO
 * ============================================================================
 *
 * Por ahora el perfil contiene únicamente información personal
 * y profesional.
 *
 * Roles, permisos y control de acceso se dejan fuera
 * hasta que decidamos implementar el módulo de usuarios completo.
 */

export type UserProfile = {
  id: "current-user";

  firstName: string;
  lastName: string;

  email: string;
  phone?: string;

  profession?: string;
  position?: string;

  /*
   * URI local o Web de la fotografía elegida.
   *
   * Native:
   * file://...
   *
   * Web:
   * normalmente una URI generada por el selector.
   */
  photoUri?: string;

  createdAt: string;
  updatedAt: string;
};

export type UpdateUserProfileInput = {
  firstName: string;
  lastName: string;

  email: string;
  phone?: string;

  profession?: string;
  position?: string;

  photoUri?: string;
};
