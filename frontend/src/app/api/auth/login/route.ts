import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Call real backend
    const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Erreur de connexion' }));
      return NextResponse.json(
        { error: error.message || "Email ou mot de passe incorrect" },
        { status: res.status },
      );
    }

    const { user, token } = await res.json();

    const mappedRole = user.role === 'partner' ? 'partenaire' : user.role;

    const redirects: Record<string, string> = {
      admin: "/admin/dashboard",
      client: "/client/commande",
      partenaire: "/partenaire/dashboard",
    };

    const response = NextResponse.json({
      user: { ...user, role: mappedRole },
      redirect: redirects[mappedRole] || "/",
    });

    response.cookies.set("infflux_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 8,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
