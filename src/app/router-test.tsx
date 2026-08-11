import { StyleSheet, Text } from "react-native";

import { Screen } from "@/components/ui//Screen";
import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { AppTextInput } from "@/components/ui/AppTextInput";
import { colors, spacing, typography } from "@/theme";

export default function RouterTestScreen() {
  return (
    <Screen style={styles.container}>
      <Text style={styles.title}>UNIESAP Mobile</Text>

      <AppCard style={styles.card}>
        <Text style={styles.cardTitle}>Componentes base</Text>

        <AppTextInput placeholder="Nombre del usuario" />

        <AppButton
          onPress={() => {
            console.log("Botón funcionando");
          }}
        >
          Continuar
        </AppButton>
      </AppCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
  },

  title: {
    marginBottom: spacing.lg,
    color: colors.primary,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    textAlign: "center",
  },

  card: {
    gap: spacing.md,
  },

  cardTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
});
