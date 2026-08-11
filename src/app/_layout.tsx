import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import { useColorScheme } from "react-native";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            title: "Inicio",
          }}
        />

        <Stack.Screen
          name="router-test"
          options={{
            title: "Prueba de Router",
          }}
        />

        <Stack.Screen
          name="projects/index"
          options={{
            title: "Proyectos",
          }}
        />

        <Stack.Screen
          name="projects/[uid]"
          options={{
            title: "Detalle del proyecto",
          }}
        />

        <Stack.Screen
          name="explore"
          options={{
            title: "Explorar",
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}
