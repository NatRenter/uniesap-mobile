import { Pressable, StyleSheet, Text, View } from "react-native";

import { router, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FontSize, Radius, Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

/*
 * ============================================================================
 * NAVEGACIÓN GLOBAL - ANDROID / IOS
 * ============================================================================
 *
 * Esta barra permanece disponible en las pantallas principales y contextuales.
 *
 * Objetivo:
 *
 * - Atrás = regresar al nivel anterior.
 * - Barra global = saltar directamente a un módulo principal.
 *
 * En celular se muestra compacta.
 * En tablet conserva el mismo comportamiento con mayor espacio disponible.
 */

type GlobalNavigationItem = {
  label: string;
  icon: string;
  route: "/dashboard" | "/empresas" | "/trabajo" | "/perfil";
  matches: string[];
};

const navigationItems: GlobalNavigationItem[] = [
  {
    label: "Inicio",
    icon: "⌂",
    route: "/dashboard",
    matches: ["/dashboard"],
  },
  {
    label: "Empresas",
    icon: "▦",
    route: "/empresas",
    matches: ["/empresas"],
  },
  {
    label: "Trabajo",
    icon: "✓",
    route: "/trabajo",
    matches: ["/trabajo"],
  },
  {
    label: "Perfil",
    icon: "●",
    route: "/perfil",
    matches: ["/perfil"],
  },
];

export default function AppTabs() {
  const pathname = usePathname();

  const insets = useSafeAreaInsets();

  const { colors } = useAppTheme();

  return (
    <View
      style={[
        styles.navigationSurface,
        {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, Spacing.xs),
        },
      ]}
    >
      <View style={styles.navigationContent}>
        {navigationItems.map((item) => {
          const active = isRouteActive(pathname, item.matches);

          return (
            <Pressable
              key={item.route}
              accessibilityRole="button"
              accessibilityState={{
                selected: active,
              }}
              accessibilityLabel={`Ir a ${item.label}`}
              onPress={() => {
                /*
                 * navigate evita apilar repetidamente el mismo módulo.
                 *
                 * La navegación contextual interna continuará utilizando
                 * router.back() o sus propias rutas.
                 */
                router.navigate(item.route);
              }}
              style={({ pressed }) => [
                styles.navigationItem,
                active && {
                  backgroundColor: colors.primarySoft,
                },
                {
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.navigationIcon,
                  {
                    color: active ? colors.primary : colors.textMuted,
                  },
                ]}
              >
                {item.icon}
              </Text>

              <Text
                numberOfLines={1}
                style={[
                  styles.navigationLabel,
                  {
                    color: active ? colors.primary : colors.textSecondary,
                  },
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/*
 * Determina qué módulo debe mostrarse como activo.
 *
 * Ejemplo:
 *
 * /empresas/1/reportes
 *        ↓
 * Empresas permanece seleccionado.
 */
function isRouteActive(pathname: string, matches: string[]): boolean {
  return matches.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

/*
 * ============================================================================
 * ESTILOS
 * ============================================================================
 *
 * La barra utiliza medidas flexibles.
 *
 * No fijamos anchuras de teléfono específicas para que también funcione
 * correctamente en tablets Android.
 */
const styles = StyleSheet.create({
  navigationSurface: {
    flexShrink: 0,

    borderTopWidth: StyleSheet.hairlineWidth,

    paddingTop: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },

  navigationContent: {
    width: "100%",
    maxWidth: 760,

    alignSelf: "center",

    flexDirection: "row",
    alignItems: "center",

    gap: Spacing.xs,
  },

  navigationItem: {
    flex: 1,
    minWidth: 0,

    minHeight: 54,

    alignItems: "center",
    justifyContent: "center",

    borderRadius: Radius.md,

    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xs,
  },

  navigationIcon: {
    fontSize: FontSize.body,
    fontWeight: "700",

    marginBottom: 2,
  },

  navigationLabel: {
    fontSize: FontSize.caption,
    fontWeight: "600",
  },
});
