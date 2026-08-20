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

  /* ---------------------------------------------------------------------- */
  /*                              FORMULARIO                                */
  /* ---------------------------------------------------------------------- */

  const [name, setName] = useState("");
  const [type, setType] = useState("");

  const [street, setStreet] = useState("");

  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  /* ---------------------------------------------------------------------- */
  /*                                GUARDADO                                */
  /* ---------------------------------------------------------------------- */

  const handleSave = () => {
    /*
     * PROTOTIPO VISUAL
     *
     * Todavía no almacenamos físicamente
     * el nuevo inmueble.
     *
     * Más adelante este será el punto donde
     * conectemos algo similar a:
     *
     * PropertyService.create(...)
     *
     * Por ahora conservamos el comportamiento:
     * volver al listado de inmuebles.
     */
    router.replace({
      pathname: "/empresas/[id]/inmuebles",

      params: {
        id,
      },
    });
  };

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
              Registra una sucursal, centro de trabajo o instalación.
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
              <AppButton onPress={handleSave}>Guardar inmueble</AppButton>
            </View>

            <View style={styles.actionButton}>
              <AppButton variant="ghost" onPress={() => router.back()}>
                Cancelar
              </AppButton>
            </View>
          </View>

          {/* ============================================================ */}
          {/* AVISO                                                       */}
          {/* ============================================================ */}

          <Text
            style={[
              styles.prototypeNotice,
              {
                color: colors.textMuted,
              },
            ]}
          >
            Prototipo visual: los datos todavía no se almacenan.
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

  prototypeNotice: {
    fontSize: FontSize.caption,

    lineHeight: 18,

    textAlign: "center",

    marginTop: Spacing.lg,
  },
});
