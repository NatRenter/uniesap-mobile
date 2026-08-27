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

import { getCompanyById } from "@/data/companies";
import { getFormById } from "@/data/forms";
import { getPropertyById } from "@/data/properties";

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
 * Inicio vuelve a utilizar el concepto de "Empresa activa",
 * pero ya no está fija en AutoZone.
 *
 * La empresa activa se obtiene de la inspección pendiente o en proceso
 * con actividad más reciente.
 *
 * Si no existe ninguna inspección activa:
 *
 * - no se muestra una empresa ficticia;
 * - aparece un estado vacío;
 * - el usuario puede iniciar una nueva inspección.
 *
 * La pantalla sigue adaptándose a celular, tablet y web
 * mediante ResponsiveContainer y ResponsiveGrid.
 */

export default function DashboardScreen() {
  const { colors } = useAppTheme();

  const [profile, setProfile] = useState<UserProfile>(getUserProfile());

  /*
   * El Dashboard escucha cambios del perfil.
   *
   * Si el usuario cambia su nombre o fotografía,
   * Inicio se actualiza sin reiniciar la aplicación.
   */
  useEffect(() => {
    return subscribeToUserProfile(setProfile);
  }, []);

  /*
   * RootLayout hidrata InspectionRepository antes
   * de mostrar esta pantalla.
   */
  const inspections = getInspections();

  const summary = createInspectionSummary(inspections);

  /*
   * Empresa activa:
   *
   * solamente se consideran:
   * - draft
   * - in_progress
   *
   * Las inspecciones completed ya no mantienen
   * una empresa como activa aunque estén pendientes de sincronización.
   */
  const activeInspection = getActiveInspection(inspections);

  const activeCompany = activeInspection
    ? getCompanyById(activeInspection.companyId)
    : undefined;

  const activeProperty = activeInspection
    ? getPropertyById(activeInspection.propertyId)
    : undefined;

  const activeForm = activeInspection
    ? getFormById(activeInspection.formId)
    : undefined;

  /*
   * Cuenta cuántas inspecciones abiertas existen
   * dentro de la empresa activa.
   */
  const activeCompanyInspectionCount = activeInspection
    ? inspections.filter(
        (inspection) =>
          inspection.companyId === activeInspection.companyId &&
          isActiveInspection(inspection),
      ).length
    : 0;

  /*
   * Indica si también existen inspecciones abiertas
   * en otras empresas.
   */
  const activeInspectionsOtherCompanies = activeInspection
    ? inspections.filter(
        (inspection) =>
          inspection.companyId !== activeInspection.companyId &&
          isActiveInspection(inspection),
      ).length
    : 0;

  const recentInspections = [...inspections]
    .sort(compareInspectionActivity)
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
             * La fotografía también funciona
             * como acceso directo a Perfil.
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
          {/* RESUMEN                                                      */}
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
                color={summary.errors > 0 ? colors.error : colors.textMuted}
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

            {activeInspection && activeCompany && activeProperty ? (
              <ActiveCompanyCard
                inspection={activeInspection}
                companyName={activeCompany.name}
                companyColor={activeCompany.branding.primaryColor}
                propertyName={activeProperty.name}
                formTitle={activeForm?.title ?? "Inspección"}
                activeInspectionCount={activeCompanyInspectionCount}
                otherCompanyActiveCount={activeInspectionsOtherCompanies}
              />
            ) : (
              <NoActiveInspectionCard />
            )}
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
                onPress={() => router.navigate("/empresas")}
              />

              <QuickAction
                icon="▤"
                title="Ver trabajo"
                onPress={() => router.navigate("/trabajo")}
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
 * ============================================================================
 * EMPRESA ACTIVA
 * ============================================================================
 *
 * Muestra solamente el contexto de trabajo actual.
 *
 * El botón principal continúa exactamente
 * la inspección activa seleccionada.
 */
function ActiveCompanyCard({
  inspection,
  companyName,
  companyColor,
  propertyName,
  formTitle,
  activeInspectionCount,
  otherCompanyActiveCount,
}: {
  inspection: Inspection;

  companyName: string;
  companyColor: string;

  propertyName: string;
  formTitle: string;

  activeInspectionCount: number;
  otherCompanyActiveCount: number;
}) {
  const { colors } = useAppTheme();

  const statusLabel =
    inspection.status === "in_progress" ? "En proceso" : "Pendiente";

  const statusColor =
    inspection.status === "in_progress" ? colors.primary : colors.warning;

  return (
    <AppCard padded={false} style={styles.activeCompanyCard}>
      <View
        style={[
          styles.companyAccent,
          {
            backgroundColor: companyColor,
          },
        ]}
      />

      <View style={styles.activeCompanyContent}>
        {/* EMPRESA */}

        <View style={styles.activeCompanyHeader}>
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
              {createCompanyInitials(companyName)}
            </Text>
          </View>

          <View style={styles.activeCompanyIdentity}>
            <Text
              style={[
                styles.companyName,
                {
                  color: colors.text,
                },
              ]}
            >
              {companyName}
            </Text>

            <Text
              style={[
                styles.companyActivity,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              {activeInspectionCount} inspección
              {activeInspectionCount === 1 ? "" : "es"} activa
              {activeInspectionCount === 1 ? "" : "s"}
            </Text>
          </View>
        </View>

        {/* INSPECCIÓN ACTUAL */}

        <View
          style={[
            styles.currentWork,
            {
              backgroundColor: colors.background,
            },
          ]}
        >
          <Text
            style={[
              styles.currentProperty,
              {
                color: colors.text,
              },
            ]}
          >
            {propertyName}
          </Text>

          <Text
            style={[
              styles.currentForm,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            {formTitle}
          </Text>

          <View style={styles.currentStatusRow}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: statusColor,
                },
              ]}
            />

            <Text
              style={[
                styles.currentStatus,
                {
                  color: statusColor,
                },
              ]}
            >
              {statusLabel}
            </Text>

            <Text
              style={[
                styles.currentDate,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              · {formatDate(inspection.date)}
            </Text>
          </View>
        </View>

        {/* ACCIÓN PRINCIPAL */}

        <Pressable
          onPress={() => continueInspection(inspection)}
          style={({ pressed }) => [
            styles.continueButton,
            {
              backgroundColor: colors.primary,

              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Text style={styles.continueButtonText}>Continuar inspección</Text>
        </Pressable>

        {/* OTRAS EMPRESAS */}

        {otherCompanyActiveCount > 0 ? (
          <Pressable
            onPress={() => router.navigate("/trabajo")}
            style={({ pressed }) => ({
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text
              style={[
                styles.otherWorkText,
                {
                  color: colors.primary,
                },
              ]}
            >
              También tienes {otherCompanyActiveCount} inspección
              {otherCompanyActiveCount === 1 ? "" : "es"} activa
              {otherCompanyActiveCount === 1 ? "" : "s"} en otra
              {otherCompanyActiveCount === 1 ? " empresa" : "s empresas"}.
            </Text>
          </Pressable>
        ) : null}
      </View>
    </AppCard>
  );
}

/*
 * ============================================================================
 * SIN INSPECCIÓN ACTIVA
 * ============================================================================
 *
 * Se muestra cuando ya no existen inspecciones
 * draft ni in_progress.
 */
function NoActiveInspectionCard() {
  const { colors } = useAppTheme();

  return (
    <AppCard>
      <View style={styles.noActiveContent}>
        <View
          style={[
            styles.noActiveIcon,
            {
              backgroundColor: colors.primarySoft,
            },
          ]}
        >
          <Text
            style={[
              styles.noActiveIconText,
              {
                color: colors.primary,
              },
            ]}
          >
            ✓
          </Text>
        </View>

        <Text
          style={[
            styles.noActiveTitle,
            {
              color: colors.text,
            },
          ]}
        >
          No hay inspecciones activas
        </Text>

        <Text
          style={[
            styles.noActiveDescription,
            {
              color: colors.textSecondary,
            },
          ]}
        >
          Cuando inicies una nueva inspección, la empresa y el inmueble
          aparecerán aquí.
        </Text>

        <Pressable
          onPress={() => router.navigate("/empresas")}
          style={({ pressed }) => [
            styles.startInspectionButton,
            {
              borderColor: colors.primary,

              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Text
            style={[
              styles.startInspectionText,
              {
                color: colors.primary,
              },
            ]}
          >
            Iniciar inspección
          </Text>
        </Pressable>
      </View>
    </AppCard>
  );
}

/*
 * Calcula el resumen visible del Dashboard.
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
 * Determina si una inspección todavía representa
 * trabajo de campo activo.
 */
function isActiveInspection(inspection: Inspection): boolean {
  return inspection.status === "draft" || inspection.status === "in_progress";
}

/*
 * Obtiene la inspección activa más reciente.
 *
 * Actualmente Inspection dispone de date como referencia temporal.
 * Cuando añadamos updatedAt, podremos utilizar esa marca
 * para reflejar aún mejor la actividad más reciente.
 */
function getActiveInspection(
  inspections: Inspection[],
): Inspection | undefined {
  return [...inspections]
    .filter(isActiveInspection)
    .sort(compareInspectionActivity)[0];
}

/*
 * Orden descendente:
 * inspección más reciente primero.
 */
function compareInspectionActivity(a: Inspection, b: Inspection): number {
  return getInspectionTimestamp(b) - getInspectionTimestamp(a);
}

function getInspectionTimestamp(inspection: Inspection): number {
  const timestamp = new Date(inspection.date).getTime();

  return Number.isNaN(timestamp) ? 0 : timestamp;
}

/*
 * Continúa exactamente la inspección activa.
 */
function continueInspection(inspection: Inspection): void {
  router.navigate({
    pathname: "/empresas/[id]/inmuebles/[propertyId]/captura",

    params: {
      id: inspection.companyId,

      propertyId: inspection.propertyId,

      formId: inspection.formId,

      inspectionId: inspection.id,
    },
  });
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
 * Actividad reciente basada en inspecciones reales.
 */
function RecentInspection({ inspection }: { inspection: Inspection }) {
  const { colors } = useAppTheme();

  const status = getReadableInspectionStatus(inspection);

  const property = getPropertyById(inspection.propertyId);

  return (
    <Pressable
      onPress={() => {
        /*
         * Una inspección abierta vuelve a Captura.
         * Una completada abre su detalle.
         */
        if (isActiveInspection(inspection)) {
          continueInspection(inspection);

          return;
        }

        router.navigate({
          pathname: "/empresas/[id]/inspecciones/[inspectionId]",

          params: {
            id: inspection.companyId,

            inspectionId: inspection.id,
          },
        });
      }}
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
          {property?.name ?? "Inmueble"} · {formatDate(inspection.date)}
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
 * Traduce estados técnicos a etiquetas simples.
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

function createCompanyInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "EM";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

/*
 * ============================================================================
 * ESTILOS
 * ============================================================================
 *
 * La tarjeta de Empresa activa usa flexWrap para que:
 *
 * celular → el contenido se apile cuando sea necesario.
 * tablet  → aproveche mejor el ancho.
 * web     → mantenga un ancho controlado por ResponsiveContainer.
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

  activeCompanyCard: {
    width: "100%",

    overflow: "hidden",
  },

  companyAccent: {
    height: 5,
  },

  activeCompanyContent: {
    padding: Spacing.lg,
  },

  activeCompanyHeader: {
    flexDirection: "row",
    alignItems: "center",

    marginBottom: Spacing.md,
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

  activeCompanyIdentity: {
    flex: 1,
    minWidth: 0,
  },

  companyName: {
    fontSize: FontSize.cardTitle,
    fontWeight: "700",

    marginBottom: Spacing.xs,
  },

  companyActivity: {
    fontSize: FontSize.small,
  },

  currentWork: {
    borderRadius: Radius.md,

    padding: Spacing.md,

    marginBottom: Spacing.md,
  },

  currentProperty: {
    fontSize: FontSize.body,
    fontWeight: "700",

    marginBottom: Spacing.xs,
  },

  currentForm: {
    fontSize: FontSize.small,

    marginBottom: Spacing.sm,
  },

  currentStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",

    gap: 4,
  },

  statusDot: {
    width: 8,
    height: 8,

    borderRadius: Radius.full,
  },

  currentStatus: {
    fontSize: FontSize.caption,
    fontWeight: "700",
  },

  currentDate: {
    fontSize: FontSize.caption,
  },

  continueButton: {
    minHeight: 48,

    alignItems: "center",
    justifyContent: "center",

    borderRadius: Radius.md,

    paddingHorizontal: Spacing.md,

    marginBottom: Spacing.sm,
  },

  continueButtonText: {
    color: "#FFFFFF",

    fontSize: FontSize.body,
    fontWeight: "700",
  },

  otherWorkText: {
    fontSize: FontSize.caption,
    fontWeight: "600",

    lineHeight: 19,

    textAlign: "center",

    marginTop: Spacing.xs,
  },

  noActiveContent: {
    alignItems: "center",

    paddingVertical: Spacing.lg,
  },

  noActiveIcon: {
    width: 52,
    height: 52,

    borderRadius: Radius.full,

    alignItems: "center",
    justifyContent: "center",

    marginBottom: Spacing.md,
  },

  noActiveIconText: {
    fontSize: FontSize.h3,
    fontWeight: "800",
  },

  noActiveTitle: {
    fontSize: FontSize.cardTitle,
    fontWeight: "700",

    textAlign: "center",

    marginBottom: Spacing.sm,
  },

  noActiveDescription: {
    maxWidth: 520,

    fontSize: FontSize.small,
    lineHeight: 21,

    textAlign: "center",

    marginBottom: Spacing.lg,
  },

  startInspectionButton: {
    minHeight: 46,

    alignItems: "center",
    justifyContent: "center",

    borderWidth: 1,
    borderRadius: Radius.md,

    paddingHorizontal: Spacing.lg,
  },

  startInspectionText: {
    fontSize: FontSize.small,
    fontWeight: "700",
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
