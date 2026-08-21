import { useEffect, useState } from "react";

import { StyleSheet, Text, View } from "react-native";

import { Stack } from "expo-router";

import { StatusBar } from "expo-status-bar";

import { initializeDatabase } from "@/database/initializeDatabase.native";

import { useAppTheme } from "@/hooks/useAppTheme";
import { useInspectionAutoSync } from "@/hooks/useInspectionAutoSync";

import { hydrateInspectionRepository } from "@/repositories/inspectionRepository";

/*
 * ============================================================================
 * ROOT LAYOUT - ANDROID / IOS
 * ============================================================================
 *
 * Flujo de inicialización:
 *
 * SQLite
 *    ↓
 * migraciones / seed
 *    ↓
 * hidratar repositorio
 *    ↓
 * aplicación preparada
 *    ↓
 * activar sincronización automática
 */

export default function RootLayout() {
  const { colors, isDark } = useAppTheme();

  const [databaseReady, setDatabaseReady] = useState<boolean | null>(null);

  const [databaseError, setDatabaseError] = useState<string | null>(null);

  /*
   * IMPORTANTE:
   *
   * El hook siempre se ejecuta respetando
   * las reglas de Hooks de React.
   *
   * Sin embargo permanece inactivo hasta
   * que SQLite y el repositorio estén listos.
   */
  useInspectionAutoSync({
    enabled: databaseReady === true,
  });

  /*
   * ==========================================================================
   * INICIALIZACIÓN LOCAL
   * ==========================================================================
   */
  useEffect(() => {
    let active = true;

    async function initialize() {
      try {
        /*
         * PASO 1
         *
         * Inicializar SQLite.
         */
        await initializeDatabase();

        /*
         * PASO 2
         *
         * Reconstruir el repositorio en memoria
         * usando los datos persistidos.
         */
        await hydrateInspectionRepository();

        if (!active) {
          return;
        }

        /*
         * PASO 3
         *
         * Permitir renderizar la aplicación
         * y activar useInspectionAutoSync().
         */
        setDatabaseReady(true);
      } catch (error) {
        if (!active) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : "Error desconocido inicializando la base de datos.";

        console.error("Error inicializando SQLite:", error);

        setDatabaseError(message);

        setDatabaseReady(false);
      }
    }

    void initialize();

    return () => {
      active = false;
    };
  }, []);

  /*
   * ==========================================================================
   * INICIALIZANDO
   * ==========================================================================
   */

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

  /*
   * ==========================================================================
   * ERROR SQLITE
   * ==========================================================================
   */

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
   * ==========================================================================
   * APLICACIÓN
   * ==========================================================================
   */

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

const styles = StyleSheet.create({
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
