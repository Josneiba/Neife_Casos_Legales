"use client"

import { useState, useRef } from "react"
import {
  Camera,
  Save,
  Eye,
  Edit3,
  Plus,
  X,
  Star,
  Loader2,
  CheckCircle,
  Briefcase,
  GraduationCap,
  MapPin,
} from "lucide-react"
import { specialties, cities } from "@/lib/data"

const daysOfWeek = ["L", "M", "M", "J", "V", "S", "D"]
const timeSlots = [
  { label: "Mañana", time: "9-13h" },
  { label: "Tarde", time: "14-18h" },
  { label: "Noche", time: "19-21h" },
]

const mockExperience = [
  {
    id: "1",
    company: "Estudio Jurídico González & Asociados",
    position: "Socia Fundadora",
    period: "2018 - Presente",
    description: "Dirección del área de derecho de familia y mediación.",
  },
  {
    id: "2",
    company: "Corporación de Asistencia Judicial",
    position: "Abogada Asistente",
    period: "2012 - 2018",
    description: "Atención de casos de familia para personas de escasos recursos.",
  },
]

const mockReviews = [
  {
    id: "1",
    initials: "CM",
    name: "C.M.",
    rating: 5,
    text: "Excelente profesional, muy comprometida con mi caso. Logró un acuerdo favorable en tiempo récord.",
    date: "Hace 2 semanas",
  },
  {
    id: "2",
    initials: "JR",
    name: "J.R.",
    rating: 5,
    text: "La Dra. González me explicó todo el proceso con paciencia. Muy recomendada.",
    date: "Hace 1 mes",
  },
  {
    id: "3",
    initials: "LP",
    name: "L.P.",
    rating: 4,
    text: "Buen servicio, aunque a veces tardaba en responder. Resultado final satisfactorio.",
    date: "Hace 2 meses",
  },
]

export default function LawyerProfilePage() {
  const [editMode, setEditMode] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Personal info
  const [profile, setProfile] = useState({
    name: "Dra. María González",
    title: "Abogada Especialista en Derecho de Familia",
    bio: "Especialista en derecho de familia con más de 12 años de experiencia en divorcios, tuición y pensiones alimenticias. Egresada de la Universidad de Chile. Mi enfoque es siempre buscar soluciones que protejan el bienestar de todas las partes, especialmente de los menores involucrados.",
    city: "Santiago",
    phone: "+56 9 1234 5678",
    email: "maria.gonzalez@neife.cl",
    licenseNumber: "CL-12345-2012",
  })

  // Specialties
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([
    "Derecho de Familia",
    "Derecho Civil",
  ])

  // Rates
  const [rates, setRates] = useState({
    hourlyRate: 120,
    freeConsult: true,
    paymentPlan: true,
    contingency: false,
    contingencyPercent: 30,
    fixedRate: "",
    monthlyRetainer: "",
    minBudget: 50,
  })

  // Availability
  const [availability, setAvailability] = useState<Record<string, boolean>>({
    "0-0": true, "0-1": true, "0-2": false,
    "1-0": true, "1-1": true, "1-2": false,
    "2-0": true, "2-1": false, "2-2": false,
    "3-0": true, "3-1": true, "3-2": false,
    "4-0": true, "4-1": true, "4-2": false,
    "5-0": false, "5-1": false, "5-2": false,
    "6-0": false, "6-1": false, "6-2": false,
  })

  // Experience
  const [experience, setExperience] = useState(mockExperience)
  const [showAddExperience, setShowAddExperience] = useState(false)
  const [newExperience, setNewExperience] = useState({
    company: "",
    position: "",
    period: "",
    description: "",
  })

  const toggleSpec = (spec: string) => {
    if (!editMode) return
    setSelectedSpecs((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]
    )
  }

  const toggleAvailability = (key: string) => {
    if (!editMode) return
    setAvailability((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSave = () => {
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }, 1000)
  }

  const addExperience = () => {
    if (newExperience.company && newExperience.position) {
      setExperience((prev) => [
        ...prev,
        { ...newExperience, id: Date.now().toString() },
      ])
      setNewExperience({ company: "", position: "", period: "", description: "" })
      setShowAddExperience(false)
    }
  }

  const removeExperience = (id: string) => {
    setExperience((prev) => prev.filter((e) => e.id !== id))
  }

  const averageRating = 4.9
  const totalReviews = 47

  // Public Profile View
  if (!editMode) {
    return (
      <div className="max-w-2xl mx-auto pb-24">
        {/* Header con boton volver a edicion */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs text-[#75524C] uppercase tracking-wide mb-1">Vista previa — asi te ven los clientes</p>
            <h1 className="text-xl font-bold text-[#2D3C3C]">Perfil Publico</h1>
          </div>
          <button
            onClick={() => setEditMode(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-[#D5C3B6] text-[#75524C] rounded-lg hover:bg-[#F8F7F4] transition-colors"
          >
            <Edit3 size={16} />
            Volver a editar
          </button>
        </div>

        {/* Card publica — replica exacta del lawyer card de find-lawyer */}
        <div className="bg-white border border-[#D5C3B6]/30 rounded-xl shadow-sm overflow-hidden">
          
          {/* Header de tarjeta */}
          <div className="bg-gradient-to-r from-[#2D3C3C] to-[#5E8B8C]/80 p-6">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-[#5E8B8C] to-[#2D3C3C] flex items-center justify-center text-white font-bold text-2xl border-4 border-white/20 shrink-0">
                MG
              </div>
              <div className="text-white">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h2 className="text-xl font-bold">{profile.name || "Dr. Carlos Rodriguez"}</h2>
                  <span className="flex items-center gap-1 text-xs bg-[#5E8B8C] px-2 py-0.5 rounded-full">
                    <CheckCircle size={10} /> Verificado
                  </span>
                </div>
                <p className="text-white/80 text-sm mb-2">{profile.title || "Abogado especialista"}</p>
                <div className="flex items-center gap-3 text-sm text-white/70 flex-wrap">
                  <span className="flex items-center gap-1"><MapPin size={12} />{profile.city || "Santiago"}</span>
                  <span>•</span>
                  <span>12 anos exp.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">

            {/* Tarifas — lo mas importante */}
            <div className="bg-[#F8F7F4] border border-[#D5C3B6] rounded-lg p-4">
              <h3 className="font-bold text-[#2D3C3C] mb-3">Tarifas</h3>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-3xl font-bold text-[#2D3C3C]">${rates.hourlyRate || "120"}</span>
                <span className="text-[#75524C]">/hora</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className={`text-center p-2 rounded-lg text-xs ${rates.freeConsult ? "bg-[#5E8B8C]/10 text-[#5E8B8C]" : "bg-[#D5C3B6]/20 text-[#D5C3B6]"}`}>
                  {rates.freeConsult ? "✓" : "✗"} Consulta<br/>gratuita
                </div>
                <div className={`text-center p-2 rounded-lg text-xs ${rates.paymentPlan ? "bg-[#5E8B8C]/10 text-[#5E8B8C]" : "bg-[#D5C3B6]/20 text-[#D5C3B6]"}`}>
                  {rates.paymentPlan ? "✓" : "✗"} Plan<br/>de pago
                </div>
                <div className={`text-center p-2 rounded-lg text-xs ${rates.contingency ? "bg-[#5E8B8C]/10 text-[#5E8B8C]" : "bg-[#D5C3B6]/20 text-[#D5C3B6]"}`}>
                  {rates.contingency ? "✓" : "✗"} Cuota<br/>litis
                </div>
              </div>
            </div>

            {/* Rating mock */}
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {[1,2,3,4,5].map(i => <Star key={i} size={18} className="fill-[#F2C94C] text-[#F2C94C]" />)}
              </div>
              <span className="font-bold text-[#2D3C3C]">4.9</span>
              <span className="text-sm text-[#75524C]">(47 resenas)</span>
            </div>

            {/* Especialidades */}
            {selectedSpecs.length > 0 && (
              <div>
                <h3 className="font-bold text-[#2D3C3C] mb-2">Especialidades</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedSpecs.map(s => (
                    <span key={s} className="px-3 py-1 bg-[#5E8B8C] text-white text-sm rounded-full">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Bio */}
            {profile.bio && (
              <div>
                <h3 className="font-bold text-[#2D3C3C] mb-2">Sobre mi</h3>
                <p className="text-[#75524C] text-sm leading-relaxed">{profile.bio}</p>
              </div>
            )}

            {/* Botones — como los veria el cliente (deshabilitados en preview) */}
            <div className="pt-2 border-t border-[#D5C3B6]/30 flex gap-3">
              <button disabled className="flex-1 py-3 border border-[#5E8B8C] text-[#5E8B8C] rounded-lg text-sm opacity-60 cursor-not-allowed">
                Enviar Mensaje
              </button>
              <button disabled className="flex-1 py-3 bg-[#75524C] text-white rounded-lg text-sm opacity-60 cursor-not-allowed">
                Iniciar Caso
              </button>
            </div>
            <p className="text-xs text-center text-[#D5C3B6]">Vista previa — los botones reales funcionan para los clientes</p>
          </div>
        </div>

        {/* Tips para mejorar el perfil */}
        <div className="mt-6 bg-[#F2C94C]/10 border border-[#F2C94C]/30 rounded-lg p-4">
          <p className="text-sm font-bold text-[#2D3C3C] mb-2">Consejos para atraer mas clientes</p>
          <ul className="space-y-1 text-sm text-[#75524C]">
            <li>• Activa &quot;Consulta gratuita&quot; — aumenta un 40% las solicitudes</li>
            <li>• Agrega tu bio completa — los clientes confian mas en abogados con historia</li>
            <li>• Configura &quot;Plan de pago&quot; — abre tu servicio a mas clientes</li>
          </ul>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto pb-24">
      {/* Header with toggle */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#2D3C3C]">Mi Perfil</h1>
        <button
          onClick={() => setEditMode(!editMode)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            editMode
              ? "bg-[#5E8B8C] text-white"
              : "bg-white border border-[#D5C3B6] text-[#75524C]"
          }`}
        >
          {editMode ? <Edit3 size={16} /> : <Eye size={16} />}
          {editMode ? "Modo Edicion" : "Vista Publica"}
        </button>
      </div>

      {/* Section 1: Personal Information */}
      <section className="bg-white border border-[#D5C3B6]/30 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-bold text-[#2D3C3C] mb-4">Información Personal</h2>
        
        <div className="flex flex-col md:flex-row gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div
              className="relative w-24 h-24 rounded-full bg-gradient-to-r from-[#5E8B8C] to-[#2D3C3C] flex items-center justify-center text-white font-bold text-2xl cursor-pointer group"
              onClick={() => editMode && fileInputRef.current?.click()}
            >
              MG
              {editMode && (
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={24} className="text-white" />
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* Fields */}
          <div className="flex-1 grid gap-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#75524C] mb-1">
                  Nombre completo
                </label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  disabled={!editMode}
                  className="w-full px-4 py-2 border border-[#D5C3B6]/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E8B8C] focus:border-transparent disabled:bg-[#F8F7F4] disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#75524C] mb-1">
                  Título profesional
                </label>
                <input
                  type="text"
                  value={profile.title}
                  onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                  disabled={!editMode}
                  className="w-full px-4 py-2 border border-[#D5C3B6]/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E8B8C] focus:border-transparent disabled:bg-[#F8F7F4] disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#75524C] mb-1">
                Biografía
              </label>
              <textarea
                rows={4}
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                disabled={!editMode}
                className="w-full px-4 py-2 border border-[#D5C3B6]/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E8B8C] focus:border-transparent disabled:bg-[#F8F7F4] disabled:cursor-not-allowed resize-none"
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#75524C] mb-1">
                  Ciudad
                </label>
                <select
                  value={profile.city}
                  onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                  disabled={!editMode}
                  className="w-full px-4 py-2 border border-[#D5C3B6]/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E8B8C] focus:border-transparent disabled:bg-[#F8F7F4] disabled:cursor-not-allowed"
                >
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#75524C] mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  disabled={!editMode}
                  className="w-full px-4 py-2 border border-[#D5C3B6]/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E8B8C] focus:border-transparent disabled:bg-[#F8F7F4] disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#75524C] mb-1">
                  Número de colegiado
                </label>
                <input
                  type="text"
                  value={profile.licenseNumber}
                  onChange={(e) => setProfile({ ...profile, licenseNumber: e.target.value })}
                  disabled={!editMode}
                  className="w-full px-4 py-2 border border-[#D5C3B6]/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E8B8C] focus:border-transparent disabled:bg-[#F8F7F4] disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#75524C] mb-1">
                Email
              </label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                disabled={!editMode}
                className="w-full px-4 py-2 border border-[#D5C3B6]/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E8B8C] focus:border-transparent disabled:bg-[#F8F7F4] disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Specialties */}
      <section className="bg-white border border-[#D5C3B6]/30 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-bold text-[#2D3C3C] mb-4">Especialidades</h2>
        <div className="flex flex-wrap gap-2">
          {specialties.map((spec) => (
            <button
              key={spec}
              onClick={() => toggleSpec(spec)}
              disabled={!editMode}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors disabled:cursor-not-allowed ${
                selectedSpecs.includes(spec)
                  ? "bg-[#5E8B8C] text-white"
                  : "bg-[#D5C3B6]/30 text-[#75524C] hover:bg-[#D5C3B6]/60"
              }`}
            >
              {spec}
            </button>
          ))}
        </div>
      </section>

      {/* Section 3: Rates */}
      <section className="bg-[#F8F7F4] border-2 border-[#D5C3B6] rounded-lg p-6 mb-6">
        <h2 className="text-lg font-bold text-[#2D3C3C] mb-4">Tarifas</h2>

        {/* Hourly rate */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-[#75524C] mb-2">
            Tarifa por hora
          </label>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-[#2D3C3C]">$</span>
            <input
              type="number"
              value={rates.hourlyRate}
              onChange={(e) => setRates({ ...rates, hourlyRate: Number(e.target.value) })}
              disabled={!editMode}
              className="w-32 px-4 py-2 text-2xl font-bold text-[#2D3C3C] border border-[#D5C3B6]/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E8B8C] focus:border-transparent disabled:bg-white disabled:cursor-not-allowed"
            />
            <span className="text-lg text-[#75524C]">/hr</span>
          </div>
        </div>

        <div className="border-t border-[#D5C3B6]/50 pt-4 space-y-4">
          {/* Free consult toggle */}
          <div className="flex items-center justify-between">
            <span className="text-[#2D3C3C]">¿Ofreces consulta gratuita?</span>
            <button
              onClick={() => editMode && setRates({ ...rates, freeConsult: !rates.freeConsult })}
              disabled={!editMode}
              className={`relative w-12 h-6 rounded-full transition-colors disabled:cursor-not-allowed ${
                rates.freeConsult ? "bg-[#5E8B8C]" : "bg-[#D5C3B6]"
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  rates.freeConsult ? "translate-x-7" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Payment plan toggle */}
          <div className="flex items-center justify-between">
            <span className="text-[#2D3C3C]">¿Aceptas planes de pago?</span>
            <button
              onClick={() => editMode && setRates({ ...rates, paymentPlan: !rates.paymentPlan })}
              disabled={!editMode}
              className={`relative w-12 h-6 rounded-full transition-colors disabled:cursor-not-allowed ${
                rates.paymentPlan ? "bg-[#5E8B8C]" : "bg-[#D5C3B6]"
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  rates.paymentPlan ? "translate-x-7" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Contingency toggle */}
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[#2D3C3C]">¿Trabajas por cuota litis?</span>
              <button
                onClick={() => editMode && setRates({ ...rates, contingency: !rates.contingency })}
                disabled={!editMode}
                className={`relative w-12 h-6 rounded-full transition-colors disabled:cursor-not-allowed ${
                  rates.contingency ? "bg-[#5E8B8C]" : "bg-[#D5C3B6]"
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    rates.contingency ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
            {rates.contingency && (
              <div className="mt-3 ml-4 flex items-center gap-2 transition-all duration-200">
                <span className="text-sm text-[#75524C]">Porcentaje:</span>
                <input
                  type="number"
                  value={rates.contingencyPercent}
                  onChange={(e) => setRates({ ...rates, contingencyPercent: Number(e.target.value) })}
                  disabled={!editMode}
                  className="w-20 px-3 py-1 border border-[#D5C3B6]/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E8B8C] focus:border-transparent disabled:bg-white disabled:cursor-not-allowed"
                />
                <span className="text-sm text-[#75524C]">%</span>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-[#D5C3B6]/50 pt-4 mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#75524C] mb-1">
              Tarifa fija por servicio (opcional)
            </label>
            <input
              type="text"
              value={rates.fixedRate}
              onChange={(e) => setRates({ ...rates, fixedRate: e.target.value })}
              disabled={!editMode}
              placeholder="Ej: $500 por revisión"
              className="w-full px-4 py-2 border border-[#D5C3B6]/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E8B8C] focus:border-transparent disabled:bg-white disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#75524C] mb-1">
              Iguala mensual (opcional)
            </label>
            <input
              type="text"
              value={rates.monthlyRetainer}
              onChange={(e) => setRates({ ...rates, monthlyRetainer: e.target.value })}
              disabled={!editMode}
              placeholder="Ej: $2000 mensual"
              className="w-full px-4 py-2 border border-[#D5C3B6]/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E8B8C] focus:border-transparent disabled:bg-white disabled:cursor-not-allowed"
            />
          </div>
        </div>

        <div className="border-t border-[#D5C3B6]/50 pt-4 mt-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[#C27F79]">⚠</span>
            <span className="font-medium text-[#2D3C3C]">Presupuesto mínimo del cliente</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-[#2D3C3C]">$</span>
            <input
              type="number"
              value={rates.minBudget}
              onChange={(e) => setRates({ ...rates, minBudget: Number(e.target.value) })}
              disabled={!editMode}
              className="w-24 px-3 py-2 font-bold text-[#2D3C3C] border border-[#D5C3B6]/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E8B8C] focus:border-transparent disabled:bg-white disabled:cursor-not-allowed"
            />
            <span className="text-[#75524C]">/hr</span>
          </div>
          <p className="text-sm text-[#75524C] mt-2">
            Clientes con presupuesto menor no aparecerán en tu búsqueda
          </p>
        </div>
      </section>

      {/* Section 4: Availability */}
      <section className="bg-white border border-[#D5C3B6]/30 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-bold text-[#2D3C3C] mb-4">Disponibilidad Semanal</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="p-2"></th>
                {daysOfWeek.map((day, i) => (
                  <th key={i} className="p-2 text-center text-sm font-medium text-[#75524C]">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((slot, slotIndex) => (
                <tr key={slotIndex}>
                  <td className="p-2 text-sm text-[#75524C]">
                    <div>{slot.label}</div>
                    <div className="text-xs text-[#D5C3B6]">{slot.time}</div>
                  </td>
                  {daysOfWeek.map((_, dayIndex) => {
                    const key = `${dayIndex}-${slotIndex}`
                    const isAvailable = availability[key]
                    return (
                      <td key={dayIndex} className="p-1">
                        <button
                          onClick={() => toggleAvailability(key)}
                          disabled={!editMode}
                          className={`w-full h-10 rounded transition-colors disabled:cursor-not-allowed ${
                            isAvailable
                              ? "bg-[#5E8B8C] text-white"
                              : "bg-[#D5C3B6]/20 text-[#75524C]/50 hover:bg-[#D5C3B6]/40"
                          }`}
                        >
                          {isAvailable && <CheckCircle size={16} className="mx-auto" />}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 5: Experience */}
      <section className="bg-white border border-[#D5C3B6]/30 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#2D3C3C]">Experiencia</h2>
          {editMode && (
            <button
              onClick={() => setShowAddExperience(true)}
              className="flex items-center gap-2 px-4 py-2 border border-[#5E8B8C] text-[#5E8B8C] rounded-lg hover:bg-[#5E8B8C]/10 transition-colors"
            >
              <Plus size={16} />
              Agregar Experiencia
            </button>
          )}
        </div>

        <div className="space-y-4">
          {experience.map((exp) => (
            <div
              key={exp.id}
              className="relative p-4 bg-[#F8F7F4] rounded-lg group"
            >
              {editMode && (
                <button
                  onClick={() => removeExperience(exp.id)}
                  className="absolute top-2 right-2 p-1 text-[#C27F79] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#C27F79]/10 rounded"
                >
                  <X size={16} />
                </button>
              )}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-[#5E8B8C]/20 flex items-center justify-center shrink-0">
                  <Briefcase size={18} className="text-[#5E8B8C]" />
                </div>
                <div>
                  <h3 className="font-medium text-[#2D3C3C]">{exp.position}</h3>
                  <p className="text-sm text-[#75524C]">{exp.company}</p>
                  <p className="text-xs text-[#D5C3B6] mt-1">{exp.period}</p>
                  <p className="text-sm text-[#75524C] mt-2">{exp.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add experience form */}
        {showAddExperience && (
          <div className="mt-4 p-4 border border-[#D5C3B6]/50 rounded-lg">
            <div className="grid gap-4">
              <div className="grid md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Empresa/Institución"
                  value={newExperience.company}
                  onChange={(e) => setNewExperience({ ...newExperience, company: e.target.value })}
                  className="px-4 py-2 border border-[#D5C3B6]/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E8B8C] focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Cargo"
                  value={newExperience.position}
                  onChange={(e) => setNewExperience({ ...newExperience, position: e.target.value })}
                  className="px-4 py-2 border border-[#D5C3B6]/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E8B8C] focus:border-transparent"
                />
              </div>
              <input
                type="text"
                placeholder="Período (ej: 2018 - Presente)"
                value={newExperience.period}
                onChange={(e) => setNewExperience({ ...newExperience, period: e.target.value })}
                className="px-4 py-2 border border-[#D5C3B6]/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E8B8C] focus:border-transparent"
              />
              <textarea
                placeholder="Descripción"
                rows={2}
                value={newExperience.description}
                onChange={(e) => setNewExperience({ ...newExperience, description: e.target.value })}
                className="px-4 py-2 border border-[#D5C3B6]/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E8B8C] focus:border-transparent resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={addExperience}
                  className="px-4 py-2 bg-[#5E8B8C] text-white rounded-lg hover:bg-[#5E8B8C]/90 transition-colors"
                >
                  Agregar
                </button>
                <button
                  onClick={() => setShowAddExperience(false)}
                  className="px-4 py-2 border border-[#D5C3B6] text-[#75524C] rounded-lg hover:bg-[#F8F7F4] transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Section 6: Reviews */}
      <section className="bg-[#F8F7F4] border border-[#D5C3B6]/30 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-bold text-[#2D3C3C] mb-4">Reseñas Recibidas</h2>

        {/* Average rating */}
        <div className="flex items-center gap-4 mb-6">
          <div className="text-4xl font-bold text-[#2D3C3C]">{averageRating}</div>
          <div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={20}
                  className={star <= Math.floor(averageRating) ? "text-[#F2C94C] fill-[#F2C94C]" : "text-[#D5C3B6]"}
                />
              ))}
            </div>
            <p className="text-sm text-[#75524C]">{totalReviews} reseñas</p>
          </div>
        </div>

        {/* Reviews list */}
        <div className="space-y-4">
          {mockReviews.map((review) => (
            <div key={review.id} className="bg-white p-4 rounded-lg border border-[#D5C3B6]/30">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#5E8B8C] to-[#2D3C3C] flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {review.initials}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[#2D3C3C]">{review.name}</span>
                    <span className="text-xs text-[#D5C3B6]">{review.date}</span>
                  </div>
                  <div className="flex items-center gap-1 my-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={14}
                        className={star <= review.rating ? "text-[#F2C94C] fill-[#F2C94C]" : "text-[#D5C3B6]"}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-[#75524C]">{review.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Sticky save bar */}
      {editMode && (
        <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white border-t border-[#D5C3B6]/30 p-4 z-40">
          <div className="max-w-4xl mx-auto flex items-center justify-end gap-3">
            <button
              onClick={() => setEditMode(false)}
              className="px-6 py-2 border border-[#D5C3B6] text-[#75524C] rounded-lg hover:bg-[#F8F7F4] transition-colors"
            >
              Vista previa pública
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-[#75524C] text-white rounded-lg hover:bg-[#75524C]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Guardando...
                </>
              ) : saved ? (
                <>
                  <CheckCircle size={18} />
                  Guardado
                </>
              ) : (
                <>
                  <Save size={18} />
                  Guardar cambios
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Save confirmation toast */}
      {saved && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-[#5E8B8C] text-white px-4 py-3 rounded-lg shadow-lg animate-in slide-in-from-top-2">
          <CheckCircle size={18} />
          <span>Cambios guardados exitosamente</span>
        </div>
      )}
    </div>
  )
}
