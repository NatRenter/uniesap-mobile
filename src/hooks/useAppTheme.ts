import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export function useAppTheme() {
  const scheme = useColorScheme();

  const colorScheme = scheme === "unspecified" ? "light" : scheme;
  const isDark = colorScheme === "dark";

  return {
    colors: Colors[colorScheme],
    isDark,
    colorScheme,
  };
}
