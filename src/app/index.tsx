import { Redirect } from "expo-router";

import { isAuthenticated } from "@/repositories/authSessionRepository";

/*
 * ============================================================================
 * ENTRADA DE LA APLICACIÓN
 * ============================================================================
 *
 * Si existe una sesión activa:
 *
 * /
 * ↓
 * Dashboard
 *
 * Si no existe:
 *
 * /
 * ↓
 * Login
 */
export default function Index() {
  return <Redirect href={isAuthenticated() ? "/dashboard" : "/login"} />;
}
