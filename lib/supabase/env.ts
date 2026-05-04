/** URL del proyecto Supabase */
export function getSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
}

/**
 * Clave publicable (dashboard nuevo) o anon legacy.
 * Prioridad: PUBLISHABLE_KEY → ANON_KEY
 */
export function getSupabasePublishableKey(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    ""
  )
}
