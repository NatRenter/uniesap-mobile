import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { router, useLocalSearchParams } from "expo-router";

import { AppCard } from "@/components/ui/AppCard";
import { Screen } from "@/components/ui/Screen";

import { FontSize, Radius, Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

const inspections = [
  {
    id: "inspection-1",
    form: "Análisis de riesgos",
    property: "Sucursal San Luis de la Paz",
    date: "10 ago 2026",
    inspector: "Alexis",
    status: "Finalizada",
  },
  {
    id: "inspection-2",
    form: "Inspección de extintores",
    property: "Sucursal Centro",
    date: "12 ago 2026",
    inspector: "Alexis",
    status: "En proceso",
  },
  {
    id: "inspection-3",
    form: "Señalización",
    property: "Centro de distribución",
    date: "13 ago 2026",
    inspector: "Alexis",
    status: "Borrador",
  },
];

export default function CompanyInspectionsScreen() {
  const { colors } = useAppTheme();

  const { id } = useLocalSearchParams<{
    id: string;
  }>();

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
            styles.title,
            {
              color: colors.text,
            },
          ]}
        >
          Inspecciones
        </Text>

        <Text
          style={[
            styles.subtitle,
            {
              color: colors.textSecondary,
            },
          ]}
        >
          Consulta el historial de capturas realizadas para esta empresa.
        </Text>

        <View style={styles.list}>
          {inspections.map((inspection) => (
            <InspectionCard
              key={inspection.id}
              {...inspection}
              companyId={id}
            />
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

function InspectionCard({
  id,
  form,
  property,
  date,
  inspector,
  status,
  companyId,
}: {
  id: string;
  form: string;
  property: string;
  date: string;
  inspector: string;
  status: string;
  companyId: string;
}) {
  const { colors } = useAppTheme();

  const statusColor =
    status === "Finalizada"
      ? colors.success
      : status === "En proceso"
        ? colors.warning
        : colors.textMuted;

  return (
    <Pressable
      onPress={() =>
        router.navigate({
          pathname: "/empresas/[id]/inspecciones/[inspectionId]",
          params: {
            id: companyId,
            inspectionId: id,
          },
        })
      }
    >
      <AppCard>
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.icon,
              {
                backgroundColor: colors.primarySoft,
              },
            ]}
          >
            <Text
              style={[
                styles.iconText,
                {
                  color: colors.primary,
                },
              ]}
            >
              ✓
            </Text>
          </View>

          <View style={styles.cardInfo}>
            <Text
              style={[
                styles.formTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              {form}
            </Text>

            <Text
              style={[
                styles.property,
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
              styles.status,
              {
                color: statusColor,
              },
            ]}
          >
            {status}
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

        <View style={styles.meta}>
          <Text
            style={[
              styles.metaText,
              {
                color: colors.textMuted,
              },
            ]}
          >
            {date}
          </Text>

          <Text
            style={[
              styles.metaText,
              {
                color: colors.textMuted,
              },
            ]}
          >
            Inspector: {inspector}
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
    marginBottom: Spacing.lg,
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

  list: {
    gap: Spacing.md,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  icon: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },

  iconText: {
    fontSize: FontSize.h3,
    fontWeight: "700",
  },

  cardInfo: {
    flex: 1,
  },

  formTitle: {
    fontSize: FontSize.body,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },

  property: {
    fontSize: FontSize.small,
  },

  status: {
    fontSize: FontSize.caption,
    fontWeight: "700",
  },

  divider: {
    height: 1,
    marginVertical: Spacing.md,
  },

  meta: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  metaText: {
    fontSize: FontSize.caption,
  },
});
