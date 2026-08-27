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
  configureUserProfileRepositoryPersistence,
  hydrateUserProfileRepository,
} from "@/repositories/userProfileRepository";

import {
  loadWebEvidences,
  saveWebEvidences,
} from "@/repositories/evidenceWebStorage";

import {
  loadWebUserProfile,
  saveWebUserProfile,
} from "@/repositories/userProfileWebStorage";

import type { Evidence } from "@/types/evidence";

/*
 * ============================================================================
 * ROOT LAYOUT - WEB
 * ============================================================================
 *
 * Web conserva localStorage.
 *
 * Evidencias y perfil utilizan adaptadores independientes
 * para mantener los repositorios desacoplados de la plataforma.
 */
export default function WebRootLayout() {
  const pathname = usePathname();

  const { colors, isDark } = useAppTheme();

  const [repositoryReady, setRepositoryReady] = useState(false);

  const [repositoryError, setRepositoryError] = useState<string | null>(null);

  /*
   * Inicializa persistencia Web.
   */
  useEffect(() => {
    let active = true;

    async function initialize() {
      try {
        configureEvidenceRepositoryPersistence(
          createWebEvidencePersistenceAdapter(),
        );

        configureUserProfileRepositoryPersistence({
          async load() {
            return loadWebUserProfile();
          },

          async save(profile) {
            saveWebUserProfile(profile);
          },
        });

        await Promise.all([
          hydrateInspectionRepository(),

          hydrateEvidenceRepository(),

          hydrateUserProfileRepository(),
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

  useInspectionAutoSync({
    enabled: repositoryReady,
  });

  /*
   * Lo conservamos para el futuro diagnóstico Web.
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
 * Conserva exactamente la lógica existente.
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
