"use client"

import { useState, useEffect } from "react"
import {
  Plus,
  FileText,
  Clock,
  CheckCircle,
  Upload,
  Download,
  Eye,
  X,
  Loader2,
  AlertCircle,
  RefreshCw,
  MessageSquare,
  Calendar,
  XCircle,
} from "lucide-react"
import Link from "next/link"
import { mockCases, mockDocuments, mockNextSteps, statusConfig, specialties } from "@/lib/data"

type TabType = "active" | "waiting" | "pending" | "completed" | "all"
type DetailTab = "summary" | "documents" | "activity" | "steps"

export default function CasesPage() {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>("all")
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null)
  const [detailTab, setDetailTab] = useState<DetailTab>("summary")
  const [showNewCaseModal, setShowNewCaseModal] = useState(false)
  const [newCaseLoading, setNewCaseLoading] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  const filteredCases = mockCases.filter((c) => {
    if (activeTab === "all") return true
    return c.status === activeTab
  })

  const selectedCase = mockCases.find((c) => c.id === selectedCaseId)

  const waitingCount = mockCases.filter(c => c.status === "waiting").length
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
    setNewCaseLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setNewCaseLoading(false)
    setShowNewCaseModal(false)
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
                    {/* Upload zone */}
                    <div className="border-2 border-dashed border-[#D5C3B6] rounded-lg p-8 text-center">
                      <Upload className="mx-auto text-[#D5C3B6] mb-2" size={32} />
                      <p className="text-[#75524C] mb-2">
                        Arrastra archivos aquí o haz clic para subir
                      </p>
                      <button className="text-[#5E8B8C] hover:underline text-sm">
                        Seleccionar archivos
                      </button>
                    </div>

                    {/* Documents table */}
                    <div className="overflow-x-auto">
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
                          {mockDocuments.map((doc) => (
                            <tr key={doc.id} className="border-b border-[#D5C3B6]/30 hover:bg-[#F8F7F4]">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <FileText size={16} className="text-[#5E8B8C]" />
                                  <span className="text-sm text-[#2D3C3C]">{doc.name}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-sm text-[#75524C]">{doc.type}</td>
                              <td className="py-3 px-4 text-sm text-[#75524C]">{doc.date}</td>
                              <td className="py-3 px-4 text-sm text-[#75524C]">{doc.uploadedBy}</td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button className="p-1 text-[#75524C] hover:text-[#5E8B8C]">
                                    <Eye size={16} />
                                  </button>
                                  <button className="p-1 text-[#75524C] hover:text-[#5E8B8C]">
                                    <Download size={16} />
                                  </button>
                                </div>
                              </td>
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
                      { date: "25 Ene 2024", event: "Documento subido", detail: "Certificado de Matrimonio.pdf", icon: FileText, bgColor: "bg-[#75524C]" },
                      { date: "22 Ene 2024", event: "Estado actualizado", detail: "El caso pasó a estado 'Activo'", icon: RefreshCw, bgColor: "bg-[#5E8B8C]" },
                      { date: "20 Ene 2024", event: "Mensaje recibido", detail: "Dra. María González envió un mensaje", icon: MessageSquare, bgColor: "bg-[#C27F79]" },
                      { date: "18 Ene 2024", event: "Cita agendada", detail: "Reunión programada para el 25 de Enero", icon: Calendar, bgColor: "bg-[#F2C94C]" },
                      { date: "15 Ene 2024", event: "Caso creado", detail: "El caso fue iniciado", icon: Plus, bgColor: "bg-[#2D3C3C]" },
                    ].map((item, index) => (
                      <div key={index} className="flex gap-4 mb-6 relative">
                        {/* Icon circle on the line */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 ${item.bgColor}`}>
                          <item.icon size={16} className={item.bgColor === "bg-[#F2C94C]" ? "text-[#2D3C3C]" : "text-white"} />
                        </div>
                        {/* Content */}
                        <div className="bg-white border border-[#D5C3B6]/30 rounded-lg p-4 flex-1 hover:shadow-md transition-shadow">
                          <p className="text-[#2D3C3C] font-medium">{item.event}</p>
                          <p className="text-sm text-[#75524C]">{item.detail}</p>
                          <p className="text-xs text-[#D5C3B6] mt-1">{item.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {detailTab === "steps" && (
                  <div className="space-y-3">
                    {mockNextSteps.map((step) => (
                      <div
                        key={step.id}
                        className={`flex items-start gap-4 p-4 border rounded-lg ${
                          step.completed ? "border-[#D5C3B6]/30 opacity-50" : "border-[#D5C3B6]/30"
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          step.completed ? "bg-[#5E8B8C]" : "border-2 border-[#D5C3B6]"
                        }`}>
                          {step.completed && <CheckCircle size={14} className="text-white" />}
                        </div>
                        <div className="flex-1">
                          <p className={`font-medium ${step.completed ? "line-through text-[#75524C]" : "text-[#2D3C3C]"}`}>
                            {step.text}
                          </p>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-xs text-[#75524C] flex items-center gap-1">
                              <Clock size={12} />
                              {step.dueDate}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              step.assignedTo === "client" 
                                ? "bg-[#5E8B8C]/10 text-[#5E8B8C]"
                                : "bg-[#75524C]/10 text-[#75524C]"
                            }`}>
                              {step.assignedTo === "client" ? "Tú" : "Abogado"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
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
                  className="w-full px-4 py-3 border border-[#D5C3B6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E8B8C]"
                  placeholder="Ej: Demanda laboral"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2D3C3C] mb-1">
                  Área legal
                </label>
                <select className="w-full px-4 py-3 border border-[#D5C3B6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E8B8C]">
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
                  className="w-full px-4 py-3 border border-[#D5C3B6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E8B8C]"
                  placeholder="Describe tu caso..."
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2D3C3C] mb-2">
                  Presupuesto disponible
                </label>
                <input
                  type="range"
                  min="0"
                  max="500"
                  defaultValue="150"
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
