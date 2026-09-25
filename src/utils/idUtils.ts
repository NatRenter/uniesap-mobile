/*
 * ============================================================================
 * UTILIDADES DE IDENTIDAD
 * ============================================================================
 *
 * Centraliza la creación de identificadores internos de UNIESAP.
 *
 * Los registros creados offline necesitan poseer su identidad definitiva
 * ANTES de comunicarse con la API.
 *
 * Por eso:
 *
 * dispositivo
 *     ↓
 * genera UUID
 *     ↓
 * SQLite
 *     ↓
 * API UNIESAP
 *     ↓
 * base central
 *
 * El servidor NO sustituirá el ID generado por el dispositivo.
 */

/*
 * Genera un UUID v4.
 *
 * En entornos modernos utilizamos crypto.randomUUID().
 *
 * El fallback permite que el prototipo continúe funcionando en un entorno
 * donde randomUUID todavía no estuviera disponible.
 */
export function createUuid(): string {
  const cryptoObject = globalThis.crypto;

  if (cryptoObject?.randomUUID) {
    return cryptoObject.randomUUID();
  }

  return createFallbackUuid();
}

/*
 * ============================================================================
 * FALLBACK UUID v4
 * ============================================================================
 *
 * Este método solamente se utiliza cuando el runtime no ofrece
 * crypto.randomUUID().
 *
 * Mantiene el formato estándar:
 *
 * xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 */
function createFallbackUuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
    /[xy]/g,
    (character) => {
      const random = Math.floor(Math.random() * 16);

      const value = character === "x" ? random : (random & 0x3) | 0x8;

      return value.toString(16);
    },
  );
}
