import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { supabase } from '@/plugins/supabase'
import type { Category, CategoryFormData } from '@/types/database'
import { DEFAULT_CATEGORIES } from '@/constants/branding'

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

// Default categories to seed (moved to @/constants/branding.ts)
export const defaultCategories = DEFAULT_CATEGORIES
