import { computed, toValue, type MaybeRefOrGetter } from "vue";
import { useQuery, useMutation, useQueryClient } from "@tanstack/vue-query";
import { supabase } from "@/plugins/supabase";
import type { Category, CategoryFormData } from "@/types/database";
import { DEFAULT_CATEGORIES } from "@/constants/branding";
import { useAuth } from "./useAuth";

export function useCategories(teamId?: MaybeRefOrGetter<string | undefined>) {
  const queryClient = useQueryClient();
  const resolvedTeamId = computed(() => toValue(teamId));
  const { verifyAdminStatus } = useAuth();

  // Fetch all categories (global + team-specific)
  const categoriesQuery = useQuery({
    queryKey: computed(() => ["categories", resolvedTeamId.value]),
    queryFn: async (): Promise<Category[]> => {
      let query = supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true });

      if (resolvedTeamId.value) {
        // Get global categories (team_id is null) OR team-specific
        query = query.or(`team_id.is.null,team_id.eq.${resolvedTeamId.value}`);
      } else {
        // Only global categories
        query = query.is("team_id", null);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Category[];
    },
  });

  // Get only global categories
  const globalCategories = computed(
    () => categoriesQuery.data.value?.filter((c) => c.team_id === null) ?? [],
  );

  // Get only team categories
  const teamCategories = computed(() =>
    resolvedTeamId.value
      ? (categoriesQuery.data.value?.filter(
          (c) => c.team_id === resolvedTeamId.value,
        ) ?? [])
      : [],
  );

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (
      formData: CategoryFormData & { team_id?: string | null },
    ) => {
      const response = await supabase
        .from("categories")
        .insert({
          name: formData.name,
          color: formData.color,
          icon: formData.icon,
          sort_order: formData.sort_order,
          team_id: formData.team_id ?? null,
        })
        .select();

      if (response.error) throw response.error;
      const data = response.data?.[0];
      if (!data) throw new Error('Failed to create category');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<Category> & { id: string }) => {
      // Check if this is a global category (team_id is null)
      const category = categoriesQuery.data.value?.find((c) => c.id === id);
      const isGlobal = category?.team_id === null;

      if (isGlobal) {
        // Use secure RPC function for global categories
        const isAdmin = await verifyAdminStatus();
        if (!isAdmin) {
          throw new Error("Only app admins can update global categories");
        }

        const { data, error } = await supabase.rpc("update_global_category", {
          category_id: id,
          new_name: updates.name ?? null,
          new_color: updates.color ?? null,
          new_icon: updates.icon ?? null,
          new_sort_order: updates.sort_order ?? null,
        });

        if (error) throw error;
        return data;
      } else {
        // Regular update for team categories (RLS handles permission)
        const response = await supabase
          .from("categories")
          .update(updates)
          .eq("id", id)
          .select();

        if (response.error) throw response.error;
        const data = response.data?.[0];
        if (!data) throw new Error('Category not found');
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      // Check if this is a global category
      const category = categoriesQuery.data.value?.find(
        (c) => c.id === categoryId,
      );
      const isGlobal = category?.team_id === null;

      if (isGlobal) {
        // Use secure RPC function for global categories
        const isAdmin = await verifyAdminStatus();
        if (!isAdmin) {
          throw new Error("Only app admins can delete global categories");
        }

        const { data, error } = await supabase.rpc("delete_global_category", {
          category_id: categoryId,
        });

        if (error) throw error;
        return data;
      } else {
        // Regular delete for team categories (RLS handles permission)
        const { error } = await supabase
          .from("categories")
          .delete()
          .eq("id", categoryId);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

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
    refetch: categoriesQuery.refetch,
  };
}

// Default categories to seed (moved to @/constants/branding.ts)
export const defaultCategories = DEFAULT_CATEGORIES;
