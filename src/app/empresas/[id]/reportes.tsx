import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { router, useLocalSearchParams } from "expo-router";

import { ContextHeader } from "@/components/navigation/ContextHeader";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { ResponsiveContainer } from "@/components/ui/ResponsiveContainer";
import { ResponsiveGrid } from "@/components/ui/ResponsiveGrid";
import { Screen } from "@/components/ui/Screen";

import { getCompanyById } from "@/repositories/companyRepository";
import { getFormById } from "@/repositories/formRepository";
import { getInspectionById } from "@/repositories/inspectionRepository";
import { getPropertyById } from "@/repositories/propertyRepository";
import { getReportsByCompanyId } from "@/repositories/reportRepository";

import { FontSize, Radius, Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

export default function ReportsScreen() {
  /*
   * Recupera los colores del tema actual.
   *
   * De esta forma toda la pantalla mantiene
   * compatibilidad con modo claro y oscuro.
   */
  const { colors } = useAppTheme();

  /*
   * Recuperamos el ID dinÃ¡mico de:
   *
   * /empresas/[id]/reportes
   */
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  /*
   * Obtenemos la empresa desde nuestra
   * capa centralizada de datos.
   */
  const company = getCompanyById(id);

  /*
   * Estado controlado para una empresa inexistente.
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

  /*
   * Recuperamos solamente los reportes
   * pertenecientes a la empresa actual.
   */
  const companyReports = getReportsByCompanyId(company.id);

  /*
   * Calculamos automÃ¡ticamente los indicadores.
   *
   * De esta forma los nÃºmeros del resumen
   * siempre dependen de los datos reales.
   */
  const generated = companyReports.filter(
    (report) => report.status === "generated",
  ).length;

  const pending = companyReports.filter(
    (report) => report.status === "pending",
  ).length;

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/*
         * ResponsiveContainer controla:
         *
         * - padding horizontal
         * - espacio superior
         * - ancho mÃ¡ximo
         * - centrado en tablet y web
         */}
        <ResponsiveContainer>
          {/* ====================================================== */}
          {/* NAVEGACIÃ“N CONTEXTUAL */}
          {/* ====================================================== */}

          <ContextHeader
            /*
             * Reportes pertenece al detalle de la empresa.
             */
            backLabel={company.name}
            onBack={() =>
              router.navigate({
                pathname: "/empresas/[id]",

                params: {
                  id,
                },
              })
            }
            contextLabel={company.name}
            contextColor={company.branding.primaryColor}
            title="Reportes"
            subtitle="Consulta y genera reportes a partir de las inspecciones realizadas."
          />

          {/* ====================================================== */}
          {/* RESUMEN */}
          {/* ====================================================== */}

          {/*
           * Tenemos exactamente tres indicadores:
           *
           * Total
           * Generados
           * Pendientes
           *
           * Por ello conservamos tres columnas en
           * mÃ³vil, tablet y escritorio.
           */}
          <ResponsiveGrid
            phoneColumns={3}
            tabletColumns={3}
            desktopColumns={3}
            gap={Spacing.sm}
          >
            <SummaryCard
              value={companyReports.length.toString()}
              label="Total"
            />

            <SummaryCard value={generated.toString()} label="Generados" />

            <SummaryCard
              value={pending.toString()}
              label="Pendientes"
              warning={pending > 0}
            />
          </ResponsiveGrid>

          {/* ====================================================== */}
          {/* ACCIÃ“N PRINCIPAL */}
          {/* ====================================================== */}

          <View style={styles.generateButton}>
            <AppButton
              onPress={() =>
                router.navigate({
                  pathname: "/empresas/[id]/reportes/nuevo",

                  params: {
                    id,
                  },
                })
              }
            >
              + Generar reporte
            </AppButton>
          </View>

          {/* ====================================================== */}
          {/* REPORTES RECIENTES */}
          {/* ====================================================== */}

          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              Reportes recientes
            </Text>

            {/*
             * Sustituimos la lista vertical fija
             * por nuestro grid responsive.
             *
             * MÃ³vil   â†’ 1 reporte por fila
             * Tablet  â†’ 2 reportes por fila
             * Desktop â†’ 3 reportes por fila
             */}
            <ResponsiveGrid
              phoneColumns={1}
              tabletColumns={2}
              desktopColumns={3}
              gap={Spacing.md}
            >
              {companyReports.map((report) => {
                /*
                 * Resolvemos las relaciones del reporte.
                 *
                 * Report
                 *   â”œâ”€â”€ Inspection
                 *   â”‚      â””â”€â”€ Form
                 *   â””â”€â”€ Property
                 */
                const inspection = getInspectionById(report.inspectionId);

                const property = getPropertyById(report.propertyId);

                const form = inspection
                  ? getFormById(inspection.formId)
                  : undefined;

                return (
                  <ReportCard
                    key={report.id}
                    reportId={report.id}
                    companyRouteId={id}
                    title={report.title}
                    property={property?.name ?? "Inmueble no disponible"}
                    inspection={form?.title ?? "InspecciÃ³n no disponible"}
                    date={report.createdAt}
                    format={report.format}
                    status={report.status}
                  />
                );
              })}
            </ResponsiveGrid>

            {/* ================================================== */}
            {/* ESTADO VACÃO */}
            {/* ================================================== */}

            {companyReports.length === 0 && (
              <AppCard style={styles.emptyCard}>
                <Text
                  style={[
                    styles.emptyTitle,
                    {
                      color: colors.text,
                    },
                  ]}
                >
                  Sin reportes
                </Text>

                <Text
                  style={[
                    styles.emptyDescription,
                    {
                      color: colors.textSecondary,
                    },
                  ]}
                >
                  TodavÃ­a no se han generado reportes para esta empresa.
                </Text>
              </AppCard>
            )}
          </View>
        </ResponsiveContainer>
      </ScrollView>
    </Screen>
  );
}

/* -------------------------------------------------------------------------- */
/*                               SUMMARY CARD                                 */
/* -------------------------------------------------------------------------- */

/*
 * Tarjeta reutilizable utilizada para mostrar
 * los indicadores superiores.
 *
 * warning permite destacar visualmente
 * valores que requieren atenciÃ³n.
 */
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
        numberOfLines={1}
      >
        {label}
      </Text>
    </AppCard>
  );
}

/* -------------------------------------------------------------------------- */
/*                                REPORT CARD                                 */
/* -------------------------------------------------------------------------- */

/*
 * Representa un reporte dentro del historial.
 *
 * Recibe la informaciÃ³n ya resuelta para mantener
 * el componente independiente de la capa de datos.
 */
function ReportCard({
  reportId,
  companyRouteId,
  title,
  property,
  inspection,
  date,
  format,
  status,
}: {
  reportId: string;
  companyRouteId: string;
  title: string;
  property: string;
  inspection: string;
  date: string;
  format: "excel" | "pdf";
  status: "pending" | "generated";
}) {
  const { colors } = useAppTheme();

  /*
   * Traducimos el estado interno a una
   * etiqueta amigable para el usuario.
   */
  const statusLabel = status === "generated" ? "Generado" : "Pendiente";

  /*
   * Reporte generado â†’ verde
   * Reporte pendiente â†’ advertencia
   */
  const statusColor = status === "generated" ? colors.success : colors.warning;

  /*
   * Traducimos tambiÃ©n el formato.
   *
   * Actualmente el modelo admite Excel y PDF.
   */
  const formatLabel = format === "excel" ? "Excel" : "PDF";

  return (
    <Pressable
      onPress={() =>
        router.navigate({
          pathname: "/empresas/[id]/reportes/[reportId]",

          params: {
            id: companyRouteId,
            reportId,
          },
        })
      }
      style={({ pressed }) => ({
        /*
         * Feedback visual tanto para mÃ³vil
         * como para web.
         */
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <AppCard style={styles.reportCard}>
        {/* CABECERA */}

        <View style={styles.reportHeader}>
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
              â–¤
            </Text>
          </View>

          <View style={styles.reportInfo}>
            <Text
              style={[
                styles.reportTitle,
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
                styles.reportProperty,
                {
                  color: colors.textSecondary,
                },
              ]}
              numberOfLines={2}
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
            â€º
          </Text>
        </View>

        {/* DIVISOR */}

        <View
          style={[
            styles.divider,
            {
              backgroundColor: colors.divider,
            },
          ]}
        />

        {/* INSPECCIÃ“N */}

        <Text
          style={[
            styles.inspection,
            {
              color: colors.textSecondary,
            },
          ]}
          numberOfLines={2}
        >
          {inspection}
        </Text>

        {/* METADATOS */}

        <View style={styles.meta}>
          <Text
            style={[
              styles.metaText,
              {
                color: colors.textMuted,
              },
            ]}
          >
            {formatDate(date)} Â· {formatLabel}
          </Text>

          <Text
            style={[
              styles.status,
              {
                color: statusColor,
              },
            ]}
          >
            â— {statusLabel}
          </Text>
        </View>
      </AppCard>
    </Pressable>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  HELPERS                                   */
/* -------------------------------------------------------------------------- */

/*
 * Soporta:
 *
 * 2026-08-20
 *
 * y:
 *
 * 2026-08-20T12:30:00
 *
 * devolviendo:
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
   * horizontal y superior.
   *
   * AquÃ­ Ãºnicamente necesitamos espacio inferior.
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

  /*
   * El ancho de cada tarjeta lo determina
   * ResponsiveGrid.
   */
  summaryCard: {
    width: "100%",

    minHeight: 100,
  },

  summaryValue: {
    fontSize: FontSize.h2,

    fontWeight: "700",

    marginBottom: Spacing.xs,
  },

  summaryLabel: {
    fontSize: FontSize.caption,
  },

  /*
   * Separamos visualmente el botÃ³n del resumen.
   */
  generateButton: {
    marginTop: Spacing.xl,
  },

  section: {
    marginTop: Spacing.xl,
  },

  sectionTitle: {
    fontSize: FontSize.cardTitle,

    fontWeight: "700",

    marginBottom: Spacing.md,
  },

  /*
   * Cada tarjeta ocupa completamente
   * la columna que ResponsiveGrid le asigna.
   */
  reportCard: {
    width: "100%",

    /*
     * La altura mÃ­nima ayuda a mantener
     * uniformidad cuando aparecen varias
     * tarjetas en la misma fila.
     */
    minHeight: 220,
  },

  reportHeader: {
    flexDirection: "row",

    alignItems: "center",
  },

  fileIcon: {
    width: 52,
    height: 52,

    borderRadius: Radius.md,

    alignItems: "center",

    justifyContent: "center",

    marginRight: Spacing.md,
  },

  fileIconText: {
    fontSize: FontSize.h3,

    fontWeight: "700",
  },

  reportInfo: {
    flex: 1,

    /*
     * Importante dentro de layouts flex.
     * Permite que textos largos reduzcan
     * correctamente su ancho.
     */
    minWidth: 0,
  },

  reportTitle: {
    fontSize: FontSize.body,

    fontWeight: "700",

    marginBottom: Spacing.xs,
  },

  reportProperty: {
    fontSize: FontSize.caption,

    lineHeight: 18,
  },

  arrow: {
    fontSize: 28,

    marginLeft: Spacing.sm,
  },

  divider: {
    height: 1,

    marginVertical: Spacing.md,
  },

  inspection: {
    fontSize: FontSize.small,

    fontWeight: "600",

    lineHeight: 20,

    marginBottom: Spacing.md,
  },

  /*
   * Los metadatos pueden envolverse si el
   * espacio horizontal es muy pequeÃ±o.
   */
  meta: {
    flexDirection: "row",

    flexWrap: "wrap",

    justifyContent: "space-between",

    alignItems: "center",

    gap: Spacing.sm,
  },

  metaText: {
    fontSize: FontSize.caption,
  },

  status: {
    flexShrink: 0,

    fontSize: FontSize.caption,

    fontWeight: "600",
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

