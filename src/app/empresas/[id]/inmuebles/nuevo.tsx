import { useState } from "react";

import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { router, useLocalSearchParams } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppTextInput } from "@/components/ui/AppTextInput";
import { ResponsiveContainer } from "@/components/ui/ResponsiveContainer";
import { ResponsiveGrid } from "@/components/ui/ResponsiveGrid";
import { Screen } from "@/components/ui/Screen";

import { FontSize, Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";
import { useResponsive } from "@/hooks/useResponsive";

import { getCompanyById } from "@/repositories/companyRepository";
import { createProperty } from "@/repositories/propertyRepository";

export default function NewPropertyScreen() {
  /*
   * Colores globales de la aplicación.
   *
   * Mantiene compatibilidad automática
   * con modo claro y oscuro.
   */
  const { colors } = useAppTheme();

  /*
   * Nos permite cambiar la distribución
   * de las acciones según el dispositivo.
   *
   * La mayoría del comportamiento responsive
   * lo controla ResponsiveGrid.
   */
  const { isPhone } = useResponsive();

  /*
   * ID de la empresa propietaria del inmueble.
   *
   * Ruta:
   *
   * /empresas/[id]/inmuebles/nuevo
   */
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  /*
   * Recuperamos la empresa real desde CompanyRepository.
   *
   * Esto también protege la FOREIGN KEY de SQLite:
   * nunca intentamos registrar un inmueble para una empresa inexistente.
   */
  const company = id ? getCompanyById(id) : undefined;

  /* ---------------------------------------------------------------------- */
  /*                              FORMULARIO                                */
  /* ---------------------------------------------------------------------- */

  const [name, setName] = useState("");
  const [type, setType] = useState("");

  const [street, setStreet] = useState("");

  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  /*
   * Estado del guardado real.
   *
   * saving evita pulsaciones duplicadas.
   * saveError permite explicar fallos de validación o persistencia.
   */
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  /* ---------------------------------------------------------------------- */
  /*                                GUARDADO                                */
  /* ---------------------------------------------------------------------- */

  const handleSave = async () => {
    /*
     * ======================================================================
     * VALIDAR EMPRESA
     * ======================================================================
     */
    if (!company) {
      setSaveError(
        "La empresa seleccionada no existe o ya no está disponible.",
      );

      return;
    }

    /*
     * ======================================================================
     * VALIDAR CAMPOS OBLIGATORIOS
     * ======================================================================
     */
    const normalizedName = name.trim();
    const normalizedType = type.trim();
    const normalizedCity = city.trim();
    const normalizedState = state.trim();

    if (
      !normalizedName ||
      !normalizedType ||
      !normalizedCity ||
      !normalizedState
    ) {
      setSaveError("Completa el nombre, tipo de inmueble, municipio y estado.");

      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      /*
       * ====================================================================
       * CREAR INMUEBLE
       * ====================================================================
       *
       * createProperty:
       *
       * 1. genera el ID;
       * 2. relaciona el inmueble con company.id;
       * 3. guarda en PropertyRepository;
       * 4. persiste en SQLite o localStorage;
       * 5. agrega createdAt y updatedAt.
       *
       * workers y formIds empiezan vacíos porque esta pantalla
       * todavía no administra esas configuraciones.
       */
      const property = await createProperty({
        companyId: company.id,

        name: normalizedName,
        type: normalizedType,

        state: normalizedState,
        city: normalizedCity,

        ...(street.trim()
          ? {
              address: street.trim(),
            }
          : {}),

        workers: 0,
        formIds: [],

        status: "active",
      });

      /*
       * Abrimos directamente el detalle del inmueble recién creado.
       *
       * Así el usuario confirma que el registro fue creado
       * y puede continuar configurándolo.
       */
      router.replace({
        pathname: "/empresas/[id]/inmuebles/[propertyId]",

        params: {
          id: company.id,
          propertyId: property.id,
        },
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No fue posible guardar el inmueble.";

      console.error("Error guardando inmueble:", error);

      setSaveError(message);
    } finally {
      setSaving(false);
    }
  };

  /*
   * Si la ruta apunta a una empresa que no existe,
   * mostramos un estado controlado y evitamos intentar guardar.
   */
  if (!company) {
    return (
      <Screen padded={false}>
        <ResponsiveContainer>
          <View style={styles.notFoundContainer}>
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

            <Text
              style={[
                styles.notFoundDescription,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              No es posible registrar un inmueble porque la empresa solicitada
              no existe o ya no está disponible.
            </Text>

            <AppButton onPress={() => router.replace("/empresas")}>
              Volver a Empresas
            </AppButton>
          </View>
        </ResponsiveContainer>
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/*
         * Controla de manera global:
         *
         * - padding lateral
         * - espacio superior
         * - ancho máximo
         * - centrado en tablet/web
         */}
        <ResponsiveContainer>
          {/* ============================================================ */}
          {/* NAVEGACIÓN                                                   */}
          {/* ============================================================ */}

          <Pressable onPress={() => router.back()}>
            <Text
              style={[
                styles.backText,
                {
                  color: colors.primary,
                },
              ]}
            >
              ‹ Cancelar
            </Text>
          </Pressable>

          {/* ============================================================ */}
          {/* ENCABEZADO                                                   */}
          {/* ============================================================ */}

          <View style={styles.header}>
            <Text
              style={[
                styles.title,
                {
                  color: colors.text,
                },
              ]}
            >
              Registrar inmueble
            </Text>

            <Text
              style={[
                styles.subtitle,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              Registra una sucursal, centro de trabajo o instalación para{" "}
              {company.name}.
            </Text>
          </View>

          {/* ============================================================ */}
          {/* INFORMACIÓN GENERAL                                          */}
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
              Información general
            </Text>

            <Text
              style={[
                styles.sectionDescription,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              Datos principales para identificar el inmueble dentro de la
              empresa.
            </Text>

            {/*
             * Móvil:
             *
             * Nombre
             * Tipo
             *
             * Tablet/Desktop:
             *
             * Nombre | Tipo
             */}
            <ResponsiveGrid
              phoneColumns={1}
              tabletColumns={2}
              desktopColumns={2}
              gap={Spacing.md}
            >
              <Field
                label="Nombre del inmueble"
                value={name}
                onChangeText={setName}
                placeholder="Ej. Sucursal San Luis de la Paz"
                required
              />

              <Field
                label="Tipo de inmueble"
                value={type}
                onChangeText={setType}
                placeholder="Ej. Sucursal comercial"
                required
              />
            </ResponsiveGrid>
          </View>

          {/* ============================================================ */}
          {/* UBICACIÓN                                                    */}
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
              Ubicación
            </Text>

            <Text
              style={[
                styles.sectionDescription,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              Información necesaria para ubicar físicamente este inmueble.
            </Text>

            {/*
             * La dirección utiliza una fila completa.
             *
             * Municipio y Estado pasan a dos columnas
             * a partir de tablet.
             */}
            <View style={styles.fullWidthField}>
              <Field
                label="Dirección"
                value={street}
                onChangeText={setStreet}
                placeholder="Calle, número, colonia..."
              />
            </View>

            <ResponsiveGrid
              phoneColumns={1}
              tabletColumns={2}
              desktopColumns={2}
              gap={Spacing.md}
            >
              <Field
                label="Municipio"
                value={city}
                onChangeText={setCity}
                placeholder="Ej. San Luis de la Paz"
                required
              />

              <Field
                label="Estado"
                value={state}
                onChangeText={setState}
                placeholder="Ej. Guanajuato"
                required
              />
            </ResponsiveGrid>
          </View>

          {/* ============================================================ */}
          {/* RESUMEN DEL PROTOTIPO                                        */}
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
              Configuración inicial
            </Text>

            <Text
              style={[
                styles.sectionDescription,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              Los trabajadores, formularios asignados y demás configuración se
              podrán administrar posteriormente desde el detalle del inmueble.
            </Text>
          </View>

          {/* ============================================================ */}
          {/* ACCIONES                                                     */}
          {/* ============================================================ */}

          <View style={[styles.actions, !isPhone && styles.actionsWide]}>
            <View style={styles.actionButton}>
              <AppButton
                onPress={() => {
                  void handleSave();
                }}
                disabled={saving}
              >
                {saving ? "Guardando..." : "Guardar inmueble"}
              </AppButton>
            </View>

            <View style={styles.actionButton}>
              <AppButton variant="ghost" onPress={() => router.back()}>
                Cancelar
              </AppButton>
            </View>
          </View>

          {/* ============================================================ */}
          {/* ESTADO DEL GUARDADO                                           */}
          {/* ============================================================ */}

          {saveError ? (
            <Text
              style={[
                styles.saveError,
                {
                  color: colors.error,
                },
              ]}
            >
              {saveError}
            </Text>
          ) : null}

          <Text
            style={[
              styles.prototypeNotice,
              {
                color: colors.textMuted,
              },
            ]}
          >
            El inmueble se guardará localmente y permanecerá disponible después
            de reiniciar UNIESAP.
          </Text>
        </ResponsiveContainer>
      </ScrollView>
    </Screen>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   FIELD                                    */
/* -------------------------------------------------------------------------- */

/*
 * Campo reutilizable.
 *
 * Permite mantener:
 *
 * etiqueta
 * +
 * indicador requerido
 * +
 * input
 *
 * en un solo componente.
 */
function Field({
  label,
  value,
  onChangeText,
  placeholder,
  required = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  required?: boolean;
}) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.field}>
      <Text
        style={[
          styles.label,
          {
            color: colors.text,
          },
        ]}
      >
        {label}

        {required && (
          <Text
            style={{
              color: colors.error,
            }}
          >
            {" *"}
          </Text>
        )}
      </Text>

      <AppTextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
      />
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  /*
   * ResponsiveContainer se encarga
   * del padding lateral y superior.
   */
  scrollContent: {
    paddingBottom: Spacing.xxxl,
  },

  backText: {
    fontSize: FontSize.small,

    fontWeight: "600",

    marginBottom: Spacing.lg,
  },

  header: {
    marginBottom: Spacing.xl,
  },

  title: {
    fontSize: FontSize.h1,

    fontWeight: "700",

    marginBottom: Spacing.sm,
  },

  subtitle: {
    fontSize: FontSize.body,

    lineHeight: 24,

    maxWidth: 720,
  },

  /* -------------------------------------------------------------------- */
  /*                              SECCIONES                                */
  /* -------------------------------------------------------------------- */

  section: {
    marginBottom: Spacing.xl,
  },

  sectionTitle: {
    fontSize: FontSize.cardTitle,

    fontWeight: "700",

    marginBottom: Spacing.xs,
  },

  sectionDescription: {
    fontSize: FontSize.small,

    lineHeight: 20,

    marginBottom: Spacing.lg,

    maxWidth: 760,
  },

  /*
   * ResponsiveGrid controla el ancho externo.
   */
  field: {
    width: "100%",

    minWidth: 0,
  },

  label: {
    fontSize: FontSize.small,

    fontWeight: "600",

    marginBottom: Spacing.sm,
  },

  /*
   * La dirección siempre usa el ancho completo
   * porque puede contener textos más largos.
   */
  fullWidthField: {
    width: "100%",

    marginBottom: Spacing.md,
  },

  /* -------------------------------------------------------------------- */
  /*                              ACCIONES                                 */
  /* -------------------------------------------------------------------- */

  /*
   * Móvil:
   *
   * [ Guardar inmueble ]
   * [ Cancelar         ]
   */
  actions: {
    gap: Spacing.sm,
  },

  /*
   * Tablet / Desktop:
   *
   *               [ Guardar inmueble ] [ Cancelar ]
   */
  actionsWide: {
    flexDirection: "row",

    justifyContent: "flex-end",
  },

  actionButton: {
    minWidth: 200,
  },

  notFoundContainer: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    paddingTop: Spacing.xxxl,
  },

  notFoundTitle: {
    fontSize: FontSize.h2,
    fontWeight: "700",
    marginBottom: Spacing.sm,
  },

  notFoundDescription: {
    fontSize: FontSize.body,
    lineHeight: 24,
    marginBottom: Spacing.lg,
  },

  saveError: {
    fontSize: FontSize.small,
    lineHeight: 20,
    textAlign: "center",
    marginTop: Spacing.lg,
  },

  prototypeNotice: {
    fontSize: FontSize.caption,

    lineHeight: 18,

    textAlign: "center",

    marginTop: Spacing.lg,
  },
});
