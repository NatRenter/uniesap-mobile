import type { ReactNode } from "react";
import { StyleSheet, View, type ViewProps } from "react-native";

import { colors, radius, spacing } from "@/theme";

interface AppCardProps extends ViewProps {
  children: ReactNode;
}

export function AppCard({ children, style, ...props }: AppCardProps) {
  return (
    <View {...props} style={[styles.card, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
});
