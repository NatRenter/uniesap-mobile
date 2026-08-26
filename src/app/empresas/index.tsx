import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { router } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { ResponsiveContainer } from "@/components/ui/ResponsiveContainer";
import { ResponsiveGrid } from "@/components/ui/ResponsiveGrid";
import { Screen } from "@/components/ui/Screen";

import { FontSize, Radius, Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

/*
 * ============================================================================
 * LISTADO DE EMPRESAS
 * ============================================================================
 *
 * Empresa e inmueble son conceptos distintos.
 *
 * Esta tarjeta resume:
 *
 * - cantidad de inmuebles registrados;
 * - inspecciones pendientes;
 * - inspecciones realizadas.
 *
 * Al entrar a una empresa, la siguiente pantalla será responsable
 * de mostrar sus inmuebles.
 */

const companies = [
  {
    id: "1",
    name: "AutoZone",
    properties: 3,
    pendingInspections: 2,
    completedInspections: 10,
    color: "#F97316",
    initials: "AZ",
  },

  {
    id: "2",
    name: "CEDIS",
    properties: 1,
    pendingInspections: 1,
    completedInspections: 7,
    color: "#EF4444",
    initials: "CE",
  },

  {
    id: "3",
    name: "Empresa Demo",
    properties: 2,
    pendingInspections: 2,
    completedInspections: 3,
    color: "#3B82F6",
    initials: "ED",
  },
];

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
            {companies.map((company) => (
              <CompanyCard key={company.id} {...company} />
            ))}
          </ResponsiveGrid>
        </ResponsiveContainer>
      </ScrollView>
    </Screen>
  );
}

/*
 * Tarjeta de una empresa.
 *
 * No muestra una ubicación única porque una empresa puede tener
 * varios inmuebles en diferentes ciudades.
 */
function CompanyCard({
  id,
  name,
  properties,
  pendingInspections,
  completedInspections,
  color,
  initials,
}: {
  id: string;
  name: string;
  properties: number;
  pendingInspections: number;
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
        <View
          style={[
            styles.accent,
            {
              backgroundColor: color,
            },
          ]}
        />

        <View style={styles.companyContent}>
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

            <View style={styles.companyStats}>
              <StatusStat
                value={pendingInspections}
                label="pendientes"
                color={colors.warning}
              />

              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: colors.border,
                  },
                ]}
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
 * Métrica pequeña para diferenciar visualmente
 * inspecciones pendientes y realizadas.
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
 * ESTILOS
 * ============================================================================
 *
 * ResponsiveGrid conserva:
 *
 * teléfono  → 1 columna
 * tablet    → 2 columnas
 * web       → 3 columnas
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
    minHeight: 118,

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

  dot: {
    width: 4,
    height: 4,

    borderRadius: Radius.full,

    marginHorizontal: Spacing.sm,
  },

  arrow: {
    flexShrink: 0,

    fontSize: 32,

    marginLeft: Spacing.sm,
  },
});
