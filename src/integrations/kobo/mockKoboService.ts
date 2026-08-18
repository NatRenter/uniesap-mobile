import type { KoboService } from "./koboService";

import type {
  KoboAssetReference,
  KoboSubmissionData,
  KoboSubmissionId,
  KoboSubmissionReference,
} from "./types";

/*
 * Datos ficticios de Kobo utilizados
 * únicamente durante el desarrollo.
 *
 * No corresponden todavía a proyectos
 * reales de Kobo.
 */

const mockAssets: Record<string, KoboAssetReference> = {
  "mock-asset-risk": {
    assetUid: "mock-asset-risk",
    deploymentStatus: "deployed",
    versionUid: "mock-version-risk-001",
    syncedAt: "2026-08-18T09:00:00",
  },

  "mock-asset-extinguishers": {
    assetUid: "mock-asset-extinguishers",
    deploymentStatus: "deployed",
    versionUid: "mock-version-extinguishers-001",
    syncedAt: "2026-08-18T09:00:00",
  },
};

const mockSubmissions: Record<string, KoboSubmissionReference[]> = {
  "mock-asset-risk": [
    {
      assetUid: "mock-asset-risk",
      submissionId: 1001,
      uuid: "mock-risk-1001",
      submittedAt: "2026-08-10T10:30:00",
      syncedAt: "2026-08-18T09:00:00",
    },

    {
      assetUid: "mock-asset-risk",
      submissionId: 1002,
      uuid: "mock-risk-1002",
      submittedAt: "2026-08-14T11:00:00",
      syncedAt: "2026-08-18T09:00:00",
    },
  ],

  "mock-asset-extinguishers": [
    {
      assetUid: "mock-asset-extinguishers",
      submissionId: 2001,
      uuid: "mock-extinguisher-2001",
      submittedAt: "2026-08-12T12:00:00",
      syncedAt: "2026-08-18T09:00:00",
    },
  ],
};

const mockSubmissionData: Record<string, KoboSubmissionData> = {
  "mock-asset-risk:1001": {
    "datos_generales/responsable": "Alexis",

    "riesgos/condiciones_riesgo": true,

    "riesgos/observaciones":
      "Se identificaron condiciones que requieren seguimiento.",

    "riesgos/evidencia": "riesgo-area-01.jpg",
  },

  "mock-asset-risk:1002": {
    "datos_generales/responsable": "Alexis",

    "riesgos/condiciones_riesgo": false,

    "riesgos/observaciones": "Sin condiciones adicionales registradas.",

    "riesgos/evidencia": "riesgo-area-02.jpg",
  },

  "mock-asset-extinguishers:2001": {
    "extintor/numero": "EXT-001",

    "extintor/estado": "Bueno",

    "extintor/fotografia": "extintor-001.jpg",
  },
};

export class MockKoboService implements KoboService {
  async getAsset(assetUid: string): Promise<KoboAssetReference> {
    const asset = mockAssets[assetUid];

    if (!asset) {
      throw new Error(`Kobo asset not found: ${assetUid}`);
    }

    /*
     * Simulación de latencia de red.
     */
    await delay(250);

    return asset;
  }

  async getSubmissions(assetUid: string): Promise<KoboSubmissionReference[]> {
    await delay(250);

    return mockSubmissions[assetUid] ?? [];
  }

  async getSubmission(
    assetUid: string,
    submissionId: KoboSubmissionId,
  ): Promise<KoboSubmissionData> {
    await delay(250);

    const key = `${assetUid}:${submissionId}`;

    const submission = mockSubmissionData[key];

    if (!submission) {
      throw new Error(`Kobo submission not found: ${key}`);
    }

    return submission;
  }
}

function delay(milliseconds: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}
