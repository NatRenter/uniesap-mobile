import * as ImagePicker from "expo-image-picker";

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
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ["images"],

    allowsEditing: false,

    quality: 0.9,
  });

  if (result.canceled || !result.assets?.length) {
    return null;
  }

  return mapWebAsset(result.assets[0]);
}

/* -------------------------------------------------------------------------- */
/*                       SELECCIONAR FOTOGRAFÍA                               */
/* -------------------------------------------------------------------------- */

export async function pickEvidencePhoto(): Promise<CapturedEvidenceMedia | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],

    allowsEditing: false,

    quality: 0.9,

    allowsMultipleSelection: false,
  });

  if (result.canceled || !result.assets?.length) {
    return null;
  }

  return mapWebAsset(result.assets[0]);
}

/* -------------------------------------------------------------------------- */
/*                           ELIMINAR MEDIA WEB                               */
/* -------------------------------------------------------------------------- */

/*
 * En esta etapa Web no mantiene una copia física
 * independiente administrada por UNIESAP.
 *
 * Por eso eliminar el Evidence del repositorio
 * es suficiente.
 *
 * Cuando migremos el almacenamiento de archivos
 * Web a IndexedDB/backend, esta implementación
 * podrá eliminar también el archivo correspondiente.
 */
export async function deleteEvidenceMedia(
  _localUri: string | undefined,
): Promise<void> {
  return;
}

/* -------------------------------------------------------------------------- */
/*                              MAPEAR ASSET                                  */
/* -------------------------------------------------------------------------- */

function mapWebAsset(
  asset: ImagePicker.ImagePickerAsset,
): CapturedEvidenceMedia {
  return {
    localUri: asset.uri,

    fileName: asset.fileName ?? createFallbackFileName(),

    ...(asset.mimeType
      ? {
          mimeType: asset.mimeType,
        }
      : {}),

    ...(asset.fileSize !== undefined
      ? {
          fileSize: asset.fileSize,
        }
      : {}),
  };
}

function createFallbackFileName(): string {
  return `evidence-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
}
