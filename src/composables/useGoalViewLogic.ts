import { ref } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useGoals } from "@/composables/useGoals";
import { useProgress } from "@/composables/useProgress";
import { useAttachments } from "@/composables/useAttachments";
import type { Goal, AttachmentType } from "@/types/database";

export function useGoalViewLogic(
  showSnackbar?: (msg: string, color?: string) => void,
) {
  const router = useRouter();
  const { t } = useI18n();
  const { toggleWeek, addProgress, updateProgress, deleteProgress } =
    useProgress();
  const {
    addAttachment,
    uploadFile,
    deleteAttachment: removeAttachment,
  } = useAttachments();

  const {
    toggleComplete: toggleMutation,
    deleteGoal: deleteMutation,
    updateGoal: updateMutation,
    copyToNextYear: copyMutation,
  } = useGoals();

  // UI State
  const confirmDelete = ref(false);
  const attachmentDialogOpen = ref(false);
  const goalDialogOpen = ref(false);
  const completionDialogOpen = ref(false);
  const completionDate = ref<Date>(new Date());
  const notCompletedDialogOpen = ref(false);
  const notCompletedReason = ref<string>("");

  // Actions
  async function toggleComplete(goal: Goal) {
    if (!goal.is_completed) {
      completionDate.value = new Date();
      completionDialogOpen.value = true;
    } else {
      try {
        await toggleMutation({ id: goal.id, is_completed: false });
        showSnackbar?.(t("goals.reopened"), "success");
      } catch (error: any) {
        showSnackbar?.(error.message || t("common.error"), "error");
      }
    }
  }

  async function confirmToggleComplete(goal: Goal) {
    try {
      await toggleMutation({
        id: goal.id,
        is_completed: true,
        date: completionDate.value.toISOString(),
      });
      completionDialogOpen.value = false;
      showSnackbar?.(t("goals.completed"), "success");
    } catch (error: any) {
      showSnackbar?.(error.message || t("common.error"), "error");
    }
  }

  async function markNotCompleted() {
    notCompletedReason.value = "";
    notCompletedDialogOpen.value = true;
  }

  async function confirmMarkNotCompleted(goal: Goal) {
    try {
      await updateMutation({
        id: goal.id,
        is_not_completed: true,
        not_completed_reason: notCompletedReason.value || null,
        not_completed_at: new Date().toISOString(),
        is_completed: false,
        completed_at: null,
      });
      notCompletedDialogOpen.value = false;
      showSnackbar?.(t("goals.markedNotCompleted"), "info");
    } catch (error: any) {
      showSnackbar?.(error.message || t("common.error"), "error");
    }
  }

  async function unmarkNotCompleted(goal: Goal) {
    try {
      await updateMutation({
        id: goal.id,
        is_not_completed: false,
        not_completed_reason: null,
        not_completed_at: null,
      });
      showSnackbar?.(t("goals.reopened"), "success");
    } catch (error: any) {
      showSnackbar?.(error.message || t("common.error"), "error");
    }
  }

  async function handleWeekToggle(
    goal: Goal,
    weekNumber: number,
    achieved: boolean,
    refetch: () => void,
  ) {
    await toggleWeek({ goalId: goal.id, weekNumber, achieved });
    refetch();
  }

  async function addMilestone(
    goal: Goal,
    note: string,
    achieved: boolean,
    refetch: () => void,
  ) {
    await addProgress({
      goal_id: goal.id,
      entry_date: new Date().toISOString().slice(0, 10),
      week_number: null,
      note,
      achieved,
    });
    refetch();
  }

  async function toggleMilestone(
    entryId: string,
    achieved: boolean,
    refetch: () => void,
  ) {
    await updateProgress({ id: entryId, achieved });
    refetch();
  }

  async function updateMilestone(
    entryId: string,
    note: string,
    refetch: () => void,
  ) {
    await updateProgress({ id: entryId, note });
    refetch();
  }

  async function deleteMilestone(entryId: string, refetch: () => void) {
    await deleteProgress(entryId);
    refetch();
  }

  async function handleDelete(goal: Goal) {
    try {
      await deleteMutation(goal.id);
      confirmDelete.value = false;
      showSnackbar?.(t("goals.deleted"), "success");
      router.push({ name: "dashboard" });
    } catch (error: any) {
      showSnackbar?.(error.message || t("common.error"), "error");
    }
  }

  async function handleGoalSubmit(goal: Goal, formData: Partial<Goal>) {
    try {
      await updateMutation({ id: goal.id, ...formData });
      goalDialogOpen.value = false;
      showSnackbar?.(t("goals.updated"), "success");
    } catch (error: any) {
      showSnackbar?.(error.message || t("common.error"), "error");
    }
  }

  async function handleAddAttachment(
    goal: Goal,
    data: {
      type: AttachmentType;
      title: string;
      url?: string;
      content?: string;
      file?: File;
    },
  ) {
    try {
      if (data.file) {
        await uploadFile({
          goal_id: goal.id,
          file: data.file,
          title: data.title || data.file.name,
        });
      } else {
        await addAttachment({
          goal_id: goal.id,
          type: data.type,
          title: data.title,
          url: data.url,
          content: data.content,
          milestone_date: null,
        });
      }
      attachmentDialogOpen.value = false;
      showSnackbar?.(t("attachments.added"), "success");
    } catch (error: any) {
      showSnackbar?.(error.message || t("common.error"), "error");
    }
  }

  async function deleteAttachment(attachmentId: string) {
    try {
      await removeAttachment(attachmentId);
      showSnackbar?.(t("attachments.deleted"), "success");
    } catch (error: any) {
      showSnackbar?.(error.message || t("common.error"), "error");
    }
  }

  async function handleCopyToNextYear(goal: Goal) {
    try {
      const result = await copyMutation(goal.id);
      showSnackbar?.(
        t("goals.copiedToNextYear", { year: result.nextYear }),
        "success",
      );
      // Optionally navigate to the new goal or stay on current page
      // router.push({ name: 'goal', params: { id: result.newGoal.id } })
    } catch (error: any) {
      showSnackbar?.(error.message || t("common.error"), "error");
    }
  }

  return {
    confirmDelete,
    attachmentDialogOpen,
    goalDialogOpen,
    completionDialogOpen,
    completionDate,
    notCompletedDialogOpen,
    notCompletedReason,
    toggleComplete,
    confirmToggleComplete,
    markNotCompleted,
    confirmMarkNotCompleted,
    unmarkNotCompleted,
    handleWeekToggle,
    addMilestone,
    toggleMilestone,
    updateMilestone,
    deleteMilestone,
    handleDelete,
    handleGoalSubmit,
    handleAddAttachment,
    deleteAttachment,
    handleCopyToNextYear,
  };
}
