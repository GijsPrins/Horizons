<template>
  <DefaultLayout>
    <v-container fluid class="pa-4">
      <!-- Header -->
      <div class="d-flex align-center mb-4">
        <v-btn icon variant="text" @click="$router.back()">
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>
        <div class="ml-2">
          <h1 class="text-h4 font-weight-bold">{{ goal?.title || 'Doel laden...' }}</h1>
          <p class="text-body-2 text-medium-emphasis">
            {{ goal?.category?.name || 'Geen categorie' }}
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
            <v-list-item @click="editGoal">
              <template #prepend>
                <v-icon>mdi-pencil</v-icon>
              </template>
              <v-list-item-title>Bewerken</v-list-item-title>
            </v-list-item>
            <v-list-item @click="confirmDelete = true">
              <template #prepend>
                <v-icon color="error">mdi-delete</v-icon>
              </template>
              <v-list-item-title class="text-error">Verwijderen</v-list-item-title>
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
                  <span class="text-h5 font-weight-bold">{{ progress }}%</span>
                </v-progress-circular>

                <div class="ml-6">
                  <v-chip
                    :color="goal.is_completed ? 'success' : 'primary'"
                    variant="flat"
                    class="mb-2"
                  >
                    <v-icon start>{{ goal.is_completed ? 'mdi-check-circle' : 'mdi-progress-clock' }}</v-icon>
                    {{ goal.is_completed ? 'Voltooid' : 'Bezig' }}
                  </v-chip>

                  <div class="text-body-2 text-medium-emphasis">
                    {{ typeLabel }} &bull; {{ goal.year }}
                  </div>

                  <div v-if="goal.is_shared" class="text-body-2 mt-1">
                    <v-icon size="16" color="primary">mdi-eye</v-icon>
                    Gedeeld met team
                  </div>
                </div>

                <v-spacer />

                <!-- Complete toggle for single goals -->
                <v-btn
                  v-if="goal.goal_type === 'single' && isOwner"
                  :color="goal.is_completed ? 'success' : 'primary'"
                  :variant="goal.is_completed ? 'flat' : 'outlined'"
                  @click="toggleComplete"
                >
                  <v-icon start>{{ goal.is_completed ? 'mdi-check' : 'mdi-flag-checkered' }}</v-icon>
                  {{ goal.is_completed ? 'Voltooid!' : 'Markeer als voltooid' }}
                </v-btn>
              </div>

              <!-- Description -->
              <div v-if="goal.description" class="mb-4">
                <h3 class="text-subtitle-2 font-weight-medium mb-2">Beschrijving</h3>
                <p class="text-body-2">{{ goal.description }}</p>
              </div>
            </v-card-text>
          </v-card>

          <!-- Weekly progress -->
          <v-card v-if="goal.goal_type === 'weekly'" elevation="0" border class="mb-4">
            <v-card-title>
              <v-icon start>mdi-calendar-week</v-icon>
              Wekelijkse voortgang
            </v-card-title>
            <v-card-text>
              <WeeklyGrid
                :goal="goal"
                :readonly="!isOwner"
                @toggle="handleWeekToggle"
              />
            </v-card-text>
          </v-card>

          <!-- Milestone progress -->
          <v-card v-if="goal.goal_type === 'milestone'" elevation="0" border class="mb-4">
            <v-card-title>
              <v-icon start>mdi-stairs</v-icon>
              Mijlpalen ({{ completedMilestones }} / {{ goal.target_count || 0 }})
            </v-card-title>
            <v-card-text>
              <MilestoneList
                :goal="goal"
                :readonly="!isOwner"
                @add="addMilestone"
                @toggle="toggleMilestone"
                @update="updateMilestone"
                @delete="deleteMilestone"
              />
            </v-card-text>
          </v-card>

          <!-- Attachments -->
          <v-card elevation="0" border>
            <v-card-title class="d-flex align-center">
              <v-icon start>mdi-paperclip</v-icon>
              Bijlagen
              <v-spacer />
              <v-btn
                v-if="isOwner"
                size="small"
                variant="text"
                color="primary"
                @click="attachmentDialogOpen = true"
              >
                <v-icon start>mdi-plus</v-icon>
                Toevoegen
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
            <v-card-title>Details</v-card-title>
            <v-list density="compact">
              <v-list-item>
                <template #prepend>
                  <v-avatar size="32" :color="goal.category?.color || 'grey'">
                    <v-icon size="18">{{ goal.category?.icon || 'mdi-tag' }}</v-icon>
                  </v-avatar>
                </template>
                <v-list-item-title>{{ goal.category?.name || 'Geen categorie' }}</v-list-item-title>
                <v-list-item-subtitle>Categorie</v-list-item-subtitle>
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
                <v-list-item-title>{{ goal.profile?.display_name }}</v-list-item-title>
                <v-list-item-subtitle>Eigenaar</v-list-item-subtitle>
              </v-list-item>

              <v-list-item>
                <template #prepend>
                  <v-avatar size="32" color="surface-variant">
                    <v-icon size="18">mdi-calendar</v-icon>
                  </v-avatar>
                </template>
                <v-list-item-title>{{ formatDate(goal.created_at) }}</v-list-item-title>
                <v-list-item-subtitle>Aangemaakt</v-list-item-subtitle>
              </v-list-item>

              <v-list-item v-if="goal.completed_at">
                <template #prepend>
                  <v-avatar size="32" color="success">
                    <v-icon size="18">mdi-check</v-icon>
                  </v-avatar>
                </template>
                <v-list-item-title>{{ formatDate(goal.completed_at) }}</v-list-item-title>
                <v-list-item-subtitle>Voltooid</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>
      </v-row>

      <!-- Delete confirmation -->
      <v-dialog v-model="confirmDelete" max-width="400">
        <v-card>
          <v-card-title>Doel verwijderen?</v-card-title>
          <v-card-text>
            Weet je zeker dat je "{{ goal?.title }}" wilt verwijderen?
            Dit kan niet ongedaan worden gemaakt.
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" @click="confirmDelete = false">Annuleren</v-btn>
            <v-btn color="error" variant="flat" @click="handleDelete">Verwijderen</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Attachment dialog -->
      <AttachmentDialog
        v-model="attachmentDialogOpen"
        :goal-id="goal?.id || ''"
        @submit="handleAddAttachment"
      />

      <!-- Goal Edit dialog -->
      <GoalDialog
        v-if="goal"
        v-model="goalDialogOpen"
        :goal="goal"
        :team-id="goal.team_id || ''"
        :categories="categories || []"
        @submit="handleGoalSubmit"
      />

      <!-- Completion Date Dialog -->
      <v-dialog v-model="completionDialogOpen" max-width="400">
        <v-card>
          <v-card-title>Doel voltooien</v-card-title>
          <v-card-text>
            <p class="mb-4">Gefeliciteerd! Wanneer heb je dit doel bereikt?</p>
            <v-date-picker
              v-model="completionDate"
              color="primary"
              hide-header
              class="mx-auto"
            />
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" @click="completionDialogOpen = false">Annuleren</v-btn>
            <v-btn color="primary" variant="flat" @click="confirmToggleComplete">
              Bevestigen
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { ref, computed, inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import WeeklyGrid from '@/components/goals/WeeklyGrid.vue'
import MilestoneList from '@/components/goals/MilestoneList.vue'
import AttachmentList from '@/components/goals/AttachmentList.vue'
import AttachmentDialog from '@/components/goals/AttachmentDialog.vue'
import GoalDialog from '@/components/goals/GoalDialog.vue'
import { useGoals, useGoal } from '@/composables/useGoals'
import { useProgress, calculateProgress } from '@/composables/useProgress'
import { useAuth } from '@/composables/useAuth'
import { useCategories } from '@/composables/useCategories'
import { useAttachments } from '@/composables/useAttachments'

const route = useRoute()
const router = useRouter()
const { user } = useAuth()
const showSnackbar = inject<(msg: string, color?: string) => void>('showSnackbar')

const goalId = route.params.id as string
const { goal, isLoading, refetch } = useGoal(goalId)
const { toggleWeek, addProgress, updateProgress, deleteProgress } = useProgress()
const { addAttachment, uploadFile, deleteAttachment: removeAttachment } = useAttachments()
const { categories } = useCategories(computed(() => goal.value?.team_id || undefined))

const { 
  toggleComplete: toggleMutation, 
  deleteGoal: deleteMutation, 
  updateGoal: updateMutation 
} = useGoals()

const confirmDelete = ref(false)
const attachmentDialogOpen = ref(false)
const goalDialogOpen = ref(false)
const completionDialogOpen = ref(false)
const completionDate = ref<Date>(new Date())

const isOwner = computed(() => goal.value?.user_id === user.value?.id)
const progress = computed(() => goal.value ? calculateProgress(goal.value) : 0)

const typeLabels: Record<string, string> = {
  single: 'Eenmalig doel',
  weekly: 'Wekelijks doel',
  milestone: 'Mijlpalen doel'
}
const typeLabel = computed(() => typeLabels[goal.value?.goal_type || 'single'])

const completedMilestones = computed(() => 
  goal.value?.progress_entries?.filter(e => e.achieved).length || 0
)

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

async function toggleComplete() {
  if (!goal.value) return
  
  if (!goal.value.is_completed) {
    // If we're marking as completed, show the dialog
    completionDate.value = new Date()
    completionDialogOpen.value = true
  } else {
    // If we're reopening, just do it directly
    try {
      await toggleMutation({ id: goal.value.id, is_completed: false })
      showSnackbar?.('Doel weer opengezet', 'success')
    } catch (error: any) {
      showSnackbar?.(error.message || 'Fout bij bijwerken status', 'error')
    }
  }
}

async function confirmToggleComplete() {
  if (!goal.value) return
  try {
    await toggleMutation({ 
      id: goal.value!.id, 
      is_completed: true, 
      date: completionDate.value.toISOString() 
    })
    completionDialogOpen.value = false
    showSnackbar?.('Doel voltooid! 🎉', 'success')
  } catch (error: any) {
    showSnackbar?.(error.message || 'Fout bij bijwerken status', 'error')
  }
}

async function handleWeekToggle(weekNumber: number, achieved: boolean) {
  if (!goal.value) return
  await toggleWeek({ goalId: goal.value!.id, weekNumber, achieved })
  // useProgress mutations should ideally invalidate the single goal too
  refetch()
}

async function addMilestone(note: string, achieved: boolean = true) {
  if (!goal.value) return
  await addProgress({
    goal_id: goal.value.id,
    entry_date: new Date().toISOString().slice(0, 10),
    week_number: null,
    note,
    achieved
  })
  refetch()
}

async function toggleMilestone(entryId: string, achieved: boolean) {
  await updateProgress({ id: entryId, achieved })
  refetch()
}

async function updateMilestone(entryId: string, note: string) {
  await updateProgress({ id: entryId, note })
  refetch()
}

async function deleteMilestone(entryId: string) {
  await deleteProgress(entryId)
  refetch()
}

async function handleDelete() {
  if (!goal.value) return
  try {
    await deleteMutation(goal.value!.id)
    confirmDelete.value = false
    showSnackbar?.('Doel verwijderd', 'success')
    router.push({ name: 'dashboard' })
  } catch (error: any) {
    showSnackbar?.(error.message || 'Fout bij verwijderen', 'error')
  }
}

async function handleGoalSubmit(formData: any) {
  if (!goal.value) return
  try {
    await updateMutation({ id: goal.value!.id, ...formData })
    goalDialogOpen.value = false
    showSnackbar?.('Doel bijgewerkt!', 'success')
  } catch (error: any) {
    showSnackbar?.(error.message || 'Fout bij bijwerken', 'error')
  }
}

function editGoal() {
  goalDialogOpen.value = true
}

async function handleAddAttachment(data: { type: any; title: string; url?: string; content?: string; file?: File }) {
  if (!goal.value) return
  try {
    if (data.file) {
      await uploadFile({
        goal_id: goal.value.id,
        file: data.file,
        title: data.title || data.file.name
      })
    } else {
      await addAttachment({
        goal_id: goal.value.id,
        ...data
      })
    }
    attachmentDialogOpen.value = false
    showSnackbar?.('Bijlage toegevoegd!', 'success')
  } catch (error: any) {
    showSnackbar?.(error.message || 'Fout bij toevoegen bijlage', 'error')
  }
}

async function deleteAttachment(attachmentId: string) {
  try {
    await removeAttachment(attachmentId)
    showSnackbar?.('Bijlage verwijderd', 'success')
  } catch (error: any) {
    showSnackbar?.(error.message || 'Fout bij verwijderen bijlage', 'error')
  }
}
</script>
