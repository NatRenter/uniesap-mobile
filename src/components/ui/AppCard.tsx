import { type PropsWithChildren } from "react";

import {
  Platform,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { Radius, Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";
import { useResponsive } from "@/hooks/useResponsive";

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

        /*
         * Sombra específica por plataforma.
         *
         * WEB
         *   → boxShadow
         *
         * ANDROID
         *   → elevation
         *
         * IOS
         *   → shadowColor / shadowOffset /
         *     shadowOpacity / shadowRadius
         */
        styles.platformShadow,

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
  },

  /*
   * ==========================================================================
   * SOMBRA POR PLATAFORMA
   * ==========================================================================
   *
   * Evitamos enviar shadow* a React Native Web.
   *
   * Esto elimina el warning:
   *
   * "shadow*" style props are deprecated. Use "boxShadow".
   */
  platformShadow:
    Platform.select<ViewStyle>({
      web: {
        /*
         * Equivalente aproximado a:
         *
         * offsetY: 1
         * blur: 3
         * opacity: 0.04
         */
        boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.04)",
      },

      android: {
        /*
         * Android utiliza elevation
         * para sombras nativas.
         */
        elevation: 1,
      },

      ios: {
        shadowColor: "#000000",

        shadowOffset: {
          width: 0,

          height: 1,
        },

        shadowOpacity: 0.04,

        shadowRadius: 3,
      },

      default: {},
    }) ?? {},
});
