"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import {
  FileText,
  Clock,
  CheckCircle,
  DollarSign,
  Save,
  Loader2,
  RefreshCw,
  MessageSquare,
  Plus,
  Inbox,
} from "lucide-react"
import { statusConfig } from "@/lib/data"
import { getLawyerCases, getIncomingRequests } from "@/lib/queries/cases"
import {
  acceptCaseRequest,
  rejectCaseRequest,
  updateCaseStatus,
} from "@/lib/actions/cases"
import { createClient } from "@/lib/supabase/client"
import {
  getCaseDocuments,
  getCaseActivities,
  getNextStepsForCase,
  getCaseNote,
} from "@/lib/queries/case-detail"
import {
  uploadCaseDocument,
  downloadDecryptedDocument,
  updateNextStepCompleted,
  addNextStepForCase,
  saveCaseNote,
} from "@/lib/actions/case-detail"

type IncomingRequest = {
  id: string
  clientName: string
  clientType: string
  caseTitle: string
  caseType: string
  description: string
  budget: number
  message: string
  submittedAt: string
  status: "pending" | "accepted" | "rejected"
}

type LawyerCaseView = {
  id: string
  title: string
  type: string
  status: keyof typeof statusConfig
  progress: number
  description: string
  createdAt: string
  lastUpdate: string
  client: { name: string; city: string }
}

function normalizeIncomingRequest(r: Record<string, unknown>): IncomingRequest {
  const client = r.client as { full_name?: string | null; city?: string | null } | null
  const c = r.case as
    | {
        title?: string
        type?: string
        description?: string
        budget?: number | null
      }
    | null
  const st = (r.status as string) ?? "pending"
  const status =
    st === "accepted" || st === "rejected" || st === "pending"
      ? st
      : "pending"
  return {
    id: String(r.id),
    clientName: client?.full_name ?? "—",
    clientType: client?.city ? `Ciudad: ${client.city}` : "Cliente",
    caseTitle: String(c?.title ?? ""),
    caseType: String(c?.type ?? ""),
    description: String(c?.description ?? ""),
    budget: Number(c?.budget ?? 0),
    message: String(r.message ?? ""),
    submittedAt: r.created_at
      ? new Date(r.created_at as string).toLocaleString("es-CL")
      : "",
    status,
  }
}

function normalizeLawyerCase(c: Record<string, unknown>): LawyerCaseView {
  const client = c.client as { full_name?: string | null; city?: string | null } | null
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
    client: {
      name: client?.full_name ?? "—",
      city: client?.city ?? "",
    },
  }
}

type TabType = "requests" | "active" | "pending" | "completed" | "all"
type DetailTab = "summary" | "documents" | "activity" | "steps" | "notes" | "billing"

const ALLOWED_EXTENSIONS = ["pdf", "jpg", "jpeg", "png", "webp", "doc", "docx", "txt"]
const MAX_FILE_SIZE_MB = 25

function validateFile(file: File): string | null {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? ""
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return `Tipo de archivo no permitido. Extensiones aceptadas: ${ALLOWED_EXTENSIONS.join(", ")}`
  }
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    return `El archivo supera el límite de ${MAX_FILE_SIZE_MB} MB`
  }
  return null
}

function activityVisual(type: string) {
  const t = (type || "").toLowerCase()
  if (t.includes("document")) return { Icon: FileText, bg: "bg-[#75524C]" }
  if (t.includes("message")) return { Icon: MessageSquare, bg: "bg-[#C27F79]" }
  if (t.includes("status") || t.includes("step")) return { Icon: RefreshCw, bg: "bg-[#5E8B8C]" }
  return { Icon: Plus, bg: "bg-[#2D3C3C]" }
}

export default function LawyerCasesPage() {
  const [loading, setLoading] = useState(true)
  const [cases, setCases] = useState<LawyerCaseView[]>([])
  const [activeTab, setActiveTab] = useState<TabType>("requests")
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null)
  const [detailTab, setDetailTab] = useState<DetailTab>("summary")
  const [notes, setNotes] = useState("")
  const [savingNotes, setSavingNotes] = useState(false)
  const [hours, setHours] = useState("5")

  const [detailDocs, setDetailDocs] = useState<Record<string, unknown>[]>([])
  const [detailActs, setDetailActs] = useState<Record<string, unknown>[]>([])
  const [detailSteps, setDetailSteps] = useState<Record<string, unknown>[]>([])
  const [detailLoading, setDetailLoading] = useState(false)
  const [docUploading, setDocUploading] = useState(false)
  const docInputRef = useRef<HTMLInputElement>(null)
  const [newStepText, setNewStepText] = useState("")
  const [newStepAssign, setNewStepAssign] = useState<"client" | "lawyer">("client")
  const [newStepDue, setNewStepDue] = useState("")
  const [addingStep, setAddingStep] = useState(false)

  const [requests, setRequests] = useState<IncomingRequest[]>([])
  const [respondingId, setRespondingId] = useState<string | null>(null)

  const refreshLawyerData = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    const [casesData, requestsData] = await Promise.all([
      getLawyerCases(user.id),
      getIncomingRequests(user.id),
    ])
    const normCases = (casesData ?? []).map((row) =>
      normalizeLawyerCase(row as Record<string, unknown>)
    )
    setCases(normCases)
    setCaseStatuses(
      Object.fromEntries(normCases.map((c) => [c.id, c.status]))
    )
    setRequests(
      (requestsData ?? []).map((row) =>
        normalizeIncomingRequest(row as Record<string, unknown>)
      )
    )
  }

  const handleAcceptRequest = async (requestId: string) => {
    setRespondingId(requestId)
    const result = await acceptCaseRequest(requestId)
    if ("success" in result && result.success) {
      setRequests((prev) =>
        prev.map((r) =>
          r.id === requestId ? { ...r, status: "accepted" as const } : r
        )
      )
      await refreshLawyerData()
    }
    setRespondingId(null)
  }

  const handleRejectRequest = async (requestId: string) => {
    setRespondingId(requestId)
    await rejectCaseRequest(requestId)
    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId ? { ...r, status: "rejected" as const } : r
      )
    )
    await refreshLawyerData()
    setRespondingId(null)
  }

  const pendingRequestsCount = requests.filter((r) => r.status === "pending").length

  const [caseStatuses, setCaseStatuses] = useState<Record<string, string>>({})
  const [statusChanging, setStatusChanging] = useState(false)
  const [statusChangeSuccess, setStatusChangeSuccess] = useState(false)

  const handleStatusChange = async (caseId: string, newStatus: string) => {
    setStatusChanging(true)
    await updateCaseStatus(caseId, newStatus)
    setCaseStatuses((prev) => ({ ...prev, [caseId]: newStatus }))
    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? { ...c, status: newStatus as LawyerCaseView["status"] } : c))
    )
    setStatusChanging(false)
    setStatusChangeSuccess(true)
    setTimeout(() => setStatusChangeSuccess(false), 2000)
  }

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        setLoading(false)
        return
      }
      Promise.all([getLawyerCases(user.id), getIncomingRequests(user.id)]).then(
        ([casesData, requestsData]) => {
          const normCases = (casesData ?? []).map((row) =>
            normalizeLawyerCase(row as Record<string, unknown>)
          )
          setCases(normCases)
          setCaseStatuses(
            Object.fromEntries(normCases.map((c) => [c.id, c.status]))
          )
          setRequests(
            (requestsData ?? []).map((row) =>
              normalizeIncomingRequest(row as Record<string, unknown>)
            )
          )
          setLoading(false)
        }
      )
    })
  }, [])

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

  useEffect(() => {
    if (!selectedCaseId) return
    const supabase = createClient()
    setDetailLoading(true)
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        setDetailLoading(false)
        return
      }
      await refreshCaseDetail(selectedCaseId)
      const note = await getCaseNote(selectedCaseId, user.id)
      setNotes(String(note?.content ?? ""))
      setDetailLoading(false)
    })
  }, [selectedCaseId])

  const filteredCases = cases.filter((c) => {
    if (activeTab === "all") return true
    return caseStatuses[c.id] === activeTab
  })

  const selectedCase = cases.find((c) => c.id === selectedCaseId)

  const tabs: { key: TabType; label: string; badge?: number }[] = [
    { key: "requests", label: "Solicitudes", badge: pendingRequestsCount },
    { key: "active", label: "Activos" },
    { key: "completed", label: "Completados" },
    { key: "all", label: "Todos" },
  ]

  const detailTabs: { key: DetailTab; label: string }[] = [
    { key: "summary", label: "Resumen" },
    { key: "documents", label: "Documentos" },
    { key: "activity", label: "Actividad" },
    { key: "steps", label: "Próximos Pasos" },
    { key: "notes", label: "Notas Privadas" },
    { key: "billing", label: "Facturación" },
  ]

  const handleSaveNotes = async () => {
    if (!selectedCaseId) return
    setSavingNotes(true)
    await saveCaseNote(selectedCaseId, notes)
    setSavingNotes(false)
  }

  const hourlyRate = 120
  const totalAmount = parseInt(hours || "0") * hourlyRate

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
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#D5C3B6]/30 pb-2 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === tab.key
                ? tab.key === "requests" ? "bg-[#F2C94C] text-[#2D3C3C]" : "bg-[#75524C] text-white"
                : "text-[#75524C] hover:bg-[#D5C3B6]/20"
            }`}
          >
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center ${
                tab.key === "requests" && activeTab === "requests" 
                  ? "bg-[#2D3C3C] text-white" 
                  : "bg-[#C27F79] text-white"
              }`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Requests Tab Content */}
      {activeTab === "requests" && (
        <div className="space-y-4">
          {requests.filter(r => r.status === "pending").length === 0 ? (
            <div className="bg-white border border-[#D5C3B6]/30 rounded-lg p-12 text-center">
              <Inbox className="mx-auto text-[#D5C3B6] mb-4" size={48} />
              <p className="font-bold text-[#2D3C3C] mb-1">Sin solicitudes pendientes</p>
              <p className="text-sm text-[#75524C]">Cuando un cliente te contacte, aparecera aqui</p>
            </div>
          ) : (
            requests.map((req) => req.status === "pending" && (
              <div key={req.id} className="bg-white border border-[#D5C3B6]/30 rounded-lg shadow-sm p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#5E8B8C] to-[#2D3C3C] flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {req.clientName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-[#2D3C3C]">{req.clientName}</p>
                      <p className="text-xs text-[#75524C]">{req.clientType} · {req.submittedAt}</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-[#F2C94C]/20 text-[#2D3C3C] text-xs rounded-full font-medium">
                    Nueva solicitud
                  </span>
                </div>

                {/* Caso */}
                <div className="bg-[#F8F7F4] rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                    <h3 className="font-bold text-[#2D3C3C]">{req.caseTitle}</h3>
                    <span className="text-xs text-[#75524C] bg-white px-2 py-1 rounded border border-[#D5C3B6]/30">
                      {req.caseType}
                    </span>
                  </div>
                  <p className="text-sm text-[#75524C] mb-3 line-clamp-2">{req.description}</p>
                  
                  {/* Presupuesto del cliente */}
                  <div className="flex items-center gap-2">
                    <DollarSign size={16} className="text-[#5E8B8C]" />
                    <span className="text-sm text-[#75524C]">Presupuesto del cliente:</span>
                    <span className="font-bold text-[#2D3C3C]">${req.budget}/hr</span>
                  </div>
                </div>

                {/* Mensaje del cliente */}
                <div className="mb-4">
                  <p className="text-xs font-medium text-[#75524C] mb-1">Mensaje:</p>
                  <p className="text-sm text-[#2D3C3C] italic">&quot;{req.message}&quot;</p>
                </div>

                {/* Acciones */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleRejectRequest(req.id)}
                    disabled={respondingId === req.id}
                    className="flex-1 py-2 border border-[#D5C3B6] text-[#75524C] rounded-lg text-sm hover:bg-[#F8F7F4] disabled:opacity-50 transition-colors"
                  >
                    Declinar
                  </button>
                  <button
                    onClick={() => handleAcceptRequest(req.id)}
                    disabled={respondingId === req.id}
                    className="flex-1 py-2 bg-[#75524C] text-white rounded-lg text-sm hover:bg-[#75524C]/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    {respondingId === req.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      "Aceptar caso"
                    )}
                  </button>
                </div>
              </div>
            ))
          )}

          {/* Solicitudes ya respondidas (historial) */}
          {requests.some(r => r.status !== "pending") && (
            <div>
              <p className="text-xs font-medium text-[#75524C] uppercase tracking-wide mb-3">Respondidas</p>
              {requests.filter(r => r.status !== "pending").map(req => (
                <div key={req.id} className="bg-white border border-[#D5C3B6]/30 rounded-lg p-4 flex items-center justify-between opacity-60 mb-2">
                  <div>
                    <p className="text-sm font-medium text-[#2D3C3C]">{req.caseTitle}</p>
                    <p className="text-xs text-[#75524C]">{req.clientName}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    req.status === "accepted" 
                      ? "bg-[#5E8B8C]/10 text-[#5E8B8C]" 
                      : "bg-[#C27F79]/10 text-[#C27F79]"
                  }`}>
                    {req.status === "accepted" ? "Aceptado" : "Declinado"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Two-panel layout - only show when not on requests tab */}
      {activeTab !== "requests" && (
      <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-14rem)]">
        {/* Cases list */}
        <div className="lg:w-1/3 overflow-y-auto space-y-2">
          {filteredCases.length === 0 ? (
            <div className="bg-white border border-[#D5C3B6]/30 rounded-lg p-8 text-center">
              <FileText className="mx-auto text-[#D5C3B6] mb-4" size={48} />
              <p className="text-[#75524C]">No tienes casos en esta categoría.</p>
            </div>
          ) : (
            filteredCases.map((caseItem) => {
              const currentStatus = caseStatuses[caseItem.id] as keyof typeof statusConfig
              const status = statusConfig[currentStatus]
              return (
                <button
                  key={caseItem.id}
                  onClick={() => setSelectedCaseId(caseItem.id)}
                  className={`w-full text-left p-4 bg-white border rounded-lg transition-colors ${
                    selectedCaseId === caseItem.id
                      ? "bg-[#75524C]/10 border-l-2 border-[#75524C]"
                      : "border-[#D5C3B6]/30 hover:bg-[#F8F7F4]"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-[#2D3C3C] text-sm">{caseItem.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${status.bg} ${status.text}`}>
                      {status.label}
                    </span>
                  </div>
                  <p className="text-xs text-[#75524C] mb-1">
                    Cliente: {caseItem.client.name}
                  </p>
                  <div className="flex items-center justify-between text-xs text-[#75524C]">
                    <span>{caseItem.lastUpdate}</span>
                    <span className="text-[#75524C]">{caseItem.progress}%</span>
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
                    <div className="flex items-start justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h2 className="text-xl font-bold text-[#2D3C3C]">{selectedCase.title}</h2>
                        <Link
                          href={`/dashboard-lawyer/cases/${selectedCase.id}/workspace`}
                          className="text-sm font-semibold text-[#5E8B8C] hover:underline"
                        >
                          Ver workspace
                        </Link>
                        {/* Selector de estado */}
                        <div className="flex items-center gap-2">
                          <select
                            value={caseStatuses[selectedCase.id]}
                            onChange={(e) => handleStatusChange(selectedCase.id, e.target.value)}
                            disabled={statusChanging}
                            className="text-sm px-3 py-1 border border-[#D5C3B6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E8B8C] bg-white cursor-pointer disabled:opacity-50"
                          >
                            <option value="pending">Pendiente</option>
                            <option value="active">Activo</option>
                            <option value="inProgress">En progreso</option>
                            <option value="completed">Completado</option>
                          </select>
                          
                          {statusChanging && <Loader2 className="animate-spin text-[#5E8B8C]" size={16} />}
                          {statusChangeSuccess && <CheckCircle className="text-[#5E8B8C]" size={16} />}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-[#75524C] -mt-4">
                      {selectedCase.type} - El cliente vera este cambio de estado en tiempo real
                    </p>

                    {/* Client info */}
                    <div className="flex items-center gap-4 p-4 bg-[#F8F7F4] rounded-lg">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#5E8B8C] to-[#2D3C3C] flex items-center justify-center text-white font-bold">
                        JF
                      </div>
                      <div>
                        <p className="font-bold text-[#2D3C3C]">{selectedCase.client.name}</p>
                        <p className="text-sm text-[#75524C]">Cliente</p>
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
                          className={`h-3 rounded-full ${
                            statusConfig[
                              (caseStatuses[selectedCase.id] ??
                                selectedCase.status) as keyof typeof statusConfig
                            ].bg
                          }`}
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
                        const validationError = validateFile(file)
                        if (validationError) {
                          alert(validationError)
                          e.target.value = ""
                          return
                        }
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
                    <div className="border-2 border-dashed border-[#D5C3B6] rounded-lg p-6 text-center">
                      <button
                        type="button"
                        disabled={docUploading || !selectedCaseId}
                        onClick={() => docInputRef.current?.click()}
                        className="text-[#75524C] hover:text-[#2D3C3C] text-sm disabled:opacity-50"
                      >
                        {docUploading ? "Subiendo…" : "+ Subir documento al caso"}
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
                              <th className="text-left py-3 px-4 text-sm font-medium text-[#75524C]">Fecha</th>
                              <th className="text-left py-3 px-4 text-sm font-medium text-[#75524C]">Subido por</th>
                              <th className="text-right py-3 px-4 text-sm font-medium text-[#75524C]"> </th>
                            </tr>
                          </thead>
                          <tbody>
                            {detailDocs.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="py-6 text-center text-sm text-[#75524C]">
                                  Sin documentos.
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
                                  role === "lawyer" ? "Abogado" : role === "client" ? "Cliente" : "—"
                                return (
                                  <tr key={String(doc.id)} className="border-b border-[#D5C3B6]/30 hover:bg-[#F8F7F4]">
                                    <td className="py-3 px-4">
                                      <div className="flex items-center gap-2">
                                        <FileText size={16} className="text-[#75524C]" />
                                        <span className="text-sm text-[#2D3C3C]">{String(doc.name)}</span>
                                      </div>
                                    </td>
                                    <td className="py-3 px-4 text-sm text-[#75524C]">{created}</td>
                                    <td className="py-3 px-4 text-sm text-[#75524C]">{by}</td>
                                    <td className="py-3 px-4 text-right">
                                      <button
                                        type="button"
                                        className="text-sm text-[#75524C] hover:underline"
                                        onClick={async () => {
                                          const r = await downloadDecryptedDocument(path)
                                          if ("dataUrl" in r && r.dataUrl) {
                                            // Crear link temporal para descarga directa (el archivo nunca va a una URL pública)
                                            const a = document.createElement("a")
                                            a.href = r.dataUrl
                                            a.download = r.fileName
                                            document.body.appendChild(a)
                                            a.click()
                                            document.body.removeChild(a)
                                          }
                                        }}
                                      >
                                        Descargar
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
                      <p className="text-sm text-[#75524C] pl-14 py-4">Sin actividad.</p>
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

                {detailTab === "steps" && selectedCaseId && (
                  <div className="space-y-4">
                    <div className="p-4 border border-[#D5C3B6]/30 rounded-lg space-y-3">
                      <p className="text-sm font-medium text-[#2D3C3C]">Nuevo paso</p>
                      <textarea
                        value={newStepText}
                        onChange={(e) => setNewStepText(e.target.value)}
                        rows={2}
                        placeholder="Describe el próximo paso…"
                        className="w-full px-3 py-2 border border-[#D5C3B6] rounded-lg text-sm"
                      />
                      <div className="flex flex-wrap gap-3 items-end">
                        <div>
                          <label className="text-xs text-[#75524C] block mb-1">Asignado a</label>
                          <select
                            value={newStepAssign}
                            onChange={(e) =>
                              setNewStepAssign(e.target.value as "client" | "lawyer")
                            }
                            className="px-3 py-2 border border-[#D5C3B6] rounded-lg text-sm"
                          >
                            <option value="client">Cliente</option>
                            <option value="lawyer">Abogado</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-[#75524C] block mb-1">Vencimiento (opcional)</label>
                          <input
                            type="date"
                            value={newStepDue}
                            onChange={(e) => setNewStepDue(e.target.value)}
                            className="px-3 py-2 border border-[#D5C3B6] rounded-lg text-sm"
                          />
                        </div>
                        <button
                          type="button"
                          disabled={addingStep || !newStepText.trim()}
                          onClick={async () => {
                            setAddingStep(true)
                            await addNextStepForCase({
                              case_id: selectedCaseId,
                              text: newStepText.trim(),
                              assigned_to: newStepAssign,
                              due_date: newStepDue || null,
                            })
                            setNewStepText("")
                            setNewStepDue("")
                            await refreshCaseDetail(selectedCaseId)
                            setAddingStep(false)
                          }}
                          className="px-4 py-2 bg-[#75524C] text-white rounded-lg text-sm disabled:opacity-50"
                        >
                          {addingStep ? "Guardando…" : "Agregar"}
                        </button>
                      </div>
                    </div>
                    {detailLoading ? (
                      <p className="text-sm text-[#75524C]">Cargando…</p>
                    ) : (
                      <div className="space-y-2">
                        {detailSteps.map((step) => {
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
                                await refreshCaseDetail(selectedCaseId)
                              }}
                              className={`w-full text-left flex items-start gap-3 p-3 border rounded-lg ${
                                completed ? "opacity-50 border-[#D5C3B6]/30" : "border-[#D5C3B6]/30"
                              }`}
                            >
                              <div
                                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                                  completed ? "bg-[#75524C]" : "border-2 border-[#D5C3B6]"
                                }`}
                              >
                                {completed && <CheckCircle size={12} className="text-white" />}
                              </div>
                              <div>
                                <p
                                  className={`text-sm font-medium ${
                                    completed ? "line-through text-[#75524C]" : "text-[#2D3C3C]"
                                  }`}
                                >
                                  {String(step.text ?? "")}
                                </p>
                                <p className="text-xs text-[#75524C] mt-1">
                                  {due} · {assigned === "client" ? "Cliente" : "Abogado"} · clic para alternar
                                </p>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                {detailTab === "notes" && (
                  <div className="space-y-4">
                    <div className="bg-[#F2C94C]/10 border border-[#F2C94C] rounded-lg p-4 mb-4">
                      <p className="text-sm text-[#75524C]">
                        Estas notas son privadas y NO son visibles para el cliente.
                      </p>
                    </div>

                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={8}
                      placeholder="Escribe tus notas privadas sobre este caso..."
                      className="w-full px-4 py-3 border border-[#D5C3B6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#75524C]"
                    />

                    <button
                      onClick={handleSaveNotes}
                      disabled={savingNotes}
                      className="flex items-center gap-2 px-6 py-2 bg-[#75524C] text-white rounded-lg hover:bg-[#75524C]/90 transition-colors disabled:opacity-50"
                    >
                      {savingNotes ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save size={16} />
                          Guardar nota
                        </>
                      )}
                    </button>
                  </div>
                )}

                {detailTab === "billing" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[#2D3C3C] mb-1">
                          Horas registradas
                        </label>
                        <input
                          type="number"
                          value={hours}
                          onChange={(e) => setHours(e.target.value)}
                          className="w-full px-4 py-3 border border-[#D5C3B6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#75524C]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#2D3C3C] mb-1">
                          Tarifa por hora
                        </label>
                        <div className="px-4 py-3 bg-[#F8F7F4] border border-[#D5C3B6] rounded-lg text-[#75524C]">
                          ${hourlyRate}/hr
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-[#F8F7F4] border border-[#D5C3B6] rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[#75524C]">Total calculado</span>
                        <span className="text-2xl font-bold text-[#2D3C3C]">${totalAmount.toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-[#75524C]">{hours} horas x ${hourlyRate}/hr</p>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-[#D5C3B6]/30 rounded-lg">
                      <div>
                        <p className="font-medium text-[#2D3C3C]">Estado de factura</p>
                        <p className="text-sm text-[#75524C]">Última factura: 15/01/2024</p>
                      </div>
                      <span className="px-3 py-1 bg-[#F2C94C] text-[#2D3C3C] rounded-full text-sm font-medium">
                        Pendiente
                      </span>
                    </div>

                    <button className="flex items-center gap-2 px-6 py-2 bg-[#75524C] text-white rounded-lg hover:bg-[#75524C]/90 transition-colors">
                      <DollarSign size={16} />
                      Generar Factura
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      )}
    </div>
  )
}
