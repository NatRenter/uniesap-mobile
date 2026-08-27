import { useState } from "react";

import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Image } from "expo-image";

import { router, useLocalSearchParams } from "expo-router";

import { ContextHeader } from "@/components/navigation/ContextHeader";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { AppTextInput } from "@/components/ui/AppTextInput";
import { ResponsiveContainer } from "@/components/ui/ResponsiveContainer";
import { Screen } from "@/components/ui/Screen";

import { getCompanyById } from "@/data/companies";
import { getFormById } from "@/data/forms";
import { getInspectionById } from "@/data/inspections";
import { getPropertyById } from "@/data/properties";

import {
  createEvidence,
  deleteEvidence,
  getEvidencesByQuestionId,
} from "@/repositories/evidenceRepository";

import {
  createInspection,
  updateInspection,
} from "@/repositories/inspectionRepository";

import {
  captureEvidencePhoto,
  deleteEvidenceMedia,
  pickEvidencePhoto,
} from "@/services/evidenceMediaService";

import { FontSize, Radius, Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";
import { useResponsive } from "@/hooks/useResponsive";

import type { Evidence } from "@/types/evidence";
import type { FormQuestion, FormQuestionOption } from "@/types/form";

import type {
  InspectionResponse,
  InspectionResponseValue,
} from "@/types/inspection";

/*
 * ============================================================================
 * RESPUESTAS DE CAPTURA
 * ============================================================================
 *
 * Mientras el usuario llena el formulario almacenamos las respuestas
 * utilizando el ID interno de cada pregunta.
 *
 * Ejemplo:
 *
 * {
 *   "question-001": "Alexis",
 *   "question-002": true,
 *   "question-003": "Observaciones..."
 * }
 */
type CaptureAnswers = Record<string, InspectionResponseValue>;

type ProcessingAction = "draft" | "finish" | null;

type PhotoProcessingAction = "camera" | "gallery" | "delete" | null;

export default function CaptureScreen() {
  const { colors } = useAppTheme();

  /*
   * Móvil:
   * una sola columna.
   *
   * Tablet / escritorio:
   * formulario + panel lateral.
   */
  const { isPhone } = useResponsive();

  /*
   * Parámetros necesarios para identificar
   * completamente la inspección.
   *
   * Empresa
   *    ↓
   * Inmueble
   *    ↓
   * Formulario
   */
  const { id, propertyId, formId, inspectionId } = useLocalSearchParams<{
    id: string;
    propertyId: string;
    formId?: string;
    inspectionId?: string;
  }>();

  /*
   * Si recibimos inspectionId significa que estamos continuando
   * una captura previamente guardada como borrador o en proceso.
   */
  const existingInspection = inspectionId
    ? getInspectionById(inspectionId)
    : undefined;

  /*
   * Resolvemos los modelos asociados a la ruta.
   */
  const company = getCompanyById(id);

  const property = getPropertyById(propertyId);

  /*
   * Cuando continuamos un borrador podemos recuperar el formulario
   * directamente desde la inspección guardada.
   */
  const resolvedFormId = formId ?? existingInspection?.formId;

  const form = resolvedFormId ? getFormById(resolvedFormId) : undefined;

  /*
   * Respuestas actuales del formulario.
   *
   * Si estamos continuando una inspección, reconstruimos CaptureAnswers
   * desde InspectionResponse[] para mostrar inmediatamente los valores
   * que el usuario había guardado.
   */
  const [answers, setAnswers] = useState<CaptureAnswers>(() => {
    if (!existingInspection) {
      return {};
    }

    return existingInspection.responses.reduce<CaptureAnswers>(
      (result, response) => {
        result[response.questionId] = response.value;

        return result;
      },
      {},
    );
  });

  /*
   * Acción que se encuentra actualmente
   * en proceso.
   *
   * null     → sin procesamiento
   * draft    → guardando borrador
   * finish   → guardando/sincronizando
   */
  const [processingAction, setProcessingAction] =
    useState<ProcessingAction>(null);

  /*
   * Estado independiente para operaciones de evidencia.
   *
   * Mantenerlo separado evita mezclar:
   *
   * - guardado/finalización de inspecciones;
   * - cámara/galería/eliminación de fotografías.
   */
  const [photoProcessingAction, setPhotoProcessingAction] =
    useState<PhotoProcessingAction>(null);

  const [photoProcessingQuestionId, setPhotoProcessingQuestionId] = useState<
    string | null
  >(null);

  /*
   * EvidenceRepository no es reactivo todavía.
   *
   * Este contador fuerza una nueva lectura visual después de
   * crear o eliminar una evidencia.
   */
  const [evidenceVersion, setEvidenceVersion] = useState(0);

  void evidenceVersion;

  /*
   * Si una sincronización falla mantenemos
   * la inspección creada y guardamos su ID.
   *
   * De esta manera un reintento NO crea
   * una segunda inspección local.
   */
  const [createdInspectionId, setCreatedInspectionId] = useState<string | null>(
    existingInspection?.id ?? null,
  );

  /*
   * Error visible para el usuario.
   */
  const [actionError, setActionError] = useState<string | null>(null);

  /*
   * IMPORTANTE:
   *
   * Todos los Hooks ya fueron ejecutados antes
   * de este return condicional.
   *
   * Esto evita nuevamente errores de:
   *
   * React Hooks must be called in the exact
   * same order in every component render.
   */
  if (
    !company ||
    !property ||
    !form ||
    (inspectionId !== undefined && !existingInspection)
  ) {
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
            No fue posible iniciar la captura
          </Text>

          <Text
            style={[
              styles.notFoundDescription,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            Verifica que la empresa, el inmueble y el formulario existan.
          </Text>
        </View>
      </Screen>
    );
  }

  const isProcessing =
    processingAction !== null || photoProcessingAction !== null;

  /* ---------------------------------------------------------------------- */
  /*                     ACTUALIZACIÓN DE RESPUESTAS                        */
  /* ---------------------------------------------------------------------- */

  /*
   * Todas las preguntas dinámicas utilizan
   * esta misma función.
   */
  const updateAnswer = (questionId: string, value: InspectionResponseValue) => {
    setAnswers((currentAnswers) => ({
      ...currentAnswers,

      [questionId]: value,
    }));

    /*
     * Si el usuario corrige una respuesta,
     * ocultamos cualquier mensaje anterior
     * relacionado con validación.
     */
    if (actionError) {
      setActionError(null);
    }
  };

  /* ---------------------------------------------------------------------- */
  /*                              PROGRESO                                  */
  /* ---------------------------------------------------------------------- */

  const getQuestionEvidenceCount = (questionId: string) => {
    if (!createdInspectionId) {
      return 0;
    }

    return getEvidencesByQuestionId(createdInspectionId, questionId).length;
  };

  const isQuestionAnswered = (question: FormQuestion) => {
    if (question.type === "photo") {
      return getQuestionEvidenceCount(question.id) > 0;
    }

    return isAnswered(answers[question.id]);
  };

  const answeredQuestions = form.questions.filter(isQuestionAnswered).length;

  const totalQuestions = form.questions.length;

  const progress = totalQuestions > 0 ? answeredQuestions / totalQuestions : 0;

  /* ---------------------------------------------------------------------- */
  /*                      PREGUNTAS OBLIGATORIAS                            */
  /* ---------------------------------------------------------------------- */

  const requiredQuestions = form.questions.filter(
    (question) => question.required,
  );

  const requiredCompleted = requiredQuestions.every(isQuestionAnswered);

  /* ---------------------------------------------------------------------- */
  /*                     CONSTRUIR InspectionResponse[]                     */
  /* ---------------------------------------------------------------------- */

  /*
   * Transformamos el estado interno:
   *
   * CaptureAnswers
   *
   * en:
   *
   * InspectionResponse[]
   *
   * Este último es el modelo oficial utilizado
   * por UNIESAP y por la integración Kobo.
   */
  const buildResponses = (): InspectionResponse[] => {
    return (
      form.questions
        /*
         * Las fotografías ya no se guardan como valores simulados
         * dentro de InspectionResponse.
         *
         * Cada fotografía vive como Evidence independiente.
         */
        .filter(
          (question) =>
            question.type !== "photo" && isAnswered(answers[question.id]),
        )
        .map((question) => ({
          questionId: question.id,

          value: answers[question.id] ?? null,
        }))
    );
  };

  /* ---------------------------------------------------------------------- */
  /*                     EVIDENCIAS FOTOGRÁFICAS                            */
  /* ---------------------------------------------------------------------- */

  const refreshEvidences = () => {
    setEvidenceVersion((value) => value + 1);
  };

  /*
   * Una Evidence necesita inspectionId desde el momento de su creación.
   *
   * Por eso, si el usuario toma una fotografía antes de guardar manualmente,
   * creamos automáticamente el borrador local de la inspección.
   *
   * Si el borrador ya existe, lo actualizamos con las respuestas actuales.
   */
  const ensureDraftInspection = async (): Promise<string> => {
    const responses = buildResponses();

    const inspector = resolveInspectorName(form.questions, responses);

    if (createdInspectionId) {
      const currentInspection = getInspectionById(createdInspectionId);

      const updatedInspection = await updateInspection(createdInspectionId, {
        inspector,

        responses,

        status:
          currentInspection?.status === "completed" ? "completed" : "draft",

        integration: {
          ...currentInspection?.integration,

          syncStatus:
            currentInspection?.status === "completed"
              ? (currentInspection.integration?.syncStatus ?? "local")
              : "local",

          lastSyncError: undefined,
        },
      });

      if (!updatedInspection) {
        throw new Error(
          "No fue posible preparar la inspección para asociar evidencias.",
        );
      }

      return updatedInspection.id;
    }

    const inspection = await createInspection({
      companyId: id,

      propertyId,

      formId: form.id,

      inspector,

      responses,

      status: "draft",

      syncStatus: "local",
    });

    setCreatedInspectionId(inspection.id);

    return inspection.id;
  };

  const handleCaptureEvidence = async (question: FormQuestion) => {
    if (isProcessing) {
      return;
    }

    setPhotoProcessingQuestionId(question.id);
    setPhotoProcessingAction("camera");
    setActionError(null);

    try {
      const inspectionForEvidenceId = await ensureDraftInspection();

      const media = await captureEvidencePhoto();

      if (!media) {
        return;
      }

      const evidence = await createEvidence({
        companyId: id,

        propertyId,

        inspectionId: inspectionForEvidenceId,

        questionId: question.id,

        title: `${question.label} - fotografía`,

        type: "photo",

        status: "pending",

        description:
          "Evidencia fotográfica capturada durante una inspección UNIESAP.",

        localUri: media.localUri,

        fileName: media.fileName,

        ...(media.mimeType
          ? {
              mimeType: media.mimeType,
            }
          : {}),

        ...(media.fileSize !== undefined
          ? {
              fileSize: media.fileSize,
            }
          : {}),
      });

      const currentInspection = getInspectionById(inspectionForEvidenceId);

      if (!currentInspection) {
        throw new Error(
          "La evidencia fue creada, pero no fue posible recuperar la inspección asociada.",
        );
      }

      const nextEvidenceIds = Array.from(
        new Set([...currentInspection.evidenceIds, evidence.id]),
      );

      const updatedInspection = await updateInspection(
        inspectionForEvidenceId,
        {
          evidenceIds: nextEvidenceIds,
        },
      );

      if (!updatedInspection) {
        throw new Error(
          "La fotografía fue guardada, pero no fue posible asociarla a la inspección.",
        );
      }

      console.log("Evidencia fotográfica agregada a la inspección:", {
        inspectionId: inspectionForEvidenceId,
        questionId: question.id,
        evidenceId: evidence.id,
      });

      refreshEvidences();
    } catch (error) {
      console.error("Error capturando evidencia fotográfica:", error);

      setActionError(getErrorMessage(error));
    } finally {
      setPhotoProcessingAction(null);
      setPhotoProcessingQuestionId(null);
    }
  };

  const handlePickEvidence = async (question: FormQuestion) => {
    if (isProcessing) {
      return;
    }

    setPhotoProcessingQuestionId(question.id);
    setPhotoProcessingAction("gallery");
    setActionError(null);

    try {
      const inspectionForEvidenceId = await ensureDraftInspection();

      const media = await pickEvidencePhoto();

      if (!media) {
        return;
      }

      const evidence = await createEvidence({
        companyId: id,

        propertyId,

        inspectionId: inspectionForEvidenceId,

        questionId: question.id,

        title: `${question.label} - fotografía`,

        type: "photo",

        status: "pending",

        description:
          "Evidencia fotográfica seleccionada durante una inspección UNIESAP.",

        localUri: media.localUri,

        fileName: media.fileName,

        ...(media.mimeType
          ? {
              mimeType: media.mimeType,
            }
          : {}),

        ...(media.fileSize !== undefined
          ? {
              fileSize: media.fileSize,
            }
          : {}),
      });

      const currentInspection = getInspectionById(inspectionForEvidenceId);

      if (!currentInspection) {
        throw new Error(
          "La evidencia fue creada, pero no fue posible recuperar la inspección asociada.",
        );
      }

      const nextEvidenceIds = Array.from(
        new Set([...currentInspection.evidenceIds, evidence.id]),
      );

      const updatedInspection = await updateInspection(
        inspectionForEvidenceId,
        {
          evidenceIds: nextEvidenceIds,
        },
      );

      if (!updatedInspection) {
        throw new Error(
          "La fotografía fue guardada, pero no fue posible asociarla a la inspección.",
        );
      }

      console.log("Evidencia fotográfica seleccionada para la inspección:", {
        inspectionId: inspectionForEvidenceId,
        questionId: question.id,
        evidenceId: evidence.id,
      });

      refreshEvidences();
    } catch (error) {
      console.error("Error seleccionando evidencia fotográfica:", error);

      setActionError(getErrorMessage(error));
    } finally {
      setPhotoProcessingAction(null);
      setPhotoProcessingQuestionId(null);
    }
  };

  const handleDeleteEvidence = async (evidence: Evidence) => {
    if (isProcessing) {
      return;
    }

    setPhotoProcessingQuestionId(evidence.questionId ?? null);
    setPhotoProcessingAction("delete");
    setActionError(null);

    try {
      const currentInspection = getInspectionById(evidence.inspectionId);

      const deleted = await deleteEvidence(evidence.id);

      if (!deleted) {
        throw new Error("No fue posible eliminar la evidencia seleccionada.");
      }

      if (currentInspection) {
        const updatedInspection = await updateInspection(currentInspection.id, {
          evidenceIds: currentInspection.evidenceIds.filter(
            (evidenceId) => evidenceId !== evidence.id,
          ),
        });

        if (!updatedInspection) {
          console.warn(
            "La evidencia fue eliminada, pero no fue posible actualizar evidenceIds de la inspección.",
            {
              inspectionId: currentInspection.id,
              evidenceId: evidence.id,
            },
          );
        }
      }

      try {
        await deleteEvidenceMedia(evidence.localUri);
      } catch (mediaError) {
        console.error(
          "La evidencia fue eliminada, pero falló la limpieza del archivo local:",
          mediaError,
        );
      }

      refreshEvidences();
    } catch (error) {
      console.error("Error eliminando evidencia fotográfica:", error);

      setActionError(getErrorMessage(error));
    } finally {
      setPhotoProcessingAction(null);
      setPhotoProcessingQuestionId(null);
    }
  };

  /* ---------------------------------------------------------------------- */
  /*                          GUARDAR BORRADOR                              */
  /* ---------------------------------------------------------------------- */

  const handleSaveDraft = async () => {
    /*
     * Evita crear dos borradores
     * mediante pulsaciones rápidas.
     */
    if (isProcessing) {
      return;
    }

    setProcessingAction("draft");

    setActionError(null);

    try {
      const responses = buildResponses();

      const inspector = resolveInspectorName(form.questions, responses);

      /*
       * Un borrador se almacena solamente
       * dentro de UNIESAP.
       *
       * Kobo todavía NO participa.
       */
      /*
       * Si la captura ya corresponde a una inspección existente,
       * actualizamos esa misma inspección.
       *
       * Esto evita crear un segundo borrador cada vez que el usuario
       * entra, modifica algo y vuelve a guardar.
       */
      if (createdInspectionId) {
        const updatedInspection = await updateInspection(createdInspectionId, {
          inspector,

          responses,

          status: "draft",

          integration: {
            syncStatus: "local",

            lastSyncError: undefined,
          },
        });

        if (!updatedInspection) {
          throw new Error(
            "No fue posible encontrar el borrador que se intentó actualizar.",
          );
        }

        console.log("Borrador actualizado:", updatedInspection);
      } else {
        const inspection = await createInspection({
          companyId: id,

          propertyId,

          formId: form.id,

          inspector,

          responses,

          status: "draft",

          syncStatus: "local",
        });

        setCreatedInspectionId(inspection.id);

        console.log("Borrador guardado:", inspection);
      }

      navigateToProperty();
    } catch (error) {
      console.error("Error guardando borrador:", error);

      setActionError(getErrorMessage(error));
    } finally {
      setProcessingAction(null);
    }
  };

  /* ---------------------------------------------------------------------- */
  /*                         FINALIZAR INSPECCIÓN                            */
  /* ---------------------------------------------------------------------- */

  const handleFinish = async () => {
    /*
     * Protección contra doble pulsación.
     */
    if (isProcessing) {
      return;
    }

    /*
     * Antes de finalizar deben estar
     * contestadas todas las obligatorias.
     */
    if (!requiredCompleted) {
      setActionError(
        "Completa las preguntas obligatorias antes de finalizar la inspección.",
      );

      return;
    }

    setProcessingAction("finish");
    setActionError(null);

    const responses = buildResponses();

    const inspector = resolveInspectorName(form.questions, responses);

    /*
     * Si estamos continuando un borrador utilizamos
     * exactamente el mismo registro.
     */
    let currentInspectionId = createdInspectionId;

    try {
      /*
       * ================================================================
       * PASO 1
       * FINALIZAR Y PERSISTIR EN UNIESAP
       * ================================================================
       *
       * La captura ya NO intenta comunicarse directamente con Kobo.
       *
       * Formularios Kobo:
       * completed + pending
       *
       * Formularios internos:
       * completed + local
       *
       * Después, InspectionSyncQueueService será responsable
       * de procesar las inspecciones pending.
       */

      if (currentInspectionId) {
        const updatedInspection = await updateInspection(currentInspectionId, {
          inspector,

          responses,

          status: "completed",

          integration: {
            /*
             * Si el formulario utiliza Kobo queda listo
             * para entrar a la cola.
             */
            syncStatus:
              form.integration?.provider === "kobo" ? "pending" : "local",

            lastSyncError: undefined,
          },
        });

        if (!updatedInspection) {
          throw new Error("No fue posible recuperar la inspección guardada.");
        }
      } else {
        const inspection = await createInspection({
          companyId: id,

          propertyId,

          formId: form.id,

          inspector,

          responses,

          status: "completed",

          syncStatus:
            form.integration?.provider === "kobo" ? "pending" : "local",
        });

        currentInspectionId = inspection.id;

        setCreatedInspectionId(inspection.id);
      }

      if (!currentInspectionId) {
        throw new Error(
          "No fue posible obtener el ID de la inspección finalizada.",
        );
      }

      /*
       * ================================================================
       * PASO 2
       * TERMINAR EL FLUJO DE CAPTURA
       * ================================================================
       *
       * En este punto:
       *
       * ✓ la inspección está persistida;
       * ✓ está marcada como completed;
       * ✓ si utiliza Kobo está marcada como pending.
       *
       * No esperamos a Kobo y no bloqueamos al usuario.
       */
      console.log("Inspección finalizada y preparada para sincronización:", {
        inspectionId: currentInspectionId,

        syncStatus: form.integration?.provider === "kobo" ? "pending" : "local",
      });

      navigateToProperty();
    } catch (error) {
      const message = getErrorMessage(error);

      console.error("No fue posible finalizar la inspección:", error);

      setActionError(
        currentInspectionId
          ? `La inspección permanece guardada en UNIESAP, pero ocurrió un error al finalizarla: ${message}`
          : `No fue posible guardar la inspección: ${message}`,
      );
    } finally {
      setProcessingAction(null);
    }
  };
  /* ---------------------------------------------------------------------- */
  /*                              NAVEGACIÓN                                */
  /* ---------------------------------------------------------------------- */

  const navigateToProperty = () => {
    router.replace({
      pathname: "/empresas/[id]/inmuebles/[propertyId]",

      params: {
        id,
        propertyId,
      },
    });
  };

  /* ---------------------------------------------------------------------- */
  /*                         TEXTO DE ESTADO                                */
  /* ---------------------------------------------------------------------- */

  const statusLabel =
    processingAction === "draft"
      ? "● Guardando..."
      : processingAction === "finish"
        ? "● Finalizando..."
        : createdInspectionId
          ? "● Guardada localmente"
          : "● Borrador";

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ResponsiveContainer>
          {/* ============================================================ */}
          {/* NAVEGACIÓN CONTEXTUAL                                        */}
          {/* ============================================================ */}

          <ContextHeader
            /*
             * Cancelar o regresar desde una captura lleva
             * siempre al inmueble actual.
             */
            backLabel={property.name}
            onBack={() => {
              if (!isProcessing) {
                navigateToProperty();
              }
            }}
            /*
             * La empresa continúa visible como contexto.
             */
            contextLabel={company.name}
            contextColor={company.branding.primaryColor}
            /*
             * Distinguimos entre una inspección nueva
             * y la continuación de un borrador existente.
             */
            title={
              existingInspection ? "Continuar inspección" : "Nueva inspección"
            }
            subtitle={`${form.title} · ${property.name}`}
          />

          {/* ============================================================ */}
          {/* ESTADO LOCAL                                                 */}
          {/* ============================================================ */}

          <View style={styles.captureStatusRow}>
            <View
              style={[
                styles.draftBadge,
                {
                  backgroundColor: colors.surfaceSecondary,
                },
              ]}
            >
              <Text
                style={[
                  styles.draft,
                  {
                    color: createdInspectionId
                      ? colors.success
                      : colors.warning,
                  },
                ]}
              >
                {statusLabel}
              </Text>
            </View>
          </View>

          {/* ============================================================ */}
          {/* PROGRESO                                                     */}
          {/* ============================================================ */}

          <ProgressSection
            completed={answeredQuestions}
            total={totalQuestions}
            progress={progress}
          />

          {/* ============================================================ */}
          {/* CAPTURA RESPONSIVE                                           */}
          {/* ============================================================ */}

          <View style={[styles.mainLayout, !isPhone && styles.mainLayoutWide]}>
            {/* CONTEXTO EN MÓVIL */}

            {isPhone && (
              <ContextPanel
                companyName={company.name}
                propertyName={property.name}
                formTitle={form.title}
                formVersion={form.version}
              />
            )}

            {/* ========================================================== */}
            {/* PREGUNTAS DINÁMICAS                                       */}
            {/* ========================================================== */}

            <View
              style={[
                styles.captureColumn,

                !isPhone && styles.captureColumnWide,
              ]}
            >
              {form.questions.map((question, index) => (
                <QuestionCard
                  key={question.id}
                  number={index + 1}
                  question={question}
                  value={answers[question.id] ?? null}
                  onChange={(value) => updateAnswer(question.id, value)}
                  evidences={
                    createdInspectionId
                      ? getEvidencesByQuestionId(
                          createdInspectionId,
                          question.id,
                        )
                      : []
                  }
                  photoProcessingAction={
                    photoProcessingQuestionId === question.id
                      ? photoProcessingAction
                      : null
                  }
                  onCapturePhoto={() => handleCaptureEvidence(question)}
                  onPickPhoto={() => handlePickEvidence(question)}
                  onDeletePhoto={handleDeleteEvidence}
                />
              ))}
            </View>

            {/* ========================================================== */}
            {/* PANEL LATERAL TABLET / WEB                                */}
            {/* ========================================================== */}

            {!isPhone && (
              <View style={styles.sideColumn}>
                <ContextPanel
                  companyName={company.name}
                  propertyName={property.name}
                  formTitle={form.title}
                  formVersion={form.version}
                />

                <AppCard>
                  <Text
                    style={[
                      styles.statusTitle,
                      {
                        color: colors.text,
                      },
                    ]}
                  >
                    Estado
                  </Text>

                  <View style={styles.statusRow}>
                    <View
                      style={[
                        styles.statusDot,
                        {
                          backgroundColor: createdInspectionId
                            ? colors.success
                            : colors.warning,
                        },
                      ]}
                    />

                    <Text
                      style={[
                        styles.statusText,
                        {
                          color: colors.textSecondary,
                        },
                      ]}
                    >
                      {processingAction === "finish"
                        ? "Finalizando"
                        : processingAction === "draft"
                          ? "Guardando"
                          : createdInspectionId
                            ? "Guardada"
                            : "Borrador"}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.statusDescription,
                      {
                        color: colors.textMuted,
                      },
                    ]}
                  >
                    {answeredQuestions} de {totalQuestions} preguntas
                    contestadas.
                  </Text>
                </AppCard>

                {/* INTEGRACIÓN */}

                <AppCard>
                  <Text
                    style={[
                      styles.statusTitle,
                      {
                        color: colors.text,
                      },
                    ]}
                  >
                    Integración
                  </Text>

                  <Text
                    style={[
                      styles.integrationText,
                      {
                        color: colors.textSecondary,
                      },
                    ]}
                  >
                    {form.integration?.provider === "kobo"
                      ? "Formulario preparado para sincronización con Kobo."
                      : "Formulario interno de UNIESAP."}
                  </Text>

                  {form.integration && (
                    <Text
                      style={[
                        styles.integrationMeta,
                        {
                          color: colors.textMuted,
                        },
                      ]}
                    >
                      Asset: {form.integration.assetUid}
                    </Text>
                  )}
                </AppCard>
              </View>
            )}
          </View>

          {/* ============================================================ */}
          {/* VALIDACIÓN                                                   */}
          {/* ============================================================ */}

          {!requiredCompleted && (
            <Text
              style={[
                styles.validationMessage,
                {
                  color: colors.warning,
                },
              ]}
            >
              Completa las preguntas obligatorias antes de finalizar la
              inspección.
            </Text>
          )}

          {/* ============================================================ */}
          {/* ERROR                                                        */}
          {/* ============================================================ */}

          {actionError && (
            <AppCard style={styles.errorCard}>
              <Text
                style={[
                  styles.errorTitle,
                  {
                    color: colors.error,
                  },
                ]}
              >
                No fue posible completar la operación
              </Text>

              <Text
                style={[
                  styles.errorDescription,
                  {
                    color: colors.textSecondary,
                  },
                ]}
              >
                {actionError}
              </Text>

              {createdInspectionId && (
                <Text
                  style={[
                    styles.savedNotice,
                    {
                      color: colors.success,
                    },
                  ]}
                >
                  ✓ La inspección permanece guardada en UNIESAP.
                </Text>
              )}
            </AppCard>
          )}

          {/* ============================================================ */}
          {/* ACCIONES                                                     */}
          {/* ============================================================ */}

          <View style={[styles.actions, !isPhone && styles.actionsWide]}>
            <View style={styles.actionButton}>
              <AppButton onPress={handleFinish}>
                {processingAction === "finish"
                  ? "Finalizando..."
                  : createdInspectionId
                    ? "Reintentar sincronización"
                    : "Finalizar inspección"}
              </AppButton>
            </View>

            <View style={styles.actionButton}>
              <AppButton variant="secondary" onPress={handleSaveDraft}>
                {processingAction === "draft"
                  ? "Guardando..."
                  : "Guardar borrador"}
              </AppButton>
            </View>
          </View>

          <Text
            style={[
              styles.prototypeNotice,
              {
                color: colors.textMuted,
              },
            ]}
          >
            Las inspecciones se almacenan primero en UNIESAP. Los formularios
            vinculados con Kobo se sincronizan automáticamente al finalizar.
          </Text>
        </ResponsiveContainer>
      </ScrollView>
    </Screen>
  );
}

/* -------------------------------------------------------------------------- */
/*                              QUESTION CARD                                 */
/* -------------------------------------------------------------------------- */

/*
 * El componente no conoce preguntas específicas.
 *
 * Recibe un FormQuestion y selecciona automáticamente
 * el control adecuado según question.type.
 */
function QuestionCard({
  number,
  question,
  value,
  onChange,
  evidences,
  photoProcessingAction,
  onCapturePhoto,
  onPickPhoto,
  onDeletePhoto,
}: {
  number: number;
  question: FormQuestion;
  value: InspectionResponseValue;
  onChange: (value: InspectionResponseValue) => void;
  evidences: Evidence[];
  photoProcessingAction: PhotoProcessingAction;
  onCapturePhoto: () => void;
  onPickPhoto: () => void;
  onDeletePhoto: (evidence: Evidence) => void;
}) {
  const { colors } = useAppTheme();

  return (
    <AppCard style={styles.questionCard}>
      {/* ENCABEZADO */}

      <View style={styles.questionHeader}>
        <View
          style={[
            styles.questionNumber,
            {
              backgroundColor: colors.primarySoft,
            },
          ]}
        >
          <Text
            style={[
              styles.questionNumberText,
              {
                color: colors.primary,
              },
            ]}
          >
            {number}
          </Text>
        </View>

        <View style={styles.questionHeaderInfo}>
          <Text
            style={[
              styles.questionLabel,
              {
                color: colors.text,
              },
            ]}
          >
            {question.label}

            {question.required && (
              <Text
                style={{
                  color: colors.error,
                }}
              >
                {" *"}
              </Text>
            )}
          </Text>

          <Text
            style={[
              styles.questionType,
              {
                color: colors.textMuted,
              },
            ]}
          >
            {getQuestionTypeLabel(question.type)}
          </Text>
        </View>
      </View>

      {/* ================================================================ */}
      {/* TEXT                                                             */}
      {/* ================================================================ */}

      {question.type === "text" && (
        <AppTextInput
          value={typeof value === "string" ? value : ""}
          onChangeText={onChange}
          placeholder="Escribe una respuesta"
        />
      )}

      {/* ================================================================ */}
      {/* TEXTAREA                                                         */}
      {/* ================================================================ */}

      {question.type === "textarea" && (
        <AppTextInput
          value={typeof value === "string" ? value : ""}
          onChangeText={onChange}
          placeholder="Escribe tus observaciones..."
          multiline
          numberOfLines={5}
          style={styles.textArea}
        />
      )}

      {/* ================================================================ */}
      {/* NUMBER                                                           */}
      {/* ================================================================ */}

      {question.type === "number" && (
        <AppTextInput
          value={typeof value === "number" ? String(value) : ""}
          onChangeText={(text) => {
            if (text.trim() === "") {
              onChange(null);

              return;
            }

            const parsed = Number(text);

            if (!Number.isNaN(parsed)) {
              onChange(parsed);
            }
          }}
          placeholder="0"
          keyboardType="numeric"
        />
      )}

      {/* ================================================================ */}
      {/* BOOLEAN                                                          */}
      {/* ================================================================ */}

      {question.type === "boolean" && (
        <View style={styles.booleanOptions}>
          <SelectionButton
            label="Sí"
            selected={value === true}
            onPress={() => onChange(true)}
          />

          <SelectionButton
            label="No"
            selected={value === false}
            onPress={() => onChange(false)}
          />
        </View>
      )}

      {/* ================================================================ */}
      {/* SELECT                                                           */}
      {/* ================================================================ */}

      {question.type === "select" && (
        <SelectQuestion
          options={question.options ?? []}
          value={typeof value === "string" ? value : null}
          onChange={onChange}
        />
      )}

      {/* ================================================================ */}
      {/* PHOTO                                                            */}
      {/* ================================================================ */}

      {question.type === "photo" && (
        <PhotoQuestion
          evidences={evidences}
          processingAction={photoProcessingAction}
          onCapturePhoto={onCapturePhoto}
          onPickPhoto={onPickPhoto}
          onDeletePhoto={onDeletePhoto}
        />
      )}

      {/* CAMPO KOBO */}

      {question.integration?.koboFieldName && (
        <Text
          style={[
            styles.koboField,
            {
              color: colors.textMuted,
            },
          ]}
        >
          Kobo: {question.integration.koboFieldName}
        </Text>
      )}
    </AppCard>
  );
}

/* -------------------------------------------------------------------------- */
/*                              SELECT QUESTION                               */
/* -------------------------------------------------------------------------- */

function SelectQuestion({
  options,
  value,
  onChange,
}: {
  options: FormQuestionOption[];

  value: string | null;

  onChange: (value: InspectionResponseValue) => void;
}) {
  const { colors } = useAppTheme();

  if (options.length === 0) {
    return (
      <Text
        style={[
          styles.noOptions,
          {
            color: colors.warning,
          },
        ]}
      >
        Esta pregunta todavía no tiene opciones configuradas.
      </Text>
    );
  }

  return (
    <View style={styles.selectOptions}>
      {options.map((option) => {
        const selected = value === option.value;

        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.selectOption,
              {
                backgroundColor: selected ? colors.primarySoft : colors.surface,

                borderColor: selected ? colors.primary : colors.border,

                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
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
                    styles.radioSelected,
                    {
                      backgroundColor: colors.primary,
                    },
                  ]}
                />
              )}
            </View>

            <Text
              style={[
                styles.selectionLabel,
                {
                  color: colors.text,
                },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                               PHOTO QUESTION                               */
/* -------------------------------------------------------------------------- */

function PhotoQuestion({
  evidences,
  processingAction,
  onCapturePhoto,
  onPickPhoto,
  onDeletePhoto,
}: {
  evidences: Evidence[];
  processingAction: PhotoProcessingAction;
  onCapturePhoto: () => void;
  onPickPhoto: () => void;
  onDeletePhoto: (evidence: Evidence) => void;
}) {
  const { colors } = useAppTheme();

  const isProcessing = processingAction !== null;

  return (
    <View style={styles.photoSection}>
      <View
        style={[
          styles.photoSummary,
          {
            backgroundColor:
              evidences.length > 0
                ? colors.primarySoft
                : colors.surfaceSecondary,

            borderColor: evidences.length > 0 ? colors.primary : colors.border,
          },
        ]}
      >
        <View
          style={[
            styles.photoIconContainer,
            {
              backgroundColor: colors.surface,
            },
          ]}
        >
          <Text
            style={[
              styles.photoIcon,
              {
                color: colors.primary,
              },
            ]}
          >
            {evidences.length > 0 ? "✓" : "+"}
          </Text>
        </View>

        <View style={styles.photoSummaryContent}>
          <Text
            style={[
              styles.photoTitle,
              {
                color: colors.text,
              },
            ]}
          >
            {evidences.length > 0
              ? `${evidences.length} fotografía${
                  evidences.length === 1 ? "" : "s"
                }`
              : "Sin fotografías"}
          </Text>

          <Text
            style={[
              styles.photoDescription,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            Agrega todas las evidencias necesarias. UNIESAP no establece un
            límite fijo de fotografías para esta pregunta.
          </Text>
        </View>
      </View>

      <View style={styles.photoActions}>
        <View style={styles.photoActionButton}>
          <AppButton onPress={onCapturePhoto}>
            {processingAction === "camera"
              ? "Abriendo cámara..."
              : "Tomar fotografía"}
          </AppButton>
        </View>

        <View style={styles.photoActionButton}>
          <AppButton variant="secondary" onPress={onPickPhoto}>
            {processingAction === "gallery"
              ? "Abriendo galería..."
              : "Seleccionar fotografía"}
          </AppButton>
        </View>
      </View>

      {isProcessing && processingAction === "delete" && (
        <Text
          style={[
            styles.photoProcessingText,
            {
              color: colors.textMuted,
            },
          ]}
        >
          Eliminando evidencia...
        </Text>
      )}

      {evidences.length > 0 && (
        <View style={styles.photoGrid}>
          {evidences.map((evidence) => (
            <View
              key={evidence.id}
              style={[
                styles.photoEvidenceCard,
                {
                  backgroundColor: colors.surfaceSecondary,
                  borderColor: colors.border,
                },
              ]}
            >
              {evidence.localUri ? (
                <Image
                  source={{
                    uri: evidence.localUri,
                  }}
                  style={styles.photoPreview}
                  contentFit="cover"
                  transition={150}
                />
              ) : (
                <View
                  style={[
                    styles.photoPreviewFallback,
                    {
                      backgroundColor: colors.primarySoft,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.photoPreviewFallbackText,
                      {
                        color: colors.primary,
                      },
                    ]}
                  >
                    FOTO
                  </Text>
                </View>
              )}

              <View style={styles.photoEvidenceInfo}>
                <Text
                  style={[
                    styles.photoEvidenceName,
                    {
                      color: colors.text,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {evidence.fileName ?? evidence.title}
                </Text>

                <Text
                  style={[
                    styles.photoEvidenceMeta,
                    {
                      color: colors.textMuted,
                    },
                  ]}
                >
                  {evidence.fileSize !== undefined
                    ? formatEvidenceFileSize(evidence.fileSize)
                    : "Archivo local"}
                </Text>

                <Pressable
                  disabled={isProcessing}
                  onPress={() => onDeletePhoto(evidence)}
                  style={({ pressed }) => [
                    styles.photoDeleteButton,
                    {
                      borderColor: colors.error,

                      opacity: pressed || isProcessing ? 0.6 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.photoDeleteText,
                      {
                        color: colors.error,
                      },
                    ]}
                  >
                    Eliminar
                  </Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                              SELECTION BUTTON                              */
/* -------------------------------------------------------------------------- */

function SelectionButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.selectionButton,
        {
          backgroundColor: selected ? colors.primarySoft : colors.surface,

          borderColor: selected ? colors.primary : colors.border,

          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
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
              styles.radioSelected,
              {
                backgroundColor: colors.primary,
              },
            ]}
          />
        )}
      </View>

      <Text
        style={[
          styles.selectionLabel,
          {
            color: colors.text,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/* -------------------------------------------------------------------------- */
/*                              PROGRESS SECTION                              */
/* -------------------------------------------------------------------------- */

function ProgressSection({
  completed,
  total,
  progress,
}: {
  completed: number;
  total: number;
  progress: number;
}) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.progressSection}>
      <View style={styles.progressHeader}>
        <View>
          <Text
            style={[
              styles.progressLabel,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            Progreso de captura
          </Text>

          <Text
            style={[
              styles.progressDescription,
              {
                color: colors.textMuted,
              },
            ]}
          >
            Las respuestas se calculan automáticamente.
          </Text>
        </View>

        <Text
          style={[
            styles.progressValue,
            {
              color: colors.text,
            },
          ]}
        >
          {completed} de {total}
        </Text>
      </View>

      <View
        style={[
          styles.progressTrack,
          {
            backgroundColor: colors.surfaceSecondary,
          },
        ]}
      >
        <View
          style={[
            styles.progressBar,
            {
              backgroundColor: colors.primary,

              width: `${Math.round(progress * 100)}%`,
            },
          ]}
        />
      </View>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                                CONTEXT PANEL                               */
/* -------------------------------------------------------------------------- */

function ContextPanel({
  companyName,
  propertyName,
  formTitle,
  formVersion,
}: {
  companyName: string;
  propertyName: string;
  formTitle: string;
  formVersion: string;
}) {
  const { colors } = useAppTheme();

  return (
    <AppCard>
      <Text
        style={[
          styles.contextTitle,
          {
            color: colors.text,
          },
        ]}
      >
        Contexto de la inspección
      </Text>

      <Text
        style={[
          styles.contextDescription,
          {
            color: colors.textSecondary,
          },
        ]}
      >
        Información asociada a esta captura.
      </Text>

      <ContextRow label="Empresa" value={companyName} />

      <Divider />

      <ContextRow label="Inmueble" value={propertyName} />

      <Divider />

      <ContextRow label="Formulario" value={formTitle} />

      <Divider />

      <ContextRow label="Versión" value={`v${formVersion}`} />
    </AppCard>
  );
}

/* -------------------------------------------------------------------------- */
/*                                CONTEXT ROW                                 */
/* -------------------------------------------------------------------------- */

function ContextRow({ label, value }: { label: string; value: string }) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.contextRow}>
      <Text
        style={[
          styles.contextLabel,
          {
            color: colors.textMuted,
          },
        ]}
      >
        {label}
      </Text>

      <Text
        style={[
          styles.contextValue,
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
/*                                   DIVIDER                                  */
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

function isAnswered(value: InspectionResponseValue | undefined) {
  if (value === undefined || value === null) {
    return false;
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  /*
   * false cuenta como respuesta válida.
   */
  return true;
}

/*
 * Mientras todavía no existe autenticación real,
 * intentamos obtener el responsable desde las
 * respuestas del propio formulario.
 *
 * Si el formulario no tiene ese campo utilizamos
 * un valor temporal genérico.
 */
function resolveInspectorName(
  questions: FormQuestion[],
  responses: InspectionResponse[],
): string {
  const responsibleQuestion =
    questions.find(
      (question) =>
        question.integration?.koboFieldName === "datos_generales/responsable",
    ) ??
    questions.find((question) =>
      question.label.toLowerCase().includes("responsable"),
    );

  if (!responsibleQuestion) {
    return "Usuario UNIESAP";
  }

  const response = responses.find(
    (item) => item.questionId === responsibleQuestion.id,
  );

  if (typeof response?.value === "string" && response.value.trim().length > 0) {
    return response.value.trim();
  }

  return "Usuario UNIESAP";
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Ocurrió un error desconocido.";
}

function formatEvidenceFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kilobytes = bytes / 1024;

  if (kilobytes < 1024) {
    return `${kilobytes.toFixed(1)} KB`;
  }

  return `${(kilobytes / 1024).toFixed(2)} MB`;
}

function getQuestionTypeLabel(type: FormQuestion["type"]) {
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

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
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

    gap: Spacing.md,

    marginBottom: Spacing.xl,
  },

  backText: {
    fontSize: FontSize.small,

    fontWeight: "600",
  },

  draftBadge: {
    paddingHorizontal: Spacing.sm,

    paddingVertical: Spacing.xs,

    borderRadius: Radius.full,
  },

  draft: {
    fontSize: FontSize.caption,

    fontWeight: "700",
  },

  /*
   * Estado visual de la captura.
   *
   * Se mantiene fuera de ContextHeader para que el encabezado
   * pueda reutilizarse en otras pantallas.
   */
  captureStatusRow: {
    flexDirection: "row",
    justifyContent: "flex-end",

    marginBottom: Spacing.lg,
  },

  /* -------------------------------------------------------------------- */
  /* ENCABEZADO                                                           */
  /* -------------------------------------------------------------------- */

  header: {
    marginBottom: Spacing.lg,
  },

  overline: {
    fontSize: FontSize.caption,

    fontWeight: "700",

    letterSpacing: 1,

    marginBottom: Spacing.sm,
  },

  captureOverline: {
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
    maxWidth: 760,

    fontSize: FontSize.body,

    lineHeight: 24,
  },

  /* -------------------------------------------------------------------- */
  /* PROGRESO                                                             */
  /* -------------------------------------------------------------------- */

  progressSection: {
    marginBottom: Spacing.xl,
  },

  progressHeader: {
    flexDirection: "row",

    justifyContent: "space-between",

    alignItems: "flex-end",

    gap: Spacing.md,

    marginBottom: Spacing.sm,
  },

  progressLabel: {
    fontSize: FontSize.small,

    fontWeight: "600",

    marginBottom: Spacing.xs,
  },

  progressDescription: {
    fontSize: FontSize.caption,
  },

  progressValue: {
    flexShrink: 0,

    fontSize: FontSize.small,

    fontWeight: "700",
  },

  progressTrack: {
    height: 8,

    overflow: "hidden",

    borderRadius: Radius.full,
  },

  progressBar: {
    height: "100%",

    borderRadius: Radius.full,
  },

  /* -------------------------------------------------------------------- */
  /* LAYOUT                                                               */
  /* -------------------------------------------------------------------- */

  mainLayout: {
    width: "100%",

    gap: Spacing.lg,
  },

  mainLayoutWide: {
    flexDirection: "row",

    alignItems: "flex-start",

    gap: Spacing.xl,
  },

  captureColumn: {
    width: "100%",

    gap: Spacing.md,
  },

  captureColumnWide: {
    flex: 1,

    width: "auto",

    minWidth: 0,
  },

  sideColumn: {
    width: 300,

    flexShrink: 0,

    gap: Spacing.md,
  },

  /* -------------------------------------------------------------------- */
  /* QUESTIONS                                                            */
  /* -------------------------------------------------------------------- */

  questionCard: {
    width: "100%",
  },

  questionHeader: {
    flexDirection: "row",

    alignItems: "flex-start",

    marginBottom: Spacing.lg,
  },

  questionNumber: {
    width: 36,

    height: 36,

    flexShrink: 0,

    alignItems: "center",

    justifyContent: "center",

    borderRadius: Radius.full,

    marginRight: Spacing.md,
  },

  questionNumberText: {
    fontSize: FontSize.small,

    fontWeight: "700",
  },

  questionHeaderInfo: {
    flex: 1,

    minWidth: 0,
  },

  questionLabel: {
    fontSize: FontSize.body,

    fontWeight: "700",

    lineHeight: 22,

    marginBottom: Spacing.xs,
  },

  questionType: {
    fontSize: FontSize.caption,
  },

  textArea: {
    minHeight: 140,

    textAlignVertical: "top",

    paddingTop: Spacing.md,
  },

  /* -------------------------------------------------------------------- */
  /* BOOLEAN                                                              */
  /* -------------------------------------------------------------------- */

  booleanOptions: {
    flexDirection: "row",

    gap: Spacing.md,
  },

  selectionButton: {
    flex: 1,

    minHeight: 56,

    flexDirection: "row",

    alignItems: "center",

    padding: Spacing.md,

    borderWidth: 1,

    borderRadius: Radius.md,
  },

  radio: {
    width: 20,

    height: 20,

    flexShrink: 0,

    borderWidth: 2,

    borderRadius: Radius.full,

    alignItems: "center",

    justifyContent: "center",

    marginRight: Spacing.sm,
  },

  radioSelected: {
    width: 10,

    height: 10,

    borderRadius: Radius.full,
  },

  selectionLabel: {
    flex: 1,

    fontSize: FontSize.body,

    fontWeight: "600",
  },

  /* -------------------------------------------------------------------- */
  /* SELECT                                                               */
  /* -------------------------------------------------------------------- */

  selectOptions: {
    gap: Spacing.sm,
  },

  selectOption: {
    minHeight: 54,

    flexDirection: "row",

    alignItems: "center",

    padding: Spacing.md,

    borderWidth: 1,

    borderRadius: Radius.md,
  },

  noOptions: {
    fontSize: FontSize.small,

    lineHeight: 20,
  },

  /* -------------------------------------------------------------------- */
  /* PHOTO                                                                */
  /* -------------------------------------------------------------------- */

  photoSection: {
    gap: Spacing.md,
  },

  photoSummary: {
    minHeight: 112,

    flexDirection: "row",

    alignItems: "center",

    padding: Spacing.md,

    borderWidth: 1,

    borderRadius: Radius.lg,
  },

  photoIconContainer: {
    width: 48,

    height: 48,

    flexShrink: 0,

    alignItems: "center",

    justifyContent: "center",

    borderRadius: Radius.full,

    marginRight: Spacing.md,
  },

  photoIcon: {
    fontSize: 28,

    fontWeight: "600",
  },

  photoSummaryContent: {
    flex: 1,

    minWidth: 0,
  },

  photoTitle: {
    fontSize: FontSize.body,

    fontWeight: "700",

    marginBottom: Spacing.xs,
  },

  photoDescription: {
    fontSize: FontSize.caption,

    lineHeight: 18,
  },

  photoActions: {
    flexDirection: "row",

    flexWrap: "wrap",

    gap: Spacing.sm,
  },

  photoActionButton: {
    flexGrow: 1,

    minWidth: 190,
  },

  photoProcessingText: {
    fontSize: FontSize.caption,

    fontWeight: "600",
  },

  photoGrid: {
    flexDirection: "row",

    flexWrap: "wrap",

    gap: Spacing.md,
  },

  photoEvidenceCard: {
    width: 180,

    overflow: "hidden",

    borderWidth: 1,

    borderRadius: Radius.md,
  },

  photoPreview: {
    width: "100%",

    aspectRatio: 4 / 3,
  },

  photoPreviewFallback: {
    width: "100%",

    aspectRatio: 4 / 3,

    alignItems: "center",

    justifyContent: "center",
  },

  photoPreviewFallbackText: {
    fontSize: FontSize.caption,

    fontWeight: "700",
  },

  photoEvidenceInfo: {
    padding: Spacing.sm,
  },

  photoEvidenceName: {
    fontSize: FontSize.caption,

    fontWeight: "700",

    marginBottom: Spacing.xs,
  },

  photoEvidenceMeta: {
    fontSize: FontSize.caption,

    marginBottom: Spacing.sm,
  },

  photoDeleteButton: {
    minHeight: 34,

    alignItems: "center",

    justifyContent: "center",

    paddingHorizontal: Spacing.sm,

    borderWidth: 1,

    borderRadius: Radius.md,
  },

  photoDeleteText: {
    fontSize: FontSize.caption,

    fontWeight: "700",
  },

  /* -------------------------------------------------------------------- */
  /* KOBO                                                                 */
  /* -------------------------------------------------------------------- */

  koboField: {
    fontSize: FontSize.caption,

    marginTop: Spacing.md,
  },

  /* -------------------------------------------------------------------- */
  /* CONTEXTO                                                             */
  /* -------------------------------------------------------------------- */

  contextTitle: {
    fontSize: FontSize.body,

    fontWeight: "700",

    marginBottom: Spacing.xs,
  },

  contextDescription: {
    fontSize: FontSize.caption,

    lineHeight: 18,

    marginBottom: Spacing.md,
  },

  contextRow: {
    paddingVertical: Spacing.xs,
  },

  contextLabel: {
    fontSize: FontSize.caption,

    marginBottom: Spacing.xs,
  },

  contextValue: {
    fontSize: FontSize.small,

    fontWeight: "600",
  },

  divider: {
    height: 1,

    marginVertical: Spacing.sm,
  },

  /* -------------------------------------------------------------------- */
  /* STATUS                                                               */
  /* -------------------------------------------------------------------- */

  statusTitle: {
    fontSize: FontSize.body,

    fontWeight: "700",

    marginBottom: Spacing.md,
  },

  statusRow: {
    flexDirection: "row",

    alignItems: "center",

    marginBottom: Spacing.sm,
  },

  statusDot: {
    width: 8,

    height: 8,

    borderRadius: Radius.full,

    marginRight: Spacing.sm,
  },

  statusText: {
    fontSize: FontSize.small,

    fontWeight: "600",
  },

  statusDescription: {
    fontSize: FontSize.caption,

    lineHeight: 18,
  },

  integrationText: {
    fontSize: FontSize.small,

    lineHeight: 20,

    marginBottom: Spacing.sm,
  },

  integrationMeta: {
    fontSize: FontSize.caption,
  },

  /* -------------------------------------------------------------------- */
  /* VALIDACIÓN                                                           */
  /* -------------------------------------------------------------------- */

  validationMessage: {
    fontSize: FontSize.small,

    fontWeight: "600",

    lineHeight: 20,

    marginTop: Spacing.lg,
  },

  /* -------------------------------------------------------------------- */
  /* ERROR                                                                */
  /* -------------------------------------------------------------------- */

  errorCard: {
    marginTop: Spacing.lg,
  },

  errorTitle: {
    fontSize: FontSize.small,

    fontWeight: "700",

    marginBottom: Spacing.xs,
  },

  errorDescription: {
    fontSize: FontSize.small,

    lineHeight: 20,
  },

  savedNotice: {
    fontSize: FontSize.caption,

    fontWeight: "700",

    lineHeight: 18,

    marginTop: Spacing.md,
  },

  /* -------------------------------------------------------------------- */
  /* ACTIONS                                                              */
  /* -------------------------------------------------------------------- */

  actions: {
    gap: Spacing.sm,

    marginTop: Spacing.xl,
  },

  actionsWide: {
    flexDirection: "row",

    justifyContent: "flex-end",
  },

  actionButton: {
    minWidth: 210,
  },

  prototypeNotice: {
    fontSize: FontSize.caption,

    lineHeight: 18,

    textAlign: "center",

    marginTop: Spacing.lg,
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
