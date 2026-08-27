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

import {
  getCompanyById,
  updateCompany,
} from "@/repositories/companyRepository";

/*
 * ============================================================================
 * EDICIÓN PERSISTENTE DE EMPRESA
 * ============================================================================
 *
 * Esta pantalla trabaja directamente con CompanyRepository.
 *
 * Los cambios se guardan en:
 *
 * Android / iOS → SQLite
 * Web           → localStorage
 *
 * Ya no existe una copia local hardcodeada de AutoZone/LALA.
 */

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
   * Recuperamos la empresa desde CompanyRepository.
   *
   * RootLayout hidrata el repositorio antes de mostrar la aplicación,
   * por lo que los datos persistidos ya están disponibles al entrar aquí.
   */
  const company = id ? getCompanyById(id) : undefined;

  /* ---------------------------------------------------------------------- */
  /*                         ESTADO DEL FORMULARIO                           */
  /* ---------------------------------------------------------------------- */

  /*
   * Los estados se inicializan con la empresa persistida.
   *
   * Si por una ruta inválida no existe la empresa, utilizamos valores
   * vacíos y más abajo mostramos un estado "no encontrada".
   */
  const [commercialName, setCommercialName] = useState<string>(
    company?.name ?? "",
  );

  const [legalName, setLegalName] = useState<string>(company?.legalName ?? "");

  const [rfc, setRfc] = useState<string>(company?.rfc ?? "");

  const [state, setState] = useState<string>(company?.state ?? "");

  const [city, setCity] = useState<string>(company?.city ?? "");

  const [phone, setPhone] = useState<string>(company?.phone ?? "");

  const [email, setEmail] = useState<string>(company?.email ?? "");

  /*
   * companyColor:
   * color actualmente aplicado.
   *
   * customColor:
   * valor escrito en el campo hexadecimal.
   */
  const initialColor = company?.branding.primaryColor ?? "#F97316";

  const [companyColor, setCompanyColor] = useState<string>(initialColor);

  const [customColor, setCustomColor] = useState<string>(initialColor);

  /*
   * Estado del guardado real.
   */
  const [saving, setSaving] = useState(false);

  const [saveError, setSaveError] = useState<string | null>(null);

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

  const handleSave = async () => {
    if (!company) {
      setSaveError("La empresa que intentas editar no existe.");

      return;
    }

    /*
     * Validamos los mismos campos principales utilizados
     * al registrar una empresa.
     */
    const normalizedName = commercialName.trim();
    const normalizedState = state.trim();
    const normalizedCity = city.trim();

    if (!normalizedName || !normalizedState || !normalizedCity) {
      setSaveError("Completa el nombre comercial, el estado y el municipio.");

      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      /*
       * updateCompany conserva automáticamente:
       *
       * - id;
       * - createdAt;
       * - propertyIds actuales;
       *
       * y actualiza updatedAt.
       */
      const updatedCompany = await updateCompany(company.id, {
        name: normalizedName,

        legalName: legalName.trim() || normalizedName,

        rfc: rfc.trim() ? rfc.trim().toUpperCase() : undefined,

        state: normalizedState,
        city: normalizedCity,

        phone: phone.trim() ? phone.trim() : undefined,

        email: email.trim() ? email.trim().toLowerCase() : undefined,

        branding: {
          ...company.branding,
          primaryColor: companyColor,
        },
      });

      if (!updatedCompany) {
        throw new Error(`No fue posible actualizar la empresa ${company.id}.`);
      }

      router.replace({
        pathname: "/empresas/[id]",

        params: {
          id: updatedCompany.id,
        },
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No fue posible guardar los cambios.";

      console.error("Error actualizando empresa:", error);

      setSaveError(message);
    } finally {
      setSaving(false);
    }
  };

  /*
   * Ruta inválida o empresa inexistente.
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
              El registro solicitado no existe o ya no está disponible.
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

                <Field
                  label="RFC"
                  value={rfc}
                  onChangeText={setRfc}
                  autoCapitalize="characters"
                />

                <Field label="Estado" value={state} onChangeText={setState} />

                <Field label="Municipio" value={city} onChangeText={setCity} />

                <Field
                  label="Teléfono"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />

                <Field
                  label="Correo electrónico"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
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
              <AppButton
                onPress={() => {
                  void handleSave();
                }}
                disabled={saving}
              >
                {saving ? "Guardando..." : "Guardar cambios"}
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
            Los cambios se guardan localmente y permanecen disponibles después
            de reiniciar UNIESAP.
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
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
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

      <AppTextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
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
