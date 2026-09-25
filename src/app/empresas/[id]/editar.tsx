import { useState } from "react";

import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

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
  deleteCompany,
  getCompanyById,
  updateCompany,
} from "@/repositories/companyRepository";

/*
 * ============================================================================
 * EDICIÃ“N PERSISTENTE DE EMPRESA
 * ============================================================================
 *
 * Esta pantalla trabaja directamente con CompanyRepository.
 *
 * Los cambios se guardan en:
 *
 * Android / iOS â†’ SQLite
 * Web           â†’ localStorage
 *
 * Ya no existe una copia local hardcodeada de AutoZone/LALA.
 */

export default function EditCompanyScreen() {
  const { colors } = useAppTheme();

  /*
   * Nos permite cambiar Ãºnicamente la distribuciÃ³n.
   *
   * La lÃ³gica y los componentes permanecen iguales
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
   * RootLayout hidrata el repositorio antes de mostrar la aplicaciÃ³n,
   * por lo que los datos persistidos ya estÃ¡n disponibles al entrar aquÃ­.
   */
  const company = id ? getCompanyById(id) : undefined;

  /* ---------------------------------------------------------------------- */
  /*                         ESTADO DEL FORMULARIO                           */
  /* ---------------------------------------------------------------------- */

  /*
   * Los estados se inicializan con la empresa persistida.
   *
   * Si por una ruta invÃ¡lida no existe la empresa, utilizamos valores
   * vacÃ­os y mÃ¡s abajo mostramos un estado "no encontrada".
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

  /*
   * Estado independiente para la eliminaciÃ³n lÃ³gica.
   */
  const [deleting, setDeleting] = useState(false);

  const [saveError, setSaveError] = useState<string | null>(null);

  /* ---------------------------------------------------------------------- */
  /*                            VISTA PREVIA                                */
  /* ---------------------------------------------------------------------- */

  /*
   * Son operaciones pequeÃ±as, por lo que no necesitamos useMemo.
   * AsÃ­ evitamos memoizaciÃ³n manual innecesaria con React Compiler.
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
     * a un hexadecimal vÃ¡lido de seis caracteres.
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
       * updateCompany conserva automÃ¡ticamente:
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

  /* ---------------------------------------------------------------------- */
  /*                         ELIMINACIÃ“N LÃ“GICA                             */
  /* ---------------------------------------------------------------------- */

  const handleDelete = () => {
    if (!company || saving || deleting) {
      return;
    }

    Alert.alert(
      "Eliminar empresa",
      `Â¿Seguro que deseas eliminar ${company.name}? La empresa dejarÃ¡ de mostrarse en la aplicaciÃ³n y la eliminaciÃ³n quedarÃ¡ pendiente de sincronizaciÃ³n.`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            void confirmDelete();
          },
        },
      ],
    );
  };

  const confirmDelete = async () => {
    if (!company) {
      setSaveError("La empresa que intentas eliminar no existe.");
      return;
    }

    setDeleting(true);
    setSaveError(null);

    try {
      const deleted = await deleteCompany(company.id);

      if (!deleted) {
        throw new Error(`No fue posible eliminar la empresa ${company.id}.`);
      }

      router.replace("/empresas");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No fue posible eliminar la empresa.";

      console.error("Error eliminando empresa:", error);
      setSaveError(message);
    } finally {
      setDeleting(false);
    }
  };

  /*
   * Ruta invÃ¡lida o empresa inexistente.
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
              El registro solicitado no existe o ya no estÃ¡ disponible.
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
          {/* NAVEGACIÃ“N                                                   */}
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
                â€¹ Cancelar
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
              Modifica la informaciÃ³n y la identidad visual de la empresa.
            </Text>
          </View>

          {/* ============================================================ */}
          {/* LAYOUT PRINCIPAL                                             */}
          {/* ============================================================ */}

          {/*
           * MÃ“VIL
           *
           * InformaciÃ³n
           * â†“
           * Identidad visual
           * â†“
           * Vista previa
           *
           *
           * TABLET / DESKTOP
           *
           * â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
           * â”‚ InformaciÃ³n            â”‚ Identidad visual      â”‚
           * â”‚                        â”‚ Vista previa          â”‚
           * â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
           */}
          <View style={[styles.mainLayout, !isPhone && styles.mainLayoutWide]}>
            {/* ========================================================== */}
            {/* INFORMACIÃ“N DE LA EMPRESA                                  */}
            {/* ========================================================== */}

            <View
              style={[styles.formColumn, !isPhone && styles.formColumnWide]}
            >
              <SectionTitle
                title="InformaciÃ³n general"
                description="Modifica los datos principales de identificaciÃ³n."
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
                  label="RazÃ³n social"
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
                  label="TelÃ©fono"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />

                <Field
                  label="Correo electrÃ³nico"
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
                description="Personaliza cÃ³mo se identifica la empresa en UNIESAP."
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
                        {selected && <Text style={styles.check}>âœ“</Text>}
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
                  description="AsÃ­ se visualizarÃ¡n los cambios antes de guardarlos."
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
                      â€º
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
                disabled={saving || deleting}
              >
                {saving ? "Guardando..." : "Guardar cambios"}
              </AppButton>
            </View>

            <View style={styles.actionButton}>
              <AppButton
                variant="ghost"
                onPress={() => router.back()}
                disabled={saving || deleting}
              >
                Cancelar
              </AppButton>
            </View>
          </View>

          {/* ============================================================ */}
          {/* ZONA DE PELIGRO                                                */}
          {/* ============================================================ */}

          <View
            style={[
              styles.dangerZone,
              {
                borderColor: colors.error,
              },
            ]}
          >
            <View style={styles.dangerInfo}>
              <Text
                style={[
                  styles.dangerTitle,
                  {
                    color: colors.error,
                  },
                ]}
              >
                Eliminar empresa
              </Text>

              <Text
                style={[
                  styles.dangerDescription,
                  {
                    color: colors.textSecondary,
                  },
                ]}
              >
                La empresa dejarÃ¡ de mostrarse en UNIESAP. El registro se
                conservarÃ¡ localmente como eliminaciÃ³n pendiente para poder
                sincronizarla posteriormente.
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              disabled={saving || deleting}
              onPress={handleDelete}
              style={({ pressed }) => [
                styles.deleteButton,
                {
                  borderColor: colors.error,
                  opacity: saving || deleting ? 0.5 : pressed ? 0.7 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.deleteButtonText,
                  {
                    color: colors.error,
                  },
                ]}
              >
                {deleting ? "Eliminando..." : "Eliminar empresa"}
              </Text>
            </Pressable>
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
            Los cambios se guardan localmente y permanecen disponibles despuÃ©s
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
 * Campo reutilizable de ediciÃ³n.
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
 * Construye la ubicaciÃ³n utilizada por la vista previa.
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
 * todavÃ­a no existe un logotipo real.
 *
 * Ejemplos:
 *
 * AutoZone     â†’ AU
 * Empresa Demo â†’ ED
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
   * superior y el ancho mÃ¡ximo.
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
   * MÃ³vil:
   * una sola columna.
   */
  mainLayout: {
    width: "100%",
    gap: Spacing.xl,
  },

  /*
   * Tablet / Desktop:
   *
   * InformaciÃ³n | Identidad visual
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
   * mÃ¡s espacio horizontal.
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
   * MÃ³vil:
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

  /* -------------------------------------------------------------------- */
  /*                           ZONA DE PELIGRO                             */
  /* -------------------------------------------------------------------- */

  dangerZone: {
    width: "100%",
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderRadius: Radius.md,
    gap: Spacing.md,
  },

  dangerInfo: {
    width: "100%",
  },

  dangerTitle: {
    fontSize: FontSize.body,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },

  dangerDescription: {
    fontSize: FontSize.small,
    lineHeight: 20,
  },

  deleteButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderRadius: Radius.md,
  },

  deleteButtonText: {
    fontSize: FontSize.body,
    fontWeight: "700",
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
