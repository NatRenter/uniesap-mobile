import { StyleSheet, TextInput, type TextInputProps } from "react-native";

import { FontSize, Radius, Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

export function AppTextInput({ style, ...props }: TextInputProps) {
  const { colors } = useAppTheme();

  return (
    <TextInput
      {...props}
      placeholderTextColor={colors.textMuted}
      selectionColor={colors.primary}
      style={[
        styles.input,

        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          color: colors.text,
        },

        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 52,

    paddingHorizontal: Spacing.md,

    borderWidth: 1,
    borderRadius: Radius.md,

    fontSize: FontSize.body,
  },
});
