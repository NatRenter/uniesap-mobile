import { useState } from "react";

import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { router } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { AppTextInput } from "@/components/ui/AppTextInput";
import { ResponsiveContainer } from "@/components/ui/ResponsiveContainer";
import { ResponsiveGrid } from "@/components/ui/ResponsiveGrid";
import { Screen } from "@/components/ui/Screen";

import { CompanyColors, FontSize, Radius, Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";
import { useResponsive } from "@/hooks/useResponsive";

import { createCompany } from "@/repositories/companyRepository";

export default function NewCompanyScreen() {
  const { colors } = useAppTheme();

  /*
   * Utilizamos el breakpoint únicamente donde necesitamos
   * cambiar la distribución general de la pantalla.
   *
   * Móvil:
   * formulario completamente vertical.
   *
   * Tablet / Desktop:
   * formulario + panel lateral de identidad visual.
   */
  const { isPhone } = useResponsive();

  /* ---------------------------------------------------------------------- */
  /*                               FORMULARIO                               */
  /* ---------------------------------------------------------------------- */

  const [commercialName, setCommercialName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [rfc, setRfc] = useState("");

  const [state, setState] = useState("");
  const [city, setCity] = useState("");

  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  /*
   * companyColor representa el color actualmente aplicado.
   *
   * customColor representa lo que el usuario escribe manualmente
   * antes de pulsar "Aplicar color".
   */
  const [companyColor, setCompanyColor] = useState("#F97316");
  const [customColor, setCustomColor] = useState("#F97316");

  /*
   * Estados del guardado real.
   *
   * saving evita pulsaciones duplicadas.
   * saveError muestra una explicación sencilla si la persistencia falla.
   */
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  /* ---------------------------------------------------------------------- */
  /*                           VISTA PREVIA                                 */
  /* ---------------------------------------------------------------------- */

  /*
   * Estos cálculos son muy pequeños, por lo que no necesitamos useMemo.
   * Además evitamos memoización manual innecesaria con React Compiler.
   */
  const previewName = commercialName.trim() || "Nombre de la empresa";

  const previewLocation = getPreviewLocation(city, state);

  const initials = getInitials(previewName);

  /* ---------------------------------------------------------------------- */
  /*                           COLOR PERSONALIZADO                          */
  /* ---------------------------------------------------------------------- */

  const handleCustomColor = () => {
    /*
     * Permitimos escribir:
     *
     * F97316
     *
     * o:
     *
     * #F97316
     *
     * y normalizamos ambos casos.
     */
    const normalizedColor = customColor.startsWith("#")
      ? customColor
      : `#${customColor}`;

    const validHex = /^#[0-9A-Fa-f]{6}$/.test(normalizedColor);

    if (validHex) {
      const finalColor = normalizedColor.toUpperCase();

      setCompanyColor(finalColor);
      setCustomColor(finalColor);
    }
  };

  /* ---------------------------------------------------------------------- */
  /*                               GUARDADO                                 */
  /* ---------------------------------------------------------------------- */

  const handleSave = async () => {
    /*
     * ======================================================================
     * VALIDACIÓN
     * ======================================================================
     *
     * Company requiere:
     *
     * - nombre comercial;
     * - estado;
     * - municipio o ciudad.
     *
     * Razón social continúa siendo opcional en la interfaz.
     * Si no se captura, utilizamos temporalmente el nombre comercial.
     */
    const normalizedName = commercialName.trim();
    const normalizedState = state.trim();
    const normalizedCity = city.trim();

    if (!normalizedName || !normalizedState || !normalizedCity) {
      setSaveError(
        "Completa el nombre comercial, el estado y el municipio o ciudad.",
      );

      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      /*
       * ====================================================================
       * GUARDAR EMPRESA
       * ====================================================================
       *
       * createCompany():
       *
       * 1. genera un ID estable;
       * 2. actualiza CompanyRepository;
       * 3. persiste en SQLite o localStorage;
       * 4. asigna createdAt y updatedAt.
       */
      const company = await createCompany({
        name: normalizedName,

        legalName: legalName.trim() || normalizedName,

        ...(rfc.trim()
          ? {
              rfc: rfc.trim().toUpperCase(),
            }
          : {}),

        state: normalizedState,
        city: normalizedCity,

        ...(phone.trim()
          ? {
              phone: phone.trim(),
            }
          : {}),

        ...(email.trim()
          ? {
              email: email.trim().toLowerCase(),
            }
          : {}),

        branding: {
          primaryColor: companyColor,
        },

        status: "active",
      });

      /*
       * Abrimos directamente la empresa recién creada.
       *
       * Esto confirma visualmente que el registro ya existe
       * y evita devolver al usuario a una pantalla genérica.
       */
      router.replace({
        pathname: "/empresas/[id]",

        params: {
          id: company.id,
        },
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No fue posible guardar la empresa.";

      console.error("Error guardando empresa:", error);

      setSaveError(message);
    } finally {
      setSaving(false);
    }
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
          {/* HEADER                                                       */}
          {/* ============================================================ */}

          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Text
                style={[
                  styles.backText,
                  {
                    color: colors.primary,
                  },
                ]}
              >
                ‹ Volver
              </Text>
            </Pressable>

            <Text
              style={[
                styles.title,
                {
                  color: colors.text,
                },
              ]}
            >
              Registrar empresa
            </Text>

            <Text
              style={[
                styles.subtitle,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              Registra la información general y personaliza cómo se identificará
              la empresa dentro de UNIESAP.
            </Text>
          </View>

          {/* ============================================================ */}
          {/* LAYOUT PRINCIPAL                                             */}
          {/* ============================================================ */}

          {/*
           * MÓVIL
           *
           * Datos
           * ↓
           * Identidad visual
           * ↓
           * Vista previa
           *
           * TABLET / DESKTOP
           *
           * ┌───────────────────────────┬───────────────────────┐
           * │ Datos de empresa          │ Identidad visual      │
           * │                           │ Vista previa          │
           * └───────────────────────────┴───────────────────────┘
           */}
          <View style={[styles.mainLayout, !isPhone && styles.mainLayoutWide]}>
            {/* ========================================================== */}
            {/* COLUMNA PRINCIPAL                                          */}
            {/* ========================================================== */}

            <View
              style={[styles.formColumn, !isPhone && styles.formColumnWide]}
            >
              {/* ======================================================== */}
              {/* INFORMACIÓN GENERAL                                      */}
              {/* ======================================================== */}

              <SectionTitle
                title="Información general"
                description="Datos principales de identificación."
              />

              {/*
               * Móvil   → 1 campo por fila
               * Tablet  → 2 campos
               * Desktop → 2 campos
               */}
              <ResponsiveGrid
                phoneColumns={1}
                tabletColumns={2}
                desktopColumns={2}
                gap={Spacing.md}
              >
                <FormField label="Nombre comercial" required>
                  <AppTextInput
                    value={commercialName}
                    onChangeText={setCommercialName}
                    placeholder="Ej. AutoZone"
                  />
                </FormField>

                <FormField label="Razón social">
                  <AppTextInput
                    value={legalName}
                    onChangeText={setLegalName}
                    placeholder="Razón social de la empresa"
                  />
                </FormField>

                <FormField label="RFC">
                  <AppTextInput
                    value={rfc}
                    onChangeText={setRfc}
                    placeholder="RFC"
                    autoCapitalize="characters"
                  />
                </FormField>
              </ResponsiveGrid>

              {/* ======================================================== */}
              {/* UBICACIÓN                                                */}
              {/* ======================================================== */}

              <View style={styles.sectionSpacing}>
                <SectionTitle
                  title="Ubicación"
                  description="Información correspondiente a esta empresa."
                />
              </View>

              <ResponsiveGrid
                phoneColumns={1}
                tabletColumns={2}
                desktopColumns={2}
                gap={Spacing.md}
              >
                <FormField label="Estado" required>
                  <AppTextInput
                    value={state}
                    onChangeText={setState}
                    placeholder="Ej. Guanajuato"
                  />
                </FormField>

                <FormField label="Municipio o ciudad" required>
                  <AppTextInput
                    value={city}
                    onChangeText={setCity}
                    placeholder="Ej. San Luis de la Paz"
                  />
                </FormField>
              </ResponsiveGrid>

              {/* ======================================================== */}
              {/* CONTACTO                                                 */}
              {/* ======================================================== */}

              <View style={styles.sectionSpacing}>
                <SectionTitle
                  title="Contacto"
                  description="Información administrativa de referencia."
                />
              </View>

              <ResponsiveGrid
                phoneColumns={1}
                tabletColumns={2}
                desktopColumns={2}
                gap={Spacing.md}
              >
                <FormField label="Teléfono">
                  <AppTextInput
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Ej. 468 123 4567"
                    keyboardType="phone-pad"
                  />
                </FormField>

                <FormField label="Correo electrónico">
                  <AppTextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="contacto@empresa.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </FormField>
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
                description="Personaliza cómo se distinguirá esta empresa."
              />

              {/* ======================================================== */}
              {/* COLORES PREDEFINIDOS                                     */}
              {/* ======================================================== */}

              <View style={styles.formGroup}>
                <FieldLabel label="Color representativo" />

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
                        {selected && (
                          <Text style={styles.selectedColorCheck}>✓</Text>
                        )}
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
                    styles.customColorTitle,
                    {
                      color: colors.text,
                    },
                  ]}
                >
                  Color personalizado
                </Text>

                <Text
                  style={[
                    styles.customColorDescription,
                    {
                      color: colors.textSecondary,
                    },
                  ]}
                >
                  Introduce un color hexadecimal.
                </Text>

                <View style={styles.customColorRow}>
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
                    placeholder="#F97316"
                    autoCapitalize="characters"
                    maxLength={7}
                    style={styles.customColorInput}
                  />
                </View>

                <AppButton variant="secondary" onPress={handleCustomColor}>
                  Aplicar color
                </AppButton>
              </AppCard>

              {/* ======================================================== */}
              {/* LOGOTIPO                                                 */}
              {/* ======================================================== */}

              <View style={styles.logoSection}>
                <FieldLabel label="Logotipo" />

                {/*
                 * Este bloque sigue siendo visual.
                 *
                 * No agregamos selector de archivos todavía porque
                 * esa funcionalidad pertenece a la etapa de persistencia.
                 */}
                <Pressable
                  style={({ pressed }) => [
                    styles.logoUploader,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.logoPlaceholder,
                      {
                        backgroundColor: colors.surfaceSecondary,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.logoPlaceholderIcon,
                        {
                          color: colors.primary,
                        },
                      ]}
                    >
                      +
                    </Text>
                  </View>

                  <View style={styles.logoUploaderText}>
                    <Text
                      style={[
                        styles.logoUploaderTitle,
                        {
                          color: colors.text,
                        },
                      ]}
                    >
                      Agregar logotipo
                    </Text>

                    <Text
                      style={[
                        styles.logoUploaderDescription,
                        {
                          color: colors.textSecondary,
                        },
                      ]}
                    >
                      La carga real del archivo se habilitará posteriormente.
                    </Text>
                  </View>
                </Pressable>
              </View>

              {/* ======================================================== */}
              {/* VISTA PREVIA                                             */}
              {/* ======================================================== */}

              <View style={styles.previewSection}>
                <SectionTitle
                  title="Vista previa"
                  description="Así aparecerá la empresa en UNIESAP."
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

                    <View style={styles.previewInformation}>
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

                      <Text
                        style={[
                          styles.previewMetadata,
                          {
                            color: colors.textMuted,
                          },
                        ]}
                      >
                        0 inmuebles · 0 inspecciones
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
              <AppButton
                onPress={() => {
                  void handleSave();
                }}
                disabled={saving}
              >
                {saving ? "Guardando..." : "Guardar empresa"}
              </AppButton>
            </View>

            <View style={styles.actionButton}>
              <AppButton variant="ghost" onPress={() => router.back()}>
                Cancelar
              </AppButton>
            </View>
          </View>

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
            La empresa se guardará localmente y permanecerá disponible al
            reiniciar UNIESAP.
          </Text>
        </ResponsiveContainer>
      </ScrollView>
    </Screen>
  );
}

/* -------------------------------------------------------------------------- */
/*                              FORM FIELD                                    */
/* -------------------------------------------------------------------------- */

/*
 * Agrupa etiqueta + input.
 *
 * Esto evita repetir el mismo View/formGroup
 * para cada campo y mantiene el grid responsive limpio.
 */
function FormField({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.formGroup}>
      <FieldLabel label={label} required={required} />

      {children}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                              FIELD LABEL                                   */
/* -------------------------------------------------------------------------- */

function FieldLabel({
  label,
  required = false,
}: {
  label: string;
  required?: boolean;
}) {
  const { colors } = useAppTheme();

  return (
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
 * Construye el texto de ubicación utilizado
 * exclusivamente por la vista previa.
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
 * Genera las iniciales que representan temporalmente
 * el logotipo de la empresa.
 *
 * Ejemplos:
 *
 * AutoZone       → AU
 * Empresa Demo   → ED
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
   * ResponsiveContainer ya controla:
   *
   * - padding superior
   * - padding horizontal
   * - ancho máximo
   * - centrado
   */
  scrollContent: {
    paddingBottom: Spacing.xxxl,
  },

  header: {
    marginBottom: Spacing.xl,
  },

  backButton: {
    alignSelf: "flex-start",

    marginBottom: Spacing.lg,
  },

  backText: {
    fontSize: FontSize.small,

    fontWeight: "600",
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
   * una única columna.
   */
  mainLayout: {
    width: "100%",

    gap: Spacing.xl,
  },

  /*
   * Tablet y escritorio:
   *
   * formulario | identidad visual
   */
  mainLayoutWide: {
    flexDirection: "row",

    alignItems: "flex-start",
  },

  formColumn: {
    width: "100%",
  },

  /*
   * Damos más espacio a los datos generales.
   */
  formColumnWide: {
    flex: 3,

    width: "auto",

    minWidth: 0,
  },

  visualColumn: {
    width: "100%",
  },

  /*
   * La identidad visual ocupa una columna
   * ligeramente más pequeña.
   */
  visualColumnWide: {
    flex: 2,

    width: "auto",

    minWidth: 0,
  },

  /* -------------------------------------------------------------------- */
  /*                              SECCIONES                                */
  /* -------------------------------------------------------------------- */

  sectionSpacing: {
    marginTop: Spacing.xl,
  },

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

  /*
   * ResponsiveGrid controla el espacio vertical
   * entre filas, así que aquí no necesitamos
   * marginBottom.
   */
  formGroup: {
    width: "100%",

    minWidth: 0,
  },

  label: {
    fontSize: FontSize.small,

    fontWeight: "600",

    marginBottom: Spacing.sm,
  },

  /* -------------------------------------------------------------------- */
  /*                               COLORES                                 */
  /* -------------------------------------------------------------------- */

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

  selectedColorCheck: {
    color: "#FFFFFF",

    fontSize: FontSize.cardTitle,

    fontWeight: "700",
  },

  customColorCard: {
    width: "100%",

    marginTop: Spacing.lg,
  },

  customColorTitle: {
    fontSize: FontSize.body,

    fontWeight: "700",

    marginBottom: Spacing.xs,
  },

  customColorDescription: {
    fontSize: FontSize.small,

    marginBottom: Spacing.md,
  },

  customColorRow: {
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

  customColorInput: {
    flex: 1,

    minWidth: 0,
  },

  /* -------------------------------------------------------------------- */
  /*                                LOGO                                   */
  /* -------------------------------------------------------------------- */

  logoSection: {
    marginTop: Spacing.xl,
  },

  logoUploader: {
    minHeight: 92,

    flexDirection: "row",

    alignItems: "center",

    padding: Spacing.md,

    borderWidth: 1,

    borderStyle: "dashed",

    borderRadius: Radius.lg,
  },

  logoPlaceholder: {
    width: 56,

    height: 56,

    flexShrink: 0,

    borderRadius: Radius.md,

    alignItems: "center",

    justifyContent: "center",

    marginRight: Spacing.md,
  },

  logoPlaceholderIcon: {
    fontSize: 28,

    fontWeight: "400",
  },

  logoUploaderText: {
    flex: 1,

    minWidth: 0,
  },

  logoUploaderTitle: {
    fontSize: FontSize.body,

    fontWeight: "600",

    marginBottom: Spacing.xs,
  },

  logoUploaderDescription: {
    fontSize: FontSize.caption,

    lineHeight: 18,
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

  previewInformation: {
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

    marginBottom: Spacing.sm,
  },

  previewMetadata: {
    fontSize: FontSize.caption,
  },

  previewArrow: {
    flexShrink: 0,

    fontSize: 32,

    marginLeft: Spacing.sm,
  },

  /* -------------------------------------------------------------------- */
  /*                              ACCIONES                                 */
  /* -------------------------------------------------------------------- */

  /*
   * Móvil:
   *
   * [ Guardar empresa ]
   * [ Cancelar        ]
   */
  actions: {
    gap: Spacing.sm,

    marginTop: Spacing.xl,
  },

  /*
   * Tablet / Desktop:
   *
   *                [ Guardar empresa ] [ Cancelar ]
   */
  actionsWide: {
    flexDirection: "row",

    justifyContent: "flex-end",
  },

  actionButton: {
    minWidth: 200,
  },

  saveError: {
    textAlign: "center",

    fontSize: FontSize.small,

    lineHeight: 20,

    marginTop: Spacing.lg,
  },

  prototypeNotice: {
    textAlign: "center",

    fontSize: FontSize.caption,

    lineHeight: 18,

    marginTop: Spacing.lg,
  },
});
