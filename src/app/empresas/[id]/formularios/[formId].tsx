import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { router, useLocalSearchParams } from "expo-router";

import { AppCard } from "@/components/ui/AppCard";
import { Screen } from "@/components/ui/Screen";

import { FontSize, Radius, Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

const formData = {
  "form-1": {
    title: "Análisis de riesgos",
    version: "v1.0",
    questions: [
      {
        number: 1,
        label: "Nombre del responsable",
        type: "Texto",
      },
      {
        number: 2,
        label: "¿Se identificaron condiciones de riesgo?",
        type: "Selección Sí / No",
      },
      {
        number: 3,
        label: "Observaciones",
        type: "Texto largo",
      },
      {
        number: 4,
        label: "Evidencia fotográfica",
        type: "Fotografía",
      },
    ],
  },

  "form-2": {
    title: "Inspección de extintores",
    version: "v1.2",
    questions: [
      {
        number: 1,
        label: "Número de extintor",
        type: "Texto",
      },
      {
        number: 2,
        label: "Estado general",
        type: "Selección",
      },
      {
        number: 3,
        label: "Fotografía del equipo",
        type: "Fotografía",
      },
    ],
  },

  "form-3": {
    title: "Señalización",
    version: "v1.0",
    questions: [
      {
        number: 1,
        label: "Tipo de señal",
        type: "Selección",
      },
      {
        number: 2,
        label: "Ubicación",
        type: "Texto",
      },
      {
        number: 3,
        label: "Condición visible",
        type: "Sí / No",
      },
    ],
  },
} as const;

export default function FormDetailsScreen() {
  const { colors } = useAppTheme();

  const { id, formId } = useLocalSearchParams<{
    id: string;
    formId: string;
  }>();

  const form = formData[formId as keyof typeof formData] ?? formData["form-1"];

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={() =>
            router.navigate({
              pathname: "/empresas/[id]/formularios",
              params: { id },
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
            styles.version,
            {
              color: colors.textSecondary,
            },
          ]}
        >
          Versión {form.version}
        </Text>

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

          <View style={styles.questionList}>
            {form.questions.map((question) => (
              <AppCard key={question.number}>
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
                      {question.number}
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
                    </Text>

                    <Text
                      style={[
                        styles.questionType,
                        {
                          color: colors.textMuted,
                        },
                      ]}
                    >
                      {question.type}
                    </Text>
                  </View>
                </View>
              </AppCard>
            ))}
          </View>
        </View>

        <AppCard>
          <Text
            style={[
              styles.infoTitle,
              {
                color: colors.text,
              },
            ]}
          >
            Integración futura
          </Text>

          <Text
            style={[
              styles.infoText,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            Este formulario será gestionado por UNIESAP y posteriormente
            sincronizado con Kobo como motor de formularios.
          </Text>
        </AppCard>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
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

  version: {
    fontSize: FontSize.small,
    marginBottom: Spacing.xl,
  },

  section: {
    marginBottom: Spacing.xl,
  },

  sectionTitle: {
    fontSize: FontSize.cardTitle,
    fontWeight: "700",
    marginBottom: Spacing.md,
  },

  questionList: {
    gap: Spacing.sm,
  },

  questionRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  questionNumber: {
    width: 40,
    height: 40,
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
  },

  questionLabel: {
    fontSize: FontSize.body,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },

  questionType: {
    fontSize: FontSize.caption,
  },

  infoTitle: {
    fontSize: FontSize.body,
    fontWeight: "700",
    marginBottom: Spacing.sm,
  },

  infoText: {
    fontSize: FontSize.small,
    lineHeight: 20,
  },
});
