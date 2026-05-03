export type Role = "client" | "lawyer"
export type CaseStatus =
  | "waiting"
  | "active"
  | "pending"
  | "inProgress"
  | "completed"
  | "rejected"
export type RequestStatus = "pending" | "accepted" | "rejected"
export type Urgency = "normal" | "urgent" | "very-urgent"

export interface Profile {
  id: string
  role: Role
  full_name: string
  email: string
  phone?: string
  city?: string
  bio?: string
  avatar_url?: string
  created_at: string
}

export interface LawyerProfile {
  id: string
  title?: string
  license_number?: string
  experience_years: number
  success_rate: number
  verified: boolean
  hourly_rate?: number
  fixed_rate?: number
  monthly_retainer?: number
  contingency_rate?: number
  free_consult: boolean
  payment_plan: boolean
  contingency: boolean
  min_client_budget?: number
  rating: number
  review_count: number
  available: boolean
  specialties: string[]
  availability_grid: Record<string, Record<string, boolean>>
}

export interface LawyerWithProfile extends Profile {
  lawyer_profiles: LawyerProfile
}

export interface Case {
  id: string
  title: string
  type: string
  description?: string
  status: CaseStatus
  priority: string
  progress: number
  budget?: number
  next_action?: string
  client_id: string
  lawyer_id?: string
  created_at: string
  updated_at: string
  client?: Profile
  lawyer?: Profile
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  sender_role: "client" | "lawyer"
  text: string
  read: boolean
  created_at: string
}

export interface Conversation {
  id: string
  client_id: string
  lawyer_id: string
  case_id?: string
  last_message?: string
  last_message_at: string
  client?: Profile
  lawyer?: Profile & { lawyer_profiles?: LawyerProfile }
  messages?: Message[]
  unread_count?: number
}
