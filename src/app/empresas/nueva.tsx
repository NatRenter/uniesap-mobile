import { useMemo, useState } from "react";

import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { router } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { AppTextInput } from "@/components/ui/AppTextInput";
import { Screen } from "@/components/ui/Screen";

import { CompanyColors, FontSize, Radius, Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

export default function NewCompanyScreen() {
  const { colors } = useAppTheme();

  const [commercialName, setCommercialName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [rfc, setRfc] = useState("");

  const [state, setState] = useState("");
  const [city, setCity] = useState("");

  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [companyColor, setCompanyColor] = useState("#F97316");
  const [customColor, setCustomColor] = useState("#F97316");

  const previewName = commercialName.trim() || "Nombre de la empresa";

  const previewLocation = useMemo(() => {
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
  }, [city, state]);

  const initials = useMemo(() => {
    const words = previewName.trim().split(/\s+/).filter(Boolean);

    if (words.length === 1) {
      return words[0].slice(0, 2).toUpperCase();
    }

    return words
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  }, [previewName]);

  const handleCustomColor = () => {
    const normalizedColor = customColor.startsWith("#")
      ? customColor
      : `#${customColor}`;

    const validHex = /^#[0-9A-Fa-f]{6}$/.test(normalizedColor);

    if (validHex) {
      setCompanyColor(normalizedColor.toUpperCase());
      setCustomColor(normalizedColor.toUpperCase());
    }
  };

  const handleSave = () => {
    // Prototipo visual:
    // más adelante aquí guardaremos la empresa realmente.

    router.navigate("/empresas");
  };

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* HEADER */}

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

        {/* INFORMACIÓN GENERAL */}

        <SectionTitle
          title="Información general"
          description="Datos principales de identificación."
        />

        <View style={styles.formGroup}>
          <FieldLabel label="Nombre comercial" required />

          <AppTextInput
            value={commercialName}
            onChangeText={setCommercialName}
            placeholder="Ej. AutoZone"
          />
        </View>

        <View style={styles.formGroup}>
          <FieldLabel label="Razón social" />

          <AppTextInput
            value={legalName}
            onChangeText={setLegalName}
            placeholder="Razón social de la empresa"
          />
        </View>

        <View style={styles.formGroup}>
          <FieldLabel label="RFC" />

          <AppTextInput
            value={rfc}
            onChangeText={setRfc}
            placeholder="RFC"
            autoCapitalize="characters"
          />
        </View>

        {/* UBICACIÓN */}

        <View style={styles.sectionSpacing}>
          <SectionTitle
            title="Ubicación"
            description="Información correspondiente a esta empresa."
          />
        </View>

        <View style={styles.formGroup}>
          <FieldLabel label="Estado" required />

          <AppTextInput
            value={state}
            onChangeText={setState}
            placeholder="Ej. Guanajuato"
          />
        </View>

        <View style={styles.formGroup}>
          <FieldLabel label="Municipio o ciudad" required />

          <AppTextInput
            value={city}
            onChangeText={setCity}
            placeholder="Ej. San Luis de la Paz"
          />
        </View>

        {/* CONTACTO */}

        <View style={styles.sectionSpacing}>
          <SectionTitle
            title="Contacto"
            description="Información administrativa de referencia."
          />
        </View>

        <View style={styles.formGroup}>
          <FieldLabel label="Teléfono" />

          <AppTextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="Ej. 468 123 4567"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.formGroup}>
          <FieldLabel label="Correo electrónico" />

          <AppTextInput
            value={email}
            onChangeText={setEmail}
            placeholder="contacto@empresa.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* IDENTIDAD VISUAL */}

        <View style={styles.sectionSpacing}>
          <SectionTitle
            title="Identidad visual"
            description="Personaliza cómo se distinguirá esta empresa."
          />
        </View>

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
                  style={[
                    styles.colorOption,
                    {
                      backgroundColor: color,
                      borderColor: selected ? colors.text : "transparent",
                    },
                  ]}
                >
                  {selected && <Text style={styles.selectedColorCheck}>✓</Text>}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* COLOR PERSONALIZADO */}

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

        {/* LOGO */}

        <View style={styles.logoSection}>
          <FieldLabel label="Logotipo" />

          <Pressable
            style={[
              styles.logoUploader,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
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

        {/* PREVIEW */}

        <View style={styles.sectionSpacing}>
          <SectionTitle
            title="Vista previa"
            description="Así aparecerá la empresa en UNIESAP."
          />
        </View>

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

        {/* ACTIONS */}

        <View style={styles.actions}>
          <AppButton onPress={handleSave}>Guardar empresa</AppButton>

          <AppButton variant="ghost" onPress={() => router.back()}>
            Cancelar
          </AppButton>
        </View>

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
      </ScrollView>
    </Screen>
  );
}

/* -------------------------------------------------------------------------- */
/*                              SUBCOMPONENTES                                */
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
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
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
  },

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

  formGroup: {
    marginBottom: Spacing.lg,
  },

  label: {
    fontSize: FontSize.small,
    fontWeight: "600",
    marginBottom: Spacing.sm,
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

  selectedColorCheck: {
    color: "#FFFFFF",
    fontSize: FontSize.cardTitle,
    fontWeight: "700",
  },

  customColorCard: {
    marginBottom: Spacing.lg,
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
    borderRadius: Radius.md,
    borderWidth: 1,
  },

  customColorInput: {
    flex: 1,
  },

  logoSection: {
    marginTop: Spacing.md,
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

  previewCard: {
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
    fontSize: 32,
    marginLeft: Spacing.sm,
  },

  actions: {
    gap: Spacing.sm,

    marginTop: Spacing.xl,
  },

  prototypeNotice: {
    textAlign: "center",

    fontSize: FontSize.caption,

    marginTop: Spacing.lg,
  },
});
