/*
 * ============================================================================
 * CONFIGURACIÓN DE LA API CENTRAL DE UNIESAP
 * ============================================================================
 *
 * Esta configuración pertenece EXCLUSIVAMENTE a la API propia de UNIESAP.
 *
 * No debe utilizarse para Kobo.
 *
 * Durante Field Test 0.1 todavía no tenemos un servidor central definitivo,
 * por lo que mantenemos una URL provisional de desarrollo.
 *
 * Android Emulator:
 *
 * 10.0.2.2 permite acceder al localhost de la computadora anfitriona.
 *
 * Más adelante esta URL podrá salir de variables de entorno.
 */

export const uniesapApiConfig = {
  /*
   * API provisional que posteriormente levantaremos en la computadora.
   *
   * Ejemplo futuro:
   *
   * http://10.0.2.2:8000
   */
  baseUrl: "http://10.0.2.2:8000",

  /*
   * Tiempo máximo que permitiremos para una petición.
   */
  timeoutMs: 15000,

  /*
   * Versión actual de nuestra API.
   */
  apiVersion: "v1",

  /*
   * Identidad temporal del dispositivo/usuario de campo.
   *
   * Posteriormente vendrá de la sesión/autenticación.
   */
  clientId: "field-01",
} as const;
