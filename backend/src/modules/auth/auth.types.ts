export interface RegisterBody {
  email: string;
  password: string;
  role?: "admin" | "client" | "partner";
  company_name: string;
  billing_address?: string;
  main_contact_name?: string;
  main_contact_phone?: string;
  main_contact_email?: string;
}

export interface LoginBody {
  email: string;
  password: string;
}
