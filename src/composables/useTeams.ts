// Teams composable with VueQuery
import { computed } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { supabase } from '@/plugins/supabase'
import type { Team, TeamWithMembers, TeamFormData, TeamMember } from '@/types/database'
import { useAuth } from './useAuth'

export function useTeams() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  // Fetch all teams user is member of
  const teamsQuery = useQuery({
    queryKey: ['teams'],
    queryFn: async (): Promise<TeamWithMembers[]> => {
      if (!user.value) return []

      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          team_members!inner(
            *,
            profile:profiles(*)
          )
        `)
        .eq('team_members.user_id', user.value.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as TeamWithMembers[]
    },
    enabled: computed(() => !!user.value)
  })

  // Generate unique invite code
  function generateInviteCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Avoid confusing chars
    let code = ''
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  // Create team mutation
  const createTeamMutation = useMutation({
    mutationFn: async (formData: TeamFormData) => {
      if (!user.value) throw new Error('Not authenticated')

      // Create team
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
          name: formData.name,
          description: formData.description || null,
          invite_code: generateInviteCode()
        })
        .select()
        .single()

      if (teamError) throw teamError

      // Add creator as admin
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: team.id,
          user_id: user.value.id,
          role: 'admin'
        })

      if (memberError) throw memberError

      return team
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
    }
  })

  // Join team mutation
  const joinTeamMutation = useMutation({
    mutationFn: async (inviteCode: string) => {
      if (!user.value) throw new Error('Not authenticated')

      // Find team by invite code
      const { data: team, error: findError } = await supabase
        .from('teams')
        .select('id')
        .eq('invite_code', inviteCode.toUpperCase())
        .single()

      if (findError) throw new Error('Ongeldige uitnodigingscode')

      // Check if already member
      const { data: existing } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', team.id)
        .eq('user_id', user.value.id)
        .single()

      if (existing) throw new Error('Je bent al lid van dit team')

      // Add as member
      const { error: joinError } = await supabase
        .from('team_members')
        .insert({
          team_id: team.id,
          user_id: user.value.id,
          role: 'member'
        })

      if (joinError) throw joinError

      return team
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
    }
  })

  // Leave team mutation
  const leaveTeamMutation = useMutation({
    mutationFn: async (teamId: string) => {
      if (!user.value) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', user.value.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
    }
  })

  // Delete team mutation (admin only)
  const deleteTeamMutation = useMutation({
    mutationFn: async (teamId: string) => {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
    }
  })

  return {
    // Query
    teams: teamsQuery.data,
    isLoading: teamsQuery.isLoading,
    error: teamsQuery.error,

    // Mutations
    createTeam: createTeamMutation.mutateAsync,
    joinTeam: joinTeamMutation.mutateAsync,
    leaveTeam: leaveTeamMutation.mutateAsync,
    deleteTeam: deleteTeamMutation.mutateAsync,

    // Mutation states
    isCreating: createTeamMutation.isPending,
    isJoining: joinTeamMutation.isPending,

    // Refetch
    refetch: teamsQuery.refetch
  }
}

// Single team query with members
export function useTeam(teamId: string) {
  const { user } = useAuth()

  const teamQuery = useQuery({
    queryKey: ['team', teamId],
    queryFn: async (): Promise<TeamWithMembers | null> => {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          team_members(
            *,
            profile:profiles(*)
          )
        `)
        .eq('id', teamId)
        .single()

      if (error) throw error
      return data as TeamWithMembers
    },
    enabled: !!teamId
  })

  // Check if current user is admin of this team
  const isTeamAdmin = computed(() => {
    if (!teamQuery.data.value || !user.value) return false
    const membership = teamQuery.data.value.team_members?.find(
      m => m.user_id === user.value!.id
    )
    return membership?.role === 'admin'
  })

  return {
    team: teamQuery.data,
    isLoading: teamQuery.isLoading,
    error: teamQuery.error,
    isTeamAdmin,
    refetch: teamQuery.refetch
  }
}
