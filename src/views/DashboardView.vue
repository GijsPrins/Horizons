<template>
  <DefaultLayout>
    <v-container fluid class="pa-4">
      <!-- Header -->
      <div class="dashboard-header mb-6">
        <div class="d-flex align-center justify-space-between flex-wrap gap-4">
          <div>
            <h1 class="text-h4 font-weight-bold">{{ $t("goals.title") }}</h1>
            <p class="text-body-2 text-medium-emphasis">
              {{
                currentTeam?.name
                  ? $t("dashboard.subtitle", {
                      team: currentTeam.name,
                      year: currentYear,
                    })
                  : $t("dashboard.selectTeamSubtitle", { year: currentYear })
              }}
            </p>
          </div>

          <div
            class="d-flex align-center flex-grow-1 flex-sm-grow-0 justify-end gap-2"
          >
            <!-- Search -->
            <v-text-field
              v-model="searchQuery"
              :label="$t('common.search')"
              prepend-inner-icon="mdi-magnify"
              density="compact"
              hide-details
              variant="outlined"
              style="min-width: 150px; max-width: 250px"
              class="flex-grow-1"
              clearable
            />

            <!-- Team selector -->
            <v-select
              v-if="teams && teams.length > 1"
              v-model="selectedTeamId"
              :items="teams"
              item-title="name"
              item-value="id"
              :label="$t('teams.title')"
              density="compact"
              hide-details
              variant="outlined"
              style="min-width: 140px; max-width: 200px"
              class="flex-grow-1"
            />

            <!-- Filter -->
            <SelectMenu
              v-model="filter"
              :label="$t('common.filter')"
              icon="mdi-filter"
              :options="filterOptions"
            />

            <!-- Sort -->
            <SelectMenu
              v-model="sort"
              :label="$t('common.sort')"
              icon="mdi-sort"
              :options="sortOptions"
            />
          </div>
        </div>
      </div>

      <!-- Category scrollable filter -->
      <div
        v-if="categories && categories.length > 0"
        class="category-slider mb-6"
      >
        <v-chip-group v-model="selectedCategoryId" mandatory>
          <v-chip
            :value="null"
            :variant="selectedCategoryId === null ? 'flat' : 'outlined'"
            color="primary"
            class="mr-1"
          >
            {{ $t("common.all") }}
          </v-chip>
          <v-chip
            v-for="cat in categories"
            :key="cat.id"
            :value="cat.id"
            :style="{
              backgroundColor:
                selectedCategoryId === cat.id ? cat.color : undefined,
              color:
                selectedCategoryId === cat.id
                  ? getContrastColor(cat.color)
                  : cat.color,
              borderColor: cat.color,
            }"
            :variant="selectedCategoryId === cat.id ? 'flat' : 'outlined'"
            class="mr-1"
          >
            <v-icon start size="16">{{ cat.icon }}</v-icon>
            {{ cat.name }}
          </v-chip>
        </v-chip-group>
      </div>

      <!-- Loading state -->
      <div v-if="isLoading" class="text-center py-12">
        <v-progress-circular indeterminate color="primary" size="48" />
        <p class="text-body-2 text-medium-emphasis mt-4">
          {{ $t("common.loading") }}
        </p>
      </div>

      <!-- No team selected -->
      <v-card
        v-else-if="!selectedTeamId"
        class="pa-8 text-center"
        elevation="0"
        border
      >
        <v-icon size="64" color="primary" class="mb-4"
          >mdi-account-group</v-icon
        >
        <h2 class="text-h6 mb-2">{{ $t("dashboard.selectTeam") }}</h2>
        <p class="text-body-2 text-medium-emphasis mb-4">
          {{ $t("teams.selectTeamHelp") }}
        </p>
        <v-btn color="primary" :to="{ name: 'teams' }">
          {{ $t("teams.toTeams") }}
        </v-btn>
      </v-card>

      <!-- Empty state -->
      <v-card
        v-else-if="!filteredGoals || filteredGoals.length === 0"
        class="pa-8 text-center"
        elevation="0"
        border
      >
        <v-icon size="64" color="primary" class="mb-4">mdi-target</v-icon>
        <h2 class="text-h6 mb-2">
          {{ searchQuery ? $t("common.noResults", "Geen resultaten gevonden") : $t("goals.noGoals") }}
        </h2>
        <p class="text-body-2 text-medium-emphasis mb-4">
          {{ searchQuery ? $t("common.tryDifferentSearch", "Probeer een andere zoekterm") : $t("goals.createFirst", { year: currentYear }) }}
        </p>
        <v-btn v-if="!searchQuery" color="primary" @click="openGoalDialog()">
          <v-icon start>mdi-plus</v-icon>
          {{ $t("goals.addGoal") }}
        </v-btn>
        <v-btn v-else variant="text" @click="searchQuery = ''">
          {{ $t("common.clearSearch", "Zoekopdracht wissen") }}
        </v-btn>
      </v-card>

      <!-- Goals grid -->
      <v-row v-else>
        <v-col
          v-for="goal in filteredGoals"
          :key="goal.id"
          cols="12"
          sm="6"
          md="4"
          lg="3"
        >
          <GoalCard :goal="goal" @click="navigateToGoal(goal)" />
        </v-col>
      </v-row>

      <!-- Goal Dialog -->
      <GoalDialog
        v-model="goalDialogOpen"
        :goal="editingGoal"
        :team-id="selectedTeamId || ''"
        :categories="categories || []"
        :loading="isGoalSubmitting"
        @submit="handleGoalSubmit"
      />
    </v-container>

    <!-- Floating Add Button - Forced to screen corner -->
    <v-btn
      v-if="selectedTeamId"
      icon="mdi-plus"
      color="primary"
      size="x-large"
      class="fab-main"
      elevation="8"
      @click="openGoalDialog()"
    />
  </DefaultLayout>
</template>

<script setup lang="ts">
import { ref, computed, watch, inject } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import GoalCard from "@/components/goals/GoalCard.vue";
import GoalDialog from "@/components/goals/GoalDialog.vue";
import SelectMenu from "@/components/common/SelectMenu.vue";
import { useTeams } from "@/composables/useTeams";
import { useGoals } from "@/composables/useGoals";
import { useCategories } from "@/composables/useCategories";
import { useAuth } from "@/composables/useAuth";
import { useDashboardFilters } from "@/composables/useDashboardFilters";
import type { Goal, GoalWithRelations, GoalFormData } from "@/types/database";

const router = useRouter();
const { t } = useI18n();
const { user } = useAuth();
const showSnackbar =
  inject<(msg: string, color?: string) => void>("showSnackbar");

// Set current year
const currentYear = ref(new Date().getFullYear());

// Teams
const { teams, isLoading: teamsLoading } = useTeams();
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

const currentTeam = computed(() =>
  teams.value?.find((t) => t.id === selectedTeamId.value),
);

// Goals
const {
  goals,
  isLoading: goalsLoading,
  createGoal,
  updateGoal,
  isCreating,
  isUpdating,
} = useGoals(selectedTeamId, currentYear);

// Re-fetch when team or year changes
watch([selectedTeamId, currentYear], () => {
  // Goals will refetch automatically due to query key change
});

// Categories
const { categories } = useCategories(selectedTeamId);

// UI state
const selectedCategoryId = ref<string | null>(null);
const searchQuery = ref("");
const goalDialogOpen = ref(false);
const editingGoal = ref<Goal | null>(null);

const isLoading = computed(() => {
  // Only show loading for goals if we have a team selected
  if (selectedTeamId.value) {
    return teamsLoading.value || goalsLoading.value;
  }
  // If no team selected, only show loading for teams
  return teamsLoading.value;
});

const isGoalSubmitting = computed(
  () => isCreating.value || isUpdating.value
);

// Extract user ID for filters
const userId = computed(() => user.value?.id);

// Filter and sort
const { filter, sort, filteredGoals } = useDashboardFilters(
  goals,
  userId,
  selectedCategoryId,
  searchQuery,
);

// Filter and sort options
const filterOptions = computed(() => [
  { value: "all", label: t("goals.filters.all") },
  { value: "mine", label: t("goals.filters.mine") },
  { value: "shared", label: t("goals.filters.shared") },
  { value: "completed", label: t("goals.filters.completed") },
  { value: "not_completed", label: t("goals.filters.not_completed") },
  { value: "overdue", label: t("goals.filters.overdue") },
]);

const sortOptions = computed(() => [
  { value: "created", label: t("goals.sort.created") },
  { value: "completed", label: t("goals.sort.completed") },
  { value: "deadline", label: t("goals.sort.deadline") },
]);

function openGoalDialog(goal?: Goal) {
  editingGoal.value = goal || null;
  goalDialogOpen.value = true;
}

async function handleGoalSubmit(formData: GoalFormData & { team_id: string }) {
  try {
    if (editingGoal.value) {
      await updateGoal({ id: editingGoal.value.id, ...formData });
      showSnackbar?.(t("goals.updated"), "success");
    } else {
      await createGoal(formData);
      showSnackbar?.(t("goals.created", { title: formData.title }), "success");
    }
    // Close dialog only after successful submission
    goalDialogOpen.value = false;
  } catch (error: any) {
    console.error('Goal submission error:', error);
    showSnackbar?.(error.message || t("common.error"), "error");
    // Dialog remains open on error so user can retry
  }
}

function navigateToGoal(goal: GoalWithRelations) {
  router.push({ name: "goal", params: { id: goal.id } });
}

// Helper to get contrasting text color for category chips
function getContrastColor(hexColor: string): string {
  // Remove # if present
  const hex = hexColor.replace("#", "");

  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return white for dark colors, dark for light colors
  return luminance > 0.5 ? "#000000" : "#FFFFFF";
}
</script>

<style scoped>
.dashboard-header {
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.05);
  padding-bottom: 16px;
}

.category-slider {
  margin: 0 -16px;
  padding: 0 16px;
}

.category-slider :deep(.v-chip-group__content) {
  padding: 0 !important;
}

.gap-2 {
  gap: 8px;
}

.gap-4 {
  gap: 16px;
}

.gap-1 {
  gap: 4px;
}

@media (max-width: 600px) {
  .dashboard-header {
    padding-bottom: 12px;
  }
}

.fab-main {
  position: fixed !important;
  bottom: 24px !important;
  right: 24px !important;
  z-index: 99;
  border-radius: 50% !important;
}

@media (max-width: 600px) {
  .fab-main {
    bottom: 16px !important;
    right: 16px !important;
  }
}

.category-chip {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  font-weight: 600 !important;
  letter-spacing: 0.01em;
}

.category-chip:hover {
  transform: translateY(-2px);
  filter: brightness(1.15);
}
</style>
