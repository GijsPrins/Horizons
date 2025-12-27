<template>
  <DefaultLayout>
    <v-container fluid class="pa-4">
      <!-- Header -->
      <div class="d-flex align-center mb-4">
        <v-btn icon variant="text" @click="$router.back()">
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>
        <div class="ml-2">
          <h1 class="text-h4 font-weight-bold">
            {{ goal?.title || $t("common.loading") }}
          </h1>
          <p class="text-body-2 text-medium-emphasis">
            {{ goal?.category?.name || $t("categories.noCategory") }}
          </p>
        </div>
        <v-spacer />

        <!-- Actions menu -->
        <v-menu v-if="isOwner">
          <template #activator="{ props }">
            <v-btn v-bind="props" icon variant="text">
              <v-icon>mdi-dots-vertical</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item @click="openEditDialog">
              <template #prepend>
                <v-icon>mdi-pencil</v-icon>
              </template>
              <v-list-item-title>{{ $t("common.edit") }}</v-list-item-title>
            </v-list-item>
            <v-list-item @click="onCopyToNextYear">
              <template #prepend>
                <v-icon>mdi-content-copy</v-icon>
              </template>
              <v-list-item-title>{{
                $t("goals.copyToNextYear")
              }}</v-list-item-title>
            </v-list-item>
            <v-list-item @click="confirmDelete = true">
              <template #prepend>
                <v-icon color="error">mdi-delete</v-icon>
              </template>
              <v-list-item-title class="text-error">{{
                $t("common.delete")
              }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="text-center py-12">
        <v-progress-circular indeterminate color="primary" size="48" />
      </div>

      <v-row v-else-if="goal">
        <!-- Left column: Details -->
        <v-col cols="12" md="8">
          <!-- Main card -->
          <v-card elevation="0" border class="mb-4">
            <v-card-text>
              <!-- Progress -->
              <div class="d-flex align-center mb-4">
                <v-progress-circular
                  :model-value="progress"
                  :size="100"
                  :width="8"
                  :color="progress === 100 ? 'success' : 'primary'"
                >
                  <span class="text-h5 font-weight-bold">{{
                    $t("goals.progressPercentage", { progress })
                  }}</span>
                </v-progress-circular>

                <div class="ml-6">
                  <v-chip
                    :color="goal.is_completed ? 'success' : 'primary'"
                    variant="flat"
                    class="mb-2"
                  >
                    <v-icon start>{{
                      goal.is_completed
                        ? "mdi-check-circle"
                        : "mdi-progress-clock"
                    }}</v-icon>
                    {{
                      goal.is_completed
                        ? $t("goals.isCompleted")
                        : $t("celebration.inProgress")
                    }}
                  </v-chip>

                  <div class="text-body-2 text-medium-emphasis">
                    {{
                      $t("goals.typeAndYear", {
                        type: typeLabel,
                        year: goal.year,
                      })
                    }}
                  </div>

                  <div v-if="goal.is_shared" class="text-body-2 mt-1">
                    <v-icon size="16" color="primary">mdi-eye</v-icon>
                    {{ $t("goals.shared") }}
                  </div>
                </div>

                <v-spacer />

                <!-- Complete toggle for single goals -->
                <v-btn
                  v-if="goal.goal_type === 'single' && isOwner"
                  :color="goal.is_completed ? 'success' : 'primary'"
                  :variant="goal.is_completed ? 'flat' : 'outlined'"
                  @click="onToggleComplete"
                >
                  <v-icon start>{{
                    goal.is_completed ? "mdi-check" : "mdi-flag-checkered"
                  }}</v-icon>
                  {{
                    goal.is_completed
                      ? $t("goals.isCompleted") + "!"
                      : $t("goals.markComplete")
                  }}
                </v-btn>
              </div>

              <!-- Description -->
              <div v-if="goal.description" class="mb-4">
                <h3 class="text-subtitle-2 font-weight-medium mb-2">
                  {{ $t("goals.goalDescription") }}
                </h3>
                <p class="text-body-2">{{ goal.description }}</p>
              </div>
            </v-card-text>
          </v-card>

          <!-- Weekly progress -->
          <v-card
            v-if="goal.goal_type === 'weekly'"
            elevation="0"
            border
            class="mb-4"
          >
            <v-card-title>
              <v-icon start>mdi-calendar-week</v-icon>
              {{ $t("progress.weeklyProgress") }}
            </v-card-title>
            <v-card-text>
              <WeeklyGrid
                :goal="goal"
                :readonly="!isOwner"
                @toggle="onWeekToggle"
              />
            </v-card-text>
          </v-card>

          <!-- Milestone progress -->
          <v-card
            v-if="goal.goal_type === 'milestone'"
            elevation="0"
            border
            class="mb-4"
          >
            <v-card-title>
              <v-icon start>mdi-stairs</v-icon>
              {{
                $t("progress.milestonesCount", {
                  completed: completedMilestones,
                  total: goal.target_count || 0,
                })
              }}
            </v-card-title>
            <v-card-text>
              <MilestoneList
                :goal="goal"
                :readonly="!isOwner"
                @add="onAddMilestone"
                @toggle="onToggleMilestone"
                @update="onUpdateMilestone"
                @delete="onDeleteMilestone"
              />
            </v-card-text>
          </v-card>

          <!-- Attachments -->
          <v-card elevation="0" border>
            <v-card-title class="d-flex align-center">
              <v-icon start>mdi-paperclip</v-icon>
              {{ $t("attachments.title") }}
              <v-spacer />
              <v-btn
                v-if="isOwner"
                size="small"
                variant="text"
                color="primary"
                @click="attachmentDialogOpen = true"
              >
                <v-icon start>mdi-plus</v-icon>
                {{ $t("common.add") }}
              </v-btn>
            </v-card-title>
            <v-card-text>
              <AttachmentList
                :attachments="goal.attachments || []"
                :readonly="!isOwner"
                @delete="deleteAttachment"
              />
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Right column: Meta info -->
        <v-col cols="12" md="4">
          <v-card elevation="0" border>
            <v-card-title>{{ $t("common.details") }}</v-card-title>
            <v-list density="compact">
              <v-list-item>
                <template #prepend>
                  <v-avatar size="32" :color="goal.category?.color || 'grey'">
                    <v-icon size="18">{{
                      goal.category?.icon || "mdi-tag"
                    }}</v-icon>
                  </v-avatar>
                </template>
                <v-list-item-title>{{
                  goal.category?.name || $t("categories.noCategory")
                }}</v-list-item-title>
                <v-list-item-subtitle>{{
                  $t("goals.goalCategory")
                }}</v-list-item-subtitle>
              </v-list-item>

              <v-list-item>
                <template #prepend>
                  <v-avatar size="32" color="primary">
                    <v-img
                      v-if="goal.profile?.avatar_url"
                      :src="goal.profile.avatar_url"
                    />
                    <span v-else class="text-white text-caption">
                      {{ goal.profile?.display_name?.charAt(0)?.toUpperCase() }}
                    </span>
                  </v-avatar>
                </template>
                <v-list-item-title>{{
                  goal.profile?.display_name
                }}</v-list-item-title>
                <v-list-item-subtitle>{{
                  $t("common.owner")
                }}</v-list-item-subtitle>
              </v-list-item>

              <v-list-item>
                <template #prepend>
                  <v-avatar size="32" color="surface-variant">
                    <v-icon size="18">mdi-calendar</v-icon>
                  </v-avatar>
                </template>
                <v-list-item-title>{{
                  formatDate(goal.created_at)
                }}</v-list-item-title>
                <v-list-item-subtitle>{{
                  $t("common.created")
                }}</v-list-item-subtitle>
              </v-list-item>

              <v-list-item v-if="goal.completed_at">
                <template #prepend>
                  <v-avatar size="32" color="success">
                    <v-icon size="18">mdi-check</v-icon>
                  </v-avatar>
                </template>
                <v-list-item-title>{{
                  formatDate(goal.completed_at)
                }}</v-list-item-title>
                <v-list-item-subtitle>{{
                  $t("goals.isCompleted")
                }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>
      </v-row>

      <!-- Delete confirmation -->
      <v-dialog v-model="confirmDelete" max-width="400">
        <v-card>
          <v-card-title>{{ $t("goals.deleteGoal") }}</v-card-title>
          <v-card-text>
            {{ $t("goals.confirmDelete") }}
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" @click="confirmDelete = false">{{
              $t("common.cancel")
            }}</v-btn>
            <v-btn color="error" variant="flat" @click="onDelete">{{
              $t("common.delete")
            }}</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Attachment dialog -->
      <AttachmentDialog
        v-model="attachmentDialogOpen"
        :goal-id="goal?.id || ''"
        @submit="onAddAttachment"
      />

      <!-- Goal Edit dialog -->
      <GoalDialog
        v-if="goal"
        v-model="goalDialogOpen"
        :goal="goal"
        :team-id="goal.team_id || ''"
        :categories="categories || []"
        @submit="onGoalSubmit"
      />

      <!-- Completion Date Dialog -->
      <v-dialog v-model="completionDialogOpen" max-width="400">
        <v-card>
          <v-card-title>{{ $t("goals.completeGoal") }}</v-card-title>
          <v-card-text>
            <p class="mb-4">{{ $t("goals.congrats") }}</p>
            <v-date-picker
              v-model="completionDate"
              color="primary"
              hide-header
              class="mx-auto"
            />
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" @click="completionDialogOpen = false">{{
              $t("common.cancel")
            }}</v-btn>
            <v-btn color="primary" variant="flat" @click="onConfirmComplete">
              {{ $t("common.confirm") }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { computed, inject } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import WeeklyGrid from "@/components/goals/WeeklyGrid.vue";
import MilestoneList from "@/components/goals/MilestoneList.vue";
import AttachmentList from "@/components/goals/AttachmentList.vue";
import AttachmentDialog from "@/components/goals/AttachmentDialog.vue";
import GoalDialog from "@/components/goals/GoalDialog.vue";
import { useGoal } from "@/composables/useGoals";
import { calculateProgress } from "@/composables/useProgress";
import { formatDate } from "@/utils/format";
import { useAuth } from "@/composables/useAuth";
import { useCategories } from "@/composables/useCategories";
import { useGoalViewLogic } from "@/composables/useGoalViewLogic";
import type { AttachmentType, GoalFormData } from "@/types/database";

const route = useRoute();
const { t } = useI18n();
const { user } = useAuth();
const showSnackbar =
  inject<(msg: string, color?: string) => void>("showSnackbar");

const goalId = route.params.id as string;
const { goal, isLoading, refetch } = useGoal(goalId);

const { categories } = useCategories(
  computed(() => goal.value?.team_id || undefined),
);

// Extract logic
const {
  confirmDelete,
  attachmentDialogOpen,
  goalDialogOpen,
  completionDialogOpen,
  completionDate,
  toggleComplete,
  confirmToggleComplete,
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
} = useGoalViewLogic(showSnackbar);

const isOwner = computed(() => goal.value?.user_id === user.value?.id);
const progress = computed(() =>
  goal.value ? calculateProgress(goal.value) : 0,
);

const typeLabel = computed(() => {
  const type = goal.value?.goal_type || "single";
  const key = `goals.types.${type}`;
  return t(key);
});

const completedMilestones = computed(
  () => goal.value?.progress_entries?.filter((e) => e.achieved).length || 0,
);

function openEditDialog() {
  goalDialogOpen.value = true;
}

// Wrappers to deal with possible null goal
const onToggleComplete = () => goal.value && toggleComplete(goal.value);
const onConfirmComplete = () => goal.value && confirmToggleComplete(goal.value);
const onDelete = () => goal.value && handleDelete(goal.value);
const onGoalSubmit = (data: GoalFormData & { team_id: string }) =>
  goal.value && handleGoalSubmit(goal.value, data);
const onAddAttachment = (data: {
  type: AttachmentType;
  title: string;
  url?: string;
  content?: string;
  file?: File;
}) => goal.value && handleAddAttachment(goal.value, data);

const onWeekToggle = (week: number, achieved: boolean) =>
  goal.value && handleWeekToggle(goal.value, week, achieved, refetch);
const onAddMilestone = (note: string, achieved: boolean) =>
  goal.value && addMilestone(goal.value, note, achieved, refetch);
const onToggleMilestone = (id: string, achieved: boolean) =>
  toggleMilestone(id, achieved, refetch);
const onUpdateMilestone = (id: string, note: string) =>
  updateMilestone(id, note, refetch);
const onDeleteMilestone = (id: string) => deleteMilestone(id, refetch);
const onCopyToNextYear = () => goal.value && handleCopyToNextYear(goal.value);
</script>
