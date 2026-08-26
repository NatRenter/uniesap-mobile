import NetInfo, {
  type NetInfoState,
  type NetInfoSubscription,
} from "@react-native-community/netinfo";

/*
 * ============================================================================
 * SERVICIO DE CONECTIVIDAD
 * ============================================================================
 *
 * Centraliza el acceso a NetInfo.
 *
 * IMPORTANTE:
 * Los logs [NetInfo] son temporales y se utilizan para comprobar
 * exactamente qué información recibe Android/Expo Go cuando cambia
 * la conectividad.
 */

/* -------------------------------------------------------------------------- */
/*                           ESTADO UTILIZABLE                                 */
/* -------------------------------------------------------------------------- */

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
/*                              DEBUG                                         */
/* -------------------------------------------------------------------------- */

function logNetworkState(source: "fetch" | "event", state: NetInfoState): void {
  console.log(`[NetInfo:${source}]`, {
    type: state.type,
    isConnected: state.isConnected,
    isInternetReachable: state.isInternetReachable,
    available: isNetworkAvailable(state),
  });
}

/* -------------------------------------------------------------------------- */
/*                              CONSULTA                                      */
/* -------------------------------------------------------------------------- */

export async function getNetworkAvailability(): Promise<boolean> {
  const state = await NetInfo.fetch();

  logNetworkState("fetch", state);

  return isNetworkAvailable(state);
}

/* -------------------------------------------------------------------------- */
/*                             SUSCRIPCIÓN                                    */
/* -------------------------------------------------------------------------- */

export type NetworkAvailabilityListener = (
  available: boolean,
  state: NetInfoState,
) => void;

export function subscribeToNetworkAvailability(
  listener: NetworkAvailabilityListener,
): NetInfoSubscription {
  console.log("[NetInfo] Registrando listener de conectividad.");

  return NetInfo.addEventListener((state) => {
    logNetworkState("event", state);

    listener(isNetworkAvailable(state), state);
  });
}
