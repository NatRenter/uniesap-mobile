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
 * TRABAJO
 * ============================================================================
 *
 * Este módulo responde a:
 *
 * "¿Qué tengo que hacer?"
 *
 * No reemplaza Empresas.
 *
 * Empresas = estructura y consulta por empresa/inmueble.
 * Trabajo  = inspecciones que requieren atención.
 *
 * Los datos todavía son temporales; en una fase posterior se conectarán
 * directamente con InspectionRepository.
 */

const workItems = [
  {
    id: "inspection-demo-001",
    companyId: "2",
    propertyId: "property-001",
    company: "CEDIS",
    property: "LALA La Piedad",
    title: "Inspección de riesgos",
    status: "pending" as const,
    statusLabel: "Pendiente",
    dateLabel: "Hoy",
  },

  {
    id: "inspection-demo-002",
    companyId: "1",
    propertyId: "property-002",
    company: "AutoZone",
    property: "AutoZone Celaya",
    title: "Inspección general",
    status: "in_progress" as const,
    statusLabel: "En proceso",
    dateLabel: "Hoy",
  },

  {
    id: "inspection-demo-003",
    companyId: "1",
    propertyId: "property-003",
    company: "AutoZone",
    property: "AutoZone Salamanca",
    title: "Revisión de extintores",
    status: "completed" as const,
    statusLabel: "Completada",
    dateLabel: "Ayer",
  },
];

export default function WorkScreen() {
  const { colors } = useAppTheme();

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ResponsiveContainer>
          <View style={styles.header}>
            <Text
              style={[
                styles.title,
                {
                  color: colors.text,
                },
              ]}
            >
              Trabajo
            </Text>

            <Text
              style={[
                styles.subtitle,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              Consulta rápidamente inspecciones pendientes, en proceso y
              completadas.
            </Text>
          </View>

          {/* ============================================================ */}
          {/* RESUMEN                                                      */}
          {/* ============================================================ */}

          <ResponsiveGrid
            phoneColumns={3}
            tabletColumns={3}
            desktopColumns={3}
            gap={Spacing.sm}
          >
            <SummaryCard value="1" label="Pendiente" color={colors.warning} />

            <SummaryCard value="1" label="En proceso" color={colors.primary} />

            <SummaryCard value="1" label="Completada" color={colors.success} />
          </ResponsiveGrid>

          {/* ============================================================ */}
          {/* BANDEJA DE TRABAJO                                           */}
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
              Mis inspecciones
            </Text>

            <View style={styles.list}>
              {workItems.map((item) => (
                <WorkItem key={item.id} {...item} />
              ))}
            </View>
          </View>
        </ResponsiveContainer>
      </ScrollView>
    </Screen>
  );
}

/*
 * Resumen simple.
 *
 * Evitamos saturar al usuario con demasiadas métricas.
 */
function SummaryCard({
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
    <AppCard style={styles.summaryCard}>
      <Text
        style={[
          styles.summaryValue,
          {
            color,
          },
        ]}
      >
        {value}
      </Text>

      <Text
        numberOfLines={1}
        style={[
          styles.summaryLabel,
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
 * Tarjeta individual de trabajo.
 *
 * En esta primera fase la navegación abre el inmueble relacionado.
 * Posteriormente se conectará directamente a la inspección real.
 */
function WorkItem({
  companyId,
  propertyId,
  company,
  property,
  title,
  status,
  statusLabel,
  dateLabel,
}: {
  id: string;
  companyId: string;
  propertyId: string;
  company: string;
  property: string;
  title: string;
  status: "pending" | "in_progress" | "completed";
  statusLabel: string;
  dateLabel: string;
}) {
  const { colors } = useAppTheme();

  const statusColor =
    status === "pending"
      ? colors.warning
      : status === "in_progress"
        ? colors.primary
        : colors.success;

  return (
    <Pressable
      onPress={() =>
        router.navigate({
          pathname: "/empresas/[id]/inmuebles/[propertyId]",
          params: {
            id: companyId,
            propertyId,
          },
        })
      }
      style={({ pressed }) => ({
        opacity: pressed ? 0.75 : 1,
      })}
    >
      <AppCard>
        <View style={styles.workHeader}>
          <View style={styles.workText}>
            <Text
              style={[
                styles.workTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              {title}
            </Text>

            <Text
              style={[
                styles.workProperty,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              {property}
            </Text>

            <Text
              style={[
                styles.workCompany,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              {company} · {dateLabel}
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

        <View style={styles.statusRow}>
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
              styles.statusText,
              {
                color: statusColor,
              },
            ]}
          >
            {statusLabel}
          </Text>
        </View>
      </AppCard>
    </Pressable>
  );
}

/*
 * ============================================================================
 * ESTILOS
 * ============================================================================
 *
 * El contenido utiliza ResponsiveContainer y ResponsiveGrid para conservar
 * el comportamiento en teléfono, tablet y web.
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
    maxWidth: 680,

    fontSize: FontSize.body,
    lineHeight: 24,
  },

  summaryCard: {
    width: "100%",

    marginBottom: Spacing.lg,
  },

  summaryValue: {
    fontSize: FontSize.h2,
    fontWeight: "700",

    marginBottom: Spacing.xs,
  },

  summaryLabel: {
    fontSize: FontSize.caption,
  },

  section: {
    marginBottom: Spacing.xl,
  },

  sectionTitle: {
    fontSize: FontSize.cardTitle,
    fontWeight: "700",

    marginBottom: Spacing.md,
  },

  list: {
    gap: Spacing.md,
  },

  workHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  workText: {
    flex: 1,
    minWidth: 0,
  },

  workTitle: {
    fontSize: FontSize.body,
    fontWeight: "700",

    marginBottom: Spacing.xs,
  },

  workProperty: {
    fontSize: FontSize.small,

    marginBottom: 2,
  },

  workCompany: {
    fontSize: FontSize.caption,
  },

  arrow: {
    flexShrink: 0,

    fontSize: 28,

    marginLeft: Spacing.md,
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",

    marginTop: Spacing.md,
  },

  statusDot: {
    width: 8,
    height: 8,

    borderRadius: Radius.full,

    marginRight: Spacing.xs,
  },

  statusText: {
    fontSize: FontSize.caption,
    fontWeight: "700",
  },
});
