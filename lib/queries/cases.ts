import { createClient } from "@/lib/supabase/client"

export async function getClientCases(clientId: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from("cases")
    .select(
      `
      *,
      lawyer:profiles!lawyer_id(
        full_name,
        avatar_url,
        lawyer_profiles(specialties, hourly_rate)
      )
    `
    )
    .eq("client_id", clientId)
    .order("updated_at", { ascending: false })

  return data ?? []
}

export async function getLawyerCases(lawyerId: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from("cases")
    .select(
      `
      *,
      client:profiles!client_id(full_name, city, avatar_url)
    `
    )
    .eq("lawyer_id", lawyerId)
    .order("updated_at", { ascending: false })

  return data ?? []
}

export async function getIncomingRequests(lawyerId: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from("case_requests")
    .select(
      `
      *,
      case:cases(*),
      client:profiles!client_id(full_name, city)
    `
    )
    .eq("lawyer_id", lawyerId)
    .order("created_at", { ascending: false })

  return data ?? []
}
