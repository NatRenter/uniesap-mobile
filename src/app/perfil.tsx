import { useEffect, useState } from "react";

import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { router } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { ResponsiveContainer } from "@/components/ui/ResponsiveContainer";
import { ResponsiveGrid } from "@/components/ui/ResponsiveGrid";
import { Screen } from "@/components/ui/Screen";

import { FontSize, Radius, Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

import {
  getUserProfile,
  subscribeToUserProfile,
} from "@/repositories/userProfileRepository";

import type { UserProfile } from "@/types/userProfile";

/*
 * ============================================================================
 * PERFIL
 * ============================================================================
 *
 * Muestra información personal y profesional persistida.
 *
 * La edición se realiza en /perfil/editar para mantener
 * esta pantalla limpia y fácil de consultar.
 *
 * Roles y permisos todavía NO forman parte de esta fase.
 */
export default function ProfileScreen() {
  const { colors } = useAppTheme();

  const [profile, setProfile] = useState<UserProfile>(getUserProfile());

  /*
   * Escucha cambios del repositorio.
   *
   * Cuando Editar perfil guarda información nueva,
   * esta pantalla se actualiza automáticamente.
   */
  useEffect(() => {
    return subscribeToUserProfile(setProfile);
  }, []);

  const fullName = `${profile.firstName} ${profile.lastName}`.trim();

  const initials = createInitials(profile.firstName, profile.lastName);

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ResponsiveContainer>
          {/* ============================================================ */}
          {/* IDENTIDAD                                                    */}
          {/* ============================================================ */}

          <View style={styles.identityCard}>
            {profile.photoUri ? (
              <Image
                source={{
                  uri: profile.photoUri,
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

            <View style={styles.identity}>
              <Text
                style={[
                  styles.name,
                  {
                    color: colors.text,
                  },
                ]}
              >
                {fullName}
              </Text>

              <Text
                style={[
                  styles.position,
                  {
                    color: colors.textSecondary,
                  },
                ]}
              >
                {profile.position ?? "Cargo sin definir"}
              </Text>

              <Text
                style={[
                  styles.email,
                  {
                    color: colors.textMuted,
                  },
                ]}
              >
                {profile.email}
              </Text>
            </View>

            <View style={styles.editButton}>
              <AppButton
                variant="secondary"
                onPress={() => router.navigate("/perfil/editar")}
              >
                Editar perfil
              </AppButton>
            </View>
          </View>

          {/* ============================================================ */}
          {/* INFORMACIÓN                                                  */}
          {/* ============================================================ */}

          <ResponsiveGrid
            phoneColumns={1}
            tabletColumns={2}
            desktopColumns={2}
            gap={Spacing.md}
          >
            <ProfileSection
              title="Información personal"
              rows={[
                {
                  label: "Nombre",
                  value: profile.firstName,
                },
                {
                  label: "Apellidos",
                  value: profile.lastName,
                },
                {
                  label: "Correo",
                  value: profile.email,
                },
                {
                  label: "Teléfono",
                  value: profile.phone ?? "Sin definir",
                },
              ]}
            />

            <ProfileSection
              title="Información profesional"
              rows={[
                {
                  label: "Profesión",
                  value: profile.profession ?? "Sin definir",
                },
                {
                  label: "Cargo",
                  value: profile.position ?? "Sin definir",
                },
              ]}
            />
          </ResponsiveGrid>

          {/* ============================================================ */}
          {/* APLICACIÓN                                                   */}
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
              Aplicación
            </Text>

            <AppCard padded={false}>
              <SettingsRow
                title="Apariencia"
                subtitle="Preferencias visuales de UNIESAP"
              />

              <Divider />

              <SettingsRow
                title="Sincronización"
                subtitle="Estado general de carga"
                status="Sin errores"
                statusColor={colors.success}
              />

              <Divider />

              <SettingsRow
                title="Opciones de desarrollador"
                subtitle="Diagnóstico avanzado y herramientas internas"
                onPress={() => router.navigate("/perfil/desarrollador")}
              />
            </AppCard>
          </View>

          {/* ============================================================ */}
          {/* SESIÓN                                                       */}
          {/* ============================================================ */}

          <View style={styles.section}>
            <Pressable
              onPress={() => router.replace("/login")}
              style={({ pressed }) => [
                styles.logoutButton,
                {
                  borderColor: colors.error,

                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.logoutText,
                  {
                    color: colors.error,
                  },
                ]}
              >
                Cerrar sesión
              </Text>
            </Pressable>
          </View>
        </ResponsiveContainer>
      </ScrollView>
    </Screen>
  );
}

/*
 * Tarjeta reutilizable de información.
 */
function ProfileSection({
  title,
  rows,
}: {
  title: string;

  rows: {
    label: string;
    value: string;
  }[];
}) {
  const { colors } = useAppTheme();

  return (
    <AppCard style={styles.profileSection}>
      <Text
        style={[
          styles.profileSectionTitle,
          {
            color: colors.text,
          },
        ]}
      >
        {title}
      </Text>

      {rows.map((row) => (
        <View key={row.label} style={styles.profileRow}>
          <Text
            style={[
              styles.profileLabel,
              {
                color: colors.textMuted,
              },
            ]}
          >
            {row.label}
          </Text>

          <Text
            style={[
              styles.profileValue,
              {
                color: colors.text,
              },
            ]}
          >
            {row.value}
          </Text>
        </View>
      ))}
    </AppCard>
  );
}

/*
 * Fila reutilizable para preferencias.
 */
function SettingsRow({
  title,
  subtitle,
  status,
  statusColor,
  onPress,
}: {
  title: string;
  subtitle: string;
  status?: string;
  statusColor?: string;
  onPress?: () => void;
}) {
  const { colors } = useAppTheme();

  const content = (
    <View style={styles.settingsRow}>
      <View style={styles.settingsText}>
        <Text
          style={[
            styles.settingsTitle,
            {
              color: colors.text,
            },
          ]}
        >
          {title}
        </Text>

        <Text
          style={[
            styles.settingsSubtitle,
            {
              color: colors.textSecondary,
            },
          ]}
        >
          {subtitle}
        </Text>
      </View>

      {status ? (
        <Text
          style={[
            styles.settingsStatus,
            {
              color: statusColor ?? colors.textMuted,
            },
          ]}
        >
          {status}
        </Text>
      ) : onPress ? (
        <Text
          style={[
            styles.settingsArrow,
            {
              color: colors.textMuted,
            },
          ]}
        >
          ›
        </Text>
      ) : null}
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.7 : 1,
      })}
    >
      {content}
    </Pressable>
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

/*
 * Genera iniciales simples para el avatar
 * cuando todavía no existe una fotografía.
 */
function createInitials(firstName: string, lastName: string): string {
  const first = firstName.trim().charAt(0);

  const last = lastName.trim().charAt(0);

  return `${first}${last}`.toUpperCase() || "U";
}

/*
 * ============================================================================
 * ESTILOS
 * ============================================================================
 *
 * La identidad usa flexWrap para adaptarse:
 *
 * teléfono → foto + información + botón debajo
 * tablet/web → foto + información + botón lateral cuando haya espacio
 */
const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: Spacing.xxxl,
  },

  identityCard: {
    width: "100%",

    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",

    gap: Spacing.lg,

    marginBottom: Spacing.xl,
  },

  avatar: {
    width: 96,
    height: 96,

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

  identity: {
    flex: 1,
    minWidth: 220,
  },

  name: {
    fontSize: FontSize.h2,
    fontWeight: "700",

    marginBottom: Spacing.xs,
  },

  position: {
    fontSize: FontSize.body,

    marginBottom: Spacing.xs,
  },

  email: {
    fontSize: FontSize.small,
  },

  editButton: {
    minWidth: 150,
  },

  section: {
    marginTop: Spacing.xl,
  },

  sectionTitle: {
    fontSize: FontSize.cardTitle,
    fontWeight: "700",

    marginBottom: Spacing.md,
  },

  profileSection: {
    width: "100%",
  },

  profileSectionTitle: {
    fontSize: FontSize.cardTitle,
    fontWeight: "700",

    marginBottom: Spacing.md,
  },

  profileRow: {
    marginBottom: Spacing.md,
  },

  profileLabel: {
    fontSize: FontSize.caption,
    fontWeight: "600",

    marginBottom: 2,
  },

  profileValue: {
    fontSize: FontSize.body,
  },

  settingsRow: {
    minHeight: 78,

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },

  settingsText: {
    flex: 1,
    minWidth: 0,
  },

  settingsTitle: {
    fontSize: FontSize.body,
    fontWeight: "700",

    marginBottom: 2,
  },

  settingsSubtitle: {
    fontSize: FontSize.caption,
    lineHeight: 18,
  },

  settingsStatus: {
    flexShrink: 0,

    fontSize: FontSize.caption,
    fontWeight: "700",

    marginLeft: Spacing.md,
  },

  settingsArrow: {
    flexShrink: 0,

    fontSize: 28,

    marginLeft: Spacing.md,
  },

  divider: {
    height: 1,

    marginHorizontal: Spacing.md,
  },

  logoutButton: {
    minHeight: 50,

    alignItems: "center",
    justifyContent: "center",

    borderWidth: 1,
    borderRadius: Radius.md,
  },

  logoutText: {
    fontSize: FontSize.body,
    fontWeight: "700",
  },
});
