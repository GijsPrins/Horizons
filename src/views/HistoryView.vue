<template>
  <DefaultLayout>
    <v-container fluid class="pa-4">
      <div class="history-header mb-6">
        <h1 class="text-h4 font-weight-bold mb-4 mb-sm-0">{{ $t('history.title') }}</h1>

        <div class="history-selectors">
          <!-- Team Selector -->
          <v-select
            v-if="teams && teams.length > 0"
            v-model="selectedTeamId"
            :items="teams"
            item-title="name"
            item-value="id"
            :label="$t('teams.title')"
            density="compact"
            hide-details
            variant="outlined"
            class="history-selector"
          />

          <!-- Year selector -->
          <v-select
            v-model="selectedYear"
            :items="availableYears"
            :label="$t('goals.goalYear')"
            density="compact"
            hide-details
            variant="outlined"
            class="history-selector"
          />
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="isLoading" class="text-center py-12">
        <v-progress-circular indeterminate color="primary" size="48" />
        <p class="text-body-2 text-medium-emphasis mt-4">{{ $t('common.loading') }}</p>
      </div>

      <!-- No team selected -->
      <v-card
        v-else-if="!selectedTeamId"
        class="pa-8 text-center"
        elevation="0"
        border
      >
        <v-icon size="64" color="primary" class="mb-4">mdi-account-group</v-icon>
        <h2 class="text-h6 mb-2">{{ $t('dashboard.selectTeam') }}</h2>
        <p class="text-body-2 text-medium-emphasis">
          {{ $t('history.selectTeamHelp', { year: selectedYear }) }}
        </p>
      </v-card>

      <!-- Empty state -->
      <v-card
        v-else-if="!goals || goals.length === 0"
        class="pa-8 text-center"
        elevation="0"
        border
      >
        <v-icon size="64" color="primary" class="mb-4">mdi-calendar-blank</v-icon>
        <h2 class="text-h6 mb-2">{{ $t('history.noGoalsForYear', { year: selectedYear }) }}</h2>
        <p class="text-body-2 text-medium-emphasis">
          {{ $t('history.noGoalsDescription') }}
        </p>
      </v-card>

      <!-- Goals grid -->
      <v-row v-else-if="goals && goals.length > 0">
        <v-col
          v-for="goal in goals"
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
    </v-container>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import GoalCard from '@/components/goals/GoalCard.vue'
import { useTeams } from '@/composables/useTeams'
import { useGoals } from '@/composables/useGoals'
import type { GoalWithRelations } from '@/types/database'

const router = useRouter()
const currentYear = new Date().getFullYear()
const selectedYear = ref(currentYear)

// Teams
const { teams } = useTeams()
const selectedTeamId = ref<string | undefined>(undefined)

// Auto-select first team
watch(teams, (newTeams) => {
  if (newTeams && newTeams.length > 0 && !selectedTeamId.value) {
    selectedTeamId.value = newTeams[0]?.id
  }
}, { immediate: true })

const availableYears = computed(() => {
  const years = []
  // Show 5 years into the future and 5 years into the past
  for (let y = currentYear + 5; y >= currentYear - 5; y--) {
    years.push(y)
  }
  return years
})

// Goals for selected year/team
const { goals, isLoading } = useGoals(
  selectedTeamId,
  selectedYear
)

function navigateToGoal(goal: GoalWithRelations) {
  router.push({ name: 'goal', params: { id: goal.id } })
}
</script>

<style scoped>
.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}

.history-selectors {
  display: flex;
  gap: 16px;
  align-items: center;
}

.history-selector {
  min-width: 140px;
  max-width: 200px;
}

@media (max-width: 600px) {
  .history-header {
    flex-direction: column;
    align-items: stretch;
  }

  .history-selectors {
    flex-direction: column;
    width: 100%;
  }

  .history-selector {
    max-width: 100%;
    width: 100%;
  }
}
</style>
