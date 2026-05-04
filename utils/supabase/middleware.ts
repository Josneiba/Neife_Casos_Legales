import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/env"

/**
 * Refresca la sesión en middleware y devuelve la respuesta con cookies actualizadas.
 */
export function createMiddlewareSupabase(request: NextRequest) {
  let response = NextResponse.next({ request })

  const url = getSupabaseUrl()
  const key = getSupabasePublishableKey()

  if (!url || !key) {
    return { supabase: null as ReturnType<typeof createServerClient> | null, response }
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        )
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  })

  return { supabase, response }
}
