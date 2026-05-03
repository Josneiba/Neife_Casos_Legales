"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createCase(data: {
  title: string
  type: string
  description: string
  budget: number
  lawyer_id: string
  message: string
}) {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  const { data: newCase, error: caseError } = await supabase
    .from("cases")
    .insert({
      title: data.title,
      type: data.type,
      description: data.description,
      budget: data.budget,
      client_id: user.id,
      lawyer_id: data.lawyer_id,
      status: "waiting",
    })
    .select()
    .single()

  if (caseError) return { error: caseError.message }
  if (!newCase) return { error: "No se pudo crear el caso" }

  await supabase.from("case_requests").insert({
    case_id: newCase.id,
    client_id: user.id,
    lawyer_id: data.lawyer_id,
    message: data.message,
    status: "pending",
  })

  await supabase.from("case_activities").insert({
    case_id: newCase.id,
    type: "case_created",
    title: "Caso creado",
    description: "Solicitud enviada al abogado",
    created_by: user.id,
  })

  revalidatePath("/dashboard-client/cases")
  return { success: true as const, caseId: newCase.id }
}

export async function acceptCaseRequest(requestId: string) {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  const { data: request } = await supabase
    .from("case_requests")
    .select("case_id, client_id")
    .eq("id", requestId)
    .single()

  if (!request) return { error: "Solicitud no encontrada" }

  await supabase
    .from("case_requests")
    .update({ status: "accepted", responded_at: new Date().toISOString() })
    .eq("id", requestId)

  await supabase
    .from("cases")
    .update({ status: "active", lawyer_id: user.id })
    .eq("id", request.case_id)

  await supabase.from("case_activities").insert({
    case_id: request.case_id,
    type: "status_change",
    title: "Caso aceptado",
    description: "El abogado aceptó el caso",
    created_by: user.id,
  })

  await supabase.from("conversations").upsert(
    {
      client_id: request.client_id,
      lawyer_id: user.id,
      case_id: request.case_id,
    },
    { onConflict: "client_id,lawyer_id" }
  )

  revalidatePath("/dashboard-lawyer/cases")
  revalidatePath("/dashboard-client/cases")
  return { success: true as const }
}

export async function rejectCaseRequest(requestId: string) {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  const { data: request } = await supabase
    .from("case_requests")
    .select("case_id")
    .eq("id", requestId)
    .single()

  await supabase
    .from("case_requests")
    .update({ status: "rejected", responded_at: new Date().toISOString() })
    .eq("id", requestId)

  if (request?.case_id) {
    await supabase
      .from("cases")
      .update({ status: "rejected" })
      .eq("id", request.case_id)
  }

  revalidatePath("/dashboard-lawyer/cases")
  return { success: true as const }
}

export async function updateCaseStatus(caseId: string, status: string) {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  await supabase
    .from("cases")
    .update({
      status,
      ...(status === "completed" ? { progress: 100 } : {}),
    })
    .eq("id", caseId)
    .eq("lawyer_id", user.id)

  await supabase.from("case_activities").insert({
    case_id: caseId,
    type: "status_change",
    title: "Estado actualizado",
    description: `Estado cambiado a ${status}`,
    created_by: user.id,
  })

  revalidatePath("/dashboard-lawyer/cases")
  revalidatePath("/dashboard-client/cases")
  return { success: true as const }
}
