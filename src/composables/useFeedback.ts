import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useQuery, useMutation, useQueryClient } from "@tanstack/vue-query";
import { supabase } from "@/plugins/supabase";
import type {
  FeedbackReportWithRelations,
  FeedbackFormData,
} from "@/types/database";
import { useAuth } from "./useAuth";

export function useFeedback() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { t } = useI18n();

  // Query key
  const feedbackKey = computed(() => ["feedback", user.value?.id]);

  // Fetch user's feedback reports
  const feedbackListQuery = useQuery({
    queryKey: feedbackKey,
    queryFn: async (): Promise<FeedbackReportWithRelations[]> => {
      if (!user.value) return [];

      const { data, error } = await supabase
        .from("feedback_reports")
        .select(
          `
          *,
          profile:profiles!feedback_reports_user_id_fkey(*),
          comments:feedback_comments(count)
        `,
        )
        .eq("user_id", user.value.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform the count result
      return (data || []).map((report) => ({
        ...report,
        comments_count: report.comments?.[0]?.count || 0,
        comments: undefined, // Remove the count object
      })) as FeedbackReportWithRelations[];
    },
    enabled: computed(() => !!user.value),
  });

  // Create feedback mutation
  const createFeedbackMutation = useMutation({
    mutationFn: async (formData: FeedbackFormData) => {
      if (!user.value) throw new Error(t("auth.errors.notAuthenticated"));

      // Get browser info
      const browserInfo = JSON.stringify({
        userAgent: navigator.userAgent,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
      });

      // Get current URL/route
      const currentUrl = window.location.href;

      // Extract screenshot from formData (will be used in Phase 2)
      const { screenshot, use_case, ...reportData } = formData;

      // For Phase 1: No screenshot upload yet
      // TODO Phase 2: Add screenshot upload logic here

      // Insert feedback report
      const { data: report, error } = await supabase
        .from("feedback_reports")
        .insert({
          ...reportData,
          user_id: user.value.id,
          current_url: currentUrl,
          browser_info: browserInfo,
          screenshot_url: null, // Phase 1: No screenshots yet
          status: "open",
        })
        .select()
        .single();

      if (error) throw error;
      return report;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback"] });
    },
  });

  return {
    feedbackList: feedbackListQuery.data,
    isLoading: feedbackListQuery.isLoading,
    isError: feedbackListQuery.isError,
    error: feedbackListQuery.error,
    createFeedback: createFeedbackMutation.mutateAsync,
    isCreating: createFeedbackMutation.isPending,
  };
}

// Composable for fetching a single feedback report with comments
export function useFeedbackDetail(feedbackId: string) {
  const { user } = useAuth();

  const feedbackDetailQuery = useQuery({
    queryKey: ["feedback", feedbackId],
    queryFn: async (): Promise<FeedbackReportWithRelations | null> => {
      const { data, error } = await supabase
        .from("feedback_reports")
        .select(
          `
          *,
          profile:profiles!feedback_reports_user_id_fkey(*),
          comments:feedback_comments(
            *,
            profile:profiles!feedback_comments_user_id_fkey(*)
          )
        `,
        )
        .eq("id", feedbackId)
        .single();

      if (error) throw error;
      return data as FeedbackReportWithRelations;
    },
    enabled: computed(() => !!user.value && !!feedbackId),
  });

  return {
    feedback: feedbackDetailQuery.data,
    isLoading: feedbackDetailQuery.isLoading,
    isError: feedbackDetailQuery.isError,
    error: feedbackDetailQuery.error,
  };
}
