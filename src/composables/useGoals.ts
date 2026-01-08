import { computed, toValue, type MaybeRefOrGetter } from "vue";
import { useI18n } from "vue-i18n";
import { useQuery, useMutation, useQueryClient } from "@tanstack/vue-query";
import { supabase } from "@/plugins/supabase";
import type { GoalWithRelations, GoalFormData, Goal } from "@/types/database";
import { useAuth } from "./useAuth";
import { useAttachments } from "./useAttachments";

export function useGoals(
  teamId?: MaybeRefOrGetter<string | undefined>,
  year?: MaybeRefOrGetter<number | undefined>,
) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { uploadFile } = useAttachments();

  const { t } = useI18n();

  const resolvedYear = computed(
    () => toValue(year) ?? new Date().getFullYear(),
  );
  const resolvedTeamId = computed(() => toValue(teamId));

  // Query keys
  const goalsKey = computed(() => [
    "goals",
    resolvedTeamId.value,
    resolvedYear.value,
  ]);
  const myGoalsKey = computed(() => [
    "goals",
    "my",
    resolvedTeamId.value,
    resolvedYear.value,
  ]);

  // Fetch all goals for team (including shared goals from others)
  const goalsQuery = useQuery({
    queryKey: goalsKey,
    queryFn: async (): Promise<GoalWithRelations[]> => {
      if (!resolvedTeamId.value) return [];

      const { data, error } = await supabase
        .from("goals")
        .select(
          `
          *,
          category:categories(*),
          profile:profiles!goals_user_id_fkey(*),
          progress_entries(*),
          attachments(*)
        `,
        )
        .eq("team_id", resolvedTeamId.value)
        .eq("year", resolvedYear.value)
        .or(`user_id.eq.${user.value?.id},is_shared.eq.true`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as GoalWithRelations[];
    },
    enabled: computed(() => !!resolvedTeamId.value && !!user.value),
  });

  // Fetch only my goals
  const myGoalsQuery = useQuery({
    queryKey: myGoalsKey,
    queryFn: async (): Promise<GoalWithRelations[]> => {
      if (!resolvedTeamId.value || !user.value) return [];

      const { data, error } = await supabase
        .from("goals")
        .select(
          `
          *,
          category:categories(*),
          progress_entries(*),
          attachments(*)
        `,
        )
        .eq("team_id", resolvedTeamId.value)
        .eq("user_id", user.value.id)
        .eq("year", resolvedYear.value)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as GoalWithRelations[];
    },
    enabled: computed(() => !!resolvedTeamId.value && !!user.value),
  });
  // Create goal mutation
  const createGoalMutation = useMutation({
    mutationFn: async (formData: GoalFormData & { team_id: string }) => {
      if (!user.value) throw new Error(t("auth.errors.notAuthenticated"));

      const { file, ...goalData } = formData;

      // 1. Create the goal
      const { data: goal, error } = await supabase
        .from("goals")
        .insert({
          ...goalData,
          user_id: user.value.id,
          is_completed: false,
          completed_at: null,
        })
        .select()
        .single();

      if (error) throw error;

      // 2. If there's a file, upload it using the shared logic
      if (file && goal) {
        try {
          await uploadFile({
            goal_id: goal.id,
            file: file,
            title: file.name,
          });
        } catch (uploadErr) {
          console.error("Initial file upload failed:", uploadErr);
          // We don't fail the goal creation if only the attachment fails
        }
      }

      return goal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });

  // Update goal mutation
  const updateGoalMutation = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: (Partial<Goal> | Partial<GoalFormData>) & { id: string }) => {
      const { file, ...goalUpdates } = updates as Partial<Goal> & {
        file?: File;
      };
      // Omit read-only fields that might be in updates
      const { created_at, user_id, ...validUpdates } = goalUpdates;

      const { data: goal, error } = await supabase
        .from("goals")
        .update(validUpdates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // If there's a file, upload it using the shared logic
      if (file && goal) {
        try {
          await uploadFile({
            goal_id: goal.id,
            file: file,
            title: file.name,
          });
        } catch (uploadErr) {
          console.error("File upload during update failed:", uploadErr);
        }
      }

      return goal;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["goal", data?.id] });
    },
  });

  // Delete goal mutation
  const deleteGoalMutation = useMutation({
    mutationFn: async (goalId: string) => {
      const { error } = await supabase.from("goals").delete().eq("id", goalId);

      if (error) throw error;
      return goalId;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["goal", id] });
    },
  });

  // Toggle goal completion
  const toggleCompleteMutation = useMutation({
    mutationFn: async ({
      id,
      is_completed,
      date,
    }: {
      id: string;
      is_completed: boolean;
      date?: string;
    }) => {
      const { data, error } = await supabase
        .from("goals")
        .update({
          is_completed,
          completed_at: is_completed ? date || new Date().toISOString() : null,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["goal", data.id] });
    },
  });

  // Copy goal to next year
  const copyToNextYearMutation = useMutation({
    mutationFn: async (goalId: string) => {
      if (!user.value) throw new Error(t("auth.errors.notAuthenticated"));

      // Fetch the original goal with all its data
      const { data: originalGoal, error: fetchError } = await supabase
        .from("goals")
        .select("*")
        .eq("id", goalId)
        .single();

      if (fetchError) throw fetchError;

      const nextYear = originalGoal.year + 1;

      // Create a new goal with the same properties but for the next year
      const { data: newGoal, error: createError } = await supabase
        .from("goals")
        .insert({
          user_id: originalGoal.user_id,
          team_id: originalGoal.team_id,
          category_id: originalGoal.category_id,
          year: nextYear,
          title: originalGoal.title,
          description: originalGoal.description,
          goal_type: originalGoal.goal_type,
          target_count: originalGoal.target_count,
          is_shared: originalGoal.is_shared,
          is_completed: false,
          completed_at: null,
          deadline_date: originalGoal.deadline_date,
        })
        .select()
        .single();

      if (createError) throw createError;

      return { newGoal, nextYear };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });

  return {
    // Queries
    goals: goalsQuery.data,
    myGoals: myGoalsQuery.data,
    isLoading: computed(
      () => goalsQuery.isLoading.value || myGoalsQuery.isLoading.value,
    ),
    error: computed(() => goalsQuery.error.value || myGoalsQuery.error.value),

    // Mutations
    createGoal: createGoalMutation.mutateAsync,
    updateGoal: updateGoalMutation.mutateAsync,
    deleteGoal: deleteGoalMutation.mutateAsync,
    toggleComplete: toggleCompleteMutation.mutateAsync,
    copyToNextYear: copyToNextYearMutation.mutateAsync,

    // Mutation states
    isCreating: createGoalMutation.isPending,
    isUpdating: updateGoalMutation.isPending,
    isDeleting: deleteGoalMutation.isPending,
    isCopying: copyToNextYearMutation.isPending,

    // Refetch
    refetch: () => {
      goalsQuery.refetch();
      myGoalsQuery.refetch();
    },
  };
}

// Single goal query
export function useGoal(goalId: string) {
  const goalQuery = useQuery({
    queryKey: ["goal", goalId],
    queryFn: async (): Promise<GoalWithRelations | null> => {
      const { data, error } = await supabase
        .from("goals")
        .select(
          `
          *,
          category:categories(*),
          profile:profiles!goals_user_id_fkey(*),
          progress_entries(*),
          attachments(*)
        `,
        )
        .eq("id", goalId)
        .single();

      if (error) throw error;
      return data as GoalWithRelations;
    },
    enabled: !!goalId,
  });

  return {
    goal: goalQuery.data,
    isLoading: goalQuery.isLoading,
    error: goalQuery.error,
    refetch: goalQuery.refetch,
  };
}
