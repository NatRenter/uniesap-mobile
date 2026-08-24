/*
 * ============================================================================
 * EVIDENCE MEDIA SERVICE - CONTRATO BASE
 * ============================================================================
 *
 * Expo seleccionará automáticamente:
 *
 * evidenceMediaService.native.ts
 *   → Android / iOS
 *
 * evidenceMediaService.web.ts
 *   → Web
 */

/* -------------------------------------------------------------------------- */
/*                           RESULTADO DE MEDIA                               */
/* -------------------------------------------------------------------------- */

export type CapturedEvidenceMedia = {
  localUri: string;

  fileName: string;

  mimeType?: string;

  fileSize?: number;
};

/* -------------------------------------------------------------------------- */
/*                          TOMAR FOTOGRAFÍA                                  */
/* -------------------------------------------------------------------------- */

export async function captureEvidencePhoto(): Promise<CapturedEvidenceMedia | null> {
  throw new Error(
    "La captura de fotografías no está disponible en esta plataforma.",
  );
}

/* -------------------------------------------------------------------------- */
/*                       SELECCIONAR FOTOGRAFÍA                               */
/* -------------------------------------------------------------------------- */

export async function pickEvidencePhoto(): Promise<CapturedEvidenceMedia | null> {
  throw new Error(
    "La selección de fotografías no está disponible en esta plataforma.",
  );
}

/* -------------------------------------------------------------------------- */
/*                         ELIMINAR ARCHIVO LOCAL                             */
/* -------------------------------------------------------------------------- */

/*
 * Elimina físicamente el archivo asociado a una evidencia.
 *
 * La implementación real depende de la plataforma.
 */
export async function deleteEvidenceMedia(
  _localUri: string | undefined,
): Promise<void> {
  /*
   * Fallback intencional.
   *
   * Las plataformas compatibles utilizan
   * sus archivos .native.ts o .web.ts.
   */
}
