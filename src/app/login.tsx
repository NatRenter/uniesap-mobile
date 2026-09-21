import { useState } from "react";

import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { router } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { AppTextInput } from "@/components/ui/AppTextInput";
import { ResponsiveContainer } from "@/components/ui/ResponsiveContainer";
import { Screen } from "@/components/ui/Screen";

import { FontSize, Radius, Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";
import { useResponsive } from "@/hooks/useResponsive";

import { localAuthService } from "@/services/auth/localAuthService";

/*
 * ============================================================================
 * LOGIN
 * ============================================================================
 *
 * La pantalla ya no decide cómo funciona la autenticación.
 *
 * Solamente envía las credenciales al AuthService.
 *
 * Actualmente:
 *
 * Login
 *   ↓
 * LocalAuthService
 *
 * Futuro:
 *
 * Login
 *   ↓
 * AuthService
 *   ↓
 * API UNIESAP / proveedor real
 */
export default function LoginScreen() {
  const { colors } = useAppTheme();

  const { isPhone } = useResponsive();

  /* ---------------------------------------------------------------------- */
  /* FORMULARIO                                                             */
  /* ---------------------------------------------------------------------- */

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  /* ---------------------------------------------------------------------- */
  /* ESTADO                                                                 */
  /* ---------------------------------------------------------------------- */

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);

  /* ---------------------------------------------------------------------- */
  /* LOGIN                                                                  */
  /* ---------------------------------------------------------------------- */

  async function handleLogin() {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    setError(null);

    try {
      await localAuthService.loginWithEmail({
        email,
        password,
      });

      router.replace("/dashboard");
    } catch (loginError) {
      setError(getErrorMessage(loginError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Screen padded={false}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ResponsiveContainer>
            <View
              style={[styles.mainLayout, !isPhone && styles.mainLayoutWide]}
            >
              {/* ======================================================== */}
              {/* BRANDING                                                 */}
              {/* ======================================================== */}

              <View
                style={[styles.brandColumn, !isPhone && styles.brandColumnWide]}
              >
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

                {!isPhone ? (
                  <Text
                    style={[
                      styles.brandDescription,
                      {
                        color: colors.textMuted,
                      },
                    ]}
                  >
                    Gestiona empresas, inmuebles, inspecciones, evidencias y
                    reportes desde una sola plataforma.
                  </Text>
                ) : null}
              </View>

              {/* ======================================================== */}
              {/* FORMULARIO                                               */}
              {/* ======================================================== */}

              <View
                style={[styles.formColumn, !isPhone && styles.formColumnWide]}
              >
                <AppCard style={styles.loginCard}>
                  <View style={styles.formHeader}>
                    <Text
                      style={[
                        styles.formTitle,
                        {
                          color: colors.text,
                        },
                      ]}
                    >
                      Iniciar sesión
                    </Text>

                    <Text
                      style={[
                        styles.formDescription,
                        {
                          color: colors.textSecondary,
                        },
                      ]}
                    >
                      Ingresa tus credenciales para acceder a UNIESAP.
                    </Text>
                  </View>

                  <View style={styles.form}>
                    {/* CORREO */}

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

                    {/* CONTRASEÑA */}

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
                          style={({ pressed }) => [
                            styles.showPasswordButton,
                            {
                              opacity: pressed ? 0.7 : 1,
                            },
                          ]}
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

                    {/* RECUPERAR CONTRASEÑA */}

                    <Pressable
                      disabled={isSubmitting}
                      style={({ pressed }) => [
                        styles.forgotPassword,
                        {
                          opacity: pressed ? 0.7 : 1,
                        },
                      ]}
                    >
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

                    {/* ERROR */}

                    {error ? (
                      <View
                        style={[
                          styles.errorBox,
                          {
                            borderColor: colors.error,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.errorText,
                            {
                              color: colors.error,
                            },
                          ]}
                        >
                          {error}
                        </Text>
                      </View>
                    ) : null}

                    {/* LOGIN */}

                    <AppButton onPress={handleLogin} disabled={isSubmitting}>
                      {isSubmitting ? "Iniciando sesión..." : "Iniciar sesión"}
                    </AppButton>

                    {/* GOOGLE */}

                    <View style={styles.separator}>
                      <View
                        style={[
                          styles.separatorLine,
                          {
                            backgroundColor: colors.divider,
                          },
                        ]}
                      />

                      <Text
                        style={[
                          styles.separatorText,
                          {
                            color: colors.textMuted,
                          },
                        ]}
                      >
                        o
                      </Text>

                      <View
                        style={[
                          styles.separatorLine,
                          {
                            backgroundColor: colors.divider,
                          },
                        ]}
                      />
                    </View>

                    <AppButton variant="secondary" disabled>
                      Continuar con Google · Próximamente
                    </AppButton>

                    {/* REGISTRO */}

                    <View style={styles.registerRow}>
                      <Text
                        style={[
                          styles.registerQuestion,
                          {
                            color: colors.textSecondary,
                          },
                        ]}
                      >
                        ¿No tienes una cuenta?
                      </Text>

                      <Pressable
                        disabled={isSubmitting}
                        onPress={() => router.navigate("/registro")}
                        style={({ pressed }) => ({
                          opacity: pressed ? 0.7 : 1,
                        })}
                      >
                        <Text
                          style={[
                            styles.registerLink,
                            {
                              color: colors.primary,
                            },
                          ]}
                        >
                          Crear cuenta
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                </AppCard>
              </View>
            </View>

            {/* ========================================================== */}
            {/* FOOTER                                                     */}
            {/* ========================================================== */}

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
                Autenticación en desarrollo · v1.0
              </Text>
            </View>
          </ResponsiveContainer>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Ocurrió un error desconocido.";
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: Spacing.xl,
  },

  mainLayout: {
    flex: 1,

    width: "100%",

    justifyContent: "center",

    gap: Spacing.xxl,

    paddingVertical: Spacing.xl,
  },

  mainLayoutWide: {
    flexDirection: "row",

    alignItems: "center",

    gap: Spacing.xxxl,

    minHeight: 620,
  },

  brandColumn: {
    width: "100%",
  },

  brandColumnWide: {
    flex: 1,

    width: "auto",

    minWidth: 0,
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
    maxWidth: 420,

    fontSize: FontSize.body,

    lineHeight: 24,
  },

  brandDescription: {
    maxWidth: 460,

    fontSize: FontSize.small,

    lineHeight: 21,

    marginTop: Spacing.lg,
  },

  formColumn: {
    width: "100%",
  },

  formColumnWide: {
    flex: 1,

    width: "auto",

    minWidth: 0,

    maxWidth: 480,
  },

  loginCard: {
    width: "100%",
  },

  formHeader: {
    marginBottom: Spacing.xl,
  },

  formTitle: {
    fontSize: FontSize.h2,

    fontWeight: "700",

    marginBottom: Spacing.sm,
  },

  formDescription: {
    fontSize: FontSize.small,

    lineHeight: 20,
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

  errorBox: {
    borderWidth: 1,

    borderRadius: Radius.md,

    padding: Spacing.md,
  },

  errorText: {
    fontSize: FontSize.small,

    lineHeight: 20,
  },

  separator: {
    flexDirection: "row",

    alignItems: "center",

    gap: Spacing.md,
  },

  separatorLine: {
    flex: 1,

    height: 1,
  },

  separatorText: {
    fontSize: FontSize.caption,
  },

  registerRow: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    flexWrap: "wrap",

    gap: Spacing.xs,
  },

  registerQuestion: {
    fontSize: FontSize.small,
  },

  registerLink: {
    fontSize: FontSize.small,

    fontWeight: "700",
  },

  footer: {
    alignItems: "center",

    paddingVertical: Spacing.md,
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
