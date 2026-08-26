import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { router } from "expo-router";

import { AppCard } from "@/components/ui/AppCard";
import { ResponsiveContainer } from "@/components/ui/ResponsiveContainer";
import { ResponsiveGrid } from "@/components/ui/ResponsiveGrid";
import { Screen } from "@/components/ui/Screen";

import { FontSize, Radius, Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

/*
 * ============================================================================
 * DASHBOARD
 * ============================================================================
 *
 * Esta es la pantalla Inicio de la navegación global.
 *
 * En esta fase:
 *
 * - conectamos el botón de perfil;
 * - quitamos herramientas técnicas del Dashboard;
 * - mantenemos la estructura responsive actual;
 * - dejamos el rediseño avanzado del resumen para la siguiente fase.
 */

const ACTIVE_COMPANY_ID = "1";

export default function DashboardScreen() {
  const { colors } = useAppTheme();

  const companyColor = "#F97316";

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ResponsiveContainer>
          {/* ============================================================ */}
          {/* HEADER                                                       */}
          {/* ============================================================ */}

          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text
                style={[
                  styles.brand,
                  {
                    color: colors.primary,
                  },
                ]}
              >
                UNIESAP
              </Text>

              <Text
                style={[
                  styles.title,
                  {
                    color: colors.text,
                  },
                ]}
              >
                Hola 👋
              </Text>

              <Text
                style={[
                  styles.subtitle,
                  {
                    color: colors.textSecondary,
                  },
                ]}
              >
                Este es el resumen de tu actividad.
              </Text>
            </View>

            {/*
             * El acceso del encabezado ahora abre el Perfil real.
             */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Abrir perfil"
              onPress={() => router.navigate("/perfil")}
              style={({ pressed }) => [
                styles.profileButton,
                {
                  backgroundColor: colors.primarySoft,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.profileInitial,
                  {
                    color: colors.primary,
                  },
                ]}
              >
                A
              </Text>
            </Pressable>
          </View>

          {/* ============================================================ */}
          {/* EMPRESA ACTIVA                                               */}
          {/* ============================================================ */}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text
                style={[
                  styles.sectionTitle,
                  {
                    color: colors.text,
                  },
                ]}
              >
                Empresa activa
              </Text>

              <Pressable
                onPress={() => router.navigate("/empresas")}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text
                  style={[
                    styles.link,
                    {
                      color: colors.primary,
                    },
                  ]}
                >
                  Cambiar
                </Text>
              </Pressable>
            </View>

            <Pressable
              onPress={() =>
                router.navigate({
                  pathname: "/empresas/[id]",
                  params: {
                    id: ACTIVE_COMPANY_ID,
                  },
                })
              }
              style={({ pressed }) => ({
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <AppCard padded={false} style={styles.companyCard}>
                <View
                  style={[
                    styles.companyAccent,
                    {
                      backgroundColor: companyColor,
                    },
                  ]}
                />

                <View style={styles.companyContent}>
                  <View
                    style={[
                      styles.companyLogo,
                      {
                        backgroundColor: `${companyColor}20`,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.companyLogoText,
                        {
                          color: companyColor,
                        },
                      ]}
                    >
                      AZ
                    </Text>
                  </View>

                  <View style={styles.companyInformation}>
                    <Text
                      style={[
                        styles.companyName,
                        {
                          color: colors.text,
                        },
                      ]}
                    >
                      AutoZone
                    </Text>

                    <Text
                      style={[
                        styles.companyLocation,
                        {
                          color: colors.textSecondary,
                        },
                      ]}
                    >
                      3 inmuebles registrados
                    </Text>

                    <Text
                      style={[
                        styles.companyActivity,
                        {
                          color: colors.textMuted,
                        },
                      ]}
                    >
                      Última actividad · hace 2 días
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
              </AppCard>
            </Pressable>
          </View>

          {/* ============================================================ */}
          {/* RESUMEN                                                      */}
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
              Resumen
            </Text>

            <ResponsiveGrid
              phoneColumns={2}
              tabletColumns={4}
              desktopColumns={4}
              gap={Spacing.md}
            >
              <StatCard value="12" label="Empresas" />

              <StatCard value="28" label="Inmuebles" />

              <StatCard value="46" label="Inspecciones" />

              <StatCard value="5" label="Pendientes" highlighted />
            </ResponsiveGrid>
          </View>

          {/* ============================================================ */}
          {/* ACCIONES RÁPIDAS                                             */}
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
              Acciones rápidas
            </Text>

            <ResponsiveGrid
              phoneColumns={1}
              tabletColumns={2}
              desktopColumns={3}
              gap={Spacing.md}
            >
              <QuickAction
                icon="+"
                title="Nueva empresa"
                onPress={() => router.navigate("/empresas/nueva")}
              />

              <QuickAction
                icon="✓"
                title="Nueva inspección"
                onPress={() =>
                  router.navigate({
                    pathname: "/empresas/[id]/inmuebles",
                    params: {
                      id: ACTIVE_COMPANY_ID,
                    },
                  })
                }
              />

              <QuickAction
                icon="▤"
                title="Ver reportes"
                onPress={() =>
                  router.navigate({
                    pathname: "/empresas/[id]/reportes",
                    params: {
                      id: ACTIVE_COMPANY_ID,
                    },
                  })
                }
              />
            </ResponsiveGrid>
          </View>

          {/* ============================================================ */}
          {/* ACTIVIDAD RECIENTE                                           */}
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
              Actividad reciente
            </Text>

            <AppCard>
              <ActivityItem
                company="AutoZone"
                action="Inspección actualizada"
                time="Hace 2 horas"
                accentColor="#F97316"
              />

              <View
                style={[
                  styles.divider,
                  {
                    backgroundColor: colors.divider,
                  },
                ]}
              />

              <ActivityItem
                company="LALA"
                action="Reporte generado"
                time="Ayer"
                accentColor="#EF4444"
              />

              <View
                style={[
                  styles.divider,
                  {
                    backgroundColor: colors.divider,
                  },
                ]}
              />

              <ActivityItem
                company="Empresa Demo"
                action="Empresa registrada"
                time="Hace 3 días"
                accentColor="#3B82F6"
              />
            </AppCard>
          </View>
        </ResponsiveContainer>
      </ScrollView>
    </Screen>
  );
}

/*
 * Tarjeta pequeña del resumen.
 */
function StatCard({
  value,
  label,
  highlighted = false,
}: {
  value: string;
  label: string;
  highlighted?: boolean;
}) {
  const { colors } = useAppTheme();

  return (
    <AppCard style={styles.statCard}>
      <Text
        style={[
          styles.statValue,
          {
            color: highlighted ? colors.warning : colors.text,
          },
        ]}
      >
        {value}
      </Text>

      <Text
        style={[
          styles.statLabel,
          {
            color: colors.textSecondary,
          },
        ]}
      >
        {label}
      </Text>
    </AppCard>
  );
}

/*
 * Acción rápida reutilizable.
 *
 * Los botones ejecutan acciones reales; ya no se utilizan como
 * sustitutos del botón Atrás.
 */
function QuickAction({
  icon,
  title,
  onPress,
}: {
  icon: string;
  title: string;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.actionIcon,
          {
            backgroundColor: colors.primarySoft,
          },
        ]}
      >
        <Text
          style={[
            styles.actionIconText,
            {
              color: colors.primary,
            },
          ]}
        >
          {icon}
        </Text>
      </View>

      <Text
        style={[
          styles.actionTitle,
          {
            color: colors.text,
          },
        ]}
      >
        {title}
      </Text>

      <Text
        style={[
          styles.actionArrow,
          {
            color: colors.textMuted,
          },
        ]}
      >
        ›
      </Text>
    </Pressable>
  );
}

/*
 * Fila visual del historial reciente.
 */
function ActivityItem({
  company,
  action,
  time,
  accentColor,
}: {
  company: string;
  action: string;
  time: string;
  accentColor: string;
}) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.activity}>
      <View
        style={[
          styles.activityDot,
          {
            backgroundColor: accentColor,
          },
        ]}
      />

      <View style={styles.activityContent}>
        <Text
          style={[
            styles.activityCompany,
            {
              color: colors.text,
            },
          ]}
        >
          {company}
        </Text>

        <Text
          style={[
            styles.activityDescription,
            {
              color: colors.textSecondary,
            },
          ]}
        >
          {action}
        </Text>
      </View>

      <Text
        style={[
          styles.activityTime,
          {
            color: colors.textMuted,
          },
        ]}
      >
        {time}
      </Text>
    </View>
  );
}

/*
 * ============================================================================
 * ESTILOS
 * ============================================================================
 *
 * ResponsiveContainer y ResponsiveGrid conservan los ajustes ya existentes
 * para celular, tablet y escritorio.
 */
const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: Spacing.xxxl,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",

    marginBottom: Spacing.xl,
  },

  headerText: {
    flex: 1,
    minWidth: 0,

    marginRight: Spacing.md,
  },

  brand: {
    fontSize: FontSize.caption,
    fontWeight: "700",
    letterSpacing: 1,

    marginBottom: Spacing.sm,
  },

  title: {
    fontSize: FontSize.h1,
    fontWeight: "700",

    marginBottom: Spacing.xs,
  },

  subtitle: {
    fontSize: FontSize.small,
  },

  profileButton: {
    width: 48,
    height: 48,

    flexShrink: 0,

    borderRadius: Radius.full,

    alignItems: "center",
    justifyContent: "center",
  },

  profileInitial: {
    fontSize: FontSize.cardTitle,
    fontWeight: "700",
  },

  section: {
    marginBottom: Spacing.xl,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    gap: Spacing.md,

    marginBottom: Spacing.md,
  },

  sectionTitle: {
    fontSize: FontSize.cardTitle,
    fontWeight: "700",

    marginBottom: Spacing.md,
  },

  link: {
    fontSize: FontSize.small,
    fontWeight: "600",

    marginBottom: Spacing.md,
  },

  companyCard: {
    overflow: "hidden",
  },

  companyAccent: {
    height: 5,
  },

  companyContent: {
    flexDirection: "row",
    alignItems: "center",

    padding: Spacing.md,
  },

  companyLogo: {
    width: 52,
    height: 52,

    flexShrink: 0,

    borderRadius: Radius.md,

    alignItems: "center",
    justifyContent: "center",

    marginRight: Spacing.md,
  },

  companyLogoText: {
    fontSize: FontSize.body,
    fontWeight: "700",
  },

  companyInformation: {
    flex: 1,
    minWidth: 0,
  },

  companyName: {
    fontSize: FontSize.cardTitle,
    fontWeight: "700",

    marginBottom: Spacing.xs,
  },

  companyLocation: {
    fontSize: FontSize.small,

    marginBottom: Spacing.xs,
  },

  companyActivity: {
    fontSize: FontSize.caption,
  },

  arrow: {
    flexShrink: 0,

    fontSize: 32,

    marginLeft: Spacing.sm,
  },

  statCard: {
    width: "100%",
  },

  statValue: {
    fontSize: FontSize.h2,
    fontWeight: "700",

    marginBottom: Spacing.sm,
  },

  statLabel: {
    fontSize: FontSize.small,
  },

  actionCard: {
    width: "100%",
    minHeight: 72,

    flexDirection: "row",
    alignItems: "center",

    padding: Spacing.md,

    borderWidth: 1,
    borderRadius: Radius.lg,
  },

  actionIcon: {
    width: 40,
    height: 40,

    flexShrink: 0,

    borderRadius: Radius.md,

    alignItems: "center",
    justifyContent: "center",

    marginRight: Spacing.md,
  },

  actionIconText: {
    fontSize: FontSize.h3,
    fontWeight: "600",
  },

  actionTitle: {
    flex: 1,
    minWidth: 0,

    fontSize: FontSize.body,
    fontWeight: "600",
  },

  actionArrow: {
    flexShrink: 0,

    fontSize: 26,

    marginLeft: Spacing.sm,
  },

  activity: {
    minHeight: 64,

    flexDirection: "row",
    alignItems: "center",
  },

  activityDot: {
    width: 10,
    height: 10,

    flexShrink: 0,

    borderRadius: Radius.full,

    marginRight: Spacing.md,
  },

  activityContent: {
    flex: 1,
    minWidth: 0,
  },

  activityCompany: {
    fontSize: FontSize.small,
    fontWeight: "600",

    marginBottom: 2,
  },

  activityDescription: {
    fontSize: FontSize.caption,
  },

  activityTime: {
    flexShrink: 0,

    fontSize: FontSize.caption,

    marginLeft: Spacing.sm,
  },

  divider: {
    height: 1,
  },
});
