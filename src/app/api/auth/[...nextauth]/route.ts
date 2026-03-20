import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

const handler = NextAuth(authOptions);

async function POST(req: Request, ...args: any[]) {
  // CSRF token/origin validation for cookie-based auth
  const origin = req.headers.get("origin");
  const ref = req.headers.get("referer");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  try {
    const allowedOrigin = new URL(siteUrl).origin;
    if (origin && new URL(origin).origin !== allowedOrigin) {
      return new NextResponse("Invalid origin", { status: 403 });
    }
    if (!origin && ref && new URL(ref).origin !== allowedOrigin) {
      return new NextResponse("Invalid referer", { status: 403 });
    }
  } catch (error) {
    // If URL parsing fails, deny access
    return new NextResponse("Invalid request origin format", { status: 400 });
  }

  return (handler as any)(req, ...args);
}

export { handler as GET, POST };
