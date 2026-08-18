export const KOBO_API_VERSION = "v2";

export const KOBO_API_PATH = `/api/${KOBO_API_VERSION}`;

export type KoboConfig = {
  baseUrl: string;
};

export const koboConfig: KoboConfig = {
  /*
   * Temporal.
   *
   * Más adelante esta URL
   * vendrá de la configuración
   * de entorno de UNIESAP.
   */
  baseUrl: "",
};
