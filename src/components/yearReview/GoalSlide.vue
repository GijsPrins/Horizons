<template>
  <div class="goal-slide">
    <!-- Background blur effect if image attachment exists -->
    <div
      v-if="backgroundImage"
      class="goal-slide__background"
      :style="{ backgroundImage: `url(${backgroundImage})` }"
    />

    <!-- Content card -->
    <v-card
      class="goal-slide__card mx-auto"
      max-width="700"
      elevation="24"
    >
      <!-- Trophy icon -->
      <div class="text-center pt-8 pb-4">
        <v-icon size="80" color="amber-darken-1" class="trophy-icon">
          mdi-trophy
        </v-icon>
      </div>

      <!-- Goal title -->
      <v-card-title
        class="text-center font-weight-bold px-8 pb-2 goal-title"
        :class="goal.title.length > 50 ? 'text-h5' : goal.title.length > 30 ? 'text-h4' : 'text-h3'"
      >
        {{ goal.title }}
      </v-card-title>

      <!-- Description -->
      <v-card-text v-if="goal.description" class="text-h6 text-center text-medium-emphasis px-8">
        {{ goal.description }}
      </v-card-text>

      <!-- Weekly progress badge -->
      <div v-if="goal.goal_type === 'weekly'" class="d-flex justify-center py-2">
        <v-chip size="large" color="success" variant="tonal">
          <v-icon start>mdi-calendar-check</v-icon>
          {{ weeksAchieved }} van 52 weken behaald
        </v-chip>
      </div>

      <!-- Category chip -->
      <div v-if="goal.category" class="d-flex justify-center py-4">
        <v-chip
          size="large"
          :color="goal.category.color"
          variant="flat"
        >
          <v-icon start>{{ goal.category.icon }}</v-icon>
          {{ goal.category.name }}
        </v-chip>
      </div>

      <!-- Creator info -->
      <div class="d-flex justify-center align-center pb-8 pt-4" style="gap: 16px">
        <v-avatar size="56" :color="goal.category?.color || 'primary'">
          <v-img v-if="goal.profile?.avatar_url" :src="goal.profile.avatar_url" />
          <span v-else class="text-white text-h5">
            {{ goal.profile?.display_name?.charAt(0)?.toUpperCase() || '?' }}
          </span>
        </v-avatar>
        <div>
          <div class="text-h6 font-weight-medium">
            {{ goal.profile?.display_name || 'Onbekend' }}
          </div>
          <div class="text-body-2 text-medium-emphasis">
            <template v-if="goal.completed_at">
              {{ $t('yearReview.completedOn', { date: formatDate(goal.completed_at) }) }}
            </template>
            <template v-else>
              {{ goal.year }}
            </template>
          </div>
        </div>
      </div>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { GoalWithRelations } from '@/types/database'
import { formatDate } from '@/utils/format'

const props = defineProps<{
  goal: GoalWithRelations
}>()

// Get first image attachment as background
const backgroundImage = computed(() => {
  const imageAttachment = props.goal.attachments?.find(
    a => a.type === 'image' && a.url
  )
  return imageAttachment?.url
})

// Count achieved weeks for weekly goals
const weeksAchieved = computed(() => {
  if (props.goal.goal_type !== 'weekly') return 0
  return props.goal.progress_entries?.filter(e => e.achieved).length ?? 0
})
</script>

<style scoped>
.goal-slide {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  z-index: 100;
}

.goal-slide__background {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  opacity: 0.15;
  filter: blur(12px);
}

.goal-slide__card {
  position: relative;
  z-index: 1;
  background: rgba(255, 255, 255, 0.97);
  backdrop-filter: blur(10px);
  border-radius: 24px !important;
}

.goal-title {
  white-space: normal !important;
  word-wrap: break-word;
  line-height: 1.3;
}

.trophy-icon {
  animation: trophy-bounce 1s ease-out;
}

@keyframes trophy-bounce {
  0% {
    transform: scale(0) rotate(-20deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.2) rotate(10deg);
  }
  70% {
    transform: scale(0.9) rotate(-5deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}
</style>
