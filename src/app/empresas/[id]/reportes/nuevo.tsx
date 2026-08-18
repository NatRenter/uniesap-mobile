import { useState } from "react";

import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import { router, useLocalSearchParams } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { Screen } from "@/components/ui/Screen";

import { getCompanyById } from "@/data/companies";
import { getEvidencesByInspectionId } from "@/data/evidences";
import { getFormById } from "@/data/forms";
import {
  getInspectionById,
  getInspectionsByCompanyId,
} from "@/data/inspections";
import { getPropertyById } from "@/data/properties";

import { FontSize, Radius, Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

type ReportFormatOption = "excel" | "pdf";

export default function NewReportScreen() {
  const { colors } = useAppTheme();

  const { id, inspectionId: routeInspectionId } = useLocalSearchParams<{
    id: string;
    inspectionId?: string;
  }>();

  /*
   * Obtenemos la empresa.
   *
   * IMPORTANTE:
   * No hacemos return todavía porque
   * primero deben ejecutarse todos
   * los hooks del componente.
   */
  const company = getCompanyById(id);

  /*
   * Si la empresa existe obtenemos
   * sus inspecciones.
   *
   * Si no existe, devolvemos un array
   * vacío temporalmente.
   */
  const companyInspections = company
    ? getInspectionsByCompanyId(company.id)
    : [];

  /*
   * Si llegamos desde el detalle de
   * una inspección:
   *
   * /reportes/nuevo?inspectionId=...
   *
   * utilizamos esa inspección.
   *
   * De lo contrario seleccionamos
   * inicialmente la primera.
   */
  const initialInspectionId =
    routeInspectionId && getInspectionById(routeInspectionId)
      ? routeInspectionId
      : companyInspections[0]?.id;

  /*
   * HOOK 1
   */
  const [selectedInspectionId, setSelectedInspectionId] = useState<
    string | undefined
  >(initialInspectionId);

  /*
   * HOOK 2
   */
  const [selectedFormat, setSelectedFormat] =
    useState<ReportFormatOption>("excel");

  /*
   * HOOK 3
   */
  const [includeEvidence, setIncludeEvidence] = useState(true);

  /*
   * Inspección actualmente
   * seleccionada.
   */
  const selectedInspection = selectedInspectionId
    ? getInspectionById(selectedInspectionId)
    : undefined;

  /*
   * Resolvemos el inmueble
   * relacionado.
   */
  const selectedProperty = selectedInspection
    ? getPropertyById(selectedInspection.propertyId)
    : undefined;

  /*
   * Resolvemos el formulario
   * relacionado.
   */
  const selectedForm = selectedInspection
    ? getFormById(selectedInspection.formId)
    : undefined;

  /*
   * Obtenemos las evidencias reales
   * asociadas a la inspección.
   */
  const selectedEvidences = selectedInspection
    ? getEvidencesByInspectionId(selectedInspection.id)
    : [];

  /*
   * HOOK 4
   *
   * Generamos dinámicamente
   * el nombre del reporte.
   */
  const reportTitle = selectedForm
    ? `Reporte de ${selectedForm.title}`
    : "Nuevo reporte";

  /*
   * IMPORTANTE:
   *
   * Este return está DESPUÉS
   * de useState y useMemo.
   *
   * Esto evita el error:
   *
   * React Hook "useState"
   * is called conditionally.
   */
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

  /*
   * Generación simulada.
   *
   * Más adelante esta función
   * llamará al servicio real de
   * generación de reportes.
   */
  const handleGenerate = () => {
    if (!selectedInspection) {
      return;
    }

    router.navigate({
      pathname: "/empresas/[id]/reportes",

      params: {
        id,
      },
    });
  };

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
              pathname: "/empresas/[id]/reportes",

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
            ‹ Reportes
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

        {/* ENCABEZADO */}

        <Text
          style={[
            styles.title,
            {
              color: colors.text,
            },
          ]}
        >
          Generar reporte
        </Text>

        <Text
          style={[
            styles.subtitle,
            {
              color: colors.textSecondary,
            },
          ]}
        >
          Selecciona la inspección y configura el contenido del reporte.
        </Text>

        {/* SELECCIÓN DE INSPECCIÓN */}

        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: colors.text,
              },
            ]}
          >
            Seleccionar inspección
          </Text>

          <Text
            style={[
              styles.sectionDescription,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            El reporte se construirá a partir de la información capturada en una
            inspección.
          </Text>

          <View style={styles.inspectionList}>
            {companyInspections.map((inspection) => {
              const property = getPropertyById(inspection.propertyId);

              const form = getFormById(inspection.formId);

              const selected = inspection.id === selectedInspectionId;

              return (
                <InspectionOption
                  key={inspection.id}
                  title={form?.title ?? "Formulario no disponible"}
                  property={property?.name ?? "Inmueble no disponible"}
                  date={inspection.date}
                  status={inspection.status}
                  selected={selected}
                  onPress={() => setSelectedInspectionId(inspection.id)}
                />
              );
            })}
          </View>

          {companyInspections.length === 0 && (
            <AppCard>
              <Text
                style={[
                  styles.emptyTitle,
                  {
                    color: colors.text,
                  },
                ]}
              >
                Sin inspecciones disponibles
              </Text>

              <Text
                style={[
                  styles.emptyDescription,
                  {
                    color: colors.textSecondary,
                  },
                ]}
              >
                Esta empresa todavía no tiene inspecciones registradas.
              </Text>
            </AppCard>
          )}
        </View>

        {/* RESTO DE OPCIONES */}

        {selectedInspection && (
          <>
            {/* FORMATO */}

            <View style={styles.section}>
              <Text
                style={[
                  styles.sectionTitle,
                  {
                    color: colors.text,
                  },
                ]}
              >
                Formato
              </Text>

              <View style={styles.formatRow}>
                <FormatOption
                  label="Excel"
                  selected={selectedFormat === "excel"}
                  onPress={() => setSelectedFormat("excel")}
                />

                <FormatOption
                  label="PDF"
                  selected={selectedFormat === "pdf"}
                  onPress={() => setSelectedFormat("pdf")}
                />
              </View>
            </View>

            {/* CONTENIDO */}

            <View style={styles.section}>
              <Text
                style={[
                  styles.sectionTitle,
                  {
                    color: colors.text,
                  },
                ]}
              >
                Contenido
              </Text>

              <AppCard>
                <View style={styles.optionRow}>
                  <View style={styles.optionInfo}>
                    <Text
                      style={[
                        styles.optionTitle,
                        {
                          color: colors.text,
                        },
                      ]}
                    >
                      Incluir evidencias
                    </Text>

                    <Text
                      style={[
                        styles.optionDescription,
                        {
                          color: colors.textSecondary,
                        },
                      ]}
                    >
                      Agrega las fotografías y documentos relacionados con la
                      inspección.
                    </Text>
                  </View>

                  <Switch
                    value={includeEvidence}
                    onValueChange={setIncludeEvidence}
                  />
                </View>
              </AppCard>
            </View>

            {/* RESUMEN */}

            <View style={styles.section}>
              <Text
                style={[
                  styles.sectionTitle,
                  {
                    color: colors.text,
                  },
                ]}
              >
                Resumen
              </Text>

              <AppCard>
                <InfoRow label="Empresa" value={company.name} />

                <Divider />

                <InfoRow
                  label="Inmueble"
                  value={selectedProperty?.name ?? "No disponible"}
                />

                <Divider />

                <InfoRow
                  label="Inspección"
                  value={selectedForm?.title ?? "No disponible"}
                />

                <Divider />

                <InfoRow label="Reporte" value={reportTitle} />

                <Divider />

                <InfoRow
                  label="Formato"
                  value={selectedFormat === "excel" ? "Excel" : "PDF"}
                />

                <Divider />

                <InfoRow
                  label="Evidencias disponibles"
                  value={selectedEvidences.length.toString()}
                />

                <Divider />

                <InfoRow
                  label="Incluir evidencias"
                  value={includeEvidence ? "Sí" : "No"}
                />
              </AppCard>
            </View>

            {/* ACCIONES */}

            <View style={styles.actions}>
              <AppButton onPress={handleGenerate}>Generar reporte</AppButton>

              <AppButton
                variant="ghost"
                onPress={() =>
                  router.navigate({
                    pathname: "/empresas/[id]/reportes",

                    params: {
                      id,
                    },
                  })
                }
              >
                Cancelar
              </AppButton>
            </View>
          </>
        )}

        <Text
          style={[
            styles.prototypeNotice,
            {
              color: colors.textMuted,
            },
          ]}
        >
          Prototipo visual: la generación del archivo todavía no está conectada
          al servicio real.
        </Text>
      </ScrollView>
    </Screen>
  );
}

/* -------------------------------------------------------------------------- */
/*                              INSPECTION OPTION                             */
/* -------------------------------------------------------------------------- */

function InspectionOption({
  title,
  property,
  date,
  status,
  selected,
  onPress,
}: {
  title: string;
  property: string;
  date: string;

  status: "draft" | "in_progress" | "completed";

  selected: boolean;

  onPress: () => void;
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
      onPress={onPress}
      style={({ pressed }) => [
        styles.inspectionOption,

        {
          backgroundColor: colors.surface,

          borderColor: selected ? colors.primary : colors.border,

          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.radio,

          {
            borderColor: selected ? colors.primary : colors.textMuted,
          },
        ]}
      >
        {selected && (
          <View
            style={[
              styles.radioInner,

              {
                backgroundColor: colors.primary,
              },
            ]}
          />
        )}
      </View>

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
            styles.inspectionProperty,

            {
              color: colors.textSecondary,
            },
          ]}
        >
          {property}
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
        {statusLabel}
      </Text>
    </Pressable>
  );
}

/* -------------------------------------------------------------------------- */
/*                                FORMAT OPTION                               */
/* -------------------------------------------------------------------------- */

function FormatOption({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.formatOption,

        {
          backgroundColor: selected ? colors.primarySoft : colors.surface,

          borderColor: selected ? colors.primary : colors.border,
        },
      ]}
    >
      <Text
        style={[
          styles.formatLabel,

          {
            color: selected ? colors.primary : colors.text,
          },
        ]}
      >
        {label}
      </Text>

      <Text
        style={[
          styles.formatSelection,

          {
            color: selected ? colors.primary : colors.textMuted,
          },
        ]}
      >
        {selected ? "● Seleccionado" : "○ Seleccionar"}
      </Text>
    </Pressable>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  INFO ROW                                  */
/* -------------------------------------------------------------------------- */

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

function formatDate(date: string) {
  const normalized = date.includes("T") ? date.split("T")[0] : date;

  const parts = normalized.split("-");

  if (parts.length !== 3) {
    return date;
  }

  const [year, month, day] = parts;

  return `${day}/${month}/${year}`;
}

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

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

  section: {
    marginBottom: Spacing.xl,
  },

  sectionTitle: {
    fontSize: FontSize.cardTitle,

    fontWeight: "700",

    marginBottom: Spacing.sm,
  },

  sectionDescription: {
    fontSize: FontSize.small,

    lineHeight: 20,

    marginBottom: Spacing.md,
  },

  inspectionList: {
    gap: Spacing.sm,
  },

  inspectionOption: {
    minHeight: 92,

    flexDirection: "row",

    alignItems: "center",

    borderWidth: 1,

    borderRadius: Radius.lg,

    padding: Spacing.md,
  },

  radio: {
    width: 22,

    height: 22,

    borderRadius: Radius.full,

    borderWidth: 2,

    alignItems: "center",

    justifyContent: "center",

    marginRight: Spacing.md,
  },

  radioInner: {
    width: 10,

    height: 10,

    borderRadius: Radius.full,
  },

  inspectionInfo: {
    flex: 1,
  },

  inspectionTitle: {
    fontSize: FontSize.body,

    fontWeight: "700",

    marginBottom: Spacing.xs,
  },

  inspectionProperty: {
    fontSize: FontSize.caption,

    marginBottom: Spacing.xs,
  },

  inspectionDate: {
    fontSize: FontSize.caption,
  },

  inspectionStatus: {
    fontSize: FontSize.caption,

    fontWeight: "700",

    marginLeft: Spacing.md,
  },

  formatRow: {
    flexDirection: "row",

    gap: Spacing.md,
  },

  formatOption: {
    flex: 1,

    borderWidth: 1,

    borderRadius: Radius.lg,

    padding: Spacing.lg,
  },

  formatLabel: {
    fontSize: FontSize.body,

    fontWeight: "700",

    marginBottom: Spacing.sm,
  },

  formatSelection: {
    fontSize: FontSize.caption,
  },

  optionRow: {
    flexDirection: "row",

    alignItems: "center",
  },

  optionInfo: {
    flex: 1,

    marginRight: Spacing.md,
  },

  optionTitle: {
    fontSize: FontSize.body,

    fontWeight: "700",

    marginBottom: Spacing.xs,
  },

  optionDescription: {
    fontSize: FontSize.caption,

    lineHeight: 19,
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
  },
});
