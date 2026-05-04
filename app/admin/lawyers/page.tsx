"use client"

import { useEffect, useState } from "react"
import { CheckCircle, Loader2, Shield } from "lucide-react"
import {
  adminListLawyersPendingVerification,
  adminVerifyLawyer,
} from "@/lib/actions/admin"

type Row = {
  id: string
  title?: string | null
  license_number?: string | null
  profiles?: { full_name?: string | null; email?: string | null } | null
}

export default function AdminLawyersPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lawyers, setLawyers] = useState<Row[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    setError(null)
    adminListLawyersPendingVerification().then((res) => {
      if ("error" in res && res.error && res.error !== "Sin permiso") {
        setError(String(res.error))
      }
      if ("error" in res && res.error === "Sin permiso") {
        setError("Tu usuario no está en NEIFE_ADMIN_USER_IDS.")
      }
      setLawyers((res.lawyers as Row[]) ?? [])
      setLoading(false)
    })
  }

  useEffect(() => {
    load()
  }, [])

  const verify = async (id: string) => {
    setBusyId(id)
    const r = await adminVerifyLawyer(id)
    setBusyId(null)
    if ("error" in r && r.error) {
      setError(r.error)
      return
    }
    setLawyers((prev) => prev.filter((x) => x.id !== id))
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-[#75524C]">
        <Loader2 className="animate-spin" size={20} />
        Cargando…
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <Shield className="text-[#75524C] shrink-0 mt-1" size={24} />
        <div>
          <h1 className="text-xl font-bold text-[#2D3C3C]">
            Verificación de abogados
          </h1>
          <p className="text-sm text-[#75524C] mt-1">
            Abogados con perfil pendiente de verificación. Añade tu user UUID en{" "}
            <code className="text-xs bg-white px-1 rounded border border-[#D5C3B6]">
              NEIFE_ADMIN_USER_IDS
            </code>{" "}
            (coma-separado) en el servidor.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-[#C27F79]/10 border border-[#C27F79]/30 text-sm text-[#75524C]">
          {error}
        </div>
      )}

      {lawyers.length === 0 ? (
        <p className="text-[#75524C]">No hay abogados pendientes de verificación.</p>
      ) : (
        <ul className="space-y-3">
          {lawyers.map((lp) => {
            const p = lp.profiles
            return (
              <li
                key={lp.id}
                className="bg-white border border-[#D5C3B6]/30 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div>
                  <p className="font-medium text-[#2D3C3C]">
                    {p?.full_name ?? "—"}
                  </p>
                  <p className="text-sm text-[#75524C]">{p?.email}</p>
                  <p className="text-xs text-[#D5C3B6] mt-1">
                    {lp.title ?? "Sin título"} · Lic. {lp.license_number ?? "—"}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={busyId === lp.id}
                  onClick={() => verify(lp.id)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#5E8B8C] text-white rounded-lg hover:bg-[#5E8B8C]/90 disabled:opacity-50 text-sm"
                >
                  {busyId === lp.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <CheckCircle size={16} />
                  )}
                  Marcar verificado
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
