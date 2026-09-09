/*
 * ============================================================================
 * UTILIDADES DE FECHA
 * ============================================================================
 *
 * Las inspecciones actuales utilizan fechas ISO completas, mientras que algunos
 * datos anteriores pueden conservar únicamente YYYY-MM-DD. Estas funciones
 * aceptan ambos formatos y evitan que cada pantalla implemente su propia lógica.
 */

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/*
 * Convierte una fecha a DD/MM/YYYY.
 *
 * Ejemplos aceptados:
 * 2026-09-02
 * 2026-09-02T15:30:25.123Z
 */
export function formatDate(value: string): string {
  const dateOnlyMatch = DATE_ONLY_PATTERN.exec(value);

  /*
   * Las fechas sin hora se formatean manualmente para evitar cambios de día
   * provocados por la conversión de zona horaria de JavaScript.
   */
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;

    return `${day}/${month}/${year}`;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/*
 * Convierte un timestamp a fecha y hora legibles según la zona horaria
 * configurada en el dispositivo.
 */
export function formatDateTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
