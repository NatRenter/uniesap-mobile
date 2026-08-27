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
import { ResponsiveContainer } from "@/components/ui/ResponsiveContainer";
import { ResponsiveGrid } from "@/components/ui/ResponsiveGrid";
import { Screen } from "@/components/ui/Screen";

import { getCompanyById } from "@/repositories/companyRepository";
import { getEvidencesByInspectionId } from "@/repositories/evidenceRepository";
import { getFormById } from "@/data/forms";
import {
  getInspectionById,
  getInspectionsByCompanyId,
} from "@/repositories/inspectionRepository";
import { getPropertyById } from "@/repositories/propertyRepository";

import { FontSize, Radius, Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";
import { useResponsive } from "@/hooks/useResponsive";

type ReportFormatOption = "excel" | "pdf";

export default function NewReportScreen() {
  const { colors } = useAppTheme();

  /*
   * useResponsive nos permite modificar Ãºnicamente
   * aquellas zonas donde un grid normal no es suficiente.
   *
   * AquÃ­ lo utilizaremos principalmente para construir
   * el layout principal de configuraciÃ³n + resumen.
   */
  const { isPhone } = useResponsive();

  /*
   * ParÃ¡metros recibidos desde Expo Router.
   *
   * inspectionId es opcional porque esta pantalla puede abrirse:
   *
   * 1. Desde Reportes.
   * 2. Directamente desde una inspecciÃ³n.
   */
  const { id, inspectionId: routeInspectionId } = useLocalSearchParams<{
    id: string;
    inspectionId?: string;
  }>();

  /*
   * Recuperamos la empresa.
   *
   * IMPORTANTE:
   * todavÃ­a NO hacemos return porque todos los Hooks
   * deben ejecutarse siempre en el mismo orden.
   */
  const company = getCompanyById(id);

  /*
   * Recuperamos las inspecciones de la empresa.
   *
   * Si la empresa no existe utilizamos temporalmente
   * un arreglo vacÃ­o.
   */
  const companyInspections = company
    ? getInspectionsByCompanyId(company.id)
    : [];

  /*
   * Si la pantalla recibiÃ³ inspectionId y esa inspecciÃ³n
   * existe, la seleccionamos automÃ¡ticamente.
   *
   * De lo contrario utilizamos la primera disponible.
   */
  const initialInspectionId =
    routeInspectionId && getInspectionById(routeInspectionId)
      ? routeInspectionId
      : companyInspections[0]?.id;

  /* ---------------------------------------------------------------------- */
  /*                                ESTADO                                  */
  /* ---------------------------------------------------------------------- */

  /*
   * InspecciÃ³n que alimentarÃ¡ el reporte.
   */
  const [selectedInspectionId, setSelectedInspectionId] = useState<
    string | undefined
  >(initialInspectionId);

  /*
   * Formato de salida.
   *
   * En esta etapa mantenemos Excel y PDF preparados
   * aunque todavÃ­a no generemos fÃ­sicamente el archivo.
   */
  const [selectedFormat, setSelectedFormat] =
    useState<ReportFormatOption>("excel");

  /*
   * Determina si las evidencias asociadas a la inspecciÃ³n
   * deberÃ¡n incorporarse al reporte.
   */
  const [includeEvidence, setIncludeEvidence] = useState(true);

  /* ---------------------------------------------------------------------- */
  /*                         DATOS DERIVADOS                                */
  /* ---------------------------------------------------------------------- */

  /*
   * Resolvemos la inspecciÃ³n seleccionada.
   */
  const selectedInspection = selectedInspectionId
    ? getInspectionById(selectedInspectionId)
    : undefined;

  /*
   * Inspection
   *     â†“
   * Property
   */
  const selectedProperty = selectedInspection
    ? getPropertyById(selectedInspection.propertyId)
    : undefined;

  /*
   * Inspection
   *     â†“
   * Form
   */
  const selectedForm = selectedInspection
    ? getFormById(selectedInspection.formId)
    : undefined;

  /*
   * Inspection
   *     â†“
   * Evidences
   */
  const selectedEvidences = selectedInspection
    ? getEvidencesByInspectionId(selectedInspection.id)
    : [];

  /*
   * El tÃ­tulo se deriva del formulario.
   *
   * No necesitamos useMemo aquÃ­ porque la operaciÃ³n
   * es pequeÃ±a y evita el problema de memoizaciÃ³n
   * que encontramos anteriormente con React Compiler.
   */
  const reportTitle = selectedForm
    ? `Reporte de ${selectedForm.title}`
    : "Nuevo reporte";

  /*
   * Todos los Hooks ya fueron ejecutados.
   *
   * Ahora sÃ­ podemos realizar un return condicional
   * de forma segura.
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
            â€¹ Empresas
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

  /* ---------------------------------------------------------------------- */
  /*                         GENERACIÃ“N DEL REPORTE                          */
  /* ---------------------------------------------------------------------- */

  /*
   * GENERACIÃ“N SIMULADA
   *
   * Por ahora solamente validamos que exista una inspecciÃ³n
   * y regresamos al historial.
   *
   * MÃ¡s adelante este serÃ¡ el punto de entrada para:
   *
   * ReportRequest
   *      â†“
   * ReportService
   *      â”œâ”€â”€ ExcelGenerator
   *      â””â”€â”€ PdfGenerator
   *
   * De esta forma Kobo NO quedarÃ¡ acoplado directamente
   * al generador de archivos.
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
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ResponsiveContainer>
          {/* ============================================================ */}
          {/* NAVEGACIÃ“N                                                   */}
          {/* ============================================================ */}

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
              â€¹ Reportes
            </Text>
          </Pressable>

          {/* ============================================================ */}
          {/* EMPRESA                                                      */}
          {/* ============================================================ */}

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

          {/* ============================================================ */}
          {/* ENCABEZADO                                                   */}
          {/* ============================================================ */}

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
            Selecciona la inspecciÃ³n y configura el contenido del reporte.
          </Text>

          {/* ============================================================ */}
          {/* SELECCIÃ“N DE INSPECCIÃ“N                                      */}
          {/* ============================================================ */}

          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              1. Seleccionar inspecciÃ³n
            </Text>

            <Text
              style={[
                styles.sectionDescription,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              El reporte se construirÃ¡ a partir de la informaciÃ³n capturada en
              una inspecciÃ³n.
            </Text>

            {/*
             * ResponsiveGrid permite aprovechar mejor tablets y web:
             *
             * MÃ³vil   â†’ 1 inspecciÃ³n por fila
             * Tablet  â†’ 2 inspecciones por fila
             * Desktop â†’ 2 inspecciones por fila
             *
             * Utilizamos 2 y no 3 en escritorio porque estas tarjetas
             * contienen bastante informaciÃ³n.
             */}
            <ResponsiveGrid
              phoneColumns={1}
              tabletColumns={2}
              desktopColumns={2}
              gap={Spacing.sm}
            >
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
            </ResponsiveGrid>

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
                  Esta empresa todavÃ­a no tiene inspecciones registradas.
                </Text>
              </AppCard>
            )}
          </View>

          {/* ============================================================ */}
          {/* CONFIGURACIÃ“N DEL REPORTE                                    */}
          {/* ============================================================ */}

          {selectedInspection && (
            <>
              <Text
                style={[
                  styles.configurationTitle,
                  {
                    color: colors.text,
                  },
                ]}
              >
                2. Configurar reporte
              </Text>

              {/*
               * MÃ“VIL:
               *
               * ConfiguraciÃ³n
               * Resumen
               *
               * TABLET / DESKTOP:
               *
               * ConfiguraciÃ³n | Resumen
               *
               * No utilizamos dos layouts completamente diferentes.
               * Simplemente cambiamos flexDirection segÃºn el dispositivo.
               */}
              <View
                style={[
                  styles.configurationLayout,
                  !isPhone && styles.configurationLayoutWide,
                ]}
              >
                {/* ====================================================== */}
                {/* COLUMNA DE CONFIGURACIÃ“N                               */}
                {/* ====================================================== */}

                <View
                  style={[
                    styles.configurationColumn,
                    !isPhone && styles.configurationColumnWide,
                  ]}
                >
                  {/* FORMATO */}

                  <View style={styles.configurationSection}>
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
                        description="Hoja de cÃ¡lculo"
                        selected={selectedFormat === "excel"}
                        onPress={() => setSelectedFormat("excel")}
                      />

                      <FormatOption
                        label="PDF"
                        description="Documento"
                        selected={selectedFormat === "pdf"}
                        onPress={() => setSelectedFormat("pdf")}
                      />
                    </View>
                  </View>

                  {/* CONTENIDO */}

                  <View style={styles.configurationSection}>
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
                            Agrega las fotografÃ­as y documentos relacionados con
                            la inspecciÃ³n.
                          </Text>

                          <Text
                            style={[
                              styles.evidenceCount,
                              {
                                color: colors.textMuted,
                              },
                            ]}
                          >
                            {selectedEvidences.length} evidencia
                            {selectedEvidences.length === 1 ? "" : "s"}{" "}
                            disponible
                            {selectedEvidences.length === 1 ? "" : "s"}
                          </Text>
                        </View>

                        <Switch
                          value={includeEvidence}
                          onValueChange={setIncludeEvidence}
                        />
                      </View>
                    </AppCard>
                  </View>
                </View>

                {/* ====================================================== */}
                {/* COLUMNA DE RESUMEN                                     */}
                {/* ====================================================== */}

                <View
                  style={[
                    styles.summaryColumn,
                    !isPhone && styles.summaryColumnWide,
                  ]}
                >
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

                  <AppCard style={styles.summaryCard}>
                    <InfoRow label="Empresa" value={company.name} />

                    <Divider />

                    <InfoRow
                      label="Inmueble"
                      value={selectedProperty?.name ?? "No disponible"}
                    />

                    <Divider />

                    <InfoRow
                      label="InspecciÃ³n"
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
                      value={includeEvidence ? "SÃ­" : "No"}
                    />
                  </AppCard>
                </View>
              </View>

              {/* ======================================================== */}
              {/* ACCIONES                                                 */}
              {/* ======================================================== */}

              <View style={[styles.actions, !isPhone && styles.actionsWide]}>
                <View style={styles.actionButton}>
                  <AppButton onPress={handleGenerate}>
                    Generar reporte
                  </AppButton>
                </View>

                <View style={styles.actionButton}>
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
              </View>
            </>
          )}

          {/* ============================================================ */}
          {/* AVISO DEL PROTOTIPO                                          */}
          {/* ============================================================ */}

          <Text
            style={[
              styles.prototypeNotice,
              {
                color: colors.textMuted,
              },
            ]}
          >
            Prototipo visual: la generaciÃ³n del archivo todavÃ­a no estÃ¡
            conectada al servicio real.
          </Text>
        </ResponsiveContainer>
      </ScrollView>
    </Screen>
  );
}

/* -------------------------------------------------------------------------- */
/*                              INSPECTION OPTION                             */
/* -------------------------------------------------------------------------- */

/*
 * Tarjeta seleccionable que representa una inspecciÃ³n.
 *
 * No contiene lÃ³gica de datos propia.
 * Recibe toda la informaciÃ³n preparada desde la pantalla principal.
 */
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

  /*
   * Convertimos el estado tÃ©cnico de la inspecciÃ³n
   * a una etiqueta visible para el usuario.
   */
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
      {/* RADIO DE SELECCIÃ“N */}

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

      {/* INFORMACIÃ“N */}

      <View style={styles.inspectionInfo}>
        <Text
          style={[
            styles.inspectionTitle,

            {
              color: colors.text,
            },
          ]}
          numberOfLines={2}
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
          numberOfLines={2}
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

      {/* ESTADO */}

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

/*
 * OpciÃ³n reutilizable para elegir el formato
 * del archivo que se generarÃ¡.
 */
function FormatOption({
  label,
  description,
  selected,
  onPress,
}: {
  label: string;
  description: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.formatOption,

        {
          backgroundColor: selected ? colors.primarySoft : colors.surface,

          borderColor: selected ? colors.primary : colors.border,

          opacity: pressed ? 0.75 : 1,
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
          styles.formatDescription,

          {
            color: colors.textSecondary,
          },
        ]}
      >
        {description}
      </Text>

      <Text
        style={[
          styles.formatSelection,

          {
            color: selected ? colors.primary : colors.textMuted,
          },
        ]}
      >
        {selected ? "â— Seleccionado" : "â—‹ Seleccionar"}
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

/* -------------------------------------------------------------------------- */
/*                                  DIVIDER                                   */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/*                                  HELPERS                                   */
/* -------------------------------------------------------------------------- */

/*
 * Acepta:
 *
 * 2026-08-20
 *
 * o:
 *
 * 2026-08-20T12:30:00
 *
 * y devuelve:
 *
 * 20/08/2026
 */
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
  /*
   * ResponsiveContainer controla el padding horizontal
   * y superior. ScrollView solamente conserva
   * espacio inferior.
   */
  scrollContent: {
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

  /*
   * Cada opciÃ³n ocupa todo el ancho que
   * ResponsiveGrid le asigne.
   */
  inspectionOption: {
    width: "100%",

    minHeight: 104,

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

    /*
     * Evita que textos largos rompan la distribuciÃ³n
     * horizontal de la tarjeta.
     */
    minWidth: 0,
  },

  inspectionTitle: {
    fontSize: FontSize.body,

    fontWeight: "700",

    marginBottom: Spacing.xs,
  },

  inspectionProperty: {
    fontSize: FontSize.caption,

    lineHeight: 18,

    marginBottom: Spacing.xs,
  },

  inspectionDate: {
    fontSize: FontSize.caption,
  },

  inspectionStatus: {
    flexShrink: 0,

    fontSize: FontSize.caption,

    fontWeight: "700",

    marginLeft: Spacing.md,
  },

  configurationTitle: {
    fontSize: FontSize.h2,

    fontWeight: "700",

    marginBottom: Spacing.lg,
  },

  /*
   * En mÃ³vil:
   *
   * configuraciÃ³n
   * resumen
   */
  configurationLayout: {
    width: "100%",

    gap: Spacing.xl,
  },

  /*
   * Tablet y desktop:
   *
   * configuraciÃ³n | resumen
   */
  configurationLayoutWide: {
    flexDirection: "row",

    alignItems: "flex-start",
  },

  configurationColumn: {
    width: "100%",
  },

  configurationColumnWide: {
    flex: 3,

    width: "auto",

    minWidth: 0,
  },

  summaryColumn: {
    width: "100%",
  },

  summaryColumnWide: {
    flex: 2,

    width: "auto",

    minWidth: 0,
  },

  configurationSection: {
    marginBottom: Spacing.xl,
  },

  /*
   * Excel y PDF permanecen uno al lado del otro.
   * El contenido de cada tarjeta estÃ¡ preparado
   * para espacios mÃ¡s pequeÃ±os.
   */
  formatRow: {
    flexDirection: "row",

    gap: Spacing.sm,
  },

  formatOption: {
    flex: 1,

    minWidth: 0,

    borderWidth: 1,

    borderRadius: Radius.lg,

    padding: Spacing.md,
  },

  formatLabel: {
    fontSize: FontSize.body,

    fontWeight: "700",

    marginBottom: Spacing.xs,
  },

  formatDescription: {
    fontSize: FontSize.caption,

    marginBottom: Spacing.md,
  },

  formatSelection: {
    fontSize: FontSize.caption,

    fontWeight: "600",
  },

  optionRow: {
    flexDirection: "row",

    alignItems: "center",
  },

  optionInfo: {
    flex: 1,

    minWidth: 0,

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

  evidenceCount: {
    fontSize: FontSize.caption,

    fontWeight: "600",

    marginTop: Spacing.sm,
  },

  /*
   * En escritorio esta tarjeta forma la columna
   * derecha de la configuraciÃ³n.
   */
  summaryCard: {
    width: "100%",
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

  /*
   * MÃ³vil:
   * botones verticales.
   */
  actions: {
    gap: Spacing.sm,

    marginTop: Spacing.xl,
  },

  /*
   * Tablet / desktop:
   * botones en la misma fila.
   */
  actionsWide: {
    flexDirection: "row",

    justifyContent: "flex-end",
  },

  actionButton: {
    minWidth: 200,
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

