import type { Role, User } from "@/types/auth";

export function getRedirectByRole(role: Role): string {
  switch (role) {
    case "admin":
      return "/admin/dashboard";
    case "client":
      return "/client/commande";
    case "partenaire":
      return "/partenaire/dashboard";
    default:
      return "/login";
  }
}

export function decodeJWT(token: string): User | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const decoded = JSON.parse(atob(payload)) as { user?: User };
    return decoded.user ?? null;
  } catch {
    return null;
  }
}

export const TOKEN_KEY = "infflux_token";

export function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getCurrentUser(): User | null {
  const token = getToken();
  if (!token) return null;
  return decodeJWT(token);
}
