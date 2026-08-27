import { useEffect, useState } from "react";

import { StyleSheet, Text, View } from "react-native";

import { Stack, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";

import AppTabs from "@/components/app-tabs";

import {
  deleteEvidenceFromDatabase,
  insertEvidence,
  replaceEvidence,
  selectAllEvidences,
} from "@/database/evidenceDatabase";

import { initializeDatabase } from "@/database/initializeDatabase.native";

import {
  saveUserProfileToDatabase,
  selectUserProfile,
} from "@/database/userProfileDatabase";

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

/*
 * ============================================================================
 * ROOT LAYOUT - ANDROID / IOS
 * ============================================================================
 *
 * Responsabilidades:
 *
 * 1. Inicializar SQLite.
 * 2. Configurar persistencia de evidencias.
 * 3. Configurar persistencia del perfil.
 * 4. Hidratar repositorios.
 * 5. Activar sincronización automática.
 * 6. Mostrar navegación global.
 *
 * Kobo y la lógica de sincronización permanecen intactos.
 */
export default function RootLayout() {
  const pathname = usePathname();

  const { colors, isDark } = useAppTheme();

  const [databaseReady, setDatabaseReady] = useState<boolean | null>(null);

  const [databaseError, setDatabaseError] = useState<string | null>(null);

  useInspectionAutoSync({
    enabled: databaseReady === true,
  });

  /*
   * Inicializa todos los repositorios Native.
   *
   * Cada repositorio mantiene su propia responsabilidad,
   * pero RootLayout coordina el arranque.
   */
  useEffect(() => {
    let active = true;

    async function initialize() {
      try {
        await initializeDatabase();

        configureEvidenceRepositoryPersistence({
          loadAll: selectAllEvidences,

          insert: insertEvidence,

          replace: replaceEvidence,

          delete: deleteEvidenceFromDatabase,
        });

        configureUserProfileRepositoryPersistence({
          load: selectUserProfile,

          save: saveUserProfileToDatabase,
        });

        await Promise.all([
          hydrateInspectionRepository(),

          hydrateEvidenceRepository(),

          hydrateUserProfileRepository(),
        ]);

        if (!active) {
          return;
        }

        setDatabaseError(null);

        setDatabaseReady(true);
      } catch (error) {
        if (!active) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : "Error desconocido inicializando la base de datos.";

        console.error("Error inicializando almacenamiento local:", error);

        setDatabaseError(message);

        setDatabaseReady(false);
      }
    }

    void initialize();

    return () => {
      active = false;
    };
  }, []);

  if (databaseReady === null) {
    return (
      <View
        style={[
          styles.center,
          {
            backgroundColor: colors.background,
          },
        ]}
      >
        <StatusBar style={isDark ? "light" : "dark"} />

        <Text
          style={[
            styles.loadingTitle,
            {
              color: colors.text,
            },
          ]}
        >
          UNIESAP
        </Text>

        <Text
          style={[
            styles.loadingText,
            {
              color: colors.textSecondary,
            },
          ]}
        >
          Preparando almacenamiento local...
        </Text>
      </View>
    );
  }

  if (databaseReady === false) {
    return (
      <View
        style={[
          styles.center,
          {
            backgroundColor: colors.background,
          },
        ]}
      >
        <StatusBar style={isDark ? "light" : "dark"} />

        <Text
          style={[
            styles.errorTitle,
            {
              color: colors.error,
            },
          ]}
        >
          No fue posible iniciar UNIESAP
        </Text>

        <Text
          style={[
            styles.loadingText,
            {
              color: colors.textSecondary,
            },
          ]}
        >
          {databaseError}
        </Text>
      </View>
    );
  }

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

      <View style={styles.stack}>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "slide_from_right",
          }}
        />
      </View>

      {showGlobalNavigation ? <AppTabs /> : null}
    </View>
  );
}

/*
 * ============================================================================
 * ESTILOS
 * ============================================================================
 */
const styles = StyleSheet.create({
  app: {
    flex: 1,
  },

  stack: {
    flex: 1,
  },

  center: {
    flex: 1,

    alignItems: "center",
    justifyContent: "center",

    padding: 32,
  },

  loadingTitle: {
    fontSize: 28,
    fontWeight: "700",

    marginBottom: 8,
  },

  loadingText: {
    maxWidth: 420,

    fontSize: 15,
    lineHeight: 22,

    textAlign: "center",
  },

  errorTitle: {
    fontSize: 20,
    fontWeight: "700",

    textAlign: "center",

    marginBottom: 12,
  },
});
