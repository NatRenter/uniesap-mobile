import { Directory, File, Paths } from "expo-file-system";

import * as ImagePicker from "expo-image-picker";

/*
 * ============================================================================
 * RESULTADO DE CAPTURA DE EVIDENCIA
 * ============================================================================
 */

export type CapturedEvidenceMedia = {
  localUri: string;

  fileName: string;

  mimeType?: string;

  fileSize?: number;
};

/* -------------------------------------------------------------------------- */
/*                       DIRECTORIO DE EVIDENCIAS                             */
/* -------------------------------------------------------------------------- */

const EVIDENCE_DIRECTORY = new Directory(
  Paths.document,
  "uniesap",
  "evidences",
);

/* -------------------------------------------------------------------------- */
/*                          TOMAR FOTOGRAFÍA                                  */
/* -------------------------------------------------------------------------- */

export async function captureEvidencePhoto(): Promise<CapturedEvidenceMedia | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();

  if (!permission.granted) {
    throw new Error("UNIESAP necesita permiso para utilizar la cámara.");
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ["images"],

    allowsEditing: false,

    quality: 0.9,
  });

  if (result.canceled || !result.assets?.length) {
    return null;
  }

  return persistNativeImage(result.assets[0]);
}

/* -------------------------------------------------------------------------- */
/*                       SELECCIONAR FOTOGRAFÍA                               */
/* -------------------------------------------------------------------------- */

export async function pickEvidencePhoto(): Promise<CapturedEvidenceMedia | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    throw new Error("UNIESAP necesita permiso para acceder a las fotografías.");
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],

    allowsEditing: false,

    quality: 0.9,

    allowsMultipleSelection: false,
  });

  if (result.canceled || !result.assets?.length) {
    return null;
  }

  return persistNativeImage(result.assets[0]);
}

/* -------------------------------------------------------------------------- */
/*                       ELIMINAR ARCHIVO LOCAL                               */
/* -------------------------------------------------------------------------- */

/*
 * Elimina solamente archivos que pertenezcan
 * al directorio administrado por UNIESAP.
 *
 * Esto evita que una URI externa pueda provocar
 * la eliminación accidental de una fotografía
 * original de la galería del usuario.
 */
export async function deleteEvidenceMedia(
  localUri: string | undefined,
): Promise<void> {
  if (!localUri) {
    return;
  }

  /*
   * Medida de seguridad:
   *
   * solo eliminamos archivos almacenados dentro
   * del directorio propio de evidencias.
   */
  if (!localUri.startsWith(EVIDENCE_DIRECTORY.uri)) {
    console.log(
      "El archivo no pertenece al almacenamiento administrado por UNIESAP. No se elimina:",
      localUri,
    );

    return;
  }

  const file = new File(localUri);

  /*
   * File.exists evita convertir una eliminación
   * repetida en un error.
   */
  if (!file.exists) {
    console.log("El archivo de evidencia ya no existe:", localUri);

    return;
  }

  file.delete();

  console.log("Archivo local de evidencia eliminado:", localUri);
}

/* -------------------------------------------------------------------------- */
/*                         PERSISTIR IMAGEN                                   */
/* -------------------------------------------------------------------------- */

async function persistNativeImage(
  asset: ImagePicker.ImagePickerAsset,
): Promise<CapturedEvidenceMedia> {
  EVIDENCE_DIRECTORY.create({
    idempotent: true,

    intermediates: true,
  });

  const extension = resolveImageExtension(asset);

  const fileName = `evidence-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${extension}`;

  const source = new File(asset.uri);

  const destination = new File(EVIDENCE_DIRECTORY, fileName);

  await source.copy(destination);

  return {
    localUri: destination.uri,

    fileName,

    mimeType: asset.mimeType ?? resolveMimeType(extension),

    fileSize: destination.size || asset.fileSize || undefined,
  };
}

/* -------------------------------------------------------------------------- */
/*                           EXTENSIÓN                                        */
/* -------------------------------------------------------------------------- */

function resolveImageExtension(asset: ImagePicker.ImagePickerAsset): string {
  const fileName = asset.fileName?.trim().toLowerCase();

  if (fileName && fileName.includes(".")) {
    const extension = fileName.split(".").pop();

    if (extension) {
      return sanitizeExtension(extension);
    }
  }

  const mimeType = asset.mimeType?.toLowerCase();

  switch (mimeType) {
    case "image/png":
      return "png";

    case "image/webp":
      return "webp";

    case "image/heic":
      return "heic";

    case "image/heif":
      return "heif";

    case "image/jpeg":
    case "image/jpg":
    default:
      return "jpg";
  }
}

function sanitizeExtension(extension: string): string {
  const normalized = extension.replace(/[^a-z0-9]/g, "");

  return normalized || "jpg";
}

function resolveMimeType(extension: string): string {
  switch (extension.toLowerCase()) {
    case "png":
      return "image/png";

    case "webp":
      return "image/webp";

    case "heic":
      return "image/heic";

    case "heif":
      return "image/heif";

    case "jpg":
    case "jpeg":
    default:
      return "image/jpeg";
  }
}
