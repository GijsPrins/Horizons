// TypeScript type definitions for Horizons Database
// Matching the Supabase schema structure for better type inference

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: ProfileInsert
        Update: ProfileUpdate
      }
      teams: {
        Row: Team
        Insert: TeamInsert
        Update: TeamUpdate
      }
      team_members: {
        Row: TeamMember
        Insert: TeamMemberInsert
        Update: TeamMemberUpdate
      }
      categories: {
        Row: Category
        Insert: CategoryInsert
        Update: CategoryUpdate
      }
      goals: {
        Row: Goal
        Insert: GoalInsert
        Update: GoalUpdate
      }
      progress_entries: {
        Row: ProgressEntry
        Insert: ProgressEntryInsert
        Update: ProgressEntryUpdate
      }
      attachments: {
        Row: Attachment
        Insert: AttachmentInsert
        Update: AttachmentUpdate
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// ============================================
// Entity Types
// ============================================

export interface Profile {
  id: string // UUID, references auth.users.id
  display_name: string
  avatar_url: string | null
  is_app_admin: boolean
  created_at: string
}

export type ProfileInsert = Omit<Profile, 'created_at'>
export type ProfileUpdate = Partial<Omit<Profile, 'id' | 'created_at'>>

export interface Team {
  id: string
  name: string
  description: string | null
  invite_code: string
  created_at: string
}

export type TeamInsert = Omit<Team, 'id' | 'created_at'>
export type TeamUpdate = Partial<Omit<Team, 'id' | 'created_at'>>

export interface TeamMember {
  id: string
  team_id: string
  user_id: string
  role: 'admin' | 'member'
  joined_at: string
}

export type TeamMemberInsert = Omit<TeamMember, 'id' | 'joined_at'>
export type TeamMemberUpdate = Partial<Omit<TeamMember, 'id' | 'joined_at'>>

export interface Category {
  id: string
  team_id: string | null // NULL = global category
  name: string
  color: string
  icon: string
  sort_order: number
  created_at: string
}

export type CategoryInsert = Omit<Category, 'id' | 'created_at'>
export type CategoryUpdate = Partial<Omit<Category, 'id' | 'created_at'>>

export type GoalType = 'single' | 'weekly' | 'milestone'

export interface Goal {
  id: string
  user_id: string
  team_id: string
  category_id: string | null
  year: number
  title: string
  description: string | null
  goal_type: GoalType
  target_count: number | null // For milestone goals
  is_shared: boolean
  is_completed: boolean
  completed_at: string | null
  created_at: string
}

export type GoalInsert = Omit<Goal, 'id' | 'created_at'>
export type GoalUpdate = Partial<Omit<Goal, 'id' | 'created_at'>>

export interface ProgressEntry {
  id: string
  goal_id: string
  entry_date: string
  week_number: number | null // For weekly goals
  note: string | null
  achieved: boolean
  created_at: string
}

export type ProgressEntryInsert = Omit<ProgressEntry, 'id' | 'created_at'>
export type ProgressEntryUpdate = Partial<Omit<ProgressEntry, 'id' | 'created_at'>>

export type AttachmentType = 'url' | 'image' | 'note' | 'milestone'

export interface Attachment {
  id: string
  goal_id: string
  type: AttachmentType
  title: string | null
  url: string | null
  content: string | null
  milestone_date: string | null
  created_at: string
}

export type AttachmentInsert = Omit<Attachment, 'id' | 'created_at'>
export type AttachmentUpdate = Partial<Omit<Attachment, 'id' | 'created_at'>>

// ============================================
// Extended Types (with relations)
// ============================================

export interface GoalWithRelations extends Goal {
  category?: Category
  profile?: Profile
  progress_entries?: ProgressEntry[]
  attachments?: Attachment[]
}

export interface TeamWithMembers extends Team {
  team_members?: (TeamMember & { profile?: Profile })[]
}

export interface CategoryWithCount extends Category {
  goals_count?: number
}

// ============================================
// Form Types
// ============================================

export interface GoalFormData {
  title: string
  description: string | null
  year: number
  category_id: string | null
  goal_type: GoalType
  target_count: number | null
  is_shared: boolean
  file?: File | null
}

export interface TeamFormData {
  name: string
  description: string | null
}

export interface CategoryFormData {
  name: string
  color: string
  icon: string
  sort_order: number
}

export interface AttachmentFormData {
  type: AttachmentType
  title?: string | null
  url?: string | null
  content?: string | null
  milestone_date?: string | null
}

// ============================================
// UI Types
// ============================================

export interface NavItem {
  title: string
  icon: string
  to: string
  requiresAuth?: boolean
  requiresAdmin?: boolean
}

export interface YearOption {
  year: number
  label: string
}
