// Progress tracking composable with VueQuery
import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { supabase } from "@/plugins/supabase";
import type { ProgressEntry, GoalWithRelations } from "@/types/database";

export function useProgress() {
  const queryClient = useQueryClient();

  // Add progress entry mutation
  const addProgressMutation = useMutation({
    mutationFn: async (entry: Omit<ProgressEntry, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("progress_entries")
        .insert(entry)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["goal", data.goal_id] });
    },
  });

  // Update progress entry mutation
  const updateProgressMutation = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<ProgressEntry> & { id: string }) => {
      const { data, error } = await supabase
        .from("progress_entries")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["goal", data.goal_id] });
    },
  });

  // Delete progress entry mutation
  const deleteProgressMutation = useMutation({
    mutationFn: async (entryId: string) => {
      // Get the entry first to know the goal_id
      const { data: entry } = await supabase
        .from("progress_entries")
        .select("goal_id")
        .eq("id", entryId)
        .single();

      if (!entry) return null;

      const { error } = await supabase
        .from("progress_entries")
        .delete()
        .eq("id", entryId);

      if (error) throw error;
      return (entry as ProgressEntry).goal_id;
    },
    onSuccess: (goalId) => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      if (goalId) {
        queryClient.invalidateQueries({ queryKey: ["goal", goalId] });
      }
    },
  });

  // Toggle weekly progress
  const toggleWeekMutation = useMutation({
    mutationFn: async ({
      goalId,
      weekNumber,
      achieved,
    }: {
      goalId: string;
      weekNumber: number;
      achieved: boolean;
    }) => {
      // Check if entry exists for this week
      const { data: existing } = await supabase
        .from("progress_entries")
        .select("id")
        .eq("goal_id", goalId)
        .eq("week_number", weekNumber)
        .single();

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from("progress_entries")
          .update({ achieved })
          .eq("id", existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new
        const { data, error } = await supabase
          .from("progress_entries")
          .insert({
            goal_id: goalId,
            week_number: weekNumber,
            entry_date: new Date().toISOString().split("T")[0],
            achieved,
            note: null,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["goal", data.goal_id] });
    },
  });

  return {
    addProgress: addProgressMutation.mutateAsync,
    updateProgress: updateProgressMutation.mutateAsync,
    deleteProgress: deleteProgressMutation.mutateAsync,
    toggleWeek: toggleWeekMutation.mutateAsync,

    isAdding: addProgressMutation.isPending,
    isUpdating: updateProgressMutation.isPending,
    isToggling: toggleWeekMutation.isPending,
  };
}

// Helper function to calculate goal progress percentage
export function calculateProgress(goal: GoalWithRelations): number {
  if (!goal) return 0;

  // If goal is marked as not completed, return -1 to indicate special status
  if (goal.is_not_completed) return -1;

  switch (goal.goal_type) {
    case "single":
      return goal.is_completed ? 100 : 0;

    case "weekly": {
      const achieved =
        goal.progress_entries?.filter((e) => e.achieved).length ?? 0;
      return Math.round((achieved / 52) * 100);
    }

    case "milestone": {
      const completed =
        goal.progress_entries?.filter((e) => e.achieved).length ?? 0;
      const target = goal.target_count ?? 1;
      return Math.round((completed / target) * 100);
    }

    default:
      return 0;
  }
}

// Get current week number
export function getCurrentWeekNumber(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  return Math.ceil(diff / oneWeek);
}
