import { createClient } from "@/lib/supabase/client"

/** Vista compatible con las cards de buscar abogado (antes mock). */
export type LawyerCard = {
  id: string
  name: string
  specialty: string
  tags: string[]
  city: string
  rate: number
  rating: number
  reviews: number
  verified: boolean
  freeConsult: boolean
  paymentPlan: boolean
  contingency: boolean
  available: boolean
  experience: number
  successRate: number
  bio: string
  reviewsList?: { author: string; text: string; rating: number; date: string }[]
}

export function lawyerSearchRowToCard(row: LawyerSearchRow): LawyerCard | null {
  const lp = row.lawyer_profiles
  if (!lp) return null
  const specs = lp.specialties ?? []
  return {
    id: row.id,
    name: row.full_name,
    specialty: specs[0] ?? "",
    tags: specs,
    city: row.city ?? "",
    rate: Number(lp.hourly_rate ?? 0),
    rating: Number(lp.rating ?? 0),
    reviews: lp.review_count ?? 0,
    verified: lp.verified ?? false,
    freeConsult: lp.free_consult ?? false,
    paymentPlan: lp.payment_plan ?? false,
    contingency: lp.contingency ?? false,
    available: lp.available ?? false,
    experience: lp.experience_years ?? 0,
    successRate: lp.success_rate ?? 0,
    bio: row.bio ?? "",
  }
}

export type LawyerSearchRow = {
  id: string
  full_name: string
  city: string | null
  bio: string | null
  avatar_url: string | null
  lawyer_profiles: {
    hourly_rate: number | null
    rating: number | null
    review_count: number | null
    experience_years: number | null
    success_rate: number | null
    verified: boolean | null
    free_consult: boolean | null
    payment_plan: boolean | null
    contingency: boolean | null
    available: boolean | null
    specialties: string[] | null
    min_client_budget: number | null
  } | null
}

export async function getLawyers(filters?: {
  budgetMin?: number
  budgetMax?: number
  specialty?: string
  freeConsult?: boolean
  paymentPlan?: boolean
  city?: string
}): Promise<LawyerSearchRow[]> {
  const supabase = createClient()

  let query = supabase
    .from("profiles")
    .select(
      `
      id,
      full_name,
      city,
      bio,
      avatar_url,
      lawyer_profiles (
        hourly_rate,
        rating,
        review_count,
        experience_years,
        success_rate,
        verified,
        free_consult,
        payment_plan,
        contingency,
        available,
        specialties,
        min_client_budget
      )
    `
    )
    .not("lawyer_profiles", "is", null)

  if (filters?.city) {
    query = query.ilike("city", `%${filters.city}%`)
  }

  const { data, error } = await query
  if (error || !data) return []

  let rows = data as unknown as LawyerSearchRow[]

  if (filters?.freeConsult === true) {
    rows = rows.filter((r) => r.lawyer_profiles?.free_consult === true)
  }
  if (filters?.paymentPlan === true) {
    rows = rows.filter((r) => r.lawyer_profiles?.payment_plan === true)
  }
  if (filters?.specialty) {
    rows = rows.filter((r) =>
      (r.lawyer_profiles?.specialties ?? []).includes(filters.specialty!)
    )
  }
  if (filters?.budgetMax != null) {
    rows = rows.filter(
      (r) =>
        r.lawyer_profiles?.hourly_rate == null ||
        r.lawyer_profiles.hourly_rate <= filters.budgetMax!
    )
  }
  if (filters?.budgetMin != null) {
    rows = rows.filter(
      (r) =>
        r.lawyer_profiles?.hourly_rate != null &&
        r.lawyer_profiles.hourly_rate >= filters.budgetMin!
    )
  }

  return rows
}

export async function getLawyerReviews(lawyerId: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from("reviews")
    .select("rating, text, created_at, client:profiles(full_name)")
    .eq("lawyer_id", lawyerId)
    .order("created_at", { ascending: false })
    .limit(5)
  return data ?? []
}
