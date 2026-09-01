import { useEffect, useState } from "react";

import { StyleSheet, Text, View } from "react-native";

import { Stack, usePathname } from "expo-router";

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
 *
 * Persistencia nativa del perfil.
 *
 * UserProfileRepository
 *        ↓
 * UserProfileDatabase
 *        ↓
 * SQLite / user_profile
 */
import {
  saveUserProfileToDatabase,
  selectUserProfile,
} from "@/database/userProfileDatabase";

/*
 * ============================================================================
 * REPOSITORY - PERFIL DE USUARIO
 * ============================================================================
 *
 * El repository mantiene el perfil utilizado por la interfaz
 * y delega la persistencia al adaptador configurado durante
 * el arranque.
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
 *
 * PropertyDatabase administra el CRUD normal de:
 *
 * properties
 *
 * Las relaciones Property ↔ Form se delegan internamente a:
 *
 * PropertyFormDatabase
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
 *
 * Estas funciones solamente mantienen compatibilidad con instalaciones
 * anteriores de UNIESAP.
 *
 * Internamente realizan todas las comprobaciones necesarias antes de
 * modificar el esquema.
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
 * Esta es la raíz de inicialización de UNIESAP para plataformas nativas.
 *
 * ============================================================================
 * RESPONSABILIDADES
 * ============================================================================
 *
 * 1. Inicializar SQLite.
 * 2. Configurar los adaptadores de persistencia.
 * 3. Hidratar repositories.
 * 4. Ejecutar migraciones necesarias.
 * 5. Habilitar la navegación.
 * 6. Habilitar Auto Sync cuando la base esté preparada.
 *
 * ============================================================================
 * LO QUE YA NO HACEMOS AQUÍ
 * ============================================================================
 *
 * Los diagnósticos detallados de:
 *
 * - Property ↔ Form;
 * - columnas SQLite;
 * - relaciones huérfanas;
 * - estado de form_ids_json;
 *
 * pertenecen ahora a las herramientas de:
 *
 * Perfil
 *   ↓
 * Opciones de desarrollador
 *   ↓
 * Diagnóstico SQLite
 *
 * ============================================================================
 * ORDEN DE INICIALIZACIÓN
 * ============================================================================
 *
 * SQLite / esquema
 *      ↓
 * configurar repositories
 *      ↓
 * Company
 *      ↓
 * Form
 *      ↓
 * migración legacy Property ↔ Form
 *      ↓
 * retirada legacy de form_ids_json
 *      ↓
 * Property
 *      ↓
 * Inspection / Evidence / Report
 *      ↓
 * aplicación preparada
 */
export default function RootLayout() {
  const pathname = usePathname();

  const { colors, isDark } = useAppTheme();

  const [databaseReady, setDatabaseReady] = useState<boolean | null>(null);

  const [databaseError, setDatabaseError] = useState<string | null>(null);

  /*
   * ==========================================================================
   * AUTO SYNC
   * ==========================================================================
   *
   * La sincronización automática solamente puede comenzar
   * después de que toda la persistencia local haya terminado
   * correctamente de inicializarse.
   */
  useInspectionAutoSync({
    enabled: databaseReady === true,
  });

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
         * CONFIGURAR USER PROFILE REPOSITORY
         * ====================================================================
         *
         * En Native:
         *
         * UserProfileRepository
         *        ↓
         * UserProfileDatabase
         *        ↓
         * SQLite
         *
         * load:
         * recupera el registro "current-user".
         *
         * save:
         * inserta o reemplaza el perfil completo.
         */
        configureUserProfileRepositoryPersistence({
          load: selectUserProfile,

          save: saveUserProfileToDatabase,
        });

        /*
         * ====================================================================
         * 2. CONFIGURAR COMPANY REPOSITORY
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
         * 3. CONFIGURAR FORM REPOSITORY
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
         * 4. CONFIGURAR PROPERTY REPOSITORY
         * ====================================================================
         *
         * PropertyDatabase se encarga internamente de reconstruir:
         *
         * Property.formIds
         *
         * utilizando PropertyFormDatabase.
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
         * 5. CONFIGURAR EVIDENCE REPOSITORY
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
         * 6. CONFIGURAR REPORT REPOSITORY
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
         * 7. COMPANY
         * ====================================================================
         */
        await hydrateCompanyRepository();

        /*
         * ====================================================================
         * USER PROFILE
         * ====================================================================
         *
         * Recupera el perfil persistido desde SQLite.
         *
         * Si todavía no existe:
         *
         * createInitialProfile()
         *        ↓
         * saveUserProfileToDatabase()
         *        ↓
         * user_profile
         *
         * Si ya existe:
         *
         * SQLite
         *        ↓
         * selectUserProfile()
         *        ↓
         * currentProfile
         *
         * Esto debe ocurrir antes de mostrar Dashboard o Perfil,
         * porque ambas pantallas consumen UserProfileRepository.
         */
        await hydrateUserProfileRepository();

        /*
         * ====================================================================
         * FORM
         * ====================================================================
         */
        await hydrateFormRepository();

        /*
         * ====================================================================
         * 8. FORM
         * ====================================================================
         *
         * Los formularios deben existir antes de ejecutar
         * cualquier migración Property ↔ Form.
         */
        await hydrateFormRepository();

        /*
         * ====================================================================
         * 9. MIGRACIÓN LEGACY PROPERTY ↔ FORM
         * ====================================================================
         *
         * Instalaciones antiguas:
         *
         * properties.form_ids_json
         *           ↓
         * property_forms
         *
         * Instalaciones modernas:
         *
         * migration_history
         *           ↓
         * operación omitida
         *
         * La propia migración contiene sus verificaciones internas.
         */
        await migrateLegacyPropertyFormsIfNeeded();

        /*
         * ====================================================================
         * 10. RETIRAR FORM_IDS_JSON
         * ====================================================================
         *
         * Esta operación también es idempotente.
         *
         * Si la migración ya fue aplicada:
         *
         * no modifica la base.
         *
         * Si se trata de una instalación antigua:
         *
         * verifica integridad antes de retirar la columna.
         */
        await removeLegacyPropertyFormColumnIfNeeded();

        /*
         * ====================================================================
         * 11. PROPERTY
         * ====================================================================
         *
         * PropertyRepository se hidrata después de las migraciones.
         *
         * A partir de aquí Property.formIds proviene exclusivamente
         * de property_forms.
         */
        await hydratePropertyRepository();

        /*
         * ====================================================================
         * 12. RESTO DE REPOSITORIES
         * ====================================================================
         *
         * Estos repositories ya pueden hidratarse en paralelo.
         */
        await Promise.all([
          hydrateInspectionRepository(),

          hydrateEvidenceRepository(),

          hydrateReportRepository(),
        ]);

        /*
         * ====================================================================
         * 13. INICIALIZACIÓN COMPLETADA
         * ====================================================================
         */
        if (!active) {
          return;
        }

        setDatabaseError(null);

        setDatabaseReady(true);
      } catch (error) {
        /*
         * Si el componente se desmontó durante la inicialización,
         * ignoramos el resultado.
         */
        if (!active) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : "Error desconocido inicializando la base de datos.";

        /*
         * Este log sí se conserva.
         *
         * Los errores de inicialización son relevantes incluso
         * fuera de las herramientas de desarrollador.
         */
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
   * CARGANDO
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
