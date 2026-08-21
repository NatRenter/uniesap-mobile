import {
  countInspections,
  insertInspection,
} from "@/database/inspectionDatabase";

import { initialInspections } from "@/database/inspectionSeed";

import { runDatabaseMigrations } from "@/database/migrations";

/*
 * ============================================================================
 * INICIALIZACIÓN DE BASE DE DATOS - NATIVO
 * ============================================================================
 *
 * Esta implementación solamente será utilizada
 * por Android/iOS.
 *
 * Expo Router / React Native seleccionará automáticamente:
 *
 * initializeDatabase.web.ts     → Web
 * initializeDatabase.native.ts  → Android / iOS
 */

let initializationPromise: Promise<void> | null = null;

/*
 * Inicializa SQLite una sola vez durante
 * la ejecución de la aplicación.
 */
export function initializeDatabase(): Promise<void> {
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = initializeNativeDatabase();

  return initializationPromise;
}

/* -------------------------------------------------------------------------- */
/*                           INICIALIZACIÓN NATIVA                             */
/* -------------------------------------------------------------------------- */

async function initializeNativeDatabase() {
  /*
   * PASO 1
   *
   * Crear tablas, índices y aplicar
   * las migraciones necesarias.
   */
  await runDatabaseMigrations();

  /*
   * PASO 2
   *
   * Comprobar cuántas inspecciones
   * existen actualmente.
   */
  const inspectionCount = await countInspections();

  /*
   * Si la base ya contiene información
   * no volvemos a ejecutar el seed.
   */
  if (inspectionCount > 0) {
    console.log(`SQLite inicializado con ${inspectionCount} inspección(es).`);

    return;
  }

  /*
   * PASO 3
   *
   * Primera ejecución:
   * insertamos los datos iniciales.
   */
  console.log("Base SQLite vacía. Insertando datos iniciales...");

  for (const inspection of initialInspections) {
    await insertInspection(inspection);
  }

  console.log(
    `${initialInspections.length} inspecciones iniciales insertadas.`,
  );
}
