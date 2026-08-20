import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { router } from "expo-router";

import { AppCard } from "@/components/ui/AppCard";
import { ResponsiveContainer } from "@/components/ui/ResponsiveContainer";
import { ResponsiveGrid } from "@/components/ui/ResponsiveGrid";
import { Screen } from "@/components/ui/Screen";

import { FontSize, Radius, Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

/*
 * --------------------------------------------------------------------------
 * EMPRESA ACTIVA TEMPORAL
 * --------------------------------------------------------------------------
 *
 * Por ahora el Dashboard trabaja con AutoZone como empresa activa.
 *
 * Centralizamos aquí el ID para evitar repetir "1" en cada navegación.
 *
 * Más adelante este valor será sustituido por algo similar a:
 *
 * const { activeCompany } = useActiveCompany();
 *
 * y entonces todas las rutas utilizarán:
 *
 * activeCompany.id
 */
const ACTIVE_COMPANY_ID = "1";

export default function DashboardScreen() {
  const { colors } = useAppTheme();

  /*
   * Color representativo temporal de AutoZone.
   *
   * Más adelante deberá provenir directamente de:
   *
   * activeCompany.branding.primaryColor
   */
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
             * El perfil todavía no tiene una pantalla asociada.
             *
             * No agregamos navegación falsa por ahora.
             * Cuando exista /perfil podremos conectar este botón.
             */}
            <Pressable
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

              {/*
               * Antes "Cambiar" era solamente visual.
               *
               * Ahora abre el listado de empresas para que el usuario
               * pueda consultar otra empresa.
               *
               * Cuando implementemos activeCompany, seleccionar una
               * empresa desde ese listado también cambiará el contexto
               * activo del Dashboard.
               */}
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

            {/*
             * La tarjeta de empresa ya tenía navegación correcta.
             *
             * La conservamos y solamente reutilizamos
             * ACTIVE_COMPANY_ID.
             */}
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
                      San Luis de la Paz, Guanajuato
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
              {/* -------------------------------------------------------- */}
              {/* NUEVA EMPRESA                                            */}
              {/* -------------------------------------------------------- */}

              <QuickAction
                icon="+"
                title="Nueva empresa"
                onPress={() => router.navigate("/empresas/nueva")}
              />

              {/* -------------------------------------------------------- */}
              {/* NUEVA INSPECCIÓN                                         */}
              {/* -------------------------------------------------------- */}

              {/*
               * Desde Dashboard todavía no conocemos el inmueble.
               *
               * Por eso NO debemos saltar directamente a captura.
               *
               * Flujo:
               *
               * Dashboard
               *    ↓
               * Inmuebles
               *    ↓
               * seleccionar inmueble
               *    ↓
               * Nueva inspección
               *    ↓
               * seleccionar formulario
               *    ↓
               * Captura
               */}
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

              {/* -------------------------------------------------------- */}
              {/* REPORTES                                                 */}
              {/* -------------------------------------------------------- */}

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

/* -------------------------------------------------------------------------- */
/*                              STAT CARD                                     */
/* -------------------------------------------------------------------------- */

/*
 * Tarjeta utilizada en el resumen del Dashboard.
 *
 * highlighted permite destacar métricas que requieren atención,
 * como inspecciones pendientes.
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

/* -------------------------------------------------------------------------- */
/*                              QUICK ACTION                                  */
/* -------------------------------------------------------------------------- */

/*
 * Acción rápida reutilizable.
 *
 * A diferencia de la versión anterior, los accesos principales
 * del Dashboard ya reciben una función onPress real.
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

      {/*
       * Añadimos una indicación visual de navegación.
       */}
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

/* -------------------------------------------------------------------------- */
/*                              ACTIVITY ITEM                                 */
/* -------------------------------------------------------------------------- */

/*
 * Elemento visual del historial reciente.
 *
 * Por ahora NO es Pressable porque todavía no contamos
 * con IDs suficientes para garantizar que cada actividad
 * pueda abrir correctamente su recurso asociado.
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

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: Spacing.xxxl,
  },

  /* -------------------------------------------------------------------- */
  /* HEADER                                                               */
  /* -------------------------------------------------------------------- */

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

  /* -------------------------------------------------------------------- */
  /* SECCIONES                                                            */
  /* -------------------------------------------------------------------- */

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

  /* -------------------------------------------------------------------- */
  /* EMPRESA ACTIVA                                                       */
  /* -------------------------------------------------------------------- */

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

  /* -------------------------------------------------------------------- */
  /* RESUMEN                                                              */
  /* -------------------------------------------------------------------- */

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

  /* -------------------------------------------------------------------- */
  /* ACCIONES RÁPIDAS                                                     */
  /* -------------------------------------------------------------------- */

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

  /* -------------------------------------------------------------------- */
  /* ACTIVIDAD                                                            */
  /* -------------------------------------------------------------------- */

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
