"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { encryptBuffer, decryptBuffer } from "@/lib/encryption"

function sanitizeFileName(name: string) {
  return name.replace(/[^\w.\-()+ ]/g, "_").slice(0, 180) || "file"
}

export async function uploadCaseDocument(formData: FormData) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" as const }

  const caseId = formData.get("case_id") as string | null
  const file = formData.get("file") as File | null
  if (!caseId || !file || file.size === 0) {
    return { error: "Archivo o caso inválido" as const }
  }

  // Validar tipo de archivo permitido
  const ALLOWED_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ]
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: "Tipo de archivo no permitido. Solo PDF, imágenes y documentos Word." as const }
  }

  // Validar tamaño máximo: 25 MB
  const MAX_SIZE = 25 * 1024 * 1024
  if (file.size > MAX_SIZE) {
    return { error: "El archivo no puede superar 25 MB." as const }
  }

  const { data: caseRow, error: caseErr } = await supabase
    .from("cases")
    .select("client_id, lawyer_id")
    .eq("id", caseId)
    .single()

  if (caseErr || !caseRow) return { error: "Caso no encontrado" as const }
  const isClient = caseRow.client_id === user.id
  const isLawyer = caseRow.lawyer_id === user.id
  if (!isClient && !isLawyer) return { error: "Sin permiso" as const }

  const uploadedByRole = isClient ? "client" : "lawyer"

  // Encriptar el archivo antes de subir a Storage
  const plainBuffer = Buffer.from(await file.arrayBuffer())
  let uploadBuffer: Buffer
  try {
    uploadBuffer = encryptBuffer(plainBuffer)
  } catch (err) {
    console.error("Error de encriptación:", err)
    return { error: "Error al procesar el archivo. Contacte soporte." as const }
  }

  // Nombre de archivo: UUID para evitar enumeración de nombres
  const safeExtension = file.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "") ?? "bin"
  const path = `${caseId}/${crypto.randomUUID()}.enc.${safeExtension}`

  const { error: upErr } = await supabase.storage
    .from("documents")
    .upload(path, uploadBuffer, {
      contentType: "application/octet-stream", // siempre binario opaco
      upsert: false,
    })

  if (upErr) return { error: upErr.message }

  const { error: docErr } = await supabase.from("documents").insert({
    case_id: caseId,
    name: file.name,           // nombre original para mostrar en UI
    file_type: file.type,
    file_url: path,
    file_size: String(file.size),
    uploaded_by: user.id,
    uploaded_by_role: uploadedByRole,
    encrypted: true,           // flag para saber que hay que desencriptar al descargar
  })

  if (docErr) {
    await supabase.storage.from("documents").remove([path])
    return { error: docErr.message }
  }

  await supabase.from("case_activities").insert({
    case_id: caseId,
    type: "document_uploaded",
    title: "Documento subido",
    description: file.name,
    created_by: user.id,
  })

  revalidatePath("/dashboard-client/cases")
  revalidatePath("/dashboard-lawyer/cases")
  revalidatePath("/dashboard-client")
  return { success: true as const }
}

export async function getCaseDocumentSignedUrl(storagePath: string) {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" as const }

  const caseId = storagePath.split("/")[0]
  if (!caseId) return { error: "Ruta inválida" as const }

  const { data: caseRow } = await supabase
    .from("cases")
    .select("client_id, lawyer_id")
    .eq("id", caseId)
    .single()

  if (
    !caseRow ||
    (caseRow.client_id !== user.id && caseRow.lawyer_id !== user.id)
  ) {
    return { error: "Sin permiso" as const }
  }

  const { data, error } = await supabase.storage
    .from("documents")
    .createSignedUrl(storagePath, 3600)

  if (error || !data?.signedUrl) return { error: error?.message ?? "URL no disponible" }
  return { url: data.signedUrl }
}

/**
 * Descarga el documento encriptado desde Storage, lo desencripta en el servidor
 * y retorna una URL de datos base64 temporal para el cliente.
 * Así la clave de encriptación NUNCA sale del servidor.
 */
export async function downloadDecryptedDocument(storagePath: string) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" as const }

  // Verificar que el usuario pertenece al caso
  const caseId = storagePath.split("/")[0]
  if (!caseId) return { error: "Ruta inválida" as const }

  const { data: caseRow } = await supabase
    .from("cases")
    .select("client_id, lawyer_id")
    .eq("id", caseId)
    .single()

  if (!caseRow || (caseRow.client_id !== user.id && caseRow.lawyer_id !== user.id)) {
    return { error: "Sin permiso" as const }
  }

  // Obtener metadatos del documento para saber si está encriptado
  const { data: docRow } = await supabase
    .from("documents")
    .select("name, file_type, encrypted")
    .eq("file_url", storagePath)
    .single()

  // Descargar el archivo desde Storage
  const { data: fileData, error: dlError } = await supabase.storage
    .from("documents")
    .download(storagePath)

  if (dlError || !fileData) return { error: "Error al descargar archivo" as const }

  const rawBuffer = Buffer.from(await fileData.arrayBuffer())

  // Desencriptar si corresponde
  let finalBuffer: Buffer
  if (docRow?.encrypted) {
    try {
      finalBuffer = decryptBuffer(rawBuffer)
    } catch (err) {
      console.error("Error de desencriptación:", err)
      return { error: "Error al descifrar el archivo. Contacte soporte." as const }
    }
  } else {
    finalBuffer = rawBuffer
  }

  // Retornar como base64 con el tipo MIME correcto
  const base64 = finalBuffer.toString("base64")
  const mimeType = docRow?.file_type ?? "application/octet-stream"
  const fileName = docRow?.name ?? storagePath.split("/").pop() ?? "documento"

  return {
    dataUrl: `data:${mimeType};base64,${base64}`,
    fileName,
    mimeType,
  }
}

export async function updateNextStepCompleted(stepId: string, completed: boolean) {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" as const }

  const { data: step } = await supabase
    .from("next_steps")
    .select("case_id")
    .eq("id", stepId)
    .single()

  if (!step?.case_id) return { error: "Paso no encontrado" as const }

  const { data: caseRow } = await supabase
    .from("cases")
    .select("client_id, lawyer_id")
    .eq("id", step.case_id)
    .single()

  if (
    !caseRow ||
    (caseRow.client_id !== user.id && caseRow.lawyer_id !== user.id)
  ) {
    return { error: "Sin permiso" as const }
  }

  const { error } = await supabase
    .from("next_steps")
    .update({ completed })
    .eq("id", stepId)

  if (error) return { error: error.message }

  await supabase.from("case_activities").insert({
    case_id: step.case_id,
    type: "next_step_updated",
    title: completed ? "Paso completado" : "Paso reabierto",
    description: `Próximo paso actualizado`,
    created_by: user.id,
  })

  revalidatePath("/dashboard-client/cases")
  revalidatePath("/dashboard-lawyer/cases")
  return { success: true as const }
}

export async function addNextStepForCase(data: {
  case_id: string
  text: string
  assigned_to: "client" | "lawyer"
  due_date?: string | null
}) {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" as const }

  const { data: caseRow } = await supabase
    .from("cases")
    .select("lawyer_id")
    .eq("id", data.case_id)
    .single()

  if (!caseRow || caseRow.lawyer_id !== user.id) {
    return { error: "Solo el abogado del caso puede agregar pasos" as const }
  }

  const { error } = await supabase.from("next_steps").insert({
    case_id: data.case_id,
    text: data.text,
    assigned_to: data.assigned_to,
    due_date: data.due_date || null,
  })

  if (error) return { error: error.message }

  await supabase.from("case_activities").insert({
    case_id: data.case_id,
    type: "next_step_added",
    title: "Nuevo próximo paso",
    description: data.text,
    created_by: user.id,
  })

  revalidatePath("/dashboard-client/cases")
  revalidatePath("/dashboard-lawyer/cases")
  return { success: true as const }
}

export async function saveCaseNote(caseId: string, content: string) {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" as const }

  const { data: caseRow } = await supabase
    .from("cases")
    .select("lawyer_id")
    .eq("id", caseId)
    .single()

  if (!caseRow || caseRow.lawyer_id !== user.id) {
    return { error: "Solo el abogado puede guardar notas" as const }
  }

  const { data: existing } = await supabase
    .from("case_notes")
    .select("id")
    .eq("case_id", caseId)
    .eq("lawyer_id", user.id)
    .maybeSingle()

  const now = new Date().toISOString()
  if (existing?.id) {
    await supabase
      .from("case_notes")
      .update({ content, updated_at: now })
      .eq("id", existing.id)
  } else {
    await supabase.from("case_notes").insert({
      case_id: caseId,
      lawyer_id: user.id,
      content,
      updated_at: now,
    })
  }

  revalidatePath("/dashboard-lawyer/cases")
  return { success: true as const }
}
