import NetInfo, {
    type NetInfoState,
    type NetInfoSubscription,
} from "@react-native-community/netinfo";

/*
 * ============================================================================
 * SERVICIO DE CONECTIVIDAD
 * ============================================================================
 *
 * Esta capa centraliza la interpretación del estado de red.
 *
 * El resto de UNIESAP no necesita conocer directamente
 * los detalles de @react-native-community/netinfo.
 */

/* -------------------------------------------------------------------------- */
/*                         ESTADO UTILIZABLE                                  */
/* -------------------------------------------------------------------------- */

/*
 * NetInfo puede devolver:
 *
 * isConnected = true
 * isInternetReachable = null
 *
 * durante unos instantes mientras determina si realmente
 * existe acceso a Internet.
 *
 * Consideramos que existe conectividad utilizable cuando:
 *
 * - existe conexión de red;
 * - Internet no está confirmado explícitamente como inaccesible.
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
 * Obtiene el estado actual de conectividad.
 */
export async function getNetworkAvailability(): Promise<boolean> {
  const state = await NetInfo.fetch();

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
 * Devuelve la función unsubscribe proporcionada por NetInfo.
 */
export function subscribeToNetworkAvailability(
  listener: NetworkAvailabilityListener,
): NetInfoSubscription {
  return NetInfo.addEventListener((state) => {
    listener(isNetworkAvailable(state), state);
  });
}
