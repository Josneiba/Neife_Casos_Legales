"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

function pickDefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>
}

export async function updateProfile(data: {
  full_name?: string
  city?: string
  phone?: string
  bio?: string
}) {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" as const }

  const update = pickDefined({
    full_name: data.full_name,
    city: data.city,
    phone: data.phone,
    bio: data.bio,
  })
  if (Object.keys(update).length === 0) return { success: true as const }

  const { error } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", user.id)

  revalidatePath("/dashboard-client/settings")
  revalidatePath("/dashboard-client")
  return { success: !error, error: error?.message }
}

function sanitizeAvatarName(name: string) {
  return name.replace(/[^\w.\-]/g, "_").slice(0, 80) || "avatar"
}

export async function uploadProfileAvatar(formData: FormData) {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" as const }

  const file = formData.get("file") as File | null
  if (!file || file.size === 0) return { error: "Archivo inválido" as const }
  if (file.size > 2 * 1024 * 1024) return { error: "Máximo 2MB" as const }

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase()
  const path = `${user.id}/${crypto.randomUUID()}-${sanitizeAvatarName(`avatar.${ext}`)}`
  const buf = Buffer.from(await file.arrayBuffer())

  const { error: upErr } = await supabase.storage
    .from("avatars")
    .upload(path, buf, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    })

  if (upErr) return { error: upErr.message }

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path)

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", user.id)

  if (error) return { error: error.message }

  revalidatePath("/dashboard-client/settings")
  revalidatePath("/dashboard-lawyer/settings")
  revalidatePath("/dashboard-lawyer/profile")
  revalidatePath("/dashboard-client")
  return { success: true as const, avatarUrl: publicUrl }
}
