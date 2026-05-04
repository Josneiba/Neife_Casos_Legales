import { createBrowserClient } from "@supabase/ssr"
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/env"

export function createClient() {
  const url = getSupabaseUrl()
  const key = getSupabasePublishableKey()
  if (!url || !key) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (o NEXT_PUBLIC_SUPABASE_ANON_KEY)"
    )
  }
  return createBrowserClient(url, key)
}
