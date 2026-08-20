import { type PropsWithChildren } from "react";

import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { Radius, Spacing } from "@/constants/theme";

import { useResponsive } from "@/hooks/useResponsive";

import { useAppTheme } from "@/hooks/useAppTheme";

type AppCardProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;

  /*
   * Permite eliminar el padding interno
   * en tarjetas que necesiten un layout
   * completamente personalizado.
   */
  padded?: boolean;
}>;

export function AppCard({ children, style, padded = true }: AppCardProps) {
  const { colors } = useAppTheme();

  const { isPhone, isTablet } = useResponsive();

  /*
   * Las tarjetas tienen un poco más
   * de espacio disponible conforme
   * aumenta el tamaño de pantalla.
   */
  const cardPadding = isPhone ? Spacing.md : isTablet ? Spacing.lg : Spacing.xl;

  return (
    <View
      style={[
        styles.card,

        {
          backgroundColor: colors.surface,

          borderColor: colors.border,

          padding: padded ? cardPadding : 0,
        },

        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",

    borderWidth: 1,

    borderRadius: Radius.lg,

    /*
     * La sombra se mantiene discreta.
     * Android utiliza elevation,
     * mientras Web/iOS utilizan las
     * propiedades de sombra disponibles.
     */
    shadowColor: "#000",

    shadowOffset: {
      width: 0,
      height: 1,
    },

    shadowOpacity: 0.04,

    shadowRadius: 3,

    elevation: 1,
  },
});
