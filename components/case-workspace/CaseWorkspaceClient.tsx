"use client"

import Link from "next/link"
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  uploadWorkspaceDocument,
  uploadWorkspaceDocumentSignature,
  archiveWorkspaceDocument,
  downloadWorkspaceDocument,
} from "@/lib/actions/case-workspace"
import {
  ArrowLeft,
  FileText,
  Upload,
  Download,
  Plus,
  ShieldCheck,
  Archive,
  Clock,
} from "lucide-react"

type CaseDocumentVersion = {
  id: string
  file_name: string
  file_type: string | null
  storage_path: string
  signed_storage_path: string | null
  uploaded_by_role: string | null
  version_number: number
  signed_at: string | null
  created_at: string | null
}

type CaseDocumentRecord = {
  id: string
  title: string
  description: string | null
  archived: boolean
  created_at: string | null
  versions: CaseDocumentVersion[]
}

function formatDate(value: string | null) {
  if (!value) return "—"
  return new Date(value).toLocaleString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function CaseWorkspaceClient({
  caseId,
  basePath,
}: {
  caseId: string
  basePath: string
}) {
  const [caseTitle, setCaseTitle] = useState<string>("")
  const [caseType, setCaseType] = useState<string>("")
  const [documents, setDocuments] = useState<CaseDocumentRecord[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [busyDocumentId, setBusyDocumentId] = useState<string | null>(null)
  const [signingVersionId, setSigningVersionId] = useState<string | null>(null)
  const [archiveLoading, setArchiveLoading] = useState<string | null>(null)

  const newFileInputRef = useRef<HTMLInputElement | null>(null)
  const versionInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const signInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  useEffect(() => {
    loadWorkspace()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId])

  async function loadWorkspace() {
    setLoading(true)
    setError(null)
    const supabase = createClient()

    const { data: caseData, error: caseError } = await supabase
      .from("cases")
      .select("title, type")
      .eq("id", caseId)
      .single()

    if (caseError || !caseData) {
      setError("No se encontró el caso o no tienes acceso.")
      setLoading(false)
      return
    }

    const { data: docs, error: docsError } = await supabase
      .from("case_documents")
      .select(
        `*, versions:case_document_versions(*)`
      )
      .eq("case_id", caseId)
      .order("created_at", { ascending: false })

    if (docsError) {
      setError("No fue posible cargar el workspace.")
      setLoading(false)
      return
    }

    setCaseTitle(caseData.title ?? "")
    setCaseType(caseData.type ?? "")
    setDocuments(
      (docs ?? []).map((doc: any) => ({
        ...doc,
        versions: (doc.versions ?? []).sort(
          (a: CaseDocumentVersion, b: CaseDocumentVersion) => b.version_number - a.version_number
        ),
      }))
    )
    setLoading(false)
  }

  async function handleNewDocumentSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    form.append("case_id", caseId)
    setUploading(true)
    setError(null)

    const result = await uploadWorkspaceDocument(form)
    if ("error" in result) {
      setError(result.error ?? "Error desconocido")
    } else {
      event.currentTarget.reset()
      await loadWorkspace()
    }

    setUploading(false)
  }

  async function handleUploadVersion(docId: string, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setBusyDocumentId(docId)
    setError(null)

    const form = new FormData()
    form.append("case_id", caseId)
    form.append("case_document_id", docId)
    form.append("file", file)

    const result = await uploadWorkspaceDocument(form)
    if ("error" in result) {
      setError(result.error ?? "Error desconocido")
    } else {
      await loadWorkspace()
    }

    setBusyDocumentId(null)
    event.target.value = ""
  }

  async function handleSignVersion(versionId: string, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setSigningVersionId(versionId)
    setError(null)

    const form = new FormData()
    form.append("version_id", versionId)
    form.append("file", file)

    const result = await uploadWorkspaceDocumentSignature(form)
    if ("error" in result) {
      setError(result.error ?? "Error desconocido")
    } else {
      await loadWorkspace()
    }

    setSigningVersionId(null)
    event.target.value = ""
  }

  async function handleArchive(documentId: string) {
    setArchiveLoading(documentId)
    setError(null)

    const result = await archiveWorkspaceDocument(documentId)
    if ("error" in result) {
      setError(result.error ?? "Error desconocido")
    } else {
      await loadWorkspace()
    }

    setArchiveLoading(null)
  }

  async function handleDownload(storagePath: string) {
    setError(null)
    const result = await downloadWorkspaceDocument(storagePath)
    if ("error" in result) {
      setError(result.error ?? "Error desconocido")
      return
    }

    const anchor = document.createElement("a")
    anchor.href = result.dataUrl
    anchor.download = result.fileName
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link href={basePath} className="inline-flex items-center gap-2 text-sm text-[#5E8B8C] hover:underline">
            <ArrowLeft size={16} /> Volver al listado de casos
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-[#2D3C3C]">Workspace del caso</h1>
          <p className="text-sm text-[#75524C] mt-2">
            {caseTitle} · {caseType}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <section className="space-y-4 bg-white border border-[#D5C3B6]/30 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <FileText size={20} className="text-[#5E8B8C]" />
            <div>
              <h2 className="text-lg font-semibold text-[#2D3C3C]">Agregar documento</h2>
              <p className="text-sm text-[#75524C]">
                Sube versiones y firma archivos desde el espacio colaborativo del caso.
              </p>
            </div>
          </div>

          <form onSubmit={handleNewDocumentSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#2D3C3C] mb-2">Título del documento</label>
              <input
                name="title"
                type="text"
                className="w-full rounded-xl border border-[#D5C3B6] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5E8B8C]"
                placeholder="Ej: Contrato de prestación de servicios"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2D3C3C] mb-2">Descripción (opcional)</label>
              <textarea
                name="description"
                className="w-full rounded-xl border border-[#D5C3B6] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5E8B8C]"
                rows={3}
                placeholder="Información adicional acerca del documento"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2D3C3C] mb-2">Archivo</label>
              <input
                ref={newFileInputRef}
                name="file"
                type="file"
                className="w-full rounded-xl border border-[#D5C3B6] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5E8B8C]"
              />
              <p className="mt-2 text-xs text-[#75524C]">
                Tipos permitidos: PDF, imágenes, Word, texto. Máximo 25 MB.
              </p>
            </div>
            <button
              type="submit"
              disabled={uploading}
              className="inline-flex items-center gap-2 rounded-full bg-[#5E8B8C] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#436f70] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {uploading ? "Subiendo…" : <><Upload size={16} /> Subir a workspace</>}
            </button>
            {error && <p className="text-sm text-[#C27F79]">{error}</p>}
          </form>
        </section>

        <section className="space-y-4 bg-white border border-[#D5C3B6]/30 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-[#2D3C3C]">Resumen del workspace</h2>
          <div className="rounded-3xl border border-[#D5C3B6]/30 bg-[#F8F7F4] p-5">
            <div className="flex items-center justify-between gap-3 text-sm text-[#75524C]">
              <span>Documentos activos</span>
              <strong className="text-[#2D3C3C]">{documents.filter((doc) => !doc.archived).length}</strong>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 text-sm text-[#75524C]">
              <span>Versiones registradas</span>
              <strong className="text-[#2D3C3C]">{documents.reduce((count, doc) => count + (doc.versions?.length ?? 0), 0)}</strong>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 text-sm text-[#75524C]">
              <span>Documentos archivados</span>
              <strong className="text-[#2D3C3C]">{documents.filter((doc) => doc.archived).length}</strong>
            </div>
          </div>
        </section>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-[#2D3C3C]">Documentos del workspace</h2>
            <p className="text-sm text-[#75524C]">Revisa versiones, descargas y firmas digitales.</p>
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-[#D5C3B6]/30 bg-white p-8 text-center text-sm text-[#75524C]">Cargando workspace…</div>
        ) : documents.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#D5C3B6] bg-white p-8 text-center text-sm text-[#75524C]">
            No hay documentos en el workspace aún.
          </div>
        ) : (
          <div className="space-y-4">
            {documents.map((doc) => {
              const latestVersion = doc.versions?.[0]
              return (
                <div key={doc.id} className="rounded-3xl border border-[#D5C3B6]/30 bg-white p-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-sm text-[#75524C]">
                        <span className="rounded-full bg-[#F8F7F4] px-3 py-1">Workspace</span>
                        {doc.archived && <span className="rounded-full bg-[#C27F79]/10 text-[#C27F79] px-3 py-1">Archivado</span>}
                      </div>
                      <h3 className="mt-3 text-lg font-semibold text-[#2D3C3C]">{doc.title}</h3>
                      {doc.description && <p className="mt-2 text-sm text-[#75524C]">{doc.description}</p>}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => latestVersion && handleDownload(latestVersion.storage_path)}
                        disabled={!latestVersion}
                        className="inline-flex items-center gap-2 rounded-full border border-[#D5C3B6] px-4 py-2 text-sm text-[#5E8B8C] hover:bg-[#F8F7F4] disabled:opacity-50"
                      >
                        <Download size={14} /> Descargar última versión
                      </button>
                      {latestVersion?.signed_storage_path && (
                        <button
                          type="button"
                          onClick={() => handleDownload(latestVersion.signed_storage_path ?? "")}
                          className="inline-flex items-center gap-2 rounded-full border border-[#D5C3B6] px-4 py-2 text-sm text-[#2D3C3C] hover:bg-[#F8F7F4]"
                        >
                          <ShieldCheck size={14} /> Descargar firmado
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => versionInputRefs.current[doc.id]?.click()}
                        className="inline-flex items-center gap-2 rounded-full border border-[#D5C3B6] px-4 py-2 text-sm text-[#5E8B8C] hover:bg-[#F8F7F4]"
                      >
                        <Plus size={14} /> Subir nueva versión
                      </button>
                      {!doc.archived && (
                        <button
                          type="button"
                          onClick={() => handleArchive(doc.id)}
                          disabled={archiveLoading === doc.id}
                          className="inline-flex items-center gap-2 rounded-full border border-[#D5C3B6] px-4 py-2 text-sm text-[#C27F79] hover:bg-[#F8F7F4] disabled:opacity-50"
                        >
                          <Archive size={14} /> {archiveLoading === doc.id ? "Archivando…" : "Archivar"}
                        </button>
                      )}
                    </div>
                  </div>

                  <input
                    type="file"
                    hidden
                    ref={(element) => {
                      versionInputRefs.current[doc.id] = element
                    }}
                    onChange={(event) => handleUploadVersion(doc.id, event)}
                  />

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-3xl border border-[#D5C3B6]/30 bg-[#F8F7F4] p-4">
                      <p className="text-sm text-[#75524C]">Última versión</p>
                      <p className="mt-2 text-lg font-semibold text-[#2D3C3C]">#{latestVersion?.version_number ?? "—"}</p>
                      <p className="mt-1 text-sm text-[#75524C]">{formatDate(latestVersion?.created_at ?? null)}</p>
                    </div>
                    <div className="rounded-3xl border border-[#D5C3B6]/30 bg-[#F8F7F4] p-4">
                      <p className="text-sm text-[#75524C]">Firmado</p>
                      <p className="mt-2 text-lg font-semibold text-[#2D3C3C]">
                        {latestVersion?.signed_at ? "Sí" : "No"}
                      </p>
                      <button
                        type="button"
                        onClick={() => latestVersion && signInputRefs.current[latestVersion.id]?.click()}
                        disabled={!latestVersion || !!latestVersion?.signed_at}
                        className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#5E8B8C] px-4 py-2 text-sm font-semibold text-white hover:bg-[#436f70] disabled:opacity-50"
                      >
                        <ShieldCheck size={14} /> Firmar versión
                      </button>
                    </div>
                  </div>

                  <input
                    type="file"
                    hidden
                    ref={(element) => {
                      if (latestVersion) signInputRefs.current[latestVersion.id] = element
                    }}
                    onChange={(event) => latestVersion && handleSignVersion(latestVersion.id, event)}
                  />

                  <div className="mt-6 space-y-3">
                    {doc.versions.map((version) => (
                      <div key={version.id} className="rounded-3xl border border-[#D5C3B6]/30 p-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm text-[#75524C]">Versión #{version.version_number}</p>
                            <p className="text-sm text-[#2D3C3C] font-semibold">{formatDate(version.created_at)}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-[#75524C]">
                            <span className="rounded-full bg-[#F8F7F4] px-3 py-1">{version.uploaded_by_role || "–"}</span>
                            {version.signed_at && (
                              <span className="rounded-full bg-[#5E8B8C]/10 text-[#5E8B8C] px-3 py-1">Firmado</span>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleDownload(version.storage_path)}
                            className="inline-flex items-center gap-2 rounded-full border border-[#D5C3B6] px-4 py-2 text-sm text-[#5E8B8C] hover:bg-[#F8F7F4]"
                          >
                            <Download size={14} /> Descargar original
                          </button>
                          {version.signed_storage_path && (
                            <button
                              type="button"
                              onClick={() => handleDownload(version.signed_storage_path ?? "")}
                              className="inline-flex items-center gap-2 rounded-full border border-[#D5C3B6] px-4 py-2 text-sm text-[#2D3C3C] hover:bg-[#F8F7F4]"
                            >
                              <ShieldCheck size={14} /> Descargar firmado
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
