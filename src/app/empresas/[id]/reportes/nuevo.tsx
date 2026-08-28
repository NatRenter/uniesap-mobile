import { useState } from "react";

import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import { router, useLocalSearchParams } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { ResponsiveContainer } from "@/components/ui/ResponsiveContainer";
import { ResponsiveGrid } from "@/components/ui/ResponsiveGrid";
import { Screen } from "@/components/ui/Screen";

import { getFormById } from "@/repositories/formRepository";

import { getCompanyById } from "@/repositories/companyRepository";

import { getEvidencesByInspectionId } from "@/repositories/evidenceRepository";

import {
  getInspectionById,
  getInspectionsByCompanyId,
} from "@/repositories/inspectionRepository";

import { getPropertyById } from "@/repositories/propertyRepository";

/*
 * ReportRepository será la fuente real de los reportes.
 *
 * Android / iOS → SQLite
 * Web           → localStorage
 */
import { createReport } from "@/repositories/reportRepository";

import { FontSize, Radius, Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";
import { useResponsive } from "@/hooks/useResponsive";

/*
 * Formatos disponibles actualmente.
 *
 * Más adelante estos formatos se conectarán
 * con sus respectivos generadores físicos.
 */
type ReportFormatOption = "excel" | "pdf";

/*
 * ============================================================================
 * NUEVO REPORTE
 * ============================================================================
 *
 * Esta pantalla permite:
 *
 * 1. Seleccionar una inspección.
 * 2. Seleccionar Excel o PDF.
 * 3. Elegir si se incluyen evidencias.
 * 4. Crear un registro Report persistente.
 *
 * Todavía NO genera físicamente:
 *
 * - un archivo Excel;
 * - un archivo PDF.
 *
 * El reporte comienza con:
 *
 * status = "pending"
 *
 * y posteriormente un servicio de generación
 * podrá cambiarlo a:
 *
 * status = "generated"
 */
export default function NewReportScreen() {
  const { colors } = useAppTheme();

  /*
   * useResponsive nos permite adaptar
   * ciertas zonas específicas de la pantalla.
   *
   * Teléfono:
   * configuración y resumen verticales.
   *
   * Tablet / Web:
   * configuración y resumen en columnas.
   */
  const { isPhone } = useResponsive();

  /*
   * ==========================================================================
   * PARÁMETROS DE LA RUTA
   * ==========================================================================
   *
   * id:
   * empresa actual.
   *
   * inspectionId:
   * opcional.
   *
   * Puede recibirse cuando el usuario entra
   * directamente desde una inspección.
   */
  const { id, inspectionId: routeInspectionId } = useLocalSearchParams<{
    id: string;
    inspectionId?: string;
  }>();

  /*
   * ==========================================================================
   * EMPRESA
   * ==========================================================================
   *
   * CompanyRepository ya está conectado a:
   *
   * Android / iOS → SQLite
   * Web           → localStorage
   */
  const company = getCompanyById(id);

  /*
   * Recuperamos solamente las inspecciones
   * pertenecientes a esta empresa.
   *
   * Si la empresa no existe usamos un arreglo vacío
   * hasta terminar de ejecutar todos los Hooks.
   */
  const companyInspections = company
    ? getInspectionsByCompanyId(company.id)
    : [];

  /*
   * ==========================================================================
   * INSPECCIÓN INICIAL
   * ==========================================================================
   *
   * Si recibimos inspectionId desde la ruta
   * y existe realmente, la seleccionamos.
   *
   * En caso contrario usamos la primera inspección
   * disponible de la empresa.
   */
  const initialInspectionId =
    routeInspectionId && getInspectionById(routeInspectionId)
      ? routeInspectionId
      : companyInspections[0]?.id;

  /*
   * ==========================================================================
   * ESTADO
   * ==========================================================================
   */

  /*
   * Inspección actualmente seleccionada.
   */
  const [selectedInspectionId, setSelectedInspectionId] = useState<
    string | undefined
  >(initialInspectionId);

  /*
   * Formato que tendrá el reporte.
   *
   * Todavía representa únicamente la configuración
   * del futuro archivo físico.
   */
  const [selectedFormat, setSelectedFormat] =
    useState<ReportFormatOption>("excel");

  /*
   * Define si el reporte deberá considerar
   * las evidencias de la inspección.
   */
  const [includeEvidence, setIncludeEvidence] = useState(true);

  /*
   * ==========================================================================
   * ESTADO DE CREACIÓN DEL REPORTE
   * ==========================================================================
   *
   * Evita que varios clics consecutivos
   * generen varios registros iguales.
   */
  const [isGenerating, setIsGenerating] = useState(false);

  /*
   * Guarda un mensaje cuando ocurre un error
   * al persistir el nuevo reporte.
   */
  const [generationError, setGenerationError] = useState<string | null>(null);

  /*
   * ==========================================================================
   * DATOS DERIVADOS
   * ==========================================================================
   */

  /*
   * Recupera la inspección seleccionada.
   */
  const selectedInspection = selectedInspectionId
    ? getInspectionById(selectedInspectionId)
    : undefined;

  /*
   * Inspection
   *     ↓
   * Property
   *
   * Recuperamos el inmueble asociado.
   */
  const selectedProperty = selectedInspection
    ? getPropertyById(selectedInspection.propertyId)
    : undefined;

  /*
   * Inspection
   *     ↓
   * Form
   *
   * El formulario sigue siendo configuración estática
   * dentro de src/data/forms.ts por ahora.
   */
  const selectedForm = selectedInspection
    ? getFormById(selectedInspection.formId)
    : undefined;

  /*
   * Inspection
   *     ↓
   * Evidences
   *
   * Estas evidencias ya provienen del
   * EvidenceRepository persistente.
   */
  const selectedEvidences = selectedInspection
    ? getEvidencesByInspectionId(selectedInspection.id)
    : [];

  /*
   * ==========================================================================
   * TÍTULO DEL REPORTE
   * ==========================================================================
   *
   * Por ahora se deriva automáticamente
   * del formulario seleccionado.
   */
  const reportTitle = selectedForm
    ? `Reporte de ${selectedForm.title}`
    : "Nuevo reporte";

  /*
   * Todos los Hooks anteriores ya fueron ejecutados.
   *
   * Ahora sí podemos hacer una salida condicional
   * sin romper las reglas de React Hooks.
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
   * ==========================================================================
   * CREAR REPORTE
   * ==========================================================================
   *
   * Este proceso ahora SÍ crea un registro persistente.
   *
   * Flujo:
   *
   * Pantalla
   *    ↓
   * createReport()
   *    ↓
   * ReportRepository
   *    ↓
   * PersistenceAdapter
   *    ↓
   * SQLite / localStorage
   *
   * IMPORTANTE:
   *
   * Todavía no se crea físicamente Excel/PDF.
   */
  const handleGenerate = async () => {
    /*
     * Validamos los datos mínimos.
     */
    if (!selectedInspection || !selectedProperty) {
      setGenerationError(
        "No fue posible determinar la inspección o el inmueble del reporte.",
      );

      return;
    }

    /*
     * Evita crear varios reportes
     * mientras el primero sigue guardándose.
     */
    if (isGenerating) {
      return;
    }

    /*
     * Activamos estado de guardado.
     */
    setIsGenerating(true);

    /*
     * Limpiamos cualquier error anterior.
     */
    setGenerationError(null);

    try {
      /*
       * Creamos el registro real del reporte.
       *
       * El repository se encarga de:
       *
       * 1. crear el ID;
       * 2. agregarlo a memoria;
       * 3. persistirlo;
       * 4. hacer rollback si ocurre un error.
       */
      const report = await createReport({
        /*
         * Usamos company.id y no directamente
         * el parámetro recibido en la URL.
         *
         * Así guardamos siempre el ID real actual.
         */
        companyId: company.id,

        /*
         * Inmueble asociado a la inspección.
         */
        propertyId: selectedProperty.id,

        /*
         * Inspección que alimentará el reporte.
         */
        inspectionId: selectedInspection.id,

        /*
         * Nombre visible del reporte.
         */
        title: reportTitle,

        /*
         * Excel o PDF.
         */
        format: selectedFormat,

        /*
         * Configuración de evidencias.
         */
        includeEvidence,

        /*
         * El archivo todavía no existe.
         *
         * Por eso comenzamos como pending.
         */
        status: "pending",
      });

      /*
       * =========================================================================
       * NAVEGACIÓN DESPUÉS DEL GUARDADO
       * =========================================================================
       *
       * El reporte ya quedó persistido.
       *
       * Abrimos directamente su detalle
       * usando el ID recién creado.
       */
      router.replace({
        pathname: "/empresas/[id]/reportes/[reportId]",

        params: {
          id: company.id,
          reportId: report.id,
        },
      });
    } catch (error) {
      /*
       * Registramos el error completo en consola
       * para las herramientas de desarrollo.
       */
      console.error("Error al crear el reporte:", error);

      /*
       * Mensaje corto para el usuario.
       */
      setGenerationError(
        error instanceof Error
          ? error.message
          : "Ocurrió un error inesperado al crear el reporte.",
      );
    } finally {
      /*
       * Siempre liberamos el estado,
       * tanto en éxito como en error.
       */
      setIsGenerating(false);
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

          <Pressable
            onPress={() =>
              router.navigate({
                pathname: "/empresas/[id]/reportes",

                params: {
                  id: company.id,
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
              ‹ Reportes
            </Text>
          </Pressable>

          {/* ============================================================ */}
          {/* EMPRESA                                                      */}
          {/* ============================================================ */}

          <Text
            style={[
              styles.overline,
              {
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
              styles.title,
              {
                color: colors.text,
              },
            ]}
          >
            Generar reporte
          </Text>

          <Text
            style={[
              styles.subtitle,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            Selecciona la inspección y configura el contenido del reporte.
          </Text>

          {/* ============================================================ */}
          {/* SELECCIÓN DE INSPECCIÓN                                      */}
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
              1. Seleccionar inspección
            </Text>

            <Text
              style={[
                styles.sectionDescription,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              El reporte se construirá a partir de la información capturada en
              una inspección.
            </Text>

            {/*
             * ResponsiveGrid adapta las tarjetas:
             *
             * Teléfono → 1 columna
             * Tablet   → 2 columnas
             * Web      → 2 columnas
             *
             * Utilizamos dos columnas en escritorio
             * porque las tarjetas contienen bastante información.
             */}
            <ResponsiveGrid
              phoneColumns={1}
              tabletColumns={2}
              desktopColumns={2}
              gap={Spacing.sm}
            >
              {companyInspections.map((inspection) => {
                /*
                 * Inmueble de esta inspección.
                 */
                const property = getPropertyById(inspection.propertyId);

                /*
                 * Formulario utilizado en la inspección.
                 */
                const form = getFormById(inspection.formId);

                /*
                 * Indica si la tarjeta está seleccionada.
                 */
                const selected = inspection.id === selectedInspectionId;

                return (
                  <InspectionOption
                    key={inspection.id}
                    title={form?.title ?? "Formulario no disponible"}
                    property={property?.name ?? "Inmueble no disponible"}
                    date={inspection.date}
                    status={inspection.status}
                    selected={selected}
                    onPress={() => {
                      /*
                       * Al cambiar de inspección también
                       * limpiamos errores anteriores.
                       */
                      setGenerationError(null);

                      setSelectedInspectionId(inspection.id);
                    }}
                  />
                );
              })}
            </ResponsiveGrid>

            {/* ========================================================== */}
            {/* SIN INSPECCIONES                                           */}
            {/* ========================================================== */}

            {companyInspections.length === 0 && (
              <AppCard>
                <Text
                  style={[
                    styles.emptyTitle,
                    {
                      color: colors.text,
                    },
                  ]}
                >
                  Sin inspecciones disponibles
                </Text>

                <Text
                  style={[
                    styles.emptyDescription,
                    {
                      color: colors.textSecondary,
                    },
                  ]}
                >
                  Esta empresa todavía no tiene inspecciones registradas.
                </Text>
              </AppCard>
            )}
          </View>

          {/* ============================================================ */}
          {/* CONFIGURACIÓN DEL REPORTE                                    */}
          {/* ============================================================ */}

          {selectedInspection && (
            <>
              <Text
                style={[
                  styles.configurationTitle,
                  {
                    color: colors.text,
                  },
                ]}
              >
                2. Configurar reporte
              </Text>

              {/*
               * Teléfono:
               *
               * Configuración
               * Resumen
               *
               * Tablet / Web:
               *
               * Configuración | Resumen
               */}
              <View
                style={[
                  styles.configurationLayout,
                  !isPhone && styles.configurationLayoutWide,
                ]}
              >
                {/* ====================================================== */}
                {/* CONFIGURACIÓN                                           */}
                {/* ====================================================== */}

                <View
                  style={[
                    styles.configurationColumn,

                    !isPhone && styles.configurationColumnWide,
                  ]}
                >
                  {/* ==================================================== */}
                  {/* FORMATO                                              */}
                  {/* ==================================================== */}

                  <View style={styles.configurationSection}>
                    <Text
                      style={[
                        styles.sectionTitle,
                        {
                          color: colors.text,
                        },
                      ]}
                    >
                      Formato
                    </Text>

                    <View style={styles.formatRow}>
                      <FormatOption
                        label="Excel"
                        description="Hoja de cálculo"
                        selected={selectedFormat === "excel"}
                        onPress={() => {
                          /*
                           * Cambiamos el formato
                           * y limpiamos errores anteriores.
                           */
                          setGenerationError(null);

                          setSelectedFormat("excel");
                        }}
                      />

                      <FormatOption
                        label="PDF"
                        description="Documento"
                        selected={selectedFormat === "pdf"}
                        onPress={() => {
                          setGenerationError(null);

                          setSelectedFormat("pdf");
                        }}
                      />
                    </View>
                  </View>

                  {/* ==================================================== */}
                  {/* CONTENIDO                                            */}
                  {/* ==================================================== */}

                  <View style={styles.configurationSection}>
                    <Text
                      style={[
                        styles.sectionTitle,
                        {
                          color: colors.text,
                        },
                      ]}
                    >
                      Contenido
                    </Text>

                    <AppCard>
                      <View style={styles.optionRow}>
                        <View style={styles.optionInfo}>
                          <Text
                            style={[
                              styles.optionTitle,
                              {
                                color: colors.text,
                              },
                            ]}
                          >
                            Incluir evidencias
                          </Text>

                          <Text
                            style={[
                              styles.optionDescription,
                              {
                                color: colors.textSecondary,
                              },
                            ]}
                          >
                            Agrega las fotografías y documentos relacionados con
                            la inspección.
                          </Text>

                          <Text
                            style={[
                              styles.evidenceCount,
                              {
                                color: colors.textMuted,
                              },
                            ]}
                          >
                            {selectedEvidences.length} evidencia
                            {selectedEvidences.length === 1 ? "" : "s"}{" "}
                            disponible
                            {selectedEvidences.length === 1 ? "" : "s"}
                          </Text>
                        </View>

                        <Switch
                          value={includeEvidence}
                          onValueChange={(value) => {
                            /*
                             * Actualizamos la configuración
                             * de evidencias del futuro reporte.
                             */
                            setGenerationError(null);

                            setIncludeEvidence(value);
                          }}
                        />
                      </View>
                    </AppCard>
                  </View>
                </View>

                {/* ====================================================== */}
                {/* RESUMEN                                                */}
                {/* ====================================================== */}

                <View
                  style={[
                    styles.summaryColumn,

                    !isPhone && styles.summaryColumnWide,
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
                    Resumen
                  </Text>

                  <AppCard style={styles.summaryCard}>
                    <InfoRow label="Empresa" value={company.name} />

                    <Divider />

                    <InfoRow
                      label="Inmueble"
                      value={selectedProperty?.name ?? "No disponible"}
                    />

                    <Divider />

                    <InfoRow
                      label="Inspección"
                      value={selectedForm?.title ?? "No disponible"}
                    />

                    <Divider />

                    <InfoRow label="Reporte" value={reportTitle} />

                    <Divider />

                    <InfoRow
                      label="Formato"
                      value={selectedFormat === "excel" ? "Excel" : "PDF"}
                    />

                    <Divider />

                    <InfoRow
                      label="Evidencias disponibles"
                      value={selectedEvidences.length.toString()}
                    />

                    <Divider />

                    <InfoRow
                      label="Incluir evidencias"
                      value={includeEvidence ? "Sí" : "No"}
                    />

                    <Divider />

                    {/*
                     * Los nuevos reportes nacen como pending.
                     *
                     * Posteriormente el generador físico
                     * cambiará este estado.
                     */}
                    <InfoRow label="Estado inicial" value="Pendiente" />
                  </AppCard>
                </View>
              </View>

              {/* ======================================================== */}
              {/* ERROR                                                    */}
              {/* ======================================================== */}

              {generationError && (
                <View
                  style={[
                    styles.generationError,

                    {
                      borderColor: colors.error,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.generationErrorText,

                      {
                        color: colors.error,
                      },
                    ]}
                  >
                    {generationError}
                  </Text>
                </View>
              )}

              {/* ======================================================== */}
              {/* ACCIONES                                                 */}
              {/* ======================================================== */}

              <View style={[styles.actions, !isPhone && styles.actionsWide]}>
                <View style={styles.actionButton}>
                  {/*
                   * No usamos disabled por ahora para no depender
                   * de una propiedad adicional de AppButton.
                   *
                   * handleGenerate ya bloquea internamente
                   * múltiples ejecuciones.
                   */}
                  <AppButton onPress={handleGenerate}>
                    {isGenerating ? "Guardando reporte..." : "Generar reporte"}
                  </AppButton>
                </View>

                <View style={styles.actionButton}>
                  <AppButton
                    variant="ghost"
                    onPress={() =>
                      router.navigate({
                        pathname: "/empresas/[id]/reportes",

                        params: {
                          id: company.id,
                        },
                      })
                    }
                  >
                    Cancelar
                  </AppButton>
                </View>
              </View>
            </>
          )}

          {/* ============================================================ */}
          {/* INFORMACIÓN DE LA ETAPA                                      */}
          {/* ============================================================ */}

          <Text
            style={[
              styles.prototypeNotice,
              {
                color: colors.textMuted,
              },
            ]}
          >
            El reporte se guarda en UNIESAP. La creación física del archivo
            Excel o PDF se integrará en la siguiente etapa.
          </Text>
        </ResponsiveContainer>
      </ScrollView>
    </Screen>
  );
}

/* -------------------------------------------------------------------------- */
/*                              INSPECTION OPTION                             */
/* -------------------------------------------------------------------------- */

/*
 * Tarjeta seleccionable de una inspección.
 *
 * No consulta datos directamente.
 *
 * La pantalla principal prepara toda
 * la información que necesita.
 */
function InspectionOption({
  title,
  property,
  date,
  status,
  selected,
  onPress,
}: {
  title: string;
  property: string;
  date: string;

  status: "draft" | "in_progress" | "completed";

  selected: boolean;

  onPress: () => void;
}) {
  const { colors } = useAppTheme();

  /*
   * Convertimos el estado técnico
   * a una etiqueta visible.
   */
  const statusLabel =
    status === "completed"
      ? "Finalizada"
      : status === "in_progress"
        ? "En proceso"
        : "Borrador";

  /*
   * Elegimos un color de acuerdo
   * con el estado de captura.
   */
  const statusColor =
    status === "completed"
      ? colors.success
      : status === "in_progress"
        ? colors.warning
        : colors.textMuted;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.inspectionOption,

        {
          backgroundColor: colors.surface,

          borderColor: selected ? colors.primary : colors.border,

          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      {/* ================================================================ */}
      {/* RADIO                                                            */}
      {/* ================================================================ */}

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
              styles.radioInner,

              {
                backgroundColor: colors.primary,
              },
            ]}
          />
        )}
      </View>

      {/* ================================================================ */}
      {/* INFORMACIÓN                                                      */}
      {/* ================================================================ */}

      <View style={styles.inspectionInfo}>
        <Text
          style={[
            styles.inspectionTitle,

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
            styles.inspectionProperty,

            {
              color: colors.textSecondary,
            },
          ]}
          numberOfLines={2}
        >
          {property}
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

      {/* ================================================================ */}
      {/* ESTADO                                                           */}
      {/* ================================================================ */}

      <Text
        style={[
          styles.inspectionStatus,

          {
            color: statusColor,
          },
        ]}
      >
        {statusLabel}
      </Text>
    </Pressable>
  );
}

/* -------------------------------------------------------------------------- */
/*                                FORMAT OPTION                               */
/* -------------------------------------------------------------------------- */

/*
 * Opción reutilizable para seleccionar
 * Excel o PDF.
 */
function FormatOption({
  label,
  description,
  selected,
  onPress,
}: {
  label: string;
  description: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.formatOption,

        {
          backgroundColor: selected ? colors.primarySoft : colors.surface,

          borderColor: selected ? colors.primary : colors.border,

          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      <Text
        style={[
          styles.formatLabel,

          {
            color: selected ? colors.primary : colors.text,
          },
        ]}
      >
        {label}
      </Text>

      <Text
        style={[
          styles.formatDescription,

          {
            color: colors.textSecondary,
          },
        ]}
      >
        {description}
      </Text>

      <Text
        style={[
          styles.formatSelection,

          {
            color: selected ? colors.primary : colors.textMuted,
          },
        ]}
      >
        {selected ? "● Seleccionado" : "○ Seleccionar"}
      </Text>
    </Pressable>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  INFO ROW                                  */
/* -------------------------------------------------------------------------- */

/*
 * Fila sencilla utilizada en el resumen.
 */
function InfoRow({ label, value }: { label: string; value: string }) {
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

/*
 * Separador visual compatible
 * con modo claro y oscuro.
 */
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
 * ============================================================================
 * FORMATEAR FECHA
 * ============================================================================
 *
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
  /*
   * Si existe hora tomamos solamente
   * la parte correspondiente a la fecha.
   */
  const normalized = date.includes("T") ? date.split("T")[0] : date;

  const parts = normalized.split("-");

  /*
   * Si el formato no coincide,
   * devolvemos el valor original.
   */
  if (parts.length !== 3) {
    return date;
  }

  const [year, month, day] = parts;

  /*
   * year se utiliza aquí para construir
   * el formato DD/MM/YYYY.
   */
  return `${day}/${month}/${year}`;
}

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

/*
 * ============================================================================
 * ESTILOS
 * ============================================================================
 *
 * ResponsiveContainer controla:
 *
 * - ancho máximo;
 * - centrado;
 * - padding horizontal;
 * - espacio superior.
 *
 * Los estilos siguientes complementan
 * ese comportamiento para teléfono,
 * tablet y Web.
 */
const styles = StyleSheet.create({
  /*
   * Espacio inferior para que el contenido
   * no termine pegado a la navegación global.
   */
  scrollContent: {
    paddingBottom: Spacing.xxxl,
  },

  /*
   * Botón contextual para regresar
   * al historial de reportes.
   */
  backText: {
    fontSize: FontSize.small,

    fontWeight: "600",

    marginBottom: Spacing.lg,
  },

  /*
   * Nombre de la empresa.
   */
  overline: {
    fontSize: FontSize.caption,

    fontWeight: "700",

    letterSpacing: 1,

    marginBottom: Spacing.sm,
  },

  /*
   * Título principal.
   */
  title: {
    fontSize: FontSize.h1,

    fontWeight: "700",

    marginBottom: Spacing.sm,
  },

  /*
   * Descripción principal.
   */
  subtitle: {
    fontSize: FontSize.body,

    lineHeight: 24,

    marginBottom: Spacing.xl,
  },

  /*
   * Agrupa cada sección
   * principal de la pantalla.
   */
  section: {
    marginBottom: Spacing.xl,
  },

  /*
   * Títulos secundarios.
   */
  sectionTitle: {
    fontSize: FontSize.cardTitle,

    fontWeight: "700",

    marginBottom: Spacing.sm,
  },

  /*
   * Descripción que acompaña
   * a cada sección.
   */
  sectionDescription: {
    fontSize: FontSize.small,

    lineHeight: 20,

    marginBottom: Spacing.md,
  },

  /*
   * ==========================================================================
   * TARJETA DE INSPECCIÓN
   * ==========================================================================
   *
   * ResponsiveGrid controla su ancho.
   */
  inspectionOption: {
    width: "100%",

    minHeight: 104,

    flexDirection: "row",

    alignItems: "center",

    borderWidth: 1,

    borderRadius: Radius.lg,

    padding: Spacing.md,
  },

  /*
   * Indicador circular de selección.
   */
  radio: {
    width: 22,

    height: 22,

    borderRadius: Radius.full,

    borderWidth: 2,

    alignItems: "center",

    justifyContent: "center",

    marginRight: Spacing.md,
  },

  /*
   * Centro del indicador seleccionado.
   */
  radioInner: {
    width: 10,

    height: 10,

    borderRadius: Radius.full,
  },

  /*
   * Información de la inspección.
   */
  inspectionInfo: {
    flex: 1,

    /*
     * Evita desbordamientos
     * con textos largos.
     */
    minWidth: 0,
  },

  inspectionTitle: {
    fontSize: FontSize.body,

    fontWeight: "700",

    marginBottom: Spacing.xs,
  },

  inspectionProperty: {
    fontSize: FontSize.caption,

    lineHeight: 18,

    marginBottom: Spacing.xs,
  },

  inspectionDate: {
    fontSize: FontSize.caption,
  },

  inspectionStatus: {
    flexShrink: 0,

    fontSize: FontSize.caption,

    fontWeight: "700",

    marginLeft: Spacing.md,
  },

  /*
   * ==========================================================================
   * CONFIGURACIÓN
   * ==========================================================================
   */

  configurationTitle: {
    fontSize: FontSize.h2,

    fontWeight: "700",

    marginBottom: Spacing.lg,
  },

  /*
   * Teléfono:
   *
   * configuración
   * resumen
   */
  configurationLayout: {
    width: "100%",

    gap: Spacing.xl,
  },

  /*
   * Tablet / Web:
   *
   * configuración | resumen
   */
  configurationLayoutWide: {
    flexDirection: "row",

    alignItems: "flex-start",
  },

  configurationColumn: {
    width: "100%",
  },

  configurationColumnWide: {
    flex: 3,

    width: "auto",

    minWidth: 0,
  },

  summaryColumn: {
    width: "100%",
  },

  summaryColumnWide: {
    flex: 2,

    width: "auto",

    minWidth: 0,
  },

  configurationSection: {
    marginBottom: Spacing.xl,
  },

  /*
   * Excel y PDF se muestran
   * uno junto al otro.
   */
  formatRow: {
    flexDirection: "row",

    gap: Spacing.sm,
  },

  /*
   * Tarjeta individual
   * para seleccionar formato.
   */
  formatOption: {
    flex: 1,

    minWidth: 0,

    borderWidth: 1,

    borderRadius: Radius.lg,

    padding: Spacing.md,
  },

  formatLabel: {
    fontSize: FontSize.body,

    fontWeight: "700",

    marginBottom: Spacing.xs,
  },

  formatDescription: {
    fontSize: FontSize.caption,

    marginBottom: Spacing.md,
  },

  formatSelection: {
    fontSize: FontSize.caption,

    fontWeight: "600",
  },

  /*
   * Configuración de evidencias.
   */
  optionRow: {
    flexDirection: "row",

    alignItems: "center",
  },

  optionInfo: {
    flex: 1,

    minWidth: 0,

    marginRight: Spacing.md,
  },

  optionTitle: {
    fontSize: FontSize.body,

    fontWeight: "700",

    marginBottom: Spacing.xs,
  },

  optionDescription: {
    fontSize: FontSize.caption,

    lineHeight: 19,
  },

  evidenceCount: {
    fontSize: FontSize.caption,

    fontWeight: "600",

    marginTop: Spacing.sm,
  },

  /*
   * ==========================================================================
   * RESUMEN
   * ==========================================================================
   */

  summaryCard: {
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

  /*
   * ==========================================================================
   * ERROR DE CREACIÓN
   * ==========================================================================
   *
   * Se muestra únicamente si falla
   * createReport().
   */
  generationError: {
    width: "100%",

    borderWidth: 1,

    borderRadius: Radius.md,

    padding: Spacing.md,

    marginTop: Spacing.lg,
  },

  generationErrorText: {
    fontSize: FontSize.small,

    lineHeight: 20,

    fontWeight: "600",
  },

  /*
   * ==========================================================================
   * ACCIONES
   * ==========================================================================
   *
   * Teléfono:
   * botones verticales.
   */
  actions: {
    gap: Spacing.sm,

    marginTop: Spacing.xl,
  },

  /*
   * Tablet / Web:
   * botones horizontales.
   */
  actionsWide: {
    flexDirection: "row",

    justifyContent: "flex-end",
  },

  actionButton: {
    minWidth: 200,
  },

  /*
   * Aviso temporal.
   *
   * Deja claro que el registro del Report
   * ya es real pero el archivo físico
   * todavía no se genera.
   */
  prototypeNotice: {
    fontSize: FontSize.caption,

    lineHeight: 18,

    textAlign: "center",

    marginTop: Spacing.lg,
  },

  /*
   * ==========================================================================
   * ESTADO VACÍO
   * ==========================================================================
   */

  emptyTitle: {
    fontSize: FontSize.body,

    fontWeight: "700",

    marginBottom: Spacing.sm,
  },

  emptyDescription: {
    fontSize: FontSize.small,

    lineHeight: 20,
  },

  /*
   * ==========================================================================
   * NO ENCONTRADO
   * ==========================================================================
   */

  notFound: {
    flex: 1,

    justifyContent: "center",
  },

  notFoundTitle: {
    fontSize: FontSize.h2,

    fontWeight: "700",
  },
});
