"use client"

import { Suspense, useState, useEffect } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Scale, Briefcase, Check, Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react"
import { specialties, cities } from "@/lib/data"
import { signUp } from "@/lib/actions/auth"

type Role = "client" | "lawyer" | null

function RegisterPageContent() {
  const searchParams = useSearchParams()
  const [step, setStep] = useState(1)
  const [role, setRole] = useState<Role>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [budgetRange, setBudgetRange] = useState([50, 200])
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    city: "",
    // Client specific
    legalArea: "",
    // Lawyer specific
    specialty: "",
    experience: "",
    hourlyRate: "",
    barNumber: "",
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState("")

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { level: 0, label: "", color: "" }
    if (password.length < 6) return { level: 1, label: "Débil", color: "bg-[#C27F79]" }
    if (password.length < 10 || !/[A-Z]/.test(password)) return { level: 2, label: "Media", color: "bg-[#F2C94C]" }
    return { level: 3, label: "Fuerte", color: "bg-[#5E8B8C]" }
  }

  const passwordStrength = getPasswordStrength(formData.password)

  useEffect(() => {
    const roleParam = searchParams.get("role")
    if (roleParam === "client" || roleParam === "lawyer") {
      setRole(roleParam)
      setStep(2)
    }
  }, [searchParams])

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.name) newErrors.name = "El nombre es requerido"
    if (!formData.email) {
      newErrors.email = "El email es requerido"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email inválido"
    }
    if (!formData.password) {
      newErrors.password = "La contraseña es requerida"
    } else if (formData.password.length < 6) {
      newErrors.password = "Mínimo 6 caracteres"
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden"
    }
    if (!formData.city) newErrors.city = "La ciudad es requerida"
    
    if (role === "lawyer") {
      if (!formData.specialty) newErrors.specialty = "La especialidad es requerida"
      if (!formData.experience) newErrors.experience = "La experiencia es requerida"
      if (!formData.hourlyRate) newErrors.hourlyRate = "La tarifa es requerida"
      if (!formData.barNumber) newErrors.barNumber = "El número de colegiado es requerido"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError("")
    if (formData.password !== formData.confirmPassword) {
      setErrors({ confirmPassword: "Las contraseñas no coinciden" })
      return
    }
    if (!validateStep2()) return
    if (!role) return

    setLoading(true)
    try {
      const result = await signUp({
        email: formData.email,
        password: formData.password,
        full_name: formData.name,
        role,
        city: formData.city,
        hourly_rate:
          role === "lawyer" ? Number(formData.hourlyRate) : undefined,
        license_number:
          role === "lawyer" ? formData.barNumber : undefined,
        specialty: role === "lawyer" ? formData.specialty : undefined,
        budget: role === "client" ? budgetRange[1] : undefined,
      })
      if (result?.error) {
        setSubmitError(result.error)
      }
    } catch {
      // redirect
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F7F4] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">
        <div className="bg-white border border-[#D5C3B6]/30 rounded-lg shadow-sm p-8">
          {/* Logo */}
          <Link href="/" className="block text-center mb-6">
            <span className="text-3xl font-bold text-[#2D3C3C]">NEIFE</span>
          </Link>

          {/* Progress Bar */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
              step >= 1 ? "bg-[#5E8B8C] text-white" : "bg-[#D5C3B6]/30 text-[#75524C]"
            }`}>
              {step > 1 ? <Check size={20} /> : "1"}
            </div>
            <div className={`w-24 h-1 ${step >= 2 ? "bg-[#5E8B8C]" : "bg-[#D5C3B6]/30"}`}></div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
              step >= 2 ? "bg-[#5E8B8C] text-white" : "bg-[#D5C3B6]/30 text-[#75524C]"
            }`}>
              2
            </div>
          </div>

          {step === 1 && (
            <>
              <h1 className="text-2xl font-bold text-[#2D3C3C] text-center mb-2">
                ¿Cómo deseas registrarte?
              </h1>
              <p className="text-[#75524C] text-center mb-8">
                Selecciona tu tipo de cuenta
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {/* Client Card */}
                <button
                  onClick={() => setRole("client")}
                  className={`p-6 border-2 rounded-lg text-left transition-all ${
                    role === "client"
                      ? "border-[#5E8B8C] bg-[#5E8B8C]/5"
                      : "border-[#D5C3B6]/30 hover:border-[#5E8B8C]/50"
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <Scale className="text-[#5E8B8C]" size={32} />
                    {role === "client" && (
                      <div className="w-6 h-6 rounded-full bg-[#5E8B8C] flex items-center justify-center">
                        <Check size={14} className="text-white" />
                      </div>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-[#2D3C3C] mb-2">Soy Cliente</h3>
                  <p className="text-[#75524C] text-sm">
                    Busco un abogado para resolver mi caso legal
                  </p>
                </button>

                {/* Lawyer Card */}
                <button
                  onClick={() => setRole("lawyer")}
                  className={`p-6 border-2 rounded-lg text-left transition-all ${
                    role === "lawyer"
                      ? "border-[#75524C] bg-[#75524C]/5"
                      : "border-[#D5C3B6]/30 hover:border-[#75524C]/50"
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <Briefcase className="text-[#75524C]" size={32} />
                    {role === "lawyer" && (
                      <div className="w-6 h-6 rounded-full bg-[#75524C] flex items-center justify-center">
                        <Check size={14} className="text-white" />
                      </div>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-[#2D3C3C] mb-2">Soy Abogado</h3>
                  <p className="text-[#75524C] text-sm">
                    Quiero ofrecer mis servicios legales
                  </p>
                </button>
              </div>

              <button
                onClick={() => role && setStep(2)}
                disabled={!role}
                className={`w-full py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  role === "lawyer"
                    ? "bg-[#75524C] hover:bg-[#75524C]/90 text-white"
                    : "bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-white"
                }`}
              >
                Continuar
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 text-[#75524C] hover:text-[#2D3C3C] mb-4"
              >
                <ArrowLeft size={16} />
                Volver
              </button>

              <h1 className="text-2xl font-bold text-[#2D3C3C] text-center mb-2">
                {role === "client" ? "Registro de Cliente" : "Registro de Abogado"}
              </h1>
              <p className="text-[#75524C] text-center mb-6">
                Completa tus datos para crear tu cuenta
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {submitError && (
                  <p className="text-sm text-[#C27F79] text-center bg-[#C27F79]/10 py-2 rounded-lg">
                    {submitError}
                  </p>
                )}
                {/* Common Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#2D3C3C] mb-1">
                      Nombre completo
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E8B8C] ${
                        errors.name ? "border-[#C27F79]" : "border-[#D5C3B6]"
                      }`}
                      placeholder="Tu nombre"
                    />
                    {errors.name && <p className="mt-1 text-sm text-[#C27F79]">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#2D3C3C] mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E8B8C] ${
                        errors.email ? "border-[#C27F79]" : "border-[#D5C3B6]"
                      }`}
                      placeholder="tu@email.com"
                    />
                    {errors.email && <p className="mt-1 text-sm text-[#C27F79]">{errors.email}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#2D3C3C] mb-1">
                      Contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E8B8C] pr-12 ${
                          errors.password ? "border-[#C27F79]" : "border-[#D5C3B6]"
                        }`}
                        placeholder="Mínimo 6 caracteres"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#75524C]"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    {/* Password strength indicator */}
                    {formData.password.length > 0 && (
                      <>
                        <div className="flex gap-1 mt-2">
                          {[1, 2, 3].map((i) => (
                            <div 
                              key={i} 
                              className={`h-1 flex-1 rounded-full transition-colors ${
                                i <= passwordStrength.level ? passwordStrength.color : "bg-[#D5C3B6]/30"
                              }`} 
                            />
                          ))}
                        </div>
                        <p className="text-xs text-[#75524C] mt-1">{passwordStrength.label}</p>
                      </>
                    )}
                    {errors.password && <p className="mt-1 text-sm text-[#C27F79]">{errors.password}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#2D3C3C] mb-1">
                      Confirmar contraseña
                    </label>
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E8B8C] ${
                        errors.confirmPassword ? "border-[#C27F79]" : "border-[#D5C3B6]"
                      }`}
                      placeholder="Repite tu contraseña"
                    />
                    {errors.confirmPassword && <p className="mt-1 text-sm text-[#C27F79]">{errors.confirmPassword}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2D3C3C] mb-1">
                    Ciudad
                  </label>
                  <select
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E8B8C] ${
                      errors.city ? "border-[#C27F79]" : "border-[#D5C3B6]"
                    }`}
                  >
                    <option value="">Selecciona tu ciudad</option>
                    {cities.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                  {errors.city && <p className="mt-1 text-sm text-[#C27F79]">{errors.city}</p>}
                </div>

                {/* Client specific fields */}
                {role === "client" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-[#2D3C3C] mb-1">
                        Área legal de interés
                      </label>
                      <select
                        value={formData.legalArea}
                        onChange={(e) => setFormData({ ...formData, legalArea: e.target.value })}
                        className="w-full px-4 py-3 border border-[#D5C3B6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E8B8C]"
                      >
                        <option value="">Selecciona un área (opcional)</option>
                        {specialties.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    <div className="bg-[#F8F7F4] border border-[#D5C3B6] rounded-lg p-4">
                      <label className="block text-sm font-medium text-[#2D3C3C] mb-2">
                        ¿Cuánto puedes pagar por hora?
                      </label>
                      <div className="px-2">
                        <input
                          type="range"
                          min="0"
                          max="500"
                          value={budgetRange[1]}
                          onChange={(e) => setBudgetRange([budgetRange[0], parseInt(e.target.value)])}
                          className="w-full accent-[#5E8B8C]"
                        />
                        <div className="flex justify-between text-sm text-[#75524C] mt-2">
                          <span>$0/hr</span>
                          <span className="font-bold text-[#5E8B8C]">Hasta ${budgetRange[1]}/hr</span>
                          <span>$500+/hr</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Lawyer specific fields */}
                {role === "lawyer" && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[#2D3C3C] mb-1">
                          Especialidad principal
                        </label>
                        <select
                          value={formData.specialty}
                          onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E8B8C] ${
                            errors.specialty ? "border-[#C27F79]" : "border-[#D5C3B6]"
                          }`}
                        >
                          <option value="">Selecciona tu especialidad</option>
                          {specialties.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        {errors.specialty && <p className="mt-1 text-sm text-[#C27F79]">{errors.specialty}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[#2D3C3C] mb-1">
                          Años de experiencia
                        </label>
                        <select
                          value={formData.experience}
                          onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E8B8C] ${
                            errors.experience ? "border-[#C27F79]" : "border-[#D5C3B6]"
                          }`}
                        >
                          <option value="">Selecciona</option>
                          <option value="1-3">1-3 años</option>
                          <option value="3-7">3-7 años</option>
                          <option value="7-15">7-15 años</option>
                          <option value="15+">15+ años</option>
                        </select>
                        {errors.experience && <p className="mt-1 text-sm text-[#C27F79]">{errors.experience}</p>}
                      </div>
                    </div>

                    <div className="bg-[#F8F7F4] border border-[#D5C3B6] rounded-lg p-4">
                      <label className="block text-sm font-medium text-[#2D3C3C] mb-2">
                        Tarifa por hora ($)
                      </label>
                      <input
                        type="number"
                        value={formData.hourlyRate}
                        onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E8B8C] ${
                          errors.hourlyRate ? "border-[#C27F79]" : "border-[#D5C3B6]"
                        }`}
                        placeholder="Ej: 100"
                      />
                      {errors.hourlyRate && <p className="mt-1 text-sm text-[#C27F79]">{errors.hourlyRate}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#2D3C3C] mb-1">
                        Número de colegiado
                      </label>
                      <input
                        type="text"
                        value={formData.barNumber}
                        onChange={(e) => setFormData({ ...formData, barNumber: e.target.value })}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E8B8C] ${
                          errors.barNumber ? "border-[#C27F79]" : "border-[#D5C3B6]"
                        }`}
                        placeholder="Tu número de colegiado"
                      />
                      {errors.barNumber && <p className="mt-1 text-sm text-[#C27F79]">{errors.barNumber}</p>}
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
                    role === "lawyer"
                      ? "bg-[#75524C] hover:bg-[#75524C]/90 text-white"
                      : "bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-white"
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Creando cuenta...
                    </>
                  ) : (
                    "Crear Cuenta"
                  )}
                </button>
              </form>
            </>
          )}

          {/* Login Link */}
          <p className="mt-6 text-center text-[#75524C]">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="text-[#5E8B8C] font-semibold hover:underline">
              Iniciar Sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8F7F4] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#5E8B8C]" />
        </div>
      }
    >
      <RegisterPageContent />
    </Suspense>
  )
}
