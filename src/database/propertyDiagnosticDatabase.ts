import { getDatabase } from "@/database/database";

import { selectAllPropertyFormAssignments } from "@/database/propertyFormDatabase";

/*
 * ============================================================================
 * PROPERTY DIAGNOSTIC DATABASE
 * ============================================================================
 *
 * Centraliza las consultas utilizadas para:
 *
 * - diagnóstico;
 * - verificación de integridad;
 * - herramientas de desarrollador;
 * - comprobaciones previas/posteriores a migraciones.
 *
 * Este archivo NO modifica datos.
 *
 * Su responsabilidad es únicamente consultar el estado actual
 * de:
 *
 * properties
 *      ↕
 * property_forms
 *      ↕
 * forms
 *
 * ============================================================================
 * ARQUITECTURA
 * ============================================================================
 *
 * PropertyMigrationDatabase
 *          ↓
 * PropertyDiagnosticDatabase
 *          ↓
 *      SQLite
 *
 * También puede ser utilizado directamente desde herramientas
 * internas de desarrollo.
 */

/*
 * ============================================================================
 * RESULTADO DE INTEGRIDAD
 * ============================================================================
 */

export type PropertyFormIntegrityDiagnostic = {
  propertyCount: number;

  relationshipCount: number;

  orphanPropertyRelations: number;

  orphanFormRelations: number;
};

/*
 * ============================================================================
 * RESULTADO DEL DIAGNÓSTICO DE RELACIONES
 * ============================================================================
 */

export type PropertyFormDiagnostic = {
  total: number;

  relationships: {
    propertyId: string;

    formId: string;

    status: string;
  }[];
};

/*
 * ============================================================================
 * DIAGNÓSTICO DE INTEGRIDAD PROPERTY ↔ FORM
 * ============================================================================
 *
 * Comprueba:
 *
 * 1. cantidad de inmuebles;
 * 2. cantidad de relaciones;
 * 3. relaciones cuyo inmueble ya no existe;
 * 4. relaciones cuyo formulario ya no existe.
 *
 * El estado correcto debe cumplir:
 *
 * orphanPropertyRelations = 0
 * orphanFormRelations     = 0
 */

export async function getPropertyFormIntegrityDiagnostic(): Promise<PropertyFormIntegrityDiagnostic> {
  const database = await getDatabase();

  /*
   * ================================================================
   * TOTAL DE INMUEBLES
   * ================================================================
   */
  const propertyCountRow = await database.getFirstAsync<{
    count: number;
  }>(`
      SELECT COUNT(*) AS count
      FROM properties;
    `);

  /*
   * ================================================================
   * TOTAL DE RELACIONES PROPERTY ↔ FORM
   * ================================================================
   */
  const relationshipCountRow = await database.getFirstAsync<{
    count: number;
  }>(`
      SELECT COUNT(*) AS count
      FROM property_forms;
    `);

  /*
   * ================================================================
   * RELACIONES SIN INMUEBLE
   * ================================================================
   *
   * Detecta relaciones cuyo property_id ya no existe.
   */
  const orphanPropertyRow = await database.getFirstAsync<{
    count: number;
  }>(`
      SELECT COUNT(*) AS count
      FROM property_forms pf
      LEFT JOIN properties p
        ON p.id = pf.property_id
      WHERE p.id IS NULL;
    `);

  /*
   * ================================================================
   * RELACIONES SIN FORMULARIO
   * ================================================================
   *
   * Detecta relaciones cuyo form_id ya no existe.
   */
  const orphanFormRow = await database.getFirstAsync<{
    count: number;
  }>(`
      SELECT COUNT(*) AS count
      FROM property_forms pf
      LEFT JOIN forms f
        ON f.id = pf.form_id
      WHERE f.id IS NULL;
    `);

  return {
    propertyCount: propertyCountRow?.count ?? 0,

    relationshipCount: relationshipCountRow?.count ?? 0,

    orphanPropertyRelations: orphanPropertyRow?.count ?? 0,

    orphanFormRelations: orphanFormRow?.count ?? 0,
  };
}

/*
 * ============================================================================
 * DIAGNÓSTICO DE RELACIONES PROPERTY ↔ FORM
 * ============================================================================
 *
 * Devuelve todas las relaciones existentes.
 *
 * Reutilizamos PropertyFormDatabase para evitar volver
 * a duplicar SQL normal de property_forms.
 */

export async function getPropertyFormDiagnostic(): Promise<PropertyFormDiagnostic> {
  const assignments = await selectAllPropertyFormAssignments();

  return {
    total: assignments.length,

    relationships: assignments.map((assignment) => ({
      propertyId: assignment.propertyId,

      formId: assignment.formId,

      status: assignment.status,
    })),
  };
}
