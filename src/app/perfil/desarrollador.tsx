import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { router } from "expo-router";

import { ContextHeader } from "@/components/navigation/ContextHeader";

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
 * Esta pantalla concentra herramientas técnicas que NO forman parte
 * del flujo normal del usuario.
 *
 * Actualmente incluye:
 *
 * - pruebas de sincronización;
 * - pruebas de evidencias;
 * - pruebas de Kobo;
 * - diagnóstico SQLite.
 *
 * ============================================================================
 * OBJETIVO
 * ============================================================================
 *
 * Mantener las herramientas internas separadas de:
 *
 * - Dashboard;
 * - Empresas;
 * - Inmuebles;
 * - Inspecciones;
 * - Evidencias;
 * - Reportes.
 *
 * De esta forma las herramientas de diagnóstico quedan
 * localizadas dentro de:
 *
 * Perfil
 *    ↓
 * Opciones de desarrollador
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
          {/* HEADER                                                       */}
          {/* ============================================================ */}

          <ContextHeader
            backLabel="Perfil"
            onBack={() => router.navigate("/perfil")}
            title="Opciones de desarrollador"
            subtitle="Herramientas internas de diagnóstico, pruebas e integración."
          />

          {/* ============================================================ */}
          {/* INTRODUCCIÓN                                                  */}
          {/* ============================================================ */}

          <View style={styles.introduction}>
            <Text
              style={[
                styles.introductionTitle,

                {
                  color: colors.text,
                },
              ]}
            >
              Herramientas internas
            </Text>

            <Text
              style={[
                styles.introductionDescription,

                {
                  color: colors.textSecondary,
                },
              ]}
            >
              Estas opciones están destinadas únicamente al desarrollo,
              diagnóstico y validación técnica de UNIESAP.
            </Text>
          </View>

          {/* ============================================================ */}
          {/* HERRAMIENTAS                                                 */}
          {/* ============================================================ */}

          <ResponsiveGrid
            phoneColumns={1}
            tabletColumns={2}
            desktopColumns={2}
            gap={Spacing.md}
          >
            {/* ========================================================== */}
            {/* SINCRONIZACIÓN                                             */}
            {/* ========================================================== */}

            <DeveloperCard
              icon="↻"
              title="Pruebas de sincronización"
              description="Revisar cola, estados de sincronización y comportamiento offline."
              status="Desarrollo"
              onPress={() => router.navigate("/sync-test")}
            />

            {/* ========================================================== */}
            {/* EVIDENCIAS                                                  */}
            {/* ========================================================== */}

            <DeveloperCard
              icon="▣"
              title="Pruebas de evidencias"
              description="Crear, consultar y validar evidencias locales y fotografías."
              status="Desarrollo"
              onPress={() => router.navigate("/evidence-test")}
            />

            {/* ========================================================== */}
            {/* KOBO                                                        */}
            {/* ========================================================== */}

            <DeveloperCard
              icon="K"
              title="Pruebas de Kobo"
              description="Verificar integración, mapeo y comunicación con KoboToolbox."
              status="Integración"
              onPress={() => router.navigate("/kobo-test")}
            />

            {/* ========================================================== */}
            {/* SQLITE                                                      */}
            {/* ========================================================== */}

            <DeveloperCard
              icon="DB"
              title="Diagnóstico SQLite"
              description="Revisar esquema local, columnas de properties y relaciones Property ↔ Form."
              status="Diagnóstico"
              onPress={() => router.navigate("/property-schema-test")}
            />
          </ResponsiveGrid>

          {/* ============================================================ */}
          {/* INFORMACIÓN                                                   */}
          {/* ============================================================ */}

          <AppCard style={styles.informationCard}>
            <Text
              style={[
                styles.informationTitle,

                {
                  color: colors.text,
                },
              ]}
            >
              Uso interno
            </Text>

            <Text
              style={[
                styles.informationDescription,

                {
                  color: colors.textSecondary,
                },
              ]}
            >
              Estas herramientas pueden mostrar información técnica, modificar
              datos de prueba o ejecutar operaciones internas. No forman parte
              del flujo normal de producción.
            </Text>
          </AppCard>
        </ResponsiveContainer>
      </ScrollView>
    </Screen>
  );
}

/*
 * ============================================================================
 * DEVELOPER CARD
 * ============================================================================
 *
 * AppCard actualmente es un contenedor visual.
 *
 * No recibe:
 *
 * onPress
 *
 * Por esa razón utilizamos:
 *
 * Pressable
 *    ↓
 * AppCard
 *
 * De esta forma:
 *
 * - mantenemos AppCard sin modificaciones;
 * - conservamos el diseño existente;
 * - agregamos interacción únicamente aquí.
 */
function DeveloperCard({
  icon,
  title,
  description,
  status,
  onPress,
}: {
  icon: string;

  title: string;

  description: string;

  status: string;

  onPress: () => void;
}) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.developerPressable,

        {
          /*
           * Feedback visual al presionar.
           *
           * No modificamos colores del tema;
           * simplemente reducimos ligeramente
           * la opacidad.
           */
          opacity: pressed ? 0.72 : 1,
        },
      ]}
    >
      <AppCard style={styles.developerCard}>
        <View style={styles.cardContent}>
          {/* ========================================================== */}
          {/* ICONO                                                       */}
          {/* ========================================================== */}

          <View
            style={[
              styles.iconContainer,

              {
                backgroundColor: colors.primarySoft,
              },
            ]}
          >
            <Text
              style={[
                styles.iconText,

                {
                  color: colors.primary,
                },
              ]}
            >
              {icon}
            </Text>
          </View>

          {/* ========================================================== */}
          {/* INFORMACIÓN                                                 */}
          {/* ========================================================== */}

          <View style={styles.cardInformation}>
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

            <Text
              style={[
                styles.cardStatus,

                {
                  color: colors.primary,
                },
              ]}
            >
              {status}
            </Text>
          </View>

          {/* ========================================================== */}
          {/* INDICADOR                                                   */}
          {/* ========================================================== */}

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

  /*
   * ================================================================
   * INTRODUCCIÓN
   * ================================================================
   */
  introduction: {
    marginBottom: Spacing.xl,
  },

  introductionTitle: {
    fontSize: FontSize.h2,

    fontWeight: "700",

    marginBottom: Spacing.sm,
  },

  introductionDescription: {
    maxWidth: 720,

    fontSize: FontSize.body,

    lineHeight: 24,
  },

  /*
   * ================================================================
   * PRESSABLE
   * ================================================================
   *
   * El Pressable ocupa todo el espacio disponible
   * dentro de ResponsiveGrid.
   */
  developerPressable: {
    width: "100%",
  },

  /*
   * ================================================================
   * TARJETAS
   * ================================================================
   */
  developerCard: {
    width: "100%",

    minHeight: 150,
  },

  cardContent: {
    flexDirection: "row",

    alignItems: "flex-start",
  },

  iconContainer: {
    width: 48,

    height: 48,

    flexShrink: 0,

    alignItems: "center",

    justifyContent: "center",

    borderRadius: Radius.md,

    marginRight: Spacing.md,
  },

  iconText: {
    fontSize: FontSize.body,

    fontWeight: "700",
  },

  cardInformation: {
    flex: 1,

    minWidth: 0,
  },

  cardTitle: {
    fontSize: FontSize.cardTitle,

    fontWeight: "700",

    marginBottom: Spacing.xs,
  },

  cardDescription: {
    fontSize: FontSize.small,

    lineHeight: 20,

    marginBottom: Spacing.md,
  },

  cardStatus: {
    fontSize: FontSize.caption,

    fontWeight: "600",
  },

  arrow: {
    flexShrink: 0,

    fontSize: 28,

    marginLeft: Spacing.sm,
  },

  /*
   * ================================================================
   * INFORMACIÓN
   * ================================================================
   */
  informationCard: {
    marginTop: Spacing.xl,
  },

  informationTitle: {
    fontSize: FontSize.body,

    fontWeight: "700",

    marginBottom: Spacing.sm,
  },

  informationDescription: {
    fontSize: FontSize.small,

    lineHeight: 21,
  },
});
