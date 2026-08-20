import { useEffect, useState } from "react";

import { ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { ResponsiveContainer } from "@/components/ui/ResponsiveContainer";
import { Screen } from "@/components/ui/Screen";

import {
  getKoboService,
  type KoboAssetReference,
  type KoboSubmissionReference,
} from "@/integrations/kobo";

import {
  exportKoboSubmission,
  importKoboSubmission,
  type ExportedKoboInspection,
  type ImportedKoboInspection,
} from "@/services/koboInspectionService";

import { getFormById } from "@/data/forms";

import { FontSize, Radius, Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";
import { useResponsive } from "@/hooks/useResponsive";

import type { InspectionResponse } from "@/types/inspection";

/*
 * --------------------------------------------------------------------------
 * RESPUESTAS DE PRUEBA
 * --------------------------------------------------------------------------
 *
 * Estas respuestas simulan lo que CaptureScreen
 * producirá después de completar una inspección.
 *
 * No vienen todavía de una captura real.
 */
const TEST_RESPONSES: InspectionResponse[] = [
  {
    questionId: "question-001",
    value: "Usuario de prueba UNIESAP",
  },

  {
    questionId: "question-002",
    value: true,
  },

  {
    questionId: "question-003",
    value: "Submission generada desde la herramienta de prueba de UNIESAP.",
  },

  /*
   * No agregamos todavía una fotografía real.
   *
   * Los attachments se manejarán posteriormente
   * como un flujo separado.
   */
];

export default function KoboTestScreen() {
  const { colors } = useAppTheme();

  const { isPhone } = useResponsive();

  /* ---------------------------------------------------------------------- */
  /*                          ESTADO DE LECTURA                              */
  /* ---------------------------------------------------------------------- */

  const [asset, setAsset] = useState<KoboAssetReference | null>(null);

  const [submissions, setSubmissions] = useState<KoboSubmissionReference[]>([]);

  const [importedInspection, setImportedInspection] =
    useState<ImportedKoboInspection | null>(null);

  /* ---------------------------------------------------------------------- */
  /*                          ESTADO DE EXPORTACIÓN                          */
  /* ---------------------------------------------------------------------- */

  const [exportedInspection, setExportedInspection] =
    useState<ExportedKoboInspection | null>(null);

  const [exporting, setExporting] = useState(false);

  const [exportError, setExportError] = useState<string | null>(null);

  /* ---------------------------------------------------------------------- */
  /*                          ESTADO GENERAL                                 */
  /* ---------------------------------------------------------------------- */

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  /* ---------------------------------------------------------------------- */
  /*                       PRUEBAS INICIALES DE KOBO                         */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const kobo = getKoboService();

        /*
         * PRUEBA 1
         *
         * Obtener información básica
         * del asset configurado.
         */
        const assetResult = await kobo.getAsset("mock-asset-risk");

        /*
         * PRUEBA 2
         *
         * Obtener todas las submissions
         * existentes en el mock.
         */
        const submissionResult = await kobo.getSubmissions("mock-asset-risk");

        /*
         * PRUEBA 3
         *
         * Kobo
         *   ↓
         * submission
         *   ↓
         * mapper
         *   ↓
         * InspectionResponse[]
         */
        const importedResult = await importKoboSubmission("form-001", 1001);

        if (!active) {
          return;
        }

        setAsset(assetResult);

        setSubmissions(submissionResult);

        setImportedInspection(importedResult);
      } catch (currentError) {
        if (!active) {
          return;
        }

        setError(
          currentError instanceof Error
            ? currentError.message
            : "Error desconocido",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  /* ---------------------------------------------------------------------- */
  /*                       PRUEBA DE EXPORTACIÓN                             */
  /* ---------------------------------------------------------------------- */

  const handleExportTest = async () => {
    /*
     * Evita crear varias submissions
     * mientras la operación anterior
     * todavía está ejecutándose.
     */
    if (exporting) {
      return;
    }

    setExporting(true);

    setExportError(null);

    setExportedInspection(null);

    try {
      /*
       * PRUEBA 4
       *
       * InspectionResponse[]
       *       ↓
       * exportKoboSubmission()
       *       ↓
       * mapper
       *       ↓
       * KoboSubmissionData
       *       ↓
       * MockKoboService.createSubmission()
       */
      const result = await exportKoboSubmission("form-001", TEST_RESPONSES);

      setExportedInspection(result);

      /*
       * Después de crearla volvemos a consultar
       * las submissions del asset.
       *
       * Si todo funciona correctamente,
       * el contador debe aumentar.
       */
      const kobo = getKoboService();

      const updatedSubmissions = await kobo.getSubmissions(result.assetUid);

      setSubmissions(updatedSubmissions);
    } catch (currentError) {
      setExportError(
        currentError instanceof Error
          ? currentError.message
          : "Error desconocido durante la exportación.",
      );
    } finally {
      setExporting(false);
    }
  };

  /* ---------------------------------------------------------------------- */
  /*                         FORMULARIO IMPORTADO                            */
  /* ---------------------------------------------------------------------- */

  const form = importedInspection
    ? getFormById(importedInspection.formId)
    : undefined;

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ResponsiveContainer>
          {/* ============================================================ */}
          {/* ENCABEZADO                                                   */}
          {/* ============================================================ */}

          <View style={styles.header}>
            <Text
              style={[
                styles.overline,
                {
                  color: colors.primary,
                },
              ]}
            >
              HERRAMIENTA DE DESARROLLO
            </Text>

            <Text
              style={[
                styles.title,
                {
                  color: colors.text,
                },
              ]}
            >
              Prueba Kobo
            </Text>

            <Text
              style={[
                styles.subtitle,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              Verifica la comunicación bidireccional entre Kobo y el modelo
              interno de UNIESAP.
            </Text>
          </View>

          {/* ============================================================ */}
          {/* CARGA / ERROR                                                */}
          {/* ============================================================ */}

          {loading && (
            <AppCard>
              <Text
                style={{
                  color: colors.textSecondary,
                }}
              >
                Consultando Kobo...
              </Text>
            </AppCard>
          )}

          {error && (
            <AppCard
              style={{
                borderColor: colors.error,
              }}
            >
              <Text
                style={[
                  styles.cardTitle,
                  {
                    color: colors.error,
                  },
                ]}
              >
                Error
              </Text>

              <Text
                style={{
                  color: colors.textSecondary,
                }}
              >
                {error}
              </Text>
            </AppCard>
          )}

          {/* ============================================================ */}
          {/* INFORMACIÓN GENERAL                                          */}
          {/* ============================================================ */}

          {!loading && !error && (
            <View
              style={[styles.mainLayout, !isPhone && styles.mainLayoutWide]}
            >
              {/* ASSET */}

              {asset && (
                <View style={[styles.column, !isPhone && styles.columnWide]}>
                  <AppCard style={styles.fullHeightCard}>
                    <Text
                      style={[
                        styles.cardTitle,
                        {
                          color: colors.text,
                        },
                      ]}
                    >
                      Proyecto Kobo
                    </Text>

                    <InfoRow label="Asset UID" value={asset.assetUid} />

                    <InfoRow
                      label="Estado"
                      value={asset.deploymentStatus ?? "No disponible"}
                    />

                    <InfoRow
                      label="Versión"
                      value={asset.versionUid ?? "No disponible"}
                    />

                    <InfoRow label="Modo actual" value="Mock" />
                  </AppCard>
                </View>
              )}

              {/* SUBMISSIONS */}

              <View style={[styles.column, !isPhone && styles.columnWide]}>
                <AppCard style={styles.fullHeightCard}>
                  <Text
                    style={[
                      styles.cardTitle,
                      {
                        color: colors.text,
                      },
                    ]}
                  >
                    Submissions Kobo
                  </Text>

                  <Text
                    style={[
                      styles.counter,
                      {
                        color: colors.primary,
                      },
                    ]}
                  >
                    {submissions.length}
                  </Text>

                  <Text
                    style={[
                      styles.counterLabel,
                      {
                        color: colors.textSecondary,
                      },
                    ]}
                  >
                    envíos encontrados
                  </Text>

                  {submissions.map((submission) => (
                    <View
                      key={String(submission.submissionId)}
                      style={[
                        styles.submissionRow,
                        {
                          borderTopColor: colors.divider,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.submissionTitle,
                          {
                            color: colors.text,
                          },
                        ]}
                      >
                        Submission #{submission.submissionId}
                      </Text>

                      <Text
                        style={[
                          styles.submissionMeta,
                          {
                            color: colors.textMuted,
                          },
                        ]}
                      >
                        {submission.uuid ?? "Sin UUID"}
                      </Text>
                    </View>
                  ))}
                </AppCard>
              </View>
            </View>
          )}

          {/* ============================================================ */}
          {/* PRUEBA DE IMPORTACIÓN                                        */}
          {/* ============================================================ */}

          {importedInspection && (
            <View style={styles.section}>
              <Text
                style={[
                  styles.sectionTitle,
                  {
                    color: colors.text,
                  },
                ]}
              >
                1. Kobo → UNIESAP
              </Text>

              <Text
                style={[
                  styles.sectionDescription,
                  {
                    color: colors.textSecondary,
                  },
                ]}
              >
                Importación de una submission existente y conversión a
                InspectionResponse[].
              </Text>

              <AppCard>
                <InfoRow
                  label="Formulario"
                  value={form?.title ?? importedInspection.formId}
                />

                <InfoRow
                  label="Asset Kobo"
                  value={importedInspection.assetUid}
                />

                <InfoRow
                  label="Submission"
                  value={String(importedInspection.submissionId)}
                />

                <Text
                  style={[
                    styles.responseSectionTitle,
                    {
                      color: colors.text,
                    },
                  ]}
                >
                  Respuestas convertidas
                </Text>

                {importedInspection.responses.map((response) => {
                  const question = form?.questions.find(
                    (item) => item.id === response.questionId,
                  );

                  return (
                    <View
                      key={response.questionId}
                      style={[
                        styles.responseRow,
                        {
                          borderTopColor: colors.divider,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.question,
                          {
                            color: colors.textSecondary,
                          },
                        ]}
                      >
                        {question?.label ?? response.questionId}
                      </Text>

                      <Text
                        style={[
                          styles.answer,
                          {
                            color: colors.text,
                          },
                        ]}
                      >
                        {formatValue(response.value)}
                      </Text>
                    </View>
                  );
                })}
              </AppCard>
            </View>
          )}

          {/* ============================================================ */}
          {/* PRUEBA DE EXPORTACIÓN                                        */}
          {/* ============================================================ */}

          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              2. UNIESAP → Kobo
            </Text>

            <Text
              style={[
                styles.sectionDescription,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              Convierte respuestas internas a campos Kobo y crea una submission
              simulada.
            </Text>

            <AppCard>
              <Text
                style={[
                  styles.cardTitle,
                  {
                    color: colors.text,
                  },
                ]}
              >
                Respuestas de prueba
              </Text>

              {TEST_RESPONSES.map((response) => {
                const testForm = getFormById("form-001");

                const question = testForm?.questions.find(
                  (item) => item.id === response.questionId,
                );

                return (
                  <View
                    key={response.questionId}
                    style={[
                      styles.responseRow,
                      {
                        borderTopColor: colors.divider,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.question,
                        {
                          color: colors.textSecondary,
                        },
                      ]}
                    >
                      {question?.label ?? response.questionId}
                    </Text>

                    <Text
                      style={[
                        styles.answer,
                        {
                          color: colors.text,
                        },
                      ]}
                    >
                      {formatValue(response.value)}
                    </Text>
                  </View>
                );
              })}

              <View style={styles.testButton}>
                <AppButton onPress={handleExportTest}>
                  {exporting
                    ? "Creando submission..."
                    : "Crear submission simulada"}
                </AppButton>
              </View>
            </AppCard>
          </View>

          {/* ============================================================ */}
          {/* ERROR DE EXPORTACIÓN                                         */}
          {/* ============================================================ */}

          {exportError && (
            <AppCard
              style={{
                borderColor: colors.error,
              }}
            >
              <Text
                style={[
                  styles.cardTitle,
                  {
                    color: colors.error,
                  },
                ]}
              >
                Error de exportación
              </Text>

              <Text
                style={{
                  color: colors.textSecondary,
                }}
              >
                {exportError}
              </Text>
            </AppCard>
          )}

          {/* ============================================================ */}
          {/* RESULTADO DE EXPORTACIÓN                                     */}
          {/* ============================================================ */}

          {exportedInspection && (
            <View style={styles.section}>
              <Text
                style={[
                  styles.sectionTitle,
                  {
                    color: colors.success,
                  },
                ]}
              >
                ✓ Submission simulada creada
              </Text>

              <AppCard>
                <InfoRow label="Formulario" value={exportedInspection.formId} />

                <InfoRow
                  label="Asset UID"
                  value={exportedInspection.assetUid}
                />

                <InfoRow
                  label="Submission ID"
                  value={String(exportedInspection.submission.submissionId)}
                />

                <InfoRow
                  label="UUID"
                  value={exportedInspection.submission.uuid ?? "Sin UUID"}
                />

                {/* PAYLOAD */}

                <Text
                  style={[
                    styles.responseSectionTitle,
                    {
                      color: colors.text,
                    },
                  ]}
                >
                  Payload generado
                </Text>

                <View
                  style={[
                    styles.payloadBox,
                    {
                      backgroundColor: colors.surfaceSecondary,

                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.payloadText,
                      {
                        color: colors.textSecondary,
                      },
                    ]}
                  >
                    {JSON.stringify(exportedInspection.payload, null, 2)}
                  </Text>
                </View>
              </AppCard>
            </View>
          )}

          {/* ============================================================ */}
          {/* FLUJO                                                        */}
          {/* ============================================================ */}

          <AppCard style={styles.flowCard}>
            <Text
              style={[
                styles.cardTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              Flujo probado
            </Text>

            <Text
              style={[
                styles.flowText,
                {
                  color: colors.primary,
                },
              ]}
            >
              Kobo → Mapper → UNIESAP
            </Text>

            <Text
              style={[
                styles.flowText,
                {
                  color: colors.primary,
                },
              ]}
            >
              UNIESAP → Mapper → MockKoboService → Submission
            </Text>
          </AppCard>

          <Text
            style={[
              styles.notice,
              {
                color: colors.textMuted,
              },
            ]}
          >
            Herramienta interna de desarrollo · no se están enviando datos a
            Kobo real.
          </Text>
        </ResponsiveContainer>
      </ScrollView>
    </Screen>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  INFO ROW                                  */
/* -------------------------------------------------------------------------- */

function InfoRow({ label, value }: { label: string; value: string }) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.infoRow}>
      <Text
        style={[
          styles.infoLabel,
          {
            color: colors.textMuted,
          },
        ]}
      >
        {label}
      </Text>

      <Text
        style={[
          styles.infoValue,
          {
            color: colors.text,
          },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  HELPERS                                   */
/* -------------------------------------------------------------------------- */

function formatValue(value: string | number | boolean | null) {
  if (value === null) {
    return "Sin respuesta";
  }

  if (typeof value === "boolean") {
    return value ? "Sí" : "No";
  }

  return String(value);
}

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: Spacing.xxxl,
  },

  /* HEADER */

  header: {
    marginBottom: Spacing.xl,
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
    maxWidth: 760,

    fontSize: FontSize.body,

    lineHeight: 24,
  },

  /* LAYOUT */

  mainLayout: {
    width: "100%",

    gap: Spacing.md,

    marginBottom: Spacing.xl,
  },

  mainLayoutWide: {
    flexDirection: "row",

    alignItems: "stretch",
  },

  column: {
    width: "100%",
  },

  columnWide: {
    flex: 1,

    width: "auto",

    minWidth: 0,
  },

  fullHeightCard: {
    width: "100%",

    height: "100%",
  },

  /* SECTIONS */

  section: {
    marginBottom: Spacing.xl,
  },

  sectionTitle: {
    fontSize: FontSize.h2,

    fontWeight: "700",

    marginBottom: Spacing.sm,
  },

  sectionDescription: {
    maxWidth: 760,

    fontSize: FontSize.small,

    lineHeight: 20,

    marginBottom: Spacing.md,
  },

  /* CARDS */

  cardTitle: {
    fontSize: FontSize.cardTitle,

    fontWeight: "700",

    marginBottom: Spacing.md,
  },

  /* INFO */

  infoRow: {
    marginBottom: Spacing.md,
  },

  infoLabel: {
    fontSize: FontSize.caption,

    marginBottom: Spacing.xs,
  },

  infoValue: {
    fontSize: FontSize.small,

    fontWeight: "600",
  },

  /* SUBMISSIONS */

  counter: {
    fontSize: FontSize.h1,

    fontWeight: "700",
  },

  counterLabel: {
    fontSize: FontSize.caption,

    marginBottom: Spacing.md,
  },

  submissionRow: {
    borderTopWidth: 1,

    paddingTop: Spacing.md,

    marginTop: Spacing.md,
  },

  submissionTitle: {
    fontSize: FontSize.small,

    fontWeight: "600",

    marginBottom: Spacing.xs,
  },

  submissionMeta: {
    fontSize: FontSize.caption,
  },

  /* RESPONSES */

  responseSectionTitle: {
    fontSize: FontSize.body,

    fontWeight: "700",

    marginTop: Spacing.lg,

    marginBottom: Spacing.sm,
  },

  responseRow: {
    borderTopWidth: 1,

    paddingTop: Spacing.md,

    marginTop: Spacing.md,
  },

  question: {
    fontSize: FontSize.caption,

    lineHeight: 18,

    marginBottom: Spacing.xs,
  },

  answer: {
    fontSize: FontSize.body,

    fontWeight: "600",
  },

  /* EXPORT */

  testButton: {
    marginTop: Spacing.lg,
  },

  payloadBox: {
    padding: Spacing.md,

    borderWidth: 1,

    borderRadius: Radius.md,
  },

  payloadText: {
    fontSize: FontSize.caption,

    lineHeight: 19,
  },

  /* FLOW */

  flowCard: {
    marginTop: Spacing.sm,
  },

  flowText: {
    fontSize: FontSize.small,

    fontWeight: "700",

    lineHeight: 22,

    marginBottom: Spacing.sm,
  },

  notice: {
    fontSize: FontSize.caption,

    lineHeight: 18,

    textAlign: "center",

    marginTop: Spacing.lg,
  },
});
