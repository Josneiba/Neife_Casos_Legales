"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { sendTransactionalEmail } from "@/lib/email"

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

  const { data: peeps } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .in("id", [user.id, data.lawyer_id])
  const lawyer = peeps?.find((p) => p.id === data.lawyer_id)
  const client = peeps?.find((p) => p.id === user.id)
  if (lawyer?.email) {
    await sendTransactionalEmail({
      to: lawyer.email,
      subject: `Neife — Nuevo caso: ${data.title}`,
      html: `<p>Hola ${lawyer.full_name ?? ""},</p><p><strong>${client?.full_name ?? "Un cliente"}</strong> te ha enviado una solicitud de caso.</p><p><strong>Título:</strong> ${data.title}</p><p>Revisa tu panel en Neife.</p>`,
    })
  }

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

  const { data: caseRow } = await supabase
    .from("cases")
    .select("title")
    .eq("id", request.case_id)
    .single()
  const { data: clientProf } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", request.client_id)
    .single()
  if (clientProf?.email) {
    await sendTransactionalEmail({
      to: clientProf.email,
      subject: `Neife — Tu caso fue aceptado`,
      html: `<p>Hola ${clientProf.full_name ?? ""},</p><p>Tu solicitud para el caso <strong>${caseRow?.title ?? ""}</strong> fue <strong>aceptada</strong> por tu abogado.</p>`,
    })
  }

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

  const { data: reqRow } = await supabase
    .from("case_requests")
    .select("case_id, client_id, cases(title)")
    .eq("id", requestId)
    .single()

  await supabase
    .from("case_requests")
    .update({ status: "rejected", responded_at: new Date().toISOString() })
    .eq("id", requestId)

  if (reqRow?.case_id) {
    await supabase
      .from("cases")
      .update({ status: "rejected" })
      .eq("id", reqRow.case_id)
  }

  const clientId = reqRow?.client_id as string | undefined
  const caseTitle = (reqRow?.cases as { title?: string } | null)?.title
  if (clientId) {
    const { data: clientProf } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", clientId)
      .single()
    if (clientProf?.email) {
      await sendTransactionalEmail({
        to: clientProf.email,
        subject: `Neife — Actualización de tu solicitud`,
        html: `<p>Hola ${clientProf.full_name ?? ""},</p><p>Tu solicitud para el caso <strong>${caseTitle ?? ""}</strong> no fue aceptada en esta ocasión.</p>`,
      })
    }
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

  const { data: cRow } = await supabase
    .from("cases")
    .select("client_id, title")
    .eq("id", caseId)
    .single()
  if (cRow?.client_id) {
    const { data: clientProf } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", cRow.client_id)
      .single()
    if (clientProf?.email) {
      await sendTransactionalEmail({
        to: clientProf.email,
        subject: `Neife — Estado del caso actualizado`,
        html: `<p>Hola ${clientProf.full_name ?? ""},</p><p>El estado de tu caso <strong>${cRow.title ?? ""}</strong> cambió a <strong>${status}</strong>.</p>`,
      })
    }
  }

  revalidatePath("/dashboard-lawyer/cases")
  revalidatePath("/dashboard-client/cases")
  return { success: true as const }
}
