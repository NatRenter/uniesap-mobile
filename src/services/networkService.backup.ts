import NetInfo, {
  type NetInfoState,
  type NetInfoSubscription,
} from "@react-native-community/netinfo";

import { Platform } from "react-native";

/*
 * ============================================================================
 * SERVICIO DE CONECTIVIDAD
 * ============================================================================
 *
 * Esta capa centraliza la interpretación del estado de red.
 *
 * El resto de UNIESAP no necesita conocer directamente
 * los detalles de @react-native-community/netinfo.
 *
 *
 * PROBLEMA QUE RESOLVEMOS
 * ============================================================================
 *
 * En algunos escenarios —especialmente durante pruebas con emuladores—
 * el listener nativo puede tardar en reflejar:
 *
 * online
 *   ↓
 * offline
 *   ↓
 * online
 *
 * Por eso utilizamos dos mecanismos complementarios:
 *
 * 1. eventos de NetInfo;
 * 2. una comprobación periódica con NetInfo.refresh().
 *
 * Ambos pasan por el mismo filtro y solamente notifican cuando
 * realmente cambia el valor disponible/no disponible.
 */

/* -------------------------------------------------------------------------- */
/*                         CONFIGURACIÓN NATIVA                               */
/* -------------------------------------------------------------------------- */

/*
 * En Android/iOS hacemos una comprobación activa de reachability.
 *
 * useNativeReachability = false
 *
 * obliga a NetInfo a comprobar el endpoint de reachability en lugar
 * de depender únicamente del estado nativo de la interfaz de red.
 *
 * Esto resulta útil cuando:
 *
 * - el dispositivo sigue conectado a Wi-Fi;
 * - pero Wi-Fi ya no tiene salida real a Internet.
 *
 *
 * IMPORTANTE:
 *
 * No aplicamos esta configuración en Web porque la comprobación
 * HTTP de reachability puede tener diferencias relacionadas con CORS.
 */
if (Platform.OS !== "web") {
  NetInfo.configure({
    reachabilityUrl: "https://clients3.google.com/generate_204",

    reachabilityMethod: "HEAD",

    reachabilityTest: async (response) => response.status === 204,

    /*
     * Cuando estamos offline comprobamos con mayor frecuencia.
     */
    reachabilityShortTimeout: 2_000,

    /*
     * Cuando estamos online no necesitamos comprobar continuamente
     * mediante la lógica interna de NetInfo.
     *
     * Nuestro fallback de polling también llama refresh().
     */
    reachabilityLongTimeout: 10_000,

    reachabilityRequestTimeout: 5_000,

    reachabilityShouldRun: () => true,

    useNativeReachability: false,
  });
}

/* -------------------------------------------------------------------------- */
/*                         CONFIGURACIÓN DEL FALLBACK                          */
/* -------------------------------------------------------------------------- */

/*
 * Frecuencia del respaldo activo.
 *
 * No intenta sincronizar cada 3 segundos.
 *
 * Únicamente vuelve a preguntar a NetInfo cuál es el estado actual.
 * useInspectionAutoSync decidirá si existe realmente una transición
 * y si hay inspecciones pendientes.
 */
const NETWORK_REFRESH_INTERVAL_MS = 3_000;

/* -------------------------------------------------------------------------- */
/*                         ESTADO UTILIZABLE                                  */
/* -------------------------------------------------------------------------- */

/*
 * NetInfo puede devolver:
 *
 * isConnected = true
 * isInternetReachable = null
 *
 * durante unos instantes mientras determina alcance real.
 *
 * Interpretación:
 *
 * isConnected !== true
 *   → offline
 *
 * isInternetReachable === false
 *   → offline
 *
 * isConnected === true + isInternetReachable true/null
 *   → disponible provisionalmente
 *
 * El refresh periódico terminará resolviendo el valor null.
 */
export function isNetworkAvailable(state: NetInfoState): boolean {
  if (state.isConnected !== true) {
    return false;
  }

  if (state.isInternetReachable === false) {
    return false;
  }

  return true;
}

/* -------------------------------------------------------------------------- */
/*                             CONSULTA                                       */
/* -------------------------------------------------------------------------- */

/*
 * Fuerza una lectura fresca.
 *
 * Utilizamos refresh() en lugar de fetch() porque refresh()
 * solicita activamente el estado actual a la instancia global
 * de NetInfo.
 */
export async function getNetworkAvailability(): Promise<boolean> {
  const state = await NetInfo.refresh();

  return isNetworkAvailable(state);
}

/* -------------------------------------------------------------------------- */
/*                            SUSCRIPCIÓN                                     */
/* -------------------------------------------------------------------------- */

export type NetworkAvailabilityListener = (
  available: boolean,
  state: NetInfoState,
) => void;

/*
 * Escucha cambios de conectividad.
 *
 * Además del listener nativo mantenemos un pequeño fallback
 * de comprobación periódica.
 *
 * La función notifyIfChanged() evita notificaciones duplicadas.
 */
export function subscribeToNetworkAvailability(
  listener: NetworkAvailabilityListener,
): NetInfoSubscription {
  let active = true;

  let lastAvailability: boolean | null = null;

  /*
   * Evita que:
   *
   * NetInfo event
   *      +
   * refresh()
   *
   * produzcan dos eventos lógicos iguales.
   */
  function notifyIfChanged(state: NetInfoState) {
    if (!active) {
      return;
    }

    const available = isNetworkAvailable(state);

    if (lastAvailability === available) {
      return;
    }

    lastAvailability = available;

    listener(available, state);
  }

  /*
   * Evento principal de NetInfo.
   */
  const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
    notifyIfChanged(state);
  });

  /*
   * Fallback.
   *
   * Si Android/emulador no entrega a tiempo un evento nativo,
   * refresh() obliga a consultar nuevamente el estado.
   */
  const refreshTimer = setInterval(() => {
    if (!active) {
      return;
    }

    void NetInfo.refresh()
      .then((state) => {
        notifyIfChanged(state);
      })
      .catch((error) => {
        /*
         * No transformamos un error del checker en "offline".
         *
         * Un fallo aislado de refresh() no debería cambiar
         * artificialmente el estado de toda la aplicación.
         */
        console.warn(
          "No fue posible refrescar el estado de conectividad:",
          error,
        );
      });
  }, NETWORK_REFRESH_INTERVAL_MS);

  /*
   * Limpieza conjunta.
   */
  return () => {
    active = false;

    clearInterval(refreshTimer);

    unsubscribeNetInfo();
  };
}
