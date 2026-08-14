import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { router, useLocalSearchParams } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { Screen } from "@/components/ui/Screen";

import { FontSize, Radius, Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

export default function ReportDetailsScreen() {
  const { colors } = useAppTheme();

  const { id, reportId } = useLocalSearchParams<{
    id: string;
    reportId: string;
  }>();

  const isPreview = reportId === "report-preview";

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={() =>
            router.navigate({
              pathname: "/empresas/[id]/reportes",
              params: { id },
            })
          }
        >
          <Text style={[styles.backText, { color: colors.primary }]}>
            ‹ Reportes
          </Text>
        </Pressable>

        <Text style={[styles.overline, { color: colors.primary }]}>
          REPORTE
        </Text>

        <Text style={[styles.title, { color: colors.text }]}>
          Análisis de riesgos
        </Text>

        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: colors.primarySoft,
            },
          ]}
        >
          <Text style={[styles.statusText, { color: colors.primary }]}>
            {isPreview ? "✓ Generación simulada" : "✓ Generado"}
          </Text>
        </View>

        <View
          style={[
            styles.preview,
            {
              backgroundColor: colors.surfaceSecondary,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.fileIcon, { color: colors.primary }]}>▤</Text>

          <Text style={[styles.previewTitle, { color: colors.text }]}>
            Reporte de análisis de riesgos
          </Text>

          <Text
            style={[styles.previewDescription, { color: colors.textSecondary }]}
          >
            La vista previa del documento generado se mostrará en este espacio.
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Información
        </Text>

        <AppCard>
          <InfoRow label="Empresa" value="AutoZone" />

          <Divider />

          <InfoRow label="Inmueble" value="Sucursal San Luis de la Paz" />

          <Divider />

          <InfoRow label="Inspección" value="Análisis de riesgos" />

          <Divider />

          <InfoRow label="Formato" value="Excel" />

          <Divider />

          <InfoRow label="Evidencias" value="3 archivos incluidos" />
        </AppCard>

        <View style={styles.actions}>
          <AppButton>Abrir reporte</AppButton>

          <AppButton variant="secondary">Compartir</AppButton>
        </View>

        <Text style={[styles.prototypeNotice, { color: colors.textMuted }]}>
          Los botones son demostrativos. La generación, apertura y descarga se
          implementarán en una etapa posterior.
        </Text>
      </ScrollView>
    </Screen>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const { colors } = useAppTheme();

  return (
    <View>
      <Text style={[styles.infoLabel, { color: colors.textMuted }]}>
        {label}
      </Text>

      <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

function Divider() {
  const { colors } = useAppTheme();

  return <View style={[styles.divider, { backgroundColor: colors.divider }]} />;
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

  overline: {
    fontSize: FontSize.caption,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },

  title: {
    fontSize: FontSize.h1,
    fontWeight: "700",
    marginBottom: Spacing.md,
  },

  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    marginBottom: Spacing.xl,
  },

  statusText: {
    fontSize: FontSize.caption,
    fontWeight: "700",
  },

  preview: {
    minHeight: 250,
    borderWidth: 1,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },

  fileIcon: {
    fontSize: 52,
    marginBottom: Spacing.md,
  },

  previewTitle: {
    fontSize: FontSize.cardTitle,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: Spacing.sm,
  },

  previewDescription: {
    fontSize: FontSize.small,
    lineHeight: 21,
    textAlign: "center",
  },

  sectionTitle: {
    fontSize: FontSize.cardTitle,
    fontWeight: "700",
    marginBottom: Spacing.md,
  },

  infoLabel: {
    fontSize: FontSize.caption,
    marginBottom: Spacing.xs,
  },

  infoValue: {
    fontSize: FontSize.small,
    fontWeight: "600",
  },

  divider: {
    height: 1,
    marginVertical: Spacing.md,
  },

  actions: {
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },

  prototypeNotice: {
    fontSize: FontSize.caption,
    lineHeight: 18,
    textAlign: "center",
    marginTop: Spacing.lg,
  },
});
