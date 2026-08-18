import type { KoboService } from "./koboService";

import { MockKoboService } from "./mockKoboService";

/*
 * Punto único desde el que UNIESAP
 * obtiene acceso al servicio Kobo.
 *
 * Durante el prototipo utilizamos
 * MockKoboService.
 *
 * Más adelante podremos sustituirlo
 * por HttpKoboService sin modificar
 * las pantallas.
 */

const service: KoboService = new MockKoboService();

export function getKoboService(): KoboService {
  return service;
}
