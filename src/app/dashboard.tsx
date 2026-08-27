import { useEffect, useState } from "react";

import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { router } from "expo-router";

import { AppCard } from "@/components/ui/AppCard";
import { ResponsiveContainer } from "@/components/ui/ResponsiveContainer";
import { ResponsiveGrid } from "@/components/ui/ResponsiveGrid";
import { Screen } from "@/components/ui/Screen";

import { FontSize, Radius, Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

import { getInspections } from "@/repositories/inspectionRepository";

import {
  getUserProfile,
  subscribeToUserProfile,
} from "@/repositories/userProfileRepository";

import type { Inspection } from "@/types/inspection";
import type { UserProfile } from "@/types/userProfile";

/*
 * ============================================================================
 * DASHBOARD
 * ============================================================================
 *
 * El Dashboard utiliza ahora datos reales del perfil
 * y del repositorio de inspecciones.
 *
 * Objetivos:
 *
 * - mostrar el nombre y fotografía del usuario;
 * - mostrar pendientes y errores reales;
 * - mantener accesos rápidos simples;
 * - conservar diseño responsive en celular, tablet y web.
 *
 * Empresas/inmuebles todavía conservan sus fuentes actuales.
 */

const ACTIVE_COMPANY_ID = "1";

export default function DashboardScreen() {
  const { colors } = useAppTheme();

  const [profile, setProfile] = useState<UserProfile>(getUserProfile());

  /*
   * Escucha cambios del perfil.
   *
   * Si el usuario cambia nombre o fotografía,
   * el Dashboard se actualiza sin reiniciar la app.
   */
  useEffect(() => {
    return subscribeToUserProfile(setProfile);
  }, []);

  /*
   * RootLayout hidrata InspectionRepository antes
   * de mostrar esta pantalla.
   *
   * Por eso esta lectura representa el estado local actual.
   */
  const inspections = getInspections();

  const summary = createInspectionSummary(inspections);

  const recentInspections = [...inspections]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  const fullName = `${profile.firstName} ${profile.lastName}`.trim();

  const firstName = profile.firstName.trim() || fullName || "Usuario";

  const initials = createInitials(profile.firstName, profile.lastName);

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
                Hola, {firstName} 👋
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
             * La fotografía del perfil funciona también
             * como acceso directo al módulo Perfil.
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
              {profile.photoUri ? (
                <Image
                  source={{
                    uri: profile.photoUri,
                  }}
                  style={styles.profileImage}
                />
              ) : (
                <Text
                  style={[
                    styles.profileInitial,
                    {
                      color: colors.primary,
                    },
                  ]}
                >
                  {initials}
                </Text>
              )}
            </Pressable>
          </View>

          {/* ============================================================ */}
          {/* RESUMEN REAL DE TRABAJO                                      */}
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
                Resumen
              </Text>

              <Pressable
                onPress={() => router.navigate("/trabajo")}
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
                  Ver trabajo
                </Text>
              </Pressable>
            </View>

            <ResponsiveGrid
              phoneColumns={2}
              tabletColumns={4}
              desktopColumns={4}
              gap={Spacing.md}
            >
              <StatCard
                value={String(summary.pending)}
                label="Pendientes"
                color={colors.warning}
              />

              <StatCard
                value={String(summary.inProgress)}
                label="En proceso"
                color={colors.primary}
              />

              <StatCard
                value={String(summary.completed)}
                label="Completadas"
                color={colors.success}
              />

              <StatCard
                value={String(summary.errors)}
                label="Con error"
                color={summary.errors > 0 ? colors.error : colors.text}
              />
            </ResponsiveGrid>
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
                      backgroundColor: "#F97316",
                    },
                  ]}
                />

                <View style={styles.companyContent}>
                  <View
                    style={[
                      styles.companyLogo,
                      {
                        backgroundColor: "#F9731620",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.companyLogoText,
                        {
                          color: "#F97316",
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
                      Acceso rápido a la empresa
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
                title="Continuar trabajo"
                onPress={() => router.navigate("/trabajo")}
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
              {recentInspections.length > 0 ? (
                recentInspections.map((inspection, index) => (
                  <View key={inspection.id}>
                    <RecentInspection inspection={inspection} />

                    {index < recentInspections.length - 1 ? (
                      <View
                        style={[
                          styles.divider,
                          {
                            backgroundColor: colors.divider,
                          },
                        ]}
                      />
                    ) : null}
                  </View>
                ))
              ) : (
                <Text
                  style={[
                    styles.emptyText,
                    {
                      color: colors.textSecondary,
                    },
                  ]}
                >
                  Todavía no hay actividad reciente.
                </Text>
              )}
            </AppCard>
          </View>
        </ResponsiveContainer>
      </ScrollView>
    </Screen>
  );
}

/*
 * Resume los estados principales del trabajo.
 *
 * Una inspección con error de sincronización
 * se contabiliza también como completada si su captura terminó,
 * pero se destaca por separado en "Con error".
 */
function createInspectionSummary(inspections: Inspection[]) {
  return {
    pending: inspections.filter((inspection) => inspection.status === "draft")
      .length,

    inProgress: inspections.filter(
      (inspection) => inspection.status === "in_progress",
    ).length,

    completed: inspections.filter(
      (inspection) => inspection.status === "completed",
    ).length,

    errors: inspections.filter(
      (inspection) => inspection.integration?.syncStatus === "error",
    ).length,
  };
}

/*
 * Tarjeta numérica del resumen.
 */
function StatCard({
  value,
  label,
  color,
}: {
  value: string;
  label: string;
  color: string;
}) {
  const { colors } = useAppTheme();

  return (
    <AppCard style={styles.statCard}>
      <Text
        style={[
          styles.statValue,
          {
            color,
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
 * Actividad reciente basada en una inspección real.
 */
function RecentInspection({ inspection }: { inspection: Inspection }) {
  const { colors } = useAppTheme();

  const status = getReadableInspectionStatus(inspection);

  return (
    <Pressable
      onPress={() =>
        router.navigate({
          pathname: "/empresas/[id]/inspecciones/[inspectionId]",

          params: {
            id: inspection.companyId,

            inspectionId: inspection.id,
          },
        })
      }
      style={({ pressed }) => [
        styles.activity,
        {
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.activityDot,
          {
            backgroundColor: status.color,
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
          {status.label}
        </Text>

        <Text
          style={[
            styles.activityDescription,
            {
              color: colors.textSecondary,
            },
          ]}
        >
          {formatDate(inspection.date)}
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
        ›
      </Text>
    </Pressable>
  );
}

/*
 * Traduce estados internos a etiquetas simples.
 */
function getReadableInspectionStatus(inspection: Inspection) {
  if (inspection.integration?.syncStatus === "error") {
    return {
      label: "Error de sincronización",

      color: "#EF4444",
    };
  }

  if (inspection.status === "completed") {
    return {
      label:
        inspection.integration?.syncStatus === "synced"
          ? "Inspección sincronizada"
          : "Inspección completada",

      color: "#22C55E",
    };
  }

  if (inspection.status === "in_progress") {
    return {
      label: "Inspección en proceso",

      color: "#3B82F6",
    };
  }

  return {
    label: "Inspección pendiente",

    color: "#F59E0B",
  };
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function createInitials(firstName: string, lastName: string): string {
  const first = firstName.trim().charAt(0);

  const last = lastName.trim().charAt(0);

  return `${first}${last}`.toUpperCase() || "U";
}

/*
 * ============================================================================
 * ESTILOS
 * ============================================================================
 *
 * ResponsiveGrid mantiene:
 *
 * celular → tarjetas compactas
 * tablet  → varias columnas
 * web     → uso controlado del espacio
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
    width: 52,
    height: 52,

    flexShrink: 0,

    borderRadius: Radius.full,

    alignItems: "center",
    justifyContent: "center",

    overflow: "hidden",
  },

  profileImage: {
    width: "100%",
    height: "100%",
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

    fontSize: FontSize.body,

    marginLeft: Spacing.sm,
  },

  divider: {
    height: 1,
  },

  emptyText: {
    fontSize: FontSize.small,
    lineHeight: 22,
  },
});
