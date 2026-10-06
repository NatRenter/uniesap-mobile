/*
 * ============================================================================
 * TIPOS HTTP — API UNIESAP
 * ============================================================================
 *
 * Estos tipos pertenecen al transporte HTTP hacia nuestra API central.
 *
 * No contienen tipos específicos de Kobo.
 */

/*
 * Métodos HTTP utilizados por la aplicación.
 */
export type UniesapHttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/*
 * Opciones disponibles para una petición.
 */
export interface UniesapRequestOptions<TBody = unknown> {
  method?: UniesapHttpMethod;

  body?: TBody;

  headers?: Record<string, string>;

  signal?: AbortSignal;
}

/*
 * Forma básica que puede devolver la API cuando ocurre un error.
 *
 * La API todavía no está implementada, por lo que mantenemos
 * este contrato deliberadamente pequeño.
 */
export interface UniesapApiErrorResponse {
  detail?: string;

  message?: string;

  [key: string]: unknown;
}
