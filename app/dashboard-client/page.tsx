"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Folder,
  MessageSquare,
  Calendar,
  DollarSign,
  ArrowRight,
  Search,
  FileText,
  MessageCircle,
} from "lucide-react"
import { statusConfig } from "@/lib/data"
import { getClientCases } from "@/lib/queries/cases"
import { getRecentActivitiesForClient } from "@/lib/queries/case-detail"
import { createClient } from "@/lib/supabase/client"

type HomeCase = {
  id: string
  title: string
  type: string
  status: keyof typeof statusConfig
  progress: number
  lastUpdate: string
  nextAction: string
  lawyer: { name: string; specialization: string }
}

function normalizeHomeCase(c: Record<string, unknown>): HomeCase {
  const lawyer = c.lawyer as
    | {
        full_name?: string | null
        lawyer_profiles?: { specialties?: string[] | null } | null
      }
    | null
    | undefined
  const lp = lawyer?.lawyer_profiles
  const st = (c.status as string) ?? "waiting"
  const statusKey = st in statusConfig ? (st as keyof typeof statusConfig) : "waiting"
  return {
    id: String(c.id),
    title: String(c.title ?? ""),
    type: String(c.type ?? ""),
    status: statusKey,
    progress: Number(c.progress ?? 0),
    lastUpdate: c.updated_at
      ? new Date(c.updated_at as string).toLocaleDateString("es-CL")
      : "",
    nextAction: String(c.next_action ?? ""),
    lawyer: {
      name: lawyer?.full_name ?? "—",
      specialization: lp?.specialties?.[0] ?? "",
    },
  }
}

type ActivityRow = {
  id: string
  case_id: string
  type: string
  title: string
  description: string | null
  created_at: string
}

export default function ClientDashboardHome() {
  const [loading, setLoading] = useState(true)
  const [cases, setCases] = useState<HomeCase[]>([])
  const [activityFeed, setActivityFeed] = useState<ActivityRow[]>([])
  const [userName, setUserName] = useState("Usuario")

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        setLoading(false)
        return
      }
      const first =
        (user.user_metadata?.full_name as string | undefined)?.split(" ")[0] ??
        "Usuario"
      setUserName(first)
      Promise.all([
        getClientCases(user.id),
        getRecentActivitiesForClient(user.id, 8),
      ]).then(([data, acts]) => {
        setCases(
          (data ?? []).map((row) =>
            normalizeHomeCase(row as Record<string, unknown>)
          )
        )
        setActivityFeed((acts ?? []) as ActivityRow[])
        setLoading(false)
      })
    })
  }, [])

  const activeCases = cases.filter((c) => c.status === "active")

  const stats = [
    {
      label: "Casos Activos",
      value: activeCases.length,
      icon: Folder,
      color: "text-[#5E8B8C]",
      link: "/dashboard-client/cases",
      linkText: "Ver todos",
    },
    {
      label: "Mensajes Nuevos",
      value: 3,
      icon: MessageSquare,
      color: "text-[#C27F79]",
      link: "/dashboard-client/messages",
      linkText: "Ver mensajes",
    },
    {
      label: "Próxima Cita",
      value: "25 Ene",
      subtext: "Dra. María González",
      icon: Calendar,
      color: "text-[#F2C94C]",
    },
    {
      label: "Presupuesto Usado",
      value: "$850",
      subtext: "de $1,500",
      icon: DollarSign,
      color: "text-[#75524C]",
      progress: 57,
    },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Skeleton welcome */}
        <div className="bg-white border border-[#D5C3B6]/30 rounded-lg p-6 animate-pulse">
          <div className="h-6 bg-[#D5C3B6]/30 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-[#D5C3B6]/30 rounded w-1/4"></div>
        </div>
        
        {/* Skeleton stats */}
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
      {/* Welcome banner */}
      <div className="bg-white border border-[#D5C3B6]/30 rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-[#2D3C3C]">
          Bienvenido, {userName}
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
            <p className="text-2xl font-bold text-[#2D3C3C]">{stat.value}</p>
            {stat.subtext && (
              <p className="text-sm text-[#75524C]">{stat.subtext}</p>
            )}
            {stat.progress !== undefined && (
              <div className="mt-2">
                <div className="h-2 bg-[#D5C3B6]/30 rounded-full">
                  <div
                    className="h-2 bg-[#75524C] rounded-full"
                    style={{ width: `${stat.progress}%` }}
                  ></div>
                </div>
              </div>
            )}
            {stat.link && (
              <Link
                href={stat.link}
                className="mt-2 text-sm text-[#5E8B8C] hover:underline inline-flex items-center gap-1"
              >
                {stat.linkText}
                <ArrowRight size={14} />
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Active cases */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#2D3C3C]">Casos Activos</h2>
          <Link
            href="/dashboard-client/cases"
            className="text-sm text-[#5E8B8C] hover:underline"
          >
            Ver todos
          </Link>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {(activeCases.length > 0 ? activeCases.slice(0, 2) : []).map((caseItem) => {
            const status = statusConfig[caseItem.status]
            return (
              <div
                key={caseItem.id}
                className="bg-white border border-[#D5C3B6]/30 rounded-lg shadow-sm p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-[#2D3C3C]">{caseItem.title}</h3>
                    <span className="text-sm text-[#75524C]">{caseItem.type}</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                    {status.label}
                  </span>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#5E8B8C] to-[#2D3C3C] flex items-center justify-center text-white text-xs font-bold">
                    {caseItem.lawyer.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#2D3C3C]">
                      {caseItem.lawyer.name}
                    </p>
                    <p className="text-xs text-[#75524C]">
                      {caseItem.lawyer.specialization}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-[#75524C]">Progreso</span>
                    <span className="font-medium text-[#2D3C3C]">{caseItem.progress}%</span>
                  </div>
                  <div className="h-2 bg-[#D5C3B6]/30 rounded-full">
                    <div
                      className={`h-2 rounded-full ${status.bg}`}
                      style={{ width: `${caseItem.progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <p className="text-[#75524C]">
                    <span className="font-medium">Última actualización:</span> {caseItem.lastUpdate}
                  </p>
                  <p className="text-[#75524C]">
                    <span className="font-medium">Próximo paso:</span> {caseItem.nextAction}
                  </p>
                </div>

                <Link
                  href={`/dashboard-client/cases?id=${caseItem.id}`}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 border border-[#5E8B8C] text-[#5E8B8C] rounded-lg hover:bg-[#5E8B8C]/10 transition-colors"
                >
                  Ver Detalles
                  <ArrowRight size={16} />
                </Link>
              </div>
            )
          })}
        </div>
      </div>

      {/* CTA Banner */}
      <div className="bg-gradient-to-r from-[#5E8B8C] to-[#2D3C3C] rounded-lg p-6 text-white">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold mb-1">¿Necesitas un abogado?</h3>
            <p className="text-white/80">
              Define tu presupuesto y encuentra el ideal.
            </p>
          </div>
          <Link
            href="/dashboard-client/find-lawyer"
            className="px-6 py-3 bg-white text-[#2D3C3C] rounded-lg font-semibold hover:bg-white/90 transition-colors flex items-center gap-2"
          >
            <Search size={18} />
            Buscar Abogado
          </Link>
        </div>
      </div>

      {/* Activity feed */}
      <div>
        <h2 className="text-lg font-bold text-[#2D3C3C] mb-4">Actividad Reciente</h2>
        <div className="bg-white border border-[#D5C3B6]/30 rounded-lg shadow-sm">
          {activityFeed.length === 0 ? (
            <p className="p-6 text-sm text-[#75524C]">Aún no hay actividad en tus casos.</p>
          ) : (
            activityFeed.map((row, index) => {
              const t = (row.type || "").toLowerCase()
              let Icon = Folder
              if (t.includes("document")) Icon = FileText
              else if (t.includes("message")) Icon = MessageCircle
              const caseTitle = cases.find((c) => c.id === row.case_id)?.title
              const when = row.created_at
                ? new Date(row.created_at).toLocaleString("es-CL")
                : ""
              return (
                <div
                  key={row.id}
                  className={`flex items-center gap-4 p-4 ${
                    index !== activityFeed.length - 1 ? "border-b border-[#D5C3B6]/30" : ""
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-[#5E8B8C]/10 flex items-center justify-center">
                    <Icon className="text-[#5E8B8C]" size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#2D3C3C] font-medium">{row.title}</p>
                    {row.description ? (
                      <p className="text-xs text-[#75524C] truncate">{row.description}</p>
                    ) : null}
                    {caseTitle ? (
                      <p className="text-xs text-[#D5C3B6] mt-0.5">Caso: {caseTitle}</p>
                    ) : null}
                    <p className="text-xs text-[#75524C] mt-1">{when}</p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
