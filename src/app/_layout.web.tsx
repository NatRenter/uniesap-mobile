import { useEffect, useState } from "react";

import { StyleSheet, View } from "react-native";

import { Stack, usePathname } from "expo-router";

import { StatusBar } from "expo-status-bar";

import AppTabs from "@/components/app-tabs";

import { useAppTheme } from "@/hooks/useAppTheme";
import { useInspectionAutoSync } from "@/hooks/useInspectionAutoSync";

/*
 * ============================================================================
 * COMPANY REPOSITORY
 * ============================================================================
 */
import {
  configureCompanyRepositoryPersistence,
  hydrateCompanyRepository,
} from "@/repositories/companyRepository";

/*
 * ============================================================================
 * COMPANY WEB STORAGE
 * ============================================================================
 */
import {
  loadWebCompanies,
  saveWebCompanies,
} from "@/repositories/companyWebStorage";

/*
 * ============================================================================
 * EVIDENCE REPOSITORY
 * ============================================================================
 */
import {
  configureEvidenceRepositoryPersistence,
  hydrateEvidenceRepository,
} from "@/repositories/evidenceRepository";

import {
  loadWebEvidences,
  saveWebEvidences,
} from "@/repositories/evidenceWebStorage";

/*
 * ============================================================================
 * INSPECTION REPOSITORY
 * ============================================================================
 */
import { hydrateInspectionRepository } from "@/repositories/inspectionRepository";

/*
 * ============================================================================
 * PROPERTY REPOSITORY
 * ============================================================================
 */
import {
  configurePropertyRepositoryPersistence,
  hydratePropertyRepository,
} from "@/repositories/propertyRepository";

/*
 * ============================================================================
 * PROPERTY WEB STORAGE
 * ============================================================================
 */
import {
  loadWebProperties,
  saveWebProperties,
} from "@/repositories/propertyWebStorage";

import type { Company } from "@/types/company";
import type { Evidence } from "@/types/evidence";
import type { Property } from "@/types/property";

/*
 * ============================================================================
 * ROOT LAYOUT - WEB
 * ============================================================================
 *
 * Web utiliza localStorage en lugar de SQLite.
 *
 * El contrato de Repository permanece igual,
 * por lo que las pantallas no necesitan saber
 * qué plataforma está ejecutando UNIESAP.
 */
export default function WebRootLayout() {
  const pathname = usePathname();

  const { colors, isDark } = useAppTheme();

  const [repositoryReady, setRepositoryReady] = useState(false);

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
         * ================================================================
         * 1. COMPANY
         * ================================================================
         */
        configureCompanyRepositoryPersistence(
          createWebCompanyPersistenceAdapter(),
        );

        /*
         * ================================================================
         * 2. PROPERTY
         * ================================================================
         */
        configurePropertyRepositoryPersistence(
          createWebPropertyPersistenceAdapter(),
        );

        /*
         * ================================================================
         * 3. EVIDENCE
         * ================================================================
         */
        configureEvidenceRepositoryPersistence(
          createWebEvidencePersistenceAdapter(),
        );

        /*
         * ================================================================
         * 4. HIDRATAR EMPRESAS
         * ================================================================
         */
        await hydrateCompanyRepository();

        /*
         * ================================================================
         * 5. HIDRATAR INMUEBLES
         * ================================================================
         */
        await hydratePropertyRepository();

        /*
         * ================================================================
         * 6. INSPECCIONES + EVIDENCIAS
         * ================================================================
         */
        await Promise.all([
          hydrateInspectionRepository(),

          hydrateEvidenceRepository(),
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
   * AUTO SYNC
   * ==========================================================================
   *
   * Solamente comienza después de hidratar
   * todas las fuentes persistentes.
   */
  useInspectionAutoSync({
    enabled: repositoryReady,
  });

  /*
   * repositoryError se mantiene disponible para
   * el futuro centro de diagnóstico.
   */
  void repositoryError;

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
    async loadAll(): Promise<Company[] | null> {
      return loadWebCompanies();
    },

    async insert(company: Company): Promise<void> {
      const current = loadWebCompanies() ?? [];

      const existingIndex = current.findIndex((item) => item.id === company.id);

      /*
       * Evita duplicar seeds durante Fast Refresh.
       */
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
 * ADAPTADOR WEB DE EVIDENCIAS
 * ============================================================================
 *
 * Se conserva la implementación estable existente.
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
