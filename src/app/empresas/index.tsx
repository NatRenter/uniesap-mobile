import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { router } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { ResponsiveContainer } from "@/components/ui/ResponsiveContainer";
import { ResponsiveGrid } from "@/components/ui/ResponsiveGrid";
import { Screen } from "@/components/ui/Screen";

import { FontSize, Radius, Spacing } from "@/constants/theme";

import { companies } from "@/data/companies";
import { getPropertiesByCompanyId } from "@/data/properties";

import { useAppTheme } from "@/hooks/useAppTheme";

import { getInspectionsByCompanyId } from "@/repositories/inspectionRepository";

/*
 * ============================================================================
 * LISTADO DE EMPRESAS
 * ============================================================================
 *
 * Esta pantalla ya no mantiene una copia local de las empresas.
 *
 * Ahora utiliza:
 *
 * companies
 *   → información propia de la empresa
 *
 * getPropertiesByCompanyId()
 *   → cantidad real de inmuebles
 *
 * getInspectionsByCompanyId()
 *   → estados reales de las inspecciones
 *
 * Empresa e inmueble continúan siendo entidades diferentes.
 */
export default function CompaniesScreen() {
  const { colors } = useAppTheme();

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ResponsiveContainer>
          {/* ============================================================ */}
          {/* HEADER DE MÓDULO                                             */}
          {/* ============================================================ */}

          <View style={styles.header}>
            <Text
              style={[
                styles.title,
                {
                  color: colors.text,
                },
              ]}
            >
              Empresas
            </Text>

            <Text
              style={[
                styles.subtitle,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              Consulta las empresas registradas y los inmuebles asociados.
            </Text>
          </View>

          {/* ============================================================ */}
          {/* ACCIÓN PRINCIPAL                                             */}
          {/* ============================================================ */}

          <View style={styles.mainAction}>
            <AppButton onPress={() => router.navigate("/empresas/nueva")}>
              + Registrar empresa
            </AppButton>
          </View>

          {/* ============================================================ */}
          {/* LISTADO RESPONSIVE                                           */}
          {/* ============================================================ */}

          <ResponsiveGrid
            phoneColumns={1}
            tabletColumns={2}
            desktopColumns={3}
            gap={Spacing.md}
          >
            {companies.map((company) => {
              /*
               * Las métricas se calculan al renderizar
               * utilizando las fuentes reales actuales.
               */
              const properties = getPropertiesByCompanyId(company.id);

              const inspections = getInspectionsByCompanyId(company.id);

              const pendingInspections = inspections.filter(
                (inspection) => inspection.status === "draft",
              ).length;

              const inProgressInspections = inspections.filter(
                (inspection) => inspection.status === "in_progress",
              ).length;

              const completedInspections = inspections.filter(
                (inspection) => inspection.status === "completed",
              ).length;

              return (
                <CompanyCard
                  key={company.id}
                  id={company.id}
                  name={company.name}
                  properties={properties.length}
                  pendingInspections={pendingInspections}
                  inProgressInspections={inProgressInspections}
                  completedInspections={completedInspections}
                  color={company.branding.primaryColor}
                  initials={createCompanyInitials(company.name)}
                />
              );
            })}
          </ResponsiveGrid>
        </ResponsiveContainer>
      </ScrollView>
    </Screen>
  );
}

/*
 * ============================================================================
 * TARJETA DE EMPRESA
 * ============================================================================
 *
 * No guarda contadores propios.
 *
 * Recibe los valores ya calculados desde:
 *
 * - inmuebles;
 * - inspecciones pendientes;
 * - inspecciones en proceso;
 * - inspecciones completadas.
 */
function CompanyCard({
  id,
  name,
  properties,
  pendingInspections,
  inProgressInspections,
  completedInspections,
  color,
  initials,
}: {
  id: string;
  name: string;
  properties: number;
  pendingInspections: number;
  inProgressInspections: number;
  completedInspections: number;
  color: string;
  initials: string;
}) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      onPress={() =>
        router.navigate({
          pathname: "/empresas/[id]",
          params: {
            id,
          },
        })
      }
      style={({ pressed }) => ({
        opacity: pressed ? 0.75 : 1,
      })}
    >
      <AppCard padded={false} style={styles.companyCard}>
        {/* COLOR REPRESENTATIVO */}

        <View
          style={[
            styles.accent,
            {
              backgroundColor: color,
            },
          ]}
        />

        <View style={styles.companyContent}>
          {/* IDENTIDAD */}

          <View
            style={[
              styles.companyLogo,
              {
                backgroundColor: `${color}20`,
              },
            ]}
          >
            <Text
              style={[
                styles.initials,
                {
                  color,
                },
              ]}
            >
              {initials}
            </Text>
          </View>

          {/* INFORMACIÓN */}

          <View style={styles.companyInformation}>
            <Text
              style={[
                styles.companyName,
                {
                  color: colors.text,
                },
              ]}
            >
              {name}
            </Text>

            <Text
              style={[
                styles.propertyCount,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              {properties} inmueble{properties === 1 ? "" : "s"} registrado
              {properties === 1 ? "" : "s"}
            </Text>

            {/* ========================================================== */}
            {/* ESTADOS REALES                                             */}
            {/* ========================================================== */}

            <View style={styles.companyStats}>
              <StatusStat
                value={pendingInspections}
                label="pendientes"
                color={colors.warning}
              />

              <StatusStat
                value={inProgressInspections}
                label="en proceso"
                color={colors.primary}
              />

              <StatusStat
                value={completedInspections}
                label="realizadas"
                color={colors.success}
              />
            </View>
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
  );
}

/*
 * Métrica pequeña utilizada dentro de la tarjeta.
 */
function StatusStat({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color: string;
}) {
  return (
    <View style={styles.statusStat}>
      <View
        style={[
          styles.statusIndicator,
          {
            backgroundColor: color,
          },
        ]}
      />

      <Text
        style={[
          styles.stat,
          {
            color,
          },
        ]}
      >
        {value} {label}
      </Text>
    </View>
  );
}

/*
 * ============================================================================
 * INICIALES
 * ============================================================================
 *
 * Ejemplos:
 *
 * AutoZone      → AU
 * CEDIS         → CE
 * Empresa Demo  → ED
 */
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
 * ResponsiveGrid conserva:
 *
 * teléfono  → 1 columna
 * tablet    → 2 columnas
 * web       → 3 columnas
 *
 * Los estados usan flexWrap para no desbordar en pantallas pequeñas.
 */
const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: Spacing.xxxl,
  },

  header: {
    marginBottom: Spacing.lg,
  },

  title: {
    fontSize: FontSize.h1,
    fontWeight: "700",

    marginBottom: Spacing.sm,
  },

  subtitle: {
    maxWidth: 640,

    fontSize: FontSize.body,
    lineHeight: 24,
  },

  mainAction: {
    marginBottom: Spacing.lg,
  },

  companyCard: {
    width: "100%",

    overflow: "hidden",
  },

  accent: {
    height: 5,
  },

  companyContent: {
    minHeight: 126,

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

  initials: {
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

  propertyCount: {
    fontSize: FontSize.small,
    lineHeight: 20,

    marginBottom: Spacing.sm,
  },

  companyStats: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",

    columnGap: Spacing.sm,
    rowGap: Spacing.xs,
  },

  statusStat: {
    flexDirection: "row",
    alignItems: "center",
  },

  statusIndicator: {
    width: 7,
    height: 7,

    borderRadius: Radius.full,

    marginRight: Spacing.xs,
  },

  stat: {
    fontSize: FontSize.caption,
    fontWeight: "600",
  },

  arrow: {
    flexShrink: 0,

    fontSize: 32,

    marginLeft: Spacing.sm,
  },
});
