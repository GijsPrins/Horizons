import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { supabase } from '@/plugins/supabase'
import type { Category, CategoryFormData } from '@/types/database'

export function useCategories(teamId?: MaybeRefOrGetter<string | undefined>) {
  const queryClient = useQueryClient()
  const resolvedTeamId = computed(() => toValue(teamId))

  // Fetch all categories (global + team-specific)
  const categoriesQuery = useQuery({
    queryKey: computed(() => ['categories', resolvedTeamId.value]),
    queryFn: async (): Promise<Category[]> => {
      let query = supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true })

      if (resolvedTeamId.value) {
        // Get global categories (team_id is null) OR team-specific
        query = query.or(`team_id.is.null,team_id.eq.${resolvedTeamId.value}`)
      } else {
        // Only global categories
        query = query.is('team_id', null)
      }

      const { data, error } = await query

      if (error) throw error
      return data as Category[]
    }
  })

  // Get only global categories
  const globalCategories = computed(() => 
    categoriesQuery.data.value?.filter(c => c.team_id === null) ?? []
  )

  // Get only team categories
  const teamCategories = computed(() => 
    resolvedTeamId.value 
      ? categoriesQuery.data.value?.filter(c => c.team_id === resolvedTeamId.value) ?? []
      : []
  )

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (formData: CategoryFormData & { team_id?: string | null }) => {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          name: formData.name,
          color: formData.color,
          icon: formData.icon,
          sort_order: formData.sort_order,
          team_id: formData.team_id ?? null
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    }
  })

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Category> & { id: string }) => {
      const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    }
  })

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    }
  })

  return {
    // Query
    categories: categoriesQuery.data,
    globalCategories,
    teamCategories,
    isLoading: categoriesQuery.isLoading,
    error: categoriesQuery.error,

    // Mutations
    createCategory: createCategoryMutation.mutateAsync,
    updateCategory: updateCategoryMutation.mutateAsync,
    deleteCategory: deleteCategoryMutation.mutateAsync,

    // Mutation states
    isCreating: createCategoryMutation.isPending,
    isUpdating: updateCategoryMutation.isPending,
    isDeleting: deleteCategoryMutation.isPending,

    // Refetch
    refetch: categoriesQuery.refetch
  }
}

// Default categories to seed
export const defaultCategories: Omit<CategoryFormData, 'sort_order'>[] = [
  { name: 'Carrière', color: '#F44336', icon: 'mdi-briefcase' }, // Red (C)
  { name: 'Creatief', color: '#FF9800', icon: 'mdi-palette' }, // Orange (C)
  { name: 'Financieel', color: '#FFEB3B', icon: 'mdi-currency-eur' }, // Yellow (F)
  { name: 'Gezondheid', color: '#4CAF50', icon: 'mdi-heart-pulse' }, // Green (G)
  { name: 'Overig', color: '#2196F3', icon: 'mdi-dots-horizontal' }, // Blue (O)
  { name: 'Persoonlijk', color: '#3F51B5', icon: 'mdi-account' }, // Indigo (P)
  { name: 'Relatie', color: '#9C27B0', icon: 'mdi-heart' }, // Violet (R)
  { name: 'Sport', color: '#E91E63', icon: 'mdi-run' }, // Pink (S)
]
