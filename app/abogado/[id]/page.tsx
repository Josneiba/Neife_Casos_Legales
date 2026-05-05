"use client"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Star, MapPin, Clock, CheckCircle, Award, MessageCircle } from "lucide-react"
import Link from "next/link"

export default function LawyerPublicProfile({ params }: { params: { id: string } }) {
  const [profile, setProfile] = useState<any>(null)
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, bio, city, avatar_url")
        .eq("id", params.id)
        .eq("role", "lawyer")
        .single(),
      supabase
        .from("lawyer_profiles")
        .select("*")
        .eq("id", params.id)
        .single(),
      supabase
        .from("lawyer_experience")
        .select("*")
        .eq("lawyer_id", params.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("reviews")
        .select("id, rating, comment, created_at, profiles(full_name)")
        .eq("lawyer_id", params.id)
        .order("created_at", { ascending: false })
        .limit(5),
    ]).then(([profileRes, lpRes, expRes, reviewsRes]) => {
      if (profileRes.data && lpRes.data) {
        setProfile({
          ...profileRes.data,
          ...lpRes.data,
          experience: expRes.data ?? [],
        })
      }
      setReviews(reviewsRes.data ?? [])
      setLoading(false)
    })
  }, [params.id])

  if (loading) return (
    <div className="min-h-screen bg-[#F8F7F4] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#5E8B8C] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!profile) return (
    <div className="min-h-screen bg-[#F8F7F4] flex items-center justify-center">
      <p className="text-[#75524C]">Abogado no encontrado</p>
    </div>
  )

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : profile.rating ?? "—"

  return (
    <div className="min-h-screen bg-[#F8F7F4] py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 border border-[#D5C3B6]/40 shadow-sm">
          <div className="flex gap-4 items-start">
            <div className="w-20 h-20 rounded-2xl bg-[#5E8B8C]/10 flex items-center justify-center shrink-0 overflow-hidden">
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                : <span className="text-2xl font-bold text-[#5E8B8C]">{profile.full_name?.[0]}</span>
              }
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-[#2D3C3C]">{profile.full_name}</h1>
              {profile.city && (
                <p className="text-sm text-[#75524C] flex items-center gap-1 mt-1">
                  <MapPin size={13} /> {profile.city}
                </p>
              )}
              <div className="flex flex-wrap gap-2 mt-2">
                {profile.verified && (
                  <span className="flex items-center gap-1 text-xs bg-[#5E8B8C]/10 text-[#5E8B8C] px-2 py-1 rounded-full font-medium">
                    <CheckCircle size={11} /> Verificado
                  </span>
                )}
                {profile.free_consult && (
                  <span className="text-xs bg-[#F2C94C]/10 text-[#C29A2A] px-2 py-1 rounded-full font-medium">
                    Consulta gratis
                  </span>
                )}
                {profile.payment_plan && (
                  <span className="text-xs bg-[#75524C]/10 text-[#75524C] px-2 py-1 rounded-full font-medium">
                    Pago en cuotas
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-[#D5C3B6]/40">
            <div className="text-center">
              <p className="text-xl font-bold text-[#2D3C3C]">{avgRating}</p>
              <p className="text-xs text-[#75524C]">Calificación</p>
            </div>
            <div className="text-center border-x border-[#D5C3B6]/40">
              <p className="text-xl font-bold text-[#2D3C3C]">{profile.experience_years ?? "—"}</p>
              <p className="text-xs text-[#75524C]">Años exp.</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-[#2D3C3C]">{profile.success_rate ?? "—"}%</p>
              <p className="text-xs text-[#75524C]">Éxito</p>
            </div>
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className="bg-white rounded-2xl p-6 border border-[#D5C3B6]/40 shadow-sm">
            <h2 className="text-sm font-semibold text-[#2D3C3C] mb-2">Sobre mí</h2>
            <p className="text-sm text-[#75524C] leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {/* Especialidades */}
        {profile.specialties?.length > 0 && (
          <div className="bg-white rounded-2xl p-6 border border-[#D5C3B6]/40 shadow-sm">
            <h2 className="text-sm font-semibold text-[#2D3C3C] mb-3">Especialidades</h2>
            <div className="flex flex-wrap gap-2">
              {profile.specialties.map((s: string) => (
                <span key={s} className="text-xs bg-[#F8F7F4] border border-[#D5C3B6]/60 text-[#75524C] px-3 py-1.5 rounded-full">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tarifa */}
        <div className="bg-white rounded-2xl p-6 border border-[#D5C3B6]/40 shadow-sm">
          <h2 className="text-sm font-semibold text-[#2D3C3C] mb-3">Honorarios</h2>
          <p className="text-2xl font-bold text-[#5E8B8C]">
            ${profile.hourly_rate?.toLocaleString("es-CL") ?? "—"}
            <span className="text-sm font-normal text-[#75524C] ml-1">/hora</span>
          </p>
          {profile.free_consult && (
            <p className="text-xs text-[#75524C] mt-1">Primera consulta sin costo</p>
          )}
        </div>

        {/* Reseñas */}
        {reviews.length > 0 && (
          <div className="bg-white rounded-2xl p-6 border border-[#D5C3B6]/40 shadow-sm">
            <h2 className="text-sm font-semibold text-[#2D3C3C] mb-4">Opiniones ({reviews.length})</h2>
            <div className="space-y-4">
              {reviews.map((r) => (
                <div key={r.id} className="border-b border-[#D5C3B6]/30 last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex">
                      {[1,2,3,4,5].map((n) => (
                        <Star key={n} size={12} className={n <= r.rating ? "text-[#F2C94C] fill-current" : "text-[#D5C3B6]"} />
                      ))}
                    </div>
                    <span className="text-xs text-[#75524C]">
                      {r.profiles?.full_name ?? "Cliente"} · {new Date(r.created_at).toLocaleDateString("es-CL")}
                    </span>
                  </div>
                  {r.comment && <p className="text-sm text-[#2D3C3C] leading-relaxed">{r.comment}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <Link
          href={`/register?role=client`}
          className="block w-full text-center bg-[#5E8B8C] text-white py-4 rounded-2xl font-semibold text-sm hover:bg-[#4A7475] transition-colors"
        >
          Publicar mi caso para este abogado
        </Link>
      </div>
    </div>
  )
}
