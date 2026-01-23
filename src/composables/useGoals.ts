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
      if (!user.value) {
        throw new Error(t("auth.errors.notAuthenticated"));
      }

      const { file, ...goalData } = formData;

      // 1. Create the goal
      const insertData = {
        ...goalData,
        user_id: user.value.id,
        is_completed: false,
        completed_at: null,
      };
      
      // Don't use .single() - it causes PGRST116 errors if RLS prevents the SELECT
      const response = await supabase
        .from("goals")
        .insert(insertData)
        .select();

      if (response.error) throw response.error;
      
      const goal = response.data?.[0];
      if (!goal) {
        throw new Error('Goal creation failed - please try again');
      }

      // 2. If there's a file, upload it using the shared logic
      // Handle Vuetify's v-file-input which returns an array
      const actualFile = Array.isArray(file) ? file[0] : file;
      if (actualFile && goal) {
        try {
          await uploadFile({
            goal_id: goal.id,
            file: actualFile,
            title: actualFile.name,
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

      const response = await supabase
        .from("goals")
        .update(validUpdates)
        .eq("id", id)
        .select();

      if (response.error) throw response.error;
      
      const goal = response.data?.[0];
      if (!goal) {
        throw new Error('Goal update failed - goal not found');
      }

      // If there's a file, upload it using the shared logic
      // Handle Vuetify's v-file-input which returns an array
      const actualFile = Array.isArray(file) ? file[0] : file;
      if (actualFile && goal) {
        try {
          await uploadFile({
            goal_id: goal.id,
            file: actualFile,
            title: actualFile.name,
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
      const response = await supabase
        .from("goals")
        .update({
          is_completed,
          completed_at: is_completed ? date || new Date().toISOString() : null,
        })
        .eq("id", id)
        .select();

      if (response.error) throw response.error;
      
      const data = response.data?.[0];
      if (!data) {
        throw new Error('Goal toggle failed - goal not found');
      }
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
      const fetchResponse = await supabase
        .from("goals")
        .select("*")
        .eq("id", goalId);

      if (fetchResponse.error) throw fetchResponse.error;
      
      const originalGoal = fetchResponse.data?.[0];
      if (!originalGoal) {
        throw new Error('Original goal not found');
      }

      const nextYear = originalGoal.year + 1;

      // Create a new goal with the same properties but for the next year
      const createResponse = await supabase
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
        .select();

      if (createResponse.error) throw createResponse.error;
      
      const newGoal = createResponse.data?.[0];
      if (!newGoal) {
        throw new Error('Goal copy failed');
      }

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
      const response = await supabase
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
        .eq("id", goalId);

      if (response.error) throw response.error;
      
      const data = response.data?.[0];
      if (!data) {
        throw new Error('Goal not found');
      }
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
