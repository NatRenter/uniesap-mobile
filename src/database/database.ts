import * as SQLite from "expo-sqlite";

/*
 * ============================================================================
 * BASE DE DATOS LOCAL DE UNIESAP
 * ============================================================================
 *
 * Centralizamos aquí la conexión SQLite.
 *
 * El resto de la aplicación no debería abrir
 * conexiones por su cuenta.
 */

const DATABASE_NAME = "uniesap.db";

/*
 * Guardamos la promesa de apertura para reutilizar
 * la misma instancia durante la ejecución.
 */
let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

/*
 * Devuelve la base de datos local de UNIESAP.
 *
 * openDatabaseAsync() no elimina ni recrea la base.
 * Si ya existe en el dispositivo, vuelve a abrirla.
 */
export function getDatabase() {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync(DATABASE_NAME);
  }

  return databasePromise;
}
