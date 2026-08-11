import { StyleSheet, TextInput, type TextInputProps } from "react-native";

import { colors, radius, spacing, typography } from "@/theme";

export function AppTextInput({ style, ...props }: TextInputProps) {
  return (
    <TextInput
      {...props}
      placeholderTextColor={colors.textSecondary}
      style={[styles.input, style]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 48,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    fontSize: typography.fontSize.md,
  },
});
