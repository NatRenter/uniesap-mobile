import { Children, type ReactNode } from "react";

import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { Spacing } from "@/constants/theme";

import { useResponsive } from "@/hooks/useResponsive";

type ResponsiveGridProps = {
  children: ReactNode;

  phoneColumns?: number;
  tabletColumns?: number;
  desktopColumns?: number;

  gap?: number;

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

  const columns = Math.max(
    1,
    isPhone ? phoneColumns : isTablet ? tabletColumns : desktopColumns,
  );

  const items = Children.toArray(children);

  /*
   * No utilizamos "gap" directamente para conservar
   * compatibilidad consistente entre Native y Web.
   *
   * Cada celda recibe la mitad del espacio horizontal
   * y el grid compensa ese espacio con margen negativo.
   */
  const itemWidth = `${100 / columns}%` as const;

  return (
    <View
      style={[
        styles.grid,
        {
          marginHorizontal: -(gap / 2),
          marginBottom: -gap,
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
              paddingBottom: gap,
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
    width: "100%",
    minWidth: 0,

    flexDirection: "row",
    flexWrap: "wrap",

    alignItems: "stretch",
  },

  item: {
    minWidth: 0,
    flexShrink: 0,
  },
});
