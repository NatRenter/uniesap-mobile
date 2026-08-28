import { useState } from "react";

import { ScrollView, StyleSheet, Text, View } from "react-native";

import { router } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { ResponsiveContainer } from "@/components/ui/ResponsiveContainer";
import { Screen } from "@/components/ui/Screen";

import { getFormById } from "@/repositories/formRepository";

import { getEvidencesByInspectionId } from "@/repositories/evidenceRepository";

import {
  getInspections,
  updateInspection,
} from "@/repositories/inspectionRepository";

import {
  getInspectionSyncQueue,
  processInspectionSyncQueue,
  type InspectionSyncQueueResult,
} from "@/services/inspectionSyncQueueService";

import {
  armInspectionSyncFailureAfterAttachmentAccepted,
  armInspectionSyncFailureAfterAttachments,
  armInspectionSyncFailureAfterSubmission,
  isInspectionSyncFailureAfterAttachmentAcceptedArmed,
  isInspectionSyncFailureAfterAttachmentsArmed,
  isInspectionSyncFailureAfterSubmissionArmed,
} from "@/services/inspectionSyncService";

import { FontSize, Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

import type { Evidence, EvidenceStatus } from "@/types/evidence";
import type { Inspection, InspectionSyncStatus } from "@/types/inspection";

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

  const [failureSimulationArmed, setFailureSimulationArmed] = useState(
    isInspectionSyncFailureAfterSubmissionArmed(),
  );

  const [
    attachmentFailureSimulationArmed,
    setAttachmentFailureSimulationArmed,
  ] = useState(isInspectionSyncFailureAfterAttachmentsArmed());

  const [
    attachmentAcceptanceFailureArmed,
    setAttachmentAcceptanceFailureArmed,
  ] = useState(isInspectionSyncFailureAfterAttachmentAcceptedArmed());

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

  /*
   * El diagnóstico utiliza TODAS las inspecciones,
   * no solamente las que continúan en cola.
   *
   * De esta forma también podemos revisar una inspección
   * después de que haya pasado correctamente a "synced".
   */
  const allInspections = getInspections();

  const totalEvidenceCount = allInspections.reduce(
    (total, inspection) =>
      total + getEvidencesByInspectionId(inspection.id).length,
    0,
  );

  const pendingEvidenceCount = allInspections.reduce(
    (total, inspection) =>
      total +
      getEvidencesByInspectionId(inspection.id).filter(
        (evidence) => evidence.status === "pending",
      ).length,
    0,
  );

  const syncedEvidenceCount = allInspections.reduce(
    (total, inspection) =>
      total +
      getEvidencesByInspectionId(inspection.id).filter(
        (evidence) => evidence.status === "synced",
      ).length,
    0,
  );

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

  /* ------------------------------------------------------------------------ */
  /*                 SIMULACIÓN DE FALLO IDEMPOTENTE                          */
  /* ------------------------------------------------------------------------ */

  const handleProcessQueueWithFailureSimulation = async () => {
    if (isProcessing || isPreparing) {
      return;
    }

    /*
     * Si todavía no está armada, la armamos automáticamente.
     *
     * Así este botón sirve como prueba de un solo paso:
     *
     * pending
     *   ↓
     * Kobo acepta submission
     *   ↓
     * fallo local simulado
     *   ↓
     * error
     */
    if (!isInspectionSyncFailureAfterSubmissionArmed()) {
      armInspectionSyncFailureAfterSubmission();

      setFailureSimulationArmed(true);
    }

    setIsProcessing(true);

    setError(null);

    setResult(null);

    try {
      const syncResult = await processInspectionSyncQueue();

      setResult(syncResult);

      setQueueVersion((value) => value + 1);
    } catch (processingError) {
      const message =
        processingError instanceof Error
          ? processingError.message
          : "Error desconocido procesando la prueba idempotente.";

      console.error(
        "Error procesando prueba de fallo idempotente:",
        processingError,
      );

      setError(message);
    } finally {
      setFailureSimulationArmed(isInspectionSyncFailureAfterSubmissionArmed());

      setIsProcessing(false);
    }
  };

  /*
   * --------------------------------------------------------------------------
   * FALLO DESPUÉS DE QUE KOBO ACEPTA 1 EVIDENCIA
   * --------------------------------------------------------------------------
   *
   * Esta prueba reproduce:
   *
   * Kobo acepta foto 1
   *      ↓
   * UNIESAP falla antes de guardar Evidence = synced
   *      ↓
   * reintento
   *      ↓
   * attachment idempotency hit
   */
  const handleProcessQueueWithAttachmentAcceptanceFailure = async () => {
    if (isProcessing || isPreparing) {
      return;
    }

    if (!isInspectionSyncFailureAfterAttachmentAcceptedArmed()) {
      armInspectionSyncFailureAfterAttachmentAccepted();

      setAttachmentAcceptanceFailureArmed(true);
    }

    setIsProcessing(true);

    setError(null);

    setResult(null);

    try {
      const syncResult = await processInspectionSyncQueue();

      setResult(syncResult);

      setQueueVersion((value) => value + 1);
    } catch (processingError) {
      const message =
        processingError instanceof Error
          ? processingError.message
          : "Error desconocido procesando la prueba de aceptación de evidencia.";

      console.error(
        "Error procesando fallo después de aceptación de evidencia:",
        processingError,
      );

      setError(message);
    } finally {
      setAttachmentAcceptanceFailureArmed(
        isInspectionSyncFailureAfterAttachmentAcceptedArmed(),
      );

      setIsProcessing(false);
    }
  };

  /*
   * --------------------------------------------------------------------------
   * FALLO DESPUÉS DE 2 EVIDENCIAS
   * --------------------------------------------------------------------------
   *
   * Esta prueba necesita una inspección NUEVA con al menos 3 fotografías.
   *
   * La intención es dejar:
   *
   * foto 1 → synced
   * foto 2 → synced
   * foto 3 → pending
   *
   * para comprobar el reintento después de reiniciar la app.
   */
  const handleProcessQueueWithAttachmentFailureSimulation = async () => {
    if (isProcessing || isPreparing) {
      return;
    }

    if (!isInspectionSyncFailureAfterAttachmentsArmed()) {
      armInspectionSyncFailureAfterAttachments(2);

      setAttachmentFailureSimulationArmed(true);
    }

    setIsProcessing(true);

    setError(null);

    setResult(null);

    try {
      const syncResult = await processInspectionSyncQueue();

      setResult(syncResult);

      setQueueVersion((value) => value + 1);
    } catch (processingError) {
      const message =
        processingError instanceof Error
          ? processingError.message
          : "Error desconocido procesando la prueba de attachments.";

      console.error(
        "Error procesando prueba de fallo entre evidencias:",
        processingError,
      );

      setError(message);
    } finally {
      setAttachmentFailureSimulationArmed(
        isInspectionSyncFailureAfterAttachmentsArmed(),
      );

      setIsProcessing(false);
    }
  };

  const handleRetryFailedSync = async () => {
    if (isProcessing || isPreparing) {
      return;
    }

    /*
     * El fallo es one-shot.
     *
     * Antes del reintento nos aseguramos de que NO esté armado.
     */
    setFailureSimulationArmed(isInspectionSyncFailureAfterSubmissionArmed());

    setIsProcessing(true);

    setError(null);

    setResult(null);

    try {
      const syncResult = await processInspectionSyncQueue({
        includeErrors: true,

        includeInterrupted: true,
      });

      setResult(syncResult);

      setQueueVersion((value) => value + 1);
    } catch (processingError) {
      const message =
        processingError instanceof Error
          ? processingError.message
          : "Error desconocido reintentando la sincronización.";

      console.error(
        "Error reintentando sincronización idempotente:",
        processingError,
      );

      setError(message);
    } finally {
      setFailureSimulationArmed(isInspectionSyncFailureAfterSubmissionArmed());

      setAttachmentFailureSimulationArmed(
        isInspectionSyncFailureAfterAttachmentsArmed(),
      );

      setAttachmentAcceptanceFailureArmed(
        isInspectionSyncFailureAfterAttachmentAcceptedArmed(),
      );

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

          <View style={styles.metricGrid}>
            <View style={styles.metricCard}>
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
            </View>

            <View style={styles.metricCard}>
              <AppCard>
                <Text
                  style={[
                    styles.metricLabel,
                    {
                      color: colors.textSecondary,
                    },
                  ]}
                >
                  Inspecciones locales
                </Text>

                <Text
                  style={[
                    styles.metricValue,
                    {
                      color: colors.text,
                    },
                  ]}
                >
                  {allInspections.length}
                </Text>
              </AppCard>
            </View>

            <View style={styles.metricCard}>
              <AppCard>
                <Text
                  style={[
                    styles.metricLabel,
                    {
                      color: colors.textSecondary,
                    },
                  ]}
                >
                  Evidencias
                </Text>

                <Text
                  style={[
                    styles.metricValue,
                    {
                      color: colors.text,
                    },
                  ]}
                >
                  {totalEvidenceCount}
                </Text>

                <Text
                  style={[
                    styles.metricHelper,
                    {
                      color: colors.textMuted,
                    },
                  ]}
                >
                  {pendingEvidenceCount} pending · {syncedEvidenceCount} synced
                </Text>
              </AppCard>
            </View>
          </View>

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
                  <QueueInspectionCard
                    key={inspection.id}
                    inspection={inspection}
                  />
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
             * Convierte una inspección terminada en pending
             * para poder repetir pruebas de cola.
             */}
            <AppButton variant="secondary" onPress={handleCreatePendingTest}>
              {isPreparing ? "Preparando..." : "Preparar inspección pending"}
            </AppButton>

            {/*
             * PROCESAR COLA NORMALMENTE
             */}
            <AppButton onPress={handleProcessQueue}>
              {isProcessing ? "Procesando..." : "Procesar cola"}
            </AppButton>

            {/*
             * PRUEBA IDEMPOTENTE
             *
             * La próxima sincronización:
             *
             * 1. crea/recupera la submission Kobo;
             * 2. simula un fallo local inmediatamente después;
             * 3. deja la inspección en error conservando operationId.
             */}
            <AppButton
              variant="secondary"
              onPress={handleProcessQueueWithFailureSimulation}
            >
              {isProcessing
                ? "Procesando prueba..."
                : "Simular fallo después de submission"}
            </AppButton>

            {/*
             * PRUEBA DE VENTANA CRÍTICA DE UNA EVIDENCIA
             *
             * Kobo acepta la primera foto, pero UNIESAP falla
             * antes de guardar Evidence como synced.
             *
             * Al reintentar esperamos:
             *
             * Mock Kobo attachment idempotency hit
             */}
            <AppButton
              variant="secondary"
              onPress={handleProcessQueueWithAttachmentAcceptanceFailure}
            >
              {isProcessing
                ? "Procesando evidencia..."
                : "Simular fallo después de aceptar 1 evidencia"}
            </AppButton>

            {/*
             * PRUEBA DE ATTACHMENTS
             *
             * Usar con una inspección NUEVA
             * que tenga al menos 3 fotografías.
             *
             * Después de 2 subidas correctas
             * se provoca un fallo intencional.
             */}
            <AppButton
              variant="secondary"
              onPress={handleProcessQueueWithAttachmentFailureSimulation}
            >
              {isProcessing
                ? "Procesando evidencias..."
                : "Simular fallo después de 2 evidencias"}
            </AppButton>

            {/*
             * REINTENTO
             *
             * Reprocesa inspecciones en error.
             *
             * Las evidencias que ya tengan attachmentId
             * deben omitirse automáticamente.
             */}
            <AppButton variant="secondary" onPress={handleRetryFailedSync}>
              Reintentar sincronización con error
            </AppButton>

            {/*
             * ACCESO A PRUEBAS KOBO
             */}
            <AppButton
              variant="secondary"
              onPress={() => {
                router.push("/kobo-test");
              }}
            >
              Abrir prueba Kobo
            </AppButton>

            <Text
              style={[
                styles.failureSimulationState,
                {
                  color: failureSimulationArmed
                    ? colors.warning
                    : colors.textMuted,
                },
              ]}
            >
              Fallo después de submission:{" "}
              {failureSimulationArmed ? "ARMADO" : "desarmado"}
            </Text>

            <Text
              style={[
                styles.failureSimulationState,
                {
                  color: attachmentFailureSimulationArmed
                    ? colors.warning
                    : colors.textMuted,
                },
              ]}
            >
              Fallo después de 2 evidencias:{" "}
              {attachmentFailureSimulationArmed ? "ARMADO" : "desarmado"}
            </Text>

            <Text
              style={[
                styles.failureSimulationState,
                {
                  color: attachmentAcceptanceFailureArmed
                    ? colors.warning
                    : colors.textMuted,
                },
              ]}
            >
              Fallo después de aceptar 1 evidencia:{" "}
              {attachmentAcceptanceFailureArmed ? "ARMADO" : "desarmado"}
            </Text>

            <Text
              style={[
                styles.attachmentTestNotice,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              Para esta prueba usa una inspección nueva con al menos 3
              fotografías. No reutilices una inspección cuyos attachments ya
              estén sincronizados.
            </Text>
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
          {/* DIAGNÓSTICO COMPLETO                                           */}
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
              Diagnóstico de inspecciones
            </Text>

            <Text
              style={[
                styles.sectionDescription,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              Muestra todas las inspecciones locales, incluso las que ya fueron
              sincronizadas y desaparecieron de la cola.
            </Text>

            {allInspections.length === 0 ? (
              <AppCard>
                <Text
                  style={[
                    styles.emptyText,
                    {
                      color: colors.textSecondary,
                    },
                  ]}
                >
                  No existen inspecciones disponibles para diagnóstico.
                </Text>
              </AppCard>
            ) : (
              <View style={styles.list}>
                {allInspections.map((inspection) => (
                  <InspectionDiagnosticCard
                    key={inspection.id}
                    inspection={inspection}
                  />
                ))}
              </View>
            )}
          </View>

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
/*                         QUEUE INSPECTION CARD                              */
/* -------------------------------------------------------------------------- */

function QueueInspectionCard({ inspection }: { inspection: Inspection }) {
  const { colors } = useAppTheme();

  const form = getFormById(inspection.formId);

  const inspectionEvidences = getEvidencesByInspectionId(inspection.id);

  const pendingCount = inspectionEvidences.filter(
    (evidence) => evidence.status === "pending",
  ).length;

  const syncedCount = inspectionEvidences.filter(
    (evidence) => evidence.status === "synced",
  ).length;

  return (
    <AppCard>
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
        Formulario: {form?.title ?? inspection.formId}
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
          styles.itemMeta,
          {
            color: colors.textSecondary,
          },
        ]}
      >
        Respuestas: {inspection.responses.length}
      </Text>

      <Text
        style={[
          styles.itemMeta,
          {
            color: colors.textSecondary,
          },
        ]}
      >
        Evidencias: {inspectionEvidences.length} · {pendingCount} pending ·{" "}
        {syncedCount} synced
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

      {inspection.integration?.lastSyncError && (
        <Text
          style={[
            styles.inlineError,
            {
              color: colors.error,
            },
          ]}
        >
          {inspection.integration.lastSyncError}
        </Text>
      )}
    </AppCard>
  );
}

/* -------------------------------------------------------------------------- */
/*                       INSPECTION DIAGNOSTIC CARD                           */
/* -------------------------------------------------------------------------- */

function InspectionDiagnosticCard({ inspection }: { inspection: Inspection }) {
  const { colors } = useAppTheme();

  const form = getFormById(inspection.formId);

  const inspectionEvidences = getEvidencesByInspectionId(inspection.id);

  const pendingCount = inspectionEvidences.filter(
    (evidence) => evidence.status === "pending",
  ).length;

  const syncedCount = inspectionEvidences.filter(
    (evidence) => evidence.status === "synced",
  ).length;

  /*
   * Comprobamos las dos direcciones de la relación:
   *
   * Inspection.evidenceIds
   *          ↔
   * Evidence.inspectionId
   *
   * Esto nos ayuda a detectar registros huérfanos o IDs faltantes.
   */
  const repositoryEvidenceIds = new Set(
    inspectionEvidences.map((evidence) => evidence.id),
  );

  const inspectionEvidenceIds = new Set(inspection.evidenceIds);

  const missingFromRepository = inspection.evidenceIds.filter(
    (evidenceId) => !repositoryEvidenceIds.has(evidenceId),
  );

  const missingFromInspection = inspectionEvidences.filter(
    (evidence) => !inspectionEvidenceIds.has(evidence.id),
  );

  const relationIsConsistent =
    missingFromRepository.length === 0 && missingFromInspection.length === 0;

  return (
    <AppCard>
      <View style={styles.diagnosticHeader}>
        <View style={styles.diagnosticHeaderContent}>
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
            {form?.title ?? inspection.formId}
          </Text>
        </View>

        <Text
          style={[
            styles.diagnosticStatus,
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
      </View>

      <View style={styles.diagnosticRows}>
        <DiagnosticRow label="Estado" value={inspection.status} />

        <DiagnosticRow label="Inspector" value={inspection.inspector} />

        <DiagnosticRow
          label="Respuestas"
          value={String(inspection.responses.length)}
        />

        <DiagnosticRow
          label="Evidence IDs"
          value={String(inspection.evidenceIds.length)}
        />

        <DiagnosticRow
          label="Evidencias encontradas"
          value={String(inspectionEvidences.length)}
        />

        <DiagnosticRow
          label="Sync operation"
          value={inspection.integration?.syncOperationId ?? "Sin operación"}
        />

        <DiagnosticRow
          label="Sync attempt"
          value={String(inspection.integration?.syncAttempt ?? 0)}
        />

        <DiagnosticRow label="Pending" value={String(pendingCount)} />

        <DiagnosticRow label="Synced" value={String(syncedCount)} />
      </View>

      <View
        style={[
          styles.consistencyBox,
          {
            backgroundColor: relationIsConsistent
              ? colors.surfaceSecondary
              : colors.primarySoft,

            borderColor: relationIsConsistent ? colors.border : colors.warning,
          },
        ]}
      >
        <Text
          style={[
            styles.consistencyTitle,
            {
              color: relationIsConsistent ? colors.success : colors.warning,
            },
          ]}
        >
          {relationIsConsistent
            ? "✓ Relación Inspection ↔ Evidence consistente"
            : "⚠ Se detectaron diferencias en evidenceIds"}
        </Text>

        {missingFromRepository.length > 0 && (
          <Text
            style={[
              styles.consistencyText,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            IDs registrados en la inspección pero no encontrados:{" "}
            {missingFromRepository.join(", ")}
          </Text>
        )}

        {missingFromInspection.length > 0 && (
          <Text
            style={[
              styles.consistencyText,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            Evidencias del repositorio no registradas en evidenceIds:{" "}
            {missingFromInspection.map((evidence) => evidence.id).join(", ")}
          </Text>
        )}
      </View>

      {inspection.integration?.kobo && (
        <View style={styles.diagnosticSubsection}>
          <Text
            style={[
              styles.diagnosticSubsectionTitle,
              {
                color: colors.text,
              },
            ]}
          >
            Kobo
          </Text>

          <DiagnosticRow
            label="Asset"
            value={inspection.integration.kobo.assetUid}
          />

          <DiagnosticRow
            label="Submission"
            value={String(inspection.integration.kobo.submissionId)}
          />

          {inspection.integration.kobo.uuid && (
            <DiagnosticRow
              label="UUID"
              value={inspection.integration.kobo.uuid}
            />
          )}

          {inspection.integration.kobo.syncedAt && (
            <DiagnosticRow
              label="Sincronizado"
              value={inspection.integration.kobo.syncedAt}
            />
          )}
        </View>
      )}

      {inspection.integration?.lastSyncError && (
        <View style={styles.diagnosticSubsection}>
          <Text
            style={[
              styles.diagnosticSubsectionTitle,
              {
                color: colors.error,
              },
            ]}
          >
            Último error
          </Text>

          <Text
            style={[
              styles.errorText,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            {inspection.integration.lastSyncError}
          </Text>
        </View>
      )}

      <View style={styles.diagnosticSubsection}>
        <Text
          style={[
            styles.diagnosticSubsectionTitle,
            {
              color: colors.text,
            },
          ]}
        >
          Evidencias / attachments
        </Text>

        {inspectionEvidences.length === 0 ? (
          <Text
            style={[
              styles.emptyText,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            Esta inspección no tiene evidencias asociadas.
          </Text>
        ) : (
          <View style={styles.attachmentList}>
            {inspectionEvidences.map((evidence, index) => (
              <EvidenceDiagnosticRow
                key={evidence.id}
                evidence={evidence}
                inspection={inspection}
                index={index}
              />
            ))}
          </View>
        )}
      </View>
    </AppCard>
  );
}

/* -------------------------------------------------------------------------- */
/*                       EVIDENCE DIAGNOSTIC ROW                              */
/* -------------------------------------------------------------------------- */

function EvidenceDiagnosticRow({
  evidence,
  inspection,
  index,
}: {
  evidence: Evidence;
  inspection: Inspection;
  index: number;
}) {
  const { colors } = useAppTheme();

  const form = getFormById(inspection.formId);

  const question = evidence.questionId
    ? form?.questions.find((item) => item.id === evidence.questionId)
    : undefined;

  const fieldName = question?.integration?.koboFieldName;

  return (
    <View
      style={[
        styles.attachmentCard,
        {
          backgroundColor: colors.surfaceSecondary,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.attachmentHeader}>
        <Text
          style={[
            styles.attachmentTitle,
            {
              color: colors.text,
            },
          ]}
        >
          {index + 1}. {evidence.fileName ?? evidence.title}
        </Text>

        <Text
          style={[
            styles.attachmentStatus,
            {
              color: getEvidenceStatusColor(evidence.status, colors),
            },
          ]}
        >
          ● {evidence.status}
        </Text>
      </View>

      <Text
        style={[
          styles.attachmentMeta,
          {
            color: colors.textSecondary,
          },
        ]}
      >
        Evidence: {evidence.id}
      </Text>

      <Text
        style={[
          styles.attachmentMeta,
          {
            color: colors.textSecondary,
          },
        ]}
      >
        Pregunta: {evidence.questionId ?? "Sin questionId"}
      </Text>

      <Text
        style={[
          styles.attachmentMeta,
          {
            color: fieldName ? colors.textSecondary : colors.warning,
          },
        ]}
      >
        Kobo field: {fieldName ?? "Sin campo Kobo"}
      </Text>

      {evidence.mimeType && (
        <Text
          style={[
            styles.attachmentMeta,
            {
              color: colors.textSecondary,
            },
          ]}
        >
          MIME: {evidence.mimeType}
        </Text>
      )}

      {evidence.fileSize !== undefined && (
        <Text
          style={[
            styles.attachmentMeta,
            {
              color: colors.textSecondary,
            },
          ]}
        >
          Tamaño: {formatFileSize(evidence.fileSize)}
        </Text>
      )}

      <Text
        style={[
          styles.attachmentMeta,
          {
            color:
              evidence.localUri || evidence.remoteUri
                ? colors.textMuted
                : colors.warning,
          },
        ]}
        numberOfLines={2}
      >
        Archivo:{" "}
        {evidence.localUri
          ? "local"
          : evidence.remoteUri
            ? "remoto"
            : "sin URI"}
      </Text>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                            DIAGNOSTIC ROW                                  */
/* -------------------------------------------------------------------------- */

function DiagnosticRow({ label, value }: { label: string; value: string }) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.diagnosticRow}>
      <Text
        style={[
          styles.diagnosticLabel,
          {
            color: colors.textMuted,
          },
        ]}
      >
        {label}
      </Text>

      <Text
        style={[
          styles.diagnosticValue,
          {
            color: colors.text,
          },
        ]}
        selectable
      >
        {value}
      </Text>
    </View>
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

function getEvidenceStatusColor(
  status: EvidenceStatus,
  colors: {
    warning: string;
    success: string;
  },
) {
  switch (status) {
    case "synced":
      return colors.success;

    case "pending":
    default:
      return colors.warning;
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kilobytes = bytes / 1024;

  if (kilobytes < 1024) {
    return `${kilobytes.toFixed(1)} KB`;
  }

  return `${(kilobytes / 1024).toFixed(2)} MB`;
}

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

  metricGrid: {
    flexDirection: "row",

    flexWrap: "wrap",

    gap: Spacing.md,
  },

  metricCard: {
    flexGrow: 1,

    minWidth: 210,
  },

  metricLabel: {
    fontSize: FontSize.small,

    marginBottom: Spacing.sm,
  },

  metricValue: {
    fontSize: 36,

    fontWeight: "700",
  },

  metricHelper: {
    fontSize: FontSize.caption,

    marginTop: Spacing.xs,
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

  sectionDescription: {
    fontSize: FontSize.small,

    lineHeight: 20,

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

  inlineError: {
    fontSize: FontSize.caption,

    lineHeight: 18,

    marginTop: Spacing.sm,
  },

  diagnosticHeader: {
    flexDirection: "row",

    alignItems: "flex-start",

    justifyContent: "space-between",

    gap: Spacing.md,

    marginBottom: Spacing.md,
  },

  diagnosticHeaderContent: {
    flex: 1,

    minWidth: 0,
  },

  diagnosticStatus: {
    flexShrink: 0,

    fontSize: FontSize.caption,

    fontWeight: "700",
  },

  diagnosticRows: {
    gap: Spacing.xs,
  },

  diagnosticRow: {
    flexDirection: "row",

    alignItems: "flex-start",

    justifyContent: "space-between",

    gap: Spacing.md,

    paddingVertical: Spacing.xs,
  },

  diagnosticLabel: {
    flexShrink: 0,

    fontSize: FontSize.caption,
  },

  diagnosticValue: {
    flex: 1,

    fontSize: FontSize.caption,

    fontWeight: "600",

    textAlign: "right",
  },

  consistencyBox: {
    padding: Spacing.md,

    borderWidth: 1,

    borderRadius: 10,

    marginTop: Spacing.md,
  },

  consistencyTitle: {
    fontSize: FontSize.caption,

    fontWeight: "700",
  },

  consistencyText: {
    fontSize: FontSize.caption,

    lineHeight: 18,

    marginTop: Spacing.xs,
  },

  diagnosticSubsection: {
    marginTop: Spacing.lg,
  },

  diagnosticSubsectionTitle: {
    fontSize: FontSize.small,

    fontWeight: "700",

    marginBottom: Spacing.sm,
  },

  attachmentList: {
    gap: Spacing.sm,
  },

  attachmentCard: {
    padding: Spacing.md,

    borderWidth: 1,

    borderRadius: 10,
  },

  attachmentHeader: {
    flexDirection: "row",

    alignItems: "flex-start",

    justifyContent: "space-between",

    gap: Spacing.md,

    marginBottom: Spacing.sm,
  },

  attachmentTitle: {
    flex: 1,

    minWidth: 0,

    fontSize: FontSize.caption,

    fontWeight: "700",
  },

  attachmentStatus: {
    flexShrink: 0,

    fontSize: FontSize.caption,

    fontWeight: "700",
  },

  attachmentMeta: {
    fontSize: FontSize.caption,

    lineHeight: 18,

    marginBottom: Spacing.xs,
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

  failureSimulationState: {
    fontSize: FontSize.caption,

    lineHeight: 18,

    textAlign: "center",

    marginTop: Spacing.xs,
  },

  attachmentTestNotice: {
    fontSize: FontSize.caption,

    lineHeight: 18,

    textAlign: "center",

    marginTop: Spacing.sm,
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
