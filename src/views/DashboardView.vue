<template>
  <DefaultLayout>
    <v-container fluid class="pa-4">
      <!-- Header -->
      <div class="dashboard-header mb-6">
        <div class="d-flex align-center justify-space-between flex-wrap gap-4">
          <div>
            <h1 class="text-h4 font-weight-bold">Mijn doelen</h1>
            <p class="text-body-2 text-medium-emphasis">
              {{ currentTeam?.name || 'Selecteer een team' }} &bull; {{ currentYear }}
            </p>
          </div>

          <div class="d-flex align-center flex-grow-1 flex-sm-grow-0 justify-end gap-2">
            <!-- Team selector -->
            <v-select
              v-if="teams && teams.length > 0"
              v-model="selectedTeamId"
              :items="teams"
              item-title="name"
              item-value="id"
              label="Team"
              density="compact"
              hide-details
              variant="outlined"
              style="min-width: 140px; max-width: 200px"
              class="flex-grow-1"
            />

            <!-- Filter -->
            <v-menu>
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  variant="outlined"
                  icon="mdi-filter-variant"
                  class="d-sm-none"
                />
                <v-btn
                  v-bind="props"
                  variant="outlined"
                  class="d-none d-sm-flex"
                >
                  <v-icon start>mdi-filter</v-icon>
                  Filter
                </v-btn>
              </template>
              <v-list density="compact">
                <v-list-item @click="filter = 'all'">
                  <v-list-item-title>Alle doelen</v-list-item-title>
                </v-list-item>
                <v-list-item @click="filter = 'mine'">
                  <v-list-item-title>Mijn doelen</v-list-item-title>
                </v-list-item>
                <v-list-item @click="filter = 'shared'">
                  <v-list-item-title>Gedeelde doelen</v-list-item-title>
                </v-list-item>
                <v-list-item @click="filter = 'completed'">
                  <v-list-item-title>Voltooid</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </div>
        </div>
      </div>

      <!-- Category scrollable filter -->
      <div v-if="categories && categories.length > 0" class="category-slider mb-6">
        <v-chip-group
          v-model="selectedCategoryId"
          mandatory
        >
          <v-chip
            :value="null"
            :variant="selectedCategoryId === null ? 'flat' : 'tonal'"
            color="primary"
            class="mr-1"
          >
            Alle
          </v-chip>
          <v-chip
            v-for="cat in categories"
            :key="cat.id"
            :value="cat.id"
            :color="cat.color"
            :variant="selectedCategoryId === cat.id ? 'flat' : 'tonal'"
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
        <p class="text-body-2 text-medium-emphasis mt-4">Doelen laden...</p>
      </div>

      <!-- No team selected -->
      <v-card
        v-else-if="!selectedTeamId"
        class="pa-8 text-center"
        elevation="0"
        border
      >
        <v-icon size="64" color="primary" class="mb-4">mdi-account-group</v-icon>
        <h2 class="text-h6 mb-2">Selecteer een team</h2>
        <p class="text-body-2 text-medium-emphasis mb-4">
          Je moet eerst een team selecteren of aanmaken om doelen te kunnen beheren.
        </p>
        <v-btn color="primary" :to="{ name: 'teams' }">
          Naar teams
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
        <h2 class="text-h6 mb-2">Nog geen doelen</h2>
        <p class="text-body-2 text-medium-emphasis mb-4">
          Maak je eerste doel aan voor {{ currentYear }}!
        </p>
        <v-btn color="primary" @click="openGoalDialog()">
          <v-icon start>mdi-plus</v-icon>
          Doel toevoegen
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
          <GoalCard
            :goal="goal"
            @click="navigateToGoal(goal)"
          />
        </v-col>
      </v-row>



      <!-- Goal Dialog -->
      <GoalDialog
        v-model="goalDialogOpen"
        :goal="editingGoal"
        :team-id="selectedTeamId || ''"
        :categories="categories || []"
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
import { ref, computed, watch, inject } from 'vue'
import { useRouter } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import GoalCard from '@/components/goals/GoalCard.vue'
import GoalDialog from '@/components/goals/GoalDialog.vue'
import { useTeams } from '@/composables/useTeams'
import { useGoals } from '@/composables/useGoals'
import { useCategories } from '@/composables/useCategories'
import { useAuth } from '@/composables/useAuth'
import type { Goal, GoalWithRelations, GoalFormData } from '@/types/database'

const router = useRouter()
const { user } = useAuth()
const showSnackbar = inject<(msg: string, color?: string) => void>('showSnackbar')

// Set current year
const currentYear = ref(new Date().getFullYear())

// Teams
const { teams, isLoading: teamsLoading } = useTeams()
const selectedTeamId = ref<string | undefined>(undefined)

// Auto-select first team
watch(teams, (newTeams) => {
  if (newTeams && newTeams.length > 0 && !selectedTeamId.value) {
    selectedTeamId.value = newTeams[0]?.id
  }
}, { immediate: true })

const currentTeam = computed(() => 
  teams.value?.find(t => t.id === selectedTeamId.value)
)

// Goals
const { goals, isLoading: goalsLoading, createGoal, updateGoal } = useGoals(
  selectedTeamId,
  currentYear
)

// Re-fetch when team or year changes
watch([selectedTeamId, currentYear], () => {
  // Goals will refetch automatically due to query key change
})

// Categories
const { categories } = useCategories(selectedTeamId)

// UI state

const filter = ref<'all' | 'mine' | 'shared' | 'completed'>('all')
const selectedCategoryId = ref<string | null>(null)
const goalDialogOpen = ref(false)
const editingGoal = ref<Goal | null>(null)

const isLoading = computed(() => teamsLoading.value || goalsLoading.value)

// Filtered goals
const filteredGoals = computed(() => {
  if (!goals.value) return []

  let result = [...goals.value]

  // Filter by ownership
  switch (filter.value) {
    case 'mine':
      result = result.filter(g => g.user_id === user.value?.id)
      break
    case 'shared':
      result = result.filter(g => g.is_shared && g.user_id !== user.value?.id)
      break
    case 'completed':
      result = result.filter(g => g.is_completed)
      break
  }

  // Filter by category
  if (selectedCategoryId.value) {
    result = result.filter(g => g.category_id === selectedCategoryId.value)
  }

  return result
})

function openGoalDialog(goal?: Goal) {
  editingGoal.value = goal || null
  goalDialogOpen.value = true
}

async function handleGoalSubmit(formData: GoalFormData & { team_id: string }) {
  try {
    if (editingGoal.value) {
      await updateGoal({ id: editingGoal.value.id, ...formData })
      showSnackbar?.('Doel bijgewerkt!', 'success')
    } else {
      await createGoal(formData)
      showSnackbar?.('Doel aangemaakt!', 'success')
    }
  } catch (error: any) {
    showSnackbar?.(error.message || 'Er is een fout opgetreden', 'error')
  }
}

function navigateToGoal(goal: GoalWithRelations) {
  router.push({ name: 'goal', params: { id: goal.id } })
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
