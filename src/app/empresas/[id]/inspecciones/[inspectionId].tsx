import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { router, useLocalSearchParams } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { ResponsiveContainer } from "@/components/ui/ResponsiveContainer";
import { ResponsiveGrid } from "@/components/ui/ResponsiveGrid";
import { Screen } from "@/components/ui/Screen";

import { getCompanyById } from "@/data/companies";
import { getEvidencesByInspectionId } from "@/data/evidences";
import { getFormById } from "@/data/forms";
import { getInspectionById } from "@/data/inspections";
import { getPropertyById } from "@/data/properties";

import { FontSize, Radius, Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";
import { useResponsive } from "@/hooks/useResponsive";

export default function InspectionDetailsScreen() {
  /*
   * Tema global de la aplicación.
   * Mantiene compatibilidad con modo claro y oscuro.
   */
  const { colors } = useAppTheme();

  /*
   * En esta pantalla necesitamos conocer cuándo estamos
   * en escritorio para aprovechar mejor el ancho disponible.
   */
  const { isPhone, isTablet } = useResponsive();

  const isDesktop = !isPhone && !isTablet;

  /*
   * Parámetros dinámicos:
   *
   * /empresas/[id]/inspecciones/[inspectionId]
   */
  const { id, inspectionId } = useLocalSearchParams<{
    id: string;
    inspectionId: string;
  }>();

  /*
   * Recuperamos la empresa y la inspección
   * desde la capa centralizada de datos.
   */
  const company = getCompanyById(id);

  const inspection = getInspectionById(inspectionId);

  /*
   * Estado controlado para rutas inválidas.
   */
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

  /*
   * Resolvemos las relaciones de la inspección.
   *
   * inspection.propertyId → inmueble
   * inspection.formId     → formulario
   */
  const property = getPropertyById(inspection.propertyId);

  const form = getFormById(inspection.formId);

  /*
   * Recuperamos solamente las evidencias
   * asociadas a esta inspección.
   */
  const inspectionEvidences = getEvidencesByInspectionId(inspection.id);

  /*
   * Transformamos el estado interno en
   * una etiqueta amigable.
   */
  const statusLabel =
    inspection.status === "completed"
      ? "Finalizada"
      : inspection.status === "in_progress"
        ? "En proceso"
        : "Borrador";

  /*
   * El estado también controla su color.
   */
  const statusColor =
    inspection.status === "completed"
      ? colors.success
      : inspection.status === "in_progress"
        ? colors.warning
        : colors.textMuted;

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/*
         * ResponsiveContainer centraliza:
         *
         * - padding horizontal
         * - espacio superior
         * - ancho máximo
         * - centrado en tablet y web
         */}
        <ResponsiveContainer>
          {/* ====================================================== */}
          {/* NAVEGACIÓN */}
          {/* ====================================================== */}

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

          {/* ====================================================== */}
          {/* ENCABEZADO */}
          {/* ====================================================== */}

          <Text
            style={[
              styles.companyOverline,
              {
                /*
                 * Conservamos el color
                 * representativo de la empresa.
                 */
                color: company.branding.primaryColor,
              },
            ]}
          >
            {company.name.toUpperCase()}
          </Text>

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

          {/* ====================================================== */}
          {/* BLOQUE SUPERIOR RESPONSIVE */}
          {/* ====================================================== */}

          {/*
           * Móvil y tablet:
           *
           * Información
           * Evidencias
           *
           * Desktop:
           *
           * Información | Evidencias
           *
           * Esto permite aprovechar el espacio horizontal
           * sin hacer que la versión móvil se sienta saturada.
           */}
          <View
            style={[styles.topContent, isDesktop && styles.topContentDesktop]}
          >
            {/* INFORMACIÓN GENERAL */}

            <View
              style={[
                styles.topColumn,

                isDesktop && styles.informationColumnDesktop,
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

            {/* EVIDENCIAS */}

            <View
              style={[
                styles.topColumn,

                isDesktop && styles.evidenceColumnDesktop,
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
                  opacity: pressed ? 0.75 : 1,
                })}
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
          </View>

          {/* ====================================================== */}
          {/* RESPUESTAS */}
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
              Respuestas
            </Text>

            {inspection.responses.length > 0 ? (
              /*
               * Cada respuesta pasa a utilizar
               * el sistema responsive:
               *
               * Móvil   → 1 columna
               * Tablet  → 2 columnas
               * Desktop → 3 columnas
               */
              <ResponsiveGrid
                phoneColumns={1}
                tabletColumns={2}
                desktopColumns={3}
                gap={Spacing.md}
              >
                {inspection.responses.map((response) => {
                  /*
                   * Buscamos la pregunta original para
                   * recuperar su etiqueta y tipo.
                   */
                  const question = form?.questions.find(
                    (item) => item.id === response.questionId,
                  );

                  return (
                    <AppCard
                      key={response.questionId}
                      style={styles.responseCard}
                    >
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
                          numberOfLines={3}
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
              </ResponsiveGrid>
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

          {/* ====================================================== */}
          {/* ACCIONES */}
          {/* ====================================================== */}

          <View style={styles.actions}>
            {inspection.status !== "completed" && (
              <View style={styles.actionButton}>
                {/*
                 * Conservamos el botón preparado.
                 *
                 * Todavía no modificamos su navegación
                 * porque el archivo original tampoco
                 * tenía un onPress definido.
                 */}
                <AppButton>Continuar captura</AppButton>
              </View>
            )}

            <View style={styles.actionButton}>
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
          </View>

          {/* ====================================================== */}
          {/* AVISO DEL PROTOTIPO */}
          {/* ====================================================== */}

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
        </ResponsiveContainer>
      </ScrollView>
    </Screen>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  INFO ROW                                  */
/* -------------------------------------------------------------------------- */

/*
 * Representa una pareja:
 *
 * Etiqueta
 * Valor
 *
 * dentro de la información general.
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
 * Convierte los diferentes tipos de respuesta
 * a texto legible.
 */
function formatResponseValue(value: string | number | boolean | null) {
  if (value === null) {
    return "Sin respuesta";
  }

  if (typeof value === "boolean") {
    return value ? "Sí" : "No";
  }

  return String(value);
}

/*
 * Convierte el tipo técnico de pregunta
 * en una etiqueta para interfaz.
 */
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

/*
 * Convierte:
 *
 * 2026-08-20
 *
 * a:
 *
 * 20/08/2026
 */
function formatDate(date: string) {
  const parts = date.split("-");

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

  /*
   * Móvil y tablet utilizan distribución
   * vertical.
   */
  topContent: {
    width: "100%",

    gap: Spacing.xl,

    marginBottom: Spacing.xl,
  },

  /*
   * En escritorio Información y Evidencias
   * pasan a colocarse lado a lado.
   */
  topContentDesktop: {
    flexDirection: "row",

    alignItems: "flex-start",
  },

  topColumn: {
    width: "100%",
  },

  /*
   * Damos más espacio a Información porque
   * contiene una mayor cantidad de datos.
   */
  informationColumnDesktop: {
    flex: 2,
    width: "auto",
    minWidth: 0,
  },

  evidenceColumnDesktop: {
    flex: 1,
    width: "auto",
    minWidth: 0,
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

  /*
   * ResponsiveGrid controla el ancho externo.
   * Cada respuesta ocupa todo el espacio
   * que recibe dentro de su columna.
   */
  responseCard: {
    width: "100%",

    minHeight: 150,
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
    minWidth: 0,

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
    minWidth: 0,
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

  /*
   * En móvil los botones pueden envolverse
   * naturalmente.
   *
   * En pantallas grandes pueden aprovechar
   * el espacio horizontal.
   */
  actions: {
    flexDirection: "row",

    flexWrap: "wrap",

    gap: Spacing.sm,
  },

  actionButton: {
    flexGrow: 1,

    /*
     * Evita botones excesivamente estrechos.
     */
    minWidth: 220,
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
