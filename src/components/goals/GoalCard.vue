<template>
  <v-card
    class="goal-card"
    :style="{
      '--category-color': categoryColor,
      '--category-bg': categoryBackground,
    }"
    elevation="0"
    border
    hover
    @click="$emit('click', goal)"
  >
    <v-card-text class="pa-5">
      <!-- Header: Progress Circle + Status Badges + Title -->
      <div class="d-flex align-start mb-3 goal-card__header">
        <!-- Large progress circle with category color -->
        <div class="flex-shrink-0 mr-4 goal-card__progress-wrapper">
          <v-progress-circular
            :model-value="progress"
            :size="88"
            :width="6"
            :color="categoryColor"
            class="goal-card__progress"
          >
            <div class="d-flex flex-column align-center">
              <i18n-t
                keypath="goals.progressPercentage"
                tag="div"
                class="d-flex flex-column align-center"
              >
                <template #progress>
                  <span class="text-h6 font-weight-bold">{{ progress }}</span>
                </template>
              </i18n-t>
            </div>
          </v-progress-circular>
        </div>

        <!-- Title and info (desktop right side, mobile below progress) -->
        <div class="flex-grow-1 min-width-0 goal-card__main-content">
          <!-- Status indicators (desktop only) -->
          <div
            class="d-flex align-center justify-end mb-2 goal-card__status-desktop"
            style="gap: 6px"
          >
            <v-chip
              v-if="goal.is_completed"
              size="small"
              color="success"
              variant="flat"
              :title="$t('goals.isCompleted')"
            >
              <v-icon size="16">mdi-check-circle</v-icon>
            </v-chip>
            <v-chip
              v-if="goal.is_shared"
              size="small"
              color="primary"
              variant="tonal"
              :title="$t('goals.shared')"
            >
              <v-icon size="16">mdi-account-multiple</v-icon>
            </v-chip>
          </div>

          <!-- Title -->
          <h3
            class="goal-card__title text-h6 font-weight-medium"
            :title="goal.title"
          >
            {{ goal.title }}
          </h3>
        </div>
      </div>

      <!-- Type & Category Badges -->
      <div class="d-flex flex-wrap gap-2 mb-3 goal-card__badges">
        <v-chip
          v-if="goal.category"
          size="small"
          :color="goal.category.color"
          variant="flat"
          class="font-weight-medium"
        >
          <v-icon start size="16">{{ goal.category.icon }}</v-icon>
          <span class="goal-card__badge-text">{{ goal.category.name }}</span>
        </v-chip>

        <v-chip
          size="small"
          :color="typeColor"
          variant="tonal"
          class="font-weight-medium goal-card__type-badge"
        >
          <v-icon start size="16">{{ typeIcon }}</v-icon>
          <span class="goal-card__badge-text">{{ typeLabel }}</span>
        </v-chip>

        <!-- Status indicators (mobile only) -->
        <v-chip
          v-if="goal.is_completed"
          size="small"
          color="success"
          variant="flat"
          class="goal-card__status-mobile"
        >
          <v-icon size="16">mdi-check-circle</v-icon>
        </v-chip>
        <v-chip
          v-if="goal.is_shared"
          size="small"
          color="primary"
          variant="tonal"
          class="goal-card__status-mobile"
        >
          <v-icon size="16">mdi-account-multiple</v-icon>
        </v-chip>
      </div>

      <!-- Goal-specific metadata -->
      <div class="goal-card__metadata text-body-2 text-medium-emphasis">
        <!-- Weekly goals: show streak -->
        <div
          v-if="goal.goal_type === 'weekly'"
          class="d-flex align-center"
          style="gap: 6px"
        >
          <v-icon size="16" color="orange">mdi-fire</v-icon>
          <span>
            {{
              $t("progress.weeklyCount", {
                achieved: weeklyAchieved,
                total: 52,
                week: $t("progress.weeks", 52),
              })
            }}
          </span>
        </div>

        <!-- Milestone goals: show completion ratio -->
        <div
          v-else-if="goal.goal_type === 'milestone'"
          class="d-flex align-center"
          style="gap: 6px"
        >
          <v-icon size="16" :color="categoryColor">mdi-flag-checkered</v-icon>
          <span>
            {{
              $t("progress.milestoneCount", {
                completed: milestonesCompleted,
                total: goal.target_count || 0,
                milestone: $t("attachments.milestones", goal.target_count || 0),
              })
            }}
          </span>
        </div>

        <!-- Single goal: just show year -->
        <div v-else class="d-flex align-center" style="gap: 6px">
          <v-icon size="16" :color="categoryColor">mdi-calendar</v-icon>
          <span>{{ goal.year }}</span>
        </div>
      </div>
    </v-card-text>

    <!-- Footer -->
    <v-card-actions class="pt-0 px-5 pb-4">
      <v-avatar size="28" :color="categoryColor" class="elevation-1">
        <v-img v-if="goal.profile?.avatar_url" :src="goal.profile.avatar_url" />
        <span v-else class="text-body-2 text-white font-weight-medium">
          {{ goal.profile?.display_name?.charAt(0)?.toUpperCase() || "?" }}
        </span>
      </v-avatar>

      <span class="text-body-2 text-medium-emphasis ml-2">
        {{ goal.profile?.display_name }}
      </span>

      <v-spacer />
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import type { GoalWithRelations } from "@/types/database";
import { calculateProgress } from "@/composables/useProgress";

const props = defineProps<{
  goal: GoalWithRelations;
}>();

defineEmits<{
  click: [goal: GoalWithRelations];
}>();

const { t } = useI18n();

const progress = computed(() => calculateProgress(props.goal));

const categoryColor = computed(() => props.goal.category?.color || "#607D8B");

const categoryBackground = computed(() => {
  const color = props.goal.category?.color || "#607D8B";
  // Convert hex to RGB and add 5% opacity
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, 0.05)`;
});

const typeConfig = computed(() => ({
  single: {
    label: t("goals.types.single"),
    icon: "mdi-flag-checkered",
    color: "info",
  },
  weekly: {
    label: t("goals.types.weekly"),
    icon: "mdi-calendar-week",
    color: "warning",
  },
  milestone: {
    label: t("goals.types.milestone"),
    icon: "mdi-stairs",
    color: "secondary",
  },
}));

const typeLabel = computed(
  () =>
    typeConfig.value[props.goal.goal_type as keyof typeof typeConfig.value]
      ?.label || t("goals.goalType"),
);
const typeIcon = computed(
  () =>
    typeConfig.value[props.goal.goal_type as keyof typeof typeConfig.value]
      ?.icon || "mdi-target",
);
const typeColor = computed(
  () =>
    typeConfig.value[props.goal.goal_type as keyof typeof typeConfig.value]
      ?.color || "primary",
);

// Weekly goals: count achieved weeks
const weeklyAchieved = computed(() => {
  if (props.goal.goal_type !== "weekly" || !props.goal.progress_entries) {
    return 0;
  }
  return props.goal.progress_entries.filter((entry) => entry.achieved).length;
});

// Milestone goals: count completed milestones
const milestonesCompleted = computed(() => {
  if (props.goal.goal_type !== "milestone" || !props.goal.progress_entries) {
    return 0;
  }
  return props.goal.progress_entries.filter((entry) => entry.achieved).length;
});
</script>

<style scoped>
.goal-card {
  position: relative;
  background: var(--category-bg);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
  cursor: pointer;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.goal-card:hover {
  transform: scale(1.02);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
}

.goal-card__progress {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.goal-card__title {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
  min-height: 2.8em;
  word-break: break-word;
  color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity));
}

.goal-card__metadata {
  min-height: 24px;
  display: flex;
  align-items: center;
}

.gap-1 {
  gap: 6px;
}

.gap-2 {
  gap: 8px;
}

/* Hide mobile-only elements on desktop */
.goal-card__status-mobile {
  display: none;
}

/* Mobile optimizations */
@media (max-width: 960px) {
  .goal-card {
    height: auto;
  }

  .goal-card :deep(.v-card-text) {
    padding: 16px !important;
  }

  .goal-card :deep(.v-card-actions) {
    padding-left: 16px !important;
    padding-right: 16px !important;
    padding-bottom: 12px !important;
  }

  .goal-card__title {
    font-size: 1.125rem !important;
    min-height: auto;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    margin-bottom: 0 !important;
  }

  .goal-card__metadata {
    font-size: 0.813rem !important;
  }
}

/* Compact mobile view */
@media (max-width: 600px) {
  .goal-card :deep(.v-card-text) {
    padding: 12px !important;
  }

  .goal-card :deep(.v-card-actions) {
    padding: 0 12px 10px !important;
  }

  /* Horizontal layout on mobile */
  .goal-card__header {
    margin-bottom: 10px !important;
  }

  .goal-card__progress-wrapper {
    margin-right: 12px !important;
  }

  .goal-card__progress-wrapper :deep(.v-progress-circular) {
    width: 64px !important;
    height: 64px !important;
  }

  .goal-card__main-content {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  /* Hide desktop status badges on mobile */
  .goal-card__status-desktop {
    display: none !important;
  }

  /* Show mobile status badges */
  .goal-card__status-mobile {
    display: inline-flex;
  }

  .goal-card__title {
    font-size: 1rem !important;
    line-height: 1.3 !important;
    -webkit-line-clamp: 2;
    line-clamp: 2;
  }

  /* Reduce badge margin */
  .goal-card__badges {
    margin-bottom: 8px !important;
  }

  /* Hide type badge text on very small screens, keep icon */
  .goal-card__type-badge .goal-card__badge-text {
    display: none;
  }

  /* Hide metadata on mobile to save space */
  .goal-card__metadata {
    display: none !important;
  }

  /* Hide footer on mobile */
  .goal-card :deep(.v-card-actions) {
    display: none !important;
  }
}
</style>
