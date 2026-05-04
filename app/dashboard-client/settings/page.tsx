"use client"

import { useState, useEffect, useRef } from "react"
import {
  User,
  DollarSign,
  Bell,
  Shield,
  Trash2,
  Camera,
  Download,
  Loader2,
  Check,
  CheckCircle,
} from "lucide-react"
import { cities } from "@/lib/data"
import { getMyProfile } from "@/lib/queries/profile"
import { updateProfile, uploadProfileAvatar } from "@/lib/actions/profile"
import { signOut } from "@/lib/actions/auth"

type Section = "profile" | "budget" | "notifications" | "security" | "account"

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<Section>("profile")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [budgetRange, setBudgetRange] = useState(150)
  const [monthlyBudget, setMonthlyBudget] = useState("1500")

  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [city, setCity] = useState("")
  const [bio, setBio] = useState("")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const [notifications, setNotifications] = useState({
    newMessages: true,
    caseUpdates: true,
    appointments: true,
    lawyerResponses: false,
  })

  useEffect(() => {
    getMyProfile().then((row) => {
      if (!row) return
      setFullName(String(row.full_name ?? ""))
      setEmail(String(row.email ?? ""))
      setPhone(String(row.phone ?? ""))
      setCity(String(row.city ?? ""))
      setBio(String(row.bio ?? ""))
      setAvatarUrl(row.avatar_url ? String(row.avatar_url) : null)
    })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    if (activeSection === "profile") {
      await updateProfile({
        full_name: fullName,
        city,
        phone,
        bio,
      })
    } else {
      await new Promise((resolve) => setTimeout(resolve, 600))
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const sections: { key: Section; label: string; icon: typeof User }[] = [
    { key: "profile", label: "Perfil", icon: User },
    { key: "budget", label: "Mi Presupuesto", icon: DollarSign },
    { key: "notifications", label: "Notificaciones", icon: Bell },
    { key: "security", label: "Seguridad", icon: Shield },
    { key: "account", label: "Cuenta", icon: Trash2 },
  ]

  return (
    <div className="max-w-4xl mx-auto">
      {/* Toast notification */}
      {saved && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-[#5E8B8C] text-white px-4 py-3 rounded-lg shadow-lg animate-in slide-in-from-top-2">
          <CheckCircle size={18} />
          <span>Cambios guardados exitosamente</span>
        </div>
      )}
      
      <h1 className="text-2xl font-bold text-[#2D3C3C] mb-6">Configuración</h1>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Navigation */}
        <div className="md:w-64 shrink-0">
          <nav className="bg-white border border-[#D5C3B6]/30 rounded-lg overflow-hidden">
            {sections.map((section) => (
              <button
                key={section.key}
                onClick={() => setActiveSection(section.key)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                  activeSection === section.key
                    ? "bg-[#5E8B8C]/10 border-l-2 border-[#5E8B8C] text-[#2D3C3C]"
                    : "text-[#75524C] hover:bg-[#F8F7F4]"
                }`}
              >
                <section.icon size={18} />
                <span className="text-sm font-medium">{section.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="bg-white border border-[#D5C3B6]/30 rounded-lg p-6">
            {/* Profile Section */}
            {activeSection === "profile" && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-[#2D3C3C]">Información Personal</h2>

                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      setAvatarUploading(true)
                      const fd = new FormData()
                      fd.append("file", file)
                      const res = await uploadProfileAvatar(fd)
                      e.target.value = ""
                      if ("avatarUrl" in res && res.avatarUrl) setAvatarUrl(res.avatarUrl)
                      setAvatarUploading(false)
                    }}
                  />
                  <div className="relative">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt=""
                        className="w-20 h-20 rounded-full object-cover border border-[#D5C3B6]/40"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gradient-to-r from-[#5E8B8C] to-[#2D3C3C] flex items-center justify-center text-white text-2xl font-bold">
                        {fullName
                          .split(/\s+/)
                          .filter(Boolean)
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase() || "?"}
                      </div>
                    )}
                    <button
                      type="button"
                      disabled={avatarUploading}
                      onClick={() => avatarInputRef.current?.click()}
                      className="absolute bottom-0 right-0 w-8 h-8 bg-[#5E8B8C] rounded-full flex items-center justify-center text-white hover:bg-[#5E8B8C]/90 disabled:opacity-50"
                    >
                      <Camera size={14} />
                    </button>
                  </div>
                  <div>
                    <p className="font-medium text-[#2D3C3C]">Foto de perfil</p>
                    <p className="text-sm text-[#75524C]">JPG, PNG o GIF. Máximo 2MB</p>
                  </div>
                </div>

                {/* Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#2D3C3C] mb-1">
                      Nombre completo
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-4 py-3 border border-[#D5C3B6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E8B8C]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#2D3C3C] mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      readOnly
                      className="w-full px-4 py-3 border border-[#D5C3B6] rounded-lg bg-[#F8F7F4] text-[#75524C] cursor-not-allowed"
                      title="El correo se gestiona desde tu cuenta de acceso"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#2D3C3C] mb-1">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-3 border border-[#D5C3B6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E8B8C]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#2D3C3C] mb-1">
                      Ciudad
                    </label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-4 py-3 border border-[#D5C3B6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E8B8C]"
                    >
                      <option value="">Selecciona ciudad</option>
                      {(
                        city && !(cities as readonly string[]).includes(city)
                          ? [city, ...cities]
                          : cities
                      ).map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2D3C3C] mb-1">
                    Biografía
                  </label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full px-4 py-3 border border-[#D5C3B6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E8B8C]"
                  ></textarea>
                </div>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2 bg-[#5E8B8C] text-white rounded-lg hover:bg-[#5E8B8C]/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Guardando...
                    </>
                  ) : saved ? (
                    <>
                      <Check size={16} />
                      Guardado
                    </>
                  ) : (
                    "Guardar cambios"
                  )}
                </button>
              </div>
            )}

            {/* Budget Section */}
            {activeSection === "budget" && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-[#2D3C3C]">Mi Presupuesto Legal</h2>

                <div className="bg-[#F8F7F4] border border-[#D5C3B6] rounded-lg p-4">
                  <label className="block text-sm font-medium text-[#2D3C3C] mb-2">
                    Tarifa por hora máxima
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="500"
                    value={budgetRange}
                    onChange={(e) => setBudgetRange(parseInt(e.target.value))}
                    className="w-full accent-[#5E8B8C]"
                  />
                  <div className="flex justify-between text-sm text-[#75524C] mt-2">
                    <span>$0/hr</span>
                    <span className="font-bold text-[#5E8B8C]">${budgetRange}/hr</span>
                    <span>$500/hr</span>
                  </div>
                  <p className="text-xs text-[#75524C] mt-2">
                    Los abogados con tarifas superiores no aparecerán en tus resultados de búsqueda
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2D3C3C] mb-1">
                    Presupuesto mensual máximo ($)
                  </label>
                  <input
                    type="number"
                    value={monthlyBudget}
                    onChange={(e) => setMonthlyBudget(e.target.value)}
                    className="w-full px-4 py-3 border border-[#D5C3B6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E8B8C]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2D3C3C] mb-2">
                    Métodos de pago preferidos
                  </label>
                  <div className="space-y-2">
                    {["Tarjeta de crédito", "Transferencia bancaria", "Planes de pago", "Cuota litis"].map((method) => (
                      <label key={method} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          defaultChecked={method !== "Cuota litis"}
                          className="accent-[#5E8B8C] rounded"
                        />
                        <span className="text-sm text-[#75524C]">{method}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2 bg-[#5E8B8C] text-white rounded-lg hover:bg-[#5E8B8C]/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Guardando...
                    </>
                  ) : saved ? (
                    <>
                      <Check size={16} />
                      Guardado
                    </>
                  ) : (
                    "Guardar cambios"
                  )}
                </button>
              </div>
            )}

            {/* Notifications Section */}
            {activeSection === "notifications" && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-[#2D3C3C]">Notificaciones</h2>

                <div className="space-y-4">
                  {[
                    { key: "newMessages", label: "Nuevos mensajes", desc: "Recibe notificaciones cuando un abogado te envíe un mensaje" },
                    { key: "caseUpdates", label: "Actualizaciones de caso", desc: "Notificaciones sobre cambios en tus casos activos" },
                    { key: "appointments", label: "Recordatorios de citas", desc: "Recordatorios antes de tus citas programadas" },
                    { key: "lawyerResponses", label: "Respuestas de abogados", desc: "Cuando un abogado responde a tu solicitud de caso" },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 border border-[#D5C3B6]/30 rounded-lg">
                      <div>
                        <p className="font-medium text-[#2D3C3C]">{item.label}</p>
                        <p className="text-sm text-[#75524C]">{item.desc}</p>
                      </div>
                      <button
                        onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key as keyof typeof notifications] })}
                        className={`w-12 h-6 rounded-full transition-colors relative ${
                          notifications[item.key as keyof typeof notifications] ? "bg-[#5E8B8C]" : "bg-[#D5C3B6]"
                        }`}
                      >
                        <span
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            notifications[item.key as keyof typeof notifications] ? "translate-x-7" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2 bg-[#5E8B8C] text-white rounded-lg hover:bg-[#5E8B8C]/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Guardando...
                    </>
                  ) : saved ? (
                    <>
                      <Check size={16} />
                      Guardado
                    </>
                  ) : (
                    "Guardar cambios"
                  )}
                </button>
              </div>
            )}

            {/* Security Section */}
            {activeSection === "security" && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-[#2D3C3C]">Seguridad</h2>

                <div>
                  <h3 className="font-medium text-[#2D3C3C] mb-4">Cambiar contraseña</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#2D3C3C] mb-1">
                        Contraseña actual
                      </label>
                      <input
                        type="password"
                        className="w-full px-4 py-3 border border-[#D5C3B6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E8B8C]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#2D3C3C] mb-1">
                        Nueva contraseña
                      </label>
                      <input
                        type="password"
                        className="w-full px-4 py-3 border border-[#D5C3B6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E8B8C]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#2D3C3C] mb-1">
                        Confirmar nueva contraseña
                      </label>
                      <input
                        type="password"
                        className="w-full px-4 py-3 border border-[#D5C3B6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E8B8C]"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border border-[#D5C3B6]/30 rounded-lg">
                  <div>
                    <p className="font-medium text-[#2D3C3C]">Autenticación de dos factores</p>
                    <p className="text-sm text-[#75524C]">Agrega una capa extra de seguridad a tu cuenta</p>
                  </div>
                  <button className="w-12 h-6 rounded-full bg-[#D5C3B6] relative">
                    <span className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full" />
                  </button>
                </div>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2 bg-[#5E8B8C] text-white rounded-lg hover:bg-[#5E8B8C]/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Guardando...
                    </>
                  ) : saved ? (
                    <>
                      <Check size={16} />
                      Guardado
                    </>
                  ) : (
                    "Actualizar contraseña"
                  )}
                </button>
              </div>
            )}

            {/* Account Section */}
            {activeSection === "account" && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-[#2D3C3C]">Cuenta</h2>

                <div className="p-4 border border-[#D5C3B6]/30 rounded-lg">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <p className="font-medium text-[#2D3C3C]">Cerrar sesión</p>
                      <p className="text-sm text-[#75524C]">Salir de tu cuenta en este dispositivo</p>
                    </div>
                    <form action={signOut}>
                      <button
                        type="submit"
                        className="px-4 py-2 border border-[#5E8B8C] text-[#5E8B8C] rounded-lg hover:bg-[#5E8B8C]/10 transition-colors"
                      >
                        Cerrar sesión
                      </button>
                    </form>
                  </div>
                </div>

                <div className="p-4 border border-[#D5C3B6]/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-[#2D3C3C]">Descargar mis datos</p>
                      <p className="text-sm text-[#75524C]">Obtén una copia de toda tu información</p>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 border border-[#5E8B8C] text-[#5E8B8C] rounded-lg hover:bg-[#5E8B8C]/10 transition-colors">
                      <Download size={16} />
                      Descargar
                    </button>
                  </div>
                </div>

                <div className="p-4 border border-[#C27F79] rounded-lg bg-[#C27F79]/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-[#C27F79]">Eliminar cuenta</p>
                      <p className="text-sm text-[#75524C]">Esta acción es irreversible</p>
                    </div>
                    <button
                      onClick={() => setDeleteModalOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-[#C27F79] text-white rounded-lg hover:bg-[#C27F79]/90 transition-colors"
                    >
                      <Trash2 size={16} />
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-lg font-bold text-[#2D3C3C] mb-2">¿Eliminar cuenta?</h2>
            <p className="text-[#75524C] mb-6">
              Esta acción eliminará permanentemente tu cuenta y todos tus datos. No podrás recuperarlos.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="flex-1 py-2 border border-[#D5C3B6] text-[#75524C] rounded-lg hover:bg-[#F8F7F4] transition-colors"
              >
                Cancelar
              </button>
              <button className="flex-1 py-2 bg-[#C27F79] text-white rounded-lg hover:bg-[#C27F79]/90 transition-colors">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
