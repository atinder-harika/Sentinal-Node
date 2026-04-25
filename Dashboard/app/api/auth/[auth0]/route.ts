/**
 * Auth0 catch-all route.
 *
 * Exposes:
 *   /api/auth/login    → start login
 *   /api/auth/logout   → secure logout
 *   /api/auth/callback → OAuth callback
 *   /api/auth/me       → current user JSON
 *
 * If AUTH0_SECRET / AUTH0_BASE_URL / AUTH0_ISSUER_BASE_URL / AUTH0_CLIENT_ID
 * / AUTH0_CLIENT_SECRET are absent we short-circuit the login flow and return
 * a stub responder profile so the UI continues to function during development.
 */
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ auth0: string }>;
}

function isWired() {
  return Boolean(
    process.env.AUTH0_SECRET &&
      process.env.AUTH0_BASE_URL &&
      process.env.AUTH0_ISSUER_BASE_URL &&
      process.env.AUTH0_CLIENT_ID &&
      process.env.AUTH0_CLIENT_SECRET
  );
}

const STUB_USER = {
  sub: "responder|sentinel-dev",
  name: "Atinder · Dev Responder",
  email: "responder@sentinel.local",
  picture: "/icon.svg",
  clearance: "L3",
  org: "SENTINEL_COMMAND",
};

async function delegateToAuth0(req: NextRequest, ctx: RouteContext) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mod: any = await import("@auth0/nextjs-auth0");
  const handler = mod.handleAuth();
  return handler(req, ctx);
}

export async function GET(req: NextRequest, ctx: RouteContext) {
  const { auth0 } = await ctx.params;

  if (!isWired()) {
    if (auth0 === "me") return NextResponse.json({ user: STUB_USER, mock: true });
    if (auth0 === "logout") {
      const res = NextResponse.redirect(new URL("/", req.url));
      res.cookies.delete("appSession");
      return res;
    }
    if (auth0 === "login")
      return NextResponse.redirect(new URL("/dashboard", req.url));
    return NextResponse.json({ ok: true, mock: true, route: auth0 });
  }

  return delegateToAuth0(req, ctx);
}

export const POST = GET;
