import { useState } from "react";

import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { router, useLocalSearchParams } from "expo-router";

import { ContextHeader } from "@/components/navigation/ContextHeader";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { ResponsiveContainer } from "@/components/ui/ResponsiveContainer";
import { ResponsiveGrid } from "@/components/ui/ResponsiveGrid";
import { Screen } from "@/components/ui/Screen";

import { getForms } from "@/repositories/formRepository";

import { getCompanyById } from "@/repositories/companyRepository";

import {
  getPropertyById,
  updateProperty,
} from "@/repositories/propertyRepository";

import { FontSize, Radius, Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

import type { FormDefinition } from "@/types/form";

/*
 * ============================================================================
 * ADMINISTRAR FORMULARIOS DEL INMUEBLE
 * ============================================================================
 *
 * Esta pantalla permite definir qué formularios estarán disponibles
 * dentro de un inmueble determinado.
 *
 * ARQUITECTURA ACTUAL
 * -------------------
 *
 * La interfaz trabaja con Property.formIds como una representación
 * cómoda de las relaciones existentes entre un inmueble y sus formularios.
 *
 * Sin embargo, Property.formIds NO representa una columna JSON dentro
 * de la tabla properties.
 *
 * La fuente persistente de estas relaciones es:
 *
 * property_forms
 *
 * Flujo de escritura:
 *
 * Usuario
 *   ↓
 * selectedFormIds
 *   ↓
 * updateProperty()
 *   ↓
 * PropertyRepository
 *   ↓
 * PropertyDatabase
 *   ↓
 * property_forms
 *
 * Flujo de lectura:
 *
 * property_forms
 *   ↓
 * PropertyDatabase
 *   ↓
 * PropertyRepository
 *   ↓
 * Property.formIds
 *   ↓
 * UI
 *
 * IMPORTANTE:
 *
 * Property.formIds continúa existiendo en el modelo de dominio porque
 * simplifica considerablemente el consumo de las relaciones desde las
 * pantallas.
 *
 * La persistencia normalizada, sin embargo, pertenece exclusivamente
 * a property_forms.
 */
export default function PropertyFormsScreen() {
  const { colors } = useAppTheme();

  /*
   * ==========================================================================
   * PARÁMETROS DE RUTA
   * ==========================================================================
   *
   * Ruta:
   *
   * /empresas/[id]/inmuebles/[propertyId]/formularios
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
   * Recuperamos todos los formularios registrados.
   *
   * Aquí NO utilizamos getFormsByIds()
   * porque necesitamos mostrar:
   *
   * - asignados;
   * - no asignados;
   * - activos;
   * - inactivos.
   */
  const availableForms = getForms();

  /*
   * ==========================================================================
   * ESTADO DE SELECCIÓN
   * ==========================================================================
   *
   * Tomamos una copia de Property.formIds.
   *
   * Nunca modificamos directamente el objeto
   * almacenado en PropertyRepository.
   */
  const [selectedFormIds, setSelectedFormIds] = useState<string[]>(() => [
    ...(property?.formIds ?? []),
  ]);

  /*
   * Evita múltiples guardados consecutivos.
   */
  const [isSaving, setIsSaving] = useState(false);

  /*
   * Mensaje de error visible.
   */
  const [saveError, setSaveError] = useState<string | null>(null);

  /*
   * ==========================================================================
   * VALIDACIÓN DE RUTA
   * ==========================================================================
   *
   * Además de comprobar existencia, verificamos que
   * el inmueble realmente pertenezca a la empresa indicada.
   */
  const validContext = Boolean(
    company && property && property.companyId === company.id,
  );

  if (!company || !property || !validContext) {
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
            No fue posible encontrar el inmueble o no pertenece a la empresa
            actual.
          </Text>
        </View>
      </Screen>
    );
  }

  /*
   * ==========================================================================
   * CAMBIOS PENDIENTES
   * ==========================================================================
   *
   * Comparamos ambos arreglos como conjuntos ordenados.
   *
   * Esto nos permite saber si realmente existe
   * algo que guardar.
   */
  const hasChanges = !haveSameIds(property.formIds, selectedFormIds);

  /*
   * ==========================================================================
   * SELECCIONAR / DESELECCIONAR FORMULARIO
   * ==========================================================================
   */
  const toggleForm = (form: FormDefinition) => {
    /*
     * Los formularios inactivos se muestran
     * pero no permitimos asignarlos.
     *
     * Si ya estaba asignado históricamente
     * tampoco lo modificamos desde aquí.
     */
    if (form.status !== "active") {
      return;
    }

    setSaveError(null);

    setSelectedFormIds((current) => {
      /*
       * Si ya existe, lo retiramos.
       */
      if (current.includes(form.id)) {
        return current.filter((formId) => formId !== form.id);
      }

      /*
       * Si no existe, lo agregamos.
       */
      return [...current, form.id];
    });
  };

  /*
   * ==========================================================================
   * GUARDAR CAMBIOS
   * ==========================================================================
   */
  const handleSave = async () => {
    /*
     * Evitamos guardados duplicados.
     */
    if (isSaving) {
      return;
    }

    /*
     * Si no cambió nada, simplemente regresamos.
     */
    if (!hasChanges) {
      router.back();

      return;
    }

    setIsSaving(true);

    setSaveError(null);

    try {
      /*
       * updateProperty() recibe Property.formIds como parte
       * del modelo de dominio.
       *
       * El flujo interno actual es:
       *
       * selectedFormIds
       *        ↓
       * updateProperty()
       *        ↓
       * PropertyRepository
       *        ↓
       * PropertyDatabase
       *        ↓
       * property_forms
       *
       * Property.formIds se mantiene en memoria como una
       * proyección de las relaciones persistidas en property_forms.
       *
       * Ya no existe una segunda representación JSON dentro
       * de la tabla properties.
       */
      const updated = await updateProperty(
        property.id,

        {
          formIds: selectedFormIds,
        },
      );

      /*
       * Si el inmueble desapareció de memoria
       * durante la operación, consideramos
       * que el guardado no pudo completarse.
       */
      if (!updated) {
        throw new Error("No fue posible actualizar el inmueble.");
      }

      /*
       * Regresamos al detalle.
       *
       * La pantalla volverá a leer PropertyRepository,
       * donde ya están los formIds actualizados.
       */
      router.replace({
        pathname: "/empresas/[id]/inmuebles/[propertyId]",

        params: {
          id: company.id,

          propertyId: property.id,
        },
      });
    } catch (error) {
      console.error("Error actualizando formularios del inmueble:", error);

      setSaveError(
        error instanceof Error
          ? error.message
          : "Ocurrió un error inesperado al guardar los formularios.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  /*
   * ==========================================================================
   * CANCELAR
   * ==========================================================================
   */
  const handleCancel = () => {
    router.back();
  };

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
            backLabel="Inmueble"
            onBack={() =>
              router.navigate({
                pathname: "/empresas/[id]/inmuebles/[propertyId]",

                params: {
                  id: company.id,

                  propertyId: property.id,
                },
              })
            }
            contextLabel={company.name}
            contextColor={company.branding.primaryColor}
            title="Administrar formularios"
            subtitle={property.name}
          />

          {/* ============================================================ */}
          {/* INTRODUCCIÓN                                                  */}
          {/* ============================================================ */}

          <View style={styles.introduction}>
            <Text
              style={[
                styles.introductionTitle,

                {
                  color: colors.text,
                },
              ]}
            >
              Formularios disponibles
            </Text>

            <Text
              style={[
                styles.introductionDescription,

                {
                  color: colors.textSecondary,
                },
              ]}
            >
              Selecciona los formularios que podrán utilizarse para nuevas
              inspecciones dentro de este inmueble.
            </Text>
          </View>

          {/* ============================================================ */}
          {/* RESUMEN                                                       */}
          {/* ============================================================ */}

          <ResponsiveGrid
            phoneColumns={2}
            tabletColumns={2}
            desktopColumns={2}
            gap={Spacing.sm}
          >
            <SummaryCard
              label="Disponibles"
              value={
                availableForms.filter((form) => form.status === "active").length
              }
            />

            <SummaryCard
              label="Asignados"
              value={selectedFormIds.length}
              highlight
            />
          </ResponsiveGrid>

          {/* ============================================================ */}
          {/* LISTA DE FORMULARIOS                                          */}
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
              Selección
            </Text>

            <Text
              style={[
                styles.sectionDescription,

                {
                  color: colors.textSecondary,
                },
              ]}
            >
              Los cambios se aplicarán únicamente a {property.name}.
            </Text>

            <ResponsiveGrid
              phoneColumns={1}
              tabletColumns={2}
              desktopColumns={2}
              gap={Spacing.md}
            >
              {availableForms.map((form) => {
                const selected = selectedFormIds.includes(form.id);

                return (
                  <SelectableFormCard
                    key={form.id}
                    form={form}
                    selected={selected}
                    onPress={() => toggleForm(form)}
                  />
                );
              })}
            </ResponsiveGrid>

            {availableForms.length === 0 && (
              <AppCard>
                <Text
                  style={[
                    styles.emptyTitle,

                    {
                      color: colors.text,
                    },
                  ]}
                >
                  Sin formularios
                </Text>

                <Text
                  style={[
                    styles.emptyDescription,

                    {
                      color: colors.textSecondary,
                    },
                  ]}
                >
                  Todavía no existen formularios registrados en UNIESAP.
                </Text>
              </AppCard>
            )}
          </View>

          {/* ============================================================ */}
          {/* CAMBIOS PENDIENTES                                            */}
          {/* ============================================================ */}

          <AppCard style={styles.statusCard}>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusIndicator,

                  {
                    backgroundColor: hasChanges
                      ? colors.warning
                      : colors.success,
                  },
                ]}
              />

              <View style={styles.statusInformation}>
                <Text
                  style={[
                    styles.statusTitle,

                    {
                      color: colors.text,
                    },
                  ]}
                >
                  {hasChanges ? "Cambios pendientes" : "Configuración guardada"}
                </Text>

                <Text
                  style={[
                    styles.statusDescription,

                    {
                      color: colors.textSecondary,
                    },
                  ]}
                >
                  {hasChanges
                    ? "Guarda para aplicar las nuevas asignaciones al inmueble."
                    : "La selección coincide con la configuración actual."}
                </Text>
              </View>
            </View>
          </AppCard>

          {/* ============================================================ */}
          {/* ERROR                                                         */}
          {/* ============================================================ */}

          {saveError && (
            <View
              style={[
                styles.errorCard,

                {
                  borderColor: colors.error,
                },
              ]}
            >
              <Text
                style={[
                  styles.errorText,

                  {
                    color: colors.error,
                  },
                ]}
              >
                {saveError}
              </Text>
            </View>
          )}

          {/* ============================================================ */}
          {/* ACCIONES                                                      */}
          {/* ============================================================ */}

          <View style={styles.actions}>
            <View style={styles.actionButton}>
              <AppButton variant="ghost" onPress={handleCancel}>
                Cancelar
              </AppButton>
            </View>

            <View style={styles.actionButton}>
              <AppButton onPress={handleSave}>
                {isSaving
                  ? "Guardando..."
                  : hasChanges
                    ? "Guardar cambios"
                    : "Volver"}
              </AppButton>
            </View>
          </View>

          {/* ============================================================ */}
          {/* INFORMACIÓN TÉCNICA                                           */}
          {/* ============================================================ */}

          <Text
            style={[
              styles.technicalNotice,

              {
                color: colors.textMuted,
              },
            ]}
          >
            Las asignaciones se almacenan localmente y permanecen disponibles
            después de reiniciar la aplicación.
          </Text>
        </ResponsiveContainer>
      </ScrollView>
    </Screen>
  );
}

/*
 * ============================================================================
 * TARJETA SELECCIONABLE
 * ============================================================================
 */
function SelectableFormCard({
  form,
  selected,
  onPress,
}: {
  form: FormDefinition;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();

  const disabled = form.status !== "active";

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.formCard,

        {
          backgroundColor: selected ? colors.primarySoft : colors.surface,

          borderColor: selected ? colors.primary : colors.border,

          opacity: disabled ? 0.5 : pressed ? 0.72 : 1,
        },
      ]}
    >
      {/* ================================================================ */}
      {/* SELECTOR                                                         */}
      {/* ================================================================ */}

      <View
        style={[
          styles.checkbox,

          {
            borderColor: selected ? colors.primary : colors.border,

            backgroundColor: selected ? colors.primary : colors.surface,
          },
        ]}
      >
        <Text
          style={[
            styles.checkboxText,

            {
              /*
               * Cuando el formulario está seleccionado,
               * el checkbox utiliza colors.primary como fondo.
               *
               * Como el tema actual no tiene primaryContrast,
               * utilizamos colors.surface para mantener
               * un contraste correcto sin modificar theme.ts.
               */
              color: selected ? colors.surface : colors.textMuted,
            },
          ]}
        >
          {selected ? "✓" : ""}
        </Text>
      </View>

      {/* ================================================================ */}
      {/* INFORMACIÓN                                                      */}
      {/* ================================================================ */}

      <View style={styles.formInformation}>
        <Text
          style={[
            styles.formTitle,

            {
              color: colors.text,
            },
          ]}
        >
          {form.title}
        </Text>

        <Text
          style={[
            styles.formDescription,

            {
              color: colors.textSecondary,
            },
          ]}
          numberOfLines={3}
        >
          {form.description}
        </Text>

        <View style={styles.formMetadata}>
          <Text
            style={[
              styles.formVersion,

              {
                color: colors.textMuted,
              },
            ]}
          >
            v{form.version}
          </Text>

          <Text
            style={[
              styles.formStatus,

              {
                color: disabled
                  ? colors.textMuted
                  : selected
                    ? colors.primary
                    : colors.success,
              },
            ]}
          >
            {disabled ? "● Inactivo" : selected ? "● Asignado" : "● Disponible"}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

/*
 * ============================================================================
 * SUMMARY CARD
 * ============================================================================
 */
function SummaryCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  const { colors } = useAppTheme();

  return (
    <AppCard style={styles.summaryCard}>
      <Text
        style={[
          styles.summaryValue,

          {
            color: highlight ? colors.primary : colors.text,
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
      >
        {label}
      </Text>
    </AppCard>
  );
}

/*
 * ============================================================================
 * COMPARAR IDS
 * ============================================================================
 *
 * Compara dos arreglos ignorando:
 *
 * - orden;
 * - duplicados.
 */
function haveSameIds(first: string[], second: string[]): boolean {
  const firstNormalized = [...new Set(first)].sort();

  const secondNormalized = [...new Set(second)].sort();

  if (firstNormalized.length !== secondNormalized.length) {
    return false;
  }

  return firstNormalized.every(
    (value, index) => value === secondNormalized[index],
  );
}

/*
 * ============================================================================
 * ESTILOS
 * ============================================================================
 */
const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: Spacing.xxxl,
  },

  introduction: {
    marginBottom: Spacing.lg,
  },

  introductionTitle: {
    fontSize: FontSize.h2,

    fontWeight: "700",

    marginBottom: Spacing.sm,
  },

  introductionDescription: {
    maxWidth: 720,

    fontSize: FontSize.body,

    lineHeight: 24,
  },

  summaryCard: {
    width: "100%",

    minHeight: 96,
  },

  summaryValue: {
    fontSize: FontSize.h2,

    fontWeight: "700",

    marginBottom: Spacing.xs,
  },

  summaryLabel: {
    fontSize: FontSize.caption,
  },

  section: {
    marginTop: Spacing.xl,

    marginBottom: Spacing.xl,
  },

  sectionTitle: {
    fontSize: FontSize.cardTitle,

    fontWeight: "700",

    marginBottom: Spacing.sm,
  },

  sectionDescription: {
    fontSize: FontSize.small,

    lineHeight: 20,

    marginBottom: Spacing.md,
  },

  /*
   * ================================================================
   * FORM CARD
   * ================================================================
   */
  formCard: {
    width: "100%",

    minHeight: 132,

    flexDirection: "row",

    alignItems: "flex-start",

    borderWidth: 1,

    borderRadius: Radius.lg,

    padding: Spacing.md,
  },

  checkbox: {
    width: 28,

    height: 28,

    flexShrink: 0,

    alignItems: "center",

    justifyContent: "center",

    borderWidth: 2,

    borderRadius: Radius.sm,

    marginRight: Spacing.md,
  },

  checkboxText: {
    fontSize: FontSize.small,

    fontWeight: "700",
  },

  formInformation: {
    flex: 1,

    minWidth: 0,
  },

  formTitle: {
    fontSize: FontSize.body,

    fontWeight: "700",

    marginBottom: Spacing.xs,
  },

  formDescription: {
    fontSize: FontSize.caption,

    lineHeight: 19,

    marginBottom: Spacing.md,
  },

  formMetadata: {
    flexDirection: "row",

    flexWrap: "wrap",

    alignItems: "center",

    gap: Spacing.md,
  },

  formVersion: {
    fontSize: FontSize.caption,
  },

  formStatus: {
    fontSize: FontSize.caption,

    fontWeight: "600",
  },

  /*
   * ================================================================
   * ESTADO
   * ================================================================
   */
  statusCard: {
    marginBottom: Spacing.md,
  },

  statusRow: {
    flexDirection: "row",

    alignItems: "center",
  },

  statusIndicator: {
    width: 10,

    height: 10,

    flexShrink: 0,

    borderRadius: Radius.full,

    marginRight: Spacing.md,
  },

  statusInformation: {
    flex: 1,

    minWidth: 0,
  },

  statusTitle: {
    fontSize: FontSize.small,

    fontWeight: "700",

    marginBottom: Spacing.xs,
  },

  statusDescription: {
    fontSize: FontSize.caption,

    lineHeight: 18,
  },

  /*
   * ================================================================
   * ERROR
   * ================================================================
   */
  errorCard: {
    borderWidth: 1,

    borderRadius: Radius.md,

    padding: Spacing.md,

    marginBottom: Spacing.md,
  },

  errorText: {
    fontSize: FontSize.small,

    lineHeight: 20,

    fontWeight: "600",
  },

  /*
   * ================================================================
   * ACCIONES
   * ================================================================
   */
  actions: {
    flexDirection: "row",

    justifyContent: "flex-end",

    flexWrap: "wrap",

    gap: Spacing.sm,

    marginTop: Spacing.md,
  },

  actionButton: {
    minWidth: 190,
  },

  technicalNotice: {
    fontSize: FontSize.caption,

    lineHeight: 18,

    textAlign: "center",

    marginTop: Spacing.lg,
  },

  /*
   * ================================================================
   * EMPTY
   * ================================================================
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
   * ================================================================
   * NOT FOUND
   * ================================================================
   */
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
