import { useState } from "react";

import {
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    View,
} from "react-native";

import { router, useLocalSearchParams } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { Screen } from "@/components/ui/Screen";

import { FontSize, Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

export default function NewReportScreen() {
  const { colors } = useAppTheme();

  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const [includeEvidence, setIncludeEvidence] = useState(true);

  const [selectedFormat, setSelectedFormat] = useState<"Excel" | "PDF">(
    "Excel",
  );

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

        <Text style={[styles.title, { color: colors.text }]}>
          Generar reporte
        </Text>

        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Configura la información que formará parte del reporte.
        </Text>

        <SectionTitle title="Inmueble" />

        <SelectableCard
          title="Sucursal San Luis de la Paz"
          description="San Luis de la Paz, Guanajuato"
          selected
        />

        <SectionTitle title="Inspección" />

        <SelectableCard
          title="Análisis de riesgos"
          description="Realizada el 10 ago 2026"
          selected
        />

        <SectionTitle title="Formato" />

        <View style={styles.formatRow}>
          <FormatOption
            title="Excel"
            selected={selectedFormat === "Excel"}
            onPress={() => setSelectedFormat("Excel")}
          />

          <FormatOption
            title="PDF"
            selected={selectedFormat === "PDF"}
            onPress={() => setSelectedFormat("PDF")}
          />
        </View>

        <SectionTitle title="Contenido" />

        <AppCard>
          <View style={styles.optionRow}>
            <View style={styles.optionInfo}>
              <Text style={[styles.optionTitle, { color: colors.text }]}>
                Datos de la empresa
              </Text>

              <Text
                style={[
                  styles.optionDescription,
                  { color: colors.textSecondary },
                ]}
              >
                Información general de la empresa e inmueble.
              </Text>
            </View>

            <Text style={[styles.required, { color: colors.success }]}>✓</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          <View style={styles.optionRow}>
            <View style={styles.optionInfo}>
              <Text style={[styles.optionTitle, { color: colors.text }]}>
                Respuestas del formulario
              </Text>

              <Text
                style={[
                  styles.optionDescription,
                  { color: colors.textSecondary },
                ]}
              >
                Datos capturados durante la inspección.
              </Text>
            </View>

            <Text style={[styles.required, { color: colors.success }]}>✓</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          <View style={styles.optionRow}>
            <View style={styles.optionInfo}>
              <Text style={[styles.optionTitle, { color: colors.text }]}>
                Incluir evidencias
              </Text>

              <Text
                style={[
                  styles.optionDescription,
                  { color: colors.textSecondary },
                ]}
              >
                Adjuntar fotografías y documentos relacionados.
              </Text>
            </View>

            <Switch
              value={includeEvidence}
              onValueChange={setIncludeEvidence}
            />
          </View>
        </AppCard>

        <View style={styles.previewSection}>
          <SectionTitle title="Resumen" />

          <AppCard>
            <SummaryRow label="Empresa" value="AutoZone" />

            <SummaryRow label="Inmueble" value="Sucursal San Luis de la Paz" />

            <SummaryRow label="Inspección" value="Análisis de riesgos" />

            <SummaryRow label="Formato" value={selectedFormat} />

            <SummaryRow
              label="Evidencias"
              value={includeEvidence ? "Incluidas" : "No incluidas"}
            />
          </AppCard>
        </View>

        <AppButton
          onPress={() =>
            router.replace({
              pathname: "/empresas/[id]/reportes/[reportId]",
              params: {
                id,
                reportId: "report-preview",
              },
            })
          }
        >
          Generar reporte
        </AppButton>

        <Text style={[styles.prototypeNotice, { color: colors.textMuted }]}>
          Prototipo visual: todavía no se generará ningún archivo real.
        </Text>
      </ScrollView>
    </Screen>
  );
}

function SectionTitle({ title }: { title: string }) {
  const { colors } = useAppTheme();

  return (
    <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
  );
}

function SelectableCard({
  title,
  description,
  selected,
}: {
  title: string;
  description: string;
  selected: boolean;
}) {
  const { colors } = useAppTheme();

  return (
    <AppCard
      style={[
        styles.selectableCard,
        selected && {
          borderColor: colors.primary,
        },
      ]}
    >
      <View style={styles.selectableRow}>
        <View style={styles.optionInfo}>
          <Text style={[styles.optionTitle, { color: colors.text }]}>
            {title}
          </Text>

          <Text
            style={[styles.optionDescription, { color: colors.textSecondary }]}
          >
            {description}
          </Text>
        </View>

        <Text style={[styles.selectedIcon, { color: colors.primary }]}>✓</Text>
      </View>
    </AppCard>
  );
}

function FormatOption({
  title,
  selected,
  onPress,
}: {
  title: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      style={[
        styles.formatOption,
        {
          backgroundColor: colors.surface,
          borderColor: selected ? colors.primary : colors.border,
        },
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.formatTitle,
          {
            color: selected ? colors.primary : colors.text,
          },
        ]}
      >
        {title}
      </Text>

      <Text
        style={[
          styles.formatStatus,
          {
            color: selected ? colors.primary : colors.textMuted,
          },
        ]}
      >
        {selected ? "● Seleccionado" : "○ Seleccionar"}
      </Text>
    </Pressable>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>
        {label}
      </Text>

      <Text style={[styles.summaryValue, { color: colors.text }]}>{value}</Text>
    </View>
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

  sectionTitle: {
    fontSize: FontSize.cardTitle,
    fontWeight: "700",
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },

  selectableCard: {
    borderWidth: 1,
  },

  selectableRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  selectedIcon: {
    fontSize: 22,
    fontWeight: "700",
  },

  formatRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },

  formatOption: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    padding: Spacing.lg,
  },

  formatTitle: {
    fontSize: FontSize.body,
    fontWeight: "700",
    marginBottom: Spacing.sm,
  },

  formatStatus: {
    fontSize: FontSize.caption,
  },

  optionRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  optionInfo: {
    flex: 1,
  },

  optionTitle: {
    fontSize: FontSize.small,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },

  optionDescription: {
    fontSize: FontSize.caption,
    lineHeight: 19,
  },

  required: {
    fontSize: 20,
    fontWeight: "700",
    marginLeft: Spacing.md,
  },

  divider: {
    height: 1,
    marginVertical: Spacing.md,
  },

  previewSection: {
    marginBottom: Spacing.xl,
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },

  summaryLabel: {
    fontSize: FontSize.small,
  },

  summaryValue: {
    flex: 1,
    fontSize: FontSize.small,
    fontWeight: "600",
    textAlign: "right",
  },

  prototypeNotice: {
    fontSize: FontSize.caption,
    textAlign: "center",
    marginTop: Spacing.lg,
  },
});
