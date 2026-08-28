import { useEffect, useState } from "react";

import { StyleSheet, View } from "react-native";

import { Stack, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";

import AppTabs from "@/components/app-tabs";

import { useAppTheme } from "@/hooks/useAppTheme";
import { useInspectionAutoSync } from "@/hooks/useInspectionAutoSync";

import {
  configureCompanyRepositoryPersistence,
  hydrateCompanyRepository,
} from "@/repositories/companyRepository";

import {
  configureEvidenceRepositoryPersistence,
  hydrateEvidenceRepository,
} from "@/repositories/evidenceRepository";

import { hydrateInspectionRepository } from "@/repositories/inspectionRepository";

import {
  configurePropertyRepositoryPersistence,
  hydratePropertyRepository,
} from "@/repositories/propertyRepository";

import {
  configureReportRepositoryPersistence,
  hydrateReportRepository,
} from "@/repositories/reportRepository";

import {
  loadWebCompanies,
  saveWebCompanies,
} from "@/repositories/companyWebStorage";

import {
  loadWebEvidences,
  saveWebEvidences,
} from "@/repositories/evidenceWebStorage";

import {
  loadWebProperties,
  saveWebProperties,
} from "@/repositories/propertyWebStorage";

import {
  loadWebReports,
  saveWebReports,
} from "@/repositories/reportWebStorage";

import type { Company } from "@/types/company";
import type { Evidence } from "@/types/evidence";
import type { Property } from "@/types/property";
import type { Report } from "@/types/report";

/*
 * ============================================================================
 * ROOT LAYOUT - WEB
 * ============================================================================
 *
 * Responsabilidades principales:
 *
 * 1. Configurar la persistencia Web.
 * 2. Hidratar los repositories al iniciar.
 * 3. Activar la sincronización automática.
 * 4. Mostrar el Stack de Expo Router.
 * 5. Mantener la navegación global.
 *
 * Persistencia utilizada:
 *
 * CompanyRepository
 *        ↓
 * localStorage
 *
 * PropertyRepository
 *        ↓
 * localStorage
 *
 * InspectionRepository
 *        ↓
 * localStorage
 *
 * EvidenceRepository
 *        ↓
 * localStorage
 *
 * ReportRepository
 *        ↓
 * localStorage
 *
 * Este archivo NO utiliza SQLite.
 */
export default function WebRootLayout() {
  const pathname = usePathname();

  const { colors, isDark } = useAppTheme();

  /*
   * repositoryReady indica cuándo todos los repositories
   * necesarios ya fueron hidratados.
   */
  const [repositoryReady, setRepositoryReady] = useState(false);

  /*
   * Conservamos el error para diagnóstico.
   *
   * Más adelante podrá mostrarse dentro del apartado
   * de opciones de desarrollador.
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
         *
         * Conectamos CompanyRepository con localStorage.
         */
        configureCompanyRepositoryPersistence(
          createWebCompanyPersistenceAdapter(),
        );

        /*
         * ====================================================================
         * PASO 2 - INMUEBLES
         * ====================================================================
         *
         * Conectamos PropertyRepository con localStorage.
         */
        configurePropertyRepositoryPersistence(
          createWebPropertyPersistenceAdapter(),
        );

        /*
         * ====================================================================
         * PASO 3 - EVIDENCIAS
         * ====================================================================
         *
         * Conectamos EvidenceRepository con localStorage.
         */
        configureEvidenceRepositoryPersistence(
          createWebEvidencePersistenceAdapter(),
        );

        /*
         * ====================================================================
         * PASO 4 - REPORTES
         * ====================================================================
         *
         * Conectamos ReportRepository con localStorage.
         *
         * Aquí solamente persistimos el registro del reporte.
         * El archivo Excel/PDF real se generará posteriormente.
         */
        configureReportRepositoryPersistence(
          createWebReportPersistenceAdapter(),
        );

        /*
         * ====================================================================
         * PASO 5 - HIDRATAR REPOSITORIES
         * ====================================================================
         *
         * Todos los repositories se preparan antes de mostrar
         * la aplicación como lista.
         *
         * InspectionRepository conserva su mecanismo Web actual
         * de persistencia.
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
   *
   * La sincronización solamente se activa cuando
   * todos los repositories ya están preparados.
   */
  useInspectionAutoSync({
    enabled: repositoryReady,
  });

  /*
   * repositoryError todavía no se muestra directamente
   * en la interfaz.
   *
   * Se conserva para el futuro centro de diagnóstico.
   */
  void repositoryError;

  /*
   * Login e index inicial quedan fuera
   * de la navegación principal.
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
 *
 * Conecta CompanyRepository con localStorage.
 */
function createWebCompanyPersistenceAdapter() {
  return {
    /*
     * Recupera todas las empresas persistidas.
     */
    async loadAll(): Promise<Company[] | null> {
      return loadWebCompanies();
    },

    /*
     * Inserta una empresa nueva.
     *
     * También evitamos duplicados durante Fast Refresh.
     */
    async insert(company: Company): Promise<void> {
      const current = loadWebCompanies() ?? [];

      const existingIndex = current.findIndex((item) => item.id === company.id);

      if (existingIndex !== -1) {
        return;
      }

      saveWebCompanies([company, ...current]);
    },

    /*
     * Reemplaza una empresa existente.
     *
     * Si no existe, hacemos un upsert.
     */
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

    /*
     * Elimina una empresa por ID.
     */
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
 *
 * Conecta PropertyRepository con localStorage.
 */
function createWebPropertyPersistenceAdapter() {
  return {
    /*
     * Recupera todos los inmuebles.
     */
    async loadAll(): Promise<Property[] | null> {
      return loadWebProperties();
    },

    /*
     * Inserta un inmueble nuevo.
     */
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

    /*
     * Actualiza un inmueble existente.
     */
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

    /*
     * Elimina un inmueble.
     */
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
 * ADAPTADOR WEB DE EVIDENCIAS
 * ============================================================================
 *
 * Conecta EvidenceRepository con localStorage.
 *
 * Se mantiene idempotente para soportar Fast Refresh
 * sin crear evidencias duplicadas.
 */
function createWebEvidencePersistenceAdapter() {
  return {
    /*
     * Recupera todas las evidencias.
     */
    async loadAll(): Promise<Evidence[] | null> {
      return loadWebEvidences();
    },

    /*
     * Inserta una evidencia nueva.
     */
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

    /*
     * Reemplaza o actualiza una evidencia.
     */
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

    /*
     * Elimina una evidencia.
     */
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
 *
 * Conecta ReportRepository con localStorage.
 *
 * Por ahora persistimos únicamente:
 *
 * - información del reporte;
 * - formato solicitado;
 * - estado;
 * - relación con empresa/inmueble/inspección;
 * - fileUri cuando posteriormente exista un archivo generado.
 */
function createWebReportPersistenceAdapter() {
  return {
    /*
     * Recupera todos los reportes.
     */
    async loadAll(): Promise<Report[] | null> {
      return loadWebReports();
    },

    /*
     * Inserta un reporte nuevo.
     *
     * Evitamos duplicados durante Fast Refresh.
     */
    async insert(report: Report): Promise<void> {
      const current = loadWebReports() ?? [];

      const existingIndex = current.findIndex((item) => item.id === report.id);

      if (existingIndex !== -1) {
        return;
      }

      saveWebReports([report, ...current]);
    },

    /*
     * Actualiza un reporte existente.
     *
     * Posteriormente será utilizado para:
     *
     * pending
     *    ↓
     * generated
     *
     * y para almacenar fileUri.
     */
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

    /*
     * Elimina un reporte persistido.
     */
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
 *
 * La navegación global se encuentra arriba.
 *
 * El Stack ocupa todo el espacio restante.
 */
const styles = StyleSheet.create({
  app: {
    flex: 1,
  },

  stack: {
    flex: 1,
  },
});
