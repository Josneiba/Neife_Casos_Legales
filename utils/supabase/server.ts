import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/env"

function buildServerClient(cookieStore: ReturnType<typeof cookies>) {
  const url = getSupabaseUrl()
  const key = getSupabasePublishableKey()
  if (!url || !key) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (o NEXT_PUBLIC_SUPABASE_ANON_KEY)"
    )
  }

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options as CookieOptions | undefined)
          )
        } catch {
          /* Server Components sin mutación de cookies */
        }
      },
    },
  })
}

/**
 * Uso en Server Components, Server Actions y Route Handlers.
 * (Plantilla Supabase: cookies con getAll / setAll)
 */
export function createClient() {
  const cookieStore = cookies()
  return buildServerClient(cookieStore)
}
