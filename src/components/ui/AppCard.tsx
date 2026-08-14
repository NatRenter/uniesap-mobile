import type { ReactNode } from "react";

import { StyleSheet, View, type ViewProps } from "react-native";

import { Radius, Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

interface AppCardProps extends ViewProps {
  children: ReactNode;
}

export function AppCard({ children, style, ...props }: AppCardProps) {
  const { colors } = useAppTheme();

  return (
    <View
      {...props}
      style={[
        styles.card,

        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
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
    padding: Spacing.md,

    borderWidth: 1,
    borderRadius: Radius.lg,
  },
});
