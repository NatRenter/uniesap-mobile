import type { ReactNode } from "react";
import { StyleSheet, View, type ViewProps } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, spacing } from "@/theme";

interface ScreenProps extends ViewProps {
  children: ReactNode;
}

export function Screen({ children, style, ...props }: ScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View {...props} style={[styles.container, style]}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  container: {
    flex: 1,
    padding: spacing.lg,
  },
});
