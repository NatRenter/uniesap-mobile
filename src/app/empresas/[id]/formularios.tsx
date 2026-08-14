import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { router, useLocalSearchParams } from "expo-router";

import { AppCard } from "@/components/ui/AppCard";
import { Screen } from "@/components/ui/Screen";

import { FontSize, Radius, Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

const forms = [
  {
    id: "form-1",
    title: "Análisis de riesgos",
    description: "Evaluación general de condiciones y agentes de riesgo.",
    version: "v1.0",
    properties: 3,
    status: "Activo",
  },
  {
    id: "form-2",
    title: "Inspección de extintores",
    description: "Revisión visual y funcional de equipos contra incendio.",
    version: "v1.2",
    properties: 2,
    status: "Activo",
  },
  {
    id: "form-3",
    title: "Señalización",
    description: "Evaluación de rutas, avisos y señalización preventiva.",
    version: "v1.0",
    properties: 1,
    status: "Activo",
  },
];

export default function CompanyFormsScreen() {
  const { colors } = useAppTheme();

  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={() =>
            router.navigate({
              pathname: "/empresas/[id]",
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
            ‹ Empresa
          </Text>
        </Pressable>

        <Text
          style={[
            styles.title,
            {
              color: colors.text,
            },
          ]}
        >
          Formularios
        </Text>

        <Text
          style={[
            styles.subtitle,
            {
              color: colors.textSecondary,
            },
          ]}
        >
          Formularios disponibles y asignados a los inmuebles de esta empresa.
        </Text>

        <View style={styles.list}>
          {forms.map((form) => (
            <Pressable
              key={form.id}
              onPress={() =>
                router.navigate({
                  pathname: "/empresas/[id]/formularios/[formId]",
                  params: {
                    id,
                    formId: form.id,
                  },
                })
              }
            >
              <AppCard>
                <View style={styles.cardHeader}>
                  <View
                    style={[
                      styles.icon,
                      {
                        backgroundColor: colors.primarySoft,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.iconText,
                        {
                          color: colors.primary,
                        },
                      ]}
                    >
                      ≡
                    </Text>
                  </View>

                  <View style={styles.formInfo}>
                    <Text
                      style={[
                        styles.formTitle,
                        {
                          color: colors.text,
                        },
                      ]}
                    >
                      {form.title}
                    </Text>

                    <Text
                      style={[
                        styles.formDescription,
                        {
                          color: colors.textSecondary,
                        },
                      ]}
                    >
                      {form.description}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.arrow,
                      {
                        color: colors.textMuted,
                      },
                    ]}
                  >
                    ›
                  </Text>
                </View>

                <View
                  style={[
                    styles.divider,
                    {
                      backgroundColor: colors.divider,
                    },
                  ]}
                />

                <View style={styles.meta}>
                  <Text
                    style={[
                      styles.metaText,
                      {
                        color: colors.textMuted,
                      },
                    ]}
                  >
                    {form.version}
                  </Text>

                  <Text
                    style={[
                      styles.metaText,
                      {
                        color: colors.textMuted,
                      },
                    ]}
                  >
                    {form.properties} inmuebles
                  </Text>

                  <Text
                    style={[
                      styles.status,
                      {
                        color: colors.success,
                      },
                    ]}
                  >
                    ● {form.status}
                  </Text>
                </View>
              </AppCard>
            </Pressable>
          ))}
        </View>
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
    marginBottom: Spacing.lg,
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

  list: {
    gap: Spacing.md,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  icon: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },

  iconText: {
    fontSize: FontSize.h3,
    fontWeight: "600",
  },

  formInfo: {
    flex: 1,
  },

  formTitle: {
    fontSize: FontSize.body,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },

  formDescription: {
    fontSize: FontSize.caption,
    lineHeight: 18,
  },

  arrow: {
    fontSize: 28,
    marginLeft: Spacing.sm,
  },

  divider: {
    height: 1,
    marginVertical: Spacing.md,
  },

  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },

  metaText: {
    fontSize: FontSize.caption,
  },

  status: {
    fontSize: FontSize.caption,
    fontWeight: "600",
    marginLeft: "auto",
  },
});
