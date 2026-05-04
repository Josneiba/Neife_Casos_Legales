"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Folder,
  Users,
  DollarSign,
  Star,
  ArrowRight,
  TrendingUp,
  Search,
  AlertTriangle,
} from "lucide-react"
import { statusConfig } from "@/lib/data"
import { getLawyerCases } from "@/lib/queries/cases"
import { createClient } from "@/lib/supabase/client"

type LawyerHomeCase = {
  id: string
  status: keyof typeof statusConfig
  title: string
  type: string
  lastUpdate: string
  progress: number
}

type ClientPostPreview = {
  id: string
  urgency: string
  type: string
  description: string
  budgetMin: number
  budgetMax: number
}

export default function LawyerDashboardHome() {
  const [loading, setLoading] = useState(true)
  const [profileComplete, setProfileComplete] = useState(false)
  const [cases, setCases] = useState<LawyerHomeCase[]>([])
  const [clientPosts, setClientPosts] = useState<ClientPostPreview[]>([])
  const [userName, setUserName] = useState("Abogado")

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        setLoading(false)
        return
      }
      const first =
        (user.user_metadata?.full_name as string | undefined)?.split(" ")[0] ??
        "Abogado"
      setUserName(first)

      const casesData = await getLawyerCases(user.id)
      setCases(
        (casesData ?? []).map((row) => {
          const r = row as {
            id: string
            title?: string
            type?: string
            status?: string
            updated_at?: string
            progress?: number
          }
          const st = r.status ?? "waiting"
          const statusKey =
            st in statusConfig ? (st as keyof typeof statusConfig) : "waiting"
          return {
            id: String(r.id),
            status: statusKey,
            title: r.title ?? "—",
            type: r.type ?? "",
            lastUpdate: r.updated_at
              ? new Date(r.updated_at).toLocaleDateString("es-CL")
              : "",
            progress: Number(r.progress) || 0,
          }
        })
      )

      const { data: posts } = await supabase
        .from("client_case_posts")
        .select("*")
        .eq("status", "open")
        .limit(3)

      setClientPosts(
        (posts ?? []).map((p) => ({
          id: String(p.id),
          urgency: String(p.urgency ?? "normal"),
          type: String(p.type ?? ""),
          description: String(p.description ?? ""),
          budgetMin: Number(p.budget_min ?? 0),
          budgetMax: Number(p.budget_max ?? 0),
        }))
      )
      setLoading(false)
    })
  }, [])

  const activeCases = cases.filter((c) => c.status === "active")

  const stats = [
    {
      label: "Casos Activos",
      value: activeCases.length,
      icon: Folder,
      color: "text-[#75524C]",
      link: "/dashboard-lawyer/cases",
      linkText: "Ver todos",
    },
    {
      label: "Nuevos Clientes",
      value: 8,
      subtext: "Este mes",
      icon: Users,
      color: "text-[#5E8B8C]",
      trend: "+12%",
    },
    {
      label: "Ingresos del Mes",
      value: "$2,450",
      subtext: "+15% vs. mes anterior",
      icon: DollarSign,
      color: "text-[#F2C94C]",
    },
    {
      label: "Calificación",
      value: "4.9",
      subtext: "47 reseñas",
      icon: Star,
      color: "text-[#C27F79]",
    },
  ]

  const revenueData = [
    { month: "Jul", amount: 1800 },
    { month: "Ago", amount: 2100 },
    { month: "Sep", amount: 1950 },
    { month: "Oct", amount: 2300 },
    { month: "Nov", amount: 2150 },
    { month: "Dic", amount: 2450 },
  ]

  const maxRevenue = Math.max(...revenueData.map(d => d.amount))

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white border border-[#D5C3B6]/30 rounded-lg p-6 animate-pulse">
          <div className="h-6 bg-[#D5C3B6]/30 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-[#D5C3B6]/30 rounded w-1/4"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white border border-[#D5C3B6]/30 rounded-lg p-6 animate-pulse">
              <div className="h-4 bg-[#D5C3B6]/30 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-[#D5C3B6]/30 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Incomplete Profile Banner */}
      {!profileComplete && (
        <div className="bg-[#F2C94C]/20 border border-[#F2C94C] rounded-lg p-4 flex flex-col sm:flex-row items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[#F2C94C] flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle size={18} className="text-[#2D3C3C]" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-[#2D3C3C]">Completa tu perfil para aparecer en busquedas</p>
            <p className="text-sm text-[#75524C] mt-1">
              Los clientes solo ven abogados con tarifa configurada. Configura tu tarifa por hora y empezaras a recibir solicitudes.
            </p>
            <button 
              onClick={() => setProfileComplete(!profileComplete)} 
              className="text-xs text-[#D5C3B6] hover:text-[#75524C] mt-2"
            >
              {profileComplete ? "Simular perfil incompleto" : "Simular perfil completo"}
            </button>
          </div>
          <Link
            href="/dashboard-lawyer/profile"
            className="shrink-0 px-4 py-2 bg-[#75524C] text-white rounded-lg text-sm hover:bg-[#75524C]/90 transition-colors"
          >
            Completar perfil
          </Link>
        </div>
      )}

      {/* Demo toggle when profile is complete */}
      {profileComplete && (
        <button 
          onClick={() => setProfileComplete(false)} 
          className="text-xs text-[#D5C3B6] hover:text-[#75524C]"
        >
          Simular perfil incompleto
        </button>
      )}

      {/* Welcome banner */}
      <div className="bg-white border border-[#D5C3B6]/30 rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-[#2D3C3C]">
          Bienvenido/a, {userName}
        </h1>
        <p className="text-[#75524C]">
          {new Date().toLocaleDateString("es-CL", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white border border-[#D5C3B6]/30 rounded-lg shadow-sm p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <span className="text-sm text-[#75524C]">{stat.label}</span>
              <stat.icon className={stat.color} size={20} />
            </div>
            <div className="flex items-end gap-2">
              <p className="text-2xl font-bold text-[#2D3C3C]">{stat.value}</p>
              {stat.trend && (
                <span className="flex items-center gap-1 text-sm text-green-600">
                  <TrendingUp size={14} />
                  {stat.trend}
                </span>
              )}
            </div>
            {stat.subtext && (
              <p className="text-sm text-[#75524C]">{stat.subtext}</p>
            )}
            {stat.link && (
              <Link
                href={stat.link}
                className="mt-2 text-sm text-[#75524C] hover:text-[#75524C] hover:underline inline-flex items-center gap-1"
              >
                {stat.linkText}
                <ArrowRight size={14} />
              </Link>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active cases */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#2D3C3C]">Casos Activos</h2>
            <Link
              href="/dashboard-lawyer/cases"
              className="text-sm text-[#75524C] hover:underline"
            >
              Ver todos
            </Link>
          </div>
          <div className="space-y-3">
            {activeCases.slice(0, 3).map((caseItem) => {
              const status = statusConfig[caseItem.status]
              return (
                <div
                  key={caseItem.id}
                  className="bg-white border border-[#D5C3B6]/30 rounded-lg shadow-sm p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-[#2D3C3C] text-sm">{caseItem.title}</h3>
                      <p className="text-xs text-[#75524C]">{caseItem.type}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${status.bg} ${status.text}`}>
                      {status.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#75524C]">{caseItem.lastUpdate}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-[#D5C3B6]/30 rounded-full">
                        <div
                          className={`h-1.5 rounded-full ${status.bg}`}
                          style={{ width: `${caseItem.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-[#2D3C3C] font-medium">{caseItem.progress}%</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Revenue chart */}
        <div>
          <h2 className="text-lg font-bold text-[#2D3C3C] mb-4">Ingresos Últimos 6 Meses</h2>
          <div className="bg-white border border-[#D5C3B6]/30 rounded-lg shadow-sm p-6">
            <div className="flex items-end gap-2 h-40">
              {revenueData.map((data, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div 
                    className="w-full bg-[#5E8B8C] rounded-t"
                    style={{ height: `${(data.amount / maxRevenue) * 100}%` }}
                  ></div>
                  <span className="text-xs text-[#75524C]">{data.month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* New client cases */}
      <div className="bg-[#F8F7F4] border border-[#D5C3B6] rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#2D3C3C]">Nuevas Solicitudes de Clientes</h2>
          <Link
            href="/dashboard-lawyer/find-clients"
            className="text-sm text-[#75524C] hover:underline flex items-center gap-1"
          >
            Ver todos
            <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(clientPosts.length > 0 ? clientPosts : []).slice(0, 3).map((clientCase) => {
            const urgencyColors = {
              normal: "bg-[#5E8B8C]/20 text-[#5E8B8C]",
              urgent: "bg-[#F2C94C]/20 text-[#F2C94C]",
              "very-urgent": "bg-[#C27F79]/20 text-[#C27F79]",
            }
            return (
              <div
                key={clientCase.id}
                className="bg-white border border-[#D5C3B6]/30 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${urgencyColors[clientCase.urgency as keyof typeof urgencyColors]}`}>
                    {clientCase.urgency === "very-urgent" ? "Muy Urgente" : clientCase.urgency === "urgent" ? "Urgente" : "Normal"}
                  </span>
                  <span className="text-xs text-[#75524C]">{clientCase.type}</span>
                </div>
                <p className="text-sm text-[#2D3C3C] font-medium mb-2 line-clamp-2">
                  {clientCase.description}
                </p>
                <p className="text-sm font-bold text-[#75524C]">
                  ${clientCase.budgetMin}-${clientCase.budgetMax}/hr
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* CTA Banner */}
      <div className="bg-gradient-to-r from-[#75524C] to-[#2D3C3C] rounded-lg p-6 text-white">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold mb-1">Encuentra nuevos clientes</h3>
            <p className="text-white/80">
              Explora casos publicados que coincidan con tu especialidad.
            </p>
          </div>
          <Link
            href="/dashboard-lawyer/find-clients"
            className="px-6 py-3 bg-white text-[#2D3C3C] rounded-lg font-semibold hover:bg-white/90 transition-colors flex items-center gap-2"
          >
            <Search size={18} />
            Buscar Clientes
          </Link>
        </div>
      </div>
    </div>
  )
}
