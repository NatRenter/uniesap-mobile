import { StyleSheet, Text } from "react-native";

import { Screen } from "@/components/ui//Screen";
import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { AppTextInput } from "@/components/ui/AppTextInput";
import { colors, spacing, typography } from "@/theme";

export default function HomeScreen() {
  return (
    <Screen style={styles.container}>
      <Text style={styles.logo}>UNIESAP</Text>

      <Text style={styles.subtitle}>Sistema Integral de Inspecciones</Text>

      <AppCard style={styles.card}>
        <AppTextInput
          placeholder="Correo electrónico"
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <AppTextInput placeholder="Contraseña" secureTextEntry />

        <AppButton>Iniciar sesión</AppButton>

        <AppButton style={styles.secondaryButton}>
          Continuar sin conexión
        </AppButton>
      </AppCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
  },

  logo: {
    textAlign: "center",
    color: colors.primary,
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
  },

  subtitle: {
    textAlign: "center",
    marginBottom: spacing.xl,
    color: colors.textSecondary,
    fontSize: typography.fontSize.md,
  },

  card: {
    gap: spacing.md,
  },

  secondaryButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
  },
});
