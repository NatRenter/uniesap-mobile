import { Platform } from "react-native";

import {
  deleteInspectionFromDatabase,
  insertInspection,
  replaceInspection,
  selectAllInspections,
} from "@/database/inspectionDatabase";

import { initialInspections } from "@/database/inspectionSeed";

import {
  loadWebInspections,
  saveWebInspections,
} from "@/repositories/inspectionWebStorage";

import type {
  Inspection,
  InspectionResponse,
  InspectionStatus,
  InspectionSyncStatus,
} from "@/types/inspection";

/*
 * ============================================================================
 * REPOSITORIO DE INSPECCIONES
 * ============================================================================
 *
 * Este repositorio continúa siendo el punto central desde el cual
 * las pantallas de UNIESAP consultan y modifican inspecciones.
 *
 * Durante esta etapa utilizamos una estrategia híbrida:
 *
 * WEB
 *   → memoria + localStorage
 *
 * ANDROID / IOS
 *   → memoria + SQLite
 *
 * Más adelante migraremos las consultas a SQLite de forma completamente
 * asíncrona y podremos eliminar la copia temporal en memoria.
 */

/* -------------------------------------------------------------------------- */
/*                          ESTADO INICIAL                                    */
/* -------------------------------------------------------------------------- */

/*
 * En web intentamos recuperar primero las inspecciones
 * almacenadas previamente en localStorage.
 *
 * Si todavía no existen datos guardados,
 * utilizamos las inspecciones iniciales de desarrollo.
 *
 * En Android/iOS partimos temporalmente del seed y,
 * posteriormente, hydrateInspectionRepository()
 * sustituirá este contenido por lo almacenado en SQLite.
 */
const initialRepositoryData =
  Platform.OS === "web"
    ? (loadWebInspections() ?? initialInspections)
    : initialInspections;

/*
 * IMPORTANTE:
 *
 * Conservamos siempre la misma referencia del arreglo.
 *
 * Algunas pantallas del prototipo todavía dependen
 * del comportamiento síncrono del repositorio.
 */
export const inspections: Inspection[] =
  initialRepositoryData.map(cloneInspection);

/*
 * Evita hidratar SQLite varias veces
 * durante la misma ejecución.
 */
let hydrationPromise: Promise<void> | null = null;

let hydrated = false;

/* -------------------------------------------------------------------------- */
/*                          TIPO DE CREACIÓN                                  */
/* -------------------------------------------------------------------------- */

export type CreateInspectionInput = {
  companyId: string;

  propertyId: string;

  formId: string;

  inspector: string;

  responses: InspectionResponse[];

  status: InspectionStatus;

  syncStatus: InspectionSyncStatus;

  /*
   * Permitimos asociar evidencias desde el momento
   * en que se crea una inspección.
   */
  evidenceIds?: string[];
};

/* -------------------------------------------------------------------------- */
/*                            HIDRATACIÓN                                     */
/* -------------------------------------------------------------------------- */

/*
 * ============================================================================
 * hydrateInspectionRepository()
 * ============================================================================
 *
 * ANDROID / IOS
 *
 * Lee SQLite y sustituye la copia temporal
 * almacenada en memoria.
 *
 * WEB
 *
 * localStorage ya fue leído durante la creación
 * de initialRepositoryData, así que únicamente
 * marcamos el repositorio como hidratado.
 */
export async function hydrateInspectionRepository(): Promise<void> {
  /*
   * --------------------------------------------------------------------------
   * WEB
   * --------------------------------------------------------------------------
   */
  if (Platform.OS === "web") {
    hydrated = true;

    console.log(
      `Repositorio web hidratado con ${inspections.length} inspección(es).`,
    );

    return;
  }

  /*
   * --------------------------------------------------------------------------
   * ANDROID / IOS
   * --------------------------------------------------------------------------
   */

  if (hydrated) {
    return;
  }

  /*
   * Si otra parte de la aplicación ya inició
   * la hidratación reutilizamos la misma Promise.
   */
  if (hydrationPromise) {
    return hydrationPromise;
  }

  hydrationPromise = hydrateFromDatabase();

  return hydrationPromise;
}

/*
 * Obtiene todas las inspecciones almacenadas
 * persistentemente en SQLite.
 */
async function hydrateFromDatabase() {
  const persistedInspections = await selectAllInspections();

  /*
   * No sustituimos la referencia de `inspections`.
   *
   * En su lugar reemplazamos su contenido.
   */
  inspections.splice(
    0,
    inspections.length,
    ...persistedInspections.map(cloneInspection),
  );

  hydrated = true;

  console.log(
    `Repositorio de inspecciones hidratado con ${inspections.length} registro(s).`,
  );
}

/* -------------------------------------------------------------------------- */
/*                              CONSULTAS                                     */
/* -------------------------------------------------------------------------- */

/*
 * Estas funciones siguen siendo síncronas temporalmente.
 *
 * Esto permite mantener funcionando las pantallas actuales
 * mientras migramos progresivamente a SQLite asíncrono.
 */

export function getInspections(): Inspection[] {
  return inspections.map(cloneInspection);
}

export function getInspectionById(id: string): Inspection | undefined {
  const inspection = inspections.find((item) => item.id === id);

  return inspection ? cloneInspection(inspection) : undefined;
}

export function getInspectionsByCompanyId(companyId: string): Inspection[] {
  return inspections
    .filter((inspection) => inspection.companyId === companyId)
    .map(cloneInspection);
}

export function getInspectionsByPropertyId(propertyId: string): Inspection[] {
  return inspections
    .filter((inspection) => inspection.propertyId === propertyId)
    .map(cloneInspection);
}

/* -------------------------------------------------------------------------- */
/*                               CREACIÓN                                     */
/* -------------------------------------------------------------------------- */

export function createInspection(input: CreateInspectionInput): Inspection {
  const inspection: Inspection = {
    id: createInspectionId(),

    companyId: input.companyId,

    propertyId: input.propertyId,

    formId: input.formId,

    inspector: input.inspector,

    date: new Date().toISOString(),

    status: input.status,

    responses: input.responses.map((response) => ({
      ...response,
    })),

    evidenceIds: [...(input.evidenceIds ?? [])],

    integration: {
      syncStatus: input.syncStatus,
    },
  };

  /*
   * Primero actualizamos la copia
   * utilizada inmediatamente por la interfaz.
   */
  inspections.unshift(inspection);

  /*
   * WEB
   *
   * Persistimos el estado completo
   * en localStorage.
   */
  persistWebState();

  /*
   * ANDROID / IOS
   *
   * Persistimos la nueva inspección
   * en SQLite.
   */
  persistNewInspection(inspection);

  return cloneInspection(inspection);
}

/* -------------------------------------------------------------------------- */
/*                             ACTUALIZACIÓN                                  */
/* -------------------------------------------------------------------------- */

export function updateInspection(
  id: string,
  changes: Partial<Inspection>,
): Inspection | undefined {
  const inspectionIndex = inspections.findIndex(
    (inspection) => inspection.id === id,
  );

  if (inspectionIndex === -1) {
    return undefined;
  }

  const currentInspection = inspections[inspectionIndex];

  /*
   * Construimos la nueva versión sin permitir
   * que respuestas, evidencias o integración
   * se pierdan accidentalmente.
   */
  const updatedInspection: Inspection = {
    ...currentInspection,

    ...changes,

    /* RESPUESTAS */

    responses:
      changes.responses !== undefined
        ? changes.responses.map((response) => ({
            ...response,
          }))
        : currentInspection.responses.map((response) => ({
            ...response,
          })),

    /* EVIDENCIAS */

    evidenceIds:
      changes.evidenceIds !== undefined
        ? [...changes.evidenceIds]
        : [...currentInspection.evidenceIds],

    /* INTEGRACIÓN */

    integration:
      changes.integration !== undefined
        ? {
            ...currentInspection.integration,

            ...changes.integration,

            /*
             * Kobo necesita una fusión adicional.
             *
             * Esto evita perder:
             *
             * assetUid
             * submissionId
             * uuid
             * syncedAt
             */
            ...(changes.integration.kobo
              ? {
                  kobo: {
                    ...currentInspection.integration?.kobo,

                    ...changes.integration.kobo,
                  },
                }
              : currentInspection.integration?.kobo
                ? {
                    kobo: {
                      ...currentInspection.integration.kobo,
                    },
                  }
                : {}),
          }
        : currentInspection.integration
          ? {
              ...currentInspection.integration,

              ...(currentInspection.integration.kobo
                ? {
                    kobo: {
                      ...currentInspection.integration.kobo,
                    },
                  }
                : {}),
            }
          : undefined,
  };

  /*
   * Actualizamos la misma posición
   * dentro del arreglo.
   */
  inspections[inspectionIndex] = updatedInspection;

  /*
   * WEB
   */
  persistWebState();

  /*
   * ANDROID / IOS
   */
  persistUpdatedInspection(updatedInspection);

  return cloneInspection(updatedInspection);
}

/* -------------------------------------------------------------------------- */
/*                               ELIMINACIÓN                                  */
/* -------------------------------------------------------------------------- */

export function deleteInspection(id: string): boolean {
  const inspectionIndex = inspections.findIndex(
    (inspection) => inspection.id === id,
  );

  if (inspectionIndex === -1) {
    return false;
  }

  /*
   * Eliminamos de memoria.
   */
  inspections.splice(inspectionIndex, 1);

  /*
   * IMPORTANTE:
   *
   * También actualizamos localStorage.
   *
   * Sin esta llamada, una inspección eliminada
   * volvería a aparecer después de recargar web.
   */
  persistWebState();

  /*
   * Android/iOS:
   * eliminamos de SQLite.
   */
  persistDeletedInspection(id);

  return true;
}

/* -------------------------------------------------------------------------- */
/*                       ESTADO DE SINCRONIZACIÓN                             */
/* -------------------------------------------------------------------------- */

export function updateInspectionSyncStatus(
  id: string,
  syncStatus: InspectionSyncStatus,
  lastSyncError?: string,
): Inspection | undefined {
  const inspection = getInspectionById(id);

  if (!inspection) {
    return undefined;
  }

  /*
   * Reutilizamos updateInspection()
   * para que cualquier modificación de syncStatus
   * también se persista automáticamente tanto en:
   *
   * localStorage
   * SQLite
   */
  return updateInspection(id, {
    integration: {
      ...inspection.integration,

      syncStatus,

      lastSyncError,
    },
  });
}

/* -------------------------------------------------------------------------- */
/*                          PERSISTENCIA WEB                                  */
/* -------------------------------------------------------------------------- */

/*
 * ============================================================================
 * persistWebState()
 * ============================================================================
 *
 * Esta era la función que faltaba en tu archivo.
 *
 * Cada vez que:
 *
 * - creamos
 * - actualizamos
 * - eliminamos
 *
 * una inspección, almacenamos el estado completo
 * del repositorio en localStorage.
 *
 * En Android/iOS simplemente no hace nada.
 */
function persistWebState() {
  if (Platform.OS !== "web") {
    return;
  }

  saveWebInspections(inspections.map(cloneInspection));
}

/* -------------------------------------------------------------------------- */
/*                         PERSISTENCIA SQLITE                                */
/* -------------------------------------------------------------------------- */

/*
 * Durante esta fase mantenemos una API síncrona
 * para las pantallas actuales.
 *
 * Las operaciones SQLite se ejecutan en segundo plano.
 *
 * Más adelante convertiremos createInspection(),
 * updateInspection() y deleteInspection() a async.
 */

/*
 * CREAR EN SQLITE
 */
function persistNewInspection(inspection: Inspection) {
  if (Platform.OS === "web") {
    return;
  }

  void insertInspection(inspection).catch((error) => {
    console.error(
      "No fue posible persistir la inspección nueva en SQLite:",
      error,
    );
  });
}

/*
 * ACTUALIZAR EN SQLITE
 */
function persistUpdatedInspection(inspection: Inspection) {
  if (Platform.OS === "web") {
    return;
  }

  void replaceInspection(inspection).catch((error) => {
    console.error("No fue posible actualizar la inspección en SQLite:", error);
  });
}

/*
 * ELIMINAR DE SQLITE
 */
function persistDeletedInspection(id: string) {
  if (Platform.OS === "web") {
    return;
  }

  void deleteInspectionFromDatabase(id).catch((error) => {
    console.error("No fue posible eliminar la inspección de SQLite:", error);
  });
}

/* -------------------------------------------------------------------------- */
/*                                UTILIDADES                                  */
/* -------------------------------------------------------------------------- */

/*
 * Genera un ID local suficientemente único
 * para la etapa actual.
 *
 * Más adelante podremos sustituirlo por UUID.
 */
function createInspectionId(): string {
  return `inspection-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/*
 * Devuelve una copia independiente de una Inspection.
 *
 * Así evitamos que una pantalla pueda modificar
 * accidentalmente el objeto que mantiene el repositorio.
 */
function cloneInspection(inspection: Inspection): Inspection {
  return {
    ...inspection,

    responses: inspection.responses.map((response) => ({
      ...response,
    })),

    evidenceIds: [...inspection.evidenceIds],

    integration: inspection.integration
      ? {
          ...inspection.integration,

          ...(inspection.integration.kobo
            ? {
                kobo: {
                  ...inspection.integration.kobo,
                },
              }
            : {}),
        }
      : undefined,
  };
}
