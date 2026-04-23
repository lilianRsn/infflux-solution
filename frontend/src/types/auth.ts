export type Role = "client" | "admin" | "partenaire";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  company?: string;
}

export interface AuthSession {
  user: User;
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}
