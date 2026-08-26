import type { KoboService } from "./koboService";

import { mockKoboPersistence } from "./mockKoboPersistence";

import type {
  KoboAssetReference,
  KoboAttachmentReference,
  KoboSubmissionAttachment,
  KoboSubmissionData,
  KoboSubmissionId,
  KoboSubmissionPackage,
  KoboSubmissionReference,
} from "./types";

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

const historicalSubmissions: Record<string, KoboSubmissionReference[]> = {
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

const historicalSubmissionData: Record<string, KoboSubmissionData> = {
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

    await delay(250);

    return {
      ...asset,
    };
  }

  async getSubmissions(assetUid: string): Promise<KoboSubmissionReference[]> {
    await delay(250);

    const historical = historicalSubmissions[assetUid] ?? [];

    const persisted = await mockKoboPersistence.getAllByAsset(assetUid);

    const unique = new Map<string, KoboSubmissionReference>();

    for (const submission of historical) {
      unique.set(String(submission.submissionId), {
        ...submission,
      });
    }

    for (const record of persisted) {
      unique.set(String(record.reference.submissionId), {
        ...record.reference,
      });
    }

    return Array.from(unique.values());
  }

  async getSubmission(
    assetUid: string,
    submissionId: KoboSubmissionId,
  ): Promise<KoboSubmissionData> {
    await delay(250);

    const historicalKey = `${assetUid}:${submissionId}`;

    const historical = historicalSubmissionData[historicalKey];

    if (historical) {
      return {
        ...historical,
      };
    }

    const persisted = await mockKoboPersistence.getBySubmissionId(
      assetUid,
      submissionId,
    );

    if (persisted) {
      return {
        ...persisted.submissionPackage.data,
      };
    }

    throw new Error(`Kobo submission not found: ${historicalKey}`);
  }

  async createSubmission(
    assetUid: string,
    submission: KoboSubmissionPackage,
  ): Promise<KoboSubmissionReference> {
    const asset = mockAssets[assetUid];

    if (!asset) {
      throw new Error(`Kobo asset not found: ${assetUid}`);
    }

    await delay(350);

    const existing = await mockKoboPersistence.getByOperation(
      assetUid,
      submission.operationId,
    );

    if (existing) {
      console.log("Mock Kobo persistent idempotency hit:", {
        assetUid,

        operationId: submission.operationId,

        submissionId: existing.reference.submissionId,
      });

      return {
        ...existing.reference,
      };
    }

    const submissionId = Date.now();

    const now = new Date().toISOString();

    const reference: KoboSubmissionReference = {
      assetUid,

      submissionId,

      uuid: `mock-${assetUid}-${submissionId}`,

      submittedAt: now,

      syncedAt: now,
    };

    await mockKoboPersistence.save({
      assetUid,

      operationId: submission.operationId,

      reference,

      submissionPackage: {
        operationId: submission.operationId,

        data: {
          ...submission.data,
        },

        attachments: submission.attachments.map((attachment) => ({
          ...attachment,
        })),
      },
    });

    console.log("Mock Kobo persistent submission created:", {
      operationId: submission.operationId,

      reference,

      attachmentCount: submission.attachments.length,
    });

    return {
      ...reference,
    };
  }

  /*
   * ==========================================================================
   * SUBIR ATTACHMENT
   * ==========================================================================
   *
   * Cada evidencia se registra por:
   *
   * assetUid + submissionId + uploadOperationId
   *
   * Por eso una foto ya aceptada no se duplica.
   */
  async uploadAttachment(
    assetUid: string,
    submissionId: KoboSubmissionId,
    attachment: KoboSubmissionAttachment,
  ): Promise<KoboAttachmentReference> {
    await delay(250);

    const existing = await mockKoboPersistence.getAttachmentByOperation(
      assetUid,
      submissionId,
      attachment.uploadOperationId,
    );

    if (existing) {
      console.log("Mock Kobo attachment idempotency hit:", {
        evidenceId: attachment.evidenceId,

        uploadOperationId: attachment.uploadOperationId,

        attachmentId: existing.reference.attachmentId,
      });

      return {
        ...existing.reference,
      };
    }

    const now = new Date().toISOString();

    const attachmentId = `mock-attachment-${Date.now()}-${attachment.evidenceId}`;

    const reference: KoboAttachmentReference = {
      assetUid,

      submissionId,

      attachmentId,

      evidenceId: attachment.evidenceId,

      uploadOperationId: attachment.uploadOperationId,

      fileName: attachment.fileName,

      uploadedAt: now,
    };

    /*
     * Persistimos antes de devolver éxito.
     */
    await mockKoboPersistence.saveAttachment({
      assetUid,

      submissionId,

      uploadOperationId: attachment.uploadOperationId,

      evidenceId: attachment.evidenceId,

      reference,

      attachment: {
        ...attachment,
      },
    });

    console.log("Mock Kobo attachment uploaded:", {
      evidenceId: attachment.evidenceId,

      uploadOperationId: attachment.uploadOperationId,

      attachmentId,

      submissionId,
    });

    return {
      ...reference,
    };
  }
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}
