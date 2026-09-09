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

/*
 * ============================================================================
 * ASSETS MOCK
 * ============================================================================
 *
 * Este catálogo representa los formularios Kobo disponibles
 * durante el desarrollo en modo Mock.
 *
 * FormDefinition.integration.assetUid debe coincidir con alguno
 * de estos identificadores.
 */
const mockAssets: Record<string, KoboAssetReference> = {
  /*
   * --------------------------------------------------------------------------
   * ANÁLISIS DE RIESGOS
   * --------------------------------------------------------------------------
   */
  "mock-asset-risk": {
    assetUid: "mock-asset-risk",
    deploymentStatus: "deployed",
    versionUid: "mock-version-risk-001",
    syncedAt: "2026-08-18T09:00:00",
  },

  /*
   * --------------------------------------------------------------------------
   * INSPECCIÓN DE EXTINTORES
   * --------------------------------------------------------------------------
   */
  "mock-asset-extinguishers": {
    assetUid: "mock-asset-extinguishers",
    deploymentStatus: "deployed",
    versionUid: "mock-version-extinguishers-001",
    syncedAt: "2026-08-18T09:00:00",
  },

  /*
   * --------------------------------------------------------------------------
   * SEÑALIZACIÓN
   * --------------------------------------------------------------------------
   *
   * Este asset corresponde al formulario de señalización.
   * Debe coincidir con el assetUid definido en formSeed.ts.
   */
  "mock-asset-signage": {
    assetUid: "mock-asset-signage",
    deploymentStatus: "deployed",
    versionUid: "mock-version-signage-001",
    syncedAt: "2026-09-01T00:00:00",
  },
};

/*
 * ============================================================================
 * SUBMISSIONS HISTÓRICAS
 * ============================================================================
 *
 * Se conservan para mantener las pruebas que ya existían.
 *
 * Las nuevas submissions se guardan utilizando mockKoboPersistence.
 */
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

  /*
   * Señalización inicia sin submissions históricas.
   *
   * Las nuevas capturas aparecerán mediante la persistencia Mock.
   */
  "mock-asset-signage": [],
};

/*
 * ============================================================================
 * DATOS HISTÓRICOS
 * ============================================================================
 *
 * Información utilizada por getSubmission() para las pruebas existentes.
 */
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

/*
 * ============================================================================
 * MOCK KOBO SERVICE
 * ============================================================================
 *
 * Simula las operaciones principales de Kobo durante el desarrollo.
 *
 * La información creada durante las pruebas se guarda mediante
 * mockKoboPersistence:
 *
 * Android / iOS -> SQLite
 * Web           -> localStorage
 *
 * Esto permite comprobar:
 *
 * - lectura de assets;
 * - creación de submissions;
 * - recuperación de submissions;
 * - reintentos;
 * - attachments;
 * - idempotencia.
 */
export class MockKoboService implements KoboService {
  /*
   * ==========================================================================
   * OBTENER ASSET
   * ==========================================================================
   *
   * Comprueba que el formulario solicitado exista dentro del catálogo Mock.
   */
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

  /*
   * ==========================================================================
   * LISTAR SUBMISSIONS
   * ==========================================================================
   *
   * Combina las submissions históricas con las creadas durante
   * las pruebas actuales.
   */
  async getSubmissions(assetUid: string): Promise<KoboSubmissionReference[]> {
    await delay(250);

    /*
     * Submissions precargadas.
     */
    const historical = historicalSubmissions[assetUid] ?? [];

    /*
     * Submissions creadas mediante la aplicación.
     */
    const persisted = await mockKoboPersistence.getAllByAsset(assetUid);

    const combined = [
      ...historical.map((submission) => ({
        ...submission,
      })),

      ...persisted.map((record) => ({
        ...record.reference,
      })),
    ];

    /*
     * Evita mostrar dos veces la misma submission.
     */
    const unique = new Map<string, KoboSubmissionReference>();

    for (const submission of combined) {
      unique.set(String(submission.submissionId), submission);
    }

    return Array.from(unique.values());
  }

  /*
   * ==========================================================================
   * OBTENER UNA SUBMISSION
   * ==========================================================================
   *
   * Busca primero en los datos históricos y después
   * en la persistencia creada durante las pruebas.
   */
  async getSubmission(
    assetUid: string,
    submissionId: KoboSubmissionId,
  ): Promise<KoboSubmissionData> {
    await delay(250);

    const historicalKey = `${assetUid}:${submissionId}`;

    /*
     * Primero revisamos las submissions históricas.
     */
    const historical = historicalSubmissionData[historicalKey];

    if (historical) {
      return {
        ...historical,
      };
    }

    /*
     * Después revisamos las submissions persistidas.
     */
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

  /*
   * ==========================================================================
   * CREAR SUBMISSION
   * ==========================================================================
   *
   * Representa la creación de una submission en Kobo.
   *
   * operationId permite que un reintento no genere
   * una submission duplicada.
   */
  async createSubmission(
    assetUid: string,
    submission: KoboSubmissionPackage,
  ): Promise<KoboSubmissionReference> {
    const asset = mockAssets[assetUid];

    if (!asset) {
      throw new Error(`Kobo asset not found: ${assetUid}`);
    }

    await delay(350);

    /*
     * ========================================================================
     * IDEMPOTENCIA PERSISTENTE
     * ========================================================================
     *
     * Antes de crear una nueva submission buscamos si la misma
     * operación ya fue aceptada anteriormente.
     */
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

    /*
     * ========================================================================
     * NUEVA SUBMISSION
     * ========================================================================
     */
    const submissionId = Date.now();

    const now = new Date().toISOString();

    const reference: KoboSubmissionReference = {
      assetUid,
      submissionId,
      uuid: `mock-${assetUid}-${submissionId}`,
      submittedAt: now,
      syncedAt: now,
    };

    /*
     * Guardamos antes de devolver éxito.
     *
     * Esto permite recuperar la operación si la aplicación
     * se cierra o falla inmediatamente después.
     */
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
      data: submission.data,
      attachmentCount: submission.attachments.length,
      attachments: submission.attachments,
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
   * Registra una evidencia individual asociada a una submission.
   *
   * Cada evidencia utiliza uploadOperationId para impedir
   * que un reintento vuelva a crear el mismo attachment.
   */
  async uploadAttachment(
    assetUid: string,
    submissionId: KoboSubmissionId,
    attachment: KoboSubmissionAttachment,
  ): Promise<KoboAttachmentReference> {
    await delay(250);

    /*
     * Buscamos si esta evidencia ya fue subida anteriormente.
     */
    const existing = await mockKoboPersistence.getAttachmentByOperation(
      assetUid,
      submissionId,
      attachment.uploadOperationId,
    );

    /*
     * Si ya existe, devolvemos su referencia.
     *
     * No generamos otro attachment.
     */
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

    /*
     * Generamos una referencia Mock para la nueva evidencia.
     */
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
     * Persistimos la evidencia antes de devolver éxito.
     *
     * Esto permite recuperar correctamente el estado de una subida
     * si posteriormente ocurre un fallo.
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

/*
 * ============================================================================
 * DELAY
 * ============================================================================
 *
 * Simula una pequeña latencia de red para que el entorno Mock
 * se comporte de forma parecida a una operación remota.
 */
function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}
