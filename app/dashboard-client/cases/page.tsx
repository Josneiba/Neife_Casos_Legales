"use client"

import { useState, useEffect, useRef } from "react"
import {
  Plus,
  FileText,
  Clock,
  CheckCircle,
  Upload,
  Download,
  X,
  Loader2,
  AlertCircle,
  RefreshCw,
  MessageSquare,
  XCircle,
} from "lucide-react"
import Link from "next/link"
import { statusConfig, specialties } from "@/lib/data"
import { getClientCases } from "@/lib/queries/cases"
import {
  getCaseDocuments,
  getCaseActivities,
  getNextStepsForCase,
} from "@/lib/queries/case-detail"
import {
  uploadCaseDocument,
  getCaseDocumentSignedUrl,
  updateNextStepCompleted,
} from "@/lib/actions/case-detail"
import { createClient } from "@/lib/supabase/client"

type TabType = "active" | "waiting" | "pending" | "completed" | "all"
type DetailTab = "summary" | "documents" | "activity" | "steps"

type ClientCaseView = {
  id: string
  title: string
  type: string
  status: keyof typeof statusConfig
  progress: number
  description: string
  createdAt: string
  lastUpdate: string
  nextAction: string
  lawyer: { name: string; specialization: string }
}

function activityVisual(type: string) {
  const t = (type || "").toLowerCase()
  if (t.includes("document")) return { Icon: FileText, bg: "bg-[#75524C]" }
  if (t.includes("message")) return { Icon: MessageSquare, bg: "bg-[#C27F79]" }
  if (t.includes("status") || t.includes("step")) return { Icon: RefreshCw, bg: "bg-[#5E8B8C]" }
  return { Icon: Plus, bg: "bg-[#2D3C3C]" }
}

function normalizeClientCase(c: Record<string, unknown>): ClientCaseView {
  const lawyer = c.lawyer as
    | {
        full_name?: string | null
        lawyer_profiles?: { specialties?: string[] | null } | null
      }
    | null
    | undefined
  const lp = lawyer?.lawyer_profiles
  const st = (c.status as string) ?? "waiting"
  const statusKey = st in statusConfig ? (st as keyof typeof statusConfig) : "waiting"
  return {
    id: String(c.id),
    title: String(c.title ?? ""),
    type: String(c.type ?? ""),
    status: statusKey,
    progress: Number(c.progress ?? 0),
    description: String(c.description ?? ""),
    createdAt: c.created_at
      ? new Date(c.created_at as string).toLocaleDateString("es-CL")
      : "",
    lastUpdate: c.updated_at
      ? new Date(c.updated_at as string).toLocaleDateString("es-CL")
      : "",
    nextAction: String(c.next_action ?? ""),
    lawyer: {
      name: lawyer?.full_name ?? "—",
      specialization: lp?.specialties?.[0] ?? "",
    },
  }
}

export default function CasesPage() {
  const [loading, setLoading] = useState(true)
  const [cases, setCases] = useState<ClientCaseView[]>([])
  const [activeTab, setActiveTab] = useState<TabType>("all")
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null)
  const [detailTab, setDetailTab] = useState<DetailTab>("summary")
  const [showNewCaseModal, setShowNewCaseModal] = useState(false)
  const [newCaseLoading, setNewCaseLoading] = useState(false)

  const [detailDocs, setDetailDocs] = useState<Record<string, unknown>[]>([])
  const [detailActs, setDetailActs] = useState<Record<string, unknown>[]>([])
  const [detailSteps, setDetailSteps] = useState<Record<string, unknown>[]>([])
  const [detailLoading, setDetailLoading] = useState(false)
  const [docUploading, setDocUploading] = useState(false)
  const docInputRef = useRef<HTMLInputElement>(null)
  const [newCaseForm, setNewCaseForm] = useState({
    title: "",
    area: "",
    description: "",
    budget: 150,
  })

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        setLoading(false)
        return
      }
      getClientCases(user.id).then((data) => {
        const list = (data ?? []).map((row) =>
          normalizeClientCase(row as Record<string, unknown>)
        )
        setCases(list)
        if (list.length > 0) setSelectedCaseId(list[0].id)
        setLoading(false)
      })
    })
  }, [])

  useEffect(() => {
    if (!selectedCaseId) return
    setDetailLoading(true)
    Promise.all([
      getCaseDocuments(selectedCaseId),
      getCaseActivities(selectedCaseId),
      getNextStepsForCase(selectedCaseId),
    ]).then(([d, a, s]) => {
      setDetailDocs(d as Record<string, unknown>[])
      setDetailActs(a as Record<string, unknown>[])
      setDetailSteps(s as Record<string, unknown>[])
      setDetailLoading(false)
    })
  }, [selectedCaseId])

  const refreshCaseDetail = async (caseId: string) => {
    const [d, a, s] = await Promise.all([
      getCaseDocuments(caseId),
      getCaseActivities(caseId),
      getNextStepsForCase(caseId),
    ])
    setDetailDocs(d as Record<string, unknown>[])
    setDetailActs(a as Record<string, unknown>[])
    setDetailSteps(s as Record<string, unknown>[])
  }

  const filteredCases = cases.filter((c) => {
    if (activeTab === "all") return true
    return c.status === activeTab
  })

  const selectedCase = cases.find((c) => c.id === selectedCaseId)

  const waitingCount = cases.filter((c) => c.status === "waiting").length
  const tabs: { key: TabType; label: string; badge?: number }[] = [
    { key: "active", label: "Activos" },
    { key: "waiting", label: "En espera", badge: waitingCount },
    { key: "pending", label: "Pendientes" },
    { key: "completed", label: "Completados" },
    { key: "all", label: "Todos" },
  ]

  const detailTabs: { key: DetailTab; label: string }[] = [
    { key: "summary", label: "Resumen" },
    { key: "documents", label: "Documentos" },
    { key: "activity", label: "Actividad" },
    { key: "steps", label: "Próximos Pasos" },
  ]

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !newCaseForm.title || !newCaseForm.description) return
    setNewCaseLoading(true)
    await supabase.from("cases").insert({
      title: newCaseForm.title,
      type: newCaseForm.area,
      description: newCaseForm.description,
      budget: newCaseForm.budget,
      client_id: user.id,
      status: "pending",
    })
    const updated = await getClientCases(user.id)
    const list = (updated ?? []).map((row) =>
      normalizeClientCase(row as Record<string, unknown>)
    )
    setCases(list)
    if (list.length > 0) setSelectedCaseId(list[0].id)
    setNewCaseLoading(false)
    setShowNewCaseModal(false)
    setNewCaseForm({ title: "", area: "", description: "", budget: 150 })
  }

  if (loading) {
    return (
      <div className="flex gap-6 h-[calc(100vh-8rem)]">
        <div className="w-1/3 animate-pulse">
          <div className="h-10 bg-[#D5C3B6]/30 rounded mb-4"></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-[#D5C3B6]/30 rounded mb-2"></div>
          ))}
        </div>
        <div className="flex-1 bg-white border border-[#D5C3B6]/30 rounded-lg p-6 animate-pulse">
          <div className="h-8 bg-[#D5C3B6]/30 rounded w-1/2 mb-4"></div>
          <div className="h-40 bg-[#D5C3B6]/30 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#2D3C3C]">Mis Casos</h1>
        <button
          onClick={() => setShowNewCaseModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#5E8B8C] text-white rounded-lg hover:bg-[#5E8B8C]/90 transition-colors"
        >
          <Plus size={18} />
          Nuevo Caso
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#D5C3B6]/30 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === tab.key
                ? tab.key === "waiting" ? "bg-[#F2C94C] text-[#2D3C3C]" : "bg-[#5E8B8C] text-white"
                : "text-[#75524C] hover:bg-[#D5C3B6]/20"
            }`}
          >
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center ${
                tab.key === "waiting" && activeTab === "waiting" 
                  ? "bg-[#2D3C3C] text-white" 
                  : "bg-[#F2C94C] text-[#2D3C3C]"
              }`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Two-panel layout */}
      <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-14rem)]">
        {/* Cases list */}
        <div className="lg:w-1/3 overflow-y-auto space-y-2">
          {filteredCases.length === 0 ? (
            <div className="bg-white border border-[#D5C3B6]/30 rounded-lg p-8 text-center">
              <FileText className="mx-auto text-[#D5C3B6] mb-4" size={48} />
              <p className="text-[#75524C] mb-4">No tienes casos en esta categoría.</p>
              <button
                onClick={() => setShowNewCaseModal(true)}
                className="text-[#5E8B8C] hover:underline"
              >
                Crear nuevo caso
              </button>
            </div>
          ) : (
            filteredCases.map((caseItem) => {
              const status = statusConfig[caseItem.status]
              return (
                <button
                  key={caseItem.id}
                  onClick={() => setSelectedCaseId(caseItem.id)}
                  className={`w-full text-left p-4 bg-white border rounded-lg transition-colors ${
                    selectedCaseId === caseItem.id
                      ? "bg-[#5E8B8C]/10 border-l-2 border-[#5E8B8C]"
                      : "border-[#D5C3B6]/30 hover:bg-[#F8F7F4]"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-[#2D3C3C] text-sm">{caseItem.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${status.bg} ${status.text}`}>
                      {status.label}
                    </span>
                  </div>
                  <p className="text-xs text-[#75524C] mb-2">{caseItem.lawyer.name}</p>
                  <div className="flex items-center justify-between text-xs text-[#75524C]">
                    <span>{caseItem.lastUpdate}</span>
                    <span className="text-[#5E8B8C]">{caseItem.progress}%</span>
                  </div>
                </button>
              )
            })
          )}
        </div>

        {/* Case detail */}
        <div className="flex-1 bg-white border border-[#D5C3B6]/30 rounded-lg overflow-hidden">
          {!selectedCase ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <FileText className="text-[#D5C3B6] mb-4" size={64} />
              <p className="text-[#75524C]">Selecciona un caso para ver sus detalles</p>
            </div>
          ) : (
            <>
              {/* Detail tabs */}
              <div className="flex gap-1 p-4 border-b border-[#D5C3B6]/30 bg-[#F8F7F4]">
                {detailTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setDetailTab(tab.key)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      detailTab === tab.key
                        ? "bg-white text-[#2D3C3C] shadow-sm"
                        : "text-[#75524C] hover:bg-white/50"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Detail content */}
              <div className="p-6 overflow-y-auto" style={{ maxHeight: "calc(100% - 60px)" }}>
                {detailTab === "summary" && (
                  <div className="space-y-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-[#2D3C3C]">{selectedCase.title}</h2>
                        <p className="text-[#75524C]">{selectedCase.type}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm ${statusConfig[selectedCase.status].bg} ${statusConfig[selectedCase.status].text}`}>
                        {statusConfig[selectedCase.status].label}
                      </span>
                    </div>

                    {/* Status banner - conditional */}
                    {selectedCase.status === "waiting" && (
                      <div className="flex items-start gap-3 p-4 bg-[#F2C94C]/10 border border-[#F2C94C]/40 rounded-lg">
                        <Clock className="text-[#F2C94C] shrink-0 mt-0.5" size={18} />
                        <div>
                          <p className="font-medium text-[#2D3C3C] text-sm">Esperando respuesta del abogado</p>
                          <p className="text-xs text-[#75524C] mt-0.5">
                            {selectedCase.lawyer.name} recibio tu solicitud. Te notificaremos cuando responda (normalmente en menos de 24h).
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedCase.status === "rejected" && (
                      <div className="flex items-start gap-3 p-4 bg-[#C27F79]/10 border border-[#C27F79]/40 rounded-lg">
                        <XCircle className="text-[#C27F79] shrink-0 mt-0.5" size={18} />
                        <div>
                          <p className="font-medium text-[#2D3C3C] text-sm">El abogado no pudo tomar este caso</p>
                          <p className="text-xs text-[#75524C] mt-0.5">
                            No te preocupes, puedes buscar otro abogado con experiencia similar.
                          </p>
                          <Link href="/dashboard-client/find-lawyer" className="text-xs text-[#5E8B8C] hover:underline mt-1 inline-block">
                            Buscar otro abogado →
                          </Link>
                        </div>
                      </div>
                    )}

                    {selectedCase.status === "active" && (
                      <div className="flex items-start gap-3 p-4 bg-[#5E8B8C]/10 border border-[#5E8B8C]/30 rounded-lg">
                        <CheckCircle className="text-[#5E8B8C] shrink-0 mt-0.5" size={18} />
                        <div>
                          <p className="font-medium text-[#2D3C3C] text-sm">Caso en curso</p>
                          <p className="text-xs text-[#75524C] mt-0.5">
                            {selectedCase.lawyer.name} esta trabajando en tu caso.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Lawyer info */}
                    <div className="flex items-center gap-4 p-4 bg-[#F8F7F4] rounded-lg">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#5E8B8C] to-[#2D3C3C] flex items-center justify-center text-white font-bold">
                        {selectedCase.lawyer.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-bold text-[#2D3C3C]">{selectedCase.lawyer.name}</p>
                        <p className="text-sm text-[#75524C]">{selectedCase.lawyer.specialization}</p>
                      </div>
                    </div>

                    {/* Progress */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-[#75524C]">Progreso del caso</span>
                        <span className="font-bold text-[#2D3C3C]">{selectedCase.progress}%</span>
                      </div>
                      <div className="h-3 bg-[#D5C3B6]/30 rounded-full">
                        <div
                          className={`h-3 rounded-full ${statusConfig[selectedCase.status].bg}`}
                          style={{ width: `${selectedCase.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Key dates */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 border border-[#D5C3B6]/30 rounded-lg">
                        <p className="text-xs text-[#75524C] mb-1">Fecha de inicio</p>
                        <p className="font-medium text-[#2D3C3C]">{selectedCase.createdAt}</p>
                      </div>
                      <div className="p-4 border border-[#D5C3B6]/30 rounded-lg">
                        <p className="text-xs text-[#75524C] mb-1">Última actualización</p>
                        <p className="font-medium text-[#2D3C3C]">{selectedCase.lastUpdate}</p>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <h3 className="font-bold text-[#2D3C3C] mb-2">Descripción</h3>
                      <p className="text-[#75524C]">{selectedCase.description}</p>
                    </div>

                    {/* Next action callout */}
                    <div className="p-4 bg-[#F2C94C]/10 border border-[#F2C94C] rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertCircle className="text-[#F2C94C]" size={18} />
                        <span className="font-bold text-[#2D3C3C]">Siguiente acción</span>
                      </div>
                      <p className="text-[#75524C]">{selectedCase.nextAction}</p>
                    </div>
                  </div>
                )}

                {detailTab === "documents" && (
                  <div className="space-y-4">
                    <input
                      ref={docInputRef}
                      type="file"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file || !selectedCaseId) return
                        setDocUploading(true)
                        const fd = new FormData()
                        fd.append("case_id", selectedCaseId)
                        fd.append("file", file)
                        await uploadCaseDocument(fd)
                        e.target.value = ""
                        await refreshCaseDetail(selectedCaseId)
                        setDocUploading(false)
                      }}
                    />
                    <div className="border-2 border-dashed border-[#D5C3B6] rounded-lg p-8 text-center">
                      <Upload className="mx-auto text-[#D5C3B6] mb-2" size={32} />
                      <p className="text-[#75524C] mb-2">
                        Sube documentos del caso (PDF, imágenes, etc.)
                      </p>
                      <button
                        type="button"
                        disabled={docUploading || !selectedCaseId}
                        onClick={() => docInputRef.current?.click()}
                        className="text-[#5E8B8C] hover:underline text-sm disabled:opacity-50"
                      >
                        {docUploading ? "Subiendo…" : "Seleccionar archivos"}
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      {detailLoading ? (
                        <p className="text-sm text-[#75524C] py-4">Cargando…</p>
                      ) : (
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-[#D5C3B6]/30">
                              <th className="text-left py-3 px-4 text-sm font-medium text-[#75524C]">Nombre</th>
                              <th className="text-left py-3 px-4 text-sm font-medium text-[#75524C]">Tipo</th>
                              <th className="text-left py-3 px-4 text-sm font-medium text-[#75524C]">Fecha</th>
                              <th className="text-left py-3 px-4 text-sm font-medium text-[#75524C]">Subido por</th>
                              <th className="text-right py-3 px-4 text-sm font-medium text-[#75524C]">Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {detailDocs.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="py-6 text-center text-sm text-[#75524C]">
                                  No hay documentos aún.
                                </td>
                              </tr>
                            ) : (
                              detailDocs.map((doc) => {
                                const path = String(doc.file_url ?? "")
                                const created = doc.created_at
                                  ? new Date(doc.created_at as string).toLocaleDateString("es-CL")
                                  : ""
                                const role = doc.uploaded_by_role as string | undefined
                                const by =
                                  role === "lawyer"
                                    ? "Abogado"
                                    : role === "client"
                                      ? "Cliente"
                                      : "—"
                                return (
                                  <tr
                                    key={String(doc.id)}
                                    className="border-b border-[#D5C3B6]/30 hover:bg-[#F8F7F4]"
                                  >
                                    <td className="py-3 px-4">
                                      <div className="flex items-center gap-2">
                                        <FileText size={16} className="text-[#5E8B8C]" />
                                        <span className="text-sm text-[#2D3C3C]">{String(doc.name)}</span>
                                      </div>
                                    </td>
                                    <td className="py-3 px-4 text-sm text-[#75524C]">
                                      {String(doc.file_type ?? "—")}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-[#75524C]">{created}</td>
                                    <td className="py-3 px-4 text-sm text-[#75524C]">{by}</td>
                                    <td className="py-3 px-4 text-right">
                                      <button
                                        type="button"
                                        className="p-1 text-[#75524C] hover:text-[#5E8B8C]"
                                        title="Descargar"
                                        onClick={async () => {
                                          const r = await getCaseDocumentSignedUrl(path)
                                          if ("url" in r && r.url) window.open(r.url, "_blank", "noopener,noreferrer")
                                        }}
                                      >
                                        <Download size={16} />
                                      </button>
                                    </td>
                                  </tr>
                                )
                              })
                            )}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                )}

                {detailTab === "activity" && (
                  <div className="relative">
                    <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-[#D5C3B6]/50" />
                    {detailLoading ? (
                      <p className="text-sm text-[#75524C] pl-14 py-4">Cargando…</p>
                    ) : detailActs.length === 0 ? (
                      <p className="text-sm text-[#75524C] pl-14 py-4">Sin actividad registrada.</p>
                    ) : (
                      detailActs.map((row) => {
                        const { Icon, bg } = activityVisual(String(row.type ?? ""))
                        const when = row.created_at
                          ? new Date(row.created_at as string).toLocaleString("es-CL")
                          : ""
                        return (
                          <div key={String(row.id)} className="flex gap-4 mb-6 relative">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 ${bg}`}
                            >
                              <Icon size={16} className="text-white" />
                            </div>
                            <div className="bg-white border border-[#D5C3B6]/30 rounded-lg p-4 flex-1 hover:shadow-md transition-shadow">
                              <p className="text-[#2D3C3C] font-medium">{String(row.title ?? "")}</p>
                              <p className="text-sm text-[#75524C]">{String(row.description ?? "")}</p>
                              <p className="text-xs text-[#D5C3B6] mt-1">{when}</p>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                )}

                {detailTab === "steps" && (
                  <div className="space-y-3">
                    {detailLoading ? (
                      <p className="text-sm text-[#75524C]">Cargando…</p>
                    ) : detailSteps.length === 0 ? (
                      <p className="text-sm text-[#75524C]">
                        Tu abogado aún no ha definido próximos pasos.
                      </p>
                    ) : (
                      detailSteps.map((step) => {
                        const id = String(step.id)
                        const completed = Boolean(step.completed)
                        const due = step.due_date
                          ? new Date(step.due_date as string).toLocaleDateString("es-CL")
                          : "—"
                        const assigned = step.assigned_to as string
                        return (
                          <button
                            type="button"
                            key={id}
                            onClick={async () => {
                              await updateNextStepCompleted(id, !completed)
                              if (selectedCaseId) await refreshCaseDetail(selectedCaseId)
                            }}
                            className={`w-full text-left flex items-start gap-4 p-4 border rounded-lg transition-colors ${
                              completed
                                ? "border-[#D5C3B6]/30 opacity-60"
                                : "border-[#D5C3B6]/30 hover:bg-[#F8F7F4]"
                            }`}
                          >
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                                completed ? "bg-[#5E8B8C]" : "border-2 border-[#D5C3B6]"
                              }`}
                            >
                              {completed && <CheckCircle size={14} className="text-white" />}
                            </div>
                            <div className="flex-1">
                              <p
                                className={`font-medium ${
                                  completed ? "line-through text-[#75524C]" : "text-[#2D3C3C]"
                                }`}
                              >
                                {String(step.text ?? "")}
                              </p>
                              <div className="flex items-center gap-4 mt-1">
                                <span className="text-xs text-[#75524C] flex items-center gap-1">
                                  <Clock size={12} />
                                  {due}
                                </span>
                                <span
                                  className={`text-xs px-2 py-0.5 rounded ${
                                    assigned === "client"
                                      ? "bg-[#5E8B8C]/10 text-[#5E8B8C]"
                                      : "bg-[#75524C]/10 text-[#75524C]"
                                  }`}
                                >
                                  {assigned === "client" ? "Tú" : "Abogado"}
                                </span>
                                <span className="text-xs text-[#D5C3B6]">Clic para marcar</span>
                              </div>
                            </div>
                          </button>
                        )
                      })
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* New Case Modal */}
      {showNewCaseModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-[#D5C3B6]/30">
              <h2 className="text-lg font-bold text-[#2D3C3C]">Nuevo Caso</h2>
              <button
                onClick={() => setShowNewCaseModal(false)}
                className="text-[#75524C] hover:text-[#2D3C3C]"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateCase} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#2D3C3C] mb-1">
                  Título del caso
                </label>
                <input
                  type="text"
                  value={newCaseForm.title}
                  onChange={(e) => setNewCaseForm({ ...newCaseForm, title: e.target.value })}
                  className="w-full px-4 py-3 border border-[#D5C3B6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E8B8C]"
                  placeholder="Ej: Demanda laboral"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2D3C3C] mb-1">
                  Área legal
                </label>
                <select
                  value={newCaseForm.area}
                  onChange={(e) => setNewCaseForm({ ...newCaseForm, area: e.target.value })}
                  className="w-full px-4 py-3 border border-[#D5C3B6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E8B8C]"
                >
                  <option value="">Selecciona un área</option>
                  {specialties.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2D3C3C] mb-1">
                  Descripción
                </label>
                <textarea
                  rows={4}
                  value={newCaseForm.description}
                  onChange={(e) => setNewCaseForm({ ...newCaseForm, description: e.target.value })}
                  className="w-full px-4 py-3 border border-[#D5C3B6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E8B8C]"
                  placeholder="Describe tu caso..."
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2D3C3C] mb-2">
                  Presupuesto disponible: <span className="font-bold text-[#2D3C3C]">${newCaseForm.budget}/hr</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="500"
                  value={newCaseForm.budget}
                  onChange={(e) => setNewCaseForm({ ...newCaseForm, budget: parseInt(e.target.value) })}
                  className="w-full accent-[#5E8B8C]"
                />
                <div className="flex justify-between text-sm text-[#75524C]">
                  <span>$0/hr</span>
                  <span>$500/hr</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2D3C3C] mb-1">
                  Documento (opcional)
                </label>
                <div className="border-2 border-dashed border-[#D5C3B6] rounded-lg p-4 text-center">
                  <Upload className="mx-auto text-[#D5C3B6] mb-2" size={24} />
                  <p className="text-sm text-[#75524C]">Arrastra o selecciona archivo</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={newCaseLoading}
                className="w-full py-3 bg-[#5E8B8C] text-white rounded-lg font-semibold hover:bg-[#5E8B8C]/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {newCaseLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Creando...
                  </>
                ) : (
                  "Crear Caso"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
