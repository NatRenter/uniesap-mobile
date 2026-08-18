import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { router, useLocalSearchParams } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { Screen } from "@/components/ui/Screen";

import { getCompanyById } from "@/data/companies";
import { getEvidencesByInspectionId } from "@/data/evidences";
import { getFormById } from "@/data/forms";
import { getInspectionById } from "@/data/inspections";
import { getPropertyById } from "@/data/properties";
import { getReportById } from "@/data/reports";

import { FontSize, Radius, Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

export default function ReportDetailsScreen() {
  const { colors } = useAppTheme();

  const { id, reportId } = useLocalSearchParams<{
    id: string;
    reportId: string;
  }>();

  const company = getCompanyById(id);
  const report = getReportById(reportId);

  if (!company || !report) {
    return (
      <Screen>
        <Pressable onPress={() => router.back()}>
          <Text
            style={{
              color: colors.primary,
              fontWeight: "600",
            }}
          >
            ‹ Volver
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
            Reporte no encontrado
          </Text>
        </View>
      </Screen>
    );
  }

  const inspection = getInspectionById(report.inspectionId);

  const property = getPropertyById(report.propertyId);

  const form = inspection ? getFormById(inspection.formId) : undefined;

  const evidences = getEvidencesByInspectionId(report.inspectionId);

  const statusLabel = report.status === "generated" ? "Generado" : "Pendiente";

  const statusColor =
    report.status === "generated" ? colors.success : colors.warning;

  const formatLabel = report.format === "excel" ? "Excel" : "PDF";

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
          <Text
            style={[
              styles.backText,
              {
                color: colors.primary,
              },
            ]}
          >
            ‹ Reportes
          </Text>
        </Pressable>

        <Text
          style={[
            styles.companyOverline,
            {
              color: company.branding.primaryColor,
            },
          ]}
        >
          {company.name.toUpperCase()}
        </Text>

        <Text
          style={[
            styles.overline,
            {
              color: colors.primary,
            },
          ]}
        >
          REPORTE
        </Text>

        <Text
          style={[
            styles.title,
            {
              color: colors.text,
            },
          ]}
        >
          {report.title}
        </Text>

        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: `${statusColor}20`,
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              {
                color: statusColor,
              },
            ]}
          >
            ● {statusLabel}
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
          <Text
            style={[
              styles.fileIcon,
              {
                color: colors.primary,
              },
            ]}
          >
            ▤
          </Text>

          <Text
            style={[
              styles.previewTitle,
              {
                color: colors.text,
              },
            ]}
          >
            {report.title}
          </Text>

          <Text
            style={[
              styles.previewDescription,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            {report.fileUri
              ? "El archivo generado está disponible."
              : "La vista previa del archivo generado se mostrará en este espacio."}
          </Text>
        </View>

        <Text
          style={[
            styles.sectionTitle,
            {
              color: colors.text,
            },
          ]}
        >
          Información
        </Text>

        <AppCard>
          <InfoRow label="Empresa" value={company.name} />

          <Divider />

          <InfoRow label="Inmueble" value={property?.name ?? "No disponible"} />

          <Divider />

          <InfoRow label="Inspección" value={form?.title ?? "No disponible"} />

          <Divider />

          <InfoRow label="Formato" value={formatLabel} />

          <Divider />

          <InfoRow
            label="Fecha de generación"
            value={formatDate(report.createdAt)}
          />

          <Divider />

          <InfoRow
            label="Estado"
            value={statusLabel}
            valueColor={statusColor}
          />

          <Divider />

          <InfoRow
            label="Evidencias"
            value={
              report.includeEvidence
                ? `${evidences.length} archivo${
                    evidences.length !== 1 ? "s" : ""
                  } incluido${evidences.length !== 1 ? "s" : ""}`
                : "No incluidas"
            }
          />
        </AppCard>

        {inspection && (
          <View style={styles.relatedSection}>
            <Text
              style={[
                styles.sectionTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              Inspección relacionada
            </Text>

            <Pressable
              onPress={() =>
                router.navigate({
                  pathname: "/empresas/[id]/inspecciones/[inspectionId]",
                  params: {
                    id,
                    inspectionId: inspection.id,
                  },
                })
              }
            >
              <AppCard>
                <Text
                  style={[
                    styles.relatedTitle,
                    {
                      color: colors.text,
                    },
                  ]}
                >
                  {form?.title ?? "Inspección"}
                </Text>

                <Text
                  style={[
                    styles.relatedDescription,
                    {
                      color: colors.textSecondary,
                    },
                  ]}
                >
                  {property?.name ?? "Inmueble no disponible"}
                </Text>
              </AppCard>
            </Pressable>
          </View>
        )}

        <View style={styles.actions}>
          <AppButton>Abrir reporte</AppButton>

          <AppButton variant="secondary">Compartir</AppButton>
        </View>

        <Text
          style={[
            styles.prototypeNotice,
            {
              color: colors.textMuted,
            },
          ]}
        >
          La generación y apertura del archivo real se implementarán en una
          etapa posterior.
        </Text>
      </ScrollView>
    </Screen>
  );
}

function InfoRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  const { colors } = useAppTheme();

  return (
    <View>
      <Text
        style={[
          styles.infoLabel,
          {
            color: colors.textMuted,
          },
        ]}
      >
        {label}
      </Text>

      <Text
        style={[
          styles.infoValue,
          {
            color: valueColor ?? colors.text,
          },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

function Divider() {
  const { colors } = useAppTheme();

  return (
    <View
      style={[
        styles.divider,
        {
          backgroundColor: colors.divider,
        },
      ]}
    />
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

  companyOverline: {
    fontSize: FontSize.caption,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: Spacing.md,
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
    borderRadius: Radius.full,
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

  relatedSection: {
    marginTop: Spacing.xl,
  },

  relatedTitle: {
    fontSize: FontSize.body,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },

  relatedDescription: {
    fontSize: FontSize.caption,
  },

  actions: {
    gap: Spacing.sm,
    marginTop: Spacing.xl,
  },

  prototypeNotice: {
    fontSize: FontSize.caption,
    lineHeight: 18,
    textAlign: "center",
    marginTop: Spacing.lg,
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
