import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { router, useLocalSearchParams } from "expo-router";

import { AppCard } from "@/components/ui/AppCard";
import { ResponsiveContainer } from "@/components/ui/ResponsiveContainer";
import { ResponsiveGrid } from "@/components/ui/ResponsiveGrid";
import { Screen } from "@/components/ui/Screen";

import { getFormById } from "@/repositories/formRepository";

import { FontSize, Radius, Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

import type { FormQuestion } from "@/types/form";

export default function FormDetailsScreen() {
  /*
   * Colores del tema global.
   */
  const { colors } = useAppTheme();

  /*
   * Parámetros dinámicos:
   *
   * /empresas/[id]/formularios/[formId]
   */
  const { id, formId } = useLocalSearchParams<{
    id: string;
    formId: string;
  }>();

  /*
   * IMPORTANTE:
   *
   * Ya no usamos un objeto formData duplicado.
   *
   * La pantalla obtiene directamente la misma
   * FormDefinition que utiliza CaptureScreen.
   */
  const form = getFormById(formId);

  /*
   * Si el formulario no existe mostramos
   * un estado controlado.
   */
  if (!form) {
    return (
      <Screen>
        <Pressable
          onPress={() =>
            router.navigate({
              pathname: "/empresas/[id]/formularios",

              params: {
                id,
              },
            })
          }
        >
          <Text
            style={{
              color: colors.primary,

              fontWeight: "600",
            }}
          >
            ‹ Formularios
          </Text>
        </Pressable>

        <View style={styles.notFound}>
          <Text
            style={[
              styles.notFoundTitle,
              {
                color: colors.text,
              },
            ]}
          >
            Formulario no encontrado
          </Text>

          <Text
            style={[
              styles.notFoundDescription,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            No fue posible encontrar la definición de este formulario.
          </Text>
        </View>
      </Screen>
    );
  }

  /*
   * Contadores utilizados en el resumen.
   */
  const requiredQuestions = form.questions.filter(
    (question) => question.required,
  ).length;

  const integratedQuestions = form.questions.filter((question) =>
    Boolean(question.integration?.koboFieldName),
  ).length;

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ResponsiveContainer>
          {/* ============================================================ */}
          {/* NAVEGACIÓN                                                   */}
          {/* ============================================================ */}

          <Pressable
            onPress={() =>
              router.navigate({
                pathname: "/empresas/[id]/formularios",

                params: {
                  id,
                },
              })
            }
          >
            <Text
              style={[
                styles.backText,
                {
                  color: colors.primary,
                },
              ]}
            >
              ‹ Formularios
            </Text>
          </Pressable>

          {/* ============================================================ */}
          {/* ENCABEZADO                                                   */}
          {/* ============================================================ */}

          <Text
            style={[
              styles.overline,
              {
                color: colors.primary,
              },
            ]}
          >
            FORMULARIO
          </Text>

          <Text
            style={[
              styles.title,
              {
                color: colors.text,
              },
            ]}
          >
            {form.title}
          </Text>

          <Text
            style={[
              styles.description,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            {form.description}
          </Text>

          {/* ============================================================ */}
          {/* ESTADO Y VERSIÓN                                             */}
          {/* ============================================================ */}

          <View style={styles.headerMeta}>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    form.status === "active"
                      ? `${colors.success}20`
                      : colors.surfaceSecondary,
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  {
                    color:
                      form.status === "active"
                        ? colors.success
                        : colors.textMuted,
                  },
                ]}
              >
                ● {form.status === "active" ? "Activo" : "Inactivo"}
              </Text>
            </View>

            <Text
              style={[
                styles.version,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              Versión v{form.version}
            </Text>
          </View>

          {/* ============================================================ */}
          {/* RESUMEN                                                      */}
          {/* ============================================================ */}

          <ResponsiveGrid
            phoneColumns={3}
            tabletColumns={3}
            desktopColumns={3}
            gap={Spacing.sm}
          >
            <SummaryCard
              value={form.questions.length.toString()}
              label="Preguntas"
            />

            <SummaryCard
              value={requiredQuestions.toString()}
              label="Obligatorias"
            />

            <SummaryCard value={integratedQuestions.toString()} label="Kobo" />
          </ResponsiveGrid>

          {/* ============================================================ */}
          {/* PREGUNTAS                                                    */}
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
              Preguntas
            </Text>

            <Text
              style={[
                styles.sectionDescription,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              Estructura actual utilizada para construir dinámicamente la
              captura.
            </Text>

            {/*
             * Móvil:
             * 1 pregunta por fila.
             *
             * Tablet:
             * 2 preguntas por fila.
             *
             * Desktop:
             * 2 preguntas por fila.
             *
             * No usamos 3 columnas porque algunas preguntas
             * pueden tener etiquetas largas o varias opciones.
             */}
            <ResponsiveGrid
              phoneColumns={1}
              tabletColumns={2}
              desktopColumns={2}
              gap={Spacing.md}
            >
              {form.questions.map((question, index) => (
                <QuestionCard
                  key={question.id}
                  number={index + 1}
                  question={question}
                />
              ))}
            </ResponsiveGrid>
          </View>

          {/* ============================================================ */}
          {/* INTEGRACIÓN                                                  */}
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
              Integración
            </Text>

            <AppCard>
              {form.integration ? (
                <>
                  <IntegrationRow label="Proveedor" value="Kobo" />

                  <Divider />

                  <IntegrationRow
                    label="Asset UID"
                    value={form.integration.assetUid}
                  />

                  <Divider />

                  <IntegrationRow
                    label="Version UID"
                    value={form.integration.versionUid ?? "No definido"}
                  />

                  <Divider />

                  <IntegrationRow
                    label="Última sincronización"
                    value={
                      form.integration.lastSyncAt ?? "Todavía no sincronizado"
                    }
                  />
                </>
              ) : (
                <>
                  <Text
                    style={[
                      styles.infoTitle,
                      {
                        color: colors.text,
                      },
                    ]}
                  >
                    Formulario interno
                  </Text>

                  <Text
                    style={[
                      styles.infoText,
                      {
                        color: colors.textSecondary,
                      },
                    ]}
                  >
                    Este formulario todavía no tiene una integración externa
                    configurada.
                  </Text>
                </>
              )}
            </AppCard>
          </View>

          {/* ============================================================ */}
          {/* ARQUITECTURA                                                 */}
          {/* ============================================================ */}

          <AppCard style={styles.architectureCard}>
            <Text
              style={[
                styles.infoTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              Flujo del formulario
            </Text>

            <Text
              style={[
                styles.infoText,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              Esta definición es utilizada por UNIESAP para construir la
              pantalla de captura y posteriormente mapear las respuestas hacia
              Kobo.
            </Text>

            <Text
              style={[
                styles.architectureFlow,
                {
                  color: colors.primary,
                },
              ]}
            >
              FormDefinition → CaptureScreen → InspectionResponse[] → Kobo
            </Text>
          </AppCard>
        </ResponsiveContainer>
      </ScrollView>
    </Screen>
  );
}

/* -------------------------------------------------------------------------- */
/*                               SUMMARY CARD                                 */
/* -------------------------------------------------------------------------- */

function SummaryCard({ value, label }: { value: string; label: string }) {
  const { colors } = useAppTheme();

  return (
    <AppCard style={styles.summaryCard}>
      <Text
        style={[
          styles.summaryValue,
          {
            color: colors.text,
          },
        ]}
      >
        {value}
      </Text>

      <Text
        style={[
          styles.summaryLabel,
          {
            color: colors.textSecondary,
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </AppCard>
  );
}

/* -------------------------------------------------------------------------- */
/*                               QUESTION CARD                                */
/* -------------------------------------------------------------------------- */

/*
 * Esta tarjeta utiliza directamente FormQuestion.
 *
 * Así el detalle y CaptureScreen comparten
 * exactamente el mismo modelo.
 */
function QuestionCard({
  number,
  question,
}: {
  number: number;
  question: FormQuestion;
}) {
  const { colors } = useAppTheme();

  return (
    <AppCard style={styles.questionCard}>
      <View style={styles.questionRow}>
        <View
          style={[
            styles.questionNumber,
            {
              backgroundColor: colors.primarySoft,
            },
          ]}
        >
          <Text
            style={[
              styles.questionNumberText,
              {
                color: colors.primary,
              },
            ]}
          >
            {number}
          </Text>
        </View>

        <View style={styles.questionContent}>
          <Text
            style={[
              styles.questionLabel,
              {
                color: colors.text,
              },
            ]}
          >
            {question.label}

            {question.required && (
              <Text
                style={{
                  color: colors.error,
                }}
              >
                {" *"}
              </Text>
            )}
          </Text>

          <Text
            style={[
              styles.questionType,
              {
                color: colors.textMuted,
              },
            ]}
          >
            {getQuestionTypeLabel(question.type)}
          </Text>
        </View>
      </View>

      {/* SELECT OPTIONS */}

      {question.type === "select" &&
        question.options &&
        question.options.length > 0 && (
          <>
            <View
              style={[
                styles.divider,
                {
                  backgroundColor: colors.divider,
                },
              ]}
            />

            <Text
              style={[
                styles.optionsTitle,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              Opciones
            </Text>

            <View style={styles.optionsList}>
              {question.options.map((option) => (
                <View key={option.value} style={styles.optionRow}>
                  <View
                    style={[
                      styles.optionDot,
                      {
                        backgroundColor: colors.primary,
                      },
                    ]}
                  />

                  <Text
                    style={[
                      styles.optionText,
                      {
                        color: colors.textSecondary,
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

      {/* KOBO FIELD */}

      {question.integration?.koboFieldName && (
        <>
          <View
            style={[
              styles.divider,
              {
                backgroundColor: colors.divider,
              },
            ]}
          />

          <Text
            style={[
              styles.koboLabel,
              {
                color: colors.textMuted,
              },
            ]}
          >
            Campo Kobo
          </Text>

          <Text
            style={[
              styles.koboValue,
              {
                color: colors.textSecondary,
              },
            ]}
            numberOfLines={2}
          >
            {question.integration.koboFieldName}
          </Text>
        </>
      )}
    </AppCard>
  );
}

/* -------------------------------------------------------------------------- */
/*                              INTEGRATION ROW                               */
/* -------------------------------------------------------------------------- */

function IntegrationRow({ label, value }: { label: string; value: string }) {
  const { colors } = useAppTheme();

  return (
    <View>
      <Text
        style={[
          styles.integrationLabel,
          {
            color: colors.textMuted,
          },
        ]}
      >
        {label}
      </Text>

      <Text
        style={[
          styles.integrationValue,
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
/*                                   DIVIDER                                  */
/* -------------------------------------------------------------------------- */

function Divider() {
  const { colors } = useAppTheme();

  return (
    <View
      style={[
        styles.divider,
        {
          backgroundColor: colors.divider,
        },
      ]}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

function getQuestionTypeLabel(type: FormQuestion["type"]) {
  switch (type) {
    case "text":
      return "Texto";

    case "textarea":
      return "Texto largo";

    case "number":
      return "Número";

    case "boolean":
      return "Selección Sí / No";

    case "select":
      return "Selección";

    case "photo":
      return "Fotografía";

    default:
      return type;
  }
}

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: Spacing.xxxl,
  },

  backText: {
    fontSize: FontSize.small,

    fontWeight: "600",

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

  description: {
    maxWidth: 760,

    fontSize: FontSize.body,

    lineHeight: 24,

    marginBottom: Spacing.md,
  },

  /* HEADER META */

  headerMeta: {
    flexDirection: "row",

    flexWrap: "wrap",

    alignItems: "center",

    gap: Spacing.md,

    marginBottom: Spacing.xl,
  },

  statusBadge: {
    paddingHorizontal: Spacing.md,

    paddingVertical: Spacing.sm,

    borderRadius: Radius.full,
  },

  statusText: {
    fontSize: FontSize.caption,

    fontWeight: "700",
  },

  version: {
    fontSize: FontSize.small,

    fontWeight: "600",
  },

  /* SUMMARY */

  summaryCard: {
    width: "100%",

    minHeight: 96,
  },

  summaryValue: {
    fontSize: FontSize.h2,

    fontWeight: "700",

    marginBottom: Spacing.xs,
  },

  summaryLabel: {
    fontSize: FontSize.caption,
  },

  /* SECTION */

  section: {
    marginTop: Spacing.xl,
  },

  sectionTitle: {
    fontSize: FontSize.cardTitle,

    fontWeight: "700",

    marginBottom: Spacing.xs,
  },

  sectionDescription: {
    maxWidth: 760,

    fontSize: FontSize.small,

    lineHeight: 20,

    marginBottom: Spacing.md,
  },

  /* QUESTIONS */

  questionCard: {
    width: "100%",

    minHeight: 150,
  },

  questionRow: {
    flexDirection: "row",

    alignItems: "flex-start",
  },

  questionNumber: {
    width: 40,

    height: 40,

    flexShrink: 0,

    borderRadius: Radius.full,

    alignItems: "center",

    justifyContent: "center",

    marginRight: Spacing.md,
  },

  questionNumberText: {
    fontSize: FontSize.small,

    fontWeight: "700",
  },

  questionContent: {
    flex: 1,

    minWidth: 0,
  },

  questionLabel: {
    fontSize: FontSize.body,

    fontWeight: "600",

    lineHeight: 22,

    marginBottom: Spacing.xs,
  },

  questionType: {
    fontSize: FontSize.caption,
  },

  divider: {
    height: 1,

    marginVertical: Spacing.md,
  },

  /* OPTIONS */

  optionsTitle: {
    fontSize: FontSize.caption,

    fontWeight: "600",

    marginBottom: Spacing.sm,
  },

  optionsList: {
    gap: Spacing.sm,
  },

  optionRow: {
    flexDirection: "row",

    alignItems: "center",
  },

  optionDot: {
    width: 6,

    height: 6,

    flexShrink: 0,

    borderRadius: Radius.full,

    marginRight: Spacing.sm,
  },

  optionText: {
    flex: 1,

    fontSize: FontSize.caption,

    lineHeight: 18,
  },

  /* KOBO */

  koboLabel: {
    fontSize: FontSize.caption,

    marginBottom: Spacing.xs,
  },

  koboValue: {
    fontSize: FontSize.caption,

    fontWeight: "600",
  },

  /* INTEGRATION */

  integrationLabel: {
    fontSize: FontSize.caption,

    marginBottom: Spacing.xs,
  },

  integrationValue: {
    fontSize: FontSize.small,

    fontWeight: "600",
  },

  /* INFO */

  infoTitle: {
    fontSize: FontSize.body,

    fontWeight: "700",

    marginBottom: Spacing.sm,
  },

  infoText: {
    fontSize: FontSize.small,

    lineHeight: 20,
  },

  architectureCard: {
    marginTop: Spacing.xl,
  },

  architectureFlow: {
    fontSize: FontSize.small,

    fontWeight: "700",

    lineHeight: 21,

    marginTop: Spacing.md,
  },

  /* NOT FOUND */

  notFound: {
    flex: 1,

    justifyContent: "center",
  },

  notFoundTitle: {
    fontSize: FontSize.h2,

    fontWeight: "700",

    marginBottom: Spacing.sm,
  },

  notFoundDescription: {
    fontSize: FontSize.body,

    lineHeight: 24,
  },
});
