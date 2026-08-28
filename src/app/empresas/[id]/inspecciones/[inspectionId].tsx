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
import { getEvidencesByInspectionId } from "@/repositories/evidenceRepository";
import { getFormById } from "@/repositories/formRepository";
import { getInspectionById } from "@/repositories/inspectionRepository";
import { getPropertyById } from "@/repositories/propertyRepository";

import { syncInspection } from "@/services/inspectionSyncService";

import { FontSize, Radius, Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";
import { useResponsive } from "@/hooks/useResponsive";

import type { InspectionSyncStatus } from "@/types/inspection";

export default function InspectionDetailsScreen() {
  const { colors } = useAppTheme();

  /*
   * En escritorio aprovechamos el espacio horizontal.
   */
  const { isPhone, isTablet } = useResponsive();

  const isDesktop = !isPhone && !isTablet;

  /*
   * Ruta:
   *
   * /empresas/[id]/inspecciones/[inspectionId]
   */
  const { id, inspectionId } = useLocalSearchParams<{
    id: string;
    inspectionId: string;
  }>();

  /*
   * Estado del reintento de sincronizaciÃ³n.
   */
  const [isRetrying, setIsRetrying] = useState(false);

  const [retryError, setRetryError] = useState<string | null>(null);

  /*
   * Utilizamos este contador solamente para
   * forzar una nueva lectura visual despuÃ©s
   * de modificar el repositorio en memoria.
   *
   * Cuando migremos a una base reactiva/SQLite
   * esta tÃ©cnica dejarÃ¡ de ser necesaria.
   */
  const [refreshVersion, setRefreshVersion] = useState(0);

  /*
   * refreshVersion se lee deliberadamente
   * para que React vuelva a ejecutar estas consultas.
   */
  void refreshVersion;

  const company = getCompanyById(id);

  const inspection = getInspectionById(inspectionId);

  /*
   * Todos los Hooks ya se ejecutaron,
   * por lo que ahora podemos realizar
   * el return condicional.
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
            InspecciÃ³n no encontrada
          </Text>

          <Text
            style={[
              styles.notFoundDescription,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            No fue posible encontrar la informaciÃ³n de esta inspecciÃ³n.
          </Text>
        </View>
      </Screen>
    );
  }

  const property = getPropertyById(inspection.propertyId);

  const form = getFormById(inspection.formId);

  const inspectionEvidences = getEvidencesByInspectionId(inspection.id);

  /* ---------------------------------------------------------------------- */
  /*                        ESTADO DE INSPECCIÃ“N                             */
  /* ---------------------------------------------------------------------- */

  const statusLabel =
    inspection.status === "completed"
      ? "Finalizada"
      : inspection.status === "in_progress"
        ? "En proceso"
        : "Borrador";

  const statusColor =
    inspection.status === "completed"
      ? colors.success
      : inspection.status === "in_progress"
        ? colors.warning
        : colors.textMuted;

  /* ---------------------------------------------------------------------- */
  /*                       ESTADO DE SINCRONIZACIÃ“N                          */
  /* ---------------------------------------------------------------------- */

  const syncStatus = inspection.integration?.syncStatus ?? "local";

  const syncInfo = getSyncStatusInfo(syncStatus, colors);

  /*
   * Solamente permitimos reintento cuando:
   *
   * - ocurriÃ³ un error
   * - existe formulario
   * - el formulario estÃ¡ integrado con Kobo
   */
  const canRetrySync =
    syncStatus === "error" && form?.integration?.provider === "kobo";

  /* ---------------------------------------------------------------------- */
  /*                         REINTENTAR KOBO                                 */
  /* ---------------------------------------------------------------------- */

  const handleRetrySync = async () => {
    if (
      isRetrying ||
      !form ||
      !canRetrySync
    ) {
      return;
    }

    setIsRetrying(true);
    setRetryError(null);

    try {
      /*
       * Toda la lÃ³gica de sincronizaciÃ³n vive ahora
       * dentro de InspectionSyncService.
       *
       * Esta pantalla Ãºnicamente solicita el reintento.
       */
      const result =
        await syncInspection(
          inspection.id,
        );

      if (
        result.status ===
        "error"
      ) {
        setRetryError(
          result.error,
        );
      } else {
        console.log(
          "Reintento de sincronizaciÃ³n procesado:",
          result,
        );
      }

      /*
       * El repositorio mantiene una copia hidratada en memoria.
       * Forzamos un render para volver a leer la inspecciÃ³n
       * y mostrar synced/error/syncing segÃºn corresponda.
       */
      setRefreshVersion(
        (value) =>
          value + 1,
      );
    } catch (error) {
      const message =
        getErrorMessage(
          error,
        );

      setRetryError(
        message,
      );

      setRefreshVersion(
        (value) =>
          value + 1,
      );
    } finally {
      setIsRetrying(false);
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
          {/* NAVEGACIÃ“N CONTEXTUAL                                        */}
          {/* ============================================================ */}

          <ContextHeader
            /*
             * Una inspecciÃ³n se abre desde el listado de inspecciones.
             * El destino anterior es explÃ­cito para no depender del historial.
             */
            backLabel="Inspecciones"
            onBack={() =>
              router.navigate({
                pathname: "/empresas/[id]/inspecciones",

                params: {
                  id,
                },
              })
            }

            /*
             * La empresa permanece visible como contexto superior.
             */
            contextLabel={company.name}
            contextColor={company.branding.primaryColor}

            /*
             * El formulario identifica la inspecciÃ³n actual
             * y el inmueble aparece como descripciÃ³n.
             */
            title={form?.title ?? "Formulario no disponible"}
            subtitle={property?.name ?? "Inmueble no disponible"}
          />

          {/* ============================================================ */}
          {/* ESTADOS                                                      */}
          {/* ============================================================ */}

          <View style={styles.badges}>
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

            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: `${syncInfo.color}20`,
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  {
                    color: syncInfo.color,
                  },
                ]}
              >
                â— {syncInfo.label}
              </Text>
            </View>
          </View>

          {/* ============================================================ */}
          {/* INFORMACIÃ“N / EVIDENCIAS                                     */}
          {/* ============================================================ */}

          <View
            style={[styles.topContent, isDesktop && styles.topContentDesktop]}
          >
            {/* INFORMACIÃ“N */}

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
                InformaciÃ³n
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
                  label="VersiÃ³n"
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
                        â—«
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
                      â€º
                    </Text>
                  </View>
                </AppCard>
              </Pressable>
            </View>
          </View>

          {/* ============================================================ */}
          {/* SINCRONIZACIÃ“N KOBO                                          */}
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
              SincronizaciÃ³n
            </Text>

            <AppCard>
              <View style={styles.syncHeader}>
                <View
                  style={[
                    styles.syncIcon,
                    {
                      backgroundColor: `${syncInfo.color}20`,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.syncDot,
                      {
                        backgroundColor: syncInfo.color,
                      },
                    ]}
                  />
                </View>

                <View style={styles.syncHeaderInfo}>
                  <Text
                    style={[
                      styles.syncTitle,
                      {
                        color: syncInfo.color,
                      },
                    ]}
                  >
                    {isRetrying ? "Sincronizando..." : syncInfo.label}
                  </Text>

                  <Text
                    style={[
                      styles.syncDescription,
                      {
                        color: colors.textSecondary,
                      },
                    ]}
                  >
                    {syncInfo.description}
                  </Text>
                </View>
              </View>

              {inspection.integration?.kobo && (
                <>
                  <Divider />

                  <InfoRow
                    label="Asset Kobo"
                    value={inspection.integration.kobo.assetUid}
                  />

                  <Divider />

                  <InfoRow
                    label="Submission ID"
                    value={String(inspection.integration.kobo.submissionId)}
                  />

                  {inspection.integration.kobo.uuid && (
                    <>
                      <Divider />

                      <InfoRow
                        label="UUID"
                        value={inspection.integration.kobo.uuid}
                      />
                    </>
                  )}

                  {inspection.integration.kobo.syncedAt && (
                    <>
                      <Divider />

                      <InfoRow
                        label="Ãšltima sincronizaciÃ³n"
                        value={formatDateTime(
                          inspection.integration.kobo.syncedAt,
                        )}
                      />
                    </>
                  )}
                </>
              )}

              {inspection.integration?.lastSyncError && (
                <>
                  <Divider />

                  <Text
                    style={[
                      styles.errorLabel,
                      {
                        color: colors.error,
                      },
                    ]}
                  >
                    Ãšltimo error
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
                </>
              )}

              {retryError && (
                <Text
                  style={[
                    styles.retryError,
                    {
                      color: colors.error,
                    },
                  ]}
                >
                  {retryError}
                </Text>
              )}

              {canRetrySync && (
                <View style={styles.retryAction}>
                  <AppButton onPress={handleRetrySync}>
                    {isRetrying
                      ? "Sincronizando..."
                      : "Reintentar sincronizaciÃ³n"}
                  </AppButton>
                </View>
              )}
            </AppCard>
          </View>

          {/* ============================================================ */}
          {/* RESPUESTAS                                                    */}
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
              Respuestas
            </Text>

            {inspection.responses.length > 0 ? (
              <ResponsiveGrid
                phoneColumns={1}
                tabletColumns={2}
                desktopColumns={3}
                gap={Spacing.md}
              >
                {inspection.responses.map((response) => {
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
                  Esta inspecciÃ³n todavÃ­a no contiene respuestas registradas.
                </Text>
              </AppCard>
            )}
          </View>

          {/* ============================================================ */}
          {/* ACCIONES                                                     */}
          {/* ============================================================ */}

          <View style={styles.actions}>
            {inspection.status !== "completed" && (
              <View style={styles.actionButton}>
                {/*
                 * Continuamos la inspecciÃ³n existente.
                 *
                 * CaptureScreen recibe inspectionId, reconstruye
                 * las respuestas guardadas y actualiza esa misma
                 * inspecciÃ³n en lugar de crear un duplicado.
                 */}
                <AppButton
                  onPress={() =>
                    router.navigate({
                      pathname:
                        "/empresas/[id]/inmuebles/[propertyId]/captura",

                      params: {
                        id,

                        propertyId:
                          inspection.propertyId,

                        formId:
                          inspection.formId,

                        /*
                         * Este parÃ¡metro indica a CaptureScreen que
                         * debe cargar y actualizar la inspecciÃ³n existente,
                         * no crear una nueva.
                         */
                        inspectionId:
                          inspection.id,
                      },
                    })
                  }
                >
                  Continuar captura
                </AppButton>
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

          <Text
            style={[
              styles.prototypeNotice,
              {
                color: colors.textMuted,
              },
            ]}
          >
            La inspecciÃ³n utiliza el modelo centralizado de UNIESAP y conserva
            su estado de sincronizaciÃ³n con Kobo.
          </Text>
        </ResponsiveContainer>
      </ScrollView>
    </Screen>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  INFO ROW                                  */
/* -------------------------------------------------------------------------- */

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
        label: "Sincronizada con Kobo",

        description:
          "La inspecciÃ³n fue enviada correctamente y tiene una referencia Kobo asociada.",

        color: colors.success,
      };

    case "syncing":
      return {
        label: "Sincronizando con Kobo",

        description:
          "UNIESAP estÃ¡ enviando actualmente esta inspecciÃ³n al servicio Kobo.",

        color: colors.primary,
      };

    case "pending":
      return {
        label: "Pendiente de sincronizaciÃ³n",

        description:
          "La inspecciÃ³n estÃ¡ guardada en UNIESAP y espera completar su sincronizaciÃ³n.",

        color: colors.warning,
      };

    case "error":
      return {
        label: "Error de sincronizaciÃ³n",

        description:
          "La inspecciÃ³n permanece guardada en UNIESAP y puede volver a intentarse.",

        color: colors.error,
      };

    case "local":
    default:
      return {
        label: "Guardada localmente",

        description:
          "La inspecciÃ³n estÃ¡ almacenada en UNIESAP y todavÃ­a no tiene una submission Kobo.",

        color: colors.textMuted,
      };
  }
}

function formatResponseValue(value: string | number | boolean | null) {
  if (value === null) {
    return "Sin respuesta";
  }

  if (typeof value === "boolean") {
    return value ? "SÃ­" : "No";
  }

  return String(value);
}

function getQuestionTypeLabel(
  type: "text" | "textarea" | "number" | "boolean" | "select" | "photo",
) {
  switch (type) {
    case "text":
      return "Texto";

    case "textarea":
      return "Texto largo";

    case "number":
      return "NÃºmero";

    case "boolean":
      return "SÃ­ / No";

    case "select":
      return "SelecciÃ³n";

    case "photo":
      return "FotografÃ­a";

    default:
      return type;
  }
}

/*
 * Funciona tanto con:
 *
 * 2026-08-20
 *
 * como con:
 *
 * 2026-08-20T20:15:42.000Z
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

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",

    hour: "2-digit",

    minute: "2-digit",
  });
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "OcurriÃ³ un error desconocido.";
}

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
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

  /* BADGES */

  badges: {
    flexDirection: "row",

    flexWrap: "wrap",

    gap: Spacing.sm,

    marginBottom: Spacing.xl,
  },

  statusBadge: {
    alignSelf: "flex-start",

    paddingHorizontal: Spacing.md,

    paddingVertical: Spacing.sm,

    borderRadius: Radius.full,
  },

  statusText: {
    fontSize: FontSize.caption,

    fontWeight: "700",
  },

  /* TOP */

  topContent: {
    width: "100%",

    gap: Spacing.xl,

    marginBottom: Spacing.xl,
  },

  topContentDesktop: {
    flexDirection: "row",

    alignItems: "flex-start",
  },

  topColumn: {
    width: "100%",
  },

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

  /* SYNC */

  syncHeader: {
    flexDirection: "row",

    alignItems: "flex-start",
  },

  syncIcon: {
    width: 44,

    height: 44,

    flexShrink: 0,

    borderRadius: Radius.full,

    alignItems: "center",

    justifyContent: "center",

    marginRight: Spacing.md,
  },

  syncDot: {
    width: 12,

    height: 12,

    borderRadius: Radius.full,
  },

  syncHeaderInfo: {
    flex: 1,

    minWidth: 0,
  },

  syncTitle: {
    fontSize: FontSize.body,

    fontWeight: "700",

    marginBottom: Spacing.xs,
  },

  syncDescription: {
    fontSize: FontSize.small,

    lineHeight: 20,
  },

  errorLabel: {
    fontSize: FontSize.caption,

    fontWeight: "700",

    marginBottom: Spacing.xs,
  },

  errorText: {
    fontSize: FontSize.small,

    lineHeight: 20,
  },

  retryError: {
    fontSize: FontSize.small,

    lineHeight: 20,

    marginTop: Spacing.md,
  },

  retryAction: {
    marginTop: Spacing.lg,
  },

  /* RESPONSES */

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

  /* EVIDENCE */

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

  /* ACTIONS */

  actions: {
    flexDirection: "row",

    flexWrap: "wrap",

    gap: Spacing.sm,
  },

  actionButton: {
    flexGrow: 1,

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

