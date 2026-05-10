"use server"

import { revalidatePath } from "next/cache"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { encryptBuffer, decryptBuffer } from "@/lib/encryption"
import { sendTransactionalEmail } from "@/lib/email"

function sanitizeFileName(name: string) {
  return name.replace(/[^\w.\-()+ ]/g, "_").slice(0, 180) || "file"
}

async function getCaseAndRole(supabase: ReturnType<typeof createServerSupabaseClient>, caseId: string) {
  const { data, error } = await supabase
    .from("cases")
    .select("client_id, lawyer_id")
    .eq("id", caseId)
    .single()

  if (error || !data) return { error: error?.message ?? "Caso no encontrado", caseRow: null }
  return { caseRow: data, error: null }
}

async function sendWorkspaceNotification(supabase: ReturnType<typeof createServerSupabaseClient>, caseId: string, actorId: string, actorRole: string, subject: string, message: string) {
  const { data: caseRow } = await supabase
    .from("cases")
    .select("client_id, lawyer_id")
    .eq("id", caseId)
    .single()

  if (!caseRow) return

  const recipientId = caseRow.client_id === actorId ? caseRow.lawyer_id : caseRow.client_id
  if (!recipientId) return

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", recipientId)
    .single()

  const recipientEmail = profile?.email
  if (!recipientEmail) return

  await sendTransactionalEmail({
    to: recipientEmail,
    subject,
    html: `<p>Hola ${profile.full_name ?? ""},</p><p>${message}</p><p>Ingresa a tu workspace para revisar el documento.</p>`,
  })
}

export async function uploadWorkspaceDocument(formData: FormData) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" as const }

  const caseId = formData.get("case_id") as string | null
  const file = formData.get("file") as File | null
  const titleInput = String(formData.get("title") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim() || null
  const caseDocumentId = formData.get("case_document_id") as string | null

  if (!caseId || !file || file.size === 0) {
    return { error: "Caso o archivo inválido" as const }
  }

  const { caseRow, error: caseError } = await getCaseAndRole(supabase, caseId)
  if (caseError || !caseRow) return { error: caseError ?? "Caso no encontrado" as const }

  const isClient = caseRow.client_id === user.id
  const isLawyer = caseRow.lawyer_id === user.id
  if (!isClient && !isLawyer) return { error: "Sin permiso" as const }

  const uploadedByRole = isClient ? "client" : "lawyer"
  let docId = caseDocumentId
  let documentTitle = titleInput || file.name

  if (!docId) {
    const { data: newDoc, error } = await supabase
      .from("case_documents")
      .insert({
        case_id: caseId,
        title: documentTitle,
        description,
      })
      .select("id")
      .single()

    if (error || !newDoc) {
      return { error: error?.message ?? "No se pudo crear el documento" as const }
    }

    docId = newDoc.id
  }

  const { data: versionRows, error: versionError } = await supabase
    .from("case_document_versions")
    .select("version_number")
    .eq("case_document_id", docId)

  if (versionError) {
    return { error: versionError.message }
  }

  const versionNumber = (versionRows?.length ?? 0) + 1
  const safeExtension = file.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "") ?? "bin"
  const storagePath = `${caseId}/${docId}/${crypto.randomUUID()}.enc.${safeExtension}`

  const plainBuffer = Buffer.from(await file.arrayBuffer())
  let uploadBuffer: Buffer
  try {
    uploadBuffer = encryptBuffer(plainBuffer)
  } catch (err) {
    console.error("Error al encriptar el documento de workspace:", err)
    return { error: "Error al procesar el archivo" as const }
  }

  const { error: storageError } = await supabase.storage
    .from("documents")
    .upload(storagePath, uploadBuffer, {
      contentType: "application/octet-stream",
      upsert: false,
    })

  if (storageError) {
    return { error: storageError.message }
  }

  const { error: insertError } = await supabase.from("case_document_versions").insert({
    case_document_id: docId,
    file_name: sanitizeFileName(file.name),
    file_type: file.type || "application/octet-stream",
    file_size: String(file.size),
    storage_path: storagePath,
    version_number: versionNumber,
    uploaded_by: user.id,
    uploaded_by_role: uploadedByRole,
    encrypted: true,
  })

  if (insertError) {
    await supabase.storage.from("documents").remove([storagePath])
    return { error: insertError.message }
  }

  await supabase.from("case_activities").insert({
    case_id: caseId,
    type: "workspace_document_uploaded",
    title: "Documento de workspace subido",
    description: `${documentTitle} v${versionNumber}`,
    created_by: user.id,
  })

  await sendWorkspaceNotification(
    supabase,
    caseId,
    user.id,
    uploadedByRole,
    "Nuevo documento en el workspace",
    `Se agregó un archivo nuevo: <strong>${documentTitle}</strong> en el workspace del caso.`
  )

  revalidatePath(`/dashboard-client/cases/${caseId}/workspace`)
  revalidatePath(`/dashboard-lawyer/cases/${caseId}/workspace`)
  return { success: true as const }
}

export async function uploadWorkspaceDocumentSignature(formData: FormData) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" as const }

  const versionId = formData.get("version_id") as string | null
  const file = formData.get("file") as File | null

  if (!versionId || !file || file.size === 0) {
    return { error: "Versión o archivo inválido" as const }
  }

  const { data: versionRow, error: versionError } = await supabase
    .from("case_document_versions")
    .select("id, case_document_id, storage_path, signed_storage_path, signed_by, signed_by_role")
    .eq("id", versionId)
    .single()

  if (versionError || !versionRow) {
    return { error: "Versión no encontrada" as const }
  }

  const { data: documentRow, error: docError } = await supabase
    .from("case_documents")
    .select("case_id, title")
    .eq("id", versionRow.case_document_id)
    .single()

  if (docError || !documentRow) {
    return { error: "Documento no encontrado" as const }
  }

  const caseId = documentRow.case_id
  const { caseRow, error: caseError } = await getCaseAndRole(supabase, caseId)
  if (caseError || !caseRow) return { error: caseError ?? "Caso no encontrado" as const }

  const isClient = caseRow.client_id === user.id
  const isLawyer = caseRow.lawyer_id === user.id
  if (!isClient && !isLawyer) return { error: "Sin permiso" as const }

  const signedByRole = isClient ? "client" : "lawyer"
  const safeExtension = file.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "") ?? "bin"
  const signedPath = `${caseId}/${versionRow.case_document_id}/${crypto.randomUUID()}.signed.enc.${safeExtension}`

  const plainBuffer = Buffer.from(await file.arrayBuffer())
  let uploadBuffer: Buffer
  try {
    uploadBuffer = encryptBuffer(plainBuffer)
  } catch (err) {
    console.error("Error al encriptar la firma del documento:", err)
    return { error: "Error al procesar el archivo" as const }
  }

  const { error: storageError } = await supabase.storage
    .from("documents")
    .upload(signedPath, uploadBuffer, {
      contentType: "application/octet-stream",
      upsert: false,
    })

  if (storageError) {
    return { error: storageError.message }
  }

  const { error: updateError } = await supabase
    .from("case_document_versions")
    .update({
      signed_storage_path: signedPath,
      signed_by: user.id,
      signed_by_role: signedByRole,
      signed_at: new Date().toISOString(),
    })
    .eq("id", versionId)

  if (updateError) {
    await supabase.storage.from("documents").remove([signedPath])
    return { error: updateError.message }
  }

  await supabase.from("case_activities").insert({
    case_id: caseId,
    type: "workspace_document_signed",
    title: "Documento firmado",
    description: `Firma digital para ${documentRow.title}`,
    created_by: user.id,
  })

  await sendWorkspaceNotification(
    supabase,
    caseId,
    user.id,
    signedByRole,
    "Documento firmado en el workspace",
    `Se ha firmado digitalmente el documento <strong>${documentRow.title}</strong>.`
  )

  revalidatePath(`/dashboard-client/cases/${caseId}/workspace`)
  revalidatePath(`/dashboard-lawyer/cases/${caseId}/workspace`)
  return { success: true as const }
}

export async function archiveWorkspaceDocument(documentId: string) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" as const }

  const { data: documentRow, error: documentError } = await supabase
    .from("case_documents")
    .select("case_id, title")
    .eq("id", documentId)
    .single()

  if (documentError || !documentRow) {
    return { error: "Documento no encontrado" as const }
  }

  const { caseRow, error: caseError } = await getCaseAndRole(supabase, documentRow.case_id)
  if (caseError || !caseRow) return { error: caseError ?? "Caso no encontrado" as const }

  if (caseRow.client_id !== user.id && caseRow.lawyer_id !== user.id) {
    return { error: "Sin permiso" as const }
  }

  const { error } = await supabase
    .from("case_documents")
    .update({ archived: true })
    .eq("id", documentId)

  if (error) return { error: error.message }

  await supabase.from("case_activities").insert({
    case_id: documentRow.case_id,
    type: "workspace_document_archived",
    title: "Documento archivado",
    description: documentRow.title,
    created_by: user.id,
  })

  revalidatePath(`/dashboard-client/cases/${documentRow.case_id}/workspace`)
  revalidatePath(`/dashboard-lawyer/cases/${documentRow.case_id}/workspace`)
  return { success: true as const }
}

export async function downloadWorkspaceDocument(storagePath: string) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" as const }

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

  const { data: versionRow } = await supabase
    .from("case_document_versions")
    .select("file_name, file_type, encrypted")
    .or(`storage_path.eq.${storagePath},signed_storage_path.eq.${storagePath}`)
    .single()

  if (!versionRow) {
    return { error: "Archivo no encontrado" as const }
  }

  const { data: fileData, error: dlError } = await supabase.storage
    .from("documents")
    .download(storagePath)

  if (dlError || !fileData) return { error: "Error al descargar archivo" as const }

  const rawBuffer = Buffer.from(await fileData.arrayBuffer())
  let finalBuffer: Buffer
  if (versionRow.encrypted) {
    try {
      finalBuffer = decryptBuffer(rawBuffer)
    } catch (err) {
      console.error("Error al desencriptar workspace:", err)
      return { error: "Error al descifrar el archivo" as const }
    }
  } else {
    finalBuffer = rawBuffer
  }

  const base64 = finalBuffer.toString("base64")
  const mimeType = versionRow.file_type ?? "application/octet-stream"
  const fileName = versionRow.file_name ?? storagePath.split("/").pop() ?? "documento"

  return {
    dataUrl: `data:${mimeType};base64,${base64}`,
    fileName,
    mimeType,
  }
}
