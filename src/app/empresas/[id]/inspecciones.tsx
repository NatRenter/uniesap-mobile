import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { router, useLocalSearchParams } from "expo-router";

import { AppCard } from "@/components/ui/AppCard";
import { Screen } from "@/components/ui/Screen";

import { getCompanyById } from "@/data/companies";
import { getFormById } from "@/data/forms";
import { getInspectionsByCompanyId } from "@/data/inspections";
import { getPropertyById } from "@/data/properties";

import { FontSize, Radius, Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

export default function CompanyInspectionsScreen() {
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

  const companyInspections = getInspectionsByCompanyId(company.id);

  const completed = companyInspections.filter(
    (inspection) => inspection.status === "completed",
  ).length;

  const inProgress = companyInspections.filter(
    (inspection) => inspection.status === "in_progress",
  ).length;

  const drafts = companyInspections.filter(
    (inspection) => inspection.status === "draft",
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

        <View style={styles.summary}>
          <SummaryCard value={completed.toString()} label="Finalizadas" />

          <SummaryCard
            value={inProgress.toString()}
            label="En proceso"
            warning={inProgress > 0}
          />

          <SummaryCard value={drafts.toString()} label="Borradores" />
        </View>

        <Text
          style={[
            styles.sectionTitle,
            {
              color: colors.text,
            },
          ]}
        >
          Historial
        </Text>

        <View style={styles.list}>
          {companyInspections.map((inspection) => {
            const property = getPropertyById(inspection.propertyId);

            const form = getFormById(inspection.formId);

            return (
              <InspectionCard
                key={inspection.id}
                inspectionId={inspection.id}
                companyRouteId={id}
                form={form?.title ?? "Formulario no disponible"}
                property={property?.name ?? "Inmueble no disponible"}
                date={inspection.date}
                inspector={inspection.inspector}
                status={inspection.status}
              />
            );
          })}
        </View>

        {companyInspections.length === 0 && (
          <AppCard style={styles.emptyCard}>
            <Text
              style={[
                styles.emptyTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              Sin inspecciones
            </Text>

            <Text
              style={[
                styles.emptyDescription,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              Todavía no existen inspecciones registradas para esta empresa.
            </Text>
          </AppCard>
        )}
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

function InspectionCard({
  inspectionId,
  companyRouteId,
  form,
  property,
  date,
  inspector,
  status,
}: {
  inspectionId: string;
  companyRouteId: string;
  form: string;
  property: string;
  date: string;
  inspector: string;
  status: "draft" | "in_progress" | "completed";
}) {
  const { colors } = useAppTheme();

  const statusLabel =
    status === "completed"
      ? "Finalizada"
      : status === "in_progress"
        ? "En proceso"
        : "Borrador";

  const statusColor =
    status === "completed"
      ? colors.success
      : status === "in_progress"
        ? colors.warning
        : colors.textMuted;

  return (
    <Pressable
      onPress={() =>
        router.navigate({
          pathname: "/empresas/[id]/inspecciones/[inspectionId]",
          params: {
            id: companyRouteId,
            inspectionId,
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

        <View style={styles.meta}>
          <View>
            <Text
              style={[
                styles.metaText,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              {formatDate(date)}
            </Text>

            <Text
              style={[
                styles.inspector,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              Inspector: {inspector}
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
            ● {statusLabel}
          </Text>
        </View>
      </AppCard>
    </Pressable>
  );
}

function formatDate(date: string) {
  const parts = date.split("-");

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

  arrow: {
    fontSize: 28,
    marginLeft: Spacing.sm,
  },

  divider: {
    height: 1,
    marginVertical: Spacing.md,
  },

  meta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  metaText: {
    fontSize: FontSize.caption,
    marginBottom: Spacing.xs,
  },

  inspector: {
    fontSize: FontSize.caption,
  },

  status: {
    fontSize: FontSize.caption,
    fontWeight: "700",
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
