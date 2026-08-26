import { Pressable, StyleSheet, Text, View } from "react-native";

import { router, usePathname } from "expo-router";

import { FontSize, Radius, Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

/*
 * ============================================================================
 * NAVEGACIÓN GLOBAL - WEB
 * ============================================================================
 *
 * Web utiliza la misma arquitectura que móvil:
 *
 * Inicio | Empresas | Trabajo | Perfil
 *
 * La diferencia es visual:
 * en escritorio aprovechamos el ancho disponible con una barra superior.
 */

type GlobalNavigationItem = {
  label: string;
  route: "/dashboard" | "/empresas" | "/trabajo" | "/perfil";
  matches: string[];
};

const navigationItems: GlobalNavigationItem[] = [
  {
    label: "Inicio",
    route: "/dashboard",
    matches: ["/dashboard"],
  },
  {
    label: "Empresas",
    route: "/empresas",
    matches: ["/empresas"],
  },
  {
    label: "Trabajo",
    route: "/trabajo",
    matches: ["/trabajo"],
  },
  {
    label: "Perfil",
    route: "/perfil",
    matches: ["/perfil"],
  },
];

export default function AppTabs() {
  const pathname = usePathname();

  const { colors } = useAppTheme();

  return (
    <View
      style={[
        styles.navigationSurface,
        {
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <View style={styles.navigationContent}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ir al inicio"
          onPress={() => router.navigate("/dashboard")}
          style={({ pressed }) => [
            styles.brandButton,
            {
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Text
            style={[
              styles.brand,
              {
                color: colors.primary,
              },
            ]}
          >
            UNIESAP
          </Text>
        </Pressable>

        <View style={styles.navigationItems}>
          {navigationItems.map((item) => {
            const active = isRouteActive(pathname, item.matches);

            return (
              <Pressable
                key={item.route}
                accessibilityRole="button"
                accessibilityState={{
                  selected: active,
                }}
                onPress={() => router.navigate(item.route)}
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
    </View>
  );
}

/*
 * Mantiene seleccionado el módulo principal cuando la ruta es profunda.
 *
 * /empresas/1/inmuebles/5
 *       ↓
 * Empresas continúa activo.
 */
function isRouteActive(pathname: string, matches: string[]): boolean {
  return matches.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

/*
 * ============================================================================
 * ESTILOS WEB
 * ============================================================================
 *
 * El contenido se limita a 1180px para no dispersar la navegación
 * en monitores grandes.
 */
const styles = StyleSheet.create({
  navigationSurface: {
    flexShrink: 0,

    borderBottomWidth: StyleSheet.hairlineWidth,

    paddingHorizontal: Spacing.lg,
  },

  navigationContent: {
    width: "100%",
    maxWidth: 1180,

    minHeight: 68,

    alignSelf: "center",

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    gap: Spacing.lg,
  },

  brandButton: {
    flexShrink: 0,

    paddingVertical: Spacing.sm,
  },

  brand: {
    fontSize: FontSize.cardTitle,
    fontWeight: "800",
    letterSpacing: 0.8,
  },

  navigationItems: {
    flexDirection: "row",
    alignItems: "center",

    gap: Spacing.xs,
  },

  navigationItem: {
    borderRadius: Radius.md,

    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },

  navigationLabel: {
    fontSize: FontSize.small,
    fontWeight: "600",
  },
});
