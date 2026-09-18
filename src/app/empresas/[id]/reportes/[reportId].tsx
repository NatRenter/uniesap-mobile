import { useState } from "react";

import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { router, useLocalSearchParams } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { ResponsiveContainer } from "@/components/ui/ResponsiveContainer";
import { Screen } from "@/components/ui/Screen";

import { getCompanyById } from "@/repositories/companyRepository";
import { getEvidencesByInspectionId } from "@/repositories/evidenceRepository";
import { getFormById } from "@/repositories/formRepository";
import { getInspectionById } from "@/repositories/inspectionRepository";
import { getPropertyById } from "@/repositories/propertyRepository";
import { getReportById } from "@/repositories/reportRepository";

import {
  generateReportFile,
  openGeneratedReport,
  shareGeneratedReport,
} from "@/services/reportGenerationService";

import { formatDate } from "@/utils/dateUtils";

import { FontSize, Radius, Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";
import { useResponsive } from "@/hooks/useResponsive";

export default function ReportDetailsScreen() {
  /*
   * Recupera los colores correspondientes al tema actual.
   *
   * Esto permite mantener la pantalla compatible
   * con modo claro y oscuro.
   */
  const { colors } = useAppTheme();

  /*
   * Para esta pantalla únicamente necesitamos saber
   * cuándo estamos en teléfono.
   *
   * Teléfono:
   *   distribución vertical.
   *
   * Tablet / Desktop:
   *   aprovechamos el espacio horizontal.
   */
  const { isPhone } = useResponsive();

  /*
   * Parámetros dinámicos provenientes de:
   *
   * /empresas/[id]/reportes/[reportId]
   */
  const { id, reportId, generationError } = useLocalSearchParams<{
    id: string;
    reportId: string;
    generationError?: string;
  }>();

  /*
   * Estado local para acciones de archivo.
   *
   * refreshVersion fuerza un render después de que ReportRepository cambia
   * pending → generated, ya que el repository no utiliza un store Reactivo.
   */
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [actionError, setActionError] = useState<string | null>(
    generationError ?? null,
  );
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [refreshVersion, setRefreshVersion] = useState(0);

  void refreshVersion;

  /*
   * Recuperamos la empresa y el reporte desde
   * nuestra capa centralizada de datos.
   */
  const company = getCompanyById(id);

  const report = getReportById(reportId);

  /*
   * Si alguno de los dos recursos no existe,
   * mostramos un estado controlado.
   */
  if (!company || !report) {
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
            Reporte no encontrado
          </Text>

          <Text
            style={[
              styles.notFoundDescription,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            No fue posible encontrar la información de este reporte.
          </Text>
        </View>
      </Screen>
    );
  }

  /* ---------------------------------------------------------------------- */
  /*                         RELACIONES DEL REPORTE                          */
  /* ---------------------------------------------------------------------- */

  /*
   * Report
   *    ↓ inspectionId
   * Inspection
   */
  const inspection = getInspectionById(report.inspectionId);

  /*
   * Report
   *    ↓ propertyId
   * Property
   */
  const property = getPropertyById(report.propertyId);

  /*
   * Inspection
   *    ↓ formId
   * Form
   */
  const form = inspection ? getFormById(inspection.formId) : undefined;

  /*
   * Recuperamos las evidencias correspondientes
   * a la inspección utilizada para generar el reporte.
   */
  const evidences = getEvidencesByInspectionId(report.inspectionId);

  /* ---------------------------------------------------------------------- */
  /*                       VALORES PARA LA INTERFAZ                          */
  /* ---------------------------------------------------------------------- */

  const statusLabel = report.status === "generated" ? "Generado" : "Pendiente";

  const statusColor =
    report.status === "generated" ? colors.success : colors.warning;

  const formatLabel = report.format === "excel" ? "Excel" : "PDF";

  /*
   * Texto utilizado en la tarjeta de archivo.
   *
   * Cuando conectemos el generador real,
   * fileUri será uno de los puntos importantes
   * para localizar el archivo generado.
   */
  const fileAvailabilityLabel = report.fileUri
    ? "Archivo disponible"
    : "Archivo pendiente";

  const includedEvidenceLabel = report.includeEvidence
    ? `${evidences.length} evidencia${
        evidences.length !== 1 ? "s" : ""
      } configurada${evidences.length !== 1 ? "s" : ""}`
    : "No incluidas";

  const canGeneratePhysicalFile = report.format === "excel";
  const hasGeneratedFile =
    report.status === "generated" && Boolean(report.fileUri);

  /* ---------------------------------------------------------------------- */
  /* ACCIONES DEL ARCHIVO                                                   */
  /* ---------------------------------------------------------------------- */

  const handleGenerateFile = async () => {
    if (isProcessingFile || !canGeneratePhysicalFile) {
      return;
    }

    setIsProcessingFile(true);
    setActionError(null);
    setActionMessage(null);

    try {
      const result = await generateReportFile(report.id, {
        downloadOnWeb: true,
      });

      setRefreshVersion((current) => current + 1);

      if (result.warnings.length > 0) {
        setActionMessage(
          `Reporte generado. ${result.includedEvidenceCount} de ${result.requestedEvidenceCount} evidencias pudieron incluirse; consulta MANIFIESTO.txt dentro del ZIP.`,
        );
      } else {
        setActionMessage("Reporte generado correctamente.");
      }
    } catch (error) {
      console.error("Error generando el archivo del reporte:", error);

      setActionError(getErrorMessage(error));
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleOpenReport = async () => {
    if (isProcessingFile || !canGeneratePhysicalFile) {
      return;
    }

    setIsProcessingFile(true);
    setActionError(null);
    setActionMessage(null);

    try {
      await openGeneratedReport(report.id);

      setRefreshVersion((current) => current + 1);
    } catch (error) {
      console.error("Error abriendo el reporte:", error);

      setActionError(getErrorMessage(error));
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleShareReport = async () => {
    if (isProcessingFile || !canGeneratePhysicalFile) {
      return;
    }

    setIsProcessingFile(true);
    setActionError(null);
    setActionMessage(null);

    try {
      const result = await shareGeneratedReport(report.id);

      setRefreshVersion((current) => current + 1);

      if (result.downloaded && !result.shared) {
        setActionMessage(
          "El navegador no permitió compartir el archivo directamente, así que se descargó como alternativa.",
        );
      }
    } catch (error) {
      console.error("Error compartiendo el reporte:", error);

      setActionError(getErrorMessage(error));
    } finally {
      setIsProcessingFile(false);
    }
  };

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/*
         * ResponsiveContainer se encarga de:
         *
         * - padding horizontal
         * - separación superior
         * - ancho máximo
         * - centrado del contenido
         */}
        <ResponsiveContainer>
          {/* ============================================================ */}
          {/* NAVEGACIÓN                                                   */}
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
              ‹ Reportes
            </Text>
          </Pressable>

          {/* ============================================================ */}
          {/* EMPRESA                                                      */}
          {/* ============================================================ */}

          <Text
            style={[
              styles.companyOverline,
              {
                /*
                 * Conservamos el color representativo
                 * configurado para cada empresa.
                 */
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
              styles.overline,
              {
                color: colors.primary,
              },
            ]}
          >
            REPORTE
          </Text>

          <Text
            style={[
              styles.title,
              {
                color: colors.text,
              },
            ]}
          >
            {report.title}
          </Text>

          {/* ESTADO */}

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

          {/* ============================================================ */}
          {/* BLOQUE PRINCIPAL                                             */}
          {/* ============================================================ */}

          {/*
           * TELÉFONO
           *
           * Archivo
           * ↓
           * Información
           *
           * TABLET / DESKTOP
           *
           * Archivo | Información
           */}
          <View style={[styles.mainLayout, !isPhone && styles.mainLayoutWide]}>
            {/* ========================================================== */}
            {/* ARCHIVO / PREVIEW                                          */}
            {/* ========================================================== */}

            <View
              style={[
                styles.previewColumn,

                !isPhone && styles.previewColumnWide,
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
                Archivo
              </Text>

              <View
                style={[
                  styles.preview,
                  {
                    backgroundColor: colors.surfaceSecondary,

                    borderColor: colors.border,
                  },
                ]}
              >
                {/* ICONO */}

                <View
                  style={[
                    styles.fileIconContainer,
                    {
                      backgroundColor: colors.primarySoft,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.fileIcon,
                      {
                        color: colors.primary,
                      },
                    ]}
                  >
                    {report.format === "excel" ? "▦" : "▤"}
                  </Text>
                </View>

                {/* FORMATO */}

                <Text
                  style={[
                    styles.fileFormat,
                    {
                      color: colors.primary,
                    },
                  ]}
                >
                  {formatLabel.toUpperCase()}
                </Text>

                {/* NOMBRE */}

                <Text
                  style={[
                    styles.previewTitle,
                    {
                      color: colors.text,
                    },
                  ]}
                  numberOfLines={3}
                >
                  {report.title}
                </Text>

                {/* DISPONIBILIDAD */}

                <Text
                  style={[
                    styles.previewDescription,
                    {
                      color: colors.textSecondary,
                    },
                  ]}
                >
                  {hasGeneratedFile
                    ? report.includeEvidence
                      ? "El paquete ZIP con Excel y evidencias está disponible."
                      : "El archivo Excel generado está disponible."
                    : canGeneratePhysicalFile
                      ? "El registro existe, pero el archivo todavía debe generarse."
                      : "El generador PDF se habilitará en una etapa posterior."}
                </Text>

                <View
                  style={[
                    styles.fileAvailability,
                    {
                      backgroundColor: report.fileUri
                        ? `${colors.success}20`
                        : `${colors.warning}20`,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.fileAvailabilityText,
                      {
                        color: report.fileUri ? colors.success : colors.warning,
                      },
                    ]}
                  >
                    ● {fileAvailabilityLabel}
                  </Text>
                </View>
              </View>
            </View>

            {/* ========================================================== */}
            {/* INFORMACIÓN                                                */}
            {/* ========================================================== */}

            <View
              style={[
                styles.informationColumn,

                !isPhone && styles.informationColumnWide,
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
                Información
              </Text>

              <AppCard style={styles.informationCard}>
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

                <InfoRow label="Formato" value={formatLabel} />

                <Divider />

                <InfoRow
                  label="Fecha de generación"
                  value={formatDate(report.createdAt)}
                />

                <Divider />

                <InfoRow
                  label="Estado"
                  value={statusLabel}
                  valueColor={statusColor}
                />

                <Divider />

                <InfoRow label="Evidencias" value={includedEvidenceLabel} />
              </AppCard>
            </View>
          </View>

          {/* ============================================================ */}
          {/* INFORMACIÓN RELACIONADA                                      */}
          {/* ============================================================ */}

          <View style={styles.relatedArea}>
            <Text
              style={[
                styles.relatedAreaTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              Información relacionada
            </Text>

            <View
              style={[
                styles.relatedLayout,

                !isPhone && styles.relatedLayoutWide,
              ]}
            >
              {/* ======================================================== */}
              {/* INSPECCIÓN RELACIONADA                                   */}
              {/* ======================================================== */}

              {inspection && (
                <View
                  style={[
                    styles.relatedColumn,

                    !isPhone && styles.relatedColumnWide,
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
                    <AppCard style={styles.relatedCard}>
                      <View style={styles.relatedRow}>
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
                            numberOfLines={2}
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
                            numberOfLines={2}
                          >
                            {property?.name ?? "Inmueble no disponible"}
                          </Text>

                          <Text
                            style={[
                              styles.relatedDate,
                              {
                                color: colors.textMuted,
                              },
                            ]}
                          >
                            {formatDate(inspection.date)}
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

              {/* ======================================================== */}
              {/* EVIDENCIAS                                               */}
              {/* ======================================================== */}

              <View
                style={[
                  styles.relatedColumn,

                  !isPhone && styles.relatedColumnWide,
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
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <AppCard style={styles.relatedCard}>
                    <View style={styles.relatedRow}>
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
                          ▣
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
                          Evidencias asociadas
                        </Text>

                        <Text
                          style={[
                            styles.relatedDescription,
                            {
                              color: colors.textSecondary,
                            },
                          ]}
                        >
                          {evidences.length} archivo
                          {evidences.length !== 1 ? "s" : ""} disponible
                          {evidences.length !== 1 ? "s" : ""}
                        </Text>

                        <Text
                          style={[
                            styles.relatedDate,
                            {
                              color: report.includeEvidence
                                ? colors.success
                                : colors.textMuted,
                            },
                          ]}
                        >
                          {report.includeEvidence
                            ? "Incluidas en el reporte"
                            : "No incluidas en el reporte"}
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
            </View>
          </View>

          {/* ============================================================ */}
          {/* RESULTADO DE ACCIONES                                         */}
          {/* ============================================================ */}

          {actionError && (
            <View
              style={[
                styles.actionFeedback,
                {
                  borderColor: colors.error,
                },
              ]}
            >
              <Text
                style={[
                  styles.actionFeedbackText,
                  {
                    color: colors.error,
                  },
                ]}
              >
                {actionError}
              </Text>
            </View>
          )}

          {actionMessage && (
            <View
              style={[
                styles.actionFeedback,
                {
                  borderColor: colors.success,
                },
              ]}
            >
              <Text
                style={[
                  styles.actionFeedbackText,
                  {
                    color: colors.success,
                  },
                ]}
              >
                {actionMessage}
              </Text>
            </View>
          )}

          {/* ============================================================ */}
          {/* ACCIONES                                                     */}
          {/* ============================================================ */}

          {canGeneratePhysicalFile ? (
            <View style={[styles.actions, !isPhone && styles.actionsWide]}>
              {!hasGeneratedFile ? (
                <View style={styles.actionButton}>
                  <AppButton onPress={handleGenerateFile}>
                    {isProcessingFile
                      ? "Generando archivo..."
                      : report.status === "generated"
                        ? "Regenerar archivo"
                        : "Generar archivo"}
                  </AppButton>
                </View>
              ) : (
                <>
                  <View style={styles.actionButton}>
                    <AppButton onPress={handleOpenReport}>
                      {isProcessingFile ? "Procesando..." : "Abrir / descargar"}
                    </AppButton>
                  </View>

                  <View style={styles.actionButton}>
                    <AppButton variant="secondary" onPress={handleShareReport}>
                      Compartir
                    </AppButton>
                  </View>
                </>
              )}
            </View>
          ) : (
            <Text
              style={[
                styles.prototypeNotice,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              Los reportes PDF permanecen registrados, pero su generador físico
              todavía no está habilitado. Excel ya está disponible.
            </Text>
          )}
        </ResponsiveContainer>
      </ScrollView>
    </Screen>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  INFO ROW                                  */
/* -------------------------------------------------------------------------- */

/*
 * Componente reutilizable para mostrar
 * pares etiqueta / valor.
 */
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
 * Convierte errores desconocidos en un mensaje seguro para la interfaz.
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Ocurrió un error desconocido.";
}

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  /*
   * ResponsiveContainer controla el padding
   * superior y horizontal.
   */
  scrollContent: {
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

  /* -------------------------------------------------------------------- */
  /*                            LAYOUT PRINCIPAL                            */
  /* -------------------------------------------------------------------- */

  mainLayout: {
    width: "100%",

    gap: Spacing.xl,

    marginBottom: Spacing.xl,
  },

  /*
   * Tablet y escritorio:
   *
   * Archivo | Información
   */
  mainLayoutWide: {
    flexDirection: "row",

    alignItems: "stretch",
  },

  previewColumn: {
    width: "100%",
  },

  previewColumnWide: {
    flex: 3,

    width: "auto",

    minWidth: 0,
  },

  informationColumn: {
    width: "100%",
  },

  informationColumnWide: {
    flex: 2,

    width: "auto",

    minWidth: 0,
  },

  sectionTitle: {
    fontSize: FontSize.cardTitle,

    fontWeight: "700",

    marginBottom: Spacing.md,
  },

  /* -------------------------------------------------------------------- */
  /*                                PREVIEW                                */
  /* -------------------------------------------------------------------- */

  preview: {
    minHeight: 330,

    borderWidth: 1,

    borderRadius: Radius.lg,

    alignItems: "center",

    justifyContent: "center",

    padding: Spacing.xl,
  },

  fileIconContainer: {
    width: 76,

    height: 76,

    borderRadius: Radius.lg,

    alignItems: "center",

    justifyContent: "center",

    marginBottom: Spacing.md,
  },

  fileIcon: {
    fontSize: 40,

    fontWeight: "700",
  },

  fileFormat: {
    fontSize: FontSize.caption,

    fontWeight: "700",

    letterSpacing: 1,

    marginBottom: Spacing.sm,
  },

  previewTitle: {
    maxWidth: 460,

    fontSize: FontSize.cardTitle,

    fontWeight: "700",

    textAlign: "center",

    marginBottom: Spacing.sm,
  },

  previewDescription: {
    maxWidth: 440,

    fontSize: FontSize.small,

    lineHeight: 21,

    textAlign: "center",

    marginBottom: Spacing.lg,
  },

  fileAvailability: {
    paddingHorizontal: Spacing.md,

    paddingVertical: Spacing.sm,

    borderRadius: Radius.full,
  },

  fileAvailabilityText: {
    fontSize: FontSize.caption,

    fontWeight: "700",
  },

  /* -------------------------------------------------------------------- */
  /*                              INFORMACIÓN                              */
  /* -------------------------------------------------------------------- */

  informationCard: {
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

  /* -------------------------------------------------------------------- */
  /*                         INFORMACIÓN RELACIONADA                        */
  /* -------------------------------------------------------------------- */

  relatedArea: {
    marginBottom: Spacing.xl,
  },

  relatedAreaTitle: {
    fontSize: FontSize.h2,

    fontWeight: "700",

    marginBottom: Spacing.lg,
  },

  relatedLayout: {
    width: "100%",

    gap: Spacing.xl,
  },

  /*
   * Tablet y escritorio:
   *
   * Inspección | Evidencias
   */
  relatedLayoutWide: {
    flexDirection: "row",

    alignItems: "stretch",
  },

  relatedColumn: {
    width: "100%",
  },

  relatedColumnWide: {
    flex: 1,

    width: "auto",

    minWidth: 0,
  },

  relatedCard: {
    minHeight: 120,
  },

  relatedRow: {
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

    minWidth: 0,
  },

  relatedTitle: {
    fontSize: FontSize.body,

    fontWeight: "700",

    marginBottom: Spacing.xs,
  },

  relatedDescription: {
    fontSize: FontSize.caption,

    lineHeight: 18,

    marginBottom: Spacing.xs,
  },

  relatedDate: {
    fontSize: FontSize.caption,

    fontWeight: "600",
  },

  arrow: {
    flexShrink: 0,

    fontSize: 28,

    marginLeft: Spacing.sm,
  },

  actionFeedback: {
    width: "100%",
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },

  actionFeedbackText: {
    fontSize: FontSize.small,
    lineHeight: 20,
    fontWeight: "600",
  },

  /* -------------------------------------------------------------------- */
  /*                               ACCIONES                                */
  /* -------------------------------------------------------------------- */

  /*
   * Móvil:
   *
   * [ Abrir reporte ]
   * [ Compartir     ]
   */
  actions: {
    gap: Spacing.sm,
  },

  /*
   * Tablet / Desktop:
   *
   * [ Abrir reporte ] [ Compartir ]
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

  /* -------------------------------------------------------------------- */
  /*                             NOT FOUND                                 */
  /* -------------------------------------------------------------------- */

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
