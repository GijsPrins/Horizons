import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { supabase } from '@/plugins/supabase'
import type { Goal, GoalWithRelations, GoalFormData } from '@/types/database'
import { useAuth } from './useAuth'

export function useGoals(teamId?: MaybeRefOrGetter<string | undefined>, year?: MaybeRefOrGetter<number | undefined>) {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const resolvedYear = computed(() => toValue(year) ?? new Date().getFullYear())
  const resolvedTeamId = computed(() => toValue(teamId))

  // Query keys
  const goalsKey = computed(() => ['goals', resolvedTeamId.value, resolvedYear.value])
  const myGoalsKey = computed(() => ['goals', 'my', resolvedTeamId.value, resolvedYear.value])

  // Fetch all goals for team (including shared goals from others)
  const goalsQuery = useQuery({
    queryKey: goalsKey,
    queryFn: async (): Promise<GoalWithRelations[]> => {
      if (!resolvedTeamId.value) return []

      const { data, error } = await supabase
        .from('goals')
        .select(`
          *,
          category:categories(*),
          profile:profiles!goals_user_id_fkey(*),
          progress_entries(*),
          attachments(*)
        `)
        .eq('team_id', resolvedTeamId.value)
        .eq('year', resolvedYear.value)
        .or(`user_id.eq.${user.value?.id},is_shared.eq.true`)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as GoalWithRelations[]
    },
    enabled: computed(() => !!resolvedTeamId.value && !!user.value)
  })

  // Fetch only my goals
  const myGoalsQuery = useQuery({
    queryKey: myGoalsKey,
    queryFn: async (): Promise<GoalWithRelations[]> => {
      if (!resolvedTeamId.value || !user.value) return []

      const { data, error } = await supabase
        .from('goals')
        .select(`
          *,
          category:categories(*),
          progress_entries(*),
          attachments(*)
        `)
        .eq('team_id', resolvedTeamId.value)
        .eq('user_id', user.value.id)
        .eq('year', resolvedYear.value)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as GoalWithRelations[]
    },
    enabled: computed(() => !!resolvedTeamId.value && !!user.value)
  })

  // Create goal mutation
  const createGoalMutation = useMutation({
    mutationFn: async (formData: GoalFormData & { team_id: string }) => {
      if (!user.value) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('goals')
        .insert({
          ...formData,
          user_id: user.value.id,
          year: resolvedYear.value,
          is_completed: false,
          completed_at: null
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
    }
  })

  // Update goal mutation
  const updateGoalMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Goal> & { id: string }) => {
      const { data, error } = await supabase
        .from('goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      queryClient.invalidateQueries({ queryKey: ['goal', data.id] })
    }
  })

  // Delete goal mutation
  const deleteGoalMutation = useMutation({
    mutationFn: async (goalId: string) => {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId)

      if (error) throw error
      return goalId
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      queryClient.invalidateQueries({ queryKey: ['goal', id] })
    }
  })

  // Toggle goal completion
  const toggleCompleteMutation = useMutation({
    mutationFn: async ({ id, is_completed, date }: { id: string; is_completed: boolean; date?: string }) => {
      const { data, error } = await supabase
        .from('goals')
        .update({
          is_completed,
          completed_at: is_completed ? (date || new Date().toISOString()) : null
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      queryClient.invalidateQueries({ queryKey: ['goal', data.id] })
    }
  })

  return {
    // Queries
    goals: goalsQuery.data,
    myGoals: myGoalsQuery.data,
    isLoading: computed(() => goalsQuery.isLoading.value || myGoalsQuery.isLoading.value),
    error: computed(() => goalsQuery.error.value || myGoalsQuery.error.value),

    // Mutations
    createGoal: createGoalMutation.mutateAsync,
    updateGoal: updateGoalMutation.mutateAsync,
    deleteGoal: deleteGoalMutation.mutateAsync,
    toggleComplete: toggleCompleteMutation.mutateAsync,

    // Mutation states
    isCreating: createGoalMutation.isPending,
    isUpdating: updateGoalMutation.isPending,
    isDeleting: deleteGoalMutation.isPending,

    // Refetch
    refetch: () => {
      goalsQuery.refetch()
      myGoalsQuery.refetch()
    }
  }
}

// Single goal query
export function useGoal(goalId: string) {

  const goalQuery = useQuery({
    queryKey: ['goal', goalId],
    queryFn: async (): Promise<GoalWithRelations | null> => {
      const { data, error } = await supabase
        .from('goals')
        .select(`
          *,
          category:categories(*),
          profile:profiles!goals_user_id_fkey(*),
          progress_entries(*),
          attachments(*)
        `)
        .eq('id', goalId)
        .single()

      if (error) throw error
      return data as GoalWithRelations
    },
    enabled: !!goalId
  })

  return {
    goal: goalQuery.data,
    isLoading: goalQuery.isLoading,
    error: goalQuery.error,
    refetch: goalQuery.refetch
  }
}
