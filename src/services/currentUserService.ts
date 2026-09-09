/*
 * ============================================================================
 * USUARIO ACTUAL DE UNIESAP
 * ============================================================================
 *
 * Esta capa concentra la identidad del usuario que realiza una inspección.
 *
 * Por ahora no existe autenticación real, por lo que utilizamos un usuario
 * temporal de desarrollo. Cuando se implemente sesión/API, solamente habrá que
 * cambiar esta capa sin volver a modificar cada pantalla de captura.
 */

export type CurrentUser = {
  id: string;
  name: string;
  role: "inspector" | "admin";
};

/*
 * Usuario temporal utilizado durante esta etapa del proyecto.
 *
 * IMPORTANTE:
 * No representa al responsable capturado dentro de un formulario.
 * Ese responsable continúa siendo solamente una respuesta de la inspección.
 */
const developmentUser: CurrentUser = {
  id: "dev-inspector-uniesap",
  name: "Inspector UNIESAP",
  role: "inspector",
};

/*
 * Devuelve una copia para evitar modificaciones accidentales
 * sobre el usuario temporal almacenado en este módulo.
 */
export function getCurrentUser(): CurrentUser {
  return { ...developmentUser };
}

/*
 * Atajo utilizado por las capturas para persistir el nombre del inspector.
 *
 * En el futuro este valor procederá de la sesión autenticada.
 */
export function getCurrentInspectorName(): string {
  return getCurrentUser().name;
}
