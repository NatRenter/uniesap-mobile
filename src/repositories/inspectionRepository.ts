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
 * Esta capa continúa siendo el punto central desde el cual las pantallas
 * de UNIESAP consultan y modifican inspecciones.
 *
 * Durante esta etapa utilizamos una estrategia híbrida:
 *
 * WEB
 *   → memoria + localStorage
 *
 * ANDROID / IOS
 *   → memoria + SQLite
 *
 * Las consultas siguen siendo síncronas temporalmente porque leen la copia
 * hidratada en memoria.
 *
 * Las mutaciones YA son asíncronas:
 *
 * createInspection()
 * updateInspection()
 * deleteInspection()
 * updateInspectionSyncStatus()
 *
 * Esto garantiza que una operación de escritura no se considere terminada
 * hasta que la persistencia correspondiente haya confirmado el guardado.
 */

/* -------------------------------------------------------------------------- */
/*                          ESTADO INICIAL                                    */
/* -------------------------------------------------------------------------- */

/*
 * En web intentamos recuperar primero localStorage.
 *
 * En Android/iOS utilizamos temporalmente el seed mientras RootLayout
 * inicializa SQLite e hidrata posteriormente este repositorio.
 */
const initialRepositoryData =
  Platform.OS === "web"
    ? (loadWebInspections() ?? initialInspections)
    : initialInspections;

/*
 * Conservamos siempre la misma referencia del arreglo.
 *
 * Algunas pantallas todavía utilizan las consultas síncronas y dependen
 * de esta copia hidratada en memoria.
 */
export const inspections: Inspection[] =
  initialRepositoryData.map(cloneInspection);

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

  evidenceIds?: string[];
};

/* -------------------------------------------------------------------------- */
/*                            HIDRATACIÓN                                     */
/* -------------------------------------------------------------------------- */

/*
 * Reconstruye la copia en memoria a partir del almacenamiento persistente.
 *
 * WEB:
 * localStorage ya fue leído al crear initialRepositoryData.
 *
 * ANDROID / IOS:
 * lee SQLite después de que las migraciones y el seed hayan terminado.
 */
export async function hydrateInspectionRepository(): Promise<void> {
  if (Platform.OS === "web") {
    hydrated = true;

    console.log(
      `Repositorio web hidratado con ${inspections.length} inspección(es).`,
    );

    return;
  }

  if (hydrated) {
    return;
  }

  if (hydrationPromise) {
    return hydrationPromise;
  }

  hydrationPromise = hydrateFromDatabase();

  return hydrationPromise;
}

async function hydrateFromDatabase(): Promise<void> {
  const persistedInspections = await selectAllInspections();

  /*
   * No sustituimos la referencia de `inspections`.
   * Reemplazamos únicamente su contenido.
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
 * Estas consultas permanecen síncronas por ahora.
 *
 * RootLayout hidrata la copia en memoria antes de permitir que las pantallas
 * de Android/iOS comiencen a utilizarla.
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

/*
 * Crea primero la inspección en la copia en memoria y después espera
 * a que la plataforma confirme su persistencia.
 *
 * Si la persistencia falla:
 *
 * 1. revertimos el cambio en memoria;
 * 2. propagamos el error a la pantalla.
 *
 * Así CaptureScreen NO continuará hacia Kobo si UNIESAP no pudo guardar
 * primero la inspección.
 */
export async function createInspection(
  input: CreateInspectionInput,
): Promise<Inspection> {
  const now = new Date().toISOString();

  const inspection: Inspection = {
    id: createInspectionId(),

    companyId: input.companyId,

    propertyId: input.propertyId,

    formId: input.formId,

    inspector: input.inspector,

    date: now,

    /*
     * createdAt nunca cambia después de crear el registro.
     *
     * updatedAt sí cambiará en cada updateInspection().
     */
    createdAt: now,

    updatedAt: now,

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
   * Actualización optimista de la copia utilizada por la interfaz.
   */
  inspections.unshift(inspection);

  try {
    await persistCreatedInspection(inspection);

    return cloneInspection(inspection);
  } catch (error) {
    /*
     * La escritura persistente falló.
     * Revertimos el alta en memoria.
     */
    removeInspectionFromMemory(inspection.id);

    /*
     * En web volvemos a escribir localStorage por seguridad,
     * aunque normalmente el error provino precisamente de esta escritura.
     */
    if (Platform.OS === "web") {
      tryPersistWebState();
    }

    throw error;
  }
}

/* -------------------------------------------------------------------------- */
/*                             ACTUALIZACIÓN                                  */
/* -------------------------------------------------------------------------- */

/*
 * Actualiza una inspección existente y espera a que el nuevo estado quede
 * persistido antes de resolver la Promise.
 *
 * Si la persistencia falla restauramos la versión anterior en memoria.
 */
export async function updateInspection(
  id: string,
  changes: Partial<Inspection>,
): Promise<Inspection | undefined> {
  const inspectionIndex = inspections.findIndex(
    (inspection) => inspection.id === id,
  );

  if (inspectionIndex === -1) {
    return undefined;
  }

  const currentInspection = cloneInspection(inspections[inspectionIndex]);

  /*
   * Toda modificación confirmada por el repositorio
   * cuenta como nueva actividad sobre la inspección.
   *
   * No permitimos que un caller altere createdAt accidentalmente.
   */
  const updatedInspection = mergeInspectionChanges(currentInspection, {
    ...changes,

    createdAt: currentInspection.createdAt,

    updatedAt: new Date().toISOString(),
  });

  /*
   * Actualización optimista.
   */
  inspections[inspectionIndex] = updatedInspection;

  try {
    await persistUpdatedInspection(updatedInspection);

    return cloneInspection(updatedInspection);
  } catch (error) {
    /*
     * SQLite/localStorage no confirmó la actualización.
     * Restauramos la versión previa en memoria.
     */
    inspections[inspectionIndex] = currentInspection;

    if (Platform.OS === "web") {
      tryPersistWebState();
    }

    throw error;
  }
}

/* -------------------------------------------------------------------------- */
/*                               ELIMINACIÓN                                  */
/* -------------------------------------------------------------------------- */

/*
 * La eliminación también espera confirmación de persistencia.
 *
 * En caso de error restauramos el registro eliminado en la posición
 * que ocupaba originalmente.
 */
export async function deleteInspection(id: string): Promise<boolean> {
  const inspectionIndex = inspections.findIndex(
    (inspection) => inspection.id === id,
  );

  if (inspectionIndex === -1) {
    return false;
  }

  const deletedInspection = cloneInspection(inspections[inspectionIndex]);

  inspections.splice(inspectionIndex, 1);

  try {
    await persistDeletedInspection(id);

    return true;
  } catch (error) {
    /*
     * Revertimos la eliminación en memoria.
     */
    inspections.splice(inspectionIndex, 0, deletedInspection);

    if (Platform.OS === "web") {
      tryPersistWebState();
    }

    throw error;
  }
}

/* -------------------------------------------------------------------------- */
/*                       ESTADO DE SINCRONIZACIÓN                             */
/* -------------------------------------------------------------------------- */

export async function updateInspectionSyncStatus(
  id: string,
  syncStatus: InspectionSyncStatus,
  lastSyncError?: string,
): Promise<Inspection | undefined> {
  const inspection = getInspectionById(id);

  if (!inspection) {
    return undefined;
  }

  return updateInspection(id, {
    integration: {
      ...inspection.integration,

      syncStatus,

      lastSyncError,
    },
  });
}

/* -------------------------------------------------------------------------- */
/*                     PERSISTENCIA SEGÚN PLATAFORMA                         */
/* -------------------------------------------------------------------------- */

/*
 * Crear:
 *
 * WEB         → localStorage
 * ANDROID/iOS → SQLite
 */
async function persistCreatedInspection(inspection: Inspection): Promise<void> {
  if (Platform.OS === "web") {
    persistWebState();

    return;
  }

  await insertInspection(inspection);
}

/*
 * Actualizar:
 *
 * WEB         → localStorage
 * ANDROID/iOS → SQLite
 */
async function persistUpdatedInspection(inspection: Inspection): Promise<void> {
  if (Platform.OS === "web") {
    persistWebState();

    return;
  }

  await replaceInspection(inspection);
}

/*
 * Eliminar:
 *
 * WEB         → localStorage
 * ANDROID/iOS → SQLite
 */
async function persistDeletedInspection(id: string): Promise<void> {
  if (Platform.OS === "web") {
    persistWebState();

    return;
  }

  const deleted = await deleteInspectionFromDatabase(id);

  /*
   * Si SQLite no eliminó ninguna fila consideramos
   * que la operación no quedó confirmada.
   */
  if (!deleted) {
    throw new Error(
      `No se encontró la inspección ${id} en SQLite para eliminarla.`,
    );
  }
}

/* -------------------------------------------------------------------------- */
/*                          PERSISTENCIA WEB                                  */
/* -------------------------------------------------------------------------- */

/*
 * localStorage es síncrono, pero dejamos esta operación dentro del flujo
 * async del repositorio para conservar una API homogénea entre plataformas.
 */
function persistWebState(): void {
  saveWebInspections(inspections.map(cloneInspection));
}

/*
 * Se utiliza únicamente durante rollbacks.
 *
 * No sustituye el error original si localStorage tampoco puede escribirse.
 */
function tryPersistWebState(): void {
  try {
    persistWebState();
  } catch (error) {
    console.error(
      "No fue posible restaurar localStorage después de revertir una operación:",
      error,
    );
  }
}

/* -------------------------------------------------------------------------- */
/*                           FUSIÓN DE CAMBIOS                                */
/* -------------------------------------------------------------------------- */

/*
 * Centralizamos aquí la lógica que conserva:
 *
 * responses
 * evidenceIds
 * integration
 * integration.kobo
 *
 * durante una actualización parcial.
 */
function mergeInspectionChanges(
  currentInspection: Inspection,
  changes: Partial<Inspection>,
): Inspection {
  return {
    ...currentInspection,

    ...changes,

    /*
     * La fecha de creación es inmutable.
     */
    createdAt: currentInspection.createdAt,

    responses:
      changes.responses !== undefined
        ? changes.responses.map((response) => ({
            ...response,
          }))
        : currentInspection.responses.map((response) => ({
            ...response,
          })),

    evidenceIds:
      changes.evidenceIds !== undefined
        ? [...changes.evidenceIds]
        : [...currentInspection.evidenceIds],

    integration:
      changes.integration !== undefined
        ? {
            ...currentInspection.integration,

            ...changes.integration,

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
}

/* -------------------------------------------------------------------------- */
/*                                UTILIDADES                                  */
/* -------------------------------------------------------------------------- */

function createInspectionId(): string {
  return `inspection-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function removeInspectionFromMemory(id: string): void {
  const inspectionIndex = inspections.findIndex(
    (inspection) => inspection.id === id,
  );

  if (inspectionIndex !== -1) {
    inspections.splice(inspectionIndex, 1);
  }
}

/*
 * Evita que una pantalla modifique accidentalmente los objetos
 * internos mantenidos por el repositorio.
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
