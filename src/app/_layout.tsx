import { useEffect, useState } from "react";

import { StyleSheet, Text, View } from "react-native";

import { Stack, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";

import AppTabs from "@/components/app-tabs";

/*
 * ============================================================================
 * PERSISTENCIA SQLITE - EMPRESAS
 * ============================================================================
 */
import {
  deleteCompanyFromDatabase,
  insertCompany,
  replaceCompany,
  selectAllCompanies,
} from "@/database/companyDatabase";

/*
 * ============================================================================
 * PERSISTENCIA SQLITE - EVIDENCIAS
 * ============================================================================
 */
import {
  deleteEvidenceFromDatabase,
  insertEvidence,
  replaceEvidence,
  selectAllEvidences,
} from "@/database/evidenceDatabase";

import {
  deleteReportFromDatabase,
  insertReport,
  replaceReport,
  selectAllReports,
} from "@/database/reportDatabase";

/*
 * ============================================================================
 * INICIALIZACIÓN SQLITE
 * ============================================================================
 */
import { initializeDatabase } from "@/database/initializeDatabase.native";

/*
 * ============================================================================
 * PERSISTENCIA SQLITE - INMUEBLES
 * ============================================================================
 */
import {
  deletePropertyFromDatabase,
  insertProperty,
  replaceProperty,
  selectAllProperties,
} from "@/database/propertyDatabase";

import { useAppTheme } from "@/hooks/useAppTheme";
import { useInspectionAutoSync } from "@/hooks/useInspectionAutoSync";

/*
 * ============================================================================
 * REPOSITORY - EMPRESAS
 * ============================================================================
 */
import {
  configureCompanyRepositoryPersistence,
  hydrateCompanyRepository,
} from "@/repositories/companyRepository";

/*
 * ============================================================================
 * REPOSITORY - EVIDENCIAS
 * ============================================================================
 */
import {
  configureEvidenceRepositoryPersistence,
  hydrateEvidenceRepository,
} from "@/repositories/evidenceRepository";

/*
 * ============================================================================
 * REPOSITORY - INSPECCIONES
 * ============================================================================
 */
import { hydrateInspectionRepository } from "@/repositories/inspectionRepository";

/*
 * ============================================================================
 * REPOSITORY - INMUEBLES
 * ============================================================================
 */
import {
  configurePropertyRepositoryPersistence,
  hydratePropertyRepository,
} from "@/repositories/propertyRepository";

import {
  configureReportRepositoryPersistence,
  hydrateReportRepository,
} from "@/repositories/reportRepository";

/*
 * ============================================================================
 * ROOT LAYOUT - ANDROID / IOS
 * ============================================================================
 *
 * Responsabilidades principales:
 *
 * 1. Inicializar SQLite.
 * 2. Ejecutar migraciones.
 * 3. Configurar adapters de persistencia.
 * 4. Hidratar empresas.
 * 5. Hidratar inmuebles.
 * 6. Hidratar inspecciones y evidencias.
 * 7. Activar sincronización automática.
 * 8. Renderizar Expo Router.
 *
 * ORDEN IMPORTANTE:
 *
 * CompanyRepository
 *        ↓
 * PropertyRepository
 *        ↓
 * InspectionRepository / EvidenceRepository
 *
 * Company debe hidratarse antes que Property porque SQLite
 * mantiene la relación:
 *
 * properties.company_id
 *        ↓
 * companies.id
 */
export default function RootLayout() {
  const pathname = usePathname();

  const { colors, isDark } = useAppTheme();

  const [databaseReady, setDatabaseReady] = useState<boolean | null>(null);

  const [databaseError, setDatabaseError] = useState<string | null>(null);

  /*
   * ==========================================================================
   * SINCRONIZACIÓN AUTOMÁTICA
   * ==========================================================================
   *
   * AutoSync solamente inicia después de que toda
   * la persistencia local terminó de hidratarse.
   */
  useInspectionAutoSync({
    enabled: databaseReady === true,
  });

  /*
   * ==========================================================================
   * INICIALIZACIÓN DE ALMACENAMIENTO
   * ==========================================================================
   */
  useEffect(() => {
    let active = true;

    async function initialize() {
      try {
        /*
         * ================================================================
         * 1. SQLITE + MIGRACIONES
         * ================================================================
         *
         * Aquí se crean, entre otras:
         *
         * companies
         * properties
         * inspections
         * evidences
         * user_profile
         * tablas Mock Kobo
         */
        await initializeDatabase();

        /*
         * ================================================================
         * 2. CONFIGURAR COMPANY REPOSITORY
         * ================================================================
         *
         * CompanyRepository no conoce directamente SQLite.
         *
         * Solamente conoce este contrato:
         *
         * loadAll
         * insert
         * replace
         * delete
         */
        configureCompanyRepositoryPersistence({
          async loadAll() {
            const companies = await selectAllCompanies();

            /*
             * Repository interpreta null como:
             *
             * "No existen datos persistidos todavía.
             *  Debo insertar el seed."
             */
            return companies.length === 0 ? null : companies;
          },

          insert: insertCompany,

          replace: replaceCompany,

          delete: deleteCompanyFromDatabase,
        });

        /*
         * ================================================================
         * 3. CONFIGURAR PROPERTY REPOSITORY
         * ================================================================
         */
        configurePropertyRepositoryPersistence({
          async loadAll() {
            const properties = await selectAllProperties();

            return properties.length === 0 ? null : properties;
          },

          insert: insertProperty,

          replace: replaceProperty,

          delete: deletePropertyFromDatabase,
        });

        /*
         * ================================================================
         * 4. CONFIGURAR EVIDENCE REPOSITORY
         * ================================================================
         *
         * Este flujo se conserva respecto de la versión estable.
         */
        configureEvidenceRepositoryPersistence({
          loadAll: selectAllEvidences,

          insert: insertEvidence,

          replace: replaceEvidence,

          delete: deleteEvidenceFromDatabase,
        });

        /*
         * ReportRepository utiliza SQLite en Android/iOS.
         */
        configureReportRepositoryPersistence({
          loadAll: selectAllReports,
          insert: insertReport,
          replace: replaceReport,
          delete: deleteReportFromDatabase,
        });

        /*
         * ================================================================
         * 5. HIDRATAR EMPRESAS
         * ================================================================
         *
         * Debe ocurrir primero porque Property.companyId
         * depende de Company.
         */
        await hydrateCompanyRepository();

        /*
         * ================================================================
         * 6. HIDRATAR INMUEBLES
         * ================================================================
         */
        await hydratePropertyRepository();

        /*
         * ================================================================
         * 7. HIDRATAR INSPECCIONES Y EVIDENCIAS
         * ================================================================
         *
         * Estas dos capas ya existían y conservamos
         * su funcionamiento actual.
         */
        await Promise.all([
          hydrateCompanyRepository(),
          hydratePropertyRepository(),
          hydrateInspectionRepository(),
          hydrateEvidenceRepository(),
          hydrateReportRepository(),
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

  /*
   * ==========================================================================
   * ESTADO DE CARGA
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
   * ERROR DE INICIALIZACIÓN
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
   * NAVEGACIÓN GLOBAL
   * ==========================================================================
   *
   * Login e index no muestran AppTabs.
   *
   * Las demás rutas conservan:
   *
   * Inicio
   * Empresas
   * Trabajo
   * Perfil
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
 * Stack ocupa todo el espacio disponible.
 *
 * AppTabs queda fuera del Stack para evitar
 * tapar contenido de las pantallas.
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
