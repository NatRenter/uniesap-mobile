import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { useAppTheme } from "@/hooks/useAppTheme";

/*
 * ============================================================================
 * ROOT LAYOUT - WEB
 * ============================================================================
 *
 * Este archivo sustituye automáticamente a _layout.tsx
 * cuando Expo Router compila la aplicación web.
 *
 * NO importa:
 *
 * - expo-sqlite
 * - database.ts
 * - migrations.ts
 * - initializeDatabase.native.ts
 *
 * Por eso el bundle web nunca debería alcanzar
 * wa-sqlite.wasm.
 *
 * Web seguirá funcionando como entorno de:
 *
 * - desarrollo visual
 * - pruebas responsive
 * - navegación
 *
 * mientras SQLite se utiliza en Android/iOS.
 */
export default function WebRootLayout() {
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
