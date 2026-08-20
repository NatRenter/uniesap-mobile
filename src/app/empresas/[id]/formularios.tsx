import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { router, useLocalSearchParams } from "expo-router";

import { AppCard } from "@/components/ui/AppCard";
import { ResponsiveContainer } from "@/components/ui/ResponsiveContainer";
import { ResponsiveGrid } from "@/components/ui/ResponsiveGrid";
import { Screen } from "@/components/ui/Screen";

import { FontSize, Radius, Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

/*
 * DATOS TEMPORALES
 *
 * Por ahora los formularios siguen definidos de manera local.
 *
 * Más adelante este arreglo será sustituido por:
 *
 * FormRepository / FormService
 *            ↓
 * formularios sincronizados desde Kobo
 */
const forms = [
  {
    id: "form-1",

    title: "Análisis de riesgos",

    description: "Evaluación general de condiciones y agentes de riesgo.",

    version: "v1.0",

    properties: 3,

    status: "Activo",
  },

  {
    id: "form-2",

    title: "Inspección de extintores",

    description: "Revisión visual y funcional de equipos contra incendio.",

    version: "v1.2",

    properties: 2,

    status: "Activo",
  },

  {
    id: "form-3",

    title: "Señalización",

    description: "Evaluación de rutas, avisos y señalización preventiva.",

    version: "v1.0",

    properties: 1,

    status: "Activo",
  },
];

export default function CompanyFormsScreen() {
  /*
   * Recupera los colores del tema actual.
   *
   * Esto mantiene la pantalla compatible
   * con modo claro y oscuro.
   */
  const { colors } = useAppTheme();

  /*
   * ID dinámico recibido desde:
   *
   * /empresas/[id]/formularios
   */
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/*
         * ResponsiveContainer controla:
         *
         * - padding horizontal
         * - espacio superior
         * - ancho máximo
         * - centrado en tablet/web
         */}
        <ResponsiveContainer>
          {/* ============================================================ */}
          {/* NAVEGACIÓN                                                   */}
          {/* ============================================================ */}

          <Pressable
            onPress={() =>
              router.navigate({
                pathname: "/empresas/[id]",

                params: {
                  id,
                },
              })
            }
          >
            <Text
              style={[
                styles.backText,
                {
                  color: colors.primary,
                },
              ]}
            >
              ‹ Empresa
            </Text>
          </Pressable>

          {/* ============================================================ */}
          {/* ENCABEZADO                                                   */}
          {/* ============================================================ */}

          <View style={styles.header}>
            <Text
              style={[
                styles.title,
                {
                  color: colors.text,
                },
              ]}
            >
              Formularios
            </Text>

            <Text
              style={[
                styles.subtitle,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              Formularios disponibles y asignados a los inmuebles de esta
              empresa.
            </Text>
          </View>

          {/* ============================================================ */}
          {/* LISTADO RESPONSIVE                                           */}
          {/* ============================================================ */}

          {/*
           * Móvil:
           * 1 formulario por fila.
           *
           * Tablet:
           * 2 formularios por fila.
           *
           * Desktop:
           * 3 formularios por fila.
           */}
          <ResponsiveGrid
            phoneColumns={1}
            tabletColumns={2}
            desktopColumns={3}
            gap={Spacing.md}
          >
            {forms.map((form) => (
              <FormCard
                key={form.id}
                companyId={id}
                formId={form.id}
                title={form.title}
                description={form.description}
                version={form.version}
                properties={form.properties}
                status={form.status}
              />
            ))}
          </ResponsiveGrid>

          {/* ============================================================ */}
          {/* ESTADO VACÍO                                                 */}
          {/* ============================================================ */}

          {forms.length === 0 && (
            <AppCard style={styles.emptyCard}>
              <Text
                style={[
                  styles.emptyTitle,
                  {
                    color: colors.text,
                  },
                ]}
              >
                Sin formularios
              </Text>

              <Text
                style={[
                  styles.emptyDescription,
                  {
                    color: colors.textSecondary,
                  },
                ]}
              >
                Esta empresa todavía no tiene formularios disponibles.
              </Text>
            </AppCard>
          )}
        </ResponsiveContainer>
      </ScrollView>
    </Screen>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  FORM CARD                                 */
/* -------------------------------------------------------------------------- */

/*
 * Representa un formulario dentro del listado.
 *
 * Recibe todos los datos preparados desde el
 * componente principal.
 *
 * Esto permitirá sustituir posteriormente el arreglo
 * local por datos provenientes de Kobo sin tener que
 * rediseñar la tarjeta.
 */
function FormCard({
  companyId,
  formId,
  title,
  description,
  version,
  properties,
  status,
}: {
  companyId: string;
  formId: string;
  title: string;
  description: string;
  version: string;
  properties: number;
  status: string;
}) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      onPress={() =>
        router.navigate({
          pathname: "/empresas/[id]/formularios/[formId]",

          /*
           * Para abrir el detalle conservamos:
           *
           * - empresa
           * - formulario
           */
          params: {
            id: companyId,
            formId,
          },
        })
      }
      style={({ pressed }) => ({
        /*
         * Feedback visual en móvil, tablet
         * y también con mouse en web.
         */
        opacity: pressed ? 0.75 : 1,
      })}
    >
      <AppCard style={styles.formCard}>
        {/* ========================================================== */}
        {/* CABECERA                                                   */}
        {/* ========================================================== */}

        <View style={styles.cardHeader}>
          <View
            style={[
              styles.icon,
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
              ≡
            </Text>
          </View>

          <View style={styles.formInfo}>
            <Text
              style={[
                styles.formTitle,
                {
                  color: colors.text,
                },
              ]}
              numberOfLines={2}
            >
              {title}
            </Text>

            <Text
              style={[
                styles.formDescription,
                {
                  color: colors.textSecondary,
                },
              ]}
              numberOfLines={3}
            >
              {description}
            </Text>
          </View>

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

        {/* ========================================================== */}
        {/* DIVISOR                                                    */}
        {/* ========================================================== */}

        <View
          style={[
            styles.divider,
            {
              backgroundColor: colors.divider,
            },
          ]}
        />

        {/* ========================================================== */}
        {/* METADATOS                                                  */}
        {/* ========================================================== */}

        <View style={styles.meta}>
          <View style={styles.metaGroup}>
            <Text
              style={[
                styles.metaText,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              {version}
            </Text>

            <Text
              style={[
                styles.metaText,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              {properties} inmueble
              {properties === 1 ? "" : "s"}
            </Text>
          </View>

          <Text
            style={[
              styles.status,
              {
                color: colors.success,
              },
            ]}
          >
            ● {status}
          </Text>
        </View>
      </AppCard>
    </Pressable>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  /*
   * ResponsiveContainer se encarga del
   * padding lateral y superior.
   */
  scrollContent: {
    paddingBottom: Spacing.xxxl,
  },

  backText: {
    fontSize: FontSize.small,

    fontWeight: "600",

    marginBottom: Spacing.lg,
  },

  header: {
    marginBottom: Spacing.xl,
  },

  title: {
    fontSize: FontSize.h1,

    fontWeight: "700",

    marginBottom: Spacing.sm,
  },

  subtitle: {
    fontSize: FontSize.body,

    lineHeight: 24,

    maxWidth: 760,
  },

  /*
   * ResponsiveGrid determina el ancho
   * de cada tarjeta.
   */
  formCard: {
    width: "100%",

    /*
     * Mantiene una apariencia más uniforme
     * cuando existen varias tarjetas por fila.
     */
    minHeight: 220,
  },

  cardHeader: {
    flexDirection: "row",

    alignItems: "flex-start",
  },

  icon: {
    width: 48,

    height: 48,

    flexShrink: 0,

    borderRadius: Radius.md,

    alignItems: "center",

    justifyContent: "center",

    marginRight: Spacing.md,
  },

  iconText: {
    fontSize: FontSize.h3,

    fontWeight: "600",
  },

  /*
   * minWidth: 0 permite que los textos
   * realmente reduzcan su ancho dentro
   * de las tarjetas responsive.
   */
  formInfo: {
    flex: 1,

    minWidth: 0,
  },

  formTitle: {
    fontSize: FontSize.body,

    fontWeight: "700",

    marginBottom: Spacing.xs,
  },

  formDescription: {
    fontSize: FontSize.caption,

    lineHeight: 18,
  },

  arrow: {
    flexShrink: 0,

    fontSize: 28,

    marginLeft: Spacing.sm,
  },

  divider: {
    height: 1,

    marginVertical: Spacing.md,
  },

  /*
   * Los metadatos se pueden reorganizar
   * si la tarjeta queda demasiado estrecha.
   */
  meta: {
    flexDirection: "row",

    justifyContent: "space-between",

    alignItems: "center",

    flexWrap: "wrap",

    gap: Spacing.sm,
  },

  metaGroup: {
    flexDirection: "row",

    alignItems: "center",

    flexWrap: "wrap",

    gap: Spacing.md,
  },

  metaText: {
    fontSize: FontSize.caption,
  },

  status: {
    flexShrink: 0,

    fontSize: FontSize.caption,

    fontWeight: "600",
  },

  /* -------------------------------------------------------------------- */
  /*                           ESTADO VACÍO                                */
  /* -------------------------------------------------------------------- */

  emptyCard: {
    marginTop: Spacing.md,
  },

  emptyTitle: {
    fontSize: FontSize.body,

    fontWeight: "700",

    marginBottom: Spacing.sm,
  },

  emptyDescription: {
    fontSize: FontSize.small,

    lineHeight: 20,
  },
});
