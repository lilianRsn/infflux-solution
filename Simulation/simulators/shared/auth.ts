import { ApiClient, ApiError } from "./api-client";

export type UserRole = "admin" | "client" | "partner";

export interface RegisterPayload {
  email: string;
  password: string;
  role?: UserRole;
  company_name: string;
  billing_address?: string;
  main_contact_name?: string;
  main_contact_phone?: string;
  main_contact_email?: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    role: UserRole;
    company_name: string;
  };
}

export async function registerIfNew(
  client: ApiClient,
  payload: RegisterPayload
): Promise<"created" | "already_exists"> {
  try {
    await client.post("/api/auth/register", payload);
    return "created";
  } catch (err) {
    if (err instanceof ApiError && err.status === 409) {
      return "already_exists";
    }
    throw err;
  }
}

export async function login(
  client: ApiClient,
  email: string,
  password: string
): Promise<LoginResponse> {
  const res = await client.post<LoginResponse>("/api/auth/login", { email, password });
  client.setToken(res.token);
  return res;
}

export type AuthOutcome = "logged_in" | "registered_then_logged_in";

export interface EnsureAuthenticatedResult {
  outcome: AuthOutcome;
  user: LoginResponse["user"];
}

/**
 * Tente un login direct — si le compte n'existe pas (401), enregistre puis
 * relogue. Rend le simulateur idempotent entre runs : le marchand peut
 * être déjà présent en base sans faire tomber le backend sur un register en
 * doublon.
 */
export async function ensureAuthenticated(
  client: ApiClient,
  payload: RegisterPayload
): Promise<EnsureAuthenticatedResult> {
  try {
    const res = await login(client, payload.email, payload.password);
    return { outcome: "logged_in", user: res.user };
  } catch (err) {
    if (!(err instanceof ApiError) || err.status !== 401) {
      throw err;
    }
  }

  await registerIfNew(client, payload);
  const res = await login(client, payload.email, payload.password);
  return { outcome: "registered_then_logged_in", user: res.user };
}
