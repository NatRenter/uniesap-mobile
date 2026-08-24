import { useEffect, useState } from "react";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { useAppTheme } from "@/hooks/useAppTheme";
import { useInspectionAutoSync } from "@/hooks/useInspectionAutoSync";

import {
  configureEvidenceRepositoryPersistence,
  hydrateEvidenceRepository,
} from "@/repositories/evidenceRepository";

import { hydrateInspectionRepository } from "@/repositories/inspectionRepository";

import {
  loadWebEvidences,
  saveWebEvidences,
} from "@/repositories/evidenceWebStorage";

import type { Evidence } from "@/types/evidence";

/*
 * ============================================================================
 * ROOT LAYOUT - WEB
 * ============================================================================
 *
 * Persistencia Web:
 *
 * inspecciones
 *      ↓
 * localStorage
 *
 * evidencias
 *      ↓
 * localStorage
 *
 * Este archivo no importa SQLite.
 */

export default function WebRootLayout() {
  const { isDark } = useAppTheme();

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
         * PASO 1
         *
         * Configuramos la persistencia Web
         * del repositorio de evidencias.
         */
        configureEvidenceRepositoryPersistence(
          createWebEvidencePersistenceAdapter(),
        );

        /*
         * PASO 2
         *
         * Hidratamos ambos repositorios.
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
   * La sincronización automática solamente
   * se activa cuando los repositorios están
   * correctamente hidratados.
   */
  useInspectionAutoSync({
    enabled: repositoryReady,
  });

  /*
   * Durante desarrollo dejamos visible
   * cualquier error en consola.
   *
   * repositoryError se conserva además
   * para futuras pantallas de diagnóstico.
   */
  void repositoryError;

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

/*
 * ============================================================================
 * ADAPTADOR WEB DE EVIDENCIAS
 * ============================================================================
 *
 * Este adaptador conecta EvidenceRepository
 * con localStorage.
 *
 *
 * IMPORTANTE:
 *
 * Las operaciones están diseñadas para ser
 * tolerantes a inicializaciones repetidas.
 *
 * Esto es especialmente útil durante:
 *
 * - Fast Refresh
 * - recargas de Expo Web
 * - desarrollo
 * - seeds parciales
 */

/* -------------------------------------------------------------------------- */
/*                           CREAR ADAPTADOR                                  */
/* -------------------------------------------------------------------------- */

function createWebEvidencePersistenceAdapter() {
  return {
    /*
     * ------------------------------------------------------------------------
     * LEER
     * ------------------------------------------------------------------------
     */

    async loadAll(): Promise<Evidence[] | null> {
      return loadWebEvidences();
    },

    /*
     * ------------------------------------------------------------------------
     * INSERTAR
     * ------------------------------------------------------------------------
     *
     * Esta operación es deliberadamente
     * IDEMPOTENTE.
     *
     * Si la evidencia ya existe:
     *
     * NO lanzamos error.
     * NO creamos un duplicado.
     * Simplemente conservamos el registro.
     *
     *
     * Esto resuelve escenarios como:
     *
     * seed comienza
     *      ↓
     * evidence-001 guardada
     *      ↓
     * Fast Refresh / segunda inicialización
     *      ↓
     * seed vuelve a intentar evidence-001
     *      ↓
     * ya existe → continuar
     */

    async insert(evidence: Evidence): Promise<void> {
      const current = loadWebEvidences() ?? [];

      const existingIndex = current.findIndex(
        (item) => item.id === evidence.id,
      );

      /*
       * Ya existe.
       *
       * Consideramos la operación satisfecha.
       */
      if (existingIndex !== -1) {
        console.log(
          `Evidencia ${evidence.id} ya persistida en Web. Se omite inserción duplicada.`,
        );

        return;
      }

      /*
       * Nueva evidencia.
       */
      saveWebEvidences([evidence, ...current]);
    },

    /*
     * ------------------------------------------------------------------------
     * REEMPLAZAR / ACTUALIZAR
     * ------------------------------------------------------------------------
     */

    async replace(evidence: Evidence): Promise<void> {
      const current = loadWebEvidences() ?? [];

      const index = current.findIndex((item) => item.id === evidence.id);

      /*
       * Si por alguna razón todavía no existe,
       * hacemos un upsert.
       *
       * Esto vuelve el almacenamiento más resistente
       * frente a estados parciales durante desarrollo.
       */
      if (index === -1) {
        saveWebEvidences([evidence, ...current]);

        return;
      }

      const updated = [...current];

      updated[index] = evidence;

      saveWebEvidences(updated);
    },

    /*
     * ------------------------------------------------------------------------
     * ELIMINAR
     * ------------------------------------------------------------------------
     */

    async delete(id: string): Promise<boolean> {
      const current = loadWebEvidences() ?? [];

      const updated = current.filter((evidence) => evidence.id !== id);

      if (updated.length === current.length) {
        /*
         * No existe.
         *
         * No consideramos esto un error
         * crítico de almacenamiento.
         */
        return false;
      }

      saveWebEvidences(updated);

      return true;
    },
  };
}
