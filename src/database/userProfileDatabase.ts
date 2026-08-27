import { getDatabase } from "@/database/database";

import type { UserProfile } from "@/types/userProfile";

/*
 * ============================================================================
 * FILA SQLITE DEL PERFIL
 * ============================================================================
 *
 * user_profile guarda un único registro:
 *
 * id = "current-user"
 */
type UserProfileRow = {
  id: string;

  first_name: string;
  last_name: string;

  email: string;
  phone: string | null;

  profession: string | null;
  position: string | null;

  photo_uri: string | null;

  created_at: string;
  updated_at: string;
};

/*
 * Lee el perfil almacenado en SQLite.
 *
 * null significa que todavía no existe un perfil persistido.
 */
export async function selectUserProfile(): Promise<UserProfile | null> {
  const database = await getDatabase();

  const row = await database.getFirstAsync<UserProfileRow>(
    `
      SELECT
        id,
        first_name,
        last_name,
        email,
        phone,
        profession,
        position,
        photo_uri,
        created_at,
        updated_at
      FROM user_profile
      WHERE id = ?
      LIMIT 1;
    `,
    "current-user",
  );

  if (!row) {
    return null;
  }

  return mapUserProfileRow(row);
}

/*
 * Inserta o reemplaza el perfil completo.
 *
 * El perfil es una entidad única, por eso utilizamos
 * siempre la misma llave primaria.
 */
export async function saveUserProfileToDatabase(
  profile: UserProfile,
): Promise<void> {
  const database = await getDatabase();

  await database.runAsync(
    `
      INSERT OR REPLACE INTO user_profile (
        id,
        first_name,
        last_name,
        email,
        phone,
        profession,
        position,
        photo_uri,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `,
    profile.id,
    profile.firstName,
    profile.lastName,
    profile.email,
    profile.phone ?? null,
    profile.profession ?? null,
    profile.position ?? null,
    profile.photoUri ?? null,
    profile.createdAt,
    profile.updatedAt,
  );
}

/*
 * Convierte la fila SQLite al tipo utilizado por la aplicación.
 */
function mapUserProfileRow(row: UserProfileRow): UserProfile {
  return {
    id: "current-user",

    firstName: row.first_name,
    lastName: row.last_name,

    email: row.email,

    ...(row.phone
      ? {
          phone: row.phone,
        }
      : {}),

    ...(row.profession
      ? {
          profession: row.profession,
        }
      : {}),

    ...(row.position
      ? {
          position: row.position,
        }
      : {}),

    ...(row.photo_uri
      ? {
          photoUri: row.photo_uri,
        }
      : {}),

    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
