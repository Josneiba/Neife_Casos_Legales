import { NextResponse, type NextRequest } from "next/server"
import { createMiddlewareSupabase } from "@/utils/supabase/middleware"

export async function middleware(request: NextRequest) {
  const { supabase, response } = createMiddlewareSupabase(request)

  if (!supabase) {
    return response
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
    const admins = (process.env.NEIFE_ADMIN_USER_IDS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
    if (!admins.includes(user.id)) {
      return NextResponse.redirect(new URL("/dashboard-client", request.url))
    }
    return response
  }

  if (!user && request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (
    user &&
    (request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/register")
  ) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    const redirectPath =
      profile?.role === "lawyer" ? "/dashboard-lawyer" : "/dashboard-client"
    return NextResponse.redirect(new URL(redirectPath, request.url))
  }

  return response
}

export const config = {
  matcher: [
    "/dashboard-client/:path*",
    "/dashboard-lawyer/:path*",
    "/admin/:path*",
    "/login",
    "/register",
  ],
}
