import type { RealtimeChannel } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import type { Message } from "@/lib/supabase/types"

export async function getConversations(
  userId: string,
  role: "client" | "lawyer"
) {
  const supabase = createClient()
  const field = role === "client" ? "client_id" : "lawyer_id"

  const select =
    role === "client"
      ? `
      *,
      lawyer:profiles!lawyer_id(
        full_name,
        avatar_url,
        lawyer_profiles(specialties)
      )
    `
      : `
      *,
      client:profiles!client_id(full_name, avatar_url)
    `

  const { data } = await supabase
    .from("conversations")
    .select(select)
    .eq(field, userId)
    .order("last_message_at", { ascending: false })

  return data ?? []
}

export async function getMessages(conversationId: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })

  return (data ?? []) as Message[]
}

export function subscribeToMessages(
  conversationId: string,
  onMessage: (message: Message) => void
): RealtimeChannel {
  const supabase = createClient()
  return supabase
    .channel(`messages:${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => onMessage(payload.new as Message)
    )
    .subscribe()
}
