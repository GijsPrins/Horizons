<template>
  <v-card
    class="goal-card"
    :style="{ '--category-color': categoryColor }"
    elevation="0"
    border
    hover
    @click="$emit('click', goal)"
  >
    <!-- Colored top border -->
    <div class="goal-card__border" />

    <v-card-text class="pa-4">
      <div class="d-flex align-center gap-4">
        <!-- Progress circle -->
        <div class="flex-shrink-0">
          <v-progress-circular
            :model-value="progress"
            :size="64"
            :width="5"
            :color="progress === 100 ? 'success' : 'primary'"
            class="goal-card__progress"
          >
            <span class="text-caption font-weight-bold">
              {{ progress }}%
            </span>
          </v-progress-circular>
        </div>

        <div class="flex-grow-1 min-width-0 overflow-hidden">
          <!-- Title -->
          <h3 class="goal-card__title font-weight-bold mb-2" :title="goal.title">
            {{ goal.title }}
          </h3>

          <!-- Badges -->
          <div class="d-flex flex-wrap gap-1">
            <v-chip
              size="x-small"
              :color="typeColor"
              variant="tonal"
              class="text-uppercase font-weight-bold"
            >
              <v-icon start size="12">{{ typeIcon }}</v-icon>
              {{ typeLabel }}
            </v-chip>
            
            <v-chip
              v-if="goal.category"
              size="x-small"
              :color="goal.category.color"
              variant="flat"
              class="text-uppercase font-weight-bold max-width-100"
            >
              <v-icon start size="12">{{ goal.category.icon }}</v-icon>
              <span class="text-truncate">{{ goal.category.name }}</span>
            </v-chip>
          </div>
        </div>
      </div>
    </v-card-text>

    <!-- Footer -->
    <v-card-actions class="pt-0 px-3 pb-3">
      <v-avatar size="24" :color="categoryColor" class="elevation-1">
        <v-img
          v-if="goal.profile?.avatar_url"
          :src="goal.profile.avatar_url"
        />
        <span v-else class="text-caption text-white">
          {{ goal.profile?.display_name?.charAt(0)?.toUpperCase() || '?' }}
        </span>
      </v-avatar>

      <v-spacer />

      <!-- Shared indicator -->
      <v-icon
        v-if="goal.is_shared"
        size="16"
        color="primary"
        title="Gedeeld met team"
      >
        mdi-eye
      </v-icon>

      <!-- Completed indicator -->
      <v-icon
        v-if="goal.is_completed"
        size="16"
        color="success"
        class="ml-1"
      >
        mdi-check-circle
      </v-icon>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { GoalWithRelations } from '@/types/database'
import { calculateProgress } from '@/composables/useProgress'

const props = defineProps<{
  goal: GoalWithRelations
}>()

defineEmits<{
  click: [goal: GoalWithRelations]
}>()

const progress = computed(() => calculateProgress(props.goal))

const categoryColor = computed(() => props.goal.category?.color || '#607D8B')

const typeConfig = {
  single: { label: 'Eenmalig', icon: 'mdi-flag-checkered', color: 'info' },
  weekly: { label: 'Wekelijks', icon: 'mdi-calendar-week', color: 'warning' },
  milestone: { label: 'Mijlpalen', icon: 'mdi-stairs', color: 'secondary' }
}

const typeLabel = computed(() => typeConfig[props.goal.goal_type as keyof typeof typeConfig]?.label || 'Doel')
const typeIcon = computed(() => typeConfig[props.goal.goal_type as keyof typeof typeConfig]?.icon || 'mdi-target')
const typeColor = computed(() => typeConfig[props.goal.goal_type as keyof typeof typeConfig]?.color || 'primary')
</script>

<style scoped>
.goal-card {
  position: relative;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
}

.goal-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0,0,0,0.2) !important;
}

.goal-card__border {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--category-color, #607D8B);
  border-radius: 4px 4px 0 0;
}

.goal-card__title {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
  word-break: break-word;
}

.max-width-100 {
  max-width: 100%;
}

.min-width-0 {
  min-width: 0;
}

.gap-1 {
  gap: 4px;
}

.gap-4 {
  gap: 16px;
}
</style>
