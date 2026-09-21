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
import { ResponsiveGrid } from "@/components/ui/ResponsiveGrid";
import { Screen } from "@/components/ui/Screen";

import { FontSize, Radius, Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";
import { useResponsive } from "@/hooks/useResponsive";

import { updateUserProfile } from "@/repositories/userProfileRepository";

import { localAuthService } from "@/services/auth/localAuthService";

/*
 * ============================================================================
 * REGISTRO DE USUARIO
 * ============================================================================
 *
 * Primera versión del registro de UNIESAP.
 *
 * Flujo:
 *
 * formulario
 *     ↓
 * LocalAuthService
 *     ↓
 * AuthSession
 *     ↓
 * UserProfile
 *     ↓
 * Dashboard
 *
 * La autenticación local es temporal.
 *
 * La pantalla no depende de Google, Firebase o de la futura API UNIESAP.
 */
export default function RegisterScreen() {
  const { colors } = useAppTheme();

  const { isPhone } = useResponsive();

  /* ---------------------------------------------------------------------- */
  /* INFORMACIÓN PERSONAL                                                   */
  /* ---------------------------------------------------------------------- */

  const [firstName, setFirstName] = useState("");

  const [lastName, setLastName] = useState("");

  const [email, setEmail] = useState("");

  const [phone, setPhone] = useState("");

  /* ---------------------------------------------------------------------- */
  /* INFORMACIÓN PROFESIONAL                                                */
  /* ---------------------------------------------------------------------- */

  const [profession, setProfession] = useState("");

  const [position, setPosition] = useState("");

  /* ---------------------------------------------------------------------- */
  /* SEGURIDAD                                                              */
  /* ---------------------------------------------------------------------- */

  const [password, setPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  /* ---------------------------------------------------------------------- */
  /* ESTADO                                                                 */
  /* ---------------------------------------------------------------------- */

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);

  /*
   * Crea la identidad local, inicia sesión y alimenta
   * el perfil existente.
   */
  async function handleRegister() {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    setError(null);

    try {
      const session = await localAuthService.registerWithEmail({
        firstName,
        lastName,
        email,
        password,
        confirmPassword,
        phone,
        profession,
        position,
      });

      /*
       * UserProfile continúa siendo responsable exclusivamente
       * de información personal/profesional.
       */
      await updateUserProfile({
        firstName,
        lastName,

        email: session.user.email,

        phone,
        profession,
        position,
      });

      router.replace("/dashboard");
    } catch (registerError) {
      setError(getErrorMessage(registerError));
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
              {/* ========================================================== */}
              {/* BRANDING                                                   */}
              {/* ========================================================== */}

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
                  Crea tu cuenta para comenzar a gestionar inspecciones.
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
                    Tu cuenta permitirá identificar al inspector responsable de
                    capturas, evidencias y reportes.
                  </Text>
                ) : null}
              </View>

              {/* ========================================================== */}
              {/* REGISTRO                                                   */}
              {/* ========================================================== */}

              <View
                style={[styles.formColumn, !isPhone && styles.formColumnWide]}
              >
                <AppCard style={styles.registerCard}>
                  <View style={styles.formHeader}>
                    <Text
                      style={[
                        styles.formTitle,
                        {
                          color: colors.text,
                        },
                      ]}
                    >
                      Crear cuenta
                    </Text>

                    <Text
                      style={[
                        styles.formDescription,
                        {
                          color: colors.textSecondary,
                        },
                      ]}
                    >
                      Ingresa tus datos para crear tu cuenta de UNIESAP.
                    </Text>
                  </View>

                  {/* ====================================================== */}
                  {/* INFORMACIÓN PERSONAL                                   */}
                  {/* ====================================================== */}

                  <Text
                    style={[
                      styles.sectionTitle,
                      {
                        color: colors.text,
                      },
                    ]}
                  >
                    Información personal
                  </Text>

                  <ResponsiveGrid
                    phoneColumns={1}
                    tabletColumns={2}
                    desktopColumns={2}
                    gap={Spacing.md}
                  >
                    <Field
                      label="Nombre *"
                      value={firstName}
                      onChangeText={setFirstName}
                      autoCapitalize="words"
                    />

                    <Field
                      label="Apellidos *"
                      value={lastName}
                      onChangeText={setLastName}
                      autoCapitalize="words"
                    />
                  </ResponsiveGrid>

                  <View style={styles.fieldSpacing}>
                    <Field
                      label="Correo electrónico *"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>

                  <View style={styles.fieldSpacing}>
                    <Field
                      label="Teléfono"
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                    />
                  </View>

                  {/* ====================================================== */}
                  {/* SEGURIDAD                                              */}
                  {/* ====================================================== */}

                  <Text
                    style={[
                      styles.sectionTitle,
                      styles.sectionSpacing,
                      {
                        color: colors.text,
                      },
                    ]}
                  >
                    Seguridad
                  </Text>

                  <View style={styles.fieldSpacing}>
                    <Text
                      style={[
                        styles.label,
                        {
                          color: colors.text,
                        },
                      ]}
                    >
                      Contraseña *
                    </Text>

                    <View style={styles.passwordWrapper}>
                      <AppTextInput
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Mínimo 8 caracteres"
                        secureTextEntry={!showPassword}
                        style={styles.passwordInput}
                      />

                      <Pressable
                        onPress={() => setShowPassword((current) => !current)}
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

                  <View style={styles.fieldSpacing}>
                    <Field
                      label="Confirmar contraseña *"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showPassword}
                      placeholder="Repite tu contraseña"
                    />
                  </View>

                  {/* ====================================================== */}
                  {/* INFORMACIÓN PROFESIONAL                                */}
                  {/* ====================================================== */}

                  <Text
                    style={[
                      styles.sectionTitle,
                      styles.sectionSpacing,
                      {
                        color: colors.text,
                      },
                    ]}
                  >
                    Información profesional
                  </Text>

                  <Text
                    style={[
                      styles.optionalDescription,
                      {
                        color: colors.textMuted,
                      },
                    ]}
                  >
                    Estos datos son opcionales y podrás modificarlos después
                    desde tu perfil.
                  </Text>

                  <ResponsiveGrid
                    phoneColumns={1}
                    tabletColumns={2}
                    desktopColumns={2}
                    gap={Spacing.md}
                  >
                    <Field
                      label="Profesión"
                      value={profession}
                      onChangeText={setProfession}
                      autoCapitalize="sentences"
                    />

                    <Field
                      label="Cargo"
                      value={position}
                      onChangeText={setPosition}
                      autoCapitalize="sentences"
                    />
                  </ResponsiveGrid>

                  {/* ====================================================== */}
                  {/* ERROR                                                  */}
                  {/* ====================================================== */}

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

                  {/* ====================================================== */}
                  {/* ACCIONES                                               */}
                  {/* ====================================================== */}

                  <View style={styles.actions}>
                    <AppButton onPress={handleRegister} disabled={isSubmitting}>
                      {isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
                    </AppButton>

                    <View style={styles.loginLink}>
                      <Text
                        style={[
                          styles.loginQuestion,
                          {
                            color: colors.textSecondary,
                          },
                        ]}
                      >
                        ¿Ya tienes una cuenta?
                      </Text>

                      <Pressable
                        disabled={isSubmitting}
                        onPress={() => router.replace("/login")}
                        style={({ pressed }) => ({
                          opacity: pressed ? 0.7 : 1,
                        })}
                      >
                        <Text
                          style={[
                            styles.loginLinkText,
                            {
                              color: colors.primary,
                            },
                          ]}
                        >
                          Iniciar sesión
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                </AppCard>
              </View>
            </View>
          </ResponsiveContainer>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

/*
 * Campo reutilizable para el formulario.
 */
function Field({
  label,
  ...inputProps
}: React.ComponentProps<typeof AppTextInput> & {
  label: string;
}) {
  const { colors } = useAppTheme();

  return (
    <View>
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

      <AppTextInput {...inputProps} />
    </View>
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
    width: "100%",
    justifyContent: "center",

    gap: Spacing.xxl,

    paddingVertical: Spacing.xl,
  },

  mainLayoutWide: {
    flexDirection: "row",
    alignItems: "flex-start",

    gap: Spacing.xxxl,

    paddingTop: Spacing.xxxl,
  },

  brandColumn: {
    width: "100%",
  },

  brandColumnWide: {
    flex: 1,

    width: "auto",
    minWidth: 0,

    paddingTop: Spacing.xl,
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
    maxWidth: 440,

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
    flex: 1.35,

    width: "auto",
    minWidth: 0,

    maxWidth: 680,
  },

  registerCard: {
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

  sectionTitle: {
    fontSize: FontSize.cardTitle,
    fontWeight: "700",

    marginBottom: Spacing.md,
  },

  sectionSpacing: {
    marginTop: Spacing.xl,
  },

  optionalDescription: {
    fontSize: FontSize.caption,
    lineHeight: 18,

    marginTop: -Spacing.sm,
    marginBottom: Spacing.md,
  },

  fieldSpacing: {
    marginTop: Spacing.md,
  },

  label: {
    fontSize: FontSize.small,
    fontWeight: "600",

    marginBottom: Spacing.xs,
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

  errorBox: {
    borderWidth: 1,
    borderRadius: Radius.md,

    padding: Spacing.md,

    marginTop: Spacing.xl,
  },

  errorText: {
    fontSize: FontSize.small,
    lineHeight: 20,
  },

  actions: {
    gap: Spacing.lg,

    marginTop: Spacing.xl,
  },

  loginLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",

    gap: Spacing.xs,
  },

  loginQuestion: {
    fontSize: FontSize.small,
  },

  loginLinkText: {
    fontSize: FontSize.small,
    fontWeight: "700",
  },
});
