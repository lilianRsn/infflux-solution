import { SignJWT } from "jose";
import { NextRequest, NextResponse } from "next/server";

import type { Role, User } from "@/types/auth";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "infflux-dev-secret-change-in-production",
);

const MOCK_USERS: (User & { password: string })[] = [
  {
    id: "1",
    email: "admin@infflux.com",
    password: "admin123",
    name: "Admin Infflux",
    role: "admin",
    company: "Infflux",
  },
  {
    id: "2",
    email: "client@demo.com",
    password: "client123",
    name: "Jean Dupont",
    role: "client",
    company: "Dupont SAS",
  },
  {
    id: "3",
    email: "partenaire@translog.com",
    password: "partenaire123",
    name: "Marie Leroy",
    role: "partenaire",
    company: "TransLog Express",
  },
];

export async function POST(request: NextRequest) {
  try {
    const { email, password } = (await request.json()) as {
      email?: string;
      password?: string;
    };

    const found = MOCK_USERS.find(
      (user) => user.email === email && user.password === password,
    );

    if (!found) {
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect" },
        { status: 401 },
      );
    }

    const user: User = {
      id: found.id,
      email: found.email,
      name: found.name,
      role: found.role,
      company: found.company,
    };

    const token = await new SignJWT({ user })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("8h")
      .sign(JWT_SECRET);

    const redirects: Record<Role, string> = {
      admin: "/",
      client: "/",
      partenaire: "/",
    };

    const response = NextResponse.json({
      user,
      redirect: redirects[user.role],
    });

    response.cookies.set("infflux_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 8,
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
