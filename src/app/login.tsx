import { useState } from "react";

import { Pressable, StyleSheet, Text, View } from "react-native";

import { router } from "expo-router";

import { FontSize, Radius, Spacing } from "@/constants/theme";

import { AppButton } from "@/components/ui/AppButton";
import { AppTextInput } from "@/components/ui/AppTextInput";
import { Screen } from "@/components/ui/Screen";
import { useAppTheme } from "@/hooks/useAppTheme";

export default function LoginScreen() {
  const { colors } = useAppTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    router.replace("/dashboard");
  };

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <View
            style={[
              styles.logo,
              {
                backgroundColor: colors.primary,
              },
            ]}
          >
            <Text style={styles.logoText}>U</Text>
          </View>

          <Text
            style={[
              styles.brand,
              {
                color: colors.text,
              },
            ]}
          >
            UNIESAP
          </Text>

          <Text
            style={[
              styles.subtitle,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            Sistema de gestión e inspección empresarial
          </Text>
        </View>

        <View style={styles.form}>
          <View>
            <Text
              style={[
                styles.label,
                {
                  color: colors.text,
                },
              ]}
            >
              Correo electrónico
            </Text>

            <AppTextInput
              value={email}
              onChangeText={setEmail}
              placeholder="usuario@empresa.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View>
            <Text
              style={[
                styles.label,
                {
                  color: colors.text,
                },
              ]}
            >
              Contraseña
            </Text>

            <View style={styles.passwordWrapper}>
              <AppTextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Ingresa tu contraseña"
                secureTextEntry={!showPassword}
                style={styles.passwordInput}
              />

              <Pressable
                onPress={() => setShowPassword((value) => !value)}
                style={styles.showPasswordButton}
              >
                <Text
                  style={[
                    styles.showPasswordText,
                    {
                      color: colors.primary,
                    },
                  ]}
                >
                  {showPassword ? "Ocultar" : "Mostrar"}
                </Text>
              </Pressable>
            </View>
          </View>

          <Pressable style={styles.forgotPassword}>
            <Text
              style={[
                styles.forgotPasswordText,
                {
                  color: colors.primary,
                },
              ]}
            >
              ¿Olvidaste tu contraseña?
            </Text>
          </Pressable>

          <AppButton onPress={handleLogin}>Iniciar sesión</AppButton>
        </View>

        <View style={styles.footer}>
          <Text
            style={[
              styles.footerText,
              {
                color: colors.textMuted,
              },
            ]}
          >
            UNIESAP Mobile
          </Text>

          <Text
            style={[
              styles.version,
              {
                color: colors.textMuted,
              },
            ]}
          >
            Prototipo visual · v1.0
          </Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
  },

  header: {
    marginTop: Spacing.xxl,
  },

  logo: {
    width: 64,
    height: 64,

    borderRadius: Radius.lg,

    alignItems: "center",
    justifyContent: "center",

    marginBottom: Spacing.lg,
  },

  logoText: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "700",
  },

  brand: {
    fontSize: FontSize.h1,
    fontWeight: "700",

    marginBottom: Spacing.sm,
  },

  subtitle: {
    fontSize: FontSize.body,
    lineHeight: 24,

    maxWidth: 320,
  },

  form: {
    gap: Spacing.lg,
  },

  label: {
    fontSize: FontSize.small,
    fontWeight: "600",

    marginBottom: Spacing.sm,
  },

  passwordWrapper: {
    position: "relative",
  },

  passwordInput: {
    paddingRight: 92,
  },

  showPasswordButton: {
    position: "absolute",
    right: Spacing.md,
    top: 0,
    bottom: 0,

    justifyContent: "center",
  },

  showPasswordText: {
    fontSize: FontSize.small,
    fontWeight: "600",
  },

  forgotPassword: {
    alignSelf: "flex-end",
    marginTop: -Spacing.sm,
  },

  forgotPasswordText: {
    fontSize: FontSize.small,
    fontWeight: "500",
  },

  footer: {
    alignItems: "center",

    paddingBottom: Spacing.md,
  },

  footerText: {
    fontSize: FontSize.small,
    fontWeight: "600",

    marginBottom: Spacing.xs,
  },

  version: {
    fontSize: FontSize.caption,
  },
});
