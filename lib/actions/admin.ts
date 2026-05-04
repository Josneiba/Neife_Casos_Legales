"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

function isAdminUser(userId: string) {
  const raw = process.env.NEIFE_ADMIN_USER_IDS ?? ""
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .includes(userId)
}

export async function adminListLawyersPendingVerification() {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !isAdminUser(user.id)) {
    return { error: "Sin permiso" as const, lawyers: [] as const }
  }

  const { data, error } = await supabase
    .from("lawyer_profiles")
    .select("id, title, license_number, profiles(full_name, email)")
    .eq("verified", false)
    .order("created_at", { ascending: false })

  if (error) return { error: error.message, lawyers: [] as const }
  return { lawyers: data ?? [] }
}

export async function adminVerifyLawyer(lawyerId: string) {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !isAdminUser(user.id)) {
    return { error: "Sin permiso" as const }
  }

  const { error } = await supabase
    .from("lawyer_profiles")
    .update({ verified: true })
    .eq("id", lawyerId)

  if (error) return { error: error.message }
  revalidatePath("/admin/lawyers")
  return { success: true as const }
}
