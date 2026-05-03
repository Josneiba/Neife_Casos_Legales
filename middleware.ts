import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) {
    return NextResponse.next({ request: { headers: request.headers } })
  }

  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(url, anon, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({ name, value, ...options })
        response = NextResponse.next({ request: { headers: request.headers } })
        response.cookies.set({ name, value, ...options })
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({ name, value: "", ...options })
        response = NextResponse.next({ request: { headers: request.headers } })
        response.cookies.set({ name, value: "", ...options })
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

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

    const redirect =
      profile?.role === "lawyer" ? "/dashboard-lawyer" : "/dashboard-client"
    return NextResponse.redirect(new URL(redirect, request.url))
  }

  return response
}

export const config = {
  matcher: [
    "/dashboard-client/:path*",
    "/dashboard-lawyer/:path*",
    "/login",
    "/register",
  ],
}
