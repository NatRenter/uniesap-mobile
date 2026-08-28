import { getDatabase } from "@/database/database";

import type { FormDefinition, FormQuestion } from "@/types/form";

/*
 * ============================================================================
 * FORM DATABASE
 * ============================================================================
 *
 * Este archivo conecta FormRepository con SQLite.
 *
 * Android / iOS utilizan esta capa.
 *
 * Los formularios contienen estructuras anidadas:
 *
 * FormDefinition
 *   ↓
 * questions
 *   ↓
 * options
 *   ↓
 * integration
 *
 * Para evitar crear demasiadas tablas en esta primera etapa,
 * guardaremos:
 *
 * - datos principales del formulario en columnas normales;
 * - questions como JSON;
 * - integration como JSON.
 *
 * Más adelante, si necesitamos consultas SQL específicas
 * sobre preguntas u opciones, podremos normalizar esas partes
 * en tablas independientes.
 */

/*
 * ============================================================================
 * FILA SQLITE
 * ============================================================================
 */
type FormRow = {
  id: string;

  title: string;

  description: string;

  version: string;

  status: FormDefinition["status"];

  questions_json: string;

  integration_json: string | null;
};

/*
 * ============================================================================
 * CONTAR FORMULARIOS
 * ============================================================================
 *
 * Se utiliza principalmente para diagnóstico
 * y futuras migraciones.
 */
export async function countForms(): Promise<number> {
  const database = await getDatabase();

  const row = await database.getFirstAsync<{
    count: number;
  }>(`
    SELECT COUNT(*) AS count
    FROM forms;
  `);

  return row?.count ?? 0;
}

/*
 * ============================================================================
 * LEER TODOS LOS FORMULARIOS
 * ============================================================================
 *
 * Recupera los formularios desde SQLite
 * y reconstruye FormDefinition.
 */
export async function selectAllForms(): Promise<FormDefinition[]> {
  const database = await getDatabase();

  const rows = await database.getAllAsync<FormRow>(`
    SELECT
      id,
      title,
      description,
      version,
      status,
      questions_json,
      integration_json
    FROM forms
    ORDER BY title ASC, id ASC;
  `);

  return rows.map(mapFormRow);
}

/*
 * ============================================================================
 * INSERTAR FORMULARIO
 * ============================================================================
 *
 * Inserta un formulario nuevo.
 *
 * questions e integration se convierten
 * a JSON antes de guardarse.
 */
export async function insertForm(form: FormDefinition): Promise<void> {
  const database = await getDatabase();

  await database.runAsync(
    `
      INSERT INTO forms (
        id,
        title,
        description,
        version,
        status,
        questions_json,
        integration_json
      )
      VALUES (?, ?, ?, ?, ?, ?, ?);
    `,
    form.id,
    form.title,
    form.description,
    form.version,
    form.status,
    JSON.stringify(form.questions),
    form.integration ? JSON.stringify(form.integration) : null,
  );
}

/*
 * ============================================================================
 * REEMPLAZAR FORMULARIO
 * ============================================================================
 *
 * Actualiza un formulario existente.
 *
 * INSERT OR REPLACE nos permite mantener
 * la misma estrategia utilizada en otros repositories.
 */
export async function replaceForm(form: FormDefinition): Promise<void> {
  const database = await getDatabase();

  await database.runAsync(
    `
      INSERT OR REPLACE INTO forms (
        id,
        title,
        description,
        version,
        status,
        questions_json,
        integration_json
      )
      VALUES (?, ?, ?, ?, ?, ?, ?);
    `,
    form.id,
    form.title,
    form.description,
    form.version,
    form.status,
    JSON.stringify(form.questions),
    form.integration ? JSON.stringify(form.integration) : null,
  );
}

/*
 * ============================================================================
 * ELIMINAR FORMULARIO
 * ============================================================================
 *
 * Devuelve true solamente cuando SQLite
 * realmente eliminó un registro.
 */
export async function deleteFormFromDatabase(id: string): Promise<boolean> {
  const database = await getDatabase();

  const result = await database.runAsync(
    `
      DELETE FROM forms
      WHERE id = ?;
    `,
    id,
  );

  return result.changes > 0;
}

/*
 * ============================================================================
 * SQLITE → FORM DEFINITION
 * ============================================================================
 *
 * Convierte una fila SQLite en FormDefinition.
 */
function mapFormRow(row: FormRow): FormDefinition {
  /*
   * questions_json siempre debería contener
   * un arreglo válido.
   *
   * Si la información estuviera corrupta,
   * JSON.parse lanzará un error y la hidratación
   * se detendrá para evitar trabajar con datos incompletos.
   */
  const questions = JSON.parse(row.questions_json) as FormQuestion[];

  /*
   * integration_json puede ser null
   * porque un formulario no está obligado
   * a utilizar Kobo.
   */
  const integration = row.integration_json
    ? (JSON.parse(row.integration_json) as FormDefinition["integration"])
    : undefined;

  return {
    id: row.id,

    title: row.title,

    description: row.description,

    version: row.version,

    status: row.status,

    questions,

    ...(integration
      ? {
          integration,
        }
      : {}),
  };
}
