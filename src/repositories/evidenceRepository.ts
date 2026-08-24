import { initialEvidences } from "@/database/evidenceSeed";

import type { Evidence, EvidenceStatus, EvidenceType } from "@/types/evidence";

export type EvidencePersistenceAdapter = {
  loadAll: () => Promise<Evidence[] | null>;
  insert: (evidence: Evidence) => Promise<void>;
  replace: (evidence: Evidence) => Promise<void>;
  delete: (id: string) => Promise<boolean>;
};

let persistenceAdapter: EvidencePersistenceAdapter | null = null;
let hydrationPromise: Promise<void> | null = null;
let hydrated = false;

export const evidences: Evidence[] = initialEvidences.map(cloneEvidence);

export function configureEvidenceRepositoryPersistence(
  adapter: EvidencePersistenceAdapter,
): void {
  persistenceAdapter = adapter;
}

export async function hydrateEvidenceRepository(): Promise<void> {
  if (hydrated) {
    return;
  }

  if (hydrationPromise) {
    return hydrationPromise;
  }

  hydrationPromise = hydrateInternal();

  return hydrationPromise;
}

async function hydrateInternal(): Promise<void> {
  const adapter = requirePersistenceAdapter();

  const persisted = await adapter.loadAll();

  if (persisted === null) {
    for (const evidence of evidences) {
      await adapter.insert(cloneEvidence(evidence));
    }

    hydrated = true;

    console.log(
      `Repositorio de evidencias inicializado con ${evidences.length} registro(s).`,
    );

    return;
  }

  evidences.splice(0, evidences.length, ...persisted.map(cloneEvidence));

  hydrated = true;

  console.log(
    `Repositorio de evidencias hidratado con ${evidences.length} registro(s).`,
  );
}

export type CreateEvidenceInput = {
  companyId: string;
  propertyId: string;
  inspectionId: string;
  questionId?: string;
  title: string;
  type: EvidenceType;
  status?: EvidenceStatus;
  date?: string;
  description?: string;
  localUri?: string;
  remoteUri?: string;
  mimeType?: string;
  fileName?: string;
  fileSize?: number;
};

export function getEvidences(): Evidence[] {
  return evidences.map(cloneEvidence);
}

export function getEvidenceById(id: string): Evidence | undefined {
  const evidence = evidences.find((item) => item.id === id);

  return evidence ? cloneEvidence(evidence) : undefined;
}

export function getEvidencesByCompanyId(companyId: string): Evidence[] {
  return evidences
    .filter((evidence) => evidence.companyId === companyId)
    .map(cloneEvidence);
}

export function getEvidencesByPropertyId(propertyId: string): Evidence[] {
  return evidences
    .filter((evidence) => evidence.propertyId === propertyId)
    .map(cloneEvidence);
}

export function getEvidencesByInspectionId(inspectionId: string): Evidence[] {
  return evidences
    .filter((evidence) => evidence.inspectionId === inspectionId)
    .map(cloneEvidence);
}

export function getEvidencesByQuestionId(
  inspectionId: string,
  questionId: string,
): Evidence[] {
  return evidences
    .filter(
      (evidence) =>
        evidence.inspectionId === inspectionId &&
        evidence.questionId === questionId,
    )
    .map(cloneEvidence);
}

export async function createEvidence(
  input: CreateEvidenceInput,
): Promise<Evidence> {
  const adapter = requirePersistenceAdapter();
  const now = new Date();

  const evidence: Evidence = {
    id: createEvidenceId(),
    companyId: input.companyId,
    propertyId: input.propertyId,
    inspectionId: input.inspectionId,
    ...(input.questionId ? { questionId: input.questionId } : {}),
    title: input.title,
    type: input.type,
    status: input.status ?? "pending",
    date: input.date ?? now.toISOString().slice(0, 10),
    ...(input.description ? { description: input.description } : {}),
    ...(input.localUri ? { localUri: input.localUri } : {}),
    ...(input.remoteUri ? { remoteUri: input.remoteUri } : {}),
    ...(input.mimeType ? { mimeType: input.mimeType } : {}),
    ...(input.fileName ? { fileName: input.fileName } : {}),
    ...(input.fileSize !== undefined ? { fileSize: input.fileSize } : {}),
    createdAt: now.toISOString(),
  };

  evidences.unshift(evidence);

  try {
    await adapter.insert(evidence);

    return cloneEvidence(evidence);
  } catch (error) {
    removeEvidenceFromMemory(evidence.id);
    throw error;
  }
}

export async function updateEvidence(
  id: string,
  changes: Partial<Evidence>,
): Promise<Evidence | undefined> {
  const adapter = requirePersistenceAdapter();

  const index = evidences.findIndex((evidence) => evidence.id === id);

  if (index === -1) {
    return undefined;
  }

  const previous = cloneEvidence(evidences[index]);

  const updated: Evidence = {
    ...previous,
    ...changes,
    id: previous.id,
  };

  evidences[index] = updated;

  try {
    await adapter.replace(updated);

    return cloneEvidence(updated);
  } catch (error) {
    evidences[index] = previous;
    throw error;
  }
}

export async function deleteEvidence(id: string): Promise<boolean> {
  const adapter = requirePersistenceAdapter();

  const index = evidences.findIndex((evidence) => evidence.id === id);

  if (index === -1) {
    return false;
  }

  const previous = cloneEvidence(evidences[index]);

  evidences.splice(index, 1);

  try {
    const deleted = await adapter.delete(id);

    if (!deleted) {
      throw new Error(
        `No fue posible confirmar la eliminación de la evidencia ${id}.`,
      );
    }

    return true;
  } catch (error) {
    evidences.splice(index, 0, previous);
    throw error;
  }
}

function requirePersistenceAdapter(): EvidencePersistenceAdapter {
  if (!persistenceAdapter) {
    throw new Error(
      "EvidenceRepository todavía no tiene un adaptador de persistencia configurado.",
    );
  }

  return persistenceAdapter;
}

function createEvidenceId(): string {
  return `evidence-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function removeEvidenceFromMemory(id: string): void {
  const index = evidences.findIndex((evidence) => evidence.id === id);

  if (index !== -1) {
    evidences.splice(index, 1);
  }
}

function cloneEvidence(evidence: Evidence): Evidence {
  return {
    ...evidence,
  };
}
