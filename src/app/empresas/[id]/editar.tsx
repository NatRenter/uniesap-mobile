import { useState } from "react";

import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { router, useLocalSearchParams } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { AppTextInput } from "@/components/ui/AppTextInput";
import { ResponsiveContainer } from "@/components/ui/ResponsiveContainer";
import { ResponsiveGrid } from "@/components/ui/ResponsiveGrid";
import { Screen } from "@/components/ui/Screen";

import { CompanyColors, FontSize, Radius, Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";
import { useResponsive } from "@/hooks/useResponsive";

/*
 * DATOS TEMPORALES
 *
 * Por ahora esta pantalla continúa utilizando datos locales.
 *
 * Más adelante, cuando conectemos la persistencia real,
 * este bloque será reemplazado por nuestra capa centralizada:
 *
 * CompanyRepository / CompanyService
 *                ↓
 *           Empresa real
 */
const companies = {
  "1": {
    name: "AutoZone",
    legalName: "AutoZone de México S. de R.L. de C.V.",
    state: "Guanajuato",
    city: "San Luis de la Paz",
    color: "#F97316",
  },

  "2": {
    name: "LALA",
    legalName: "Empresa LALA",
    state: "Michoacán",
    city: "La Piedad",
    color: "#EF4444",
  },

  "3": {
    name: "Empresa Demo",
    legalName: "Empresa Demo S.A. de C.V.",
    state: "Guanajuato",
    city: "León",
    color: "#3B82F6",
  },
} as const;

export default function EditCompanyScreen() {
  const { colors } = useAppTheme();

  /*
   * Nos permite cambiar únicamente la distribución.
   *
   * La lógica y los componentes permanecen iguales
   * independientemente del dispositivo.
   */
  const { isPhone } = useResponsive();

  /*
   * ID recibido desde:
   *
   * /empresas/[id]/editar
   */
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  /*
   * Recuperamos temporalmente la empresa desde el objeto local.
   *
   * Conservamos el comportamiento que ya tenía tu archivo:
   * si no existe el ID utiliza AutoZone como fallback.
   */
  const company = companies[id as keyof typeof companies] ?? companies["1"];

  /* ---------------------------------------------------------------------- */
  /*                         ESTADO DEL FORMULARIO                           */
  /* ---------------------------------------------------------------------- */

  /*
   * Cada estado se inicializa con los datos existentes
   * de la empresa.
   *
   * Esto diferencia esta pantalla de nueva.tsx:
   *
   * nueva.tsx  → valores vacíos
   * editar.tsx → valores existentes
   */
  const [commercialName, setCommercialName] = useState<string>(company.name);

  const [legalName, setLegalName] = useState<string>(company.legalName);

  const [state, setState] = useState<string>(company.state);

  const [city, setCity] = useState<string>(company.city);

  /*
   * companyColor:
   * color actualmente aplicado.
   *
   * customColor:
   * valor escrito en el campo hexadecimal.
   */
  const [companyColor, setCompanyColor] = useState<string>(company.color);

  const [customColor, setCustomColor] = useState<string>(company.color);

  /* ---------------------------------------------------------------------- */
  /*                            VISTA PREVIA                                */
  /* ---------------------------------------------------------------------- */

  /*
   * Son operaciones pequeñas, por lo que no necesitamos useMemo.
   * Así evitamos memoización manual innecesaria con React Compiler.
   */
  const previewName = commercialName.trim() || "Nombre de la empresa";

  const previewLocation = getPreviewLocation(city, state);

  const initials = getInitials(previewName);

  /* ---------------------------------------------------------------------- */
  /*                         COLOR PERSONALIZADO                            */
  /* ---------------------------------------------------------------------- */

  const applyCustomColor = () => {
    /*
     * Aceptamos:
     *
     * F97316
     *
     * o:
     *
     * #F97316
     */
    const normalizedColor = customColor.startsWith("#")
      ? customColor
      : `#${customColor}`;

    /*
     * Solo aplicamos el valor si corresponde
     * a un hexadecimal válido de seis caracteres.
     */
    if (/^#[0-9A-Fa-f]{6}$/.test(normalizedColor)) {
      const finalColor = normalizedColor.toUpperCase();

      setCompanyColor(finalColor);
      setCustomColor(finalColor);
    }
  };

  /* ---------------------------------------------------------------------- */
  /*                               GUARDADO                                 */
  /* ---------------------------------------------------------------------- */

  const handleSave = () => {
    /*
     * PROTOTIPO
     *
     * Todavía no modificamos realmente los datos.
     *
     * Cuando implementemos persistencia, aquí llamaremos
     * al servicio encargado de actualizar la empresa.
     *
     * Por ahora conservamos el comportamiento original:
     * regresar al detalle de la empresa.
     */
    router.replace({
      pathname: "/empresas/[id]",

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
        <ResponsiveContainer>
          {/* ============================================================ */}
          {/* NAVEGACIÓN                                                   */}
          {/* ============================================================ */}

          <View style={styles.topNavigation}>
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
          </View>

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
              Editar empresa
            </Text>

            <Text
              style={[
                styles.subtitle,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              Modifica la información y la identidad visual de la empresa.
            </Text>
          </View>

          {/* ============================================================ */}
          {/* LAYOUT PRINCIPAL                                             */}
          {/* ============================================================ */}

          {/*
           * MÓVIL
           *
           * Información
           * ↓
           * Identidad visual
           * ↓
           * Vista previa
           *
           *
           * TABLET / DESKTOP
           *
           * ┌────────────────────────┬───────────────────────┐
           * │ Información            │ Identidad visual      │
           * │                        │ Vista previa          │
           * └────────────────────────┴───────────────────────┘
           */}
          <View style={[styles.mainLayout, !isPhone && styles.mainLayoutWide]}>
            {/* ========================================================== */}
            {/* INFORMACIÓN DE LA EMPRESA                                  */}
            {/* ========================================================== */}

            <View
              style={[styles.formColumn, !isPhone && styles.formColumnWide]}
            >
              <SectionTitle
                title="Información general"
                description="Modifica los datos principales de identificación."
              />

              <ResponsiveGrid
                phoneColumns={1}
                tabletColumns={2}
                desktopColumns={2}
                gap={Spacing.md}
              >
                <Field
                  label="Nombre comercial"
                  value={commercialName}
                  onChangeText={setCommercialName}
                />

                <Field
                  label="Razón social"
                  value={legalName}
                  onChangeText={setLegalName}
                />

                <Field label="Estado" value={state} onChangeText={setState} />

                <Field label="Municipio" value={city} onChangeText={setCity} />
              </ResponsiveGrid>
            </View>

            {/* ========================================================== */}
            {/* IDENTIDAD VISUAL                                           */}
            {/* ========================================================== */}

            <View
              style={[styles.visualColumn, !isPhone && styles.visualColumnWide]}
            >
              <SectionTitle
                title="Identidad visual"
                description="Personaliza cómo se identifica la empresa en UNIESAP."
              />

              {/* ======================================================== */}
              {/* COLORES PREDEFINIDOS                                     */}
              {/* ======================================================== */}

              <View style={styles.colorSection}>
                <Text
                  style={[
                    styles.label,
                    {
                      color: colors.text,
                    },
                  ]}
                >
                  Color representativo
                </Text>

                <View style={styles.colorGrid}>
                  {CompanyColors.map((color) => {
                    const selected =
                      color.toUpperCase() === companyColor.toUpperCase();

                    return (
                      <Pressable
                        key={color}
                        onPress={() => {
                          setCompanyColor(color);
                          setCustomColor(color);
                        }}
                        style={({ pressed }) => [
                          styles.colorOption,
                          {
                            backgroundColor: color,

                            borderColor: selected ? colors.text : "transparent",

                            opacity: pressed ? 0.75 : 1,
                          },
                        ]}
                      >
                        {selected && <Text style={styles.check}>✓</Text>}
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* ======================================================== */}
              {/* COLOR PERSONALIZADO                                      */}
              {/* ======================================================== */}

              <AppCard style={styles.customColorCard}>
                <Text
                  style={[
                    styles.customTitle,
                    {
                      color: colors.text,
                    },
                  ]}
                >
                  Color personalizado
                </Text>

                <Text
                  style={[
                    styles.customDescription,
                    {
                      color: colors.textSecondary,
                    },
                  ]}
                >
                  Introduce un color hexadecimal.
                </Text>

                <View style={styles.customRow}>
                  <View
                    style={[
                      styles.colorPreview,
                      {
                        backgroundColor: companyColor,
                        borderColor: colors.border,
                      },
                    ]}
                  />

                  <AppTextInput
                    value={customColor}
                    onChangeText={setCustomColor}
                    maxLength={7}
                    autoCapitalize="characters"
                    placeholder="#F97316"
                    style={styles.customInput}
                  />
                </View>

                <AppButton variant="secondary" onPress={applyCustomColor}>
                  Aplicar color
                </AppButton>
              </AppCard>

              {/* ======================================================== */}
              {/* VISTA PREVIA                                             */}
              {/* ======================================================== */}

              <View style={styles.previewSection}>
                <SectionTitle
                  title="Vista previa"
                  description="Así se visualizarán los cambios antes de guardarlos."
                />

                <AppCard style={styles.previewCard}>
                  <View
                    style={[
                      styles.previewAccent,
                      {
                        backgroundColor: companyColor,
                      },
                    ]}
                  />

                  <View style={styles.previewContent}>
                    <View
                      style={[
                        styles.previewLogo,
                        {
                          backgroundColor: `${companyColor}20`,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.previewInitials,
                          {
                            color: companyColor,
                          },
                        ]}
                      >
                        {initials}
                      </Text>
                    </View>

                    <View style={styles.previewInfo}>
                      <Text
                        style={[
                          styles.previewName,
                          {
                            color: colors.text,
                          },
                        ]}
                        numberOfLines={2}
                      >
                        {previewName}
                      </Text>

                      <Text
                        style={[
                          styles.previewLocation,
                          {
                            color: colors.textSecondary,
                          },
                        ]}
                        numberOfLines={2}
                      >
                        {previewLocation}
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.previewArrow,
                        {
                          color: colors.textMuted,
                        },
                      ]}
                    >
                      ›
                    </Text>
                  </View>
                </AppCard>
              </View>
            </View>
          </View>

          {/* ============================================================ */}
          {/* ACCIONES                                                     */}
          {/* ============================================================ */}

          <View style={[styles.actions, !isPhone && styles.actionsWide]}>
            <View style={styles.actionButton}>
              <AppButton onPress={handleSave}>Guardar cambios</AppButton>
            </View>

            <View style={styles.actionButton}>
              <AppButton variant="ghost" onPress={() => router.back()}>
                Cancelar
              </AppButton>
            </View>
          </View>

          {/* ============================================================ */}
          {/* AVISO DEL PROTOTIPO                                          */}
          {/* ============================================================ */}

          <Text
            style={[
              styles.prototypeNotice,
              {
                color: colors.textMuted,
              },
            ]}
          >
            Prototipo visual: los cambios todavía no se almacenan.
          </Text>
        </ResponsiveContainer>
      </ScrollView>
    </Screen>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  FIELD                                     */
/* -------------------------------------------------------------------------- */

/*
 * Campo reutilizable de edición.
 *
 * Mantiene el mismo comportamiento que tu componente Field original,
 * pero ahora funciona dentro de ResponsiveGrid.
 */
function Field({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
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
      </Text>

      <AppTextInput value={value} onChangeText={onChangeText} />
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                              SECTION TITLE                                 */
/* -------------------------------------------------------------------------- */

function SectionTitle({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.sectionHeader}>
      <Text
        style={[
          styles.sectionTitle,
          {
            color: colors.text,
          },
        ]}
      >
        {title}
      </Text>

      {description && (
        <Text
          style={[
            styles.sectionDescription,
            {
              color: colors.textSecondary,
            },
          ]}
        >
          {description}
        </Text>
      )}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  HELPERS                                   */
/* -------------------------------------------------------------------------- */

/*
 * Construye la ubicación utilizada por la vista previa.
 */
function getPreviewLocation(city: string, state: string) {
  if (city && state) {
    return `${city}, ${state}`;
  }

  if (city) {
    return city;
  }

  if (state) {
    return state;
  }

  return "Ciudad, Estado";
}

/*
 * Genera las iniciales utilizadas cuando
 * todavía no existe un logotipo real.
 *
 * Ejemplos:
 *
 * AutoZone     → AU
 * Empresa Demo → ED
 */
function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return "";
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  /*
   * ResponsiveContainer controla el padding horizontal,
   * superior y el ancho máximo.
   */
  scrollContent: {
    paddingBottom: Spacing.xxxl,
  },

  topNavigation: {
    marginBottom: Spacing.lg,
  },

  backText: {
    fontSize: FontSize.small,
    fontWeight: "600",
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
    maxWidth: 760,
  },

  /* -------------------------------------------------------------------- */
  /*                          LAYOUT PRINCIPAL                             */
  /* -------------------------------------------------------------------- */

  /*
   * Móvil:
   * una sola columna.
   */
  mainLayout: {
    width: "100%",
    gap: Spacing.xl,
  },

  /*
   * Tablet / Desktop:
   *
   * Información | Identidad visual
   */
  mainLayoutWide: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  formColumn: {
    width: "100%",
  },

  /*
   * Los datos generales reciben ligeramente
   * más espacio horizontal.
   */
  formColumnWide: {
    flex: 3,
    width: "auto",
    minWidth: 0,
  },

  visualColumn: {
    width: "100%",
  },

  visualColumnWide: {
    flex: 2,
    width: "auto",
    minWidth: 0,
  },

  /* -------------------------------------------------------------------- */
  /*                               SECCIONES                               */
  /* -------------------------------------------------------------------- */

  sectionHeader: {
    marginBottom: Spacing.lg,
  },

  sectionTitle: {
    fontSize: FontSize.cardTitle,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },

  sectionDescription: {
    fontSize: FontSize.small,
    lineHeight: 20,
  },

  field: {
    width: "100%",
    minWidth: 0,
  },

  label: {
    fontSize: FontSize.small,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },

  /* -------------------------------------------------------------------- */
  /*                                COLORES                                */
  /* -------------------------------------------------------------------- */

  colorSection: {
    marginBottom: Spacing.lg,
  },

  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },

  colorOption: {
    width: 48,
    height: 48,

    borderRadius: Radius.full,

    borderWidth: 3,

    alignItems: "center",
    justifyContent: "center",
  },

  check: {
    color: "#FFFFFF",
    fontSize: FontSize.cardTitle,
    fontWeight: "700",
  },

  customColorCard: {
    width: "100%",
  },

  customTitle: {
    fontSize: FontSize.body,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },

  customDescription: {
    fontSize: FontSize.small,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },

  customRow: {
    flexDirection: "row",
    alignItems: "center",

    gap: Spacing.md,

    marginBottom: Spacing.md,
  },

  colorPreview: {
    width: 52,
    height: 52,

    flexShrink: 0,

    borderRadius: Radius.md,
    borderWidth: 1,
  },

  customInput: {
    flex: 1,
    minWidth: 0,
  },

  /* -------------------------------------------------------------------- */
  /*                           VISTA PREVIA                                */
  /* -------------------------------------------------------------------- */

  previewSection: {
    marginTop: Spacing.xl,
  },

  previewCard: {
    width: "100%",
    padding: 0,
    overflow: "hidden",
  },

  previewAccent: {
    height: 6,
  },

  previewContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
  },

  previewLogo: {
    width: 56,
    height: 56,

    flexShrink: 0,

    borderRadius: Radius.md,

    alignItems: "center",
    justifyContent: "center",

    marginRight: Spacing.md,
  },

  previewInitials: {
    fontSize: FontSize.body,
    fontWeight: "700",
  },

  previewInfo: {
    flex: 1,
    minWidth: 0,
  },

  previewName: {
    fontSize: FontSize.cardTitle,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },

  previewLocation: {
    fontSize: FontSize.small,
  },

  previewArrow: {
    flexShrink: 0,
    fontSize: 32,
    marginLeft: Spacing.sm,
  },

  /* -------------------------------------------------------------------- */
  /*                               ACCIONES                                */
  /* -------------------------------------------------------------------- */

  /*
   * Móvil:
   *
   * [ Guardar cambios ]
   * [ Cancelar        ]
   */
  actions: {
    gap: Spacing.sm,
    marginTop: Spacing.xl,
  },

  /*
   * Tablet / Desktop:
   *
   *                    [ Guardar cambios ] [ Cancelar ]
   */
  actionsWide: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },

  actionButton: {
    minWidth: 200,
  },

  prototypeNotice: {
    textAlign: "center",
    fontSize: FontSize.caption,
    lineHeight: 18,
    marginTop: Spacing.lg,
  },
});
