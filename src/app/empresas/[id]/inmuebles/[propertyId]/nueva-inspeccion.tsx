import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { router, useLocalSearchParams } from "expo-router";

import { AppCard } from "@/components/ui/AppCard";
import { ResponsiveContainer } from "@/components/ui/ResponsiveContainer";
import { ResponsiveGrid } from "@/components/ui/ResponsiveGrid";
import { Screen } from "@/components/ui/Screen";

import { getCompanyById } from "@/data/companies";
import { getFormsByIds } from "@/data/forms";
import { getPropertyById } from "@/data/properties";

import { FontSize, Radius, Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

export default function NewInspectionScreen() {
  const { colors } = useAppTheme();

  /*
   * Para iniciar una inspección necesitamos conocer:
   *
   * - empresa
   * - inmueble
   *
   * El formulario se seleccionará dentro de esta pantalla.
   */
  const { id, propertyId } = useLocalSearchParams<{
    id: string;
    propertyId: string;
  }>();

  const company = getCompanyById(id);

  const property = getPropertyById(propertyId);

  /*
   * Estado controlado en caso de recibir
   * parámetros incorrectos desde la navegación.
   */
  if (!company || !property) {
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
            Inmueble no encontrado
          </Text>

          <Text
            style={[
              styles.notFoundDescription,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            No fue posible preparar una nueva inspección.
          </Text>
        </View>
      </Screen>
    );
  }

  /*
   * Cada inmueble tiene los IDs de los
   * formularios que puede utilizar.
   */
  const propertyForms = getFormsByIds(property.formIds);

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ResponsiveContainer>
          {/* ---------------------------------------------------------------------- */}
          {/* NAVEGACIÓN CONTEXTUAL                                                   */}
          {/* ---------------------------------------------------------------------- */}
          {/*
           * Regresa explícitamente al inmueble actual.
           *
           * No utilizamos router.back() porque queremos que la navegación
           * sea predecible aunque el usuario haya llegado a esta pantalla
           * desde otro punto de la aplicación.
           */}
          <Pressable
            onPress={() =>
              router.navigate({
                pathname: "/empresas/[id]/inmuebles/[propertyId]",

                params: {
                  id,
                  propertyId,
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
              numberOfLines={1}
            >
              ‹ {property.name}
            </Text>
          </Pressable>

          {/* EMPRESA */}

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

          {/* ENCABEZADO */}

          <Text
            style={[
              styles.title,
              {
                color: colors.text,
              },
            ]}
          >
            Nueva inspección
          </Text>

          <Text
            style={[
              styles.subtitle,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            Selecciona el formulario que deseas utilizar para iniciar la
            captura.
          </Text>

          {/* CONTEXTO */}

          <AppCard style={styles.contextCard}>
            <Text
              style={[
                styles.contextLabel,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              Inmueble
            </Text>

            <Text
              style={[
                styles.contextTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              {property.name}
            </Text>

            <Text
              style={[
                styles.contextDescription,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              {property.city}, {property.state}
            </Text>
          </AppCard>

          {/* FORMULARIOS */}

          <Text
            style={[
              styles.sectionTitle,
              {
                color: colors.text,
              },
            ]}
          >
            Formularios disponibles
          </Text>

          <ResponsiveGrid
            phoneColumns={1}
            tabletColumns={2}
            desktopColumns={3}
            gap={Spacing.md}
          >
            {propertyForms.map((form) => (
              <Pressable
                key={form.id}
                disabled={form.status !== "active"}
                onPress={() =>
                  router.navigate({
                    pathname: "/empresas/[id]/inmuebles/[propertyId]/captura",

                    /*
                     * Captura recibe los tres IDs
                     * necesarios para construir la inspección.
                     */
                    params: {
                      id,
                      propertyId,
                      formId: form.id,
                    },
                  })
                }
                style={({ pressed }) => ({
                  opacity: form.status !== "active" ? 0.45 : pressed ? 0.7 : 1,
                })}
              >
                <AppCard style={styles.formCard}>
                  <View style={styles.formHeader}>
                    <View
                      style={[
                        styles.formIcon,
                        {
                          backgroundColor: colors.primarySoft,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.formIconText,
                          {
                            color: colors.primary,
                          },
                        ]}
                      >
                        ≡
                      </Text>
                    </View>

                    <View style={styles.formInformation}>
                      <Text
                        style={[
                          styles.formTitle,
                          {
                            color: colors.text,
                          },
                        ]}
                        numberOfLines={2}
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
                        numberOfLines={3}
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

                  <View style={styles.formMeta}>
                    <Text
                      style={[
                        styles.metaText,
                        {
                          color: colors.textMuted,
                        },
                      ]}
                    >
                      v{form.version}
                    </Text>

                    <Text
                      style={[
                        styles.status,
                        {
                          color:
                            form.status === "active"
                              ? colors.success
                              : colors.textMuted,
                        },
                      ]}
                    >
                      ● {form.status === "active" ? "Disponible" : "Inactivo"}
                    </Text>
                  </View>
                </AppCard>
              </Pressable>
            ))}
          </ResponsiveGrid>

          {/* SIN FORMULARIOS */}

          {propertyForms.length === 0 && (
            <AppCard style={styles.emptyCard}>
              <Text
                style={[
                  styles.emptyTitle,
                  {
                    color: colors.text,
                  },
                ]}
              >
                Sin formularios disponibles
              </Text>

              <Text
                style={[
                  styles.emptyDescription,
                  {
                    color: colors.textSecondary,
                  },
                ]}
              >
                Este inmueble todavía no tiene formularios asignados.
              </Text>
            </AppCard>
          )}
        </ResponsiveContainer>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: Spacing.xxxl,
  },

  backText: {
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
    maxWidth: 760,

    fontSize: FontSize.body,

    lineHeight: 24,

    marginBottom: Spacing.xl,
  },

  contextCard: {
    marginBottom: Spacing.xl,
  },

  contextLabel: {
    fontSize: FontSize.caption,

    marginBottom: Spacing.xs,
  },

  contextTitle: {
    fontSize: FontSize.cardTitle,

    fontWeight: "700",

    marginBottom: Spacing.xs,
  },

  contextDescription: {
    fontSize: FontSize.small,
  },

  sectionTitle: {
    fontSize: FontSize.cardTitle,

    fontWeight: "700",

    marginBottom: Spacing.md,
  },

  formCard: {
    width: "100%",

    minHeight: 190,
  },

  formHeader: {
    flexDirection: "row",

    alignItems: "flex-start",
  },

  formIcon: {
    width: 48,

    height: 48,

    flexShrink: 0,

    borderRadius: Radius.md,

    alignItems: "center",

    justifyContent: "center",

    marginRight: Spacing.md,
  },

  formIconText: {
    fontSize: FontSize.h3,

    fontWeight: "600",
  },

  formInformation: {
    flex: 1,

    minWidth: 0,
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
    flexShrink: 0,

    fontSize: 28,

    marginLeft: Spacing.sm,
  },

  divider: {
    height: 1,

    marginVertical: Spacing.md,
  },

  formMeta: {
    flexDirection: "row",

    justifyContent: "space-between",

    alignItems: "center",

    gap: Spacing.md,
  },

  metaText: {
    fontSize: FontSize.caption,
  },

  status: {
    fontSize: FontSize.caption,

    fontWeight: "600",
  },

  emptyCard: {
    marginTop: Spacing.sm,
  },

  emptyTitle: {
    fontSize: FontSize.body,

    fontWeight: "700",

    marginBottom: Spacing.sm,
  },

  emptyDescription: {
    fontSize: FontSize.small,

    lineHeight: 20,
  },

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
