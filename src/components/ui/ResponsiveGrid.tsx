import { Children, type ReactNode } from "react";

import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { Spacing } from "@/constants/theme";

import { useResponsive } from "@/hooks/useResponsive";

type ResponsiveGridProps = {
  children: ReactNode;

  /*
   * Número de columnas según
   * el tamaño de pantalla.
   */
  phoneColumns?: number;
  tabletColumns?: number;
  desktopColumns?: number;

  /*
   * Separación entre elementos.
   */
  gap?: number;

  /*
   * Estilos adicionales para
   * el contenedor principal.
   */
  style?: StyleProp<ViewStyle>;
};

export function ResponsiveGrid({
  children,

  phoneColumns = 1,
  tabletColumns = 2,
  desktopColumns = 3,

  gap = Spacing.md,

  style,
}: ResponsiveGridProps) {
  const { isPhone, isTablet } = useResponsive();

  const columns = isPhone
    ? phoneColumns
    : isTablet
      ? tabletColumns
      : desktopColumns;

  /*
   * Calculamos el ancho porcentual
   * de cada elemento.
   *
   * Ejemplo:
   *
   * 1 columna  = 100%
   * 2 columnas = 50%
   * 3 columnas = 33.33%
   */
  const itemWidth = `${100 / columns}%` as const;

  const items = Children.toArray(children);

  return (
    <View
      style={[
        styles.grid,
        {
          marginHorizontal: -(gap / 2),
        },
        style,
      ]}
    >
      {items.map((child, index) => (
        <View
          key={index}
          style={[
            styles.item,

            {
              width: itemWidth,

              paddingHorizontal: gap / 2,

              marginBottom: gap,
            },
          ]}
        >
          {child}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",

    flexWrap: "wrap",
  },

  item: {
    minWidth: 0,
  },
});
