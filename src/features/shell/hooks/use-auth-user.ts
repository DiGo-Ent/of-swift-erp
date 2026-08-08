import { getRouteApi } from "@tanstack/react-router";

const authRoute = getRouteApi("/_authenticated");

/** The signed-in Supabase user, resolved by the /_authenticated layout guard. */
export function useAuthUser() {
  return authRoute.useRouteContext().user;
}
