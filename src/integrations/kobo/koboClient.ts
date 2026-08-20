import type { KoboService } from "./koboService";

import { MockKoboService } from "./mockKoboService";

import { RemoteKoboService } from "./remoteKoboService";

export type KoboServiceMode = "mock" | "remote";

/*
 * Durante el prototipo seguimos
 * utilizando MOCK.
 *
 * Más adelante esto vendrá de
 * configuración de entorno.
 */
const MODE: KoboServiceMode = "mock";

function createKoboService(): KoboService {
  if (MODE === "remote") {
    return new RemoteKoboService({
      baseUrl: "http://localhost:8000",
    });
  }

  return new MockKoboService();
}

const service = createKoboService();

export function getKoboService(): KoboService {
  return service;
}
