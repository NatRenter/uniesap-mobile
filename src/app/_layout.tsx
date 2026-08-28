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

/*
 * ============================================================================
 * PERSISTENCIA SQLITE - FORMULARIOS
 * ============================================================================
 *
 * FormDatabase es el adaptador físico entre
 * FormRepository y SQLite.
 */
import {
  deleteFormFromDatabase,
  insertForm,
  replaceForm,
  selectAllForms,
} from "@/database/formDatabase";

/*
 * ============================================================================
 * PERSISTENCIA SQLITE - REPORTES
 * ============================================================================
 */
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
 * REPOSITORY - FORMULARIOS
 * ============================================================================
 */
import {
  configureFormRepositoryPersistence,
  hydrateFormRepository,
} from "@/repositories/formRepository";

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

/*
 * ============================================================================
 * REPOSITORY - REPORTES
 * ============================================================================
 */
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
 * 6. Hidratar formularios.
 * 7. Hidratar inspecciones.
 * 8. Hidratar evidencias.
 * 9. Hidratar reportes.
 * 10. Activar sincronización automática.
 * 11. Renderizar Expo Router.
 *
 * Arquitectura:
 *
 * UI
 *  ↓
 * Repository
 *  ↓
 * Database Adapter
 *  ↓
 * SQLite
 */
export default function RootLayout() {
  const pathname = usePathname();

  const { colors, isDark } = useAppTheme();

  /*
   * null  → inicializando
   * true  → almacenamiento listo
   * false → error
   */
  const [databaseReady, setDatabaseReady] = useState<boolean | null>(null);

  const [databaseError, setDatabaseError] = useState<string | null>(null);

  /*
   * ==========================================================================
   * SINCRONIZACIÓN AUTOMÁTICA
   * ==========================================================================
   *
   * No permitimos AutoSync hasta que toda la persistencia
   * local esté preparada.
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
         * ====================================================================
         * PASO 1 - SQLITE + MIGRACIONES
         * ====================================================================
         *
         * initializeDatabase() prepara la base de datos
         * y ejecuta runDatabaseMigrations().
         *
         * Aquí deben existir ya:
         *
         * companies
         * properties
         * forms
         * inspections
         * inspection_responses
         * evidences
         * reports
         * user_profile
         * mock_kobo_submissions
         * mock_kobo_attachments
         */
        await initializeDatabase();

        /*
         * ====================================================================
         * PASO 2 - COMPANY REPOSITORY
         * ====================================================================
         */
        configureCompanyRepositoryPersistence({
          async loadAll() {
            const companies = await selectAllCompanies();

            /*
             * null significa que la persistencia está vacía.
             *
             * El repository podrá insertar entonces
             * sus datos seed iniciales.
             */
            return companies.length === 0 ? null : companies;
          },

          insert: insertCompany,

          replace: replaceCompany,

          delete: deleteCompanyFromDatabase,
        });

        /*
         * ====================================================================
         * PASO 3 - PROPERTY REPOSITORY
         * ====================================================================
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
         * ====================================================================
         * PASO 4 - FORM REPOSITORY
         * ====================================================================
         *
         * A partir de aquí los formularios pueden vivir
         * físicamente dentro de SQLite.
         */
        configureFormRepositoryPersistence({
          async loadAll() {
            const forms = await selectAllForms();

            return forms.length === 0 ? null : forms;
          },

          insert: insertForm,

          replace: replaceForm,

          delete: deleteFormFromDatabase,
        });

        /*
         * ====================================================================
         * PASO 5 - EVIDENCE REPOSITORY
         * ====================================================================
         */
        configureEvidenceRepositoryPersistence({
          loadAll: selectAllEvidences,

          insert: insertEvidence,

          replace: replaceEvidence,

          delete: deleteEvidenceFromDatabase,
        });

        /*
         * ====================================================================
         * PASO 6 - REPORT REPOSITORY
         * ====================================================================
         */
        configureReportRepositoryPersistence({
          loadAll: selectAllReports,

          insert: insertReport,

          replace: replaceReport,

          delete: deleteReportFromDatabase,
        });

        /*
         * ====================================================================
         * PASO 7 - HIDRATACIÓN
         * ====================================================================
         *
         * Primero hidratamos Company porque Property depende
         * de Company mediante:
         *
         * properties.company_id → companies.id
         */
        await hydrateCompanyRepository();

        /*
         * Property puede hidratarse después de Company.
         */
        await hydratePropertyRepository();

        /*
         * Los demás repositories ya pueden hidratarse.
         *
         * FormRepository se encuentra aquí antes de permitir
         * que la interfaz se renderice.
         */
        await Promise.all([
          hydrateFormRepository(),

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
