"use client"

import { useState, useEffect } from "react"
import {
  Search,
  Star,
  CheckCircle,
  DollarSign,
  Clock,
  MapPin,
  X,
  Filter,
  ChevronDown,
  MessageSquare,
  Briefcase,
} from "lucide-react"
import { specialties } from "@/lib/data"
import {
  getLawyers,
  getLawyerReviews,
  lawyerSearchRowToCard,
  type LawyerCard,
} from "@/lib/queries/lawyers"
import { createCase } from "@/lib/actions/cases"
import { sendInitialMessage } from "@/lib/actions/messages"

type Lawyer = LawyerCard

export default function FindLawyerPage() {
  const [dataLoading, setDataLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [budgetRange, setBudgetRange] = useState([50, 300])
  const [selectedSpecialty, setSelectedSpecialty] = useState("")
  const [minRating, setMinRating] = useState(0)
  const [availableThisWeek, setAvailableThisWeek] = useState(false)
  const [freeConsult, setFreeConsult] = useState(false)
  const [paymentPlan, setPaymentPlan] = useState(false)
  const [contingency, setContingency] = useState(false)
  const [fixedRate, setFixedRate] = useState(false)
  const [sortBy, setSortBy] = useState("relevance")
  const [selectedLawyer, setSelectedLawyer] = useState<Lawyer | null>(null)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  
  // Message modal state
  const [messageModalOpen, setMessageModalOpen] = useState(false)
  const [messageToSend, setMessageToSend] = useState("")
  const [messageSent, setMessageSent] = useState(false)
  
  // New case modal state
  const [newCaseModalOpen, setNewCaseModalOpen] = useState(false)
  const [caseSubmitted, setCaseSubmitted] = useState(false)
  const [caseForm, setCaseForm] = useState({
    title: "",
    area: "",
    description: "",
    budget: 150
  })

  // Track contacted lawyers
  const [lawyers, setLawyers] = useState<LawyerCard[]>([])
  const [contactedLawyers, setContactedLawyers] = useState<Set<string>>(new Set())
  const [detailReviews, setDetailReviews] = useState<
    LawyerCard["reviewsList"]
  >()
  const [caseActionError, setCaseActionError] = useState("")
  const [messageActionError, setMessageActionError] = useState("")

  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").slice(0, 2)

  useEffect(() => {
    getLawyers()
      .then((rows) => {
        const cards = rows
          .map((r) => lawyerSearchRowToCard(r))
          .filter((c): c is LawyerCard => c != null)
        setLawyers(cards)
      })
      .finally(() => setDataLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedLawyer) {
      setDetailReviews(undefined)
      return
    }
    getLawyerReviews(selectedLawyer.id).then((rows) => {
      setDetailReviews(
        rows.map((r) => ({
          author:
            (r.client as { full_name?: string } | null)?.full_name ?? "Cliente",
          text: (r.text as string) ?? "",
          rating: r.rating as number,
          date: r.created_at
            ? new Date(r.created_at as string).toLocaleDateString("es-CL")
            : "",
        }))
      )
    })
  }, [selectedLawyer?.id])

  const filteredLawyers = lawyers.filter((lawyer) => {
    const rate = lawyer.rate
    if (rate < budgetRange[0] || rate > budgetRange[1]) return false
    if (selectedSpecialty && lawyer.specialty !== selectedSpecialty) {
      return false
    }
    if (minRating && lawyer.rating < minRating) {
      return false
    }
    if (availableThisWeek && !lawyer.available) {
      return false
    }
    if (freeConsult && !lawyer.freeConsult) {
      return false
    }
    if (paymentPlan && !lawyer.paymentPlan) {
      return false
    }
    if (contingency && !lawyer.contingency) {
      return false
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (
        !lawyer.name.toLowerCase().includes(q) &&
        !lawyer.tags.some((s) => s.toLowerCase().includes(q))
      ) {
        return false
      }
    }
    return true
  })

  const sortedLawyers = [...filteredLawyers].sort((a, b) => {
    switch (sortBy) {
      case "price-asc":
        return a.rate - b.rate
      case "price-desc":
        return b.rate - a.rate
      case "rating":
        return b.rating - a.rating
      case "availability":
        return (b.available ? 1 : 0) - (a.available ? 1 : 0)
      default:
        return 0
    }
  })

  const isInBudget = (rate: number) => rate >= budgetRange[0] && rate <= budgetRange[1]

  const clearFilters = () => {
    setSearchQuery("")
    setBudgetRange([50, 300])
    setSelectedSpecialty("")
    setMinRating(0)
    setAvailableThisWeek(false)
    setFreeConsult(false)
    setPaymentPlan(false)
    setContingency(false)
    setFixedRate(false)
  }

  const FiltersPanel = () => (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#75524C]" size={18} />
          <input
            type="text"
            placeholder="Buscar por nombre o especialidad..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-[#D5C3B6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E8B8C]"
          />
        </div>
      </div>

      {/* Budget - Dual Slider */}
      <div>
        <h3 className="text-sm font-bold text-[#2D3C3C] uppercase tracking-wide mb-3 flex items-center gap-2">
          <DollarSign size={14} />
          Tu Presupuesto
        </h3>
        <div className="space-y-3">
          <p className="text-sm text-[#75524C]">Tarifa por hora</p>
          <div className="relative h-2 mt-6 mb-4">
            {/* Track background */}
            <div className="absolute inset-0 bg-[#D5C3B6]/30 rounded-full" />
            {/* Active range */}
            <div 
              className="absolute h-full bg-[#5E8B8C] rounded-full"
              style={{
                left: `${(budgetRange[0] / 500) * 100}%`,
                right: `${100 - (budgetRange[1] / 500) * 100}%`
              }}
            />
            {/* Min slider */}
            <input
              type="range"
              min="0"
              max="500"
              value={budgetRange[0]}
              onChange={(e) => {
                const val = parseInt(e.target.value)
                if (val < budgetRange[1]) setBudgetRange([val, budgetRange[1]])
              }}
              className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#5E8B8C] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[#5E8B8C] [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:shadow-md"
            />
            {/* Max slider */}
            <input
              type="range"
              min="0"
              max="500"
              value={budgetRange[1]}
              onChange={(e) => {
                const val = parseInt(e.target.value)
                if (val > budgetRange[0]) setBudgetRange([budgetRange[0], val])
              }}
              className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#5E8B8C] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[#5E8B8C] [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:shadow-md"
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-[#5E8B8C]">${budgetRange[0]}</span>
            <span className="text-sm text-[#75524C]">-</span>
            <span className="text-sm font-bold text-[#5E8B8C]">${budgetRange[1]}/hr</span>
          </div>
        </div>
      </div>

      {/* Specialty */}
      <div>
        <h3 className="text-sm font-bold text-[#2D3C3C] uppercase tracking-wide mb-3">
          Especialidad
        </h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="specialty"
              checked={selectedSpecialty === ""}
              onChange={() => setSelectedSpecialty("")}
              className="accent-[#5E8B8C]"
            />
            <span className="text-sm text-[#75524C]">Todas</span>
          </label>
          {specialties.map((specialty) => (
            <label key={specialty} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="specialty"
                checked={selectedSpecialty === specialty}
                onChange={() => setSelectedSpecialty(specialty)}
                className="accent-[#5E8B8C]"
              />
              <span className="text-sm text-[#75524C]">{specialty}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Rating */}
      <div>
        <h3 className="text-sm font-bold text-[#2D3C3C] uppercase tracking-wide mb-3">
          Calificación Mínima
        </h3>
        <div className="space-y-2">
          {[5, 4, 3].map((rating) => (
            <label key={rating} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={minRating === rating}
                onChange={() => setMinRating(minRating === rating ? 0 : rating)}
                className="accent-[#5E8B8C] rounded"
              />
              <span className="flex items-center gap-1">
                {[...Array(rating)].map((_, i) => (
                  <Star key={i} size={14} className="fill-[#F2C94C] text-[#F2C94C]" />
                ))}
                <span className="text-sm text-[#75524C] ml-1">
                  {rating === 5 ? "5 estrellas" : `${rating}+ estrellas`}
                </span>
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Availability */}
      <div>
        <h3 className="text-sm font-bold text-[#2D3C3C] uppercase tracking-wide mb-3">
          Disponibilidad
        </h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={availableThisWeek}
              onChange={(e) => setAvailableThisWeek(e.target.checked)}
              className="accent-[#5E8B8C] rounded"
            />
            <span className="text-sm text-[#75524C]">Disponible esta semana</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={freeConsult}
              onChange={(e) => setFreeConsult(e.target.checked)}
              className="accent-[#5E8B8C] rounded"
            />
            <span className="text-sm text-[#75524C]">Consulta gratuita</span>
          </label>
        </div>
      </div>

      {/* Payment */}
      <div>
        <h3 className="text-sm font-bold text-[#2D3C3C] uppercase tracking-wide mb-3">
          Forma de Pago
        </h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={paymentPlan}
              onChange={(e) => setPaymentPlan(e.target.checked)}
              className="accent-[#5E8B8C] rounded"
            />
            <span className="text-sm text-[#75524C]">Planes de pago</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={contingency}
              onChange={(e) => setContingency(e.target.checked)}
              className="accent-[#5E8B8C] rounded"
            />
            <span className="text-sm text-[#75524C]">Cuota litis (éxito)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={fixedRate}
              onChange={(e) => setFixedRate(e.target.checked)}
              className="accent-[#5E8B8C] rounded"
            />
            <span className="text-sm text-[#75524C]">Tarifa fija</span>
          </label>
        </div>
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
          <span className="font-bold text-[#2D3C3C]">{sortedLawyers.length}</span> abogados encontrados
        </p>
      </div>
    </div>
  )

  if (dataLoading) {
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
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
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
            Mostrando <span className="font-bold text-[#2D3C3C]">{sortedLawyers.length}</span> resultados
          </p>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none px-4 py-2 pr-10 border border-[#D5C3B6] rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#5E8B8C]"
            >
              <option value="relevance">Por relevancia</option>
              <option value="price-asc">Precio: menor a mayor</option>
              <option value="price-desc">Precio: mayor a menor</option>
              <option value="rating">Por calificación</option>
              <option value="availability">Por disponibilidad</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-[#75524C] pointer-events-none" size={16} />
          </div>
        </div>

        {/* Lawyer cards grid */}
        {sortedLawyers.length === 0 ? (
          <div className="bg-white border border-[#D5C3B6]/30 rounded-lg p-12 text-center">
            <p className="text-[#75524C] mb-4">No encontramos abogados con estos filtros.</p>
            <button
              onClick={clearFilters}
              className="text-[#5E8B8C] hover:underline"
            >
              Ampliar búsqueda
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedLawyers.map((lawyer) => (
              <div
                key={lawyer.id}
                className={`bg-white border border-[#D5C3B6]/30 rounded-lg shadow-sm p-6 ${
                  !isInBudget(lawyer.rate) ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#5E8B8C] to-[#2D3C3C] flex items-center justify-center text-white font-bold">
                      {lawyer.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-[#2D3C3C]">{lawyer.name}</h3>
                        {lawyer.verified && (
                          <CheckCircle className="text-[#5E8B8C]" size={16} />
                        )}
                      </div>
                      <p className="text-sm text-[#75524C]">{lawyer.specialty}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <MapPin size={14} className="text-[#75524C]" />
                  <span className="text-sm text-[#75524C]">{lawyer.city}</span>
                </div>

                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className={i < Math.floor(lawyer.rating) ? "fill-[#F2C94C] text-[#F2C94C]" : "text-[#D5C3B6]"}
                    />
                  ))}
                  <span className="text-sm text-[#2D3C3C] font-medium ml-1">{lawyer.rating}</span>
                  <span className="text-sm text-[#75524C]">({lawyer.reviews} reseñas)</span>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <DollarSign size={16} className="text-[#2D3C3C]" />
                    <span className="text-lg font-bold text-[#2D3C3C]">${lawyer.rate}/hr</span>
                  </div>
                  {isInBudget(lawyer.rate) ? (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
                      <CheckCircle size={12} />
                      En tu presupuesto
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-[#C27F79]/10 text-[#C27F79] text-xs rounded-full">
                      Fuera de presupuesto
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm text-[#75524C] mb-3">
                  <span>{lawyer.experience} años exp</span>
                  <span>{lawyer.successRate}% éxito</span>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  {lawyer.available && (
                    <span className="flex items-center gap-1 text-xs text-[#5E8B8C]">
                      <span className="w-2 h-2 rounded-full bg-[#5E8B8C]"></span>
                      Disponible
                    </span>
                  )}
                  {lawyer.freeConsult && (
                    <span className="text-xs text-[#75524C]">Consulta gratuita</span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {lawyer.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-[#D5C3B6]/20 text-[#75524C] text-xs rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {contactedLawyers.has(lawyer.id) ? (
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#D5C3B6]/30">
                    <span className="flex items-center gap-1 text-xs text-[#5E8B8C]">
                      <CheckCircle size={13} /> Contactado
                    </span>
                    <button
                      onClick={() => setSelectedLawyer(lawyer)}
                      className="text-xs text-[#75524C] hover:underline"
                    >
                      Ver perfil
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedLawyer(lawyer)}
                      className="flex-1 py-2 border border-[#5E8B8C] text-[#5E8B8C] rounded-lg hover:bg-[#5E8B8C]/10 transition-colors"
                    >
                      Ver Perfil
                    </button>
                    <button 
                      onClick={() => { setSelectedLawyer(lawyer); setMessageModalOpen(true) }}
                      className="flex-1 py-2 bg-[#5E8B8C] text-white rounded-lg hover:bg-[#5E8B8C]/90 transition-colors"
                    >
                      Contactar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lawyer profile drawer */}
      {selectedLawyer && (
        <div className="fixed inset-0 bg-black/50 z-50">
          <div
            className="absolute inset-y-0 right-0 w-full max-w-lg bg-white shadow-xl overflow-y-auto animate-slide-in"
          >
            <div className="sticky top-0 bg-white border-b border-[#D5C3B6]/30 p-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-bold text-[#2D3C3C]">Perfil del Abogado</h2>
              <button
                onClick={() => setSelectedLawyer(null)}
                className="text-[#75524C] hover:text-[#2D3C3C]"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-[#5E8B8C] to-[#2D3C3C] flex items-center justify-center text-white text-2xl font-bold">
                  {selectedLawyer.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-[#2D3C3C]">{selectedLawyer.name}</h3>
                    {selectedLawyer.verified && (
                      <CheckCircle className="text-[#5E8B8C]" size={18} />
                    )}
                  </div>
                  <p className="text-[#75524C]">{selectedLawyer.specialty}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className={i < Math.floor(selectedLawyer.rating) ? "fill-[#F2C94C] text-[#F2C94C]" : "text-[#D5C3B6]"}
                      />
                    ))}
                    <span className="text-sm font-medium ml-1">{selectedLawyer.rating}</span>
                    <span className="text-sm text-[#75524C]">({selectedLawyer.reviews} reseñas)</span>
                  </div>
                </div>
              </div>

              {/* Rates section */}
              <div className="bg-[#F8F7F4] border border-[#D5C3B6] rounded-lg p-4">
                <h4 className="font-bold text-[#2D3C3C] mb-4">Tarifas</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[#75524C]">Tarifa por hora</span>
                    <span className="text-2xl font-bold text-[#2D3C3C]">${selectedLawyer.rate}/hr</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#75524C]">Consulta gratuita</span>
                    <span className={selectedLawyer.freeConsult ? "text-[#5E8B8C]" : "text-[#C27F79]"}>
                      {selectedLawyer.freeConsult ? "Sí" : "No"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#75524C]">Acepta planes de pago</span>
                    <span className={selectedLawyer.paymentPlan ? "text-[#5E8B8C]" : "text-[#C27F79]"}>
                      {selectedLawyer.paymentPlan ? "Sí" : "No"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#75524C]">Cuota litis</span>
                    <span className={selectedLawyer.contingency ? "text-[#5E8B8C]" : "text-[#C27F79]"}>
                      {selectedLawyer.contingency ? "Sí" : "No"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div>
                <h4 className="font-bold text-[#2D3C3C] mb-2">Biografía</h4>
                <p className="text-[#75524C]">{selectedLawyer.bio}</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#5E8B8C]/10 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-[#2D3C3C]">{selectedLawyer.experience}</p>
                  <p className="text-sm text-[#75524C]">Años de experiencia</p>
                </div>
                <div className="bg-[#5E8B8C]/10 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-[#2D3C3C]">{selectedLawyer.successRate}%</p>
                  <p className="text-sm text-[#75524C]">Tasa de éxito</p>
                </div>
              </div>

              {/* Tags */}
              <div>
                <h4 className="font-bold text-[#2D3C3C] mb-2">Especialidades</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedLawyer.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-[#5E8B8C] text-white text-sm rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Client reviews */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-[#2D3C3C]">Resenas de clientes</h4>
                  <span className="text-sm text-[#75524C]">{selectedLawyer.reviews} en total</span>
                </div>
                <div className="space-y-3">
                  {detailReviews?.slice(0, 3).map((review, i) => (
                    <div key={i} className="bg-[#F8F7F4] rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-r from-[#5E8B8C] to-[#2D3C3C] flex items-center justify-center text-white text-xs font-bold">
                            {review.author.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-[#2D3C3C]">{review.author}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(review.rating)].map((_, j) => (
                            <Star key={j} size={12} className="fill-[#F2C94C] text-[#F2C94C]" />
                          ))}
                          <span className="text-xs text-[#D5C3B6] ml-1">{review.date}</span>
                        </div>
                      </div>
                      <p className="text-sm text-[#75524C] leading-relaxed">&quot;{review.text}&quot;</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Availability */}
              <div>
                <h4 className="font-bold text-[#2D3C3C] mb-2">Disponibilidad</h4>
                <div className="flex items-center gap-2">
                  {selectedLawyer.available ? (
                    <>
                      <span className="w-3 h-3 rounded-full bg-[#5E8B8C]"></span>
                      <span className="text-[#5E8B8C]">Disponible esta semana</span>
                    </>
                  ) : (
                    <>
                      <span className="w-3 h-3 rounded-full bg-gray-400"></span>
                      <span className="text-[#75524C]">No disponible actualmente</span>
                    </>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="flex items-center gap-2 text-[#75524C]">
                <MapPin size={18} />
                <span>{selectedLawyer.city}, Chile</span>
              </div>
            </div>

            {/* Fixed bottom buttons */}
            <div className="sticky bottom-0 bg-white border-t border-[#D5C3B6]/30 p-4 flex gap-4">
              <button 
                onClick={() => setMessageModalOpen(true)}
                className="flex-1 py-3 border border-[#5E8B8C] text-[#5E8B8C] rounded-lg hover:bg-[#5E8B8C]/10 transition-colors flex items-center justify-center gap-2"
              >
                <MessageSquare size={18} />
                Enviar Mensaje
              </button>
              <button 
                onClick={() => setNewCaseModalOpen(true)}
                className="flex-1 py-3 bg-[#75524C] text-white rounded-lg hover:bg-[#75524C]/90 transition-colors flex items-center justify-center gap-2"
              >
                <Briefcase size={18} />
                Iniciar Caso
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {messageModalOpen && selectedLawyer && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#5E8B8C] to-[#2D3C3C] flex items-center justify-center text-white font-bold text-sm">
                {getInitials(selectedLawyer.name)}
              </div>
              <div>
                <p className="font-bold text-[#2D3C3C]">{selectedLawyer.name}</p>
                <p className="text-sm text-[#75524C]">{selectedLawyer.specialty}</p>
              </div>
              <button 
                onClick={() => { setMessageModalOpen(false); setMessageSent(false); setMessageToSend("") }} 
                className="ml-auto text-[#75524C] hover:text-[#2D3C3C]"
              >
                <X size={20} />
              </button>
            </div>

            {!messageSent ? (
              <>
                <p className="text-sm text-[#75524C] mb-3">
                  Escribe un mensaje inicial describiendo tu situacion:
                </p>
                <textarea
                  value={messageToSend}
                  onChange={(e) => setMessageToSend(e.target.value)}
                  placeholder="Hola, necesito asesoria sobre..."
                  rows={4}
                  className="w-full px-4 py-3 border border-[#D5C3B6] rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#5E8B8C] text-sm"
                />
                {messageActionError && (
                  <p className="text-xs text-[#C27F79] mt-2">{messageActionError}</p>
                )}
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => setMessageModalOpen(false)}
                    className="flex-1 py-2 border border-[#D5C3B6] text-[#75524C] rounded-lg hover:bg-[#F8F7F4] text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!messageToSend.trim() || !selectedLawyer) return
                      setMessageActionError("")
                      const result = await sendInitialMessage({
                        lawyer_id: selectedLawyer.id,
                        text: messageToSend,
                      })
                      if ("success" in result && result.success) {
                        setMessageSent(true)
                      } else {
                        setMessageActionError(
                          "error" in result && result.error
                            ? result.error
                            : "No se pudo enviar el mensaje."
                        )
                      }
                    }}
                    disabled={!messageToSend.trim()}
                    className="flex-1 py-2 bg-[#5E8B8C] text-white rounded-lg hover:bg-[#5E8B8C]/90 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Enviar Mensaje
                  </button>
                </div>
              </>
            ) : (
              /* Estado de exito */
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-[#5E8B8C]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="text-[#5E8B8C]" size={32} />
                </div>
                <h3 className="font-bold text-[#2D3C3C] mb-2">Mensaje enviado</h3>
                <p className="text-sm text-[#75524C] mb-4">
                  {selectedLawyer.name} recibira tu mensaje y te respondera pronto.
                </p>
                <p className="text-xs text-[#D5C3B6]">
                  Tiempo de respuesta promedio: 2-4 horas
                </p>
                <button
                  onClick={() => {
                    if (selectedLawyer) setContactedLawyers(prev => new Set([...prev, selectedLawyer.id]))
                    setMessageModalOpen(false)
                    setMessageSent(false)
                    setMessageToSend("")
                    setSelectedLawyer(null)
                  }}
                  className="mt-4 px-6 py-2 bg-[#5E8B8C] text-white rounded-lg text-sm"
                >
                  Ir a Mensajes
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Case Modal */}
      {newCaseModalOpen && selectedLawyer && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            {!caseSubmitted ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-[#2D3C3C]">Iniciar caso con</h2>
                  <button onClick={() => setNewCaseModalOpen(false)}><X size={20} className="text-[#75524C]" /></button>
                </div>

                {/* Abogado seleccionado */}
                <div className="flex items-center gap-3 p-3 bg-[#5E8B8C]/10 rounded-lg mb-6 border border-[#5E8B8C]/20">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#5E8B8C] to-[#2D3C3C] flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {getInitials(selectedLawyer.name)}
                  </div>
                  <div>
                    <p className="font-bold text-[#2D3C3C] text-sm">{selectedLawyer.name}</p>
                    <p className="text-xs text-[#75524C]">{selectedLawyer.specialty} - ${selectedLawyer.rate}/hr</p>
                  </div>
                  <div className="ml-auto">
                    <span className="text-xs bg-[#5E8B8C] text-white px-2 py-1 rounded-full">Seleccionado</span>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Titulo */}
                  <div>
                    <label className="block text-sm font-medium text-[#75524C] mb-1">Titulo del caso *</label>
                    <input
                      type="text"
                      value={caseForm.title}
                      onChange={(e) => setCaseForm({...caseForm, title: e.target.value})}
                      placeholder="Ej: Demanda laboral por despido"
                      className="w-full px-4 py-2 border border-[#D5C3B6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E8B8C] text-sm"
                    />
                  </div>

                  {/* Area */}
                  <div>
                    <label className="block text-sm font-medium text-[#75524C] mb-1">Area legal *</label>
                    <select
                      value={caseForm.area || selectedLawyer.specialty}
                      onChange={(e) => setCaseForm({...caseForm, area: e.target.value})}
                      className="w-full px-4 py-2 border border-[#D5C3B6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E8B8C] text-sm"
                    >
                      {specialties.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  {/* Descripcion */}
                  <div>
                    <label className="block text-sm font-medium text-[#75524C] mb-1">Describe tu situacion *</label>
                    <textarea
                      value={caseForm.description}
                      onChange={(e) => setCaseForm({...caseForm, description: e.target.value})}
                      placeholder="Explica brevemente que necesitas resolver..."
                      rows={3}
                      className="w-full px-4 py-2 border border-[#D5C3B6] rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#5E8B8C] text-sm"
                    />
                  </div>

                  {/* Presupuesto */}
                  <div>
                    <label className="block text-sm font-medium text-[#75524C] mb-2">
                      Tu presupuesto por hora: <span className="font-bold text-[#2D3C3C]">${caseForm.budget}/hr</span>
                    </label>
                    {caseForm.budget >= selectedLawyer.rate ? (
                      <p className="text-xs text-green-600 mb-2 flex items-center gap-1">
                        <CheckCircle size={12} /> Tu presupuesto cubre la tarifa de este abogado (${selectedLawyer.rate}/hr)
                      </p>
                    ) : (
                      <p className="text-xs text-[#C27F79] mb-2">
                        Tu presupuesto (${caseForm.budget}/hr) es menor que la tarifa del abogado (${selectedLawyer.rate}/hr). Puedes continuar y negociar directamente.
                      </p>
                    )}
                    <input
                      type="range"
                      min="0" max="500"
                      value={caseForm.budget}
                      onChange={(e) => setCaseForm({...caseForm, budget: parseInt(e.target.value)})}
                      className="w-full accent-[#5E8B8C]"
                    />
                    <div className="flex justify-between text-xs text-[#75524C] mt-1">
                      <span>$0</span><span>$500+</span>
                    </div>
                  </div>
                </div>

                {caseActionError && (
                  <p className="text-sm text-[#C27F79]">{caseActionError}</p>
                )}

                <div className="flex gap-3 mt-6">
                  <button onClick={() => setNewCaseModalOpen(false)} className="flex-1 py-3 border border-[#D5C3B6] text-[#75524C] rounded-lg text-sm">
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!caseForm.title || !caseForm.description || !selectedLawyer)
                        return
                      setCaseActionError("")
                      const result = await createCase({
                        title: caseForm.title,
                        type:
                          caseForm.area ||
                          selectedLawyer.specialty ||
                          selectedLawyer.tags[0] ||
                          "",
                        description: caseForm.description,
                        budget: caseForm.budget,
                        lawyer_id: selectedLawyer.id,
                        message: `Hola, quiero iniciar un caso: ${caseForm.description.slice(0, 100)}`,
                      })
                      if ("success" in result && result.success) {
                        setCaseSubmitted(true)
                      } else {
                        setCaseActionError(
                          "error" in result && result.error
                            ? result.error
                            : "Error al crear el caso. Intenta de nuevo."
                        )
                      }
                    }}
                    disabled={!caseForm.title || !caseForm.description}
                    className="flex-1 py-3 bg-[#75524C] text-white rounded-lg hover:bg-[#75524C]/90 text-sm disabled:opacity-50"
                  >
                    Crear Caso
                  </button>
                </div>
              </>
            ) : (
              /* Estado de exito */
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-[#75524C]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="text-[#75524C]" size={32} />
                </div>
                <h3 className="font-bold text-[#2D3C3C] text-lg mb-2">Caso creado exitosamente</h3>
                <p className="text-sm text-[#75524C] mb-2">
                  Tu caso fue enviado a <strong>{selectedLawyer.name}</strong>
                </p>
                <p className="text-xs text-[#D5C3B6] mb-6">Recibiras una respuesta en las proximas 24 horas</p>
                <button
                  onClick={() => {
                    if (selectedLawyer) setContactedLawyers(prev => new Set([...prev, selectedLawyer.id]))
                    setNewCaseModalOpen(false)
                    setCaseSubmitted(false)
                    setCaseForm({ title: "", area: "", description: "", budget: 150 })
                    setSelectedLawyer(null)
                  }}
                  className="px-6 py-2 bg-[#75524C] text-white rounded-lg text-sm"
                >
                  Ver mis casos
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
