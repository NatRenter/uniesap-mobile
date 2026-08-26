import { useEffect, useState } from "react";

import { StyleSheet, View } from "react-native";

import { Stack, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";

import AppTabs from "@/components/app-tabs";

import { useAppTheme } from "@/hooks/useAppTheme";
import { useInspectionAutoSync } from "@/hooks/useInspectionAutoSync";

import {
  configureEvidenceRepositoryPersistence,
  hydrateEvidenceRepository,
} from "@/repositories/evidenceRepository";

import { hydrateInspectionRepository } from "@/repositories/inspectionRepository";

import {
  loadWebEvidences,
  saveWebEvidences,
} from "@/repositories/evidenceWebStorage";

import type { Evidence } from "@/types/evidence";

/*
 * ============================================================================
 * ROOT LAYOUT - WEB
 * ============================================================================
 *
 * Web conserva localStorage para evidencias/inspecciones.
 *
 * La navegación global se coloca arriba para aprovechar mejor
 * el espacio disponible en escritorio.
 */
export default function WebRootLayout() {
  const pathname = usePathname();

  const { colors, isDark } = useAppTheme();

  const [repositoryReady, setRepositoryReady] = useState(false);

  const [repositoryError, setRepositoryError] = useState<string | null>(null);

  /*
   * Inicializa la persistencia Web.
   *
   * Este flujo conserva el comportamiento estable que ya teníamos.
   */
  useEffect(() => {
    let active = true;

    async function initialize() {
      try {
        configureEvidenceRepositoryPersistence(
          createWebEvidencePersistenceAdapter(),
        );

        await Promise.all([
          hydrateInspectionRepository(),
          hydrateEvidenceRepository(),
        ]);

        if (!active) {
          return;
        }

        setRepositoryError(null);
        setRepositoryReady(true);
      } catch (error) {
        if (!active) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : "Error desconocido inicializando los repositorios Web.";

        console.error("Error inicializando repositorios Web:", error);

        setRepositoryError(message);
        setRepositoryReady(false);
      }
    }

    void initialize();

    return () => {
      active = false;
    };
  }, []);

  /*
   * La sincronización automática solo inicia cuando
   * los repositorios ya están preparados.
   */
  useInspectionAutoSync({
    enabled: repositoryReady,
  });

  /*
   * repositoryError se conserva para el futuro centro de diagnóstico.
   */
  void repositoryError;

  const showGlobalNavigation = pathname !== "/" && pathname !== "/login";

  return (
    <View
      style={[
        styles.app,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <StatusBar style={isDark ? "light" : "dark"} />

      {showGlobalNavigation ? <AppTabs /> : null}

      <View style={styles.stack}>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "slide_from_right",
          }}
        />
      </View>
    </View>
  );
}

/*
 * ============================================================================
 * ADAPTADOR WEB DE EVIDENCIAS
 * ============================================================================
 *
 * Conecta EvidenceRepository con localStorage.
 *
 * insert() continúa siendo idempotente para soportar Fast Refresh
 * sin crear evidencias duplicadas.
 */
function createWebEvidencePersistenceAdapter() {
  return {
    async loadAll(): Promise<Evidence[] | null> {
      return loadWebEvidences();
    },

    async insert(evidence: Evidence): Promise<void> {
      const current = loadWebEvidences() ?? [];

      const existingIndex = current.findIndex(
        (item) => item.id === evidence.id,
      );

      if (existingIndex !== -1) {
        console.log(
          `Evidencia ${evidence.id} ya persistida en Web. Se omite inserción duplicada.`,
        );

        return;
      }

      saveWebEvidences([evidence, ...current]);
    },

    async replace(evidence: Evidence): Promise<void> {
      const current = loadWebEvidences() ?? [];

      const index = current.findIndex((item) => item.id === evidence.id);

      if (index === -1) {
        saveWebEvidences([evidence, ...current]);

        return;
      }

      const updated = [...current];

      updated[index] = evidence;

      saveWebEvidences(updated);
    },

    async delete(id: string): Promise<boolean> {
      const current = loadWebEvidences() ?? [];

      const updated = current.filter((evidence) => evidence.id !== id);

      if (updated.length === current.length) {
        return false;
      }

      saveWebEvidences(updated);

      return true;
    },
  };
}

/*
 * ============================================================================
 * ESTILOS WEB
 * ============================================================================
 */
const styles = StyleSheet.create({
  app: {
    flex: 1,
  },

  stack: {
    flex: 1,
  },
});
