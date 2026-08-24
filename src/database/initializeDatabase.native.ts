import { countEvidences, insertEvidence } from "@/database/evidenceDatabase";

import {
  countInspections,
  insertInspection,
} from "@/database/inspectionDatabase";

import { initialEvidences } from "@/database/evidenceSeed";
import { initialInspections } from "@/database/inspectionSeed";
import { runDatabaseMigrations } from "@/database/migrations";

let initializationPromise: Promise<void> | null = null;

export function initializeDatabase(): Promise<void> {
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = initializeNativeDatabase();

  return initializationPromise;
}

async function initializeNativeDatabase() {
  await runDatabaseMigrations();

  let inspectionCount = await countInspections();

  if (inspectionCount === 0) {
    console.log("Base SQLite sin inspecciones. Insertando datos iniciales...");

    for (const inspection of initialInspections) {
      await insertInspection(inspection);
    }

    inspectionCount = await countInspections();

    console.log(
      `${initialInspections.length} inspecciones iniciales insertadas.`,
    );
  }

  let evidenceCount = await countEvidences();

  if (evidenceCount === 0) {
    console.log(
      "SQLite sin evidencias persistidas. Insertando evidencias iniciales...",
    );

    for (const evidence of initialEvidences) {
      await insertEvidence(evidence);
    }

    evidenceCount = await countEvidences();

    console.log(`${initialEvidences.length} evidencias iniciales insertadas.`);
  }

  console.log(
    `SQLite inicializado con ${inspectionCount} inspección(es) y ${evidenceCount} evidencia(s).`,
  );
}
