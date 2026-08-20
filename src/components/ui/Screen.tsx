import { type PropsWithChildren } from "react";

import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { Spacing } from "@/constants/theme";

import { useResponsive } from "@/hooks/useResponsive";

import { useAppTheme } from "@/hooks/useAppTheme";

type ScreenProps = PropsWithChildren<{
  padded?: boolean;

  style?: StyleProp<ViewStyle>;
}>;

export function Screen({ children, padded = true, style }: ScreenProps) {
  const { colors } = useAppTheme();

  const { isPhone, isTablet } = useResponsive();

  const horizontalPadding = isPhone
    ? Spacing.lg
    : isTablet
      ? Spacing.xl
      : Spacing.xxl;

  const maxWidth = isPhone ? undefined : isTablet ? 900 : 1180;

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <View
        style={[
          styles.container,

          {
            maxWidth,

            paddingHorizontal: padded ? horizontalPadding : 0,
          },

          style,
        ]}
      >
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  container: {
    flex: 1,

    width: "100%",

    alignSelf: "center",
  },
});
