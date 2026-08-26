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
 * OPCIONES DE DESARROLLADOR
 * ============================================================================
 *
 * Las herramientas técnicas dejan de estar expuestas en el Dashboard.
 *
 * Desde aquí se puede acceder a:
 *
 * - sync-test;
 * - evidence-test;
 * - kobo-test.
 *
 * En producción podremos ocultar o proteger esta sección posteriormente.
 */
export default function DeveloperOptionsScreen() {
  const { colors } = useAppTheme();

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ResponsiveContainer>
          {/* ============================================================ */}
          {/* NAVEGACIÓN CONTEXTUAL                                        */}
          {/* ============================================================ */}

          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backButton,
              {
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Text
              style={[
                styles.backText,
                {
                  color: colors.primary,
                },
              ]}
            >
              ‹ Perfil
            </Text>
          </Pressable>

          <View style={styles.header}>
            <Text
              style={[
                styles.title,
                {
                  color: colors.text,
                },
              ]}
            >
              Opciones de desarrollador
            </Text>

            <Text
              style={[
                styles.subtitle,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              Herramientas internas para diagnosticar persistencia,
              sincronización y Kobo.
            </Text>
          </View>

          <View
            style={[
              styles.warning,
              {
                backgroundColor: colors.primarySoft,
                borderColor: colors.warning,
              },
            ]}
          >
            <Text
              style={[
                styles.warningText,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              Estas funciones son técnicas. No forman parte del flujo normal del
              usuario.
            </Text>
          </View>

          <ResponsiveGrid
            phoneColumns={1}
            tabletColumns={2}
            desktopColumns={3}
            gap={Spacing.md}
          >
            <DeveloperCard
              title="Diagnóstico de sincronización"
              description="Cola, estados, reintentos y pruebas de idempotencia."
              environment="WEB localStorage · ANDROID SQLite"
              onPress={() => router.navigate("/sync-test")}
            />

            <DeveloperCard
              title="Prueba de evidencias"
              description="Creación, persistencia y eliminación de evidencias."
              environment="WEB localStorage · ANDROID SQLite"
              onPress={() => router.navigate("/evidence-test")}
            />

            <DeveloperCard
              title="Pruebas Kobo"
              description="Herramientas de importación y exportación del servicio Kobo."
              environment="Mock / integración"
              onPress={() => router.navigate("/kobo-test")}
            />
          </ResponsiveGrid>
        </ResponsiveContainer>
      </ScrollView>
    </Screen>
  );
}

/*
 * Tarjeta de una herramienta interna.
 */
function DeveloperCard({
  title,
  description,
  environment,
  onPress,
}: {
  title: string;
  description: string;
  environment: string;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.75 : 1,
      })}
    >
      <AppCard style={styles.card}>
        <Text
          style={[
            styles.cardTitle,
            {
              color: colors.text,
            },
          ]}
        >
          {title}
        </Text>

        <Text
          style={[
            styles.cardDescription,
            {
              color: colors.textSecondary,
            },
          ]}
        >
          {description}
        </Text>

        <View style={styles.cardFooter}>
          <Text
            style={[
              styles.environment,
              {
                color: colors.primary,
              },
            ]}
          >
            {environment}
          </Text>

          <Text
            style={[
              styles.arrow,
              {
                color: colors.textMuted,
              },
            ]}
          >
            ›
          </Text>
        </View>
      </AppCard>
    </Pressable>
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

  backButton: {
    alignSelf: "flex-start",

    marginBottom: Spacing.lg,
  },

  backText: {
    fontSize: FontSize.small,
    fontWeight: "700",
  },

  header: {
    marginBottom: Spacing.lg,
  },

  title: {
    fontSize: FontSize.h1,
    fontWeight: "700",

    marginBottom: Spacing.sm,
  },

  subtitle: {
    maxWidth: 720,

    fontSize: FontSize.body,
    lineHeight: 24,
  },

  warning: {
    borderWidth: 1,
    borderRadius: Radius.md,

    padding: Spacing.md,

    marginBottom: Spacing.lg,
  },

  warningText: {
    fontSize: FontSize.small,
    lineHeight: 20,
  },

  card: {
    width: "100%",
    minHeight: 170,
  },

  cardTitle: {
    fontSize: FontSize.cardTitle,
    fontWeight: "700",

    marginBottom: Spacing.sm,
  },

  cardDescription: {
    flex: 1,

    fontSize: FontSize.small,
    lineHeight: 20,

    marginBottom: Spacing.md,
  },

  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
  },

  environment: {
    flex: 1,
    minWidth: 0,

    fontSize: FontSize.caption,
    fontWeight: "700",
  },

  arrow: {
    flexShrink: 0,

    fontSize: 28,

    marginLeft: Spacing.sm,
  },
});
