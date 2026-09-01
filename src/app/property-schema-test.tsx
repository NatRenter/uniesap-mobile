import { useEffect, useState } from "react";

import { ScrollView, StyleSheet, Text, View } from "react-native";

import { getDatabase } from "@/database/database";

import { getPropertyFormIntegrityDiagnostic } from "@/database/propertyDiagnosticDatabase";

/*
 * ============================================================================
 * TIPOS SQLITE
 * ============================================================================
 */

type PropertyColumn = {
  cid: number;

  name: string;

  type: string;

  notnull: number;

  dflt_value: string | null;

  pk: number;
};

type SQLiteVersionRow = {
  version: string;
};

/*
 * ============================================================================
 * ESTADO DEL DIAGNÓSTICO
 * ============================================================================
 */

type DiagnosticState = {
  sqliteVersion: string;

  propertyCount: number;

  propertyFormCount: number;

  orphanPropertyRelations: number;

  orphanFormRelations: number;

  hasLegacyFormIdsJson: boolean;

  columns: PropertyColumn[];
};

/*
 * ============================================================================
 * DIAGNÓSTICO SQLITE - PROPERTIES / PROPERTY_FORMS
 * ============================================================================
 *
 * Ruta visual:
 *
 * Perfil
 *   ↓
 * Opciones de desarrollador
 *   ↓
 * Diagnóstico SQLite
 *
 * ============================================================================
 * RESPONSABILIDAD
 * ============================================================================
 *
 * Esta pantalla inspecciona:
 *
 * - versión de SQLite;
 * - estructura de properties;
 * - existencia de form_ids_json;
 * - integridad Property ↔ Form.
 *
 * ============================================================================
 * IMPORTANTE
 * ============================================================================
 *
 * La integridad Property ↔ Form YA NO se calcula aquí mediante SQL directo.
 *
 * Ahora utilizamos:
 *
 * PropertyDiagnosticDatabase
 *        ↓
 * getPropertyFormIntegrityDiagnostic()
 *
 * Esto evita duplicar consultas de:
 *
 * - total de properties;
 * - total de property_forms;
 * - relaciones huérfanas de Property;
 * - relaciones huérfanas de Form.
 *
 * La pantalla solamente mantiene SQL directo para:
 *
 * - sqlite_version();
 * - PRAGMA table_info(properties);
 *
 * porque esas operaciones pertenecen directamente
 * al diagnóstico de esquema.
 */
export default function PropertySchemaTestScreen() {
  const [diagnostic, setDiagnostic] = useState<DiagnosticState | null>(null);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function runDiagnostic() {
      try {
        const database = await getDatabase();

        /*
         * ================================================================
         * VERSIÓN SQLITE
         * ================================================================
         */
        const versionRow = await database.getFirstAsync<SQLiteVersionRow>(`
            SELECT sqlite_version() AS version;
          `);

        /*
         * ================================================================
         * COLUMNAS DE PROPERTIES
         * ================================================================
         */
        const columns = await database.getAllAsync<PropertyColumn>(`
            PRAGMA table_info(properties);
          `);

        /*
         * ================================================================
         * INTEGRIDAD PROPERTY ↔ FORM
         * ================================================================
         *
         * Esta información ya pertenece a:
         *
         * PropertyDiagnosticDatabase
         */
        const integrity = await getPropertyFormIntegrityDiagnostic();

        /*
         * ================================================================
         * COLUMNA LEGACY
         * ================================================================
         */
        const hasLegacyFormIdsJson = columns.some(
          (column) => column.name === "form_ids_json",
        );

        /*
         * ================================================================
         * RESULTADO FINAL
         * ================================================================
         */
        const result: DiagnosticState = {
          sqliteVersion: versionRow?.version ?? "desconocida",

          propertyCount: integrity.propertyCount,

          propertyFormCount: integrity.relationshipCount,

          orphanPropertyRelations: integrity.orphanPropertyRelations,

          orphanFormRelations: integrity.orphanFormRelations,

          hasLegacyFormIdsJson,

          columns,
        };

        /*
         * ================================================================
         * LOG DE DESARROLLO
         * ================================================================
         *
         * Conservamos este log porque permite copiar
         * fácilmente el estado completo desde Metro.
         */
        console.log("Diagnóstico esquema Properties:", result);

        if (!active) {
          return;
        }

        setDiagnostic(result);

        setError(null);
      } catch (diagnosticError) {
        if (!active) {
          return;
        }

        const message =
          diagnosticError instanceof Error
            ? diagnosticError.message
            : "Error desconocido ejecutando el diagnóstico.";

        console.error(
          "Error diagnosticando esquema Properties:",
          diagnosticError,
        );

        setError(message);
      }
    }

    void runDiagnostic();

    return () => {
      active = false;
    };
  }, []);

  /*
   * ==========================================================================
   * ERROR
   * ==========================================================================
   */
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Error de diagnóstico</Text>

        <Text style={styles.text}>{error}</Text>
      </View>
    );
  }

  /*
   * ==========================================================================
   * CARGANDO
   * ==========================================================================
   */
  if (!diagnostic) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Diagnóstico SQLite</Text>

        <Text style={styles.text}>Analizando properties...</Text>
      </View>
    );
  }

  /*
   * ==========================================================================
   * RESULTADO DE INTEGRIDAD
   * ==========================================================================
   */
  const integrityIsValid =
    diagnostic.orphanPropertyRelations === 0 &&
    diagnostic.orphanFormRelations === 0;

  /*
   * ==========================================================================
   * ESTADO DE MIGRACIÓN
   * ==========================================================================
   *
   * Caso 1:
   *
   * Integridad correcta
   * +
   * form_ids_json todavía existe
   *
   * → LISTO PARA MIGRAR
   *
   *
   * Caso 2:
   *
   * Integridad correcta
   * +
   * form_ids_json ya no existe
   *
   * → MIGRACIÓN YA APLICADA
   *
   *
   * Caso 3:
   *
   * Integridad incorrecta
   *
   * → NO MIGRAR TODAVÍA
   */
  const migrationStatus =
    integrityIsValid && diagnostic.hasLegacyFormIdsJson
      ? "LISTO PARA MIGRAR"
      : integrityIsValid && !diagnostic.hasLegacyFormIdsJson
        ? "MIGRACIÓN YA APLICADA"
        : "NO MIGRAR TODAVÍA";

  /*
   * ==========================================================================
   * RESULTADO
   * ==========================================================================
   */
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Diagnóstico SQLite</Text>

      {/* ================================================================ */}
      {/* VERSIÓN SQLITE                                                   */}
      {/* ================================================================ */}

      <View style={styles.card}>
        <Text style={styles.label}>Versión SQLite</Text>

        <Text style={styles.value}>{diagnostic.sqliteVersion}</Text>
      </View>

      {/* ================================================================ */}
      {/* INMUEBLES                                                        */}
      {/* ================================================================ */}

      <View style={styles.card}>
        <Text style={styles.label}>Inmuebles</Text>

        <Text style={styles.value}>{diagnostic.propertyCount}</Text>
      </View>

      {/* ================================================================ */}
      {/* RELACIONES                                                       */}
      {/* ================================================================ */}

      <View style={styles.card}>
        <Text style={styles.label}>Relaciones Property ↔ Form</Text>

        <Text style={styles.value}>{diagnostic.propertyFormCount}</Text>
      </View>

      {/* ================================================================ */}
      {/* HUÉRFANAS PROPERTY                                               */}
      {/* ================================================================ */}

      <View style={styles.card}>
        <Text style={styles.label}>Relaciones sin inmueble</Text>

        <Text style={styles.value}>{diagnostic.orphanPropertyRelations}</Text>
      </View>

      {/* ================================================================ */}
      {/* HUÉRFANAS FORM                                                   */}
      {/* ================================================================ */}

      <View style={styles.card}>
        <Text style={styles.label}>Relaciones sin formulario</Text>

        <Text style={styles.value}>{diagnostic.orphanFormRelations}</Text>
      </View>

      {/* ================================================================ */}
      {/* INTEGRIDAD                                                       */}
      {/* ================================================================ */}

      <View
        style={[
          styles.card,

          integrityIsValid ? styles.successCard : styles.errorCard,
        ]}
      >
        <Text style={styles.label}>Integridad Property ↔ Form</Text>

        <Text style={styles.value}>
          {integrityIsValid ? "Correcta" : "Requiere revisión"}
        </Text>
      </View>

      {/* ================================================================ */}
      {/* LEGACY COLUMN                                                    */}
      {/* ================================================================ */}

      <View style={styles.card}>
        <Text style={styles.label}>form_ids_json</Text>

        <Text style={styles.value}>
          {diagnostic.hasLegacyFormIdsJson ? "Existe" : "No existe"}
        </Text>
      </View>

      {/* ================================================================ */}
      {/* ESTADO PARA MIGRACIÓN                                            */}
      {/* ================================================================ */}

      <View
        style={[
          styles.card,

          integrityIsValid ? styles.successCard : styles.errorCard,
        ]}
      >
        <Text style={styles.label}>Estado para migración</Text>

        <Text style={styles.value}>{migrationStatus}</Text>
      </View>

      {/* ================================================================ */}
      {/* COLUMNAS                                                         */}
      {/* ================================================================ */}

      <View style={styles.card}>
        <Text style={styles.label}>Columnas de properties</Text>

        {diagnostic.columns.map((column) => (
          <Text key={column.name} style={styles.column}>
            {column.name}
            {"  "}({column.type})
          </Text>
        ))}
      </View>
    </ScrollView>
  );
}

/*
 * ============================================================================
 * ESTILOS
 * ============================================================================
 */
const styles = StyleSheet.create({
  container: {
    padding: 24,

    gap: 16,
  },

  center: {
    flex: 1,

    alignItems: "center",

    justifyContent: "center",

    padding: 24,
  },

  card: {
    padding: 16,

    borderWidth: 1,

    borderColor: "#D1D5DB",

    borderRadius: 12,
  },

  successCard: {
    borderWidth: 2,
  },

  errorCard: {
    borderWidth: 2,
  },

  title: {
    fontSize: 24,

    fontWeight: "700",
  },

  errorTitle: {
    fontSize: 20,

    fontWeight: "700",

    marginBottom: 12,
  },

  label: {
    fontSize: 13,

    fontWeight: "600",

    marginBottom: 6,
  },

  value: {
    fontSize: 17,

    fontWeight: "700",
  },

  text: {
    fontSize: 15,

    textAlign: "center",
  },

  column: {
    fontSize: 14,

    marginTop: 6,
  },
});
