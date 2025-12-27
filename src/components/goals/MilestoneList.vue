<template>
  <div class="milestone-list">
    <!-- Milestone list -->
    <v-list v-if="allMilestones.length > 0" density="compact" class="pa-0">
      <v-list-item
        v-for="(entry, index) in allMilestones"
        :key="entry.id"
        class="milestone-item px-2"
        :class="{ 'milestone-item--editing': editingId === entry.id }"
      >
        <template #prepend>
          <v-checkbox
            :model-value="entry.achieved"
            color="success"
            hide-details
            :readonly="readonly"
            density="compact"
            class="mr-2"
            @update:model-value="$emit('toggle', entry.id, !!$event)"
          />
        </template>

        <div v-if="editingId === entry.id" class="d-flex align-center flex-grow-1">
          <v-text-field
            v-model="editNote"
            density="compact"
            variant="underlined"
            hide-details
            autofocus
            @keyup.enter="saveEdit(entry.id)"
            @keyup.esc="cancelEdit"
          />
          <v-btn icon="mdi-check" variant="text" size="small" color="success" @click="saveEdit(entry.id)" />
          <v-btn icon="mdi-close" variant="text" size="small" @click="cancelEdit" />
        </div>

        <v-list-item-title v-else :class="{ 'text-decoration-line-through text-medium-emphasis': entry.achieved }">
          {{ entry.note || `${$t('attachments.milestone')} ${index + 1}` }}
        </v-list-item-title>

        <v-list-item-subtitle v-if="editingId !== entry.id">
          {{ formatDate(entry.entry_date) }}
        </v-list-item-subtitle>

        <template #append v-if="!readonly && editingId !== entry.id">
          <div class="milestone-actions">
            <v-btn
              icon="mdi-pencil"
              variant="text"
              size="x-small"
              class="mr-1"
              @click="startEdit(entry)"
            />
            <v-btn
              icon="mdi-delete"
              variant="text"
              size="x-small"
              color="error"
              @click="$emit('delete', entry.id)"
            />
          </div>
        </template>
      </v-list-item>
    </v-list>

    <!-- Empty state -->
    <div v-else class="text-center py-6 text-medium-emphasis bg-surface-variant rounded-lg mb-4" style="opacity: 0.5">
      <v-icon size="48" class="mb-2">mdi-stairs-up</v-icon>
      <p class="text-body-2">{{ $t('progress.createFirstMilestone') }}</p>
    </div>

    <!-- Add milestone -->
    <v-card v-if="!readonly" variant="outlined" class="pa-3 bg-surface">
      <div class="d-flex align-end">
        <v-text-field
          v-model="newMilestone"
          :label="$t('attachments.newMilestone')"
          :placeholder="$t('progress.milestonePlaceholder')"
          variant="underlined"
          density="compact"
          hide-details
          class="flex-grow-1 mr-2"
          @keyup.enter="addMilestone"
        />
        <v-btn
          color="primary"
          variant="flat"
          icon="mdi-plus"
          size="small"
          :disabled="!newMilestone.trim()"
          @click="addMilestone"
        />
      </div>
      <div class="d-flex align-center mt-2">
        <v-checkbox
          v-model="achieveImmediately"
          :label="$t('progress.achieveImmediately')"
          density="compact"
          hide-details
          color="success"
          class="text-caption"
        />
        <v-spacer />
        <div class="text-caption text-medium-emphasis">
          {{ remainingCount }} {{ $t('progress.remaining') }}
        </div>
      </div>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { GoalWithRelations, ProgressEntry } from '@/types/database'

const props = defineProps<{
  goal: GoalWithRelations
  readonly?: boolean
}>()

const emit = defineEmits<{
  add: [note: string, achieved: boolean]
  toggle: [entryId: string, achieved: boolean]
  update: [entryId: string, note: string]
  delete: [entryId: string]
}>()

const newMilestone = ref('')
const achieveImmediately = ref(true)
const editingId = ref<string | null>(null)
const editNote = ref('')

const allMilestones = computed(() => 
  [...(props.goal.progress_entries || [])].sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )
)

const completedCount = computed(() => 
  props.goal.progress_entries?.filter(e => e.achieved).length || 0
)

const remainingCount = computed(() => {
  const target = props.goal.target_count || 0
  const rem = target - completedCount.value
  return rem > 0 ? rem : 0
})

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short'
  })
}

function addMilestone() {
  if (!newMilestone.value.trim()) return
  emit('add', newMilestone.value.trim(), achieveImmediately.value)
  newMilestone.value = ''
  // Keep achieveImmediately as is for next one
}

function startEdit(entry: ProgressEntry) {
  editingId.value = entry.id
  editNote.value = entry.note || ''
}

function cancelEdit() {
  editingId.value = null
  editNote.value = ''
}

function saveEdit(id: string) {
  if (!editNote.value.trim()) return
  emit('update', id, editNote.value.trim())
  cancelEdit()
}
</script>

<style scoped>
.milestone-item {
  border-radius: 8px;
  margin-bottom: 2px;
  transition: all 0.2s ease;
}

.milestone-item:hover {
  background: rgba(var(--v-theme-on-surface), 0.03);
}

.milestone-item--editing {
  background: rgba(var(--v-theme-primary), 0.05);
}

.milestone-actions {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.milestone-item:hover .milestone-actions {
  opacity: 1;
}

/* On mobile show actions always */
@media (max-width: 600px) {
  .milestone-actions {
    opacity: 1;
  }
}
</style>
