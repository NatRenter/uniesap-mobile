import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { router, useLocalSearchParams } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { Screen } from "@/components/ui/Screen";

import { FontSize, Radius, Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

const inspections = {
  "inspection-1": {
    title: "Análisis de riesgos",
    property: "Sucursal San Luis de la Paz",
    date: "10 ago 2026",
    inspector: "Alexis",
    status: "Finalizada",
    responses: [
      {
        label: "Responsable de la inspección",
        value: "Alexis",
      },
      {
        label: "¿Se identificaron condiciones de riesgo?",
        value: "Sí",
      },
      {
        label: "Observaciones",
        value: "Se identificaron condiciones que requieren seguimiento.",
      },
    ],
    evidences: 3,
  },

  "inspection-2": {
    title: "Inspección de extintores",
    property: "Sucursal Centro",
    date: "12 ago 2026",
    inspector: "Alexis",
    status: "En proceso",
    responses: [
      {
        label: "Responsable de la inspección",
        value: "Alexis",
      },
      {
        label: "Equipos revisados",
        value: "8",
      },
    ],
    evidences: 2,
  },

  "inspection-3": {
    title: "Señalización",
    property: "Centro de distribución",
    date: "13 ago 2026",
    inspector: "Alexis",
    status: "Borrador",
    responses: [
      {
        label: "Responsable de la inspección",
        value: "Alexis",
      },
    ],
    evidences: 0,
  },
} as const;

export default function InspectionDetailsScreen() {
  const { colors } = useAppTheme();

  const { id, inspectionId } = useLocalSearchParams<{
    id: string;
    inspectionId: string;
  }>();

  const inspection =
    inspections[inspectionId as keyof typeof inspections] ??
    inspections["inspection-1"];

  const statusColor =
    inspection.status === "Finalizada"
      ? colors.success
      : inspection.status === "En proceso"
        ? colors.warning
        : colors.textMuted;

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={() =>
            router.navigate({
              pathname: "/empresas/[id]/inspecciones",
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
            ‹ Inspecciones
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
          INSPECCIÓN
        </Text>

        <Text
          style={[
            styles.title,
            {
              color: colors.text,
            },
          ]}
        >
          {inspection.title}
        </Text>

        <Text
          style={[
            styles.property,
            {
              color: colors.textSecondary,
            },
          ]}
        >
          {inspection.property}
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
            ● {inspection.status}
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
            <InfoRow label="Fecha" value={inspection.date} />

            <Divider />

            <InfoRow label="Inspector" value={inspection.inspector} />

            <Divider />

            <InfoRow label="Estado" value={inspection.status} />
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
            Respuestas
          </Text>

          <View style={styles.responseList}>
            {inspection.responses.map((response, index) => (
              <AppCard key={`${response.label}-${index}`}>
                <Text
                  style={[
                    styles.responseLabel,
                    {
                      color: colors.textMuted,
                    },
                  ]}
                >
                  {response.label}
                </Text>

                <Text
                  style={[
                    styles.responseValue,
                    {
                      color: colors.text,
                    },
                  ]}
                >
                  {response.value}
                </Text>
              </AppCard>
            ))}
          </View>
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
            Evidencias
          </Text>

          <AppCard>
            <View style={styles.evidenceRow}>
              <View
                style={[
                  styles.evidenceIcon,
                  {
                    backgroundColor: colors.primarySoft,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.evidenceIconText,
                    {
                      color: colors.primary,
                    },
                  ]}
                >
                  ◫
                </Text>
              </View>

              <View style={styles.evidenceInfo}>
                <Text
                  style={[
                    styles.evidenceTitle,
                    {
                      color: colors.text,
                    },
                  ]}
                >
                  Evidencias fotográficas
                </Text>

                <Text
                  style={[
                    styles.evidenceDescription,
                    {
                      color: colors.textSecondary,
                    },
                  ]}
                >
                  {inspection.evidences} archivos adjuntos
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
          </AppCard>
        </View>

        <View style={styles.actions}>
          {inspection.status !== "Finalizada" && (
            <AppButton>Continuar captura</AppButton>
          )}

          <AppButton variant="secondary">Generar reporte</AppButton>
        </View>

        <Text
          style={[
            styles.prototypeNotice,
            {
              color: colors.textMuted,
            },
          ]}
        >
          Prototipo visual: la generación de reportes todavía no está conectada.
        </Text>
      </ScrollView>
    </Screen>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
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
            color: colors.text,
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

  property: {
    fontSize: FontSize.small,
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

  responseList: {
    gap: Spacing.sm,
  },

  responseLabel: {
    fontSize: FontSize.caption,
    marginBottom: Spacing.sm,
  },

  responseValue: {
    fontSize: FontSize.body,
    fontWeight: "600",
  },

  evidenceRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  evidenceIcon: {
    width: 48,
    height: 48,

    borderRadius: Radius.md,

    alignItems: "center",
    justifyContent: "center",

    marginRight: Spacing.md,
  },

  evidenceIconText: {
    fontSize: FontSize.h3,
    fontWeight: "600",
  },

  evidenceInfo: {
    flex: 1,
  },

  evidenceTitle: {
    fontSize: FontSize.body,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },

  evidenceDescription: {
    fontSize: FontSize.caption,
  },

  arrow: {
    fontSize: 28,
    marginLeft: Spacing.sm,
  },

  actions: {
    gap: Spacing.sm,
  },

  prototypeNotice: {
    fontSize: FontSize.caption,
    textAlign: "center",
    marginTop: Spacing.lg,
  },
});
