import { useState } from "react";

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
import { getInspectionsByCompanyId } from "@/repositories/inspectionRepository";
import { getPropertyById } from "@/repositories/propertyRepository";

import {
  getInspectionSyncQueueCount,
  processInspectionSyncQueue,
} from "@/services/inspectionSyncQueueService";

import { FontSize, Radius, Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

import { formatDate } from "@/utils/dateUtils";

import type { InspectionSyncStatus } from "@/types/inspection";

export default function CompanyInspectionsScreen() {
  /*
   * Obtiene los colores del tema actual.
   *
   * Esto mantiene automáticamente compatibilidad
   * con modo claro y oscuro.
   */
  const { colors } = useAppTheme();

  /*
   * Recupera el ID dinámico de la empresa:
   *
   * /empresas/[id]/inspecciones
   */
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  /*
   * Estado visual de la sincronización manual de esta empresa.
   *
   * refreshVersion obliga a releer el repositorio en memoria después
   * de que la cola modifica una o más inspecciones.
   */
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [refreshVersion, setRefreshVersion] = useState(0);

  void refreshVersion;

  /*
   * Recuperamos la empresa desde la capa
   * centralizada de datos.
   */
  const company = getCompanyById(id);

  /*
   * Si el ID no corresponde a una empresa
   * existente mostramos un estado controlado.
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
   * Recuperamos únicamente las inspecciones
   * que pertenecen a la empresa actual.
   */
  const companyInspections = getInspectionsByCompanyId(company.id);

  /*
   * Calculamos los contadores del resumen
   * directamente desde los datos.
   *
   * Así evitamos mantener números escritos
   * manualmente dentro de la interfaz.
   */
  const completed = companyInspections.filter(
    (inspection) => inspection.status === "completed",
  ).length;

  const inProgress = companyInspections.filter(
    (inspection) => inspection.status === "in_progress",
  ).length;

  const drafts = companyInspections.filter(
    (inspection) => inspection.status === "draft",
  ).length;

  /*
   * La cola se limita exclusivamente a las inspecciones de esta empresa.
   * Así el botón de esta pantalla no dispara registros de otras empresas.
   */
  const companyInspectionIds = companyInspections.map(
    (inspection) => inspection.id,
  );

  const syncQueueCount = getInspectionSyncQueueCount({
    inspectionIds: companyInspectionIds,
    includeErrors: true,
    includeInterrupted: true,
  });

  const syncErrorCount = companyInspections.filter(
    (inspection) => inspection.integration?.syncStatus === "error",
  ).length;

  async function handleCompanySync() {
    if (isSyncing || syncQueueCount === 0) {
      return;
    }

    setIsSyncing(true);
    setSyncMessage(null);

    try {
      const result = await processInspectionSyncQueue({
        inspectionIds: companyInspectionIds,
        includeErrors: true,
        includeInterrupted: true,
      });

      if (result.failed > 0) {
        setSyncMessage(
          `Se procesaron ${result.processed} inspección(es): ${result.synced} sincronizada(s) y ${result.failed} con error.`,
        );
      } else {
        setSyncMessage(
          `Sincronización completada: ${result.synced} inspección(es) sincronizada(s).`,
        );
      }
    } catch (error) {
      setSyncMessage(getErrorMessage(error));
    } finally {
      setRefreshVersion((value) => value + 1);
      setIsSyncing(false);
    }
  }

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/*
         * ResponsiveContainer controla globalmente:
         *
         * - espacio superior
         * - padding horizontal
         * - ancho máximo
         * - centrado en tablet y web
         */}
        <ResponsiveContainer>
          {/* ====================================================== */}
          {/* NAVEGACIÓN CONTEXTUAL */}
          {/* ====================================================== */}

          <ContextHeader
            /*
             * Inspecciones pertenece al contexto de la empresa.
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
            /*
             * El nombre y color de la empresa permanecen visibles.
             */
            contextLabel={company.name}
            contextColor={company.branding.primaryColor}
            title="Inspecciones"
            subtitle="Consulta el historial de capturas realizadas para esta empresa."
          />

          {/* ====================================================== */}
          {/* RESUMEN */}
          {/* ====================================================== */}

          {/*
           * Tenemos exactamente tres estados principales,
           * por lo que mantenemos tres tarjetas en todos
           * los tamaños.
           */}
          <ResponsiveGrid
            phoneColumns={3}
            tabletColumns={3}
            desktopColumns={3}
            gap={Spacing.sm}
          >
            <SummaryCard value={completed.toString()} label="Finalizadas" />

            <SummaryCard
              value={inProgress.toString()}
              label="En proceso"
              warning={inProgress > 0}
            />

            <SummaryCard value={drafts.toString()} label="Borradores" />
          </ResponsiveGrid>

          {/* ====================================================== */}
          {/* SINCRONIZACIÓN KOBO */}
          {/* ====================================================== */}

          {(syncQueueCount > 0 || syncMessage) && (
            <AppCard style={styles.syncCard}>
              <View style={styles.syncCardContent}>
                <View style={styles.syncCardInfo}>
                  <Text
                    style={[
                      styles.syncCardTitle,
                      {
                        color: syncErrorCount > 0 ? colors.error : colors.text,
                      },
                    ]}
                  >
                    Sincronización Kobo
                  </Text>

                  <Text
                    style={[
                      styles.syncCardDescription,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {syncQueueCount > 0
                      ? `${syncQueueCount} inspección(es) requieren sincronización${
                          syncErrorCount > 0
                            ? `; ${syncErrorCount} presentan error.`
                            : "."
                        }`
                      : "No quedan inspecciones pendientes de sincronización."}
                  </Text>

                  {syncMessage ? (
                    <Text
                      style={[
                        styles.syncMessage,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {syncMessage}
                    </Text>
                  ) : null}
                </View>

                {syncQueueCount > 0 ? (
                  <View style={styles.syncButton}>
                    <AppButton onPress={handleCompanySync}>
                      {isSyncing
                        ? "Sincronizando..."
                        : "Sincronizar pendientes"}
                    </AppButton>
                  </View>
                ) : null}
              </View>
            </AppCard>
          )}

          {/* ====================================================== */}
          {/* HISTORIAL */}
          {/* ====================================================== */}

          <Text
            style={[
              styles.sectionTitle,
              {
                color: colors.text,
              },
            ]}
          >
            Historial
          </Text>

          {/*
           * ResponsiveGrid reemplaza la lista vertical fija.
           *
           * Móvil   → 1 inspección por fila
           * Tablet  → 2 inspecciones por fila
           * Desktop → 3 inspecciones por fila
           */}
          <ResponsiveGrid
            phoneColumns={1}
            tabletColumns={2}
            desktopColumns={3}
            gap={Spacing.md}
          >
            {companyInspections.map((inspection) => {
              /*
               * Cada inspección solamente almacena IDs.
               *
               * Aquí resolvemos:
               *
               * propertyId → nombre del inmueble
               * formId     → nombre del formulario
               */
              const property = getPropertyById(inspection.propertyId);

              const form = getFormById(inspection.formId);

              return (
                <InspectionCard
                  key={inspection.id}
                  inspectionId={inspection.id}
                  companyRouteId={id}
                  propertyId={inspection.propertyId}
                  formId={inspection.formId}
                  form={form?.title ?? "Formulario no disponible"}
                  property={property?.name ?? "Inmueble no disponible"}
                  date={inspection.date}
                  inspector={inspection.inspector}
                  status={inspection.status}
                  syncStatus={inspection.integration?.syncStatus ?? "local"}
                />
              );
            })}
          </ResponsiveGrid>

          {/* ====================================================== */}
          {/* ESTADO VACÍO */}
          {/* ====================================================== */}

          {companyInspections.length === 0 && (
            <AppCard style={styles.emptyCard}>
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
                Todavía no existen inspecciones registradas para esta empresa.
              </Text>
            </AppCard>
          )}
        </ResponsiveContainer>
      </ScrollView>
    </Screen>
  );
}

/* -------------------------------------------------------------------------- */
/*                               SUMMARY CARD                                 */
/* -------------------------------------------------------------------------- */

/*
 * Tarjeta pequeña utilizada para mostrar
 * los contadores principales.
 *
 * warning permite resaltar valores
 * que requieren atención.
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
/*                              INSPECTION CARD                               */
/* -------------------------------------------------------------------------- */

/*
 * Tarjeta que representa una inspección.
 *
 * Recibe la información ya resuelta para que
 * el componente no tenga que consultar
 * directamente la capa de datos.
 */
function InspectionCard({
  inspectionId,
  companyRouteId,
  propertyId,
  formId,
  form,
  property,
  date,
  inspector,
  status,
  syncStatus,
}: {
  inspectionId: string;
  companyRouteId: string;
  propertyId: string;
  formId: string;
  form: string;
  property: string;
  date: string;
  inspector: string;
  status: "draft" | "in_progress" | "completed";
  syncStatus: InspectionSyncStatus;
}) {
  const { colors } = useAppTheme();

  /*
   * Traducimos el estado interno a una
   * etiqueta entendible para el usuario.
   */
  const statusLabel =
    status === "completed"
      ? "Finalizada"
      : status === "in_progress"
        ? "En proceso"
        : "Borrador";

  /*
   * El color también depende del estado:
   *
   * completed   → verde
   * in_progress → advertencia
   * draft       → neutro
   */
  const statusColor =
    status === "completed"
      ? colors.success
      : status === "in_progress"
        ? colors.warning
        : colors.textMuted;

  const syncLabel =
    status !== "completed"
      ? undefined
      : syncStatus === "synced"
        ? "Sincronizada"
        : syncStatus === "syncing"
          ? "Sincronizando"
          : syncStatus === "pending"
            ? "Pendiente de subir"
            : syncStatus === "error"
              ? "Error Kobo"
              : "Local";

  const syncColor =
    syncStatus === "synced"
      ? colors.success
      : syncStatus === "error"
        ? colors.error
        : syncStatus === "pending"
          ? colors.warning
          : syncStatus === "syncing"
            ? colors.primary
            : colors.textMuted;

  const openInspection = () => {
    /*
     * Borrador / En proceso:
     * regresan directamente a captura.
     *
     * Finalizada:
     * abre solamente el detalle.
     */
    if (status !== "completed") {
      router.navigate({
        pathname: "/empresas/[id]/inmuebles/[propertyId]/captura",

        params: {
          id: companyRouteId,
          propertyId,
          formId,
          inspectionId,
        },
      });

      return;
    }

    router.navigate({
      pathname: "/empresas/[id]/inspecciones/[inspectionId]",

      params: {
        id: companyRouteId,
        inspectionId,
      },
    });
  };

  return (
    <Pressable
      onPress={openInspection}
      style={({ pressed }) => ({
        /*
         * Feedback visual al tocar la tarjeta.
         */
        opacity: pressed ? 0.75 : 1,
      })}
    >
      <AppCard style={styles.inspectionCard}>
        {/* CABECERA */}

        <View style={styles.cardHeader}>
          <View
            style={[
              styles.icon,
              {
                backgroundColor: colors.primarySoft,
              },
            ]}
          >
            <Text
              style={[
                styles.iconText,
                {
                  color: colors.primary,
                },
              ]}
            >
              ✓
            </Text>
          </View>

          <View style={styles.cardInfo}>
            <Text
              style={[
                styles.formTitle,
                {
                  color: colors.text,
                },
              ]}
              numberOfLines={2}
            >
              {form}
            </Text>

            <Text
              style={[
                styles.property,
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
            ›
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

        {/* METADATOS */}

        <View style={styles.meta}>
          <View style={styles.metaInformation}>
            <Text
              style={[
                styles.metaText,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              {formatDate(date)}
            </Text>

            <Text
              style={[
                styles.inspector,
                {
                  color: colors.textSecondary,
                },
              ]}
              numberOfLines={1}
            >
              Inspector: {inspector}
            </Text>
          </View>

          <View style={styles.stateColumn}>
            <Text
              style={[
                styles.status,
                {
                  color: statusColor,
                },
              ]}
            >
              ● {statusLabel}
            </Text>

            {syncLabel && (
              <Text
                style={[
                  styles.syncStatus,
                  {
                    color: syncColor,
                  },
                ]}
              >
                {syncLabel}
              </Text>
            )}
          </View>
        </View>
      </AppCard>
    </Pressable>
  );
}

/* -------------------------------------------------------------------------- */
/*                                UTILIDADES                                  */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/*                                UTILIDAD DE ERROR                            */
/* -------------------------------------------------------------------------- */

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Ocurrió un error al procesar la sincronización.";
}

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  /*
   * ResponsiveContainer ya controla
   * padding horizontal y superior.
   *
   * Aquí solamente necesitamos espacio
   * inferior para el ScrollView.
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
   * El ancho de SummaryCard lo determina
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

  syncCard: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },

  syncCardContent: {
    width: "100%",
    minWidth: 0,
    gap: Spacing.md,
  },

  syncCardInfo: {
    width: "100%",
    minWidth: 0,
  },

  syncCardTitle: {
    fontSize: FontSize.body,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },

  syncCardDescription: {
    fontSize: FontSize.small,
    lineHeight: 20,
  },

  syncMessage: {
    fontSize: FontSize.caption,
    lineHeight: 18,
    marginTop: Spacing.sm,
  },

  syncButton: {
    alignSelf: "flex-start",
  },

  sectionTitle: {
    fontSize: FontSize.cardTitle,

    fontWeight: "700",

    marginTop: Spacing.xl,

    marginBottom: Spacing.md,
  },

  /*
   * Cada tarjeta ocupa siempre el 100%
   * del espacio que ResponsiveGrid le asigna.
   */
  inspectionCard: {
    width: "100%",

    /*
     * Mantiene una altura mínima razonable.
     * Esto ayuda a que las filas se vean más
     * uniformes en tablet y escritorio.
     */
    minHeight: 190,
  },

  cardHeader: {
    flexDirection: "row",

    alignItems: "center",
  },

  icon: {
    width: 48,
    height: 48,

    borderRadius: Radius.md,

    alignItems: "center",

    justifyContent: "center",

    marginRight: Spacing.md,
  },

  iconText: {
    fontSize: FontSize.h3,

    fontWeight: "700",
  },

  /*
   * minWidth: 0 es importante dentro de
   * layouts flex porque permite que Text
   * se reduzca correctamente en tarjetas
   * más estrechas.
   */
  cardInfo: {
    flex: 1,
    minWidth: 0,
  },

  formTitle: {
    fontSize: FontSize.body,

    fontWeight: "700",

    marginBottom: Spacing.xs,
  },

  property: {
    fontSize: FontSize.small,

    lineHeight: 20,
  },

  arrow: {
    fontSize: 28,

    marginLeft: Spacing.sm,
  },

  divider: {
    height: 1,

    marginVertical: Spacing.md,
  },

  meta: {
    flexDirection: "row",

    justifyContent: "space-between",

    alignItems: "center",

    gap: Spacing.md,
  },

  metaInformation: {
    flex: 1,
    minWidth: 0,
  },

  metaText: {
    fontSize: FontSize.caption,

    marginBottom: Spacing.xs,
  },

  inspector: {
    fontSize: FontSize.caption,
  },

  stateColumn: {
    alignItems: "flex-end",
    gap: 2,
  },

  syncStatus: {
    fontSize: FontSize.caption,
    fontWeight: "600",
  },

  status: {
    flexShrink: 0,

    fontSize: FontSize.caption,

    fontWeight: "700",
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
