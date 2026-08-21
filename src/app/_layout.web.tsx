import { Stack } from "expo-router";

import { StatusBar } from "expo-status-bar";

import { useAppTheme } from "@/hooks/useAppTheme";
import { useInspectionAutoSync } from "@/hooks/useInspectionAutoSync";

import { hydrateInspectionRepository } from "@/repositories/inspectionRepository";

import { useEffect, useState } from "react";

/*
 * ============================================================================
 * ROOT LAYOUT - WEB
 * ============================================================================
 *
 * Web no utiliza SQLite.
 *
 * Persistencia:
 *
 * localStorage
 *
 * Sincronización:
 *
 * NetInfo
 *    ↓
 * useInspectionAutoSync
 *    ↓
 * InspectionSyncQueueService
 */

export default function WebRootLayout() {
  const { isDark } = useAppTheme();

  const [repositoryReady, setRepositoryReady] = useState(false);

  /*
   * El repositorio web ya recupera localStorage
   * durante su inicialización.
   *
   * Ejecutamos hydrateInspectionRepository()
   * para mantener el mismo ciclo conceptual que
   * utilizamos en Android.
   */
  useEffect(() => {
    let active = true;

    async function initialize() {
      await hydrateInspectionRepository();

      if (!active) {
        return;
      }

      setRepositoryReady(true);
    }

    void initialize();

    return () => {
      active = false;
    };
  }, []);

  /*
   * Solamente activamos la sincronización cuando
   * el repositorio web está preparado.
   */
  useInspectionAutoSync({
    enabled: repositoryReady,
  });

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
