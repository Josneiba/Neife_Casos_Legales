"use client"

import { useState, useEffect } from "react"
import {
  Search,
  DollarSign,
  Clock,
  MapPin,
  Filter,
  ChevronDown,
  X,
  Loader2,
  Send,
  FileText,
  User,
  AlertCircle,
  CheckCircle,
} from "lucide-react"
import { specialties, cities } from "@/lib/data"
import { getClientCasePosts } from "@/lib/queries/cases"
import { submitProposal } from "@/lib/actions/lawyer"

type ClientCase = {
  id: string
  client_id: string
  title: string
  type: string
  urgency: string
  budgetMin: number
  budgetMax: number
  city: string
  clientType: string
  description: string
  publishedAt: string
  responseNeeded: string
  caseType: string
}

function mapClientPost(row: Record<string, unknown>): ClientCase {
  return {
    id: String(row.id),
    client_id: String(row.client_id ?? ""),
    title: String(row.title ?? ""),
    type: String(row.type ?? ""),
    urgency: String(row.urgency ?? "normal"),
    budgetMin: Number(row.budget_min ?? 0),
    budgetMax: Number(row.budget_max ?? 0),
    city: String(row.city ?? ""),
    clientType: String(row.client_type ?? "Particular"),
    description: String(row.description ?? ""),
    publishedAt: row.created_at
      ? new Date(row.created_at as string).toLocaleDateString("es-CL")
      : "",
    responseNeeded: String(row.response_needed ?? ""),
    caseType: String(row.case_type ?? ""),
  }
}

export default function FindClientsPage() {
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [budgetMin, setBudgetMin] = useState(50)
  const [selectedSpecialty, setSelectedSpecialty] = useState("")
  const [urgency, setUrgency] = useState("")
  const [caseType, setCaseType] = useState("")
  const [selectedCity, setSelectedCity] = useState("")
  const [sortBy, setSortBy] = useState("recent")
  const [selectedCase, setSelectedCase] = useState<ClientCase | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [applyModalOpen, setApplyModalOpen] = useState(false)
  const [proposedRate, setProposedRate] = useState("120")
  const [proposalMessage, setProposalMessage] = useState("")
  const [estimatedTime, setEstimatedTime] = useState("1-2-weeks")
  const [applying, setApplying] = useState(false)
  const [proposalSent, setProposalSent] = useState(false)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  // Track cases already applied to
  const [appliedCases, setAppliedCases] = useState<Set<string>>(new Set())
  const [clientCases, setClientCases] = useState<ClientCase[]>([])

  useEffect(() => {
    getClientCasePosts()
      .then((rows) => {
        setClientCases(
          (rows ?? []).map((r) => mapClientPost(r as Record<string, unknown>))
        )
      })
      .finally(() => setLoading(false))
  }, [])

  const filteredCases = clientCases.filter((c) => {
    if (searchQuery && !c.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !c.type.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    if (selectedSpecialty && c.type !== selectedSpecialty) {
      return false
    }
    if (urgency && c.urgency !== urgency) {
      return false
    }
    if (caseType && c.caseType !== caseType) {
      return false
    }
    if (selectedCity && c.city !== selectedCity) {
      return false
    }
    if (c.budgetMax < budgetMin) {
      return false
    }
    return true
  })

  const clearFilters = () => {
    setSearchQuery("")
    setBudgetMin(50)
    setSelectedSpecialty("")
    setUrgency("")
    setCaseType("")
    setSelectedCity("")
  }

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCase?.client_id) return
    setApplying(true)
    const result = await submitProposal({
      post_id: selectedCase.id,
      client_id: selectedCase.client_id,
      message: proposalMessage,
      proposed_rate: Number(proposedRate),
      estimated_time: estimatedTime,
    })
    setApplying(false)
    if ("success" in result && result.success) {
      setProposalSent(true)
      setAppliedCases((prev) => new Set([...prev, selectedCase.id]))
    }
  }

  const urgencyColors = {
    normal: { bg: "bg-[#5E8B8C]/20", text: "text-[#5E8B8C]", label: "Normal" },
    urgent: { bg: "bg-[#F2C94C]/20", text: "text-[#F2C94C]", label: "Urgente" },
    "very-urgent": { bg: "bg-[#C27F79]/20", text: "text-[#C27F79]", label: "Muy Urgente" },
  }

  const FiltersPanel = () => (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#75524C]" size={18} />
          <input
            type="text"
            placeholder="Buscar por tipo de caso..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-[#D5C3B6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#75524C]"
          />
        </div>
      </div>

      {/* Budget */}
      <div>
        <h3 className="text-sm font-bold text-[#2D3C3C] uppercase tracking-wide mb-3 flex items-center gap-2">
          <DollarSign size={14} />
          Presupuesto del Cliente
        </h3>
        <div className="space-y-2">
          <p className="text-sm text-[#75524C]">Mostrar casos donde cliente paga:</p>
          <input
            type="range"
            min="0"
            max="400"
            value={budgetMin}
            onChange={(e) => setBudgetMin(parseInt(e.target.value))}
            className="w-full accent-[#75524C]"
          />
          <div className="flex justify-between text-sm text-[#75524C]">
            <span>$0</span>
            <span className="font-bold text-[#75524C]">Min ${budgetMin}/hr</span>
            <span>$400</span>
          </div>
        </div>
      </div>

      {/* Specialty */}
      <div>
        <h3 className="text-sm font-bold text-[#2D3C3C] uppercase tracking-wide mb-3">
          Área Legal
        </h3>
        <select
          value={selectedSpecialty}
          onChange={(e) => setSelectedSpecialty(e.target.value)}
          className="w-full px-4 py-2 border border-[#D5C3B6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#75524C]"
        >
          <option value="">Todas las áreas</option>
          {specialties.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Urgency */}
      <div>
        <h3 className="text-sm font-bold text-[#2D3C3C] uppercase tracking-wide mb-3">
          Urgencia
        </h3>
        <div className="space-y-2">
          {[
            { value: "", label: "Todas" },
            { value: "normal", label: "Normal" },
            { value: "urgent", label: "Urgente" },
            { value: "very-urgent", label: "Muy Urgente" },
          ].map((option) => (
            <label key={option.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="urgency"
                checked={urgency === option.value}
                onChange={() => setUrgency(option.value)}
                className="accent-[#75524C]"
              />
              <span className="text-sm text-[#75524C]">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Case type */}
      <div>
        <h3 className="text-sm font-bold text-[#2D3C3C] uppercase tracking-wide mb-3">
          Tipo de Caso
        </h3>
        <div className="space-y-2">
          {[
            { value: "", label: "Todos" },
            { value: "Asesoría puntual", label: "Asesoría puntual" },
            { value: "Representación completa", label: "Representación completa" },
            { value: "Revisión de documentos", label: "Revisión de documentos" },
          ].map((option) => (
            <label key={option.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={caseType === option.value}
                onChange={() => setCaseType(caseType === option.value ? "" : option.value)}
                className="accent-[#75524C] rounded"
              />
              <span className="text-sm text-[#75524C]">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* City */}
      <div>
        <h3 className="text-sm font-bold text-[#2D3C3C] uppercase tracking-wide mb-3">
          Ciudad
        </h3>
        <select
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          className="w-full px-4 py-2 border border-[#D5C3B6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#75524C]"
        >
          <option value="">Todas las ciudades</option>
          {cities.map((city) => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-2">
        <button
          onClick={clearFilters}
          className="w-full py-2 text-[#75524C] hover:text-[#2D3C3C] transition-colors"
        >
          Limpiar filtros
        </button>
      </div>

      {/* Results count */}
      <div className="pt-4 border-t border-[#D5C3B6]/30">
        <p className="text-sm text-[#75524C]">
          <span className="font-bold text-[#2D3C3C]">{filteredCases.length}</span> casos encontrados
        </p>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex gap-6">
        <div className="hidden lg:block w-72 shrink-0">
          <div className="bg-white border border-[#D5C3B6]/30 rounded-lg p-6 animate-pulse">
            <div className="h-10 bg-[#D5C3B6]/30 rounded mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 bg-[#D5C3B6]/30 rounded"></div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex-1 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-[#D5C3B6]/30 rounded-lg p-6 animate-pulse">
              <div className="h-6 bg-[#D5C3B6]/30 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-[#D5C3B6]/30 rounded w-1/2 mb-4"></div>
              <div className="h-20 bg-[#D5C3B6]/30 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Mobile filters button */}
      <button
        onClick={() => setMobileFiltersOpen(true)}
        className="lg:hidden flex items-center justify-center gap-2 px-4 py-3 bg-white border border-[#D5C3B6]/30 rounded-lg"
      >
        <Filter size={18} />
        Filtros
      </button>

      {/* Mobile filters overlay */}
      {mobileFiltersOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-50">
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-[#2D3C3C]">Filtros</h2>
              <button onClick={() => setMobileFiltersOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <FiltersPanel />
          </div>
        </div>
      )}

      {/* Desktop filters sidebar */}
      <div className="hidden lg:block w-72 shrink-0">
        <div className="bg-white border border-[#D5C3B6]/30 rounded-lg shadow-sm p-6 sticky top-6">
          <FiltersPanel />
        </div>
      </div>

      {/* Results */}
      <div className="flex-1">
        {/* Sort bar */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-[#75524C]">
            Mostrando <span className="font-bold text-[#2D3C3C]">{filteredCases.length}</span> casos
          </p>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none px-4 py-2 pr-10 border border-[#D5C3B6] rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#75524C]"
            >
              <option value="recent">Más recientes</option>
              <option value="budget-high">Mayor presupuesto</option>
              <option value="budget-low">Menor presupuesto</option>
              <option value="urgent">Más urgentes</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-[#75524C] pointer-events-none" size={16} />
          </div>
        </div>

        {/* Case cards */}
        {filteredCases.length === 0 ? (
          <div className="bg-white border border-[#D5C3B6]/30 rounded-lg p-12 text-center">
            <p className="text-[#75524C] mb-4">No encontramos casos con estos filtros.</p>
            <button
              onClick={clearFilters}
              className="text-[#75524C] hover:underline"
            >
              Ampliar búsqueda
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCases.map((clientCase) => {
              const urgencyStyle = urgencyColors[clientCase.urgency as keyof typeof urgencyColors]
              return (
                <div
                  key={clientCase.id}
                  className="bg-white border border-[#D5C3B6]/30 rounded-lg shadow-sm p-6"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className={`px-3 py-1 rounded text-xs font-medium ${urgencyStyle.bg} ${urgencyStyle.text}`}>
                      {urgencyStyle.label}
                    </span>
                    <span className="text-sm text-[#75524C]">{clientCase.type}</span>
                  </div>

                  <h3 className="text-lg font-bold text-[#2D3C3C] mb-2">{clientCase.title}</h3>
                  
                  <p className="text-[#75524C] mb-4 line-clamp-2">{clientCase.description}</p>

                  <div className="flex flex-wrap gap-4 mb-4 text-sm text-[#75524C]">
                    <span className="flex items-center gap-1">
                      <MapPin size={14} />
                      {clientCase.city}
                    </span>
                    <span>Cliente: {clientCase.clientType}</span>
                  </div>

                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <DollarSign size={18} className="text-[#75524C]" />
                      <span className="text-lg font-bold text-[#75524C]">
                        ${clientCase.budgetMin}-${clientCase.budgetMax}/hr
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-[#75524C] mb-4">
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {clientCase.publishedAt}
                    </span>
                    <span>Respuesta: {clientCase.responseNeeded}</span>
                    <span>{clientCase.caseType}</span>
                  </div>

                  {appliedCases.has(clientCase.id) ? (
                    <div className="flex items-center justify-between pt-3 border-t border-[#D5C3B6]/30">
                      <div className="flex items-center gap-1 text-xs text-[#5E8B8C] font-medium">
                        <CheckCircle size={14} />
                        Propuesta enviada
                      </div>
                      <button
                        onClick={() => {
                          setSelectedCase(clientCase)
                          setDrawerOpen(true)
                        }}
                        className="text-xs text-[#75524C] hover:underline"
                      >
                        Ver detalles
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedCase(clientCase)
                          setDrawerOpen(true)
                        }}
                        className="flex-1 py-2 border border-[#75524C] text-[#75524C] rounded-lg hover:bg-[#75524C]/10 transition-colors"
                      >
                        Ver Detalles
                      </button>
                      <button
                        onClick={() => {
                          setSelectedCase(clientCase)
                          setApplyModalOpen(true)
                        }}
                        className="flex-1 py-2 bg-[#75524C] text-white rounded-lg hover:bg-[#75524C]/90 transition-colors flex items-center justify-center gap-2"
                      >
                        Aplicar
                        <Send size={16} />
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Case Details Drawer */}
      {drawerOpen && selectedCase && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setDrawerOpen(false)}
          />
          {/* Drawer */}
          <div className="fixed inset-y-0 right-0 w-full max-w-[480px] bg-white shadow-2xl z-50 transform transition-transform duration-300 overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-[#D5C3B6]/30 p-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-bold text-[#2D3C3C]">Detalle del Caso</h2>
              <button
                onClick={() => setDrawerOpen(false)}
                className="text-[#75524C] hover:text-[#2D3C3C] transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Urgency & Type */}
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded text-xs font-medium ${urgencyColors[selectedCase.urgency as keyof typeof urgencyColors].bg} ${urgencyColors[selectedCase.urgency as keyof typeof urgencyColors].text}`}>
                  {urgencyColors[selectedCase.urgency as keyof typeof urgencyColors].label}
                </span>
                <span className="text-sm text-[#75524C]">{selectedCase.type}</span>
              </div>

              {/* Title */}
              <div>
                <h3 className="text-xl font-bold text-[#2D3C3C] mb-2">{selectedCase.title}</h3>
                <p className="text-sm text-[#D5C3B6]">Publicado {selectedCase.publishedAt}</p>
              </div>

              {/* Budget Section */}
              <div className="bg-[#F8F7F4] border border-[#D5C3B6] rounded-lg p-4">
                <h4 className="font-bold text-[#2D3C3C] mb-3 flex items-center gap-2">
                  <DollarSign size={18} />
                  Presupuesto
                </h4>
                <p className="text-2xl font-bold text-[#75524C] mb-2">
                  ${selectedCase.budgetMin} - ${selectedCase.budgetMax}/hr
                </p>
                <div className="flex items-center gap-4 text-sm text-[#75524C]">
                  <span className="flex items-center gap-1">
                    <User size={14} />
                    Tipo: {selectedCase.clientType}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin size={14} />
                    {selectedCase.city}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="font-bold text-[#2D3C3C] mb-2">Descripcion Completa</h4>
                <p className="text-[#75524C] leading-relaxed">{selectedCase.description}</p>
              </div>

              {/* Details */}
              <div>
                <h4 className="font-bold text-[#2D3C3C] mb-3">Detalles</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-[#D5C3B6]/30">
                    <span className="text-[#75524C]">Tipo de servicio</span>
                    <span className="font-medium text-[#2D3C3C]">{selectedCase.caseType}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-[#D5C3B6]/30">
                    <span className="text-[#75524C]">Urgencia</span>
                    <span className={`font-medium ${urgencyColors[selectedCase.urgency as keyof typeof urgencyColors].text}`}>
                      {urgencyColors[selectedCase.urgency as keyof typeof urgencyColors].label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-[#D5C3B6]/30">
                    <span className="text-[#75524C]">Plazo para respuesta</span>
                    <span className="font-medium text-[#2D3C3C]">{selectedCase.responseNeeded}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-[#75524C]">Documentos adjuntos</span>
                    <span className="font-medium text-[#2D3C3C] flex items-center gap-1">
                      <FileText size={14} />
                      2
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky bottom - Proposal form */}
            <div className="sticky bottom-0 bg-white border-t border-[#D5C3B6]/30 p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#2D3C3C] mb-1">
                  Tu tarifa propuesta:
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-lg text-[#75524C]">$</span>
                  <input
                    type="number"
                    value={proposedRate}
                    onChange={(e) => setProposedRate(e.target.value)}
                    className="w-24 px-3 py-2 border border-[#D5C3B6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#75524C] focus:border-transparent"
                  />
                  <span className="text-[#75524C]">/hr</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2D3C3C] mb-1">
                  Mensaje al cliente:
                </label>
                <textarea
                  rows={2}
                  value={proposalMessage}
                  onChange={(e) => setProposalMessage(e.target.value)}
                  placeholder="Escribe un breve mensaje..."
                  className="w-full px-3 py-2 border border-[#D5C3B6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#75524C] focus:border-transparent resize-none"
                />
              </div>
              <button 
                onClick={() => {
                  setDrawerOpen(false)
                  setApplyModalOpen(true)
                }}
                className="w-full py-3 bg-[#75524C] text-white rounded-lg font-semibold hover:bg-[#75524C]/90 transition-colors flex items-center justify-center gap-2"
              >
                <Send size={18} />
                Enviar Propuesta
              </button>
            </div>
          </div>
        </>
      )}

      {/* Apply Modal */}
      {applyModalOpen && selectedCase && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-[#D5C3B6]/30">
              <h2 className="text-lg font-bold text-[#2D3C3C]">Aplicar para este caso</h2>
              <button
                onClick={() => {
                  setApplyModalOpen(false)
                  setSelectedCase(null)
                  setProposalSent(false)
                }}
                className="text-[#75524C] hover:text-[#2D3C3C]"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-4">
              {!proposalSent ? (
                <>
                  <div className="bg-[#F8F7F4] rounded-lg p-4 mb-4">
                    <h3 className="font-bold text-[#2D3C3C] mb-1">{selectedCase.title}</h3>
                    <p className="text-sm text-[#75524C]">{selectedCase.type}</p>
                    <p className="text-sm text-[#75524C] mt-2">{selectedCase.description}</p>
                  </div>

                  <form onSubmit={handleApply} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#2D3C3C] mb-1">
                        Tu mensaje al cliente
                      </label>
                      <textarea
                        rows={4}
                        value={proposalMessage}
                        onChange={(e) => setProposalMessage(e.target.value)}
                        className="w-full px-4 py-3 border border-[#D5C3B6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#75524C]"
                        placeholder="Presentate y explica por que eres ideal para este caso..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#2D3C3C] mb-1">
                        Tu tarifa propuesta ($/hr)
                      </label>
                      <input
                        type="number"
                        value={proposedRate}
                        onChange={(e) => setProposedRate(e.target.value)}
                        className="w-full px-4 py-3 border border-[#D5C3B6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#75524C]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#2D3C3C] mb-1">
                        Tiempo estimado de resolucion
                      </label>
                      <select
                        value={estimatedTime}
                        onChange={(e) => setEstimatedTime(e.target.value)}
                        className="w-full px-4 py-3 border border-[#D5C3B6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#75524C]"
                      >
                        <option value="1-2-weeks">1-2 semanas</option>
                        <option value="1-month">1 mes</option>
                        <option value="2-3-months">2-3 meses</option>
                        <option value="6-months">6 meses</option>
                        <option value="1-year">1 ano o mas</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={applying}
                      className="w-full py-3 bg-[#75524C] text-white rounded-lg font-semibold hover:bg-[#75524C]/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {applying ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send size={18} />
                          Enviar Propuesta
                        </>
                      )}
                    </button>
                    <p className="text-xs text-[#75524C] text-center">
                      El cliente recibira tu propuesta y podra aceptarla o responder con preguntas.
                    </p>
                  </form>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-[#5E8B8C]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="text-[#5E8B8C]" size={32} />
                  </div>
                  <h3 className="font-bold text-[#2D3C3C] mb-2">Propuesta enviada</h3>
                  <p className="text-sm text-[#75524C] mb-1">
                    Tu propuesta fue enviada al cliente.
                  </p>
                  <p className="text-xs text-[#D5C3B6] mb-6">
                    Si el cliente acepta, el caso aparecera en &quot;Mis Casos&quot; automaticamente.
                  </p>
                  
                  {/* Resumen de lo enviado */}
                  <div className="bg-[#F8F7F4] rounded-lg p-4 text-left mb-6">
                    <p className="text-xs font-bold text-[#2D3C3C] mb-2">Resumen de tu propuesta:</p>
                    <div className="flex justify-between text-xs text-[#75524C] mb-1">
                      <span>Tarifa propuesta:</span>
                      <span className="font-bold text-[#2D3C3C]">${proposedRate}/hr</span>
                    </div>
                    <div className="flex justify-between text-xs text-[#75524C]">
                      <span>Caso:</span>
                      <span className="font-bold text-[#2D3C3C] truncate ml-2">{selectedCase.title}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setApplyModalOpen(false)
                      setProposalSent(false)
                      setSelectedCase(null)
                      setProposalMessage("")
                    }}
                    className="px-6 py-2 bg-[#5E8B8C] text-white rounded-lg text-sm"
                  >
                    Buscar mas casos
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
