import type { ReactNode } from "react";

import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
} from "react-native";

import { FontSize, Radius, Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

type AppButtonVariant = "primary" | "secondary" | "danger" | "ghost";

interface AppButtonProps extends PressableProps {
  children: ReactNode;
  loading?: boolean;
  variant?: AppButtonVariant;
}

export function AppButton({
  children,
  loading = false,
  variant = "primary",
  disabled,
  style,
  ...props
}: AppButtonProps) {
  const { colors } = useAppTheme();

  const isDisabled = disabled || loading;

  const getBackgroundColor = () => {
    switch (variant) {
      case "primary":
        return colors.primary;

      case "danger":
        return colors.error;

      case "secondary":
      case "ghost":
        return "transparent";
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case "primary":
      case "danger":
        return "#FFFFFF";

      case "secondary":
      case "ghost":
        return colors.primary;
    }
  };

  return (
    <Pressable
      {...props}
      disabled={isDisabled}
      style={(state) => [
        styles.button,

        {
          backgroundColor: getBackgroundColor(),

          borderColor: variant === "secondary" ? colors.primary : "transparent",

          opacity: isDisabled ? 0.5 : state.pressed ? 0.85 : 1,
        },

        typeof style === "function" ? style(state) : style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === "secondary" || variant === "ghost"
              ? colors.primary
              : "#FFFFFF"
          }
        />
      ) : (
        <Text
          style={[
            styles.label,
            {
              color: getTextColor(),
            },
          ]}
        >
          {children}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,

    alignItems: "center",
    justifyContent: "center",

    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,

    borderRadius: Radius.md,
    borderWidth: 1,
  },

  label: {
    fontSize: FontSize.body,
    fontWeight: "600",
  },
});
