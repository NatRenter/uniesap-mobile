import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { router, useLocalSearchParams } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { Screen } from "@/components/ui/Screen";

import { getCompanyById } from "@/data/companies";
import { getEvidenceById } from "@/data/evidences";
import { getFormById } from "@/data/forms";
import { getInspectionById } from "@/data/inspections";
import { getPropertyById } from "@/data/properties";

import { FontSize, Radius, Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

export default function EvidenceDetailsScreen() {
  const { colors } = useAppTheme();

  const { id, evidenceId } = useLocalSearchParams<{
    id: string;
    evidenceId: string;
  }>();

  const company = getCompanyById(id);
  const evidence = getEvidenceById(evidenceId);

  if (!company || !evidence) {
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
            Evidencia no encontrada
          </Text>

          <Text
            style={[
              styles.notFoundDescription,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            No fue posible encontrar la información de esta evidencia.
          </Text>
        </View>
      </Screen>
    );
  }

  const inspection = getInspectionById(evidence.inspectionId);

  const property = getPropertyById(evidence.propertyId);

  const form = inspection ? getFormById(inspection.formId) : undefined;

  const evidenceStatusLabel =
    evidence.status === "synced" ? "Sincronizada" : "Pendiente";

  const evidenceStatusColor =
    evidence.status === "synced" ? colors.success : colors.warning;

  const evidenceTypeLabel =
    evidence.type === "photo" ? "Fotografía" : "Documento";

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

        {/* TÍTULO */}

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
          {evidenceTypeLabel}
        </Text>

        {/* ESTADO */}

        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: `${evidenceStatusColor}20`,
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              {
                color: evidenceStatusColor,
              },
            ]}
          >
            ● {evidenceStatusLabel}
          </Text>
        </View>

        {/* PREVIEW */}

        <View
          style={[
            styles.preview,
            {
              backgroundColor: colors.surfaceSecondary,

              borderColor: colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.previewIconContainer,
              {
                backgroundColor: colors.primarySoft,
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
              {evidence.type === "photo" ? "▧" : "▤"}
            </Text>
          </View>

          <Text
            style={[
              styles.previewTitle,
              {
                color: colors.text,
              },
            ]}
          >
            {evidence.type === "photo"
              ? "Vista previa de fotografía"
              : "Vista previa del documento"}
          </Text>

          <Text
            style={[
              styles.previewDescription,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            {evidence.remoteUri || evidence.localUri
              ? "El archivo asociado será mostrado aquí."
              : "Este prototipo todavía no contiene el archivo físico asociado."}
          </Text>
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
              label="Inspección"
              value={form?.title ?? "No disponible"}
            />

            <Divider />

            <InfoRow label="Tipo" value={evidenceTypeLabel} />

            <Divider />

            <InfoRow label="Fecha" value={formatDate(evidence.date)} />

            <Divider />

            <InfoRow
              label="Estado"
              value={evidenceStatusLabel}
              valueColor={evidenceStatusColor}
            />
          </AppCard>
        </View>

        {/* DESCRIPCIÓN */}

        {evidence.description && (
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
        )}

        {/* RELACIÓN CON INSPECCIÓN */}

        {inspection && (
          <View style={styles.section}>
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
              style={({ pressed }) => ({
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <AppCard>
                <View style={styles.relatedInspection}>
                  <View
                    style={[
                      styles.relatedIcon,
                      {
                        backgroundColor: colors.primarySoft,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.relatedIconText,
                        {
                          color: colors.primary,
                        },
                      ]}
                    >
                      ✓
                    </Text>
                  </View>

                  <View style={styles.relatedInfo}>
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
        )}

        {/* ACCIONES */}

        <View style={styles.actions}>
          <AppButton variant="secondary">Abrir archivo</AppButton>

          <AppButton variant="ghost">Compartir</AppButton>
        </View>

        <Text
          style={[
            styles.prototypeNotice,
            {
              color: colors.textMuted,
            },
          ]}
        >
          El almacenamiento y apertura real del archivo se implementarán en una
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
  const normalizedDate = date.includes("T") ? date.split("T")[0] : date;

  const parts = normalizedDate.split("-");

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

  type: {
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

  preview: {
    minHeight: 250,

    borderWidth: 1,
    borderRadius: Radius.lg,

    alignItems: "center",
    justifyContent: "center",

    padding: Spacing.xl,

    marginBottom: Spacing.xl,
  },

  previewIconContainer: {
    width: 72,
    height: 72,

    borderRadius: Radius.lg,

    alignItems: "center",
    justifyContent: "center",

    marginBottom: Spacing.md,
  },

  previewIcon: {
    fontSize: 38,
    fontWeight: "600",
  },

  previewTitle: {
    fontSize: FontSize.cardTitle,
    fontWeight: "700",

    textAlign: "center",

    marginBottom: Spacing.sm,
  },

  previewDescription: {
    fontSize: FontSize.small,
    lineHeight: 20,

    textAlign: "center",
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

  relatedInspection: {
    flexDirection: "row",
    alignItems: "center",
  },

  relatedIcon: {
    width: 48,
    height: 48,

    borderRadius: Radius.md,

    alignItems: "center",
    justifyContent: "center",

    marginRight: Spacing.md,
  },

  relatedIconText: {
    fontSize: FontSize.h3,
    fontWeight: "700",
  },

  relatedInfo: {
    flex: 1,
  },

  relatedTitle: {
    fontSize: FontSize.body,
    fontWeight: "700",

    marginBottom: Spacing.xs,
  },

  relatedDescription: {
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
