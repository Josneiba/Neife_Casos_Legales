"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function sendMessage(data: {
  conversation_id: string
  text: string
  sender_role: "client" | "lawyer"
}) {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  const { error } = await supabase.from("messages").insert({
    conversation_id: data.conversation_id,
    sender_id: user.id,
    sender_role: data.sender_role,
    text: data.text,
  })

  await supabase
    .from("conversations")
    .update({
      last_message: data.text,
      last_message_at: new Date().toISOString(),
    })
    .eq("id", data.conversation_id)

  revalidatePath("/dashboard-client/messages")
  revalidatePath("/dashboard-lawyer/messages")
  return { success: !error }
}

export async function sendInitialMessage(data: {
  lawyer_id: string
  text: string
}) {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  const { data: conv, error: convError } = await supabase
    .from("conversations")
    .upsert(
      { client_id: user.id, lawyer_id: data.lawyer_id },
      { onConflict: "client_id,lawyer_id" }
    )
    .select()
    .single()

  if (convError || !conv) return { error: "Error al crear conversación" }

  await sendMessage({
    conversation_id: conv.id,
    text: data.text,
    sender_role: "client",
  })

  return { success: true as const, conversationId: conv.id }
}
