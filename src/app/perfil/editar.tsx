import { useState } from "react";

import {
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { router } from "expo-router";

import { ContextHeader } from "@/components/navigation/ContextHeader";
import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { AppTextInput } from "@/components/ui/AppTextInput";
import { ResponsiveContainer } from "@/components/ui/ResponsiveContainer";
import { ResponsiveGrid } from "@/components/ui/ResponsiveGrid";
import { Screen } from "@/components/ui/Screen";

import { FontSize, Radius, Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

import {
    getUserProfile,
    updateUserProfile,
} from "@/repositories/userProfileRepository";

import { pickUserProfilePhoto } from "@/services/userProfilePhotoService";

/*
 * ============================================================================
 * EDITAR PERFIL
 * ============================================================================
 *
 * Permite modificar:
 *
 * - fotografía;
 * - nombre;
 * - apellidos;
 * - correo;
 * - teléfono;
 * - profesión;
 * - cargo.
 *
 * La información se guarda mediante UserProfileRepository,
 * por lo que funciona igual en Native y Web.
 */
export default function EditProfileScreen() {
  const { colors } = useAppTheme();

  const profile = getUserProfile();

  const [firstName, setFirstName] = useState(profile.firstName);

  const [lastName, setLastName] = useState(profile.lastName);

  const [email, setEmail] = useState(profile.email);

  const [phone, setPhone] = useState(profile.phone ?? "");

  const [profession, setProfession] = useState(profile.profession ?? "");

  const [position, setPosition] = useState(profile.position ?? "");

  const [photoUri, setPhotoUri] = useState<string | undefined>(
    profile.photoUri,
  );

  const [isSaving, setIsSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const initials = createInitials(firstName, lastName);

  /*
   * Abre la galería y conserva la URI
   * de la fotografía seleccionada.
   */
  async function handleSelectPhoto() {
    try {
      setError(null);

      const selectedUri = await pickUserProfilePhoto();

      if (!selectedUri) {
        return;
      }

      setPhotoUri(selectedUri);
    } catch (selectionError) {
      setError(getErrorMessage(selectionError));
    }
  }

  /*
   * Validación sencilla antes de guardar.
   *
   * Roles y otras reglas de usuario todavía no se aplican.
   */
  async function handleSave() {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setError("Nombre, apellidos y correo son obligatorios.");

      return;
    }

    setIsSaving(true);

    setError(null);

    try {
      await updateUserProfile({
        firstName,
        lastName,
        email,
        phone,
        profession,
        position,
        photoUri,
      });

      router.navigate("/perfil");
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ResponsiveContainer>
          <ContextHeader
            backLabel="Perfil"
            onBack={() => router.navigate("/perfil")}
            contextLabel="Usuario"
            title="Editar perfil"
            subtitle="Actualiza tu información personal, profesional y fotografía."
          />

          {/* ============================================================ */}
          {/* FOTO                                                         */}
          {/* ============================================================ */}

          <AppCard style={styles.photoCard}>
            <View style={styles.photoLayout}>
              {photoUri ? (
                <Image
                  source={{
                    uri: photoUri,
                  }}
                  style={styles.avatar}
                />
              ) : (
                <View
                  style={[
                    styles.avatar,
                    styles.avatarFallback,
                    {
                      backgroundColor: colors.primarySoft,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.avatarText,
                      {
                        color: colors.primary,
                      },
                    ]}
                  >
                    {initials}
                  </Text>
                </View>
              )}

              <View style={styles.photoInformation}>
                <Text
                  style={[
                    styles.photoTitle,
                    {
                      color: colors.text,
                    },
                  ]}
                >
                  Fotografía de perfil
                </Text>

                <Text
                  style={[
                    styles.photoDescription,
                    {
                      color: colors.textSecondary,
                    },
                  ]}
                >
                  Selecciona una imagen cuadrada o recórtala durante la
                  selección.
                </Text>

                <View style={styles.photoActions}>
                  <AppButton variant="secondary" onPress={handleSelectPhoto}>
                    Cambiar fotografía
                  </AppButton>

                  {photoUri ? (
                    <Pressable
                      onPress={() => setPhotoUri(undefined)}
                      style={({ pressed }) => ({
                        opacity: pressed ? 0.6 : 1,
                      })}
                    >
                      <Text
                        style={[
                          styles.removePhoto,
                          {
                            color: colors.error,
                          },
                        ]}
                      >
                        Quitar fotografía
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            </View>
          </AppCard>

          {/* ============================================================ */}
          {/* FORMULARIO RESPONSIVE                                        */}
          {/* ============================================================ */}

          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              Información
            </Text>

            <ResponsiveGrid
              phoneColumns={1}
              tabletColumns={2}
              desktopColumns={2}
              gap={Spacing.md}
            >
              <Field
                label="Nombre"
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
              />

              <Field
                label="Apellidos"
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
              />

              <Field
                label="Correo"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <Field
                label="Teléfono"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />

              <Field
                label="Profesión"
                value={profession}
                onChangeText={setProfession}
                autoCapitalize="sentences"
              />

              <Field
                label="Cargo en la empresa"
                value={position}
                onChangeText={setPosition}
                autoCapitalize="sentences"
              />
            </ResponsiveGrid>
          </View>

          {/* ============================================================ */}
          {/* ERROR                                                        */}
          {/* ============================================================ */}

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

          {/* ============================================================ */}
          {/* ACCIONES                                                     */}
          {/* ============================================================ */}

          <View style={styles.actions}>
            <View style={styles.actionButton}>
              <AppButton onPress={handleSave} disabled={isSaving}>
                {isSaving ? "Guardando..." : "Guardar cambios"}
              </AppButton>
            </View>

            <View style={styles.actionButton}>
              <AppButton
                variant="ghost"
                disabled={isSaving}
                onPress={() => router.navigate("/perfil")}
              >
                Cancelar
              </AppButton>
            </View>
          </View>
        </ResponsiveContainer>
      </ScrollView>
    </Screen>
  );
}

/*
 * Campo de formulario reutilizable.
 */
function Field({
  label,
  ...inputProps
}: React.ComponentProps<typeof AppTextInput> & {
  label: string;
}) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.field}>
      <Text
        style={[
          styles.fieldLabel,
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

function createInitials(firstName: string, lastName: string): string {
  const first = firstName.trim().charAt(0);

  const last = lastName.trim().charAt(0);

  return `${first}${last}`.toUpperCase() || "U";
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

/*
 * ============================================================================
 * ESTILOS
 * ============================================================================
 *
 * ResponsiveGrid organiza campos:
 *
 * celular → 1 columna
 * tablet  → 2 columnas
 * web     → 2 columnas
 */
const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: Spacing.xxxl,
  },

  photoCard: {
    width: "100%",

    marginBottom: Spacing.xl,
  },

  photoLayout: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",

    gap: Spacing.lg,
  },

  avatar: {
    width: 108,
    height: 108,

    flexShrink: 0,

    borderRadius: Radius.full,
  },

  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    fontSize: FontSize.h2,
    fontWeight: "800",
  },

  photoInformation: {
    flex: 1,
    minWidth: 240,
  },

  photoTitle: {
    fontSize: FontSize.cardTitle,
    fontWeight: "700",

    marginBottom: Spacing.xs,
  },

  photoDescription: {
    maxWidth: 560,

    fontSize: FontSize.small,
    lineHeight: 20,

    marginBottom: Spacing.md,
  },

  photoActions: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",

    gap: Spacing.md,
  },

  removePhoto: {
    fontSize: FontSize.small,
    fontWeight: "700",
  },

  section: {
    marginBottom: Spacing.xl,
  },

  sectionTitle: {
    fontSize: FontSize.cardTitle,
    fontWeight: "700",

    marginBottom: Spacing.md,
  },

  field: {
    width: "100%",
  },

  fieldLabel: {
    fontSize: FontSize.small,
    fontWeight: "600",

    marginBottom: Spacing.xs,
  },

  errorBox: {
    borderWidth: 1,
    borderRadius: Radius.md,

    padding: Spacing.md,

    marginBottom: Spacing.lg,
  },

  errorText: {
    fontSize: FontSize.small,
    lineHeight: 20,
  },

  actions: {
    flexDirection: "row",
    flexWrap: "wrap",

    gap: Spacing.md,
  },

  actionButton: {
    minWidth: 180,
  },
});
