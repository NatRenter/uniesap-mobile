import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { router, useLocalSearchParams } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { ResponsiveContainer } from "@/components/ui/ResponsiveContainer";
import { Screen } from "@/components/ui/Screen";

import { getCompanyById } from "@/repositories/companyRepository";
import { getEvidencesByInspectionId } from "@/data/evidences";
import { getFormById } from "@/data/forms";
import { getInspectionById } from "@/data/inspections";
import { getPropertyById } from "@/repositories/propertyRepository";
import { getReportById } from "@/data/reports";

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
   * Para esta pantalla Ãºnicamente necesitamos saber
   * cuÃ¡ndo estamos en telÃ©fono.
   *
   * TelÃ©fono:
   *   distribuciÃ³n vertical.
   *
   * Tablet / Desktop:
   *   aprovechamos el espacio horizontal.
   */
  const { isPhone } = useResponsive();

  /*
   * ParÃ¡metros dinÃ¡micos provenientes de:
   *
   * /empresas/[id]/reportes/[reportId]
   */
  const { id, reportId } = useLocalSearchParams<{
    id: string;
    reportId: string;
  }>();

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
            â€¹ Volver
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
            No fue posible encontrar la informaciÃ³n de este reporte.
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
   *    â†“ inspectionId
   * Inspection
   */
  const inspection = getInspectionById(report.inspectionId);

  /*
   * Report
   *    â†“ propertyId
   * Property
   */
  const property = getPropertyById(report.propertyId);

  /*
   * Inspection
   *    â†“ formId
   * Form
   */
  const form = inspection ? getFormById(inspection.formId) : undefined;

  /*
   * Recuperamos las evidencias correspondientes
   * a la inspecciÃ³n utilizada para generar el reporte.
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
   * fileUri serÃ¡ uno de los puntos importantes
   * para localizar el archivo generado.
   */
  const fileAvailabilityLabel = report.fileUri
    ? "Archivo disponible"
    : "Archivo pendiente";

  const includedEvidenceLabel = report.includeEvidence
    ? `${evidences.length} archivo${
        evidences.length !== 1 ? "s" : ""
      } incluido${evidences.length !== 1 ? "s" : ""}`
    : "No incluidas";

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
         * - separaciÃ³n superior
         * - ancho mÃ¡ximo
         * - centrado del contenido
         */}
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
              â— {statusLabel}
            </Text>
          </View>

          {/* ============================================================ */}
          {/* BLOQUE PRINCIPAL                                             */}
          {/* ============================================================ */}

          {/*
           * TELÃ‰FONO
           *
           * Archivo
           * â†“
           * InformaciÃ³n
           *
           * TABLET / DESKTOP
           *
           * Archivo | InformaciÃ³n
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
                    {report.format === "excel" ? "â–¦" : "â–¤"}
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
                  {report.fileUri
                    ? "El archivo generado estÃ¡ disponible."
                    : "La vista previa del archivo generado se mostrarÃ¡ en este espacio."}
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
                    â— {fileAvailabilityLabel}
                  </Text>
                </View>
              </View>
            </View>

            {/* ========================================================== */}
            {/* INFORMACIÃ“N                                                */}
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
                InformaciÃ³n
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
                  label="InspecciÃ³n"
                  value={form?.title ?? "No disponible"}
                />

                <Divider />

                <InfoRow label="Formato" value={formatLabel} />

                <Divider />

                <InfoRow
                  label="Fecha de generaciÃ³n"
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
          {/* INFORMACIÃ“N RELACIONADA                                      */}
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
              InformaciÃ³n relacionada
            </Text>

            <View
              style={[
                styles.relatedLayout,

                !isPhone && styles.relatedLayoutWide,
              ]}
            >
              {/* ======================================================== */}
              {/* INSPECCIÃ“N RELACIONADA                                   */}
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
                    InspecciÃ³n relacionada
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
                            âœ“
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
                            {form?.title ?? "InspecciÃ³n"}
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
                          â€º
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
                          â—«
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
                        â€º
                      </Text>
                    </View>
                  </AppCard>
                </Pressable>
              </View>
            </View>
          </View>

          {/* ============================================================ */}
          {/* ACCIONES                                                     */}
          {/* ============================================================ */}

          {/*
           * TodavÃ­a son acciones visuales.
           *
           * Cuando exista fileUri real podremos conectar:
           *
           * Abrir reporte â†’ visor/archivo
           * Compartir     â†’ Share API
           */}
          <View style={[styles.actions, !isPhone && styles.actionsWide]}>
            <View style={styles.actionButton}>
              <AppButton>Abrir reporte</AppButton>
            </View>

            <View style={styles.actionButton}>
              <AppButton variant="secondary">Compartir</AppButton>
            </View>
          </View>

          {/* ============================================================ */}
          {/* AVISO                                                        */}
          {/* ============================================================ */}

          <Text
            style={[
              styles.prototypeNotice,
              {
                color: colors.textMuted,
              },
            ]}
          >
            La generaciÃ³n y apertura del archivo real se implementarÃ¡n en una
            etapa posterior.
          </Text>
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
   * Archivo | InformaciÃ³n
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
  /*                              INFORMACIÃ“N                              */
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
  /*                         INFORMACIÃ“N RELACIONADA                        */
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
   * InspecciÃ³n | Evidencias
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

  /* -------------------------------------------------------------------- */
  /*                               ACCIONES                                */
  /* -------------------------------------------------------------------- */

  /*
   * MÃ³vil:
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

