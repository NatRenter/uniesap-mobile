import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { router, useLocalSearchParams } from "expo-router";

import { AppCard } from "@/components/ui/AppCard";
import { Screen } from "@/components/ui/Screen";

import { getCompanyById } from "@/data/companies";
import { getEvidencesByCompanyId } from "@/data/evidences";
import { getFormById } from "@/data/forms";
import { getInspectionById } from "@/data/inspections";
import { getPropertyById } from "@/data/properties";

import { FontSize, Radius, Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

export default function CompanyEvidencesScreen() {
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

  const companyEvidences = getEvidencesByCompanyId(company.id);

  const photoCount = companyEvidences.filter(
    (evidence) => evidence.type === "photo",
  ).length;

  const documentCount = companyEvidences.filter(
    (evidence) => evidence.type === "document",
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

        {/* EMPRESA */}

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
          <SummaryCard
            value={companyEvidences.length.toString()}
            label="Total"
          />

          <SummaryCard value={photoCount.toString()} label="Fotografías" />
          <SummaryCard value={documentCount.toString()} label="Documentos" />
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
          Archivos
        </Text>

        <View style={styles.list}>
          {companyEvidences.map((evidence) => {
            const inspection = getInspectionById(evidence.inspectionId);

            const property = inspection
              ? getPropertyById(inspection.propertyId)
              : undefined;

            const form = inspection
              ? getFormById(inspection.formId)
              : undefined;

            return (
              <EvidenceCard
                key={evidence.id}
                companyRouteId={id}
                evidenceId={evidence.id}
                title={evidence.title}
                type={evidence.type}
                date={evidence.date}
                property={property?.name ?? "Inmueble no disponible"}
                form={form?.title ?? "Formulario no disponible"}
              />
            );
          })}
        </View>

        {/* ESTADO VACÍO */}

        {companyEvidences.length === 0 && (
          <AppCard style={styles.emptyCard}>
            <Text
              style={[
                styles.emptyTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              Sin evidencias
            </Text>

            <Text
              style={[
                styles.emptyDescription,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              Todavía no existen fotografías o documentos asociados a las
              inspecciones de esta empresa.
            </Text>
          </AppCard>
        )}
      </ScrollView>
    </Screen>
  );
}

function SummaryCard({ value, label }: { value: string; label: string }) {
  const { colors } = useAppTheme();

  return (
    <AppCard style={styles.summaryCard}>
      <Text
        style={[
          styles.summaryValue,
          {
            color: colors.text,
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
  companyRouteId,
  evidenceId,
  title,
  type,
  date,
  property,
  form,
}: {
  companyRouteId: string;
  evidenceId: string;
  title: string;
  type: "photo" | "document";
  date: string;
  property: string;
  form: string;
}) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      onPress={() =>
        router.navigate({
          pathname: "/empresas/[id]/evidencias/[evidenceId]",
          params: {
            id: companyRouteId,
            evidenceId,
          },
        })
      }
      style={({ pressed }) => ({
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <AppCard>
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.fileIcon,
              {
                backgroundColor: colors.primarySoft,
              },
            ]}
          >
            <Text
              style={[
                styles.fileIconText,
                {
                  color: colors.primary,
                },
              ]}
            >
              {type === "photo" ? "▧" : "▤"}
            </Text>
          </View>

          <View style={styles.fileInfo}>
            <Text
              style={[
                styles.fileName,
                {
                  color: colors.text,
                },
              ]}
            >
              {title}
            </Text>

            <Text
              style={[
                styles.fileType,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              {type === "photo" ? "Imagen" : "Documento"}
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

        <View style={styles.metadata}>
          <MetadataRow label="Inmueble" value={property} />

          <MetadataRow label="Formulario" value={form} />

          <MetadataRow label="Fecha" value={formatDate(date)} />
        </View>
      </AppCard>
    </Pressable>
  );
}

function MetadataRow({ label, value }: { label: string; value: string }) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.metadataRow}>
      <Text
        style={[
          styles.metadataLabel,
          {
            color: colors.textMuted,
          },
        ]}
      >
        {label}
      </Text>

      <Text
        style={[
          styles.metadataValue,
          {
            color: colors.textSecondary,
          },
        ]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
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

  fileIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },

  fileIconText: {
    fontSize: FontSize.h3,
    fontWeight: "700",
  },

  fileInfo: {
    flex: 1,
  },

  fileName: {
    fontSize: FontSize.body,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },

  fileType: {
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

  metadata: {
    gap: Spacing.sm,
  },

  metadataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.md,
  },

  metadataLabel: {
    fontSize: FontSize.caption,
  },

  metadataValue: {
    flex: 1,
    textAlign: "right",
    fontSize: FontSize.caption,
    fontWeight: "500",
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
