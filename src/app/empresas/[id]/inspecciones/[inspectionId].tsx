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

import { FontSize, Radius, Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

export default function InspectionDetailsScreen() {
  const { colors } = useAppTheme();

  const { id, inspectionId } = useLocalSearchParams<{
    id: string;
    inspectionId: string;
  }>();

  const company = getCompanyById(id);
  const inspection = getInspectionById(inspectionId);

  if (!company || !inspection) {
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
            Inspección no encontrada
          </Text>

          <Text
            style={[
              styles.notFoundDescription,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            No fue posible encontrar la información de esta inspección.
          </Text>
        </View>
      </Screen>
    );
  }

  const property = getPropertyById(inspection.propertyId);

  const form = getFormById(inspection.formId);

  const inspectionEvidences = getEvidencesByInspectionId(inspection.id);

  const statusLabel =
    inspection.status === "completed"
      ? "Finalizada"
      : inspection.status === "in_progress"
        ? "En proceso"
        : "Borrador";

  const statusColor =
    inspection.status === "completed"
      ? colors.success
      : inspection.status === "in_progress"
        ? colors.warning
        : colors.textMuted;

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

        {/* EMPRESA */}

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

        {/* FORMULARIO */}

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
          {form?.title ?? "Formulario no disponible"}
        </Text>

        <Text
          style={[
            styles.property,
            {
              color: colors.textSecondary,
            },
          ]}
        >
          {property?.name ?? "Inmueble no disponible"}
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

        {/* INFORMACIÓN GENERAL */}

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
            <InfoRow label="Empresa" value={company.name} />

            <Divider />

            <InfoRow
              label="Inmueble"
              value={property?.name ?? "No disponible"}
            />

            <Divider />

            <InfoRow
              label="Formulario"
              value={form?.title ?? "No disponible"}
            />

            <Divider />

            <InfoRow
              label="Versión"
              value={form ? `v${form.version}` : "No disponible"}
            />

            <Divider />

            <InfoRow label="Fecha" value={formatDate(inspection.date)} />

            <Divider />

            <InfoRow label="Inspector" value={inspection.inspector} />

            <Divider />

            <InfoRow
              label="Estado"
              value={statusLabel}
              valueColor={statusColor}
            />
          </AppCard>
        </View>

        {/* RESPUESTAS */}

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

          {inspection.responses.length > 0 ? (
            <View style={styles.responseList}>
              {inspection.responses.map((response) => {
                const question = form?.questions.find(
                  (item) => item.id === response.questionId,
                );

                return (
                  <AppCard key={response.questionId}>
                    <View style={styles.responseHeader}>
                      <View
                        style={[
                          styles.questionBadge,
                          {
                            backgroundColor: colors.primarySoft,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.questionBadgeText,
                            {
                              color: colors.primary,
                            },
                          ]}
                        >
                          ?
                        </Text>
                      </View>

                      <Text
                        style={[
                          styles.responseLabel,
                          {
                            color: colors.textSecondary,
                          },
                        ]}
                      >
                        {question?.label ?? response.questionId}
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.responseValue,
                        {
                          color: colors.text,
                        },
                      ]}
                    >
                      {formatResponseValue(response.value)}
                    </Text>

                    {question && (
                      <Text
                        style={[
                          styles.responseType,
                          {
                            color: colors.textMuted,
                          },
                        ]}
                      >
                        Tipo: {getQuestionTypeLabel(question.type)}
                      </Text>
                    )}
                  </AppCard>
                );
              })}
            </View>
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
                Sin respuestas
              </Text>

              <Text
                style={[
                  styles.emptyDescription,
                  {
                    color: colors.textSecondary,
                  },
                ]}
              >
                Esta inspección todavía no contiene respuestas registradas.
              </Text>
            </AppCard>
          )}
        </View>

        {/* EVIDENCIAS */}

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
                    Evidencias asociadas
                  </Text>

                  <Text
                    style={[
                      styles.evidenceDescription,
                      {
                        color: colors.textSecondary,
                      },
                    ]}
                  >
                    {inspectionEvidences.length} archivo
                    {inspectionEvidences.length !== 1 ? "s" : ""}
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
          </Pressable>
        </View>

        {/* ACCIONES */}

        <View style={styles.actions}>
          {inspection.status !== "completed" && (
            <AppButton>Continuar captura</AppButton>
          )}

          <AppButton
            variant="secondary"
            onPress={() =>
              router.navigate({
                pathname: "/empresas/[id]/reportes/nuevo",
                params: {
                  id,
                  inspectionId: inspection.id,
                },
              })
            }
          >
            Generar reporte
          </AppButton>
        </View>

        <Text
          style={[
            styles.prototypeNotice,
            {
              color: colors.textMuted,
            },
          ]}
        >
          Los datos mostrados ya provienen del modelo centralizado del
          prototipo.
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

function formatResponseValue(value: string | number | boolean | null) {
  if (value === null) {
    return "Sin respuesta";
  }

  if (typeof value === "boolean") {
    return value ? "Sí" : "No";
  }

  return String(value);
}

function getQuestionTypeLabel(
  type: "text" | "textarea" | "number" | "boolean" | "select" | "photo",
) {
  switch (type) {
    case "text":
      return "Texto";

    case "textarea":
      return "Texto largo";

    case "number":
      return "Número";

    case "boolean":
      return "Sí / No";

    case "select":
      return "Selección";

    case "photo":
      return "Fotografía";

    default:
      return type;
  }
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

  responseHeader: {
    flexDirection: "row",
    alignItems: "center",

    marginBottom: Spacing.md,
  },

  questionBadge: {
    width: 32,
    height: 32,

    borderRadius: Radius.full,

    alignItems: "center",
    justifyContent: "center",

    marginRight: Spacing.sm,
  },

  questionBadgeText: {
    fontSize: FontSize.small,
    fontWeight: "700",
  },

  responseLabel: {
    flex: 1,

    fontSize: FontSize.small,
    fontWeight: "600",
  },

  responseValue: {
    fontSize: FontSize.body,
    fontWeight: "700",

    marginBottom: Spacing.sm,
  },

  responseType: {
    fontSize: FontSize.caption,
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
    lineHeight: 18,

    textAlign: "center",

    marginTop: Spacing.lg,
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
