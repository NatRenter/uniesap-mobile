import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { router, useLocalSearchParams } from "expo-router";

import { AppCard } from "@/components/ui/AppCard";
import { Screen } from "@/components/ui/Screen";

import { FontSize, Radius, Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

const evidences = [
  {
    id: "evidence-1",
    title: "Extintor área de ventas",
    type: "Fotografía",
    inspection: "Inspección de extintores",
    property: "Sucursal San Luis de la Paz",
    date: "10 ago 2026",
    status: "Sincronizada",
  },
  {
    id: "evidence-2",
    title: "Condición de ruta de evacuación",
    type: "Fotografía",
    inspection: "Análisis de riesgos",
    property: "Sucursal San Luis de la Paz",
    date: "10 ago 2026",
    status: "Sincronizada",
  },
  {
    id: "evidence-3",
    title: "Señalización preventiva",
    type: "Fotografía",
    inspection: "Señalización",
    property: "Centro de distribución",
    date: "13 ago 2026",
    status: "Pendiente",
  },
  {
    id: "evidence-4",
    title: "Documento complementario",
    type: "Documento",
    inspection: "Análisis de riesgos",
    property: "Sucursal Centro",
    date: "12 ago 2026",
    status: "Sincronizada",
  },
];

export default function CompanyEvidenceScreen() {
  const { colors } = useAppTheme();

  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const total = evidences.length;

  const photos = evidences.filter(
    (evidence) => evidence.type === "Fotografía",
  ).length;

  const pending = evidences.filter(
    (evidence) => evidence.status === "Pendiente",
  ).length;

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* NAVEGACIÓN */}

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

        {/* ENCABEZADO */}

        <Text
          style={[
            styles.title,
            {
              color: colors.text,
            },
          ]}
        >
          Evidencias
        </Text>

        <Text
          style={[
            styles.subtitle,
            {
              color: colors.textSecondary,
            },
          ]}
        >
          Fotografías y documentos recopilados durante las inspecciones.
        </Text>

        {/* RESUMEN */}

        <View style={styles.summary}>
          <SummaryCard value={total.toString()} label="Archivos" />

          <SummaryCard value={photos.toString()} label="Fotografías" />

          <SummaryCard
            value={pending.toString()}
            label="Pendientes"
            warning={pending > 0}
          />
        </View>

        {/* LISTADO */}

        <Text
          style={[
            styles.sectionTitle,
            {
              color: colors.text,
            },
          ]}
        >
          Archivos recientes
        </Text>

        <View style={styles.list}>
          {evidences.map((evidence) => (
            <EvidenceCard key={evidence.id} {...evidence} companyId={id} />
          ))}
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

function EvidenceCard({
  id,
  title,
  type,
  inspection,
  property,
  date,
  status,
  companyId,
}: {
  id: string;
  title: string;
  type: string;
  inspection: string;
  property: string;
  date: string;
  status: string;
  companyId: string;
}) {
  const { colors } = useAppTheme();

  const synchronized = status === "Sincronizada";

  return (
    <Pressable
      onPress={() =>
        router.navigate({
          pathname: "/empresas/[id]/evidencias/[evidenceId]",
          params: {
            id: companyId,
            evidenceId: id,
          },
        })
      }
    >
      <AppCard>
        <View style={styles.cardHeader}>
          {/* MINIATURA SIMULADA */}

          <View
            style={[
              styles.thumbnail,
              {
                backgroundColor: colors.primarySoft,
              },
            ]}
          >
            <Text
              style={[
                styles.thumbnailIcon,
                {
                  color: colors.primary,
                },
              ]}
            >
              {type === "Fotografía" ? "▧" : "▤"}
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
              {title}
            </Text>

            <Text
              style={[
                styles.evidenceType,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              {type}
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

        <Text
          style={[
            styles.property,
            {
              color: colors.textMuted,
            },
          ]}
        >
          {property}
        </Text>

        <View style={styles.meta}>
          <Text
            style={[
              styles.date,
              {
                color: colors.textMuted,
              },
            ]}
          >
            {date}
          </Text>

          <Text
            style={[
              styles.status,
              {
                color: synchronized ? colors.success : colors.warning,
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

  sectionTitle: {
    fontSize: FontSize.cardTitle,
    fontWeight: "700",
    marginBottom: Spacing.md,
  },

  list: {
    gap: Spacing.md,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  thumbnail: {
    width: 56,
    height: 56,

    borderRadius: Radius.md,

    alignItems: "center",
    justifyContent: "center",

    marginRight: Spacing.md,
  },

  thumbnailIcon: {
    fontSize: FontSize.h2,
    fontWeight: "600",
  },

  evidenceInfo: {
    flex: 1,
  },

  evidenceTitle: {
    fontSize: FontSize.body,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },

  evidenceType: {
    fontSize: FontSize.caption,
  },

  arrow: {
    fontSize: 28,
    marginLeft: Spacing.sm,
  },

  divider: {
    height: 1,
    marginVertical: Spacing.md,
  },

  inspection: {
    fontSize: FontSize.small,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },

  property: {
    fontSize: FontSize.caption,
    marginBottom: Spacing.md,
  },

  meta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  date: {
    fontSize: FontSize.caption,
  },

  status: {
    fontSize: FontSize.caption,
    fontWeight: "600",
  },
});
