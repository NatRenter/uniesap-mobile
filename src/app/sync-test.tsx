import { useState } from "react";

import { ScrollView, StyleSheet, Text, View } from "react-native";

import { router } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { ResponsiveContainer } from "@/components/ui/ResponsiveContainer";
import { Screen } from "@/components/ui/Screen";

import {
    getInspections,
    updateInspection,
} from "@/repositories/inspectionRepository";

import {
    getInspectionSyncQueue,
    processInspectionSyncQueue,
    type InspectionSyncQueueResult,
} from "@/services/inspectionSyncQueueService";

import { FontSize, Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

import type { InspectionSyncStatus } from "@/types/inspection";

export default function SyncTestScreen() {
  const { colors } = useAppTheme();

  /*
   * Este contador únicamente fuerza
   * una nueva lectura de la cola.
   *
   * Más adelante utilizaremos un sistema
   * reactivo para estos cambios.
   */
  const [queueVersion, setQueueVersion] = useState(0);

  const [isProcessing, setIsProcessing] = useState(false);

  const [isPreparing, setIsPreparing] = useState(false);

  const [result, setResult] = useState<InspectionSyncQueueResult | null>(null);

  const [error, setError] = useState<string | null>(null);

  /*
   * Leemos deliberadamente queueVersion
   * para provocar un nuevo render.
   */
  void queueVersion;

  /*
   * La cola se reconstruye en cada render
   * utilizando la información actual
   * del repositorio.
   */
  const queue = getInspectionSyncQueue();

  /* ------------------------------------------------------------------------ */
  /*                     PREPARAR INSPECCIÓN PENDING                          */
  /* ------------------------------------------------------------------------ */

  /*
   * Esta función existe únicamente para desarrollo.
   *
   * Busca una inspección ya sincronizada y la convierte
   * nuevamente en una candidata pending.
   *
   * Nos permite probar:
   *
   * pending
   *   ↓
   * cola
   *   ↓
   * syncing
   *   ↓
   * synced
   *
   * sin tener que desconectar la red o modificar
   * manualmente localStorage / SQLite.
   */
  const handleCreatePendingTest = async () => {
    if (isPreparing || isProcessing) {
      return;
    }

    setIsPreparing(true);

    setError(null);

    setResult(null);

    try {
      const inspections = getInspections();

      /*
       * Buscamos una inspección terminada
       * y sincronizada.
       *
       * Preferimos una sincronizada porque sabemos
       * que utiliza un formulario compatible con Kobo.
       */
      const candidate = inspections.find(
        (inspection) =>
          inspection.status === "completed" &&
          inspection.integration?.syncStatus !== "pending" &&
          inspection.integration?.syncStatus !== "syncing" &&
          inspection.integration?.syncStatus !== "error",
      );

      if (!candidate) {
        setError(
          "No hay inspecciones completadas disponibles para preparar otra prueba pending.",
        );

        return;
      }

      /*
       * La convertimos en pending.
       *
       * No copiamos la referencia Kobo anterior,
       * porque queremos simular una inspección
       * que todavía necesita ser enviada.
       */
      const updatedInspection = await updateInspection(candidate.id, {
        integration: {
          syncStatus: "pending",

          lastSyncError: undefined,
        },
      });

      if (!updatedInspection) {
        throw new Error("No fue posible preparar la inspección de prueba.");
      }

      console.log("Inspección preparada como pending:", {
        inspectionId: updatedInspection.id,

        syncStatus: updatedInspection.integration?.syncStatus,
      });

      /*
       * Fuerza una nueva lectura visual
       * de getInspectionSyncQueue().
       */
      setQueueVersion((value) => value + 1);
    } catch (testError) {
      const message =
        testError instanceof Error
          ? testError.message
          : "Error desconocido preparando la prueba.";

      console.error("Error preparando inspección pending:", testError);

      setError(message);
    } finally {
      setIsPreparing(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /*                          PROCESAR COLA                                   */
  /* ------------------------------------------------------------------------ */

  const handleProcessQueue = async () => {
    if (isProcessing || isPreparing) {
      return;
    }

    setIsProcessing(true);

    setError(null);

    try {
      /*
       * El servicio:
       *
       * 1. obtiene pending/error/syncing;
       * 2. las procesa una por una;
       * 3. delega cada envío a syncInspection().
       */
      const syncResult = await processInspectionSyncQueue();

      setResult(syncResult);

      /*
       * Volvemos a leer la cola.
       *
       * Las inspecciones sincronizadas ya
       * no deberían aparecer.
       */
      setQueueVersion((value) => value + 1);
    } catch (processingError) {
      const message =
        processingError instanceof Error
          ? processingError.message
          : "Error desconocido procesando la cola.";

      console.error(
        "Error procesando cola de sincronización:",
        processingError,
      );

      setError(message);
    } finally {
      setIsProcessing(false);
    }
  };

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

          <Text
            style={[
              styles.back,
              {
                color: colors.primary,
              },
            ]}
            onPress={() => router.back()}
          >
            ‹ Volver
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
            DESARROLLO
          </Text>

          <Text
            style={[
              styles.title,
              {
                color: colors.text,
              },
            ]}
          >
            Cola de sincronización
          </Text>

          <Text
            style={[
              styles.subtitle,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            Herramienta temporal para comprobar las inspecciones pendientes de
            sincronización con Kobo.
          </Text>

          {/* ============================================================ */}
          {/* MÉTRICA                                                       */}
          {/* ============================================================ */}

          <AppCard>
            <Text
              style={[
                styles.metricLabel,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              Inspecciones en cola
            </Text>

            <Text
              style={[
                styles.metricValue,
                {
                  color: queue.length > 0 ? colors.warning : colors.success,
                },
              ]}
            >
              {queue.length}
            </Text>
          </AppCard>

          {/* ============================================================ */}
          {/* CANDIDATOS                                                    */}
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
              Candidatos
            </Text>

            {queue.length === 0 ? (
              <AppCard>
                <Text
                  style={[
                    styles.emptyTitle,
                    {
                      color: colors.text,
                    },
                  ]}
                >
                  Cola vacía
                </Text>

                <Text
                  style={[
                    styles.emptyText,
                    {
                      color: colors.textSecondary,
                    },
                  ]}
                >
                  No existen inspecciones pending, error o syncing que deban
                  procesarse.
                </Text>
              </AppCard>
            ) : (
              <View style={styles.list}>
                {queue.map((inspection) => (
                  <AppCard key={inspection.id}>
                    <Text
                      style={[
                        styles.itemTitle,
                        {
                          color: colors.text,
                        },
                      ]}
                    >
                      {inspection.id}
                    </Text>

                    <Text
                      style={[
                        styles.itemMeta,
                        {
                          color: colors.textSecondary,
                        },
                      ]}
                    >
                      Formulario: {inspection.formId}
                    </Text>

                    <Text
                      style={[
                        styles.itemMeta,
                        {
                          color: colors.textSecondary,
                        },
                      ]}
                    >
                      Estado: {inspection.status}
                    </Text>

                    <Text
                      style={[
                        styles.itemStatus,
                        {
                          color: getSyncColor(
                            inspection.integration?.syncStatus ?? "local",

                            colors,
                          ),
                        },
                      ]}
                    >
                      ● {inspection.integration?.syncStatus ?? "local"}
                    </Text>
                  </AppCard>
                ))}
              </View>
            )}
          </View>

          {/* ============================================================ */}
          {/* ACCIONES                                                      */}
          {/* ============================================================ */}

          <View style={styles.action}>
            {/*
             * BOTÓN DE DESARROLLO
             *
             * Convierte una inspección synced
             * en pending para probar la cola.
             */}
            <AppButton variant="secondary" onPress={handleCreatePendingTest}>
              {isPreparing ? "Preparando..." : "Preparar inspección pending"}
            </AppButton>

            {/*
             * PROCESAR COLA
             */}
            <AppButton onPress={handleProcessQueue}>
              {isProcessing ? "Procesando..." : "Procesar cola"}
            </AppButton>
          </View>

          {/* ============================================================ */}
          {/* RESULTADO                                                     */}
          {/* ============================================================ */}

          {result && (
            <View style={styles.section}>
              <Text
                style={[
                  styles.sectionTitle,
                  {
                    color: colors.text,
                  },
                ]}
              >
                Último resultado
              </Text>

              <AppCard>
                <ResultRow label="Candidatos" value={result.totalCandidates} />

                <ResultRow label="Procesadas" value={result.processed} />

                <ResultRow label="Sincronizadas" value={result.synced} />

                <ResultRow label="Errores" value={result.failed} />

                <ResultRow label="Omitidas" value={result.skipped} />
              </AppCard>
            </View>
          )}

          {/* ============================================================ */}
          {/* ERROR                                                         */}
          {/* ============================================================ */}

          {error && (
            <View style={styles.section}>
              <AppCard>
                <Text
                  style={[
                    styles.errorTitle,
                    {
                      color: colors.error,
                    },
                  ]}
                >
                  Error
                </Text>

                <Text
                  style={[
                    styles.errorText,
                    {
                      color: colors.textSecondary,
                    },
                  ]}
                >
                  {error}
                </Text>
              </AppCard>
            </View>
          )}

          {/* ============================================================ */}
          {/* AVISO                                                         */}
          {/* ============================================================ */}

          <Text
            style={[
              styles.notice,
              {
                color: colors.textMuted,
              },
            ]}
          >
            Pantalla temporal de desarrollo. Más adelante la sincronización se
            ejecutará desde el flujo normal de UNIESAP.
          </Text>
        </ResponsiveContainer>
      </ScrollView>
    </Screen>
  );
}

/* -------------------------------------------------------------------------- */
/*                              RESULT ROW                                    */
/* -------------------------------------------------------------------------- */

function ResultRow({ label, value }: { label: string; value: number }) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.resultRow}>
      <Text
        style={[
          styles.resultLabel,
          {
            color: colors.textSecondary,
          },
        ]}
      >
        {label}
      </Text>

      <Text
        style={[
          styles.resultValue,
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
/*                         COLOR DE SINCRONIZACIÓN                            */
/* -------------------------------------------------------------------------- */

function getSyncColor(
  status: InspectionSyncStatus,
  colors: {
    primary: string;
    warning: string;
    success: string;
    error: string;
    textMuted: string;
  },
) {
  switch (status) {
    case "pending":
      return colors.warning;

    case "syncing":
      return colors.primary;

    case "synced":
      return colors.success;

    case "error":
      return colors.error;

    case "local":
    default:
      return colors.textMuted;
  }
}

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: Spacing.xxxl,
  },

  back: {
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

  /* MÉTRICA */

  metricLabel: {
    fontSize: FontSize.small,

    marginBottom: Spacing.sm,
  },

  metricValue: {
    fontSize: 36,

    fontWeight: "700",
  },

  /* SECCIONES */

  section: {
    marginTop: Spacing.xl,
  },

  sectionTitle: {
    fontSize: FontSize.cardTitle,

    fontWeight: "700",

    marginBottom: Spacing.md,
  },

  /* LISTA */

  list: {
    gap: Spacing.md,
  },

  itemTitle: {
    fontSize: FontSize.small,

    fontWeight: "700",

    marginBottom: Spacing.sm,
  },

  itemMeta: {
    fontSize: FontSize.caption,

    marginBottom: Spacing.xs,
  },

  itemStatus: {
    fontSize: FontSize.caption,

    fontWeight: "700",

    marginTop: Spacing.sm,
  },

  /* VACÍO */

  emptyTitle: {
    fontSize: FontSize.body,

    fontWeight: "700",

    marginBottom: Spacing.sm,
  },

  emptyText: {
    fontSize: FontSize.small,

    lineHeight: 20,
  },

  /* ACCIONES */

  action: {
    marginTop: Spacing.xl,

    gap: Spacing.sm,
  },

  /* RESULTADOS */

  resultRow: {
    flexDirection: "row",

    justifyContent: "space-between",

    alignItems: "center",

    paddingVertical: Spacing.sm,
  },

  resultLabel: {
    fontSize: FontSize.small,
  },

  resultValue: {
    fontSize: FontSize.body,

    fontWeight: "700",
  },

  /* ERROR */

  errorTitle: {
    fontSize: FontSize.body,

    fontWeight: "700",

    marginBottom: Spacing.sm,
  },

  errorText: {
    fontSize: FontSize.small,

    lineHeight: 20,
  },

  /* AVISO */

  notice: {
    fontSize: FontSize.caption,

    lineHeight: 18,

    textAlign: "center",

    marginTop: Spacing.xl,
  },
});
