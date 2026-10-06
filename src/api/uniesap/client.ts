import { uniesapApiConfig } from "./config";

import type { UniesapRequestOptions } from "./types";

/*
 * ============================================================================
 * ERROR HTTP DE LA API UNIESAP
 * ============================================================================
 *
 * Conservamos:
 *
 * - código HTTP;
 * - cuerpo recibido;
 * - mensaje legible.
 *
 * Esto permitirá que posteriormente CompanySyncService pueda distinguir
 * errores de red, validación, conflictos, etc.
 */
export class UniesapApiError extends Error {
  readonly status: number;

  readonly data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);

    this.name = "UniesapApiError";

    this.status = status;

    this.data = data;
  }
}

/*
 * ============================================================================
 * PARSEAR RESPUESTA
 * ============================================================================
 *
 * La API normalmente devolverá JSON.
 *
 * Sin embargo, aceptamos respuestas vacías o texto para evitar que
 * una respuesta 204 provoque un error intentando ejecutar response.json().
 */
async function parseResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();

  return text || null;
}

/*
 * ============================================================================
 * CONSTRUIR URL
 * ============================================================================
 */
function createUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${uniesapApiConfig.baseUrl}${normalizedPath}`;
}

/*
 * ============================================================================
 * CLIENTE HTTP UNIESAP
 * ============================================================================
 *
 * IMPORTANTE:
 *
 * Este cliente NO agrega:
 *
 * Host: kf.kobo.local
 *
 * porque ese encabezado pertenece exclusivamente al entorno Kobo.
 *
 * También enviamos una identidad temporal del cliente para Field Test 0.1.
 */
export async function uniesapApiRequest<TResponse, TBody = unknown>(
  path: string,
  options: UniesapRequestOptions<TBody> = {},
): Promise<TResponse> {
  const { method = "GET", body, headers = {}, signal } = options;

  const url = createUrl(path);

  /*
   * Si el consumidor proporciona su propio AbortSignal,
   * respetamos ese signal.
   *
   * De lo contrario creamos uno para aplicar timeout.
   */
  const timeoutController = signal ? null : new AbortController();

  const timeoutId = timeoutController
    ? setTimeout(() => {
        timeoutController.abort();
      }, uniesapApiConfig.timeoutMs)
    : null;

  try {
    const response = await fetch(url, {
      method,

      signal: signal ?? timeoutController?.signal,

      headers: {
        Accept: "application/json",

        /*
         * Identidad provisional para distinguir clientes
         * durante las pruebas de sincronización.
         */
        "X-UNIESAP-Client-Id": uniesapApiConfig.clientId,

        ...(body !== undefined
          ? {
              "Content-Type": "application/json",
            }
          : {}),

        ...headers,
      },

      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      throw new UniesapApiError(
        `HTTP ${response.status}`,
        response.status,
        data,
      );
    }

    return data as TResponse;
  } finally {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
  }
}
