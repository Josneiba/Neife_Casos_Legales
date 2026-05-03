"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

function pickDefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>
}

export async function updateLawyerProfile(
  data: Partial<{
    title: string
    bio: string
    city: string
    phone: string
    specialties: string[]
    hourly_rate: number
    free_consult: boolean
    payment_plan: boolean
    contingency: boolean
    contingency_rate: number
    min_client_budget: number
    available: boolean
    availability_grid: Record<string, Record<string, boolean>>
  }>
) {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  const { title, bio, city, phone, ...lawyerRest } = data

  const profileUpdate = pickDefined({ bio, city, phone })
  if (Object.keys(profileUpdate).length > 0) {
    await supabase.from("profiles").update(profileUpdate).eq("id", user.id)
  }

  const lawyerUpdate = pickDefined({ title, ...lawyerRest })
  if (Object.keys(lawyerUpdate).length > 0) {
    await supabase
      .from("lawyer_profiles")
      .update(lawyerUpdate)
      .eq("id", user.id)
  }

  revalidatePath("/dashboard-lawyer/profile")
  return { success: true as const }
}

export async function submitProposal(data: {
  post_id: string
  client_id: string
  message: string
  proposed_rate: number
  estimated_time: string
}) {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  const { error } = await supabase.from("lawyer_proposals").insert({
    post_id: data.post_id,
    lawyer_id: user.id,
    client_id: data.client_id,
    message: data.message,
    proposed_rate: data.proposed_rate,
    estimated_time: data.estimated_time,
  })

  revalidatePath("/dashboard-lawyer/find-clients")
  return { success: !error }
}
