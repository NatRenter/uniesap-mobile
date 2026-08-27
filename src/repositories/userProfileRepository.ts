import type { UpdateUserProfileInput, UserProfile } from "@/types/userProfile";

/*
 * ============================================================================
 * REPOSITORIO DEL PERFIL
 * ============================================================================
 *
 * El repositorio mantiene una única fuente de verdad en memoria
 * y delega la persistencia real a un adaptador.
 *
 * Native → SQLite
 * Web    → localStorage
 */

export type UserProfilePersistenceAdapter = {
  load: () => Promise<UserProfile | null>;

  save: (profile: UserProfile) => Promise<void>;
};

type UserProfileListener = (profile: UserProfile) => void;

let persistenceAdapter: UserProfilePersistenceAdapter | null = null;

let currentProfile: UserProfile | null = null;

let hydrationPromise: Promise<void> | null = null;

let hydrated = false;

const listeners = new Set<UserProfileListener>();

/*
 * Configura el sistema de almacenamiento de la plataforma actual.
 */
export function configureUserProfileRepositoryPersistence(
  adapter: UserProfilePersistenceAdapter,
): void {
  persistenceAdapter = adapter;
}

/*
 * Hidrata el perfil una sola vez al iniciar la aplicación.
 *
 * Si no existe todavía un perfil persistido,
 * se crea uno inicial y se guarda.
 */
export async function hydrateUserProfileRepository(): Promise<void> {
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

  const persisted = await adapter.load();

  if (persisted) {
    currentProfile = cloneProfile(persisted);
  } else {
    currentProfile = createInitialProfile();

    await adapter.save(cloneProfile(currentProfile));
  }

  hydrated = true;

  notifyListeners();
}

/*
 * Devuelve una copia del perfil actual.
 */
export function getUserProfile(): UserProfile {
  if (!currentProfile) {
    /*
     * Este fallback solamente protege renderizados tempranos.
     * RootLayout hidrata el repositorio antes de mostrar la app.
     */
    currentProfile = createInitialProfile();
  }

  return cloneProfile(currentProfile);
}

/*
 * Actualiza y persiste el perfil completo.
 */
export async function updateUserProfile(
  input: UpdateUserProfileInput,
): Promise<UserProfile> {
  const adapter = requirePersistenceAdapter();

  const previous = getUserProfile();

  const now = new Date().toISOString();

  const updated: UserProfile = {
    ...previous,

    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),

    email: input.email.trim(),

    ...(normalizeOptional(input.phone)
      ? {
          phone: normalizeOptional(input.phone),
        }
      : {
          phone: undefined,
        }),

    ...(normalizeOptional(input.profession)
      ? {
          profession: normalizeOptional(input.profession),
        }
      : {
          profession: undefined,
        }),

    ...(normalizeOptional(input.position)
      ? {
          position: normalizeOptional(input.position),
        }
      : {
          position: undefined,
        }),

    ...(normalizeOptional(input.photoUri)
      ? {
          photoUri: normalizeOptional(input.photoUri),
        }
      : {
          photoUri: undefined,
        }),

    updatedAt: now,
  };

  currentProfile = updated;

  try {
    await adapter.save(cloneProfile(updated));

    notifyListeners();

    return cloneProfile(updated);
  } catch (error) {
    currentProfile = previous;

    throw error;
  }
}

/*
 * Permite que Perfil y Editar perfil reaccionen
 * cuando la información cambia.
 */
export function subscribeToUserProfile(
  listener: UserProfileListener,
): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners(): void {
  if (!currentProfile) {
    return;
  }

  const snapshot = cloneProfile(currentProfile);

  for (const listener of listeners) {
    listener(snapshot);
  }
}

/*
 * Perfil inicial del prototipo.
 *
 * Más adelante estos datos vendrán de autenticación/usuarios.
 */
function createInitialProfile(): UserProfile {
  const now = new Date().toISOString();

  return {
    id: "current-user",

    firstName: "Usuario",
    lastName: "UNIESAP",

    email: "usuario@uniesap.com",

    profession: "Sin definir",
    position: "Sin definir",

    createdAt: now,
    updatedAt: now,
  };
}

function requirePersistenceAdapter(): UserProfilePersistenceAdapter {
  if (!persistenceAdapter) {
    throw new Error(
      "UserProfileRepository todavía no tiene un adaptador de persistencia configurado.",
    );
  }

  return persistenceAdapter;
}

/*
 * Convierte cadenas vacías a undefined.
 */
function normalizeOptional(value: string | undefined): string | undefined {
  const normalized = value?.trim();

  return normalized || undefined;
}

function cloneProfile(profile: UserProfile): UserProfile {
  return {
    ...profile,
  };
}
