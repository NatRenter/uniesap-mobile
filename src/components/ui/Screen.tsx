import type { ReactNode } from "react";

import { StyleSheet, View, type ViewProps } from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

interface ScreenProps extends ViewProps {
  children: ReactNode;
  padded?: boolean;
}

export function Screen({
  children,
  style,
  padded = true,
  ...props
}: ScreenProps) {
  const { colors } = useAppTheme();

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
        {...props}
        style={[styles.container, padded && styles.padded, style]}
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
  },

  padded: {
    padding: Spacing.lg,
  },
});
