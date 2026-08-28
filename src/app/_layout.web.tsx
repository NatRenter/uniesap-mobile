import { useEffect, useState } from "react";

import { StyleSheet, View } from "react-native";

import { Stack, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";

import AppTabs from "@/components/app-tabs";

import { useAppTheme } from "@/hooks/useAppTheme";
import { useInspectionAutoSync } from "@/hooks/useInspectionAutoSync";

/*
 * ============================================================================
 * REPOSITORIES
 * ============================================================================
 */

import {
  configureCompanyRepositoryPersistence,
  hydrateCompanyRepository,
} from "@/repositories/companyRepository";

import {
  configureEvidenceRepositoryPersistence,
  hydrateEvidenceRepository,
} from "@/repositories/evidenceRepository";

import {
  configureFormRepositoryPersistence,
  hydrateFormRepository,
} from "@/repositories/formRepository";

import { hydrateInspectionRepository } from "@/repositories/inspectionRepository";

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
 * WEB STORAGE
 * ============================================================================
 */

import {
  loadWebCompanies,
  saveWebCompanies,
} from "@/repositories/companyWebStorage";

import {
  loadWebEvidences,
  saveWebEvidences,
} from "@/repositories/evidenceWebStorage";

import { loadWebForms, saveWebForms } from "@/repositories/formWebStorage";

import {
  loadWebProperties,
  saveWebProperties,
} from "@/repositories/propertyWebStorage";

import {
  loadWebReports,
  saveWebReports,
} from "@/repositories/reportWebStorage";

/*
 * ============================================================================
 * TYPES
 * ============================================================================
 */

import type { Company } from "@/types/company";
import type { Evidence } from "@/types/evidence";
import type { FormDefinition } from "@/types/form";
import type { Property } from "@/types/property";
import type { Report } from "@/types/report";

/*
 * ============================================================================
 * ROOT LAYOUT - WEB
 * ============================================================================
 *
 * Responsabilidades:
 *
 * 1. Configurar persistencia Web.
 * 2. Conectar repositories con localStorage.
 * 3. Hidratar repositories.
 * 4. Activar sincronización automática.
 * 5. Renderizar Expo Router.
 *
 * Arquitectura Web:
 *
 * UI
 *  ↓
 * Repository
 *  ↓
 * WebStorage
 *  ↓
 * localStorage
 *
 * No utilizamos SQLite en Web.
 */
export default function WebRootLayout() {
  const pathname = usePathname();

  const { colors, isDark } = useAppTheme();

  /*
   * Indica cuándo todos los repositories
   * necesarios están disponibles.
   */
  const [repositoryReady, setRepositoryReady] = useState(false);

  /*
   * Se conserva para diagnóstico.
   */
  const [repositoryError, setRepositoryError] = useState<string | null>(null);

  /*
   * ==========================================================================
   * INICIALIZACIÓN WEB
   * ==========================================================================
   */
  useEffect(() => {
    let active = true;

    async function initialize() {
      try {
        /*
         * ====================================================================
         * PASO 1 - EMPRESAS
         * ====================================================================
         */
        configureCompanyRepositoryPersistence(
          createWebCompanyPersistenceAdapter(),
        );

        /*
         * ====================================================================
         * PASO 2 - INMUEBLES
         * ====================================================================
         */
        configurePropertyRepositoryPersistence(
          createWebPropertyPersistenceAdapter(),
        );

        /*
         * ====================================================================
         * PASO 3 - FORMULARIOS
         * ====================================================================
         *
         * FormRepository queda conectado con:
         *
         * localStorage
         *      ↑
         * FormWebStorage
         *      ↑
         * FormRepository
         */
        configureFormRepositoryPersistence(createWebFormPersistenceAdapter());

        /*
         * ====================================================================
         * PASO 4 - EVIDENCIAS
         * ====================================================================
         */
        configureEvidenceRepositoryPersistence(
          createWebEvidencePersistenceAdapter(),
        );

        /*
         * ====================================================================
         * PASO 5 - REPORTES
         * ====================================================================
         */
        configureReportRepositoryPersistence(
          createWebReportPersistenceAdapter(),
        );

        /*
         * ====================================================================
         * PASO 6 - HIDRATACIÓN
         * ====================================================================
         */
        await Promise.all([
          hydrateCompanyRepository(),

          hydratePropertyRepository(),

          hydrateFormRepository(),

          hydrateInspectionRepository(),

          hydrateEvidenceRepository(),

          hydrateReportRepository(),
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
   * ==========================================================================
   * SINCRONIZACIÓN AUTOMÁTICA
   * ==========================================================================
   */
  useInspectionAutoSync({
    enabled: repositoryReady,
  });

  /*
   * Se mantiene disponible para el futuro
   * centro de diagnóstico.
   */
  void repositoryError;

  /*
   * Login e index no muestran navegación principal.
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
 * ADAPTADOR WEB DE EMPRESAS
 * ============================================================================
 */
function createWebCompanyPersistenceAdapter() {
  return {
    async loadAll(): Promise<Company[] | null> {
      return loadWebCompanies();
    },

    async insert(company: Company): Promise<void> {
      const current = loadWebCompanies() ?? [];

      const existingIndex = current.findIndex((item) => item.id === company.id);

      if (existingIndex !== -1) {
        return;
      }

      saveWebCompanies([company, ...current]);
    },

    async replace(company: Company): Promise<void> {
      const current = loadWebCompanies() ?? [];

      const index = current.findIndex((item) => item.id === company.id);

      if (index === -1) {
        saveWebCompanies([company, ...current]);

        return;
      }

      const updated = [...current];

      updated[index] = company;

      saveWebCompanies(updated);
    },

    async delete(id: string): Promise<boolean> {
      const current = loadWebCompanies() ?? [];

      const updated = current.filter((company) => company.id !== id);

      if (updated.length === current.length) {
        return false;
      }

      saveWebCompanies(updated);

      return true;
    },
  };
}

/*
 * ============================================================================
 * ADAPTADOR WEB DE INMUEBLES
 * ============================================================================
 */
function createWebPropertyPersistenceAdapter() {
  return {
    async loadAll(): Promise<Property[] | null> {
      return loadWebProperties();
    },

    async insert(property: Property): Promise<void> {
      const current = loadWebProperties() ?? [];

      const existingIndex = current.findIndex(
        (item) => item.id === property.id,
      );

      if (existingIndex !== -1) {
        return;
      }

      saveWebProperties([property, ...current]);
    },

    async replace(property: Property): Promise<void> {
      const current = loadWebProperties() ?? [];

      const index = current.findIndex((item) => item.id === property.id);

      if (index === -1) {
        saveWebProperties([property, ...current]);

        return;
      }

      const updated = [...current];

      updated[index] = property;

      saveWebProperties(updated);
    },

    async delete(id: string): Promise<boolean> {
      const current = loadWebProperties() ?? [];

      const updated = current.filter((property) => property.id !== id);

      if (updated.length === current.length) {
        return false;
      }

      saveWebProperties(updated);

      return true;
    },
  };
}

/*
 * ============================================================================
 * ADAPTADOR WEB DE FORMULARIOS
 * ============================================================================
 *
 * Esta es la nueva pieza que permite que FormRepository
 * utilice localStorage en Web.
 */
function createWebFormPersistenceAdapter() {
  return {
    /*
     * Recupera formularios persistidos.
     *
     * null significa que todavía no existe almacenamiento
     * y FormRepository deberá insertar el seed.
     */
    async loadAll(): Promise<FormDefinition[] | null> {
      return loadWebForms();
    },

    /*
     * Inserta un formulario.
     *
     * Se evita duplicar registros durante Fast Refresh.
     */
    async insert(form: FormDefinition): Promise<void> {
      const current = loadWebForms() ?? [];

      const existingIndex = current.findIndex((item) => item.id === form.id);

      if (existingIndex !== -1) {
        return;
      }

      saveWebForms([form, ...current]);
    },

    /*
     * Actualiza un formulario existente.
     *
     * Si todavía no existe, hacemos upsert.
     */
    async replace(form: FormDefinition): Promise<void> {
      const current = loadWebForms() ?? [];

      const index = current.findIndex((item) => item.id === form.id);

      if (index === -1) {
        saveWebForms([form, ...current]);

        return;
      }

      const updated = [...current];

      updated[index] = form;

      saveWebForms(updated);
    },

    /*
     * Elimina un formulario.
     */
    async delete(id: string): Promise<boolean> {
      const current = loadWebForms() ?? [];

      const updated = current.filter((form) => form.id !== id);

      if (updated.length === current.length) {
        return false;
      }

      saveWebForms(updated);

      return true;
    },
  };
}

/*
 * ============================================================================
 * ADAPTADOR WEB DE EVIDENCIAS
 * ============================================================================
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
 * ADAPTADOR WEB DE REPORTES
 * ============================================================================
 */
function createWebReportPersistenceAdapter() {
  return {
    async loadAll(): Promise<Report[] | null> {
      return loadWebReports();
    },

    async insert(report: Report): Promise<void> {
      const current = loadWebReports() ?? [];

      const existingIndex = current.findIndex((item) => item.id === report.id);

      if (existingIndex !== -1) {
        return;
      }

      saveWebReports([report, ...current]);
    },

    async replace(report: Report): Promise<void> {
      const current = loadWebReports() ?? [];

      const index = current.findIndex((item) => item.id === report.id);

      if (index === -1) {
        saveWebReports([report, ...current]);

        return;
      }

      const updated = [...current];

      updated[index] = report;

      saveWebReports(updated);
    },

    async delete(id: string): Promise<boolean> {
      const current = loadWebReports() ?? [];

      const updated = current.filter((report) => report.id !== id);

      if (updated.length === current.length) {
        return false;
      }

      saveWebReports(updated);

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
