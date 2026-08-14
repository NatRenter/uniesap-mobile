import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { router, useLocalSearchParams } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { Screen } from "@/components/ui/Screen";

import { FontSize, Radius, Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

const evidenceData = {
  "evidence-1": {
    title: "Extintor área de ventas",
    type: "Fotografía",
    inspection: "Inspección de extintores",
    property: "Sucursal San Luis de la Paz",
    date: "10 ago 2026",
    status: "Sincronizada",
    description:
      "Evidencia fotográfica registrada durante la inspección del equipo.",
  },

  "evidence-2": {
    title: "Condición de ruta de evacuación",
    type: "Fotografía",
    inspection: "Análisis de riesgos",
    property: "Sucursal San Luis de la Paz",
    date: "10 ago 2026",
    status: "Sincronizada",
    description:
      "Registro visual de las condiciones encontradas durante el recorrido.",
  },

  "evidence-3": {
    title: "Señalización preventiva",
    type: "Fotografía",
    inspection: "Señalización",
    property: "Centro de distribución",
    date: "13 ago 2026",
    status: "Pendiente",
    description: "Evidencia pendiente de sincronización con el servidor.",
  },

  "evidence-4": {
    title: "Documento complementario",
    type: "Documento",
    inspection: "Análisis de riesgos",
    property: "Sucursal Centro",
    date: "12 ago 2026",
    status: "Sincronizada",
    description: "Documento complementario asociado con la inspección.",
  },
} as const;

export default function EvidenceDetailsScreen() {
  const { colors } = useAppTheme();

  const { id, evidenceId } = useLocalSearchParams<{
    id: string;
    evidenceId: string;
  }>();

  const evidence =
    evidenceData[evidenceId as keyof typeof evidenceData] ??
    evidenceData["evidence-1"];

  const synchronized = evidence.status === "Sincronizada";

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={() =>
            router.navigate({
              pathname: "/empresas/[id]/evidencias",
              params: {
                id,
              },
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
            ‹ Evidencias
          </Text>
        </Pressable>

        <Text
          style={[
            styles.overline,
            {
              color: colors.primary,
            },
          ]}
        >
          EVIDENCIA
        </Text>

        <Text
          style={[
            styles.title,
            {
              color: colors.text,
            },
          ]}
        >
          {evidence.title}
        </Text>

        <Text
          style={[
            styles.type,
            {
              color: colors.textSecondary,
            },
          ]}
        >
          {evidence.type}
        </Text>

        {/* VISTA PREVIA SIMULADA */}

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
              styles.previewIcon,
              {
                color: colors.primary,
              },
            ]}
          >
            {evidence.type === "Fotografía" ? "▧" : "▤"}
          </Text>

          <Text
            style={[
              styles.previewTitle,
              {
                color: colors.text,
              },
            ]}
          >
            Vista previa
          </Text>

          <Text
            style={[
              styles.previewDescription,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            El archivo real se mostrará aquí cuando conectemos la captura.
          </Text>
        </View>

        <View style={styles.section}>
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
            <InfoRow label="Inspección" value={evidence.inspection} />

            <Divider />

            <InfoRow label="Inmueble" value={evidence.property} />

            <Divider />

            <InfoRow label="Fecha" value={evidence.date} />

            <Divider />

            <InfoRow
              label="Estado"
              value={evidence.status}
              statusColor={synchronized ? colors.success : colors.warning}
            />
          </AppCard>
        </View>

        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: colors.text,
              },
            ]}
          >
            Descripción
          </Text>

          <AppCard>
            <Text
              style={[
                styles.description,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              {evidence.description}
            </Text>
          </AppCard>
        </View>

        <AppButton variant="secondary">Ver inspección relacionada</AppButton>

        <Text
          style={[
            styles.prototypeNotice,
            {
              color: colors.textMuted,
            },
          ]}
        >
          Prototipo visual: el archivo mostrado todavía no corresponde a una
          evidencia real.
        </Text>
      </ScrollView>
    </Screen>
  );
}

function InfoRow({
  label,
  value,
  statusColor,
}: {
  label: string;
  value: string;
  statusColor?: string;
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
            color: statusColor ?? colors.text,
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
    marginBottom: Spacing.sm,
  },

  type: {
    fontSize: FontSize.small,
    marginBottom: Spacing.xl,
  },

  preview: {
    minHeight: 260,

    borderWidth: 1,
    borderRadius: Radius.lg,

    alignItems: "center",
    justifyContent: "center",

    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },

  previewIcon: {
    fontSize: 56,
    marginBottom: Spacing.md,
  },

  previewTitle: {
    fontSize: FontSize.cardTitle,
    fontWeight: "700",
    marginBottom: Spacing.sm,
  },

  previewDescription: {
    fontSize: FontSize.small,
    textAlign: "center",
    lineHeight: 20,
  },

  section: {
    marginBottom: Spacing.xl,
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

  description: {
    fontSize: FontSize.small,
    lineHeight: 21,
  },

  prototypeNotice: {
    fontSize: FontSize.caption,
    textAlign: "center",
    marginTop: Spacing.lg,
  },
});
