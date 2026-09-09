import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { router, useLocalSearchParams } from "expo-router";

import { ContextHeader } from "@/components/navigation/ContextHeader";

import { AppButton } from "@/components/ui/AppButton";

import { AppCard } from "@/components/ui/AppCard";

import { ResponsiveContainer } from "@/components/ui/ResponsiveContainer";

import { ResponsiveGrid } from "@/components/ui/ResponsiveGrid";

import { Screen } from "@/components/ui/Screen";

import { getFormsByIds } from "@/repositories/formRepository";

import { getInspectionsByPropertyId } from "@/repositories/inspectionRepository";

import { getCompanyById } from "@/repositories/companyRepository";

import { getPropertyById } from "@/repositories/propertyRepository";

import { FontSize, Radius, Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

import { useResponsive } from "@/hooks/useResponsive";
import { formatDate } from "@/utils/dateUtils";

import type {
  InspectionStatus,
  InspectionSyncStatus,
} from "@/types/inspection";

/*
 * ============================================================================
 * DETALLE DEL INMUEBLE
 * ============================================================================
 *
 * Pantalla principal de contexto para un inmueble.
 *
 * Desde aquí se puede acceder a:
 *
 * - nueva inspección;
 * - captura mediante formularios asignados;
 * - administración de formularios;
 * - inspecciones recientes;
 * - información del inmueble.
 */
export default function PropertyDetailsScreen() {
  const { colors } = useAppTheme();

  /*
   * ResponsiveGrid resuelve la mayoría de distribuciones.
   *
   * Aquí solamente necesitamos conocer
   * cuándo estamos en escritorio para organizar
   * la parte inferior en dos columnas.
   */
  const { isPhone, isTablet } = useResponsive();

  const isDesktop = !isPhone && !isTablet;

  /*
   * ==========================================================================
   * RUTA
   * ==========================================================================
   *
   * /empresas/[id]/inmuebles/[propertyId]
   */
  const { id, propertyId } = useLocalSearchParams<{
    id: string;
    propertyId: string;
  }>();

  /*
   * ==========================================================================
   * DATOS PRINCIPALES
   * ==========================================================================
   */
  const company = getCompanyById(id);

  const property = getPropertyById(propertyId);

  /*
   * ==========================================================================
   * RUTA INVÁLIDA
   * ==========================================================================
   */
  if (!company || !property || property.companyId !== company.id) {
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
   * ==========================================================================
   * FORMULARIOS ASIGNADOS
   * ==========================================================================
   *
   * Property.formIds ya procede preferentemente
   * de la relación SQL property_forms en Android/iOS.
   *
   * FormRepository resuelve después
   * las definiciones completas.
   */
  const propertyForms = getFormsByIds(property.formIds);

  /*
   * ==========================================================================
   * INSPECCIONES
   * ==========================================================================
   */
  const propertyInspections = getInspectionsByPropertyId(property.id);

  /*
   * Inspecciones todavía no finalizadas.
   */
  const pendingInspections = propertyInspections.filter(
    (inspection) => inspection.status !== "completed",
  ).length;

  /*
   * Inspecciones con error Kobo.
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
          {/* NAVEGACIÓN CONTEXTUAL                                        */}
          {/* ============================================================ */}

          <ContextHeader
            backLabel="Inmuebles"
            onBack={() =>
              router.navigate({
                pathname: "/empresas/[id]/inmuebles",

                params: {
                  id: company.id,
                },
              })
            }
            contextLabel={company.name}
            contextColor={company.branding.primaryColor}
            title={property.name}
            subtitle={`${location} · ${property.type}`}
          />

          {/* ============================================================ */}
          {/* RESUMEN                                                       */}
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
                    id: company.id,

                    propertyId: property.id,
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
            {/*
             * El encabezado ahora incluye un acceso
             * a la nueva pantalla de administración.
             */}
            <View style={styles.sectionHeaderRow}>
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

              <Pressable
                onPress={() =>
                  router.navigate({
                    pathname:
                      "/empresas/[id]/inmuebles/[propertyId]/formularios",

                    params: {
                      id: company.id,

                      propertyId: property.id,
                    },
                  })
                }
                style={({ pressed }) => ({
                  opacity: pressed ? 0.65 : 1,
                })}
              >
                <Text
                  style={[
                    styles.link,

                    {
                      color: colors.primary,
                    },
                  ]}
                >
                  Administrar
                </Text>
              </Pressable>
            </View>

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
                        id: company.id,

                        propertyId: property.id,

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

                <Pressable
                  onPress={() =>
                    router.navigate({
                      pathname:
                        "/empresas/[id]/inmuebles/[propertyId]/formularios",

                      params: {
                        id: company.id,

                        propertyId: property.id,
                      },
                    })
                  }
                  style={styles.emptyAction}
                >
                  <Text
                    style={[
                      styles.link,

                      {
                        color: colors.primary,
                      },
                    ]}
                  >
                    Asignar formularios
                  </Text>
                </Pressable>
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

                <Pressable
                  onPress={() =>
                    router.navigate({
                      pathname: "/empresas/[id]/inspecciones",

                      params: {
                        id: company.id,
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
                              id: company.id,

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

  const inspectionInfo = getInspectionStatusInfo(status, colors);

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

    case "syncing":
      return {
        label: "Sincronizando",

        color: colors.primary,
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

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: Spacing.xxxl,
  },

  summaryCard: {
    width: "100%",
    minWidth: 0,

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

  syncWarningCard: {
    marginTop: Spacing.md,
  },

  syncWarningRow: {
    width: "100%",
    minWidth: 0,

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

  mainAction: {
    marginTop: Spacing.sm,

    marginBottom: Spacing.xl,
  },

  section: {
    marginBottom: Spacing.xl,
  },

  sectionHeaderRow: {
    width: "100%",
    minWidth: 0,

    flexDirection: "row",
    flexWrap: "wrap",

    justifyContent: "space-between",

    alignItems: "center",

    gap: Spacing.md,

    marginBottom: Spacing.sm,
  },

  sectionTitle: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 220,
    minWidth: 0,

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
    flexShrink: 0,

    fontSize: FontSize.small,

    fontWeight: "600",
  },

  formCard: {
    width: "100%",
    minWidth: 0,

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
    flexShrink: 0,

    fontSize: 28,

    marginLeft: Spacing.sm,
  },

  bottomLayout: {
    width: "100%",
    minWidth: 0,

    gap: Spacing.xl,
  },

  bottomLayoutDesktop: {
    flexDirection: "row",

    alignItems: "flex-start",
  },

  bottomColumn: {
    width: "100%",
    minWidth: 0,
  },

  bottomColumnDesktop: {
    flex: 1,

    width: "auto",

    minWidth: 0,
  },

  inspectionsCard: {
    paddingVertical: Spacing.xs,
  },

  inspectionRow: {
    width: "100%",
    minWidth: 0,
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
    flexShrink: 1,
    minWidth: 0,

    alignItems: "flex-end",

    marginLeft: Spacing.sm,
  },

  inspectionStatus: {
    fontSize: FontSize.caption,

    fontWeight: "600",

    marginBottom: Spacing.xs,
  },

  syncStateRow: {
    minWidth: 0,

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
    flexShrink: 1,

    fontSize: FontSize.caption,

    fontWeight: "600",
  },

  inspectionArrow: {
    flexShrink: 0,

    fontSize: 26,

    marginLeft: Spacing.sm,
  },

  informationRow: {
    width: "100%",
    minWidth: 0,

    paddingVertical: Spacing.sm,
  },

  infoLabel: {
    fontSize: FontSize.caption,

    marginBottom: Spacing.xs,
  },

  infoValue: {
    minWidth: 0,

    fontSize: FontSize.small,

    fontWeight: "600",
  },

  divider: {
    height: 1,

    marginVertical: Spacing.sm,
  },

  emptyCard: {
    width: "100%",
    minWidth: 0,

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

  emptyAction: {
    alignSelf: "flex-start",

    marginTop: Spacing.md,
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
