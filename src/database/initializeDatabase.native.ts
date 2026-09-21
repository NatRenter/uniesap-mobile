import { countEvidences, insertEvidence } from "@/database/evidenceDatabase";

import {
  countInspections,
  insertInspection,
} from "@/database/inspectionDatabase";

import { initialEvidences } from "@/database/evidenceSeed";
import { initialInspections } from "@/database/inspectionSeed";
import { runDatabaseMigrations } from "@/database/migrations";

/*
 * ============================================================================
 * INICIALIZACIÓN SQLITE - NATIVE
 * ============================================================================
 *
 * Este archivo inicializa la base de datos local de Android/iOS.
 *
 * La promesa se conserva para impedir que Fast Refresh u otros renderizados
 * intenten inicializar SQLite varias veces al mismo tiempo.
 */

let initializationPromise: Promise<void> | null = null;

export function initializeDatabase(): Promise<void> {
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = initializeNativeDatabase();

  return initializationPromise;
}

async function initializeNativeDatabase(): Promise<void> {
  /*
   * ==========================================================================
   * PASO 1 - MIGRACIONES
   * ==========================================================================
   */
  console.log("[SQLite] 1/5 Iniciando migraciones...");

  try {
    await runDatabaseMigrations();

    console.log("[SQLite] 1/5 Migraciones completadas.");
  } catch (error) {
    console.error("[SQLite] ERROR durante las migraciones:", error);

    throw error;
  }

  /*
   * ==========================================================================
   * PASO 2 - INSPECCIONES
   * ==========================================================================
   */
  console.log("[SQLite] 2/5 Contando inspecciones...");

  let inspectionCount: number;

  try {
    inspectionCount = await countInspections();

    console.log(`[SQLite] 2/5 Inspecciones encontradas: ${inspectionCount}.`);
  } catch (error) {
    console.error("[SQLite] ERROR contando inspecciones:", error);

    throw error;
  }

  /*
   * ==========================================================================
   * PASO 3 - SEED DE INSPECCIONES
   * ==========================================================================
   */
  if (inspectionCount === 0) {
    console.log(
      "[SQLite] 3/5 Base sin inspecciones. Insertando datos iniciales...",
    );

    try {
      for (const inspection of initialInspections) {
        await insertInspection(inspection);
      }

      inspectionCount = await countInspections();

      console.log(
        `[SQLite] 3/5 ${initialInspections.length} inspecciones iniciales insertadas.`,
      );
    } catch (error) {
      console.error("[SQLite] ERROR insertando inspecciones iniciales:", error);

      throw error;
    }
  } else {
    console.log(
      "[SQLite] 3/5 Seed de inspecciones omitido porque ya existen registros.",
    );
  }

  /*
   * ==========================================================================
   * PASO 4 - EVIDENCIAS
   * ==========================================================================
   */
  console.log("[SQLite] 4/5 Contando evidencias...");

  let evidenceCount: number;

  try {
    evidenceCount = await countEvidences();

    console.log(`[SQLite] 4/5 Evidencias encontradas: ${evidenceCount}.`);
  } catch (error) {
    console.error("[SQLite] ERROR contando evidencias:", error);

    throw error;
  }

  /*
   * ==========================================================================
   * PASO 5 - SEED DE EVIDENCIAS
   * ==========================================================================
   */
  if (evidenceCount === 0) {
    console.log(
      "[SQLite] 5/5 Base sin evidencias. Insertando evidencias iniciales...",
    );

    try {
      for (const evidence of initialEvidences) {
        await insertEvidence(evidence);
      }

      evidenceCount = await countEvidences();

      console.log(
        `[SQLite] 5/5 ${initialEvidences.length} evidencias iniciales insertadas.`,
      );
    } catch (error) {
      console.error("[SQLite] ERROR insertando evidencias iniciales:", error);

      throw error;
    }
  } else {
    console.log(
      "[SQLite] 5/5 Seed de evidencias omitido porque ya existen registros.",
    );
  }

  /*
   * ==========================================================================
   * INICIALIZACIÓN COMPLETADA
   * ==========================================================================
   */
  console.log(
    `[SQLite] Inicialización completada con ${inspectionCount} inspección(es) y ${evidenceCount} evidencia(s).`,
  );
}
