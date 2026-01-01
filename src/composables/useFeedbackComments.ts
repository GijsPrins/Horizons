import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useQuery, useMutation, useQueryClient } from "@tanstack/vue-query";
import { supabase } from "@/plugins/supabase";
import type { FeedbackComment } from "@/types/database";
import { useAuth } from "./useAuth";

export function useFeedbackComments(reportId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { t } = useI18n();

  // Query for fetching comments
  const commentsQuery = useQuery({
    queryKey: ["feedback-comments", reportId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feedback_comments")
        .select(
          `
          *,
          profile:profiles!feedback_comments_user_id_fkey(*)
        `,
        )
        .eq("report_id", reportId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as (FeedbackComment & { profile?: any })[];
    },
    enabled: computed(() => !!reportId && !!user.value),
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (comment: string) => {
      if (!user.value) throw new Error(t("auth.errors.notAuthenticated"));

      const { data, error } = await supabase
        .from("feedback_comments")
        .insert({
          report_id: reportId,
          user_id: user.value.id,
          comment: comment,
          is_admin_comment: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate both the comments list and the feedback detail
      queryClient.invalidateQueries({ queryKey: ["feedback-comments", reportId] });
      queryClient.invalidateQueries({ queryKey: ["feedback", reportId] });
      queryClient.invalidateQueries({ queryKey: ["feedback"] }); // Update counts in list
    },
  });

  return {
    comments: commentsQuery.data,
    isLoading: commentsQuery.isLoading,
    isError: commentsQuery.isError,
    error: commentsQuery.error,
    addComment: addCommentMutation.mutateAsync,
    isAdding: addCommentMutation.isPending,
  };
}
