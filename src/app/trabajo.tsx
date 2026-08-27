import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { router } from "expo-router";

import { AppCard } from "@/components/ui/AppCard";
import { ResponsiveContainer } from "@/components/ui/ResponsiveContainer";
import { ResponsiveGrid } from "@/components/ui/ResponsiveGrid";
import { Screen } from "@/components/ui/Screen";

import { FontSize, Radius, Spacing } from "@/constants/theme";

import { getFormById } from "@/data/forms";
import { getCompanyById } from "@/repositories/companyRepository";
import { getPropertyById } from "@/repositories/propertyRepository";

import { useAppTheme } from "@/hooks/useAppTheme";

import { getInspections } from "@/repositories/inspectionRepository";

import type {
  Inspection,
  InspectionStatus,
  InspectionSyncStatus,
} from "@/types/inspection";

/*
 * ============================================================================
 * TRABAJO
 * ============================================================================
 *
 * Este módulo ya no utiliza datos temporales.
 *
 * Lee directamente InspectionRepository para responder:
 *
 * "¿Qué inspecciones necesitan mi atención?"
 *
 * La pantalla muestra información simple:
 *
 * - pendiente;
 * - en proceso;
 * - completada;
 * - error de sincronización.
 *
 * Los detalles técnicos continúan en Opciones de desarrollador.
 */

export default function WorkScreen() {
  const { colors } = useAppTheme();

  /*
   * El repositorio ya fue hidratado por RootLayout.
   */
  /*
   * Ordenamos por actividad real.
   *
   * updatedAt cambia cada vez que InspectionRepository
   * guarda una modificación sobre la inspección.
   */
  const inspections = [...getInspections()].sort(
    (a, b) =>
      getInspectionActivityTimestamp(b) - getInspectionActivityTimestamp(a),
  );

  const summary = createWorkSummary(inspections);

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
              Consulta rápidamente las inspecciones que necesitan atención.
            </Text>
          </View>

          {/* ============================================================ */}
          {/* RESUMEN                                                      */}
          {/* ============================================================ */}

          <ResponsiveGrid
            phoneColumns={2}
            tabletColumns={4}
            desktopColumns={4}
            gap={Spacing.sm}
          >
            <SummaryCard
              value={String(summary.pending)}
              label="Pendientes"
              color={colors.warning}
            />

            <SummaryCard
              value={String(summary.inProgress)}
              label="En proceso"
              color={colors.primary}
            />

            <SummaryCard
              value={String(summary.completed)}
              label="Completadas"
              color={colors.success}
            />

            <SummaryCard
              value={String(summary.errors)}
              label="Con error"
              color={summary.errors > 0 ? colors.error : colors.textMuted}
            />
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

            {inspections.length > 0 ? (
              <View style={styles.list}>
                {inspections.map((inspection) => (
                  <WorkItem key={inspection.id} inspection={inspection} />
                ))}
              </View>
            ) : (
              <AppCard>
                <Text
                  style={[
                    styles.emptyTitle,
                    {
                      color: colors.text,
                    },
                  ]}
                >
                  No hay trabajo registrado
                </Text>

                <Text
                  style={[
                    styles.emptyDescription,
                    {
                      color: colors.textSecondary,
                    },
                  ]}
                >
                  Las inspecciones nuevas aparecerán aquí automáticamente.
                </Text>
              </AppCard>
            )}
          </View>
        </ResponsiveContainer>
      </ScrollView>
    </Screen>
  );
}

/*
 * Tarjeta numérica del resumen.
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
 * Tarjeta de una inspección real.
 *
 * Si la captura está pendiente/en proceso:
 *     abre Captura y continúa el trabajo.
 *
 * Si está completada:
 *     abre el detalle de inspección.
 */
function WorkItem({ inspection }: { inspection: Inspection }) {
  const { colors } = useAppTheme();

  const company = getCompanyById(inspection.companyId);

  const property = getPropertyById(inspection.propertyId);

  const form = getFormById(inspection.formId);

  const state = resolveWorkState(
    inspection.status,
    inspection.integration?.syncStatus,
    colors,
  );

  const actionLabel = inspection.status === "completed" ? "Ver" : "Continuar";

  return (
    <Pressable
      onPress={() => openInspection(inspection)}
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
              {form?.title ?? "Inspección"}
            </Text>

            <Text
              style={[
                styles.workProperty,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              {property?.name ?? "Inmueble no disponible"}
            </Text>

            <Text
              style={[
                styles.workCompany,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              {company?.name ?? "Empresa no disponible"} ·{" "}
              {formatActivityDate(inspection.updatedAt)}
            </Text>
          </View>

          <Text
            style={[
              styles.actionLabel,
              {
                color: colors.primary,
              },
            ]}
          >
            {actionLabel}
          </Text>
        </View>

        <View style={styles.statusArea}>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: state.color,
                },
              ]}
            />

            <Text
              style={[
                styles.statusText,
                {
                  color: state.color,
                },
              ]}
            >
              {state.label}
            </Text>
          </View>

          {state.syncLabel ? (
            <Text
              style={[
                styles.syncText,
                {
                  color: state.syncColor,
                },
              ]}
            >
              {state.syncLabel}
            </Text>
          ) : null}
        </View>
      </AppCard>
    </Pressable>
  );
}

/*
 * Abre el destino correcto según el estado.
 */
function openInspection(inspection: Inspection): void {
  if (inspection.status === "completed") {
    router.navigate({
      pathname: "/empresas/[id]/inspecciones/[inspectionId]",

      params: {
        id: inspection.companyId,

        inspectionId: inspection.id,
      },
    });

    return;
  }

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
 * Resume el estado interno con términos de interfaz.
 *
 * La sincronización se muestra de manera simple:
 * no exponemos submissionId, operationId ni otros datos técnicos.
 */
function resolveWorkState(
  status: InspectionStatus,
  syncStatus: InspectionSyncStatus | undefined,
  colors: ReturnType<typeof useAppTheme>["colors"],
) {
  if (syncStatus === "error") {
    return {
      label:
        status === "completed"
          ? "Completada"
          : status === "in_progress"
            ? "En proceso"
            : "Pendiente",

      color:
        status === "completed"
          ? colors.success
          : status === "in_progress"
            ? colors.primary
            : colors.warning,

      syncLabel: "Error de sincronización",

      syncColor: colors.error,
    };
  }

  if (status === "completed") {
    return {
      label: "Completada",
      color: colors.success,

      syncLabel:
        syncStatus === "synced"
          ? "✓ Sincronizada"
          : syncStatus === "syncing"
            ? "Sincronizando..."
            : syncStatus === "pending"
              ? "Pendiente de subir"
              : undefined,

      syncColor: syncStatus === "synced" ? colors.success : colors.textMuted,
    };
  }

  if (status === "in_progress") {
    return {
      label: "En proceso",
      color: colors.primary,
      syncLabel: undefined,
      syncColor: colors.textMuted,
    };
  }

  return {
    label: "Pendiente",
    color: colors.warning,
    syncLabel: undefined,
    syncColor: colors.textMuted,
  };
}

/*
 * Calcula las métricas visibles.
 */
function createWorkSummary(inspections: Inspection[]) {
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
 * Convierte updatedAt en timestamp para ordenar.
 *
 * createdAt/date quedan como respaldo por compatibilidad.
 */
function getInspectionActivityTimestamp(inspection: Inspection): number {
  const candidates = [
    inspection.updatedAt,
    inspection.createdAt,
    inspection.date,
  ];

  for (const candidate of candidates) {
    const timestamp = new Date(candidate).getTime();

    if (!Number.isNaN(timestamp)) {
      return timestamp;
    }
  }

  return 0;
}

/*
 * Muestra cuándo se modificó realmente la inspección.
 */
function formatActivityDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return formatDate(value);
  }

  const today = new Date();

  const sameDay =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();

  const time = date.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (sameDay) {
    return `Actualizada hoy, ${time}`;
  }

  const day = date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return `Actualizada ${day}, ${time}`;
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

/*
 * ============================================================================
 * ESTILOS
 * ============================================================================
 *
 * La bandeja mantiene una sola columna para facilitar lectura.
 * El resumen sí aprovecha múltiples columnas en tablet y web.
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

    gap: Spacing.md,
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

  actionLabel: {
    flexShrink: 0,

    fontSize: FontSize.small,
    fontWeight: "700",
  },

  statusArea: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",

    gap: Spacing.sm,

    marginTop: Spacing.md,
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
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

  syncText: {
    fontSize: FontSize.caption,
    fontWeight: "600",
  },

  emptyTitle: {
    fontSize: FontSize.body,
    fontWeight: "700",

    marginBottom: Spacing.xs,
  },

  emptyDescription: {
    fontSize: FontSize.small,
    lineHeight: 20,
  },
});
