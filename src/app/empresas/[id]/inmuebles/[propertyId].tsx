import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { router, useLocalSearchParams } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { ResponsiveContainer } from "@/components/ui/ResponsiveContainer";
import { ResponsiveGrid } from "@/components/ui/ResponsiveGrid";
import { Screen } from "@/components/ui/Screen";

import { getCompanyById } from "@/data/companies";
import { getFormsByIds } from "@/data/forms";
import { getInspectionsByPropertyId } from "@/data/inspections";
import { getPropertyById } from "@/data/properties";

import { FontSize, Radius, Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";
import { useResponsive } from "@/hooks/useResponsive";

import type {
  InspectionStatus,
  InspectionSyncStatus,
} from "@/types/inspection";

export default function PropertyDetailsScreen() {
  const { colors } = useAppTheme();

  /*
   * ResponsiveGrid resuelve la mayoría de
   * distribuciones responsive.
   *
   * Aquí solamente necesitamos saber cuándo
   * estamos en escritorio para utilizar
   * dos columnas en la parte inferior.
   */
  const { isPhone, isTablet } = useResponsive();

  const isDesktop = !isPhone && !isTablet;

  /*
   * Ruta:
   *
   * /empresas/[id]/inmuebles/[propertyId]
   */
  const { id, propertyId } = useLocalSearchParams<{
    id: string;
    propertyId: string;
  }>();

  /*
   * Obtenemos empresa e inmueble.
   */
  const company = getCompanyById(id);

  const property = getPropertyById(propertyId);

  /*
   * Controlamos rutas inválidas.
   */
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

  /*
   * Formularios asignados al inmueble.
   */
  const propertyForms = getFormsByIds(property.formIds);

  /*
   * Inspecciones provenientes de nuestra
   * fuente centralizada.
   *
   * Esto ya incluye tanto las inspecciones mock
   * como las nuevas capturas creadas por
   * inspectionRepository.
   */
  const propertyInspections = getInspectionsByPropertyId(property.id);

  /*
   * Consideramos pendientes las inspecciones
   * cuyo flujo de captura todavía no terminó.
   */
  const pendingInspections = propertyInspections.filter(
    (inspection) => inspection.status !== "completed",
  ).length;

  /*
   * Además calculamos cuántas inspecciones
   * tienen problemas de sincronización.
   *
   * Esto será útil posteriormente para mostrar
   * alertas a nivel inmueble.
   */
  const syncErrors = propertyInspections.filter(
    (inspection) => inspection.integration?.syncStatus === "error",
  ).length;

  const location = `${property.city}, ${property.state}`;

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ResponsiveContainer>
          {/* ============================================================ */}
          {/* NAVEGACIÓN                                                   */}
          {/* ============================================================ */}

          <View style={styles.topNavigation}>
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
                  styles.link,
                  {
                    color: colors.primary,
                  },
                ]}
              >
                Ver todas
              </Text>
            </Pressable>

            {/*
             * El control se conserva preparado.
             *
             * Todavía no tenemos una ruta específica
             * para editar inmuebles.
             */}
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

          {/* ============================================================ */}
          {/* EMPRESA                                                      */}
          {/* ============================================================ */}

          <Text
            style={[
              styles.overline,
              {
                /*
                 * Conservamos el color representativo
                 * de cada empresa.
                 */
                color: company.branding.primaryColor,
              },
            ]}
          >
            {company.name.toUpperCase()}
          </Text>

          {/* ============================================================ */}
          {/* IDENTIDAD DEL INMUEBLE                                       */}
          {/* ============================================================ */}

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
                numberOfLines={2}
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

          {/* ============================================================ */}
          {/* RESUMEN                                                      */}
          {/* ============================================================ */}

          <ResponsiveGrid
            phoneColumns={3}
            tabletColumns={3}
            desktopColumns={3}
            gap={Spacing.sm}
          >
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
          </ResponsiveGrid>

          {/* ============================================================ */}
          {/* ADVERTENCIA DE SINCRONIZACIÓN                                */}
          {/* ============================================================ */}

          {syncErrors > 0 && (
            <AppCard style={styles.syncWarningCard}>
              <View style={styles.syncWarningRow}>
                <View
                  style={[
                    styles.syncWarningIcon,
                    {
                      backgroundColor: `${colors.error}20`,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: colors.error,

                      fontWeight: "700",
                    }}
                  >
                    !
                  </Text>
                </View>

                <View style={styles.syncWarningInfo}>
                  <Text
                    style={[
                      styles.syncWarningTitle,
                      {
                        color: colors.error,
                      },
                    ]}
                  >
                    Sincronización pendiente
                  </Text>

                  <Text
                    style={[
                      styles.syncWarningDescription,
                      {
                        color: colors.textSecondary,
                      },
                    ]}
                  >
                    {syncErrors} inspección
                    {syncErrors !== 1 ? "es" : ""} presenta
                    {syncErrors === 1 ? "" : "n"} un error de sincronización con
                    Kobo.
                  </Text>
                </View>
              </View>
            </AppCard>
          )}

          {/* ============================================================ */}
          {/* ACCIÓN PRINCIPAL                                             */}
          {/* ============================================================ */}

          <View style={styles.mainAction}>
            <AppButton
              onPress={() =>
                router.navigate({
                  pathname:
                    "/empresas/[id]/inmuebles/[propertyId]/nueva-inspeccion",

                  params: {
                    id,
                    propertyId,
                  },
                })
              }
            >
              + Nueva inspección
            </AppButton>
          </View>

          {/* ============================================================ */}
          {/* FORMULARIOS ASIGNADOS                                        */}
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

            {/*
             * Móvil   → 1 columna
             * Tablet  → 2 columnas
             * Desktop → 3 columnas
             */}
            <ResponsiveGrid
              phoneColumns={1}
              tabletColumns={2}
              desktopColumns={3}
              gap={Spacing.md}
            >
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
            </ResponsiveGrid>

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

          {/* ============================================================ */}
          {/* ÁREA INFERIOR RESPONSIVE                                     */}
          {/* ============================================================ */}

          <View
            style={[
              styles.bottomLayout,

              isDesktop && styles.bottomLayoutDesktop,
            ]}
          >
            {/* ========================================================== */}
            {/* INSPECCIONES RECIENTES                                     */}
            {/* ========================================================== */}

            <View
              style={[
                styles.bottomColumn,

                isDesktop && styles.bottomColumnDesktop,
              ]}
            >
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

                {/*
                 * Este botón ya queda conectado
                 * al historial completo.
                 */}
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
                <AppCard style={styles.inspectionsCard}>
                  {propertyInspections.slice(0, 3).map((inspection, index) => (
                    <View key={inspection.id}>
                      {/*
                       * Cada fila ahora abre el detalle
                       * de la inspección correspondiente.
                       */}
                      <InspectionRow
                        inspector={inspection.inspector}
                        date={inspection.date}
                        status={inspection.status}
                        syncStatus={
                          inspection.integration?.syncStatus ?? "local"
                        }
                        onPress={() =>
                          router.navigate({
                            pathname:
                              "/empresas/[id]/inspecciones/[inspectionId]",

                            params: {
                              id,

                              inspectionId: inspection.id,
                            },
                          })
                        }
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
                    Todavía no existen inspecciones registradas para este
                    inmueble.
                  </Text>
                </AppCard>
              )}
            </View>

            {/* ========================================================== */}
            {/* INFORMACIÓN DEL INMUEBLE                                  */}
            {/* ========================================================== */}

            <View
              style={[
                styles.bottomColumn,

                isDesktop && styles.bottomColumnDesktop,
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

                    <InformationRow
                      label="Dirección"
                      value={property.address}
                    />
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
          </View>
        </ResponsiveContainer>
      </ScrollView>
    </Screen>
  );
}

/* -------------------------------------------------------------------------- */
/*                              SUMMARY CARD                                  */
/* -------------------------------------------------------------------------- */

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
/*                                FORM CARD                                   */
/* -------------------------------------------------------------------------- */

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
          numberOfLines={2}
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

/* -------------------------------------------------------------------------- */
/*                            INSPECTION ROW                                  */
/* -------------------------------------------------------------------------- */

/*
 * Representa una inspección dentro de la tarjeta
 * de "Inspecciones recientes".
 *
 * Ahora también conoce:
 *
 * - estado de captura
 * - estado de sincronización
 * - navegación al detalle
 */
function InspectionRow({
  inspector,
  date,
  status,
  syncStatus,
  onPress,
}: {
  inspector: string;

  date: string;

  status: InspectionStatus;

  syncStatus: InspectionSyncStatus;

  onPress: () => void;
}) {
  const { colors } = useAppTheme();

  /*
   * Estado funcional de la inspección.
   */
  const inspectionInfo = getInspectionStatusInfo(status, colors);

  /*
   * Estado Kobo/local.
   */
  const syncInfo = getSyncStatusInfo(syncStatus, colors);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.inspectionRow,

        {
          opacity: pressed ? 0.65 : 1,
        },
      ]}
    >
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

      <View style={styles.inspectionStates}>
        <Text
          style={[
            styles.inspectionStatus,
            {
              color: inspectionInfo.color,
            },
          ]}
        >
          {inspectionInfo.label}
        </Text>

        <View style={styles.syncStateRow}>
          <View
            style={[
              styles.syncDot,
              {
                backgroundColor: syncInfo.color,
              },
            ]}
          />

          <Text
            style={[
              styles.syncStateText,
              {
                color: syncInfo.color,
              },
            ]}
          >
            {syncInfo.label}
          </Text>
        </View>
      </View>

      <Text
        style={[
          styles.inspectionArrow,
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

/* -------------------------------------------------------------------------- */
/*                            INFORMATION ROW                                 */
/* -------------------------------------------------------------------------- */

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
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

function getInspectionStatusInfo(
  status: InspectionStatus,
  colors: {
    success: string;
    warning: string;
    textMuted: string;
  },
) {
  switch (status) {
    case "completed":
      return {
        label: "Finalizada",

        color: colors.success,
      };

    case "in_progress":
      return {
        label: "En proceso",

        color: colors.warning,
      };

    case "draft":
    default:
      return {
        label: "Borrador",

        color: colors.textMuted,
      };
  }
}

/*
 * Traducimos el estado técnico de sincronización
 * a una etiqueta corta para las filas recientes.
 */
function getSyncStatusInfo(
  status: InspectionSyncStatus,
  colors: {
    success: string;
    warning: string;
    error: string;
    textMuted: string;
    primary: string;
  },
) {
  switch (status) {
    case "synced":
      return {
        label: "Sincronizada",

        color: colors.success,
      };

    case "pending":
      return {
        label: "Pendiente",

        color: colors.warning,
      };

    case "error":
      return {
        label: "Error Kobo",

        color: colors.error,
      };

    case "local":
    default:
      return {
        label: "Local",

        color: colors.textMuted,
      };
  }
}

/*
 * Ahora soportamos tanto las fechas antiguas:
 *
 * 2026-08-20
 *
 * como las generadas por el repositorio:
 *
 * 2026-08-20T20:25:00.000Z
 */
function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("es-MX", {
    day: "2-digit",

    month: "2-digit",

    year: "numeric",
  });
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

  /* -------------------------------------------------------------------- */
  /* NAVEGACIÓN                                                           */
  /* -------------------------------------------------------------------- */

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

  /* -------------------------------------------------------------------- */
  /* HEADER                                                               */
  /* -------------------------------------------------------------------- */

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

    flexShrink: 0,

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

    minWidth: 0,
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

  /* -------------------------------------------------------------------- */
  /* SUMMARY                                                              */
  /* -------------------------------------------------------------------- */

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

  /* -------------------------------------------------------------------- */
  /* SYNC WARNING                                                         */
  /* -------------------------------------------------------------------- */

  syncWarningCard: {
    marginTop: Spacing.md,
  },

  syncWarningRow: {
    flexDirection: "row",

    alignItems: "center",
  },

  syncWarningIcon: {
    width: 42,

    height: 42,

    flexShrink: 0,

    alignItems: "center",

    justifyContent: "center",

    borderRadius: Radius.full,

    marginRight: Spacing.md,
  },

  syncWarningInfo: {
    flex: 1,

    minWidth: 0,
  },

  syncWarningTitle: {
    fontSize: FontSize.small,

    fontWeight: "700",

    marginBottom: Spacing.xs,
  },

  syncWarningDescription: {
    fontSize: FontSize.caption,

    lineHeight: 18,
  },

  /* -------------------------------------------------------------------- */
  /* MAIN ACTION                                                          */
  /* -------------------------------------------------------------------- */

  mainAction: {
    marginTop: Spacing.sm,

    marginBottom: Spacing.xl,
  },

  /* -------------------------------------------------------------------- */
  /* SECTIONS                                                             */
  /* -------------------------------------------------------------------- */

  section: {
    marginBottom: Spacing.xl,
  },

  sectionHeaderRow: {
    flexDirection: "row",

    justifyContent: "space-between",

    alignItems: "center",

    gap: Spacing.md,

    marginBottom: Spacing.sm,
  },

  sectionTitle: {
    flexShrink: 1,

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

  /* -------------------------------------------------------------------- */
  /* FORM CARD                                                            */
  /* -------------------------------------------------------------------- */

  formCard: {
    width: "100%",

    minHeight: 88,

    flexDirection: "row",

    alignItems: "center",

    padding: Spacing.md,

    borderWidth: 1,

    borderRadius: Radius.lg,
  },

  formIcon: {
    width: 44,

    height: 44,

    flexShrink: 0,

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

    minWidth: 0,
  },

  formTitle: {
    fontSize: FontSize.body,

    fontWeight: "600",

    marginBottom: Spacing.xs,
  },

  formMeta: {
    flexDirection: "row",

    flexWrap: "wrap",

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

  /* -------------------------------------------------------------------- */
  /* BOTTOM LAYOUT                                                        */
  /* -------------------------------------------------------------------- */

  bottomLayout: {
    width: "100%",

    gap: Spacing.xl,
  },

  bottomLayoutDesktop: {
    flexDirection: "row",

    alignItems: "flex-start",
  },

  bottomColumn: {
    width: "100%",
  },

  bottomColumnDesktop: {
    flex: 1,

    width: "auto",

    minWidth: 0,
  },

  /* -------------------------------------------------------------------- */
  /* INSPECTIONS                                                          */
  /* -------------------------------------------------------------------- */

  inspectionsCard: {
    paddingVertical: Spacing.xs,
  },

  inspectionRow: {
    minHeight: 76,

    flexDirection: "row",

    alignItems: "center",

    paddingVertical: Spacing.sm,
  },

  inspectionInfo: {
    flex: 1,

    minWidth: 0,
  },

  inspectionTitle: {
    fontSize: FontSize.small,

    fontWeight: "600",

    marginBottom: Spacing.xs,
  },

  inspectionDate: {
    fontSize: FontSize.caption,
  },

  inspectionStates: {
    alignItems: "flex-end",

    marginLeft: Spacing.sm,
  },

  inspectionStatus: {
    fontSize: FontSize.caption,

    fontWeight: "600",

    marginBottom: Spacing.xs,
  },

  syncStateRow: {
    flexDirection: "row",

    alignItems: "center",
  },

  syncDot: {
    width: 6,

    height: 6,

    borderRadius: Radius.full,

    marginRight: Spacing.xs,
  },

  syncStateText: {
    fontSize: FontSize.caption,

    fontWeight: "600",
  },

  inspectionArrow: {
    flexShrink: 0,

    fontSize: 26,

    marginLeft: Spacing.sm,
  },

  /* -------------------------------------------------------------------- */
  /* INFORMATION                                                          */
  /* -------------------------------------------------------------------- */

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

  /* -------------------------------------------------------------------- */
  /* EMPTY                                                                */
  /* -------------------------------------------------------------------- */

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

  /* -------------------------------------------------------------------- */
  /* NOT FOUND                                                            */
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
