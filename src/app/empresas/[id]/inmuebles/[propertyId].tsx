import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { router, useLocalSearchParams } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { Screen } from "@/components/ui/Screen";

import { FontSize, Radius, Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

const properties = {
  "1": {
    id: "1",
    name: "Sucursal San Luis de la Paz",
    address: "San Luis de la Paz, Guanajuato",
    type: "Sucursal comercial",
    workers: 18,
    inspections: 6,
    pending: 1,
  },

  "2": {
    id: "2",
    name: "Sucursal Centro",
    address: "Dolores Hidalgo, Guanajuato",
    type: "Sucursal comercial",
    workers: 12,
    inspections: 4,
    pending: 0,
  },

  "3": {
    id: "3",
    name: "Centro de distribución",
    address: "San José Iturbide, Guanajuato",
    type: "Centro de distribución",
    workers: 42,
    inspections: 2,
    pending: 1,
  },
} as const;

const forms = [
  {
    id: "form-1",
    title: "Análisis de riesgos",
    version: "v1.0",
    status: "Disponible",
  },

  {
    id: "form-2",
    title: "Inspección de extintores",
    version: "v1.2",
    status: "Disponible",
  },

  {
    id: "form-3",
    title: "Señalización",
    version: "v1.0",
    status: "Disponible",
  },
];

const recentInspections = [
  {
    id: "inspection-1",
    title: "Análisis de riesgos",
    date: "10 ago 2026",
    status: "Finalizada",
  },

  {
    id: "inspection-2",
    title: "Inspección de extintores",
    date: "05 ago 2026",
    status: "En proceso",
  },
];

export default function PropertyDetailsScreen() {
  const { colors } = useAppTheme();

  const { id, propertyId } = useLocalSearchParams<{
    id: string;
    propertyId: string;
  }>();

  const property =
    properties[propertyId as keyof typeof properties] ?? properties["1"];

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topNavigation}>
          <Pressable
            onPress={() =>
              router.navigate({
                pathname: "/empresas/[id]/inmuebles",
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
              ‹ Inmuebles
            </Text>
          </Pressable>

          <Pressable>
            <Text
              style={[
                styles.editText,
                {
                  color: colors.primary,
                },
              ]}
            >
              Editar
            </Text>
          </Pressable>
        </View>

        <View style={styles.header}>
          <View
            style={[
              styles.propertyIcon,
              {
                backgroundColor: colors.primarySoft,
              },
            ]}
          >
            <Text
              style={[
                styles.propertyIconText,
                {
                  color: colors.primary,
                },
              ]}
            >
              ⌂
            </Text>
          </View>

          <View style={styles.headerInfo}>
            <Text
              style={[
                styles.title,
                {
                  color: colors.text,
                },
              ]}
            >
              {property.name}
            </Text>

            <Text
              style={[
                styles.subtitle,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              {property.address}
            </Text>

            <Text
              style={[
                styles.propertyType,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              {property.type}
            </Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <SummaryCard
            value={property.workers.toString()}
            label="Trabajadores"
          />

          <SummaryCard
            value={property.inspections.toString()}
            label="Inspecciones"
          />

          <SummaryCard
            value={property.pending.toString()}
            label="Pendientes"
            warning={property.pending > 0}
          />
        </View>

        <View style={styles.mainAction}>
          <AppButton>+ Nueva inspección</AppButton>
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
            Formularios asignados
          </Text>

          <Text
            style={[
              styles.sectionDescription,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            Selecciona un formulario para iniciar una nueva captura.
          </Text>

          <View style={styles.formList}>
            {forms.map((form) => (
              <FormCard
                key={form.id}
                title={form.title}
                version={form.version}
                status={form.status}
                onPress={() =>
                  router.navigate({
                    pathname: "/empresas/[id]/inmuebles/[propertyId]/captura",
                    params: {
                      id,
                      propertyId,
                      formId: form.id,
                    },
                  })
                }
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text
              style={[
                styles.sectionTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              Inspecciones recientes
            </Text>

            <Pressable>
              <Text
                style={[
                  styles.link,
                  {
                    color: colors.primary,
                  },
                ]}
              >
                Ver todas
              </Text>
            </Pressable>
          </View>

          <AppCard>
            {recentInspections.map((inspection, index) => (
              <View key={inspection.id}>
                <InspectionRow
                  title={inspection.title}
                  date={inspection.date}
                  status={inspection.status}
                />

                {index < recentInspections.length - 1 && (
                  <View
                    style={[
                      styles.divider,
                      {
                        backgroundColor: colors.divider,
                      },
                    ]}
                  />
                )}
              </View>
            ))}
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
            Información del inmueble
          </Text>

          <AppCard>
            <InformationRow label="Nombre" value={property.name} />

            <Divider />

            <InformationRow label="Tipo" value={property.type} />

            <Divider />

            <InformationRow label="Ubicación" value={property.address} />

            <Divider />

            <InformationRow
              label="Trabajadores registrados"
              value={property.workers.toString()}
            />
          </AppCard>
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

function FormCard({
  title,
  version,
  status,
  onPress,
}: {
  title: string;
  version: string;
  status: string;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.formCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.formIcon,
          {
            backgroundColor: colors.primarySoft,
          },
        ]}
      >
        <Text
          style={[
            styles.formIconText,
            {
              color: colors.primary,
            },
          ]}
        >
          ≡
        </Text>
      </View>

      <View style={styles.formInformation}>
        <Text
          style={[
            styles.formTitle,
            {
              color: colors.text,
            },
          ]}
        >
          {title}
        </Text>

        <View style={styles.formMeta}>
          <Text
            style={[
              styles.formVersion,
              {
                color: colors.textMuted,
              },
            ]}
          >
            {version}
          </Text>

          <Text
            style={[
              styles.formStatus,
              {
                color: colors.success,
              },
            ]}
          >
            ● {status}
          </Text>
        </View>
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
    </Pressable>
  );
}

function InspectionRow({
  title,
  date,
  status,
}: {
  title: string;
  date: string;
  status: string;
}) {
  const { colors } = useAppTheme();

  const isCompleted = status === "Finalizada";

  return (
    <View style={styles.inspectionRow}>
      <View style={styles.inspectionInfo}>
        <Text
          style={[
            styles.inspectionTitle,
            {
              color: colors.text,
            },
          ]}
        >
          {title}
        </Text>

        <Text
          style={[
            styles.inspectionDate,
            {
              color: colors.textMuted,
            },
          ]}
        >
          {date}
        </Text>
      </View>

      <Text
        style={[
          styles.inspectionStatus,
          {
            color: isCompleted ? colors.success : colors.warning,
          },
        ]}
      >
        {status}
      </Text>
    </View>
  );
}

function InformationRow({ label, value }: { label: string; value: string }) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.informationRow}>
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

  topNavigation: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    marginBottom: Spacing.xl,
  },

  backText: {
    fontSize: FontSize.small,
    fontWeight: "600",
  },

  editText: {
    fontSize: FontSize.small,
    fontWeight: "600",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",

    marginBottom: Spacing.xl,
  },

  propertyIcon: {
    width: 72,
    height: 72,

    borderRadius: Radius.lg,

    alignItems: "center",
    justifyContent: "center",

    marginRight: Spacing.md,
  },

  propertyIconText: {
    fontSize: FontSize.h2,
    fontWeight: "600",
  },

  headerInfo: {
    flex: 1,
  },

  title: {
    fontSize: FontSize.h2,
    fontWeight: "700",

    marginBottom: Spacing.xs,
  },

  subtitle: {
    fontSize: FontSize.small,

    marginBottom: Spacing.xs,
  },

  propertyType: {
    fontSize: FontSize.caption,
  },

  statsGrid: {
    flexDirection: "row",
    gap: Spacing.sm,

    marginBottom: Spacing.lg,
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

  mainAction: {
    marginBottom: Spacing.xl,
  },

  section: {
    marginBottom: Spacing.xl,
  },

  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  sectionTitle: {
    fontSize: FontSize.cardTitle,
    fontWeight: "700",

    marginBottom: Spacing.xs,
  },

  sectionDescription: {
    fontSize: FontSize.small,
    lineHeight: 20,

    marginBottom: Spacing.md,
  },

  link: {
    fontSize: FontSize.small,
    fontWeight: "600",
  },

  formList: {
    gap: Spacing.sm,

    marginTop: Spacing.md,
  },

  formCard: {
    minHeight: 82,

    flexDirection: "row",
    alignItems: "center",

    padding: Spacing.md,

    borderWidth: 1,
    borderRadius: Radius.lg,
  },

  formIcon: {
    width: 44,
    height: 44,

    borderRadius: Radius.md,

    alignItems: "center",
    justifyContent: "center",

    marginRight: Spacing.md,
  },

  formIconText: {
    fontSize: FontSize.h3,
    fontWeight: "600",
  },

  formInformation: {
    flex: 1,
  },

  formTitle: {
    fontSize: FontSize.body,
    fontWeight: "600",

    marginBottom: Spacing.xs,
  },

  formMeta: {
    flexDirection: "row",
    gap: Spacing.md,
  },

  formVersion: {
    fontSize: FontSize.caption,
  },

  formStatus: {
    fontSize: FontSize.caption,
  },

  arrow: {
    fontSize: 28,

    marginLeft: Spacing.sm,
  },

  inspectionRow: {
    flexDirection: "row",
    alignItems: "center",

    paddingVertical: Spacing.sm,
  },

  inspectionInfo: {
    flex: 1,
  },

  inspectionTitle: {
    fontSize: FontSize.small,
    fontWeight: "600",

    marginBottom: Spacing.xs,
  },

  inspectionDate: {
    fontSize: FontSize.caption,
  },

  inspectionStatus: {
    fontSize: FontSize.caption,
    fontWeight: "600",
  },

  informationRow: {
    paddingVertical: Spacing.sm,
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

    marginVertical: Spacing.sm,
  },
});
