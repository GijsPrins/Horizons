<template>
  <DefaultLayout>
    <v-container fluid class="pa-4">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-h3 font-weight-bold mb-2">
          {{ $t("celebration.title", { year: currentYear }) }}
        </h1>
        <p class="text-body-1 text-medium-emphasis">
          {{ $t("celebration.description") }}
        </p>
      </div>

      <!-- Team selector -->
      <div class="d-flex justify-center mb-6">
        <v-select
          v-if="teams && teams.length > 0"
          v-model="selectedTeamId"
          :items="teams"
          item-title="name"
          item-value="id"
          label="$t('celebration.team')"
          density="compact"
          hide-details
          variant="outlined"
          style="max-width: 250px"
        />
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="text-center py-12">
        <v-progress-circular indeterminate color="primary" size="48" />
      </div>

      <!-- Stats cards -->
      <v-row v-else-if="goals && goals.length > 0" class="mb-8">
        <v-col cols="6" md="3">
          <v-card class="text-center pa-4" elevation="0" border>
            <div class="text-h3 font-weight-bold text-primary">
              {{ goals.length }}
            </div>
            <div class="text-body-2 text-medium-emphasis">
              {{ $t("celebration.stats.goals") }}
            </div>
          </v-card>
        </v-col>
        <v-col cols="6" md="3">
          <v-card class="text-center pa-4" elevation="0" border>
            <div class="text-h3 font-weight-bold text-success">
              {{ completedGoals.length }}
            </div>
            <div class="text-body-2 text-medium-emphasis">
              {{ $t("celebration.stats.completed") }}
            </div>
          </v-card>
        </v-col>
        <v-col cols="6" md="3">
          <v-card class="text-center pa-4" elevation="0" border>
            <div class="text-h3 font-weight-bold text-warning">
              {{ inProgressGoals.length }}
            </div>
            <div class="text-body-2 text-medium-emphasis">
              {{ $t("celebration.stats.inProgress") }}
            </div>
          </v-card>
        </v-col>
        <v-col cols="6" md="3">
          <v-card class="text-center pa-4" elevation="0" border>
            <div class="text-h3 font-weight-bold text-info">
              {{
                $t("celebration.stats.completionPercentage", { completionRate })
              }}
            </div>
            <div class="text-body-2 text-medium-emphasis">
              {{ $t("celebration.stats.completionRate") }}
            </div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Journey Timeline -->
      <v-card
        v-if="goals && goals.length > 0"
        elevation="0"
        border
        class="mb-8"
      >
        <v-card-title class="text-center">
          <v-icon start>mdi-timeline</v-icon>
          {{ $t("celebration.title", { year: currentYear }) }}
        </v-card-title>
        <v-card-text>
          <div class="journey-timeline">
            <div
              v-for="month in months"
              :key="month.number"
              class="journey-month"
            >
              <div class="journey-month__label">{{ month.name }}</div>
              <div class="journey-month__goals">
                <v-tooltip
                  v-for="goal in month.goals"
                  :key="goal.id"
                  :text="goal.title"
                  location="top"
                >
                  <template #activator="{ props }">
                    <div
                      v-bind="props"
                      class="journey-goal"
                      :class="{
                        'journey-goal--completed': goal.is_completed,
                        'journey-goal--not-completed': goal.is_not_completed,
                        'journey-goal--in-progress':
                          !goal.is_completed && !goal.is_not_completed,
                      }"
                      :style="{
                        backgroundColor: goal.is_not_completed
                          ? '#757575'
                          : goal.category?.color || '#607D8B',
                      }"
                    >
                      <v-icon size="16" color="white">
                        {{
                          goal.is_completed
                            ? "mdi-check"
                            : goal.is_not_completed
                              ? "mdi-cancel"
                              : "mdi-clock"
                        }}
                      </v-icon>
                    </div>
                  </template>
                </v-tooltip>
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>

      <!-- Completed achievements -->
      <div v-if="completedGoals.length > 0" class="mb-8">
        <h2 class="text-h5 font-weight-bold mb-4 text-center">
          {{ $t("celebration.completedAchievements") }}
        </h2>
        <v-row>
          <v-col
            v-for="goal in completedGoals"
            :key="goal.id"
            cols="12"
            sm="6"
            md="4"
          >
            <v-card
              class="achievement-card"
              :style="{ '--category-color': goal.category?.color || '#607D8B' }"
              elevation="0"
              border
            >
              <div class="achievement-card__shimmer" />
              <v-card-text class="text-center">
                <v-icon size="48" color="success" class="mb-2">
                  mdi-trophy
                </v-icon>
                <h3 class="text-h6 font-weight-bold mb-1">{{ goal.title }}</h3>
                <v-chip
                  size="small"
                  :color="goal.category?.color"
                  variant="tonal"
                >
                  <v-icon start size="14">{{ goal.category?.icon }}</v-icon>
                  {{ goal.category?.name || $t("celebration.noCategory") }}
                </v-chip>
                <div class="text-caption text-medium-emphasis mt-2">
                  {{
                    $t("celebration.completedOn", {
                      date: formatDate(goal.completed_at),
                    })
                  }}
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </div>

      <!-- Empty state -->
      <v-card
        v-if="!goals || goals.length === 0"
        class="pa-8 text-center"
        elevation="0"
        border
      >
        <v-icon size="64" color="primary" class="mb-4">mdi-party-popper</v-icon>
        <h2 class="text-h6 mb-2">{{ $t("celebration.noGoals") }}</h2>
      </v-card>
    </v-container>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import { useTeams } from "@/composables/useTeams";
import { useGoals } from "@/composables/useGoals";
import { formatDate } from "@/utils/format";

const { t } = useI18n();

// Set current year
const currentYear = ref(new Date().getFullYear());

const { teams } = useTeams();
const selectedTeamId = ref<string | undefined>(undefined);

// Auto-select first team
watch(
  teams,
  (newTeams) => {
    if (newTeams && newTeams.length > 0 && !selectedTeamId.value) {
      selectedTeamId.value = newTeams[0]?.id;
    }
  },
  { immediate: true },
);

const { goals, isLoading } = useGoals(selectedTeamId, currentYear);

const completedGoals = computed(
  () => goals.value?.filter((g) => g.is_completed) || [],
);

const inProgressGoals = computed(
  () =>
    goals.value?.filter((g) => !g.is_completed && !g.is_not_completed) || [],
);

const notCompletedGoals = computed(
  () => goals.value?.filter((g) => g.is_not_completed) || [],
);

const completionRate = computed(() => {
  if (!goals.value || goals.value.length === 0) return 0;
  return Math.round((completedGoals.value.length / goals.value.length) * 100);
});

// Group goals by month for timeline
const months = computed(() => {
  const monthNames = [
    t("date.jan"),
    t("date.feb"),
    t("date.mar"),
    t("date.apr"),
    t("date.may"),
    t("date.jun"),
    t("date.jul"),
    t("date.aug"),
    t("date.sep"),
    t("date.oct"),
    t("date.nov"),
    t("date.dec"),
  ];

  return monthNames.map((name, index) => {
    const monthGoals =
      goals.value?.filter((g) => {
        const date = g.completed_at
          ? new Date(g.completed_at)
          : new Date(g.created_at);
        return date.getMonth() === index;
      }) || [];

    return {
      name,
      number: index + 1,
      goals: monthGoals,
    };
  });
});
</script>

<style scoped>
.journey-timeline {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 16px 0;
}

.journey-month {
  flex: 1;
  min-width: 60px;
  text-align: center;
}

.journey-month__label {
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.6);
  margin-bottom: 8px;
}

.journey-month__goals {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
}

.journey-goal {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;
  cursor: pointer;
}

.journey-goal:hover {
  transform: scale(1.2);
}

.journey-goal--completed {
  box-shadow: 0 0 12px rgba(16, 185, 129, 0.5);
}

.achievement-card {
  position: relative;
  overflow: hidden;
}

.achievement-card__shimmer {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.1),
    transparent
  );
  animation: shimmer 3s infinite;
}

@keyframes shimmer {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}
</style>
