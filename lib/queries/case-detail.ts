import { createClient } from "@/lib/supabase/client"

export async function getCaseDocuments(caseId: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from("documents")
    .select("*")
    .eq("case_id", caseId)
    .order("created_at", { ascending: false })
  return data ?? []
}

export async function getCaseActivities(caseId: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from("case_activities")
    .select("*")
    .eq("case_id", caseId)
    .order("created_at", { ascending: false })
  return data ?? []
}

export async function getNextStepsForCase(caseId: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from("next_steps")
    .select("*")
    .eq("case_id", caseId)
    .order("created_at", { ascending: true })
  return data ?? []
}

/** Actividades recientes en todos los casos del cliente (home). */
export async function getRecentActivitiesForClient(clientId: string, limit = 8) {
  const supabase = createClient()
  const { data: caseRows } = await supabase
    .from("cases")
    .select("id")
    .eq("client_id", clientId)
  const ids = (caseRows ?? []).map((r) => r.id as string)
  if (ids.length === 0) return []

  const { data } = await supabase
    .from("case_activities")
    .select("id, case_id, type, title, description, created_at")
    .in("case_id", ids)
    .order("created_at", { ascending: false })
    .limit(limit)

  return data ?? []
}

export async function getCaseNote(caseId: string, lawyerId: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from("case_notes")
    .select("id, content, updated_at")
    .eq("case_id", caseId)
    .eq("lawyer_id", lawyerId)
    .maybeSingle()
  return data
}
