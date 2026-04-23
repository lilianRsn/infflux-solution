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
    if (err instanceof ApiError) {
      if (err.status === 409) return "already_exists";
      // Le backend peut renvoyer 500 avec message "Email already exists"
      // au lieu d'un 409 propre ; on normalise ici.
      if (err.status === 500 && isEmailAlreadyExistsBody(err.body)) {
        return "already_exists";
      }
    }
    throw err;
  }
}

function isEmailAlreadyExistsBody(body: unknown): boolean {
  if (typeof body !== "object" || body === null || !("message" in body)) return false;
  const msg = (body as { message: unknown }).message;
  return typeof msg === "string" && msg.toLowerCase().includes("already exists");
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
 * Tente un login direct — si le compte n'existe pas, enregistre puis relogue.
 * Accepte 401 (attendu) ou 500 (le backend remonte actuellement toutes les
 * erreurs auth en 500, y compris "Invalid credentials") comme signal de
 * "compte absent → tenter register".
 */
export async function ensureAuthenticated(
  client: ApiClient,
  payload: RegisterPayload
): Promise<EnsureAuthenticatedResult> {
  try {
    const res = await login(client, payload.email, payload.password);
    return { outcome: "logged_in", user: res.user };
  } catch (err) {
    if (!(err instanceof ApiError) || (err.status !== 401 && err.status !== 500)) {
      throw err;
    }
  }

  await registerIfNew(client, payload);
  const res = await login(client, payload.email, payload.password);
  return { outcome: "registered_then_logged_in", user: res.user };
}
