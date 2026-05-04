import { createClient } from "@/lib/supabase/client"

export async function getMyProfile() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()
  if (error || !data) return null
  return data
}
