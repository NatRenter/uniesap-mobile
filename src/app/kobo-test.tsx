import { useEffect, useState } from "react";

import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/ui/Screen";

import {
  getKoboService,
  type KoboAssetReference,
  type KoboSubmissionReference,
} from "@/integrations/kobo";

import {
  importKoboSubmission,
  type ImportedKoboInspection,
} from "@/services/koboInspectionService";

import { getFormById } from "@/data/forms";

import { FontSize, Radius, Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

export default function KoboTestScreen() {
  const { colors } = useAppTheme();

  const [asset, setAsset] = useState<KoboAssetReference | null>(null);

  const [submissions, setSubmissions] = useState<KoboSubmissionReference[]>([]);

  const [importedInspection, setImportedInspection] =
    useState<ImportedKoboInspection | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const kobo = getKoboService();

        /*
         * PRUEBA 1:
         *
         * Obtenemos información
         * del asset.
         */
        const assetResult = await kobo.getAsset("mock-asset-risk");

        /*
         * PRUEBA 2:
         *
         * Obtenemos las submissions
         * disponibles.
         */
        const submissionResult = await kobo.getSubmissions("mock-asset-risk");

        /*
         * PRUEBA 3:
         *
         * Importamos una submission
         * usando únicamente el ID
         * del formulario interno.
         *
         * El servicio se encarga de
         * resolver el assetUid Kobo.
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

  const form = importedInspection
    ? getFormById(importedInspection.formId)
    : undefined;

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
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
          Prueba de comunicación entre el adaptador Kobo y el modelo interno de
          UNIESAP.
        </Text>

        {loading && (
          <Text
            style={{
              color: colors.textSecondary,
            }}
          >
            Consultando Kobo...
          </Text>
        )}

        {error && (
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,

                borderColor: colors.error,
              },
            ]}
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
          </View>
        )}

        {asset && (
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,

                borderColor: colors.border,
              },
            ]}
          >
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
          </View>
        )}

        {!loading && !error && (
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,

                borderColor: colors.border,
              },
            ]}
          >
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
          </View>
        )}

        {importedInspection && (
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,

                borderColor: colors.primary,
              },
            ]}
          >
            <Text
              style={[
                styles.cardTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              Conversión a UNIESAP
            </Text>

            <InfoRow
              label="Formulario"
              value={form?.title ?? importedInspection.formId}
            />

            <InfoRow label="Asset Kobo" value={importedInspection.assetUid} />

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
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

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

function formatValue(value: string | number | boolean | null) {
  if (value === null) {
    return "Sin respuesta";
  }

  if (typeof value === "boolean") {
    return value ? "Sí" : "No";
  }

  return String(value);
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,

    paddingBottom: Spacing.xxxl,
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

  card: {
    borderWidth: 1,

    borderRadius: Radius.lg,

    padding: Spacing.lg,

    marginBottom: Spacing.lg,
  },

  cardTitle: {
    fontSize: FontSize.cardTitle,

    fontWeight: "700",

    marginBottom: Spacing.md,
  },

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

    marginBottom: Spacing.xs,
  },

  answer: {
    fontSize: FontSize.body,

    fontWeight: "600",
  },
});
