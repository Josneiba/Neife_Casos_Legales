"use server"

import { createClient } from "@supabase/supabase-js"
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
  // Use service role client to auto-confirm user
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: formData.email,
    password: formData.password,
    email_confirm: true,
    user_metadata: {
      full_name: formData.full_name,
      role: formData.role,
      city: formData.city,
    },
  })

  if (error) return { error: error.message }

  const user = data.user
  if (!user) return { error: "No se pudo crear el usuario" }

  // Create profile in public.profiles
  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .insert({
      id: user.id,
      email: user.email!,
      full_name: formData.full_name,
      role: formData.role,
      city: formData.city,
    })

  if (profileError) {
    console.error("Error creating profile:", profileError)
  }

  // Create lawyer profile if role is lawyer
  if (formData.role === "lawyer") {
    const { error: lawyerProfileError } = await supabaseAdmin
      .from("lawyer_profiles")
      .insert({
        id: user.id,
        hourly_rate: formData.hourly_rate || 0,
        license_number: formData.license_number || "",
        specialties: formData.specialty ? [formData.specialty] : [],
        verified: false,
      })

    if (lawyerProfileError) {
      console.error("Error creating lawyer profile:", lawyerProfileError)
      return { error: "Error al crear perfil de abogado" }
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

export async function requestPasswordReset(email: string) {
  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    return { error: "Ingresa un email válido" }
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/login`
      : undefined,
  })

  if (error) {
    return { error: "No se pudo enviar el correo de recuperación. Verifica tu email." }
  }

  return {}
}

export async function recoverEmail(formData: {
  full_name: string
  city?: string
}) {
  if (!formData.full_name?.trim()) {
    return { error: "El nombre es requerido para recuperar el correo" }
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )

  let query = supabaseAdmin
    .from("profiles")
    .select("email,full_name,city", { count: "exact" })
    .ilike("full_name", formData.full_name.trim())

  if (formData.city?.trim()) {
    query = query.eq("city", formData.city.trim())
  }

  const { data, error } = await query

  if (error) {
    return { error: "Error al buscar tu cuenta. Intenta más tarde." }
  }

  if (!data || data.length === 0) {
    return { error: "No se encontró ninguna cuenta con esos datos." }
  }

  if (data.length > 1) {
    return {
      error:
        "Se encontraron varias cuentas. Por favor contacta soporte para recuperar tu correo.",
    }
  }

  return { email: data[0].email }
}
