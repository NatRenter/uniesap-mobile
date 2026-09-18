import { Platform } from "react-native";

import * as Sharing from "expo-sharing";

/*
 * ============================================================================
 * ARCHIVOS FÍSICOS DE REPORTES
 * ============================================================================
 *
 * Esta capa concentra las diferencias de plataforma.
 *
 * Android / iOS
 *   → expo-file-system
 *   → el archivo queda dentro de Documents/reports/<reportId>/
 *
 * Web
 *   → el navegador descarga un Blob
 *   → report.fileUri conserva un marcador web persistible
 *
 * IMPORTANTE:
 *
 * Un Blob URL del navegador deja de ser válido al recargar la página, por eso
 * NO lo guardamos dentro de Report. En Web, cuando el usuario vuelva a abrir el
 * reporte, ReportGenerationService reconstruirá el archivo desde los datos
 * persistidos y volverá a descargarlo.
 */

export type PersistReportArtifactInput = {
  reportId: string;
  fileName: string;
  mimeType: string;
  bytes: Uint8Array;
  downloadOnWeb?: boolean;
};

export type ShareWebArtifactResult = {
  shared: boolean;
  downloaded: boolean;
};

const WEB_REPORT_URI_PREFIX = "web-report://";

/*
 * Guarda el archivo en dispositivo o dispara una descarga en Web.
 */
export async function persistReportArtifact(
  input: PersistReportArtifactInput,
): Promise<string> {
  if (Platform.OS === "web") {
    if (input.downloadOnWeb ?? true) {
      downloadArtifactOnWeb(input.bytes, input.fileName, input.mimeType);
    }

    return createWebReportUri(input.reportId, input.fileName);
  }

  const { Directory, File: ExpoFile, Paths } = await import("expo-file-system");

  const reportsDirectory = new Directory(Paths.document, "reports");

  reportsDirectory.create({
    idempotent: true,
    intermediates: true,
  });

  const reportDirectory = new Directory(reportsDirectory, input.reportId);

  reportDirectory.create({
    idempotent: true,
    intermediates: true,
  });

  const outputFile = new ExpoFile(reportDirectory, input.fileName);

  outputFile.create({
    intermediates: true,
    overwrite: true,
  });

  outputFile.write(input.bytes);

  return outputFile.uri;
}

/*
 * Lee una evidencia desde una URI y devuelve sus bytes.
 *
 * - file:// / content:// → expo-file-system en Native.
 * - http(s), data y blob → fetch.
 * - Web → fetch para todos los esquemas manejados por el navegador.
 */
export async function readUriAsBytes(uri: string): Promise<Uint8Array> {
  if (Platform.OS === "web" || shouldUseFetch(uri)) {
    const response = await fetch(uri);

    if (!response.ok && !isLocalBrowserUri(uri)) {
      throw new Error(`No fue posible leer el archivo (${response.status}).`);
    }

    return new Uint8Array(await response.arrayBuffer());
  }

  const { File: ExpoFile } = await import("expo-file-system");

  const sourceFile = new ExpoFile(uri);

  if (!sourceFile.exists) {
    throw new Error("El archivo local de evidencia ya no existe.");
  }

  return sourceFile.bytes();
}

/*
 * Comprueba si una referencia nativa todavía apunta a un archivo real.
 */
export async function localReportFileExists(uri: string): Promise<boolean> {
  if (Platform.OS === "web" || isWebReportUri(uri)) {
    return false;
  }

  try {
    const { File: ExpoFile } = await import("expo-file-system");

    return new ExpoFile(uri).exists;
  } catch {
    return false;
  }
}

/*
 * En Android/iOS utilizamos la hoja del sistema para abrir el archivo con una
 * aplicación compatible. Esta misma capacidad sirve también para compartirlo.
 */
export async function presentNativeReportFile(
  fileUri: string,
  options: {
    mimeType: string;
    dialogTitle: string;
  },
): Promise<void> {
  if (Platform.OS === "web") {
    throw new Error("Esta acción nativa no está disponible en Web.");
  }

  const available = await Sharing.isAvailableAsync();

  if (!available) {
    throw new Error(
      "El dispositivo no tiene disponible el selector para abrir o compartir archivos.",
    );
  }

  await Sharing.shareAsync(fileUri, {
    dialogTitle: options.dialogTitle,
    mimeType: options.mimeType,
  });
}

/*
 * Descarga bytes utilizando APIs estándar del navegador.
 */
export function downloadArtifactOnWeb(
  bytes: Uint8Array,
  fileName: string,
  mimeType: string,
): void {
  if (typeof document === "undefined" || typeof URL === "undefined") {
    throw new Error("La descarga web no está disponible en este entorno.");
  }

  const blob = new Blob([toArrayBuffer(bytes)], {
    type: mimeType,
  });

  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.style.display = "none";

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 1_000);
}

/*
 * Intenta utilizar Web Share con un File real.
 *
 * Si el navegador no lo soporta, realizamos una descarga como fallback.
 */
export async function shareArtifactOnWeb(
  bytes: Uint8Array,
  fileName: string,
  mimeType: string,
): Promise<ShareWebArtifactResult> {
  if (typeof navigator === "undefined") {
    throw new Error(
      "La función de compartir no está disponible en este entorno.",
    );
  }

  const BrowserFile = globalThis.File;

  if (typeof BrowserFile === "function") {
    const file = new BrowserFile([toArrayBuffer(bytes)], fileName, {
      type: mimeType,
    });

    const shareNavigator = navigator as Navigator & {
      canShare?: (data?: ShareData) => boolean;
      share?: (data?: ShareData) => Promise<void>;
    };

    const shareData: ShareData = {
      files: [file],
      title: fileName,
    };

    if (
      typeof shareNavigator.share === "function" &&
      (typeof shareNavigator.canShare !== "function" ||
        shareNavigator.canShare(shareData))
    ) {
      await shareNavigator.share(shareData);

      return {
        shared: true,
        downloaded: false,
      };
    }
  }

  downloadArtifactOnWeb(bytes, fileName, mimeType);

  return {
    shared: false,
    downloaded: true,
  };
}

export function isWebReportUri(uri: string): boolean {
  return uri.startsWith(WEB_REPORT_URI_PREFIX);
}

function createWebReportUri(reportId: string, fileName: string): string {
  return `${WEB_REPORT_URI_PREFIX}${encodeURIComponent(reportId)}/${encodeURIComponent(fileName)}`;
}

function shouldUseFetch(uri: string): boolean {
  return /^(https?:|data:|blob:)/i.test(uri);
}

function isLocalBrowserUri(uri: string): boolean {
  return /^(data:|blob:)/i.test(uri);
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);

  return copy.buffer;
}
