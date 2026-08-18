import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { router, useLocalSearchParams } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { Screen } from "@/components/ui/Screen";

import { getCompanyById } from "@/data/companies";
import { getFormsByIds } from "@/data/forms";
import { getInspectionsByPropertyId } from "@/data/inspections";
import { getPropertyById } from "@/data/properties";

import { FontSize, Radius, Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

export default function PropertyDetailsScreen() {
  const { colors } = useAppTheme();

  const { id, propertyId } = useLocalSearchParams<{
    id: string;
    propertyId: string;
  }>();

  const company = getCompanyById(id);
  const property = getPropertyById(propertyId);

  if (!company || !property) {
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
            Inmueble no encontrado
          </Text>

          <Text
            style={[
              styles.notFoundDescription,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            No fue posible encontrar la información del inmueble.
          </Text>
        </View>
      </Screen>
    );
  }

  const propertyForms = getFormsByIds(property.formIds);

  const propertyInspections = getInspectionsByPropertyId(property.id);

  const pendingInspections = propertyInspections.filter(
    (inspection) => inspection.status !== "completed",
  ).length;

  const location = `${property.city}, ${property.state}`;

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* NAVEGACIÓN */}

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

        {/* CONTEXTO DE EMPRESA */}

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

        {/* IDENTIDAD DEL INMUEBLE */}

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
              {location}
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

        {/* RESUMEN */}

        <View style={styles.statsGrid}>
          <SummaryCard
            value={property.workers.toString()}
            label="Trabajadores"
          />

          <SummaryCard
            value={propertyInspections.length.toString()}
            label="Inspecciones"
          />

          <SummaryCard
            value={pendingInspections.toString()}
            label="Pendientes"
            warning={pendingInspections > 0}
          />
        </View>

        <View style={styles.mainAction}>
          <AppButton>+ Nueva inspección</AppButton>
        </View>

        {/* FORMULARIOS */}

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
            {propertyForms.map((form) => (
              <FormCard
                key={form.id}
                title={form.title}
                version={form.version}
                status={form.status === "active" ? "Disponible" : "Inactivo"}
                disabled={form.status !== "active"}
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

          {propertyForms.length === 0 && (
            <AppCard style={styles.emptyCard}>
              <Text
                style={[
                  styles.emptyTitle,
                  {
                    color: colors.text,
                  },
                ]}
              >
                Sin formularios asignados
              </Text>

              <Text
                style={[
                  styles.emptyDescription,
                  {
                    color: colors.textSecondary,
                  },
                ]}
              >
                Este inmueble todavía no tiene formularios disponibles.
              </Text>
            </AppCard>
          )}
        </View>

        {/* INSPECCIONES */}

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

          {propertyInspections.length > 0 ? (
            <AppCard>
              {propertyInspections.slice(0, 3).map((inspection, index) => (
                <View key={inspection.id}>
                  <InspectionRow
                    inspector={inspection.inspector}
                    date={inspection.date}
                    status={inspection.status}
                  />

                  {index < Math.min(propertyInspections.length, 3) - 1 && (
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
          ) : (
            <AppCard>
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
                Todavía no existen inspecciones registradas para este inmueble.
              </Text>
            </AppCard>
          )}
        </View>

        {/* INFORMACIÓN */}

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

            <InformationRow label="Municipio" value={property.city} />

            <Divider />

            <InformationRow label="Estado" value={property.state} />

            {property.address && (
              <>
                <Divider />

                <InformationRow label="Dirección" value={property.address} />
              </>
            )}

            <Divider />

            <InformationRow
              label="Trabajadores registrados"
              value={property.workers.toString()}
            />

            <Divider />

            <InformationRow
              label="Formularios asignados"
              value={propertyForms.length.toString()}
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
  disabled,
  onPress,
}: {
  title: string;
  version: string;
  status: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.formCard,
        {
          backgroundColor: colors.surface,

          borderColor: colors.border,

          opacity: disabled ? 0.5 : pressed ? 0.7 : 1,
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
            v{version}
          </Text>

          <Text
            style={[
              styles.formStatus,
              {
                color: disabled ? colors.textMuted : colors.success,
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
  inspector,
  date,
  status,
}: {
  inspector: string;
  date: string;
  status: "draft" | "in_progress" | "completed";
}) {
  const { colors } = useAppTheme();

  const label =
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
          {inspector}
        </Text>

        <Text
          style={[
            styles.inspectionDate,
            {
              color: colors.textMuted,
            },
          ]}
        >
          {formatDate(date)}
        </Text>
      </View>

      <Text
        style={[
          styles.inspectionStatus,
          {
            color: statusColor,
          },
        ]}
      >
        {label}
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

  topNavigation: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    marginBottom: Spacing.lg,
  },

  backText: {
    fontSize: FontSize.small,
    fontWeight: "600",
  },

  editText: {
    fontSize: FontSize.small,
    fontWeight: "600",
  },

  overline: {
    fontSize: FontSize.caption,
    fontWeight: "700",
    letterSpacing: 1,

    marginBottom: Spacing.md,
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

    marginBottom: Spacing.sm,
  },

  notFoundDescription: {
    fontSize: FontSize.body,
    lineHeight: 24,
  },
});
