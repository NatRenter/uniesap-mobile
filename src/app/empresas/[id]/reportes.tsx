import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { router, useLocalSearchParams } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { Screen } from "@/components/ui/Screen";

import { getCompanyById } from "@/data/companies";
import { getFormById } from "@/data/forms";
import { getInspectionById } from "@/data/inspections";
import { getPropertyById } from "@/data/properties";
import { getReportsByCompanyId } from "@/data/reports";

import { FontSize, Radius, Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

export default function ReportsScreen() {
  const { colors } = useAppTheme();

  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const company = getCompanyById(id);

  if (!company) {
    return (
      <Screen>
        <Pressable onPress={() => router.navigate("/empresas")}>
          <Text
            style={{
              color: colors.primary,
              fontWeight: "600",
            }}
          >
            ‹ Empresas
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
            Empresa no encontrada
          </Text>
        </View>
      </Screen>
    );
  }

  const companyReports = getReportsByCompanyId(company.id);

  const generated = companyReports.filter(
    (report) => report.status === "generated",
  ).length;

  const pending = companyReports.filter(
    (report) => report.status === "pending",
  ).length;

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
            styles.overline,
            {
              color: company.branding.primaryColor,
            },
          ]}
        >
          {company.name.toUpperCase()}
        </Text>

        <Text
          style={[
            styles.title,
            {
              color: colors.text,
            },
          ]}
        >
          Reportes
        </Text>

        <Text
          style={[
            styles.subtitle,
            {
              color: colors.textSecondary,
            },
          ]}
        >
          Consulta y genera reportes a partir de las inspecciones realizadas.
        </Text>

        <View style={styles.summary}>
          <SummaryCard value={companyReports.length.toString()} label="Total" />

          <SummaryCard value={generated.toString()} label="Generados" />

          <SummaryCard
            value={pending.toString()}
            label="Pendientes"
            warning={pending > 0}
          />
        </View>

        <AppButton
          onPress={() =>
            router.navigate({
              pathname: "/empresas/[id]/reportes/nuevo",
              params: { id },
            })
          }
        >
          + Generar reporte
        </AppButton>

        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: colors.text,
              },
            ]}
          >
            Reportes recientes
          </Text>

          <View style={styles.list}>
            {companyReports.map((report) => {
              const inspection = getInspectionById(report.inspectionId);

              const property = getPropertyById(report.propertyId);

              const form = inspection
                ? getFormById(inspection.formId)
                : undefined;

              return (
                <ReportCard
                  key={report.id}
                  reportId={report.id}
                  companyRouteId={id}
                  title={report.title}
                  property={property?.name ?? "Inmueble no disponible"}
                  inspection={form?.title ?? "Inspección no disponible"}
                  date={report.createdAt}
                  format={report.format}
                  status={report.status}
                />
              );
            })}
          </View>

          {companyReports.length === 0 && (
            <AppCard style={styles.emptyCard}>
              <Text
                style={[
                  styles.emptyTitle,
                  {
                    color: colors.text,
                  },
                ]}
              >
                Sin reportes
              </Text>

              <Text
                style={[
                  styles.emptyDescription,
                  {
                    color: colors.textSecondary,
                  },
                ]}
              >
                Todavía no se han generado reportes para esta empresa.
              </Text>
            </AppCard>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

function SummaryCard({
  value,
  label,
  warning = false,
}: {
  value: string;
  label: string;
  warning?: boolean;
}) {
  const { colors } = useAppTheme();

  return (
    <AppCard style={styles.summaryCard}>
      <Text
        style={[
          styles.summaryValue,
          {
            color: warning ? colors.warning : colors.text,
          },
        ]}
      >
        {value}
      </Text>

      <Text
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

function ReportCard({
  reportId,
  companyRouteId,
  title,
  property,
  inspection,
  date,
  format,
  status,
}: {
  reportId: string;
  companyRouteId: string;
  title: string;
  property: string;
  inspection: string;
  date: string;
  format: "excel" | "pdf";
  status: "pending" | "generated";
}) {
  const { colors } = useAppTheme();

  const statusLabel = status === "generated" ? "Generado" : "Pendiente";

  const statusColor = status === "generated" ? colors.success : colors.warning;

  const formatLabel = format === "excel" ? "Excel" : "PDF";

  return (
    <Pressable
      onPress={() =>
        router.navigate({
          pathname: "/empresas/[id]/reportes/[reportId]",
          params: {
            id: companyRouteId,
            reportId,
          },
        })
      }
      style={({ pressed }) => ({
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <AppCard>
        <View style={styles.reportHeader}>
          <View
            style={[
              styles.fileIcon,
              {
                backgroundColor: colors.primarySoft,
              },
            ]}
          >
            <Text
              style={[
                styles.fileIconText,
                {
                  color: colors.primary,
                },
              ]}
            >
              ▤
            </Text>
          </View>

          <View style={styles.reportInfo}>
            <Text
              style={[
                styles.reportTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              {title}
            </Text>

            <Text
              style={[
                styles.reportProperty,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              {property}
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

        <Text
          style={[
            styles.inspection,
            {
              color: colors.textSecondary,
            },
          ]}
        >
          {inspection}
        </Text>

        <View style={styles.meta}>
          <Text
            style={[
              styles.metaText,
              {
                color: colors.textMuted,
              },
            ]}
          >
            {formatDate(date)} · {formatLabel}
          </Text>

          <Text
            style={[
              styles.status,
              {
                color: statusColor,
              },
            ]}
          >
            ● {statusLabel}
          </Text>
        </View>
      </AppCard>
    </Pressable>
  );
}

function formatDate(date: string) {
  const normalized = date.includes("T") ? date.split("T")[0] : date;

  const parts = normalized.split("-");

  if (parts.length !== 3) {
    return date;
  }

  const [year, month, day] = parts;

  return `${day}/${month}/${year}`;
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
    fontSize: FontSize.body,
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },

  summary: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },

  summaryCard: {
    flex: 1,
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
    marginTop: Spacing.xl,
  },

  sectionTitle: {
    fontSize: FontSize.cardTitle,
    fontWeight: "700",
    marginBottom: Spacing.md,
  },

  list: {
    gap: Spacing.md,
  },

  reportHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  fileIcon: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },

  fileIconText: {
    fontSize: FontSize.h3,
    fontWeight: "700",
  },

  reportInfo: {
    flex: 1,
  },

  reportTitle: {
    fontSize: FontSize.body,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },

  reportProperty: {
    fontSize: FontSize.caption,
  },

  arrow: {
    fontSize: 28,
  },

  divider: {
    height: 1,
    marginVertical: Spacing.md,
  },

  inspection: {
    fontSize: FontSize.small,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },

  meta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  metaText: {
    fontSize: FontSize.caption,
  },

  status: {
    fontSize: FontSize.caption,
    fontWeight: "600",
  },

  emptyCard: {
    marginTop: Spacing.md,
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
  },
});
