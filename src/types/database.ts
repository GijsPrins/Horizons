// TypeScript type definitions for Horizons Database

// ============================================
// Database Types (matches Supabase schema)
// ============================================

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at'>
        Update: Partial<Omit<Profile, 'id'>>
      }
      teams: {
        Row: Team
        Insert: Omit<Team, 'id' | 'created_at'>
        Update: Partial<Omit<Team, 'id'>>
      }
      team_members: {
        Row: TeamMember
        Insert: Omit<TeamMember, 'id' | 'joined_at'>
        Update: Partial<Omit<TeamMember, 'id'>>
      }
      categories: {
        Row: Category
        Insert: Omit<Category, 'id' | 'created_at'>
        Update: Partial<Omit<Category, 'id'>>
      }
      goals: {
        Row: Goal
        Insert: Omit<Goal, 'id' | 'created_at'>
        Update: Partial<Omit<Goal, 'id'>>
      }
      progress_entries: {
        Row: ProgressEntry
        Insert: Omit<ProgressEntry, 'id' | 'created_at'>
        Update: Partial<Omit<ProgressEntry, 'id'>>
      }
      attachments: {
        Row: Attachment
        Insert: Omit<Attachment, 'id' | 'created_at'>
        Update: Partial<Omit<Attachment, 'id'>>
      }
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

export interface Team {
  id: string
  name: string
  description: string | null
  invite_code: string
  created_at: string
}

export interface TeamMember {
  id: string
  team_id: string
  user_id: string
  role: 'admin' | 'member'
  joined_at: string
}

export interface Category {
  id: string
  team_id: string | null // NULL = global category
  name: string
  color: string
  icon: string
  sort_order: number
  created_at: string
}

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

export interface ProgressEntry {
  id: string
  goal_id: string
  entry_date: string
  week_number: number | null // For weekly goals
  note: string | null
  achieved: boolean
  created_at: string
}

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
  description: string
  year: number
  category_id: string | null
  goal_type: GoalType
  target_count: number | null
  is_shared: boolean
}

export interface TeamFormData {
  name: string
  description: string
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
