"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { 
  User, 
  Bell, 
  Shield, 
  CreditCard, 
  Globe, 
  Moon, 
  Sun,
  Camera,
  Save,
  Briefcase,
  Award,
  MapPin,
  CheckCircle,
  Loader2,
} from "lucide-react"
import { getLawyerOwnProfile } from "@/lib/queries/lawyer-self"
import { updateLawyerProfile } from "@/lib/actions/lawyer"
import { signOut } from "@/lib/actions/auth"
import { uploadProfileAvatar } from "@/lib/actions/profile"

export default function LawyerSettingsPage() {
  const [activeTab, setActiveTab] = useState("profile")
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    specialty: "",
    licenseNumber: "",
    yearsExperience: "0",
    bio: "",
    location: "",
    hourlyRate: "0",
  })

  useEffect(() => {
    getLawyerOwnProfile().then((row) => {
      if (!row) return
      const lp = row.lawyer_profiles as Record<string, unknown> | null | undefined
      const specs = (lp?.specialties as string[]) ?? []
      setProfile({
        name: String(row.full_name ?? ""),
        email: String(row.email ?? ""),
        phone: String(row.phone ?? ""),
        specialty: specs[0] ?? "",
        licenseNumber: String(lp?.license_number ?? ""),
        yearsExperience: String(lp?.experience_years ?? 0),
        bio: String(row.bio ?? ""),
        location: String(row.city ?? ""),
        hourlyRate:
          lp?.hourly_rate != null && lp.hourly_rate !== ""
            ? String(lp.hourly_rate)
            : "0",
      })
      setAvatarUrl(row.avatar_url ? String(row.avatar_url) : null)
    })
  }, [])

  const initials = useMemo(() => {
    const parts = profile.name.split(/\s+/).filter(Boolean)
    if (parts.length >= 2)
      return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase()
    return (profile.name.slice(0, 2) || "?").toUpperCase()
  }, [profile.name])

  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    newCases: true,
    messages: true,
    caseUpdates: true,
    marketing: false
  })

  const tabs = [
    { id: "profile", label: "Perfil Profesional", icon: User },
    { id: "notifications", label: "Notificaciones", icon: Bell },
    { id: "security", label: "Seguridad", icon: Shield },
    { id: "billing", label: "Facturacion", icon: CreditCard },
    { id: "preferences", label: "Preferencias", icon: Globe },
  ]

  const specialties = [
    "Derecho Corporativo",
    "Derecho Penal",
    "Derecho Familiar",
    "Derecho Laboral",
    "Derecho Civil",
    "Derecho Fiscal",
    "Propiedad Intelectual",
    "Derecho Inmobiliario"
  ]

  const handleSave = async () => {
    setSaving(true)
    if (activeTab === "profile") {
      await updateLawyerProfile({
        full_name: profile.name,
        title: profile.specialty || undefined,
        phone: profile.phone,
        bio: profile.bio,
        city: profile.location,
        license_number: profile.licenseNumber,
        experience_years: parseInt(profile.yearsExperience, 10) || 0,
        hourly_rate: parseFloat(profile.hourlyRate) || 0,
        specialties: profile.specialty ? [profile.specialty] : [],
      })
    } else {
      await new Promise((resolve) => setTimeout(resolve, 600))
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-6">
      {/* Toast notification */}
      {saved && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-[#75524C] text-white px-4 py-3 rounded-lg shadow-lg animate-in slide-in-from-top-2">
          <CheckCircle size={18} />
          <span>Cambios guardados exitosamente</span>
        </div>
      )}
      
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configuracion</h1>
        <p className="text-muted-foreground">Administra tu perfil profesional y preferencias</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:w-64 bg-card rounded-xl border border-border p-2">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-card rounded-xl border border-border p-6">
          {activeTab === "profile" && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-foreground">Perfil Profesional</h2>
              
              {/* Avatar */}
              <div className="flex items-center gap-6">
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
                      className="w-24 h-24 rounded-full object-cover border border-border"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
                      {initials}
                    </div>
                  )}
                  <button
                    type="button"
                    disabled={avatarUploading}
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <h3 className="font-medium text-foreground">{profile.name}</h3>
                  <p className="text-sm text-muted-foreground">{profile.specialty}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <Award className="w-4 h-4" />
                    Licencia: {profile.licenseNumber}
                  </p>
                </div>
              </div>

              {/* Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Correo Electronico
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    readOnly
                    title="El correo se gestiona desde tu cuenta de acceso"
                    className="w-full px-4 py-2 bg-muted/80 border border-border rounded-lg text-muted-foreground cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Telefono
                  </label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Especialidad
                  </label>
                  <select
                    value={profile.specialty}
                    onChange={(e) => setProfile({ ...profile, specialty: e.target.value })}
                    className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Selecciona especialidad</option>
                    {(profile.specialty && !specialties.includes(profile.specialty)
                      ? [profile.specialty, ...specialties]
                      : specialties
                    ).map((specialty) => (
                      <option key={specialty} value={specialty}>{specialty}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Numero de Licencia
                  </label>
                  <input
                    type="text"
                    value={profile.licenseNumber}
                    onChange={(e) => setProfile({ ...profile, licenseNumber: e.target.value })}
                    className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Anos de Experiencia
                  </label>
                  <input
                    type="number"
                    value={profile.yearsExperience}
                    onChange={(e) => setProfile({ ...profile, yearsExperience: e.target.value })}
                    className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Ubicacion
                  </label>
                  <input
                    type="text"
                    value={profile.location}
                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                    className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Tarifa por Hora (MXN)
                  </label>
                  <input
                    type="number"
                    value={profile.hourlyRate}
                    onChange={(e) => setProfile({ ...profile, hourlyRate: e.target.value })}
                    className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Biografia Profesional
                  </label>
                  <textarea
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Guardar Cambios
                </button>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-foreground">Notificaciones</h2>
              
              <div className="space-y-4">
                <h3 className="font-medium text-foreground">Canales de Notificacion</h3>
                {[
                  { key: "email", label: "Correo Electronico", desc: "Recibe notificaciones por email" },
                  { key: "push", label: "Notificaciones Push", desc: "Notificaciones en el navegador" },
                  { key: "sms", label: "SMS", desc: "Recibe mensajes de texto" },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key as keyof typeof notifications] })}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        notifications[item.key as keyof typeof notifications] ? "bg-primary" : "bg-border"
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

              <div className="space-y-4">
                <h3 className="font-medium text-foreground">Tipos de Notificacion</h3>
                {[
                  { key: "newCases", label: "Nuevos Casos", desc: "Cuando un cliente solicita tus servicios" },
                  { key: "messages", label: "Mensajes", desc: "Cuando recibes un nuevo mensaje" },
                  { key: "caseUpdates", label: "Actualizaciones de Casos", desc: "Cambios en el estado de tus casos" },
                  { key: "marketing", label: "Marketing", desc: "Ofertas y novedades de la plataforma" },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key as keyof typeof notifications] })}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        notifications[item.key as keyof typeof notifications] ? "bg-primary" : "bg-border"
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
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-foreground">Seguridad</h2>
              
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-medium text-foreground mb-4">Cambiar Contrasena</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Contrasena Actual
                      </label>
                      <input
                        type="password"
                        className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Nueva Contrasena
                      </label>
                      <input
                        type="password"
                        className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Confirmar Nueva Contrasena
                      </label>
                      <input
                        type="password"
                        className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                      Actualizar Contrasena
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-foreground">Autenticacion de Dos Factores</h3>
                      <p className="text-sm text-muted-foreground">Anade una capa extra de seguridad a tu cuenta</p>
                    </div>
                    <button className="px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary/10 transition-colors">
                      Configurar
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-medium text-foreground mb-4">Sesiones Activas</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                      <div>
                        <p className="font-medium text-foreground">Chrome - Windows</p>
                        <p className="text-sm text-muted-foreground">Ciudad de Mexico - Activo ahora</p>
                      </div>
                      <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">Actual</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                      <div>
                        <p className="font-medium text-foreground">Safari - iPhone</p>
                        <p className="text-sm text-muted-foreground">Ciudad de Mexico - Hace 2 horas</p>
                      </div>
                      <button className="text-sm text-destructive hover:underline">Cerrar</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "billing" && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-foreground">Facturacion</h2>
              
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-medium text-foreground">Plan Actual</h3>
                    <p className="text-sm text-muted-foreground">Plan Profesional</p>
                  </div>
                  <span className="text-2xl font-bold text-primary">$499/mes</span>
                </div>
                <div className="flex gap-3">
                  <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                    Cambiar Plan
                  </button>
                  <button className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors">
                    Ver Facturas
                  </button>
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-medium text-foreground mb-4">Metodo de Pago</h3>
                <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-8 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">
                      VISA
                    </div>
                    <div>
                      <p className="font-medium text-foreground">**** **** **** 4532</p>
                      <p className="text-sm text-muted-foreground">Expira 12/25</p>
                    </div>
                  </div>
                  <button className="text-sm text-primary hover:underline">Editar</button>
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-medium text-foreground mb-4">Datos de Facturacion</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">RFC</label>
                    <input
                      type="text"
                      defaultValue="ROCM850101ABC"
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Razon Social</label>
                    <input
                      type="text"
                      defaultValue="Carlos Rodriguez Martinez"
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-2">Direccion Fiscal</label>
                    <input
                      type="text"
                      defaultValue="Av. Reforma 123, Col. Centro, CDMX"
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "preferences" && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-foreground">Preferencias</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    {isDarkMode ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-primary" />}
                    <div>
                      <p className="font-medium text-foreground">Modo Oscuro</p>
                      <p className="text-sm text-muted-foreground">Cambia la apariencia de la aplicacion</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      isDarkMode ? "bg-primary" : "bg-border"
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        isDarkMode ? "translate-x-7" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <Globe className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">Idioma</p>
                      <p className="text-sm text-muted-foreground">Selecciona el idioma de la interfaz</p>
                    </div>
                  </div>
                  <select className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="es">Espanol</option>
                    <option value="en">English</option>
                  </select>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <Briefcase className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">Disponibilidad</p>
                      <p className="text-sm text-muted-foreground">Configura tu disponibilidad para nuevos casos</p>
                    </div>
                  </div>
                  <select className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="available">Disponible para nuevos casos</option>
                    <option value="limited">Disponibilidad limitada</option>
                    <option value="unavailable">No disponible temporalmente</option>
                  </select>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-medium text-foreground mb-4">Zona Horaria</h3>
                  <select className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="America/Mexico_City">(GMT-6) Ciudad de Mexico</option>
                    <option value="America/Tijuana">(GMT-8) Tijuana</option>
                    <option value="America/Cancun">(GMT-5) Cancun</option>
                  </select>
                </div>

                <div className="p-4 bg-muted rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="font-medium text-foreground">Cerrar sesión</p>
                    <p className="text-sm text-muted-foreground">Salir de tu cuenta en este dispositivo</p>
                  </div>
                  <form action={signOut}>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-border rounded-lg hover:bg-background transition-colors"
                    >
                      Cerrar sesión
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
