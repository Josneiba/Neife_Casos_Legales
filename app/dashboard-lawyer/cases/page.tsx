"use client"

import { useState, useEffect } from "react"
import {
  FileText,
  Clock,
  CheckCircle,
  DollarSign,
  Save,
  Loader2,
  RefreshCw,
  MessageSquare,
  Calendar,
  Plus,
  Inbox,
} from "lucide-react"
import { mockCases, statusConfig, mockIncomingRequests } from "@/lib/data"

type IncomingRequest = Omit<(typeof mockIncomingRequests)[number], "status"> & {
  status: "pending" | "accepted" | "rejected"
}

type TabType = "requests" | "active" | "pending" | "completed" | "all"
type DetailTab = "summary" | "documents" | "activity" | "notes" | "billing"

export default function LawyerCasesPage() {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>("requests")
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null)
  const [detailTab, setDetailTab] = useState<DetailTab>("summary")
  const [notes, setNotes] = useState("")
  const [savingNotes, setSavingNotes] = useState(false)
  const [hours, setHours] = useState("5")
  
  // Incoming requests state
  const [requests, setRequests] = useState<IncomingRequest[]>(
    mockIncomingRequests as IncomingRequest[]
  )
  const [respondingId, setRespondingId] = useState<string | null>(null)

  const handleAcceptRequest = async (requestId: string) => {
    setRespondingId(requestId)
    await new Promise(r => setTimeout(r, 800))
    setRequests(prev => prev.map(r => r.id === requestId ? {...r, status: "accepted" as const} : r))
    setRespondingId(null)
  }

  const handleRejectRequest = async (requestId: string) => {
    setRespondingId(requestId)
    await new Promise(r => setTimeout(r, 800))
    setRequests(prev => prev.map(r => r.id === requestId ? {...r, status: "rejected" as const} : r))
    setRespondingId(null)
  }

  const pendingRequestsCount = requests.filter(r => r.status === "pending").length
  
  // Case status management
  const [caseStatuses, setCaseStatuses] = useState<Record<string, string>>(
    Object.fromEntries(mockCases.map(c => [c.id, c.status]))
  )
  const [statusChanging, setStatusChanging] = useState(false)
  const [statusChangeSuccess, setStatusChangeSuccess] = useState(false)

  const handleStatusChange = async (caseId: string, newStatus: string) => {
    setStatusChanging(true)
    await new Promise(r => setTimeout(r, 600))
    setCaseStatuses(prev => ({ ...prev, [caseId]: newStatus }))
    setStatusChanging(false)
    setStatusChangeSuccess(true)
    setTimeout(() => setStatusChangeSuccess(false), 2000)
  }

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  const filteredCases = mockCases.filter((c) => {
    if (activeTab === "all") return true
    return caseStatuses[c.id] === activeTab
  })

  const selectedCase = mockCases.find((c) => c.id === selectedCaseId)

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
    { key: "notes", label: "Notas Privadas" },
    { key: "billing", label: "Facturación" },
  ]

  const handleSaveNotes = async () => {
    setSavingNotes(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
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
                  <p className="text-xs text-[#75524C] mb-1">Cliente: Javiera Fernandez</p>
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
                        <p className="font-bold text-[#2D3C3C]">Javiera Fernández</p>
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
                  </div>
                )}

                {detailTab === "documents" && (
                  <div className="space-y-4">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-[#D5C3B6]/30">
                            <th className="text-left py-3 px-4 text-sm font-medium text-[#75524C]">Nombre</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-[#75524C]">Fecha</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-[#75524C]">Subido por</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { name: "Certificado de Matrimonio.pdf", date: "15/01/2024", by: "Cliente" },
                            { name: "Carnet de Identidad.pdf", date: "15/01/2024", by: "Cliente" },
                            { name: "Acuerdo Preliminar.docx", date: "20/01/2024", by: "Abogado" },
                          ].map((doc, i) => (
                            <tr key={i} className="border-b border-[#D5C3B6]/30 hover:bg-[#F8F7F4]">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <FileText size={16} className="text-[#75524C]" />
                                  <span className="text-sm text-[#2D3C3C]">{doc.name}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-sm text-[#75524C]">{doc.date}</td>
                              <td className="py-3 px-4 text-sm text-[#75524C]">{doc.by}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                
                {detailTab === "activity" && (
                  <div className="relative">
                    {/* Timeline vertical line */}
                    <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-[#D5C3B6]/50" />
                    
                    {[
                      { date: "25 Ene 2024", event: "Documento subido", detail: "Acuerdo Preliminar.docx enviado al cliente", icon: FileText, bgColor: "bg-[#75524C]" },
                      { date: "22 Ene 2024", event: "Estado actualizado", detail: "El caso pasó a estado 'Activo'", icon: RefreshCw, bgColor: "bg-[#5E8B8C]" },
                      { date: "20 Ene 2024", event: "Mensaje enviado", detail: "Enviaste un mensaje al cliente", icon: MessageSquare, bgColor: "bg-[#C27F79]" },
                      { date: "18 Ene 2024", event: "Cita agendada", detail: "Reunión programada para el 25 de Enero", icon: Calendar, bgColor: "bg-[#F2C94C]" },
                      { date: "15 Ene 2024", event: "Caso aceptado", detail: "Aceptaste trabajar en este caso", icon: CheckCircle, bgColor: "bg-[#5E8B8C]" },
                      { date: "14 Ene 2024", event: "Caso creado", detail: "El cliente inició el caso", icon: Plus, bgColor: "bg-[#2D3C3C]" },
                    ].map((item, index) => {
                      const ItemIcon = item.icon
                      return (
                      <div key={index} className="flex gap-4 mb-6 relative">
                        {/* Icon circle on the line */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 ${item.bgColor}`}>
                          <ItemIcon size={16} className={item.bgColor === "bg-[#F2C94C]" ? "text-[#2D3C3C]" : "text-white"} />
                        </div>
                        {/* Content */}
                        <div className="bg-white border border-[#D5C3B6]/30 rounded-lg p-4 flex-1 hover:shadow-md transition-shadow">
                          <p className="text-[#2D3C3C] font-medium">{item.event}</p>
                          <p className="text-sm text-[#75524C]">{item.detail}</p>
                          <p className="text-xs text-[#D5C3B6] mt-1">{item.date}</p>
                        </div>
                      </div>
                    )
                    })
                    }
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
