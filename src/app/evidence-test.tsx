import { useState } from "react";

import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Image } from "expo-image";
import { router } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { ResponsiveContainer } from "@/components/ui/ResponsiveContainer";
import { Screen } from "@/components/ui/Screen";

import {
  captureEvidencePhoto,
  deleteEvidenceMedia,
  pickEvidencePhoto,
} from "@/services/evidenceMediaService";

import {
  createEvidence,
  deleteEvidence,
  getEvidences,
} from "@/repositories/evidenceRepository";

import { FontSize, Radius, Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

import type { CapturedEvidenceMedia } from "@/services/evidenceMediaService";

/*
 * ============================================================================
 * UTILIDADES PURAS DEL MÓDULO
 * ============================================================================
 *
 * Estas funciones viven fuera del componente para evitar que React Compiler
 * las interprete como operaciones impuras ejecutadas durante render.
 *
 * Se invocan únicamente desde handlers de interacción.
 */

function createEvidenceTestTitle(): string {
  return `Evidencia de prueba ${Date.now()}`;
}

function createPhotoEvidenceTitle(baseTitle: string): string {
  return `${baseTitle} ${new Date().toLocaleTimeString()}`;
}

export default function EvidenceTestScreen() {
  const { colors } = useAppTheme();

  const [refreshVersion, setRefreshVersion] = useState(0);

  const [error, setError] = useState<string | null>(null);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [processingAction, setProcessingAction] = useState<
    "create" | "camera" | "gallery" | "delete" | null
  >(null);

  /*
   * El contador únicamente obliga a React
   * a volver a consultar EvidenceRepository.
   */
  void refreshVersion;

  const evidences = getEvidences();

  const isProcessing = processingAction !== null;

  /* ------------------------------------------------------------------------ */
  /*                   CREAR EVIDENCIA SIN ARCHIVO                            */
  /* ------------------------------------------------------------------------ */

  const handleCreateEvidence = async () => {
    if (isProcessing) {
      return;
    }

    setProcessingAction("create");

    clearMessages();

    try {
      const evidence = await createEvidence({
        companyId: "company-001",

        propertyId: "property-001",

        inspectionId: "inspection-001",

        questionId: "question-004",

        title: createEvidenceTestTitle(),

        type: "photo",

        status: "pending",

        description: "Evidencia temporal creada desde /evidence-test.",
      });

      console.log("Evidencia de prueba creada:", evidence);

      setSuccessMessage("Evidencia de prueba creada correctamente.");

      refreshEvidences();
    } catch (creationError) {
      handleError("Error creando evidencia:", creationError);
    } finally {
      setProcessingAction(null);
    }
  };

  /* ------------------------------------------------------------------------ */
  /*                         TOMAR FOTOGRAFÍA                                 */
  /* ------------------------------------------------------------------------ */

  const handleCapturePhoto = async () => {
    if (isProcessing) {
      return;
    }

    setProcessingAction("camera");

    clearMessages();

    try {
      const media = await captureEvidencePhoto();

      if (!media) {
        setSuccessMessage("Captura cancelada.");

        return;
      }

      await createPhotoEvidence(media, "Fotografía tomada con cámara");

      setSuccessMessage("Fotografía guardada correctamente como evidencia.");
    } catch (cameraError) {
      handleError("Error capturando fotografía:", cameraError);
    } finally {
      setProcessingAction(null);
    }
  };

  /* ------------------------------------------------------------------------ */
  /*                       SELECCIONAR FOTOGRAFÍA                             */
  /* ------------------------------------------------------------------------ */

  const handlePickPhoto = async () => {
    if (isProcessing) {
      return;
    }

    setProcessingAction("gallery");

    clearMessages();

    try {
      const media = await pickEvidencePhoto();

      if (!media) {
        setSuccessMessage("Selección cancelada.");

        return;
      }

      await createPhotoEvidence(media, "Fotografía seleccionada de galería");

      setSuccessMessage("Fotografía seleccionada y guardada como evidencia.");
    } catch (pickerError) {
      handleError("Error seleccionando fotografía:", pickerError);
    } finally {
      setProcessingAction(null);
    }
  };

  /* ------------------------------------------------------------------------ */
  /*                 CREAR EVIDENCIA A PARTIR DE ARCHIVO                      */
  /* ------------------------------------------------------------------------ */

  const createPhotoEvidence = async (
    media: CapturedEvidenceMedia,

    title: string,
  ) => {
    const evidence = await createEvidence({
      companyId: "company-001",

      propertyId: "property-001",

      inspectionId: "inspection-001",

      questionId: "question-004",

      title: createPhotoEvidenceTitle(title),

      type: "photo",

      status: "pending",

      description: "Fotografía real creada desde /evidence-test.",

      localUri: media.localUri,

      fileName: media.fileName,

      ...(media.mimeType
        ? {
            mimeType: media.mimeType,
          }
        : {}),

      ...(media.fileSize !== undefined
        ? {
            fileSize: media.fileSize,
          }
        : {}),
    });

    console.log("Fotografía convertida en evidencia:", {
      evidenceId: evidence.id,

      localUri: evidence.localUri,

      fileName: evidence.fileName,

      fileSize: evidence.fileSize,
    });

    refreshEvidences();
  };

  /* ------------------------------------------------------------------------ */
  /*                       ELIMINAR EVIDENCIA TEMPORAL                         */
  /* ------------------------------------------------------------------------ */

  const handleDeleteEvidence = async () => {
    if (isProcessing) {
      return;
    }

    const candidate = evidences.find(
      (evidence) =>
        evidence.description ===
          "Evidencia temporal creada desde /evidence-test." ||
        evidence.description === "Fotografía real creada desde /evidence-test.",
    );

    if (!candidate) {
      setError("No existe una evidencia temporal disponible para eliminar.");

      setSuccessMessage(null);

      return;
    }

    setProcessingAction("delete");

    clearMessages();

    try {
      /*
       * Conservamos la URI antes de eliminar el registro.
       *
       * Una vez eliminado el Evidence del repositorio,
       * ya no debemos depender de poder recuperarlo.
       */
      const localUri = candidate.localUri;

      /*
       * PASO 1
       *
       * Eliminamos primero el registro persistido.
       *
       * Android:
       * EvidenceRepository -> SQLite
       *
       * Web:
       * EvidenceRepository -> localStorage
       */
      const deleted = await deleteEvidence(candidate.id);

      if (!deleted) {
        throw new Error("No fue posible eliminar la evidencia temporal.");
      }

      /*
       * PASO 2
       *
       * Limpiamos el archivo físico asociado.
       *
       * Android/iOS:
       * evidenceMediaService.native.ts comprobará que
       * la URI pertenezca al directorio administrado
       * por UNIESAP antes de eliminarla.
       *
       * Web:
       * evidenceMediaService.web.ts no eliminará
       * archivos externos del navegador.
       */
      try {
        await deleteEvidenceMedia(localUri);
      } catch (mediaDeletionError) {
        /*
         * IMPORTANTE:
         *
         * El registro ya fue eliminado correctamente.
         *
         * No intentamos restaurarlo porque el estado
         * del archivo podría ser incierto.
         *
         * Registramos el problema para diagnóstico,
         * pero mantenemos consistente el repositorio.
         */
        console.error(
          "La evidencia fue eliminada, pero no fue posible limpiar su archivo local:",
          mediaDeletionError,
        );

        setError(
          "La evidencia fue eliminada, pero no fue posible limpiar completamente su archivo local.",
        );

        refreshEvidences();

        return;
      }

      console.log("Evidencia y archivo local eliminados:", {
        evidenceId: candidate.id,

        localUri,
      });

      setSuccessMessage(
        localUri
          ? "Evidencia y archivo local eliminados correctamente."
          : "Evidencia eliminada correctamente.",
      );

      refreshEvidences();
    } catch (deletionError) {
      handleError("Error eliminando evidencia:", deletionError);
    } finally {
      setProcessingAction(null);
    }
  };

  /* ------------------------------------------------------------------------ */
  /*                             UTILIDADES UI                                 */
  /* ------------------------------------------------------------------------ */

  function refreshEvidences() {
    setRefreshVersion((value) => value + 1);
  }

  function clearMessages() {
    setError(null);

    setSuccessMessage(null);
  }

  function handleError(
    consoleMessage: string,

    caughtError: unknown,
  ) {
    const message =
      caughtError instanceof Error
        ? caughtError.message
        : "Ocurrió un error desconocido.";

    console.error(consoleMessage, caughtError);

    setError(message);

    setSuccessMessage(null);
  }

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ResponsiveContainer>
          <Text
            style={[
              styles.back,
              {
                color: colors.primary,
              },
            ]}
            onPress={() => router.back()}
          >
            ‹ Volver
          </Text>

          <Text
            style={[
              styles.overline,
              {
                color: colors.primary,
              },
            ]}
          >
            DESARROLLO
          </Text>

          <Text
            style={[
              styles.title,
              {
                color: colors.text,
              },
            ]}
          >
            Prueba de evidencias
          </Text>

          <Text
            style={[
              styles.subtitle,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            Prueba real de cámara, galería, almacenamiento local y persistencia
            de evidencias.
          </Text>

          <AppCard>
            <Text
              style={[
                styles.metricLabel,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              Evidencias almacenadas
            </Text>

            <Text
              style={[
                styles.metricValue,
                {
                  color: colors.text,
                },
              ]}
            >
              {evidences.length}
            </Text>

            <Text
              style={[
                styles.metricDescription,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              No existe un límite fijo de fotografías impuesto por esta prueba.
            </Text>
          </AppCard>

          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              Fotografía real
            </Text>

            <Text
              style={[
                styles.sectionDescription,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              Cada fotografía se convierte en un registro Evidence
              independiente.
            </Text>

            <View style={styles.actions}>
              <AppButton onPress={handleCapturePhoto}>
                {processingAction === "camera"
                  ? "Abriendo cámara..."
                  : "Tomar fotografía"}
              </AppButton>

              <AppButton variant="secondary" onPress={handlePickPhoto}>
                {processingAction === "gallery"
                  ? "Abriendo galería..."
                  : "Seleccionar fotografía"}
              </AppButton>
            </View>
          </View>

          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              Herramientas del repositorio
            </Text>

            <View style={styles.actions}>
              <AppButton variant="secondary" onPress={handleCreateEvidence}>
                {processingAction === "create"
                  ? "Creando..."
                  : "Crear evidencia sin archivo"}
              </AppButton>

              <AppButton variant="secondary" onPress={handleDeleteEvidence}>
                {processingAction === "delete"
                  ? "Eliminando..."
                  : "Eliminar evidencia temporal"}
              </AppButton>
            </View>
          </View>

          {successMessage && (
            <View style={styles.section}>
              <AppCard>
                <Text
                  style={[
                    styles.messageTitle,
                    {
                      color: colors.success,
                    },
                  ]}
                >
                  Correcto
                </Text>

                <Text
                  style={[
                    styles.messageText,
                    {
                      color: colors.textSecondary,
                    },
                  ]}
                >
                  {successMessage}
                </Text>
              </AppCard>
            </View>
          )}

          {error && (
            <View style={styles.section}>
              <AppCard>
                <Text
                  style={[
                    styles.messageTitle,
                    {
                      color: colors.error,
                    },
                  ]}
                >
                  Error
                </Text>

                <Text
                  style={[
                    styles.messageText,
                    {
                      color: colors.textSecondary,
                    },
                  ]}
                >
                  {error}
                </Text>
              </AppCard>
            </View>
          )}

          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              Evidencias
            </Text>

            {evidences.length === 0 ? (
              <AppCard>
                <Text
                  style={[
                    styles.emptyText,
                    {
                      color: colors.textSecondary,
                    },
                  ]}
                >
                  No existen evidencias almacenadas.
                </Text>
              </AppCard>
            ) : (
              <View style={styles.list}>
                {evidences.map((evidence) => (
                  <AppCard key={evidence.id}>
                    {evidence.type === "photo" && evidence.localUri && (
                      <Image
                        source={{
                          uri: evidence.localUri,
                        }}
                        style={styles.preview}
                        contentFit="cover"
                        transition={150}
                      />
                    )}

                    <Text
                      style={[
                        styles.itemTitle,
                        {
                          color: colors.text,
                        },
                      ]}
                    >
                      {evidence.title}
                    </Text>

                    <Text
                      style={[
                        styles.itemMeta,
                        {
                          color: colors.textSecondary,
                        },
                      ]}
                    >
                      ID: {evidence.id}
                    </Text>

                    <Text
                      style={[
                        styles.itemMeta,
                        {
                          color: colors.textSecondary,
                        },
                      ]}
                    >
                      Inspección: {evidence.inspectionId}
                    </Text>

                    <Text
                      style={[
                        styles.itemMeta,
                        {
                          color: colors.textSecondary,
                        },
                      ]}
                    >
                      Pregunta: {evidence.questionId ?? "Sin relación"}
                    </Text>

                    {evidence.fileName && (
                      <Text
                        style={[
                          styles.itemMeta,
                          {
                            color: colors.textSecondary,
                          },
                        ]}
                      >
                        Archivo: {evidence.fileName}
                      </Text>
                    )}

                    {evidence.mimeType && (
                      <Text
                        style={[
                          styles.itemMeta,
                          {
                            color: colors.textSecondary,
                          },
                        ]}
                      >
                        Tipo: {evidence.mimeType}
                      </Text>
                    )}

                    {evidence.fileSize !== undefined && (
                      <Text
                        style={[
                          styles.itemMeta,
                          {
                            color: colors.textSecondary,
                          },
                        ]}
                      >
                        Tamaño: {formatFileSize(evidence.fileSize)}
                      </Text>
                    )}

                    <Text
                      style={[
                        styles.itemStatus,
                        {
                          color:
                            evidence.status === "synced"
                              ? colors.success
                              : colors.warning,
                        },
                      ]}
                    >
                      ● {evidence.status}
                    </Text>
                  </AppCard>
                ))}
              </View>
            )}
          </View>

          <Text
            style={[
              styles.notice,
              {
                color: colors.textMuted,
              },
            ]}
          >
            Herramienta temporal de desarrollo. La captura definitiva se
            integrará posteriormente dentro de los formularios de inspección.
          </Text>
        </ResponsiveContainer>
      </ScrollView>
    </Screen>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kilobytes = bytes / 1024;

  if (kilobytes < 1024) {
    return `${kilobytes.toFixed(1)} KB`;
  }

  const megabytes = kilobytes / 1024;

  return `${megabytes.toFixed(2)} MB`;
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: Spacing.xxxl,
  },

  back: {
    fontSize: FontSize.small,

    fontWeight: "600",

    marginBottom: Spacing.lg,
  },

  overline: {
    fontSize: FontSize.caption,

    fontWeight: "700",

    letterSpacing: 1,

    marginBottom: Spacing.sm,
  },

  title: {
    fontSize: FontSize.h1,

    fontWeight: "700",

    marginBottom: Spacing.sm,
  },

  subtitle: {
    fontSize: FontSize.body,

    lineHeight: 24,

    marginBottom: Spacing.xl,
  },

  metricLabel: {
    fontSize: FontSize.small,

    marginBottom: Spacing.sm,
  },

  metricValue: {
    fontSize: 36,

    fontWeight: "700",
  },

  metricDescription: {
    fontSize: FontSize.caption,

    lineHeight: 18,

    marginTop: Spacing.sm,
  },

  section: {
    marginTop: Spacing.xl,
  },

  sectionTitle: {
    fontSize: FontSize.cardTitle,

    fontWeight: "700",

    marginBottom: Spacing.sm,
  },

  sectionDescription: {
    fontSize: FontSize.small,

    lineHeight: 20,

    marginBottom: Spacing.md,
  },

  actions: {
    gap: Spacing.sm,
  },

  list: {
    gap: Spacing.md,
  },

  preview: {
    width: "100%",

    aspectRatio: 16 / 9,

    borderRadius: Radius.md,

    marginBottom: Spacing.md,

    backgroundColor: "rgba(127, 127, 127, 0.08)",
  },

  itemTitle: {
    fontSize: FontSize.body,

    fontWeight: "700",

    marginBottom: Spacing.sm,
  },

  itemMeta: {
    fontSize: FontSize.caption,

    lineHeight: 18,

    marginBottom: Spacing.xs,
  },

  itemStatus: {
    fontSize: FontSize.caption,

    fontWeight: "700",

    marginTop: Spacing.sm,
  },

  messageTitle: {
    fontSize: FontSize.body,

    fontWeight: "700",

    marginBottom: Spacing.sm,
  },

  messageText: {
    fontSize: FontSize.small,

    lineHeight: 20,
  },

  emptyText: {
    fontSize: FontSize.small,

    lineHeight: 20,
  },

  notice: {
    fontSize: FontSize.caption,

    lineHeight: 18,

    textAlign: "center",

    marginTop: Spacing.xl,
  },
});
