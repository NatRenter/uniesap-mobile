import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { router } from "expo-router";

import { AppCard } from "@/components/ui/AppCard";
import { ResponsiveContainer } from "@/components/ui/ResponsiveContainer";
import { ResponsiveGrid } from "@/components/ui/ResponsiveGrid";
import { Screen } from "@/components/ui/Screen";

import { FontSize, Radius, Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

/*
 * ============================================================================
 * PERFIL
 * ============================================================================
 *
 * Primera base visual del módulo de usuario.
 *
 * Aquí dejamos preparada la estructura para:
 *
 * - fotografía editable;
 * - información personal;
 * - profesión;
 * - cargo;
 * - preferencias;
 * - opciones de desarrollador.
 *
 * Roles y permisos NO se implementan todavía.
 */

const temporaryProfile = {
  initials: "A",
  name: "Usuario UNIESAP",
  email: "usuario@uniesap.com",
  profession: "Sin definir",
  position: "Sin definir",
};

export default function ProfileScreen() {
  const { colors } = useAppTheme();

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

          <View style={styles.header}>
            <View
              style={[
                styles.avatar,
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
                {temporaryProfile.initials}
              </Text>
            </View>

            <View style={styles.identity}>
              <Text
                style={[
                  styles.name,
                  {
                    color: colors.text,
                  },
                ]}
              >
                {temporaryProfile.name}
              </Text>

              <Text
                style={[
                  styles.email,
                  {
                    color: colors.textSecondary,
                  },
                ]}
              >
                {temporaryProfile.email}
              </Text>

              <Text
                style={[
                  styles.photoNotice,
                  {
                    color: colors.textMuted,
                  },
                ]}
              >
                La edición de fotografía se conectará en la siguiente fase del
                perfil.
              </Text>
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
                  value: temporaryProfile.name,
                },
                {
                  label: "Correo",
                  value: temporaryProfile.email,
                },
              ]}
            />

            <ProfileSection
              title="Información profesional"
              rows={[
                {
                  label: "Profesión",
                  value: temporaryProfile.profession,
                },
                {
                  label: "Cargo",
                  value: temporaryProfile.position,
                },
              ]}
            />
          </ResponsiveGrid>

          {/* ============================================================ */}
          {/* PREFERENCIAS Y APLICACIÓN                                    */}
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
                subtitle="Estado simple de carga y errores"
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
 * Tarjeta con información del perfil.
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
 *
 * Si onPress no existe se muestra únicamente como información.
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

/*
 * Separador interno de la tarjeta.
 */
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
 * ============================================================================
 * ESTILOS
 * ============================================================================
 */
const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: Spacing.xxxl,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",

    marginBottom: Spacing.xl,
  },

  avatar: {
    width: 82,
    height: 82,

    flexShrink: 0,

    borderRadius: Radius.full,

    alignItems: "center",
    justifyContent: "center",

    marginRight: Spacing.lg,
  },

  avatarText: {
    fontSize: FontSize.h2,
    fontWeight: "800",
  },

  identity: {
    flex: 1,
    minWidth: 0,
  },

  name: {
    fontSize: FontSize.h2,
    fontWeight: "700",

    marginBottom: Spacing.xs,
  },

  email: {
    fontSize: FontSize.small,

    marginBottom: Spacing.sm,
  },

  photoNotice: {
    maxWidth: 520,

    fontSize: FontSize.caption,
    lineHeight: 18,
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
