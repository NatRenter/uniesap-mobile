import { apiConfig } from "./config";
import { ApiError } from "./errors";
import type { RequestOptions } from "./types";

async function parseResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();

  return text || null;
}

export async function apiRequest<TResponse, TBody = unknown>(
  path: string,
  options: RequestOptions<TBody> = {},
): Promise<TResponse> {
  const { method = "GET", body, headers = {}, signal } = options;

  const url = `${apiConfig.baseUrl}${path}`;

  const response = await fetch(url, {
    method,
    signal,
    headers: {
      Host: apiConfig.hostHeader,
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await parseResponse(response);

  if (!response.ok) {
    throw new ApiError(`HTTP ${response.status}`, response.status, data);
  }

  return data as TResponse;
}
