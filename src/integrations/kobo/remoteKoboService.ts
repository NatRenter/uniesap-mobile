import type { KoboService } from "./koboService";

import type {
  KoboAssetReference,
  KoboAttachmentReference,
  KoboSubmissionAttachment,
  KoboSubmissionData,
  KoboSubmissionId,
  KoboSubmissionPackage,
  KoboSubmissionReference,
} from "./types";

export type RemoteKoboServiceConfig = {
  baseUrl: string;

  getAccessToken?: () => Promise<string | null>;
};

export class RemoteKoboService implements KoboService {
  constructor(private readonly config: RemoteKoboServiceConfig) {}

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

  async createSubmission(
    assetUid: string,
    submission: KoboSubmissionPackage,
  ): Promise<KoboSubmissionReference> {
    return this.request<KoboSubmissionReference>(
      `/integrations/kobo/assets/${encodeURIComponent(assetUid)}/submissions`,
      {
        method: "POST",

        body: JSON.stringify(submission),
      },
    );
  }

  /*
   * Endpoint futuro del backend UNIESAP.
   *
   * El backend será responsable de leer el archivo real
   * y enviarlo a Kobo con el formato requerido.
   */
  async uploadAttachment(
    assetUid: string,
    submissionId: KoboSubmissionId,
    attachment: KoboSubmissionAttachment,
  ): Promise<KoboAttachmentReference> {
    return this.request<KoboAttachmentReference>(
      `/integrations/kobo/assets/${encodeURIComponent(
        assetUid,
      )}/submissions/${encodeURIComponent(String(submissionId))}/attachments`,
      {
        method: "POST",

        body: JSON.stringify(attachment),
      },
    );
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const baseUrl = this.config.baseUrl.replace(/\/+$/, "");

    const accessToken = this.config.getAccessToken
      ? await this.config.getAccessToken()
      : null;

    const response = await fetch(`${baseUrl}${path}`, {
      ...init,

      method: init?.method ?? "GET",

      headers: {
        Accept: "application/json",

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
