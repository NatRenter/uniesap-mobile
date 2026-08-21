import { useEffect, useState } from "react";

import { StyleSheet, Text, View } from "react-native";

import { hydrateInspectionRepository } from "@/repositories/inspectionRepository";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { initializeDatabase } from "@/database/initializeDatabase.native";

import { useAppTheme } from "@/hooks/useAppTheme";

/*
 * ============================================================================
 * ROOT LAYOUT - ANDROID / IOS
 * ============================================================================
 *
 * Este layout se utiliza en las plataformas nativas.
 *
 * Aquí sí podemos cargar SQLite porque expo-sqlite
 * forma parte de la aplicación Android/iOS.
 */
export default function RootLayout() {
  const { colors, isDark } = useAppTheme();

  const [databaseReady, setDatabaseReady] = useState<boolean | null>(null);

  const [databaseError, setDatabaseError] = useState<string | null>(null);

  /*
   * Inicializamos SQLite antes de permitir
   * que las pantallas utilicen la persistencia.
   */
  useEffect(() => {
    let active = true;

    async function initialize() {
      try {
        /*
         * Primero preparamos SQLite.
         */
        await initializeDatabase();

        /*
         * Después cargamos las inspecciones persistidas
         * dentro del repositorio temporal en memoria.
         *
         * Gracias a esto las pantallas actuales todavía
         * pueden realizar consultas síncronas.
         */
        await hydrateInspectionRepository();

        if (!active) {
          return;
        }

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

    initialize();

    return () => {
      active = false;
    };
  }, []);

  /*
   * Mientras SQLite prepara las tablas.
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
   * Si SQLite falla mostramos el error
   * en lugar de abrir una aplicación
   * con almacenamiento inconsistente.
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
