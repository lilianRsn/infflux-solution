import { NextRequest, NextResponse } from "next/server";

import type { Role } from "@/types/auth";

const ROLE_ROUTES: Record<string, Role[]> = {
  "/admin": ["admin"],
  "/client": ["client"],
  "/partenaire": ["partenaire"],
  "/warehouse": ["admin", "client"],
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("infflux_token")?.value;

  if (
    !token &&
    !pathname.startsWith("/login") &&
    !pathname.startsWith("/api") &&
    pathname !== "/"
  ) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!token) {
    return NextResponse.next();
  }

  let role: Role | null = null;

  try {
    const payload = token.split(".")[1];
    if (!payload) throw new Error("missing-payload");
    const decoded = JSON.parse(atob(payload)) as { user?: { role?: Role } };
    role = decoded.user?.role ?? null;
  } catch {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("infflux_token");
    return response;
  }

  for (const [prefix, allowedRoles] of Object.entries(ROLE_ROUTES)) {
    if (pathname.startsWith(prefix) && (!role || !allowedRoles.includes(role))) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  if (pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
