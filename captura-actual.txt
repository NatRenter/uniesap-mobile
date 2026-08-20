import { useState } from "react";

import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { router, useLocalSearchParams } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { AppTextInput } from "@/components/ui/AppTextInput";
import { ResponsiveContainer } from "@/components/ui/ResponsiveContainer";
import { Screen } from "@/components/ui/Screen";

import { getCompanyById } from "@/data/companies";
import { getFormById } from "@/data/forms";
import { getPropertyById } from "@/data/properties";

import { FontSize, Radius, Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";
import { useResponsive } from "@/hooks/useResponsive";

import type { FormQuestion, FormQuestionOption } from "@/types/form";

import type {
  InspectionResponse,
  InspectionResponseValue,
} from "@/types/inspection";

/*
 * Estado interno de las respuestas mientras
 * el usuario está realizando la captura.
 *
 * Ejemplo:
 *
 * {
 *   "question-001": "Alexis",
 *   "question-002": true,
 *   "question-003": "Observaciones..."
 * }
 */
type CaptureAnswers = Record<string, InspectionResponseValue>;

export default function CaptureScreen() {
  const { colors } = useAppTheme();

  /*
   * En móvil usamos una sola columna.
   *
   * En tablet y escritorio mostramos
   * la captura junto con un panel lateral.
   */
  const { isPhone } = useResponsive();

  /*
   * Ruta:
   *
   * /empresas/[id]/inmuebles/[propertyId]/captura
   *
   * Además recibimos formId para saber qué
   * FormDefinition debemos renderizar.
   */
  const { id, propertyId, formId } = useLocalSearchParams<{
    id: string;
    propertyId: string;
    formId?: string;
  }>();

  /*
   * Resolvemos los datos reales utilizados
   * por la pantalla.
   */
  const company = getCompanyById(id);

  const property = getPropertyById(propertyId);

  const form = formId ? getFormById(formId) : undefined;

  /*
   * answers reemplaza los estados individuales:
   *
   * responsible
   * observations
   * hasRisk
   *
   * Ahora podemos manejar cualquier número
   * de preguntas sin crear un useState
   * diferente para cada una.
   */
  const [answers, setAnswers] = useState<CaptureAnswers>({});

  /*
   * Como todos los Hooks ya fueron ejecutados,
   * ahora podemos hacer el return condicional.
   */
  if (!company || !property || !form) {
    return (
      <Screen>
        <Pressable onPress={() => router.back()}>
          <Text
            style={{
              color: colors.primary,

              fontWeight: "600",
            }}
          >
            ‹ Volver
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
            No fue posible iniciar la captura
          </Text>

          <Text
            style={[
              styles.notFoundDescription,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            Verifica que la empresa, el inmueble y el formulario existan.
          </Text>
        </View>
      </Screen>
    );
  }

  /* ---------------------------------------------------------------------- */
  /*                       ACTUALIZACIÓN DE RESPUESTAS                       */
  /* ---------------------------------------------------------------------- */

  /*
   * Todas las preguntas utilizan una misma función
   * para modificar su respuesta.
   */
  const updateAnswer = (questionId: string, value: InspectionResponseValue) => {
    setAnswers((currentAnswers) => ({
      ...currentAnswers,

      [questionId]: value,
    }));
  };

  /* ---------------------------------------------------------------------- */
  /*                              PROGRESO                                  */
  /* ---------------------------------------------------------------------- */

  /*
   * Consideramos contestada una pregunta cuando
   * su respuesta tiene un valor útil.
   */
  const answeredQuestions = form.questions.filter((question) =>
    isAnswered(answers[question.id]),
  ).length;

  const totalQuestions = form.questions.length;

  const progress = totalQuestions > 0 ? answeredQuestions / totalQuestions : 0;

  /* ---------------------------------------------------------------------- */
  /*                         RESPUESTAS REQUERIDAS                           */
  /* ---------------------------------------------------------------------- */

  const requiredQuestions = form.questions.filter(
    (question) => question.required,
  );

  const requiredCompleted = requiredQuestions.every((question) =>
    isAnswered(answers[question.id]),
  );

  /* ---------------------------------------------------------------------- */
  /*                         FINALIZAR INSPECCIÓN                            */
  /* ---------------------------------------------------------------------- */

  const handleFinish = () => {
    /*
     * Evitamos finalizar mientras existan
     * respuestas obligatorias pendientes.
     */
    if (!requiredCompleted) {
      return;
    }

    /*
     * Convertimos nuestro Record interno al modelo
     * InspectionResponse[] que ya utiliza UNIESAP.
     */
    const responses: InspectionResponse[] = form.questions
      .filter((question) => isAnswered(answers[question.id]))
      .map((question) => ({
        questionId: question.id,

        value: answers[question.id] ?? null,
      }));

    /*
     * Por ahora verificamos el resultado
     * en consola.
     *
     * El siguiente paso será mandar estas
     * respuestas al mapper de Kobo.
     */
    console.log("Inspection responses:", responses);

    router.replace({
      pathname: "/empresas/[id]/inmuebles/[propertyId]",

      params: {
        id,
        propertyId,
      },
    });
  };

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ResponsiveContainer>
          {/* ============================================================ */}
          {/* NAVEGACIÓN                                                   */}
          {/* ============================================================ */}

          <View style={styles.topNavigation}>
            <Pressable onPress={() => router.back()}>
              <Text
                style={[
                  styles.backText,
                  {
                    color: colors.primary,
                  },
                ]}
              >
                ‹ Cancelar
              </Text>
            </Pressable>

            <View
              style={[
                styles.draftBadge,
                {
                  backgroundColor: colors.surfaceSecondary,
                },
              ]}
            >
              <Text
                style={[
                  styles.draft,
                  {
                    color: colors.warning,
                  },
                ]}
              >
                ● Borrador
              </Text>
            </View>
          </View>

          {/* ============================================================ */}
          {/* FORMULARIO                                                   */}
          {/* ============================================================ */}

          <View style={styles.header}>
            <Text
              style={[
                styles.overline,
                {
                  color: company.branding.primaryColor,
                },
              ]}
            >
              {company.name.toUpperCase()}
            </Text>

            <Text
              style={[
                styles.captureOverline,
                {
                  color: colors.primary,
                },
              ]}
            >
              NUEVA INSPECCIÓN
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
                styles.subtitle,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              {form.description}
            </Text>
          </View>

          {/* ============================================================ */}
          {/* PROGRESO                                                     */}
          {/* ============================================================ */}

          <ProgressSection
            completed={answeredQuestions}
            total={totalQuestions}
            progress={progress}
          />

          {/* ============================================================ */}
          {/* CAPTURA RESPONSIVE                                           */}
          {/* ============================================================ */}

          <View style={[styles.mainLayout, !isPhone && styles.mainLayoutWide]}>
            {/* CONTEXTO EN TELÉFONO */}

            {isPhone && (
              <ContextPanel
                companyName={company.name}
                propertyName={property.name}
                formTitle={form.title}
                formVersion={form.version}
              />
            )}

            {/* ========================================================== */}
            {/* PREGUNTAS DINÁMICAS                                       */}
            {/* ========================================================== */}

            <View
              style={[
                styles.captureColumn,

                !isPhone && styles.captureColumnWide,
              ]}
            >
              {form.questions.map((question, index) => (
                <QuestionCard
                  key={question.id}
                  number={index + 1}
                  question={question}
                  value={answers[question.id] ?? null}
                  onChange={(value) => updateAnswer(question.id, value)}
                />
              ))}
            </View>

            {/* PANEL LATERAL */}

            {!isPhone && (
              <View style={styles.sideColumn}>
                <ContextPanel
                  companyName={company.name}
                  propertyName={property.name}
                  formTitle={form.title}
                  formVersion={form.version}
                />

                <AppCard>
                  <Text
                    style={[
                      styles.statusTitle,
                      {
                        color: colors.text,
                      },
                    ]}
                  >
                    Estado
                  </Text>

                  <View style={styles.statusRow}>
                    <View
                      style={[
                        styles.statusDot,
                        {
                          backgroundColor: colors.warning,
                        },
                      ]}
                    />

                    <Text
                      style={[
                        styles.statusText,
                        {
                          color: colors.textSecondary,
                        },
                      ]}
                    >
                      Borrador
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.statusDescription,
                      {
                        color: colors.textMuted,
                      },
                    ]}
                  >
                    {answeredQuestions} de {totalQuestions} preguntas
                    contestadas.
                  </Text>
                </AppCard>

                {/* INTEGRACIÓN */}

                <AppCard>
                  <Text
                    style={[
                      styles.statusTitle,
                      {
                        color: colors.text,
                      },
                    ]}
                  >
                    Integración
                  </Text>

                  <Text
                    style={[
                      styles.integrationText,
                      {
                        color: colors.textSecondary,
                      },
                    ]}
                  >
                    {form.integration?.provider === "kobo"
                      ? "Formulario preparado para Kobo"
                      : "Formulario interno de UNIESAP"}
                  </Text>

                  {form.integration && (
                    <Text
                      style={[
                        styles.integrationMeta,
                        {
                          color: colors.textMuted,
                        },
                      ]}
                    >
                      Asset: {form.integration.assetUid}
                    </Text>
                  )}
                </AppCard>
              </View>
            )}
          </View>

          {/* ============================================================ */}
          {/* VALIDACIÓN                                                   */}
          {/* ============================================================ */}

          {!requiredCompleted && (
            <Text
              style={[
                styles.validationMessage,
                {
                  color: colors.warning,
                },
              ]}
            >
              Completa las preguntas obligatorias antes de finalizar la
              inspección.
            </Text>
          )}

          {/* ============================================================ */}
          {/* ACCIONES                                                     */}
          {/* ============================================================ */}

          <View style={[styles.actions, !isPhone && styles.actionsWide]}>
            <View style={styles.actionButton}>
              <AppButton onPress={handleFinish}>Finalizar inspección</AppButton>
            </View>

            <View style={styles.actionButton}>
              <AppButton variant="secondary" onPress={() => router.back()}>
                Guardar borrador
              </AppButton>
            </View>
          </View>

          <Text
            style={[
              styles.prototypeNotice,
              {
                color: colors.textMuted,
              },
            ]}
          >
            Las preguntas ya se generan desde FormDefinition. La sincronización
            final con Kobo se implementará en el siguiente paso.
          </Text>
        </ResponsiveContainer>
      </ScrollView>
    </Screen>
  );
}

/* -------------------------------------------------------------------------- */
/*                              QUESTION CARD                                 */
/* -------------------------------------------------------------------------- */

/*
 * Este componente es el núcleo del formulario dinámico.
 *
 * Ya NO conoce preguntas específicas como:
 *
 * "Responsable"
 * "¿Existe riesgo?"
 * "Observaciones"
 *
 * Simplemente recibe un FormQuestion y decide
 * qué componente debe mostrar según question.type.
 */
function QuestionCard({
  number,
  question,
  value,
  onChange,
}: {
  number: number;
  question: FormQuestion;
  value: InspectionResponseValue;
  onChange: (value: InspectionResponseValue) => void;
}) {
  const { colors } = useAppTheme();

  return (
    <AppCard style={styles.questionCard}>
      {/* ENCABEZADO */}

      <View style={styles.questionHeader}>
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

        <View style={styles.questionHeaderInfo}>
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

      {/* ================================================================ */}
      {/* TEXT                                                             */}
      {/* ================================================================ */}

      {question.type === "text" && (
        <AppTextInput
          value={typeof value === "string" ? value : ""}
          onChangeText={onChange}
          placeholder="Escribe una respuesta"
        />
      )}

      {/* ================================================================ */}
      {/* TEXTAREA                                                         */}
      {/* ================================================================ */}

      {question.type === "textarea" && (
        <AppTextInput
          value={typeof value === "string" ? value : ""}
          onChangeText={onChange}
          placeholder="Escribe tus observaciones..."
          multiline
          numberOfLines={5}
          style={styles.textArea}
        />
      )}

      {/* ================================================================ */}
      {/* NUMBER                                                           */}
      {/* ================================================================ */}

      {question.type === "number" && (
        <AppTextInput
          value={typeof value === "number" ? String(value) : ""}
          onChangeText={(text) => {
            if (text.trim() === "") {
              onChange(null);

              return;
            }

            const parsed = Number(text);

            if (!Number.isNaN(parsed)) {
              onChange(parsed);
            }
          }}
          placeholder="0"
          keyboardType="numeric"
        />
      )}

      {/* ================================================================ */}
      {/* BOOLEAN                                                          */}
      {/* ================================================================ */}

      {question.type === "boolean" && (
        <View style={styles.booleanOptions}>
          <SelectionButton
            label="Sí"
            selected={value === true}
            onPress={() => onChange(true)}
          />

          <SelectionButton
            label="No"
            selected={value === false}
            onPress={() => onChange(false)}
          />
        </View>
      )}

      {/* ================================================================ */}
      {/* SELECT                                                           */}
      {/* ================================================================ */}

      {question.type === "select" && (
        <SelectQuestion
          options={question.options ?? []}
          value={typeof value === "string" ? value : null}
          onChange={onChange}
        />
      )}

      {/* ================================================================ */}
      {/* PHOTO                                                            */}
      {/* ================================================================ */}

      {question.type === "photo" && (
        <PhotoQuestion
          selected={
            typeof value === "string" && value.startsWith("mock-photo:")
          }
          onPress={() => onChange(`mock-photo:${question.id}`)}
        />
      )}

      {/* KOBO FIELD */}

      {question.integration?.koboFieldName && (
        <Text
          style={[
            styles.koboField,
            {
              color: colors.textMuted,
            },
          ]}
        >
          Kobo: {question.integration.koboFieldName}
        </Text>
      )}
    </AppCard>
  );
}

/* -------------------------------------------------------------------------- */
/*                              SELECT QUESTION                               */
/* -------------------------------------------------------------------------- */

function SelectQuestion({
  options,
  value,
  onChange,
}: {
  options: FormQuestionOption[];

  value: string | null;

  onChange: (value: InspectionResponseValue) => void;
}) {
  const { colors } = useAppTheme();

  if (options.length === 0) {
    return (
      <Text
        style={[
          styles.noOptions,
          {
            color: colors.warning,
          },
        ]}
      >
        Esta pregunta todavía no tiene opciones configuradas.
      </Text>
    );
  }

  return (
    <View style={styles.selectOptions}>
      {options.map((option) => {
        const selected = value === option.value;

        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.selectOption,
              {
                backgroundColor: selected ? colors.primarySoft : colors.surface,

                borderColor: selected ? colors.primary : colors.border,

                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <View
              style={[
                styles.radio,
                {
                  borderColor: selected ? colors.primary : colors.textMuted,
                },
              ]}
            >
              {selected && (
                <View
                  style={[
                    styles.radioSelected,
                    {
                      backgroundColor: colors.primary,
                    },
                  ]}
                />
              )}
            </View>

            <Text
              style={[
                styles.selectionLabel,
                {
                  color: colors.text,
                },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                               PHOTO QUESTION                               */
/* -------------------------------------------------------------------------- */

function PhotoQuestion({
  selected,
  onPress,
}: {
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.photoBox,
        {
          backgroundColor: selected ? colors.primarySoft : colors.surface,

          borderColor: selected ? colors.primary : colors.border,

          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.photoIconContainer,
          {
            backgroundColor: selected ? colors.surface : colors.primarySoft,
          },
        ]}
      >
        <Text
          style={[
            styles.photoIcon,
            {
              color: colors.primary,
            },
          ]}
        >
          {selected ? "✓" : "+"}
        </Text>
      </View>

      <Text
        style={[
          styles.photoTitle,
          {
            color: colors.text,
          },
        ]}
      >
        {selected ? "Fotografía agregada" : "Agregar fotografía"}
      </Text>

      <Text
        style={[
          styles.photoDescription,
          {
            color: colors.textSecondary,
          },
        ]}
      >
        {selected
          ? "Evidencia simulada agregada al formulario."
          : "La cámara real se conectará posteriormente."}
      </Text>
    </Pressable>
  );
}

/* -------------------------------------------------------------------------- */
/*                              SELECTION BUTTON                              */
/* -------------------------------------------------------------------------- */

function SelectionButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.selectionButton,
        {
          backgroundColor: selected ? colors.primarySoft : colors.surface,

          borderColor: selected ? colors.primary : colors.border,

          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.radio,
          {
            borderColor: selected ? colors.primary : colors.textMuted,
          },
        ]}
      >
        {selected && (
          <View
            style={[
              styles.radioSelected,
              {
                backgroundColor: colors.primary,
              },
            ]}
          />
        )}
      </View>

      <Text
        style={[
          styles.selectionLabel,
          {
            color: colors.text,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/* -------------------------------------------------------------------------- */
/*                              PROGRESS SECTION                              */
/* -------------------------------------------------------------------------- */

function ProgressSection({
  completed,
  total,
  progress,
}: {
  completed: number;
  total: number;
  progress: number;
}) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.progressSection}>
      <View style={styles.progressHeader}>
        <View>
          <Text
            style={[
              styles.progressLabel,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            Progreso de captura
          </Text>

          <Text
            style={[
              styles.progressDescription,
              {
                color: colors.textMuted,
              },
            ]}
          >
            Las respuestas se calculan automáticamente.
          </Text>
        </View>

        <Text
          style={[
            styles.progressValue,
            {
              color: colors.text,
            },
          ]}
        >
          {completed} de {total}
        </Text>
      </View>

      <View
        style={[
          styles.progressTrack,
          {
            backgroundColor: colors.surfaceSecondary,
          },
        ]}
      >
        <View
          style={[
            styles.progressBar,
            {
              backgroundColor: colors.primary,

              width: `${Math.round(progress * 100)}%`,
            },
          ]}
        />
      </View>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                                CONTEXT PANEL                               */
/* -------------------------------------------------------------------------- */

function ContextPanel({
  companyName,
  propertyName,
  formTitle,
  formVersion,
}: {
  companyName: string;
  propertyName: string;
  formTitle: string;
  formVersion: string;
}) {
  const { colors } = useAppTheme();

  return (
    <AppCard>
      <Text
        style={[
          styles.contextTitle,
          {
            color: colors.text,
          },
        ]}
      >
        Contexto de la inspección
      </Text>

      <Text
        style={[
          styles.contextDescription,
          {
            color: colors.textSecondary,
          },
        ]}
      >
        Información asociada a esta captura.
      </Text>

      <ContextRow label="Empresa" value={companyName} />

      <Divider />

      <ContextRow label="Inmueble" value={propertyName} />

      <Divider />

      <ContextRow label="Formulario" value={formTitle} />

      <Divider />

      <ContextRow label="Versión" value={`v${formVersion}`} />
    </AppCard>
  );
}

/* -------------------------------------------------------------------------- */
/*                                CONTEXT ROW                                 */
/* -------------------------------------------------------------------------- */

function ContextRow({ label, value }: { label: string; value: string }) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.contextRow}>
      <Text
        style={[
          styles.contextLabel,
          {
            color: colors.textMuted,
          },
        ]}
      >
        {label}
      </Text>

      <Text
        style={[
          styles.contextValue,
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

function isAnswered(value: InspectionResponseValue | undefined) {
  if (value === undefined || value === null) {
    return false;
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  /*
   * false es una respuesta válida
   * para preguntas booleanas.
   */
  return true;
}

function getQuestionTypeLabel(type: FormQuestion["type"]) {
  switch (type) {
    case "text":
      return "Texto";

    case "textarea":
      return "Texto largo";

    case "number":
      return "Número";

    case "boolean":
      return "Sí / No";

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

  topNavigation: {
    flexDirection: "row",

    justifyContent: "space-between",

    alignItems: "center",

    marginBottom: Spacing.xl,
  },

  backText: {
    fontSize: FontSize.small,

    fontWeight: "600",
  },

  draftBadge: {
    paddingHorizontal: Spacing.sm,

    paddingVertical: Spacing.xs,

    borderRadius: Radius.full,
  },

  draft: {
    fontSize: FontSize.caption,

    fontWeight: "700",
  },

  header: {
    marginBottom: Spacing.lg,
  },

  overline: {
    fontSize: FontSize.caption,

    fontWeight: "700",

    letterSpacing: 1,

    marginBottom: Spacing.sm,
  },

  captureOverline: {
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

  /* PROGRESO */

  progressSection: {
    marginBottom: Spacing.xl,
  },

  progressHeader: {
    flexDirection: "row",

    justifyContent: "space-between",

    alignItems: "flex-end",

    gap: Spacing.md,

    marginBottom: Spacing.sm,
  },

  progressLabel: {
    fontSize: FontSize.small,

    fontWeight: "600",

    marginBottom: Spacing.xs,
  },

  progressDescription: {
    fontSize: FontSize.caption,
  },

  progressValue: {
    flexShrink: 0,

    fontSize: FontSize.small,

    fontWeight: "700",
  },

  progressTrack: {
    height: 8,

    overflow: "hidden",

    borderRadius: Radius.full,
  },

  progressBar: {
    height: "100%",

    borderRadius: Radius.full,
  },

  /* LAYOUT */

  mainLayout: {
    width: "100%",

    gap: Spacing.lg,
  },

  mainLayoutWide: {
    flexDirection: "row",

    alignItems: "flex-start",

    gap: Spacing.xl,
  },

  captureColumn: {
    width: "100%",

    gap: Spacing.md,
  },

  captureColumnWide: {
    flex: 1,

    width: "auto",

    minWidth: 0,
  },

  sideColumn: {
    width: 300,

    flexShrink: 0,

    gap: Spacing.md,
  },

  /* QUESTIONS */

  questionCard: {
    width: "100%",
  },

  questionHeader: {
    flexDirection: "row",

    alignItems: "flex-start",

    marginBottom: Spacing.lg,
  },

  questionNumber: {
    width: 36,

    height: 36,

    flexShrink: 0,

    alignItems: "center",

    justifyContent: "center",

    borderRadius: Radius.full,

    marginRight: Spacing.md,
  },

  questionNumberText: {
    fontSize: FontSize.small,

    fontWeight: "700",
  },

  questionHeaderInfo: {
    flex: 1,

    minWidth: 0,
  },

  questionLabel: {
    fontSize: FontSize.body,

    fontWeight: "700",

    lineHeight: 22,

    marginBottom: Spacing.xs,
  },

  questionType: {
    fontSize: FontSize.caption,
  },

  textArea: {
    minHeight: 140,

    textAlignVertical: "top",

    paddingTop: Spacing.md,
  },

  /* BOOLEAN */

  booleanOptions: {
    flexDirection: "row",

    gap: Spacing.md,
  },

  selectionButton: {
    flex: 1,

    minHeight: 56,

    flexDirection: "row",

    alignItems: "center",

    padding: Spacing.md,

    borderWidth: 1,

    borderRadius: Radius.md,
  },

  radio: {
    width: 20,

    height: 20,

    flexShrink: 0,

    borderWidth: 2,

    borderRadius: Radius.full,

    alignItems: "center",

    justifyContent: "center",

    marginRight: Spacing.sm,
  },

  radioSelected: {
    width: 10,

    height: 10,

    borderRadius: Radius.full,
  },

  selectionLabel: {
    flex: 1,

    fontSize: FontSize.body,

    fontWeight: "600",
  },

  /* SELECT */

  selectOptions: {
    gap: Spacing.sm,
  },

  selectOption: {
    minHeight: 54,

    flexDirection: "row",

    alignItems: "center",

    padding: Spacing.md,

    borderWidth: 1,

    borderRadius: Radius.md,
  },

  noOptions: {
    fontSize: FontSize.small,

    lineHeight: 20,
  },

  /* PHOTO */

  photoBox: {
    minHeight: 170,

    borderWidth: 1,

    borderStyle: "dashed",

    borderRadius: Radius.lg,

    alignItems: "center",

    justifyContent: "center",

    padding: Spacing.lg,
  },

  photoIconContainer: {
    width: 48,

    height: 48,

    alignItems: "center",

    justifyContent: "center",

    borderRadius: Radius.full,

    marginBottom: Spacing.sm,
  },

  photoIcon: {
    fontSize: 28,

    fontWeight: "600",
  },

  photoTitle: {
    fontSize: FontSize.body,

    fontWeight: "600",

    marginBottom: Spacing.xs,
  },

  photoDescription: {
    fontSize: FontSize.caption,

    lineHeight: 18,

    textAlign: "center",
  },

  /* KOBO */

  koboField: {
    fontSize: FontSize.caption,

    marginTop: Spacing.md,
  },

  /* CONTEXT */

  contextTitle: {
    fontSize: FontSize.body,

    fontWeight: "700",

    marginBottom: Spacing.xs,
  },

  contextDescription: {
    fontSize: FontSize.caption,

    lineHeight: 18,

    marginBottom: Spacing.md,
  },

  contextRow: {
    paddingVertical: Spacing.xs,
  },

  contextLabel: {
    fontSize: FontSize.caption,

    marginBottom: Spacing.xs,
  },

  contextValue: {
    fontSize: FontSize.small,

    fontWeight: "600",
  },

  divider: {
    height: 1,

    marginVertical: Spacing.sm,
  },

  /* STATUS */

  statusTitle: {
    fontSize: FontSize.body,

    fontWeight: "700",

    marginBottom: Spacing.md,
  },

  statusRow: {
    flexDirection: "row",

    alignItems: "center",

    marginBottom: Spacing.sm,
  },

  statusDot: {
    width: 8,

    height: 8,

    borderRadius: Radius.full,

    marginRight: Spacing.sm,
  },

  statusText: {
    fontSize: FontSize.small,

    fontWeight: "600",
  },

  statusDescription: {
    fontSize: FontSize.caption,

    lineHeight: 18,
  },

  integrationText: {
    fontSize: FontSize.small,

    lineHeight: 20,

    marginBottom: Spacing.sm,
  },

  integrationMeta: {
    fontSize: FontSize.caption,
  },

  /* VALIDATION */

  validationMessage: {
    fontSize: FontSize.small,

    fontWeight: "600",

    lineHeight: 20,

    marginTop: Spacing.lg,
  },

  /* ACTIONS */

  actions: {
    gap: Spacing.sm,

    marginTop: Spacing.xl,
  },

  actionsWide: {
    flexDirection: "row",

    justifyContent: "flex-end",
  },

  actionButton: {
    minWidth: 210,
  },

  prototypeNotice: {
    fontSize: FontSize.caption,

    lineHeight: 18,

    textAlign: "center",

    marginTop: Spacing.lg,
  },

  /* ERROR */

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
