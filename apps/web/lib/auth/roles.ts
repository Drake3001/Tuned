const APP_ROLES = new Set(["player", "admin"]);

function realmRolesFromClaims(claims: unknown): string[] {
  const roles =
    (claims as { realm_access?: { roles?: string[] } })?.realm_access?.roles ?? [];
  return roles.filter((r) => APP_ROLES.has(r));
}

function decodeJwtPayload(idToken: string): unknown {
  const payload = idToken.split(".")[1];
  if (!payload) return null;
  const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
  const json = Buffer.from(normalized, "base64").toString("utf8");
  return JSON.parse(json) as unknown;
}

export function parseKeycloakRoles(profile: unknown): string[] {
  return realmRolesFromClaims(profile);
}

/**
 * Keycloak puts realm_access.roles in the access token (always) and
 * optionally in the ID token. The userinfo profile often omits it.
 * We check all three sources.
 */
export function parseKeycloakRolesFromSignIn(
  profile: unknown,
  idToken?: string | null,
  accessToken?: string | null,
): string[] {
  const fromProfile = realmRolesFromClaims(profile);
  const fromIdToken = idToken ? realmRolesFromClaims(decodeJwtPayload(idToken)) : [];
  const fromAccessToken = accessToken ? realmRolesFromClaims(decodeJwtPayload(accessToken)) : [];
  return [...new Set([...fromProfile, ...fromIdToken, ...fromAccessToken])];
}

export function isAdmin(roles?: string[]): boolean {
  return roles?.includes("admin") ?? false;
}
