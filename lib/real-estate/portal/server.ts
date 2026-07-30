import { cookies } from "next/headers";
import { PORTAL_SESSION_COOKIE, portalPrincipalFromToken } from "./auth";
export async function currentPortalPrincipal() {
  return portalPrincipalFromToken((await cookies()).get(PORTAL_SESSION_COOKIE)?.value);
}
