import { useEffect, useState } from "react";

import { StyleSheet, Text, View } from "react-native";

import { router, Stack, usePathname } from "expo-router";

import { StatusBar } from "expo-status-bar";

import AppTabs from "@/components/app-tabs";

/*
 * ============================================================================
 * SQLITE - EMPRESAS
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
 * SQLITE - PERFIL DE USUARIO
 * ============================================================================
 */
import {
  saveUserProfileToDatabase,
  selectUserProfile,
} from "@/database/userProfileDatabase";

/*
 * ============================================================================
 * REPOSITORY - PERFIL DE USUARIO
 * ============================================================================
 */
import {
  configureUserProfileRepositoryPersistence,
  hydrateUserProfileRepository,
} from "@/repositories/userProfileRepository";

/*
 * ============================================================================
 * SQLITE - EVIDENCIAS
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
 * SQLITE - FORMULARIOS
 * ============================================================================
 */
import {
  deleteFormFromDatabase,
  insertForm,
  replaceForm,
  selectAllForms,
} from "@/database/formDatabase";

/*
 * ============================================================================
 * SQLITE - INICIALIZACIÓN
 * ============================================================================
 */
import { initializeDatabase } from "@/database/initializeDatabase.native";

/*
 * ============================================================================
 * SQLITE - INMUEBLES
 * ============================================================================
 */
import {
  deletePropertyFromDatabase,
  insertProperty,
  replaceProperty,
  selectAllProperties,
} from "@/database/propertyDatabase";

/*
 * ============================================================================
 * SQLITE - MIGRACIONES PROPERTY ↔ FORM
 * ============================================================================
 */
import {
  migrateLegacyPropertyFormsIfNeeded,
  removeLegacyPropertyFormColumnIfNeeded,
} from "@/database/propertyMigrationDatabase";

/*
 * ============================================================================
 * SQLITE - REPORTES
 * ============================================================================
 */
import {
  deleteReportFromDatabase,
  insertReport,
  replaceReport,
  selectAllReports,
} from "@/database/reportDatabase";

import { useAppTheme } from "@/hooks/useAppTheme";

import { useInspectionAutoSync } from "@/hooks/useInspectionAutoSync";

/*
 * ============================================================================
 * REPOSITORY - AUTENTICACIÓN
 * ============================================================================
 */
import {
  getAuthSession,
  hydrateAuthSessionRepository,
  subscribeToAuthSession,
} from "@/repositories/authSessionRepository";

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

import type { AuthSession } from "@/types/auth";

/*
 * ============================================================================
 * ROOT LAYOUT - ANDROID / IOS
 * ============================================================================
 *
 * Responsabilidades:
 *
 * 1. Inicializar SQLite.
 * 2. Configurar adaptadores de persistencia.
 * 3. Hidratar repositories.
 * 4. Restaurar la sesión segura.
 * 5. Ejecutar migraciones necesarias.
 * 6. Proteger las rutas privadas.
 * 7. Habilitar navegación.
 * 8. Habilitar Auto Sync.
 */
export default function RootLayout() {
  const pathname = usePathname();

  const { colors, isDark } = useAppTheme();

  const [databaseReady, setDatabaseReady] = useState<boolean | null>(null);

  const [databaseError, setDatabaseError] = useState<string | null>(null);

  /*
   * null mientras SecureStore todavía no ha sido consultado.
   */
  const [authReady, setAuthReady] = useState(false);

  /*
   * Sesión actualmente disponible.
   *
   * El estado permite que el layout reaccione inmediatamente
   * a registro, login, restauración y logout.
   */
  const [authSession, setAuthSessionState] = useState<AuthSession | null>(
    getAuthSession(),
  );

  /*
   * ==========================================================================
   * AUTO SYNC
   * ==========================================================================
   *
   * No ejecutamos sincronización hasta que:
   *
   * - SQLite esté listo;
   * - autenticación haya sido restaurada;
   * - exista un usuario autenticado.
   */
  useInspectionAutoSync({
    enabled: databaseReady === true && authReady && authSession !== null,
  });

  /*
   * ==========================================================================
   * OBSERVAR SESIÓN
   * ==========================================================================
   *
   * AuthSessionRepository notifica cuando:
   *
   * - se registra un usuario;
   * - se restaura una sesión;
   * - se inicia sesión;
   * - se cierra sesión.
   */
  useEffect(() => {
    return subscribeToAuthSession((session) => {
      setAuthSessionState(session);
    });
  }, []);

  /*
   * ==========================================================================
   * INICIALIZACIÓN
   * ==========================================================================
   */
  useEffect(() => {
    let active = true;

    async function initialize() {
      try {
        /*
         * ====================================================================
         * 1. SQLITE + ESQUEMA
         * ====================================================================
         */
        await initializeDatabase();

        /*
         * ====================================================================
         * 2. CONFIGURAR USER PROFILE REPOSITORY
         * ====================================================================
         */
        configureUserProfileRepositoryPersistence({
          load: selectUserProfile,

          save: saveUserProfileToDatabase,
        });

        /*
         * ====================================================================
         * 3. CONFIGURAR COMPANY REPOSITORY
         * ====================================================================
         */
        configureCompanyRepositoryPersistence({
          async loadAll() {
            const companies = await selectAllCompanies();

            return companies.length === 0 ? null : companies;
          },

          insert: insertCompany,

          replace: replaceCompany,

          delete: deleteCompanyFromDatabase,
        });

        /*
         * ====================================================================
         * 4. CONFIGURAR FORM REPOSITORY
         * ====================================================================
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
         * 5. CONFIGURAR PROPERTY REPOSITORY
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
         * 6. CONFIGURAR EVIDENCE REPOSITORY
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
         * 7. CONFIGURAR REPORT REPOSITORY
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
         * 8. COMPANY
         * ====================================================================
         */
        await hydrateCompanyRepository();

        /*
         * ====================================================================
         * 9. USER PROFILE
         * ====================================================================
         */
        await hydrateUserProfileRepository();

        /*
         * ====================================================================
         * 10. FORM
         * ====================================================================
         */
        await hydrateFormRepository();

        /*
         * ====================================================================
         * 11. FORM - HIDRATACIÓN EXISTENTE
         * ====================================================================
         *
         * Se conserva temporalmente esta segunda hidratación tal como estaba.
         * No la modificamos dentro del bloque de autenticación.
         */
        await hydrateFormRepository();

        /*
         * ====================================================================
         * 12. MIGRACIÓN LEGACY PROPERTY ↔ FORM
         * ====================================================================
         */
        await migrateLegacyPropertyFormsIfNeeded();

        /*
         * ====================================================================
         * 13. RETIRAR FORM_IDS_JSON
         * ====================================================================
         */
        await removeLegacyPropertyFormColumnIfNeeded();

        /*
         * ====================================================================
         * 14. PROPERTY
         * ====================================================================
         */
        await hydratePropertyRepository();

        /*
         * ====================================================================
         * 15. RESTO DE REPOSITORIES
         * ====================================================================
         */
        await Promise.all([
          hydrateInspectionRepository(),

          hydrateEvidenceRepository(),

          hydrateReportRepository(),
        ]);

        /*
         * ====================================================================
         * 16. RESTAURAR AUTENTICACIÓN
         * ====================================================================
         *
         * En Android/iOS utiliza SecureStore.
         *
         * No continuamos con navegación protegida hasta conocer
         * definitivamente si existe o no una sesión.
         */
        await hydrateAuthSessionRepository();

        if (!active) {
          return;
        }

        setAuthSessionState(getAuthSession());

        setAuthReady(true);

        /*
         * ====================================================================
         * 17. INICIALIZACIÓN COMPLETADA
         * ====================================================================
         */
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
   * PROTECCIÓN DE RUTAS
   * ==========================================================================
   *
   * Rutas públicas:
   *
   * /
   * /login
   * /registro
   *
   * Todas las demás requieren AuthSession.
   */
  useEffect(() => {
    if (databaseReady !== true || !authReady) {
      return;
    }

    const isRootRoute = pathname === "/";

    const isAuthRoute = pathname === "/login" || pathname === "/registro";

    /*
     * Usuario NO autenticado.
     *
     * Si intenta entrar a cualquier ruta privada,
     * regresamos al Login.
     */
    if (!authSession) {
      if (!isRootRoute && !isAuthRoute) {
        router.replace("/login");
      }

      return;
    }

    /*
     * Usuario autenticado.
     *
     * No tiene sentido volver a Login, Registro o Index.
     */
    if (isRootRoute || isAuthRoute) {
      router.replace("/dashboard");
    }
  }, [authReady, authSession, databaseReady, pathname]);

  /*
   * ==========================================================================
   * CARGANDO
   * ==========================================================================
   *
   * Esperamos tanto SQLite como SecureStore.
   *
   * Esto evita mostrar Login durante unos milisegundos antes
   * de descubrir que el usuario ya tenía una sesión persistida.
   */
  if (databaseReady === null || !authReady) {
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
          Preparando almacenamiento y sesión...
        </Text>
      </View>
    );
  }

  /*
   * ==========================================================================
   * ERROR
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
   * NAVEGACIÓN
   * ==========================================================================
   *
   * La navegación global solo aparece:
   *
   * - después de restaurar autenticación;
   * - cuando existe sesión;
   * - dentro de una ruta privada.
   */
  const isPublicRoute =
    pathname === "/" || pathname === "/login" || pathname === "/registro";

  const showGlobalNavigation = authSession !== null && !isPublicRoute;

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
