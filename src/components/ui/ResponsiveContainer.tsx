import { type PropsWithChildren } from "react";

import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { Spacing } from "@/constants/theme";

import { useResponsive } from "@/hooks/useResponsive";

type ResponsiveContainerProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  maxWidth?: number;
  paddedTop?: boolean;
}>;

export function ResponsiveContainer({
  children,
  style,
  maxWidth,
  paddedTop = true,
}: ResponsiveContainerProps) {
  const { isPhone, isTablet } = useResponsive();

  const horizontalPadding = isPhone
    ? Spacing.lg
    : isTablet
      ? Spacing.xl
      : Spacing.xxl;

  const topPadding = isPhone ? Spacing.lg : isTablet ? Spacing.xl : Spacing.xl;

  const resolvedMaxWidth =
    maxWidth ?? (isPhone ? undefined : isTablet ? 900 : 1180);

  return (
    <View
      style={[
        styles.container,
        {
          maxWidth: resolvedMaxWidth,
          paddingHorizontal: horizontalPadding,
          paddingTop: paddedTop ? topPadding : 0,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    minWidth: 0,
    alignSelf: "center",
  },
});
