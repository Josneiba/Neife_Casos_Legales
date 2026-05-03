"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function signUp(formData: {
  email: string
  password: string
  full_name: string
  role: "client" | "lawyer"
  city?: string
  hourly_rate?: number
  license_number?: string
  specialty?: string
  budget?: number
}) {
  const supabase = createServerSupabaseClient()

  const { error } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      data: {
        full_name: formData.full_name,
        role: formData.role,
        city: formData.city,
      },
    },
  })

  if (error) return { error: error.message }

  if (formData.role === "lawyer" && formData.hourly_rate != null) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from("lawyer_profiles")
        .update({
          hourly_rate: formData.hourly_rate,
          license_number: formData.license_number,
          specialties: formData.specialty ? [formData.specialty] : [],
        })
        .eq("id", user.id)
    }
  }

  redirect(
    formData.role === "lawyer" ? "/dashboard-lawyer" : "/dashboard-client"
  )
}

export async function signIn(formData: { email: string; password: string }) {
  const supabase = createServerSupabaseClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  })

  if (error) return { error: "Email o contraseña incorrectos" }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "No se pudo obtener la sesión" }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  redirect(
    profile?.role === "lawyer" ? "/dashboard-lawyer" : "/dashboard-client"
  )
}

export async function signOut() {
  const supabase = createServerSupabaseClient()
  await supabase.auth.signOut()
  redirect("/")
}
