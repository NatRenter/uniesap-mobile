import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { useAppTheme } from "@/hooks/useAppTheme";

export default function RootLayout() {
  const { isDark } = useAppTheme();

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />

      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      />
    </>
  );
}
