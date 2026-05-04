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
    full_name: string
    title: string
    bio: string
    city: string
    phone: string
    license_number: string
    experience_years: number
    specialties: string[]
    hourly_rate: number
    fixed_rate: number
    monthly_retainer: number
    free_consult: boolean
    payment_plan: boolean
    contingency: boolean
    contingency_rate: number
    min_client_budget: number
    available: boolean
    availability_grid: Record<string, Record<string, boolean>> | Record<string, boolean>
  }>
) {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  const profileUpdate = pickDefined({
    full_name: data.full_name,
    bio: data.bio,
    city: data.city,
    phone: data.phone,
  })
  if (Object.keys(profileUpdate).length > 0) {
    await supabase.from("profiles").update(profileUpdate).eq("id", user.id)
  }

  const lawyerUpdate = pickDefined({
    title: data.title,
    license_number: data.license_number,
    experience_years: data.experience_years,
    specialties: data.specialties,
    hourly_rate: data.hourly_rate,
    fixed_rate: data.fixed_rate,
    monthly_retainer: data.monthly_retainer,
    free_consult: data.free_consult,
    payment_plan: data.payment_plan,
    contingency: data.contingency,
    contingency_rate: data.contingency_rate,
    min_client_budget: data.min_client_budget,
    available: data.available,
    availability_grid: data.availability_grid as Record<
      string,
      Record<string, boolean>
    >,
  })
  if (Object.keys(lawyerUpdate).length > 0) {
    await supabase
      .from("lawyer_profiles")
      .update(lawyerUpdate)
      .eq("id", user.id)
  }

  revalidatePath("/dashboard-lawyer/profile")
  revalidatePath("/dashboard-lawyer/settings")
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
