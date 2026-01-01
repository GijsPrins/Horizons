<template>
  <!-- Setup Mode -->
  <DefaultLayout v-if="!isPlaying">
    <v-container fluid class="pa-4">
      <!-- Header -->
      <div class="text-center mb-8">
        <v-icon size="64" color="primary" class="mb-4">mdi-presentation-play</v-icon>
        <h1 class="text-h3 font-weight-bold mb-2">
          {{ $t('yearReview.title') }}
        </h1>
        <p class="text-body-1 text-medium-emphasis">
          {{ $t('yearReview.description') }}
        </p>
      </div>

      <!-- Setup form -->
      <v-row justify="center">
        <v-col cols="12" sm="8" md="6" lg="4">
          <v-card elevation="0" border class="pa-6">
            <!-- Team selector -->
            <v-select
              v-if="teams && teams.length > 0"
              v-model="selectedTeamId"
              :items="teams"
              item-title="name"
              item-value="id"
              :label="$t('yearReview.selectTeam')"
              variant="outlined"
              class="mb-4"
              hide-details
            />

            <!-- Year selector -->
            <v-select
              v-model="selectedYear"
              :items="yearOptions"
              :label="$t('yearReview.selectYear')"
              variant="outlined"
              class="mb-6"
              hide-details
            />

            <!-- Loading -->
            <div v-if="isLoading" class="text-center py-4">
              <v-progress-circular indeterminate color="primary" />
            </div>

            <!-- Goal count preview -->
            <div v-else-if="completedSharedGoals.length > 0" class="text-center mb-6">
              <v-chip color="success" size="large" variant="tonal">
                <v-icon start>mdi-trophy</v-icon>
                {{ $t('yearReview.completedGoalsCount', { count: completedSharedGoals.length }) }}
              </v-chip>
            </div>

            <!-- No goals message -->
            <v-alert
              v-else-if="!isLoading && selectedTeamId"
              type="info"
              variant="tonal"
              class="mb-6"
            >
              {{ $t('yearReview.noCompletedGoals') }}
            </v-alert>

            <!-- Start button -->
            <v-btn
              block
              size="x-large"
              color="primary"
              :disabled="completedSharedGoals.length === 0"
              @click="startSlideshow"
            >
              <v-icon start>mdi-play</v-icon>
              {{ $t('yearReview.startSlideshow') }}
            </v-btn>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </DefaultLayout>

  <!-- Fullscreen Slideshow Mode -->
  <div v-else class="slideshow-fullscreen">
    <!-- Confetti container -->
    <div class="confetti-container">
      <div
        v-for="piece in confettiPieces"
        :key="piece.id"
        class="confetti-piece"
        :style="{
          left: `${piece.x}%`,
          backgroundColor: piece.color,
          animationDelay: `${piece.delay}s`,
          animationDuration: `${piece.duration}s`,
          transform: `rotate(${piece.rotation}deg)`,
          width: `${piece.size}px`,
          height: `${piece.size}px`
        }"
      />
    </div>

    <!-- Current Goal Slide -->
    <Transition name="slide-fade" mode="out-in">
      <GoalSlide
        v-if="currentGoal"
        :key="currentGoal.id"
        :goal="currentGoal"
      />
    </Transition>

    <!-- Controls overlay -->
    <div class="controls-overlay">
      <!-- Progress indicator -->
      <div class="progress-bar">
        <div
          class="progress-bar__fill"
          :style="{ width: `${((currentIndex + 1) / completedSharedGoals.length) * 100}%` }"
        />
      </div>

      <!-- Top controls -->
      <div class="top-controls">
        <span class="slide-counter">
          {{ $t('yearReview.slideOf', { current: currentIndex + 1, total: completedSharedGoals.length }) }}
        </span>
        <v-btn
          icon
          variant="text"
          color="white"
          @click="exitSlideshow"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <!-- Bottom controls -->
      <div class="bottom-controls">
        <v-btn
          icon
          variant="tonal"
          color="white"
          :disabled="currentIndex === 0"
          @click="prevSlide"
        >
          <v-icon>mdi-chevron-left</v-icon>
        </v-btn>

        <v-btn
          icon
          variant="tonal"
          color="white"
          @click="togglePlayPause"
        >
          <v-icon>{{ isPaused ? 'mdi-play' : 'mdi-pause' }}</v-icon>
        </v-btn>

        <v-btn
          icon
          variant="tonal"
          color="white"
          :disabled="currentIndex === completedSharedGoals.length - 1"
          @click="nextSlide"
        >
          <v-icon>mdi-chevron-right</v-icon>
        </v-btn>
      </div>

      <!-- Keyboard hint -->
      <div class="keyboard-hint">
        {{ $t('yearReview.pressEscToExit') }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import GoalSlide from '@/components/yearReview/GoalSlide.vue'
import { useTeams } from '@/composables/useTeams'
import { useGoals } from '@/composables/useGoals'
import { useConfetti } from '@/composables/useConfetti'
import { calculateProgress } from '@/composables/useProgress'

// State
const selectedTeamId = ref<string | undefined>(undefined)
const selectedYear = ref(new Date().getFullYear())
const isPlaying = ref(false)
const isPaused = ref(false)
const currentIndex = ref(0)
let autoAdvanceTimer: ReturnType<typeof setTimeout> | null = null

// Data
const { teams } = useTeams()
const { goals, isLoading } = useGoals(selectedTeamId, selectedYear)
const { pieces: confettiPieces, trigger: triggerConfetti } = useConfetti()

// Year options (current year and a few previous)
const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear()
  return [currentYear, currentYear - 1, currentYear - 2, currentYear - 3]
})

// Filter to celebration-worthy shared goals, sorted by completion date
// Includes: completed goals + weekly goals with 80%+ achievement
const WEEKLY_THRESHOLD = 80 // Percentage of weeks needed for weekly goals

const completedSharedGoals = computed(() => {
  const filtered = goals.value?.filter(g => {
    if (!g.is_shared) return false

    // Regular completed goals (single or milestone)
    if (g.is_completed) return true

    // Weekly goals with 80%+ achievement
    if (g.goal_type === 'weekly') {
      const progress = calculateProgress(g)
      return progress >= WEEKLY_THRESHOLD
    }

    return false
  }) || []

  // Sort by completion date, fallback to created_at for weekly goals
  return filtered.sort((a, b) => {
    const dateA = a.completed_at
      ? new Date(a.completed_at).getTime()
      : new Date(a.created_at).getTime()
    const dateB = b.completed_at
      ? new Date(b.completed_at).getTime()
      : new Date(b.created_at).getTime()
    return dateA - dateB
  })
})

const currentGoal = computed(() => completedSharedGoals.value[currentIndex.value])

// Auto-select first team
watch(
  teams,
  (newTeams) => {
    if (newTeams && newTeams.length > 0 && !selectedTeamId.value) {
      selectedTeamId.value = newTeams[0]?.id
    }
  },
  { immediate: true }
)

// Slideshow control functions
function startSlideshow() {
  if (completedSharedGoals.value.length === 0) return
  isPlaying.value = true
  isPaused.value = false
  currentIndex.value = 0
  startAutoAdvance()
  // Small delay before confetti so the slide is visible
  setTimeout(() => triggerConfetti(), 300)
}

function nextSlide() {
  if (currentIndex.value < completedSharedGoals.value.length - 1) {
    currentIndex.value++
    resetAutoAdvance()
    setTimeout(() => triggerConfetti(), 300)
  } else {
    // Last slide - exit after a moment
    clearAutoAdvance()
  }
}

function prevSlide() {
  if (currentIndex.value > 0) {
    currentIndex.value--
    resetAutoAdvance()
  }
}

function togglePlayPause() {
  isPaused.value = !isPaused.value
  if (isPaused.value) {
    clearAutoAdvance()
  } else {
    startAutoAdvance()
  }
}

function exitSlideshow() {
  isPlaying.value = false
  isPaused.value = false
  currentIndex.value = 0
  clearAutoAdvance()
}

function startAutoAdvance() {
  clearAutoAdvance()
  autoAdvanceTimer = setTimeout(() => {
    if (!isPaused.value && isPlaying.value) {
      if (currentIndex.value < completedSharedGoals.value.length - 1) {
        nextSlide()
      } else {
        // Auto-exit after last slide
        setTimeout(() => exitSlideshow(), 2000)
      }
    }
  }, 6000) // 6 seconds per slide
}

function resetAutoAdvance() {
  if (!isPaused.value) {
    startAutoAdvance()
  }
}

function clearAutoAdvance() {
  if (autoAdvanceTimer) {
    clearTimeout(autoAdvanceTimer)
    autoAdvanceTimer = null
  }
}

// Keyboard navigation
function handleKeydown(e: KeyboardEvent) {
  if (!isPlaying.value) return

  switch (e.key) {
    case 'ArrowRight':
    case ' ':
      e.preventDefault()
      nextSlide()
      break
    case 'ArrowLeft':
      e.preventDefault()
      prevSlide()
      break
    case 'Escape':
      e.preventDefault()
      exitSlideshow()
      break
    case 'p':
      e.preventDefault()
      togglePlayPause()
      break
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  clearAutoAdvance()
})
</script>

<style scoped>
.slideshow-fullscreen {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: #0f0f23;
}

/* Confetti */
.confetti-container {
  position: fixed;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 10000;
}

.confetti-piece {
  position: absolute;
  top: -20px;
  border-radius: 2px;
  animation: confetti-fall linear forwards;
}

@keyframes confetti-fall {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(720deg);
    opacity: 0;
  }
}

/* Controls overlay */
.controls-overlay {
  position: fixed;
  inset: 0;
  z-index: 10001;
  pointer-events: none;
}

.controls-overlay > * {
  pointer-events: auto;
}

/* Progress bar */
.progress-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
}

.progress-bar__fill {
  height: 100%;
  background: linear-gradient(90deg, #4ECDC4, #45B7D1);
  transition: width 0.5s ease;
}

/* Top controls */
.top-controls {
  position: absolute;
  top: 16px;
  left: 24px;
  right: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.slide-counter {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  font-weight: 500;
}

/* Bottom controls */
.bottom-controls {
  position: absolute;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 16px;
}

/* Keyboard hint */
.keyboard-hint {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(255, 255, 255, 0.4);
  font-size: 12px;
}

/* Slide transition */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.5s ease;
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateX(60px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(-60px);
}
</style>
