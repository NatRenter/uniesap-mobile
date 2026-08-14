import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { router, useLocalSearchParams } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { Screen } from "@/components/ui/Screen";

import { FontSize, Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

const reports = [
  {
    id: "report-1",
    title: "Análisis de riesgos",
    property: "Sucursal San Luis de la Paz",
    inspection: "Análisis de riesgos",
    date: "10 ago 2026",
    format: "Excel",
    status: "Generado",
  },
  {
    id: "report-2",
    title: "Inspección de extintores",
    property: "Sucursal San Luis de la Paz",
    inspection: "Inspección de extintores",
    date: "10 ago 2026",
    format: "Excel",
    status: "Generado",
  },
  {
    id: "report-3",
    title: "Reporte de señalización",
    property: "Centro de distribución",
    inspection: "Señalización",
    date: "13 ago 2026",
    format: "Excel",
    status: "Pendiente",
  },
];

export default function ReportsScreen() {
  const { colors } = useAppTheme();

  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const generated = reports.filter(
    (report) => report.status === "Generado",
  ).length;

  const pending = reports.filter(
    (report) => report.status === "Pendiente",
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
          <Text style={[styles.backText, { color: colors.primary }]}>
            ‹ Empresa
          </Text>
        </Pressable>

        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: colors.text }]}>Reportes</Text>

            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Consulta y genera reportes a partir de las inspecciones.
            </Text>
          </View>
        </View>

        <View style={styles.summary}>
          <SummaryCard value={reports.length.toString()} label="Total" />

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
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Reportes recientes
          </Text>

          <View style={styles.list}>
            {reports.map((report) => (
              <ReportCard key={report.id} {...report} companyId={id} />
            ))}
          </View>
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

      <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
        {label}
      </Text>
    </AppCard>
  );
}

function ReportCard({
  id,
  title,
  property,
  inspection,
  date,
  format,
  status,
  companyId,
}: {
  id: string;
  title: string;
  property: string;
  inspection: string;
  date: string;
  format: string;
  status: string;
  companyId: string;
}) {
  const { colors } = useAppTheme();

  const generated = status === "Generado";

  return (
    <Pressable
      onPress={() =>
        router.navigate({
          pathname: "/empresas/[id]/reportes/[reportId]",
          params: {
            id: companyId,
            reportId: id,
          },
        })
      }
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
            <Text style={[styles.fileIconText, { color: colors.primary }]}>
              ▤
            </Text>
          </View>

          <View style={styles.reportInfo}>
            <Text style={[styles.reportTitle, { color: colors.text }]}>
              {title}
            </Text>

            <Text
              style={[styles.reportProperty, { color: colors.textSecondary }]}
            >
              {property}
            </Text>
          </View>

          <Text style={[styles.arrow, { color: colors.textMuted }]}>›</Text>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.divider }]} />

        <Text style={[styles.inspection, { color: colors.textSecondary }]}>
          {inspection}
        </Text>

        <View style={styles.meta}>
          <Text style={[styles.metaText, { color: colors.textMuted }]}>
            {date} · {format}
          </Text>

          <Text
            style={[
              styles.status,
              {
                color: generated ? colors.success : colors.warning,
              },
            ]}
          >
            ● {status}
          </Text>
        </View>
      </AppCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },

  backText: {
    fontSize: FontSize.small,
    fontWeight: "600",
    marginBottom: Spacing.xl,
  },

  header: {
    marginBottom: Spacing.xl,
  },

  headerText: {
    flex: 1,
  },

  title: {
    fontSize: FontSize.h1,
    fontWeight: "700",
    marginBottom: Spacing.sm,
  },

  subtitle: {
    fontSize: FontSize.body,
    lineHeight: 24,
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
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    marginRight: Spacing.md,
  },

  fileIconText: {
    fontSize: 24,
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
});
