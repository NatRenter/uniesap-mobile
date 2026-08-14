import { useMemo, useState } from "react";

import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { router, useLocalSearchParams } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { AppTextInput } from "@/components/ui/AppTextInput";
import { Screen } from "@/components/ui/Screen";

import { CompanyColors, FontSize, Radius, Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

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

  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const company = companies[id as keyof typeof companies] ?? companies["1"];

  const [commercialName, setCommercialName] = useState<string>(company.name);

  const [legalName, setLegalName] = useState<string>(company.legalName);

  const [state, setState] = useState<string>(company.state);

  const [city, setCity] = useState<string>(company.city);

  const [companyColor, setCompanyColor] = useState<string>(company.color);

  const [customColor, setCustomColor] = useState<string>(company.color);

  const previewLocation = useMemo(() => {
    return `${city}, ${state}`;
  }, [city, state]);

  const initials = useMemo(() => {
    const words = commercialName.trim().split(/\s+/).filter(Boolean);

    if (words.length === 1) {
      return words[0].slice(0, 2).toUpperCase();
    }

    return words
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  }, [commercialName]);

  const applyCustomColor = () => {
    const normalizedColor = customColor.startsWith("#")
      ? customColor
      : `#${customColor}`;

    if (/^#[0-9A-Fa-f]{6}$/.test(normalizedColor)) {
      setCompanyColor(normalizedColor.toUpperCase());
      setCustomColor(normalizedColor.toUpperCase());
    }
  };

  const handleSave = () => {
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
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
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
        </View>

        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
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
                  style={[
                    styles.colorOption,
                    {
                      backgroundColor: color,
                      borderColor: selected ? colors.text : "transparent",
                    },
                  ]}
                >
                  {selected && <Text style={styles.check}>✓</Text>}
                </Pressable>
              );
            })}
          </View>

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
                style={styles.customInput}
              />
            </View>

            <AppButton variant="secondary" onPress={applyCustomColor}>
              Aplicar color
            </AppButton>
          </AppCard>
        </View>

        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: colors.text,
              },
            ]}
          >
            Vista previa
          </Text>

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
                >
                  {commercialName}
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
              </View>
            </View>
          </AppCard>
        </View>

        <View style={styles.actions}>
          <AppButton onPress={handleSave}>Guardar cambios</AppButton>

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
          Prototipo visual: los cambios todavía no se almacenan.
        </Text>
      </ScrollView>
    </Screen>
  );
}

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

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },

  topNavigation: {
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
    marginBottom: Spacing.xl,
  },

  section: {
    marginBottom: Spacing.xl,
  },

  sectionTitle: {
    fontSize: FontSize.cardTitle,
    fontWeight: "700",
    marginBottom: Spacing.lg,
  },

  field: {
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
    marginBottom: Spacing.lg,
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
    marginBottom: Spacing.md,
  },

  customTitle: {
    fontSize: FontSize.body,
    fontWeight: "700",
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
    borderRadius: Radius.md,
    borderWidth: 1,
  },

  customInput: {
    flex: 1,
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

  previewInfo: {
    flex: 1,
  },

  previewName: {
    fontSize: FontSize.cardTitle,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },

  previewLocation: {
    fontSize: FontSize.small,
  },

  actions: {
    gap: Spacing.sm,
  },

  prototypeNotice: {
    textAlign: "center",
    fontSize: FontSize.caption,
    marginTop: Spacing.lg,
  },
});
