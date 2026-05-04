import { createClient } from "@/lib/supabase/client"

export async function getLawyerOwnProfile() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data, error } = await supabase
    .from("profiles")
    .select("*, lawyer_profiles(*)")
    .eq("id", user.id)
    .single()
  if (error || !data) return null
  return data as Record<string, unknown> & {
    lawyer_profiles?: Record<string, unknown> | null
  }
}

export async function getLawyerExperienceRows(lawyerId: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from("lawyer_experience")
    .select("id, company, role, period, description")
    .eq("lawyer_id", lawyerId)
    .order("created_at", { ascending: false })
  return data ?? []
}
