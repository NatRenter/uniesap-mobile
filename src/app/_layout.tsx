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

import { useAppTheme } from "@/hooks/useAppTheme";
import { useInspectionAutoSync } from "@/hooks/useInspectionAutoSync";

import {
  configureEvidenceRepositoryPersistence,
  hydrateEvidenceRepository,
} from "@/repositories/evidenceRepository";

import { hydrateInspectionRepository } from "@/repositories/inspectionRepository";

/*
 * ============================================================================
 * ROOT LAYOUT - ANDROID / IOS
 * ============================================================================
 *
 * Responsabilidades:
 *
 * 1. Inicializar SQLite.
 * 2. Hidratar repositorios.
 * 3. Activar sincronización automática.
 * 4. Mostrar el Stack de Expo Router.
 * 5. Mantener la navegación global en la parte inferior.
 *
 * No modificamos aquí la lógica de Kobo ni la lógica de evidencias.
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
   * Inicialización del almacenamiento nativo.
   *
   * Este flujo se conserva respecto de la versión estable anterior.
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

        await Promise.all([
          hydrateInspectionRepository(),
          hydrateEvidenceRepository(),
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

  /*
   * Login e index quedan fuera de la navegación principal.
   *
   * Todas las demás rutas, incluidas rutas contextuales y herramientas
   * de desarrollo, conservan un acceso rápido a Inicio/Empresas/Trabajo/Perfil.
   */
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
 *
 * Stack ocupa el espacio restante.
 * AppTabs se mantiene como una zona independiente debajo del contenido.
 *
 * Así evitamos que la barra tape botones o información de las pantallas.
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
