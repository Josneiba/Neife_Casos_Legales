import { createClient as createUtilsServerClient } from "@/utils/supabase/server"

/** Compatibilidad con el código existente (server actions, queries). */
export function createServerSupabaseClient() {
  return createUtilsServerClient()
}
