import { useState } from "react";

import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { router, useLocalSearchParams } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { AppTextInput } from "@/components/ui/AppTextInput";
import { Screen } from "@/components/ui/Screen";

import { FontSize, Radius, Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

export default function CaptureScreen() {
  const { colors } = useAppTheme();

  const { id, propertyId, formId } = useLocalSearchParams<{
    id: string;
    propertyId: string;
    formId?: string;
  }>();

  const [responsible, setResponsible] = useState("");
  const [observations, setObservations] = useState("");
  const [hasRisk, setHasRisk] = useState<boolean | null>(null);

  const handleFinish = () => {
    router.replace({
      pathname: "/empresas/[id]/inmuebles/[propertyId]",
      params: {
        id,
        propertyId,
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

          <Text
            style={[
              styles.draft,
              {
                color: colors.warning,
              },
            ]}
          >
            Borrador
          </Text>
        </View>

        <Text
          style={[
            styles.overline,
            {
              color: colors.primary,
            },
          ]}
        >
          NUEVA INSPECCIÓN
        </Text>

        <Text
          style={[
            styles.title,
            {
              color: colors.text,
            },
          ]}
        >
          Análisis de riesgos
        </Text>

        <Text
          style={[
            styles.subtitle,
            {
              color: colors.textSecondary,
            },
          ]}
        >
          Captura de información del inmueble.
        </Text>

        <AppCard style={styles.contextCard}>
          <ContextRow label="Empresa" value={`ID ${id}`} />

          <Divider />

          <ContextRow label="Inmueble" value={`ID ${propertyId}`} />

          <Divider />

          <ContextRow label="Formulario" value={formId ?? "form-1"} />
        </AppCard>

        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text
              style={[
                styles.progressLabel,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              Progreso
            </Text>

            <Text
              style={[
                styles.progressValue,
                {
                  color: colors.text,
                },
              ]}
            >
              1 de 3
            </Text>
          </View>

          <View
            style={[
              styles.progressTrack,
              {
                backgroundColor: colors.surfaceSecondary,
              },
            ]}
          >
            <View
              style={[
                styles.progressBar,
                {
                  backgroundColor: colors.primary,
                },
              ]}
            />
          </View>
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
            1. Información general
          </Text>

          <Text
            style={[
              styles.label,
              {
                color: colors.text,
              },
            ]}
          >
            Responsable de la inspección
          </Text>

          <AppTextInput
            value={responsible}
            onChangeText={setResponsible}
            placeholder="Nombre del responsable"
          />
        </View>

        <View style={styles.section}>
          <Text
            style={[
              styles.label,
              {
                color: colors.text,
              },
            ]}
          >
            ¿Se identificaron condiciones de riesgo?
          </Text>

          <View style={styles.options}>
            <SelectionButton
              label="Sí"
              selected={hasRisk === true}
              onPress={() => setHasRisk(true)}
            />

            <SelectionButton
              label="No"
              selected={hasRisk === false}
              onPress={() => setHasRisk(false)}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text
            style={[
              styles.label,
              {
                color: colors.text,
              },
            ]}
          >
            Observaciones
          </Text>

          <AppTextInput
            value={observations}
            onChangeText={setObservations}
            placeholder="Describe los hallazgos..."
            multiline
            numberOfLines={5}
            style={styles.textArea}
          />
        </View>

        <View style={styles.section}>
          <Text
            style={[
              styles.label,
              {
                color: colors.text,
              },
            ]}
          >
            Evidencia fotográfica
          </Text>

          <Pressable
            style={[
              styles.photoBox,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.photoIcon,
                {
                  color: colors.primary,
                },
              ]}
            >
              +
            </Text>

            <Text
              style={[
                styles.photoTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              Agregar fotografía
            </Text>

            <Text
              style={[
                styles.photoDescription,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              Captura simulada para el prototipo.
            </Text>
          </Pressable>
        </View>

        <View style={styles.actions}>
          <AppButton onPress={handleFinish}>Finalizar inspección</AppButton>

          <AppButton variant="secondary" onPress={() => router.back()}>
            Guardar borrador
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
          Prototipo visual: la información todavía no se envía a Kobo.
        </Text>
      </ScrollView>
    </Screen>
  );
}

function SelectionButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.selectionButton,
        {
          backgroundColor: selected ? colors.primarySoft : colors.surface,

          borderColor: selected ? colors.primary : colors.border,
        },
      ]}
    >
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
              styles.radioSelected,
              {
                backgroundColor: colors.primary,
              },
            ]}
          />
        )}
      </View>

      <Text
        style={[
          styles.selectionLabel,
          {
            color: colors.text,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function ContextRow({ label, value }: { label: string; value: string }) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.contextRow}>
      <Text
        style={[
          styles.contextLabel,
          {
            color: colors.textMuted,
          },
        ]}
      >
        {label}
      </Text>

      <Text
        style={[
          styles.contextValue,
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

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },

  topNavigation: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    marginBottom: Spacing.xl,
  },

  backText: {
    fontSize: FontSize.small,
    fontWeight: "600",
  },

  draft: {
    fontSize: FontSize.caption,
    fontWeight: "700",
  },

  overline: {
    fontSize: FontSize.caption,
    fontWeight: "700",
    letterSpacing: 1,

    marginBottom: Spacing.sm,
  },

  title: {
    fontSize: FontSize.h1,
    fontWeight: "700",

    marginBottom: Spacing.sm,
  },

  subtitle: {
    fontSize: FontSize.body,

    marginBottom: Spacing.xl,
  },

  contextCard: {
    marginBottom: Spacing.xl,
  },

  contextRow: {
    paddingVertical: Spacing.xs,
  },

  contextLabel: {
    fontSize: FontSize.caption,

    marginBottom: Spacing.xs,
  },

  contextValue: {
    fontSize: FontSize.small,
    fontWeight: "600",
  },

  divider: {
    height: 1,
    marginVertical: Spacing.sm,
  },

  progressSection: {
    marginBottom: Spacing.xl,
  },

  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",

    marginBottom: Spacing.sm,
  },

  progressLabel: {
    fontSize: FontSize.small,
  },

  progressValue: {
    fontSize: FontSize.small,
    fontWeight: "600",
  },

  progressTrack: {
    height: 8,

    borderRadius: Radius.full,

    overflow: "hidden",
  },

  progressBar: {
    width: "33%",
    height: "100%",

    borderRadius: Radius.full,
  },

  section: {
    marginBottom: Spacing.xl,
  },

  sectionTitle: {
    fontSize: FontSize.cardTitle,
    fontWeight: "700",

    marginBottom: Spacing.lg,
  },

  label: {
    fontSize: FontSize.small,
    fontWeight: "600",

    marginBottom: Spacing.sm,
  },

  options: {
    flexDirection: "row",
    gap: Spacing.md,
  },

  selectionButton: {
    flex: 1,

    minHeight: 56,

    flexDirection: "row",
    alignItems: "center",

    padding: Spacing.md,

    borderWidth: 1,
    borderRadius: Radius.md,
  },

  radio: {
    width: 20,
    height: 20,

    borderRadius: Radius.full,
    borderWidth: 2,

    alignItems: "center",
    justifyContent: "center",

    marginRight: Spacing.sm,
  },

  radioSelected: {
    width: 10,
    height: 10,

    borderRadius: Radius.full,
  },

  selectionLabel: {
    fontSize: FontSize.body,
    fontWeight: "600",
  },

  textArea: {
    minHeight: 120,
    textAlignVertical: "top",

    paddingTop: Spacing.md,
  },

  photoBox: {
    minHeight: 150,

    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: Radius.lg,

    alignItems: "center",
    justifyContent: "center",

    padding: Spacing.lg,
  },

  photoIcon: {
    fontSize: 32,

    marginBottom: Spacing.sm,
  },

  photoTitle: {
    fontSize: FontSize.body,
    fontWeight: "600",

    marginBottom: Spacing.xs,
  },

  photoDescription: {
    fontSize: FontSize.caption,
  },

  actions: {
    gap: Spacing.sm,
  },

  prototypeNotice: {
    fontSize: FontSize.caption,
    textAlign: "center",

    marginTop: Spacing.lg,
  },
});
