import type { KoboService } from "./koboService";

import type {
  KoboAssetReference,
  KoboSubmissionData,
  KoboSubmissionId,
  KoboSubmissionReference,
} from "./types";

export type RemoteKoboServiceConfig = {
  /*
   * URL de la API/backend de UNIESAP.
   *
   * Ejemplo futuro:
   *
   * https://api.uniesap.com
   *
   * NO tiene que ser necesariamente
   * la URL directa de Kobo.
   */
  baseUrl: string;

  getAccessToken?: () => Promise<string | null>;
};

export class RemoteKoboService implements KoboService {
  constructor(private readonly config: RemoteKoboServiceConfig) {}

  /* -------------------------------------------------------------------- */
  /*                                  READ                                */
  /* -------------------------------------------------------------------- */

  async getAsset(assetUid: string): Promise<KoboAssetReference> {
    return this.request<KoboAssetReference>(
      `/integrations/kobo/assets/${encodeURIComponent(assetUid)}`,
    );
  }

  async getSubmissions(assetUid: string): Promise<KoboSubmissionReference[]> {
    return this.request<KoboSubmissionReference[]>(
      `/integrations/kobo/assets/${encodeURIComponent(assetUid)}/submissions`,
    );
  }

  async getSubmission(
    assetUid: string,
    submissionId: KoboSubmissionId,
  ): Promise<KoboSubmissionData> {
    return this.request<KoboSubmissionData>(
      `/integrations/kobo/assets/${encodeURIComponent(
        assetUid,
      )}/submissions/${encodeURIComponent(String(submissionId))}`,
    );
  }

  /* -------------------------------------------------------------------- */
  /*                                 WRITE                                */
  /* -------------------------------------------------------------------- */

  async createSubmission(
    assetUid: string,
    data: KoboSubmissionData,
  ): Promise<KoboSubmissionReference> {
    return this.request<KoboSubmissionReference>(
      `/integrations/kobo/assets/${encodeURIComponent(assetUid)}/submissions`,
      {
        method: "POST",

        body: JSON.stringify(data),
      },
    );
  }

  /* -------------------------------------------------------------------- */
  /*                                REQUEST                               */
  /* -------------------------------------------------------------------- */

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const baseUrl = this.config.baseUrl.replace(/\/+$/, "");

    const accessToken = this.config.getAccessToken
      ? await this.config.getAccessToken()
      : null;

    const response = await fetch(`${baseUrl}${path}`, {
      ...init,

      /*
       * GET continúa siendo
       * el valor por defecto.
       */
      method: init?.method ?? "GET",

      headers: {
        Accept: "application/json",

        /*
         * Lo necesitamos para POST.
         */
        "Content-Type": "application/json",

        ...(accessToken
          ? {
              Authorization: `Bearer ${accessToken}`,
            }
          : {}),

        ...(init?.headers ?? {}),
      },
    });

    if (!response.ok) {
      const message = await readErrorMessage(response);

      throw new Error(`Error HTTP ${response.status}: ${message}`);
    }

    return response.json() as Promise<T>;
  }
}

/* -------------------------------------------------------------------------- */
/*                               ERROR MESSAGE                                */
/* -------------------------------------------------------------------------- */

async function readErrorMessage(response: Response) {
  try {
    const data = (await response.json()) as {
      message?: string;

      detail?: string;
    };

    return data.message ?? data.detail ?? response.statusText;
  } catch {
    return response.statusText || "Error desconocido";
  }
}
