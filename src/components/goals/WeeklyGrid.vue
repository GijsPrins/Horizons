<template>
  <div class="weekly-grid">
    <!-- Month labels -->
    <div class="weekly-grid__months">
      <span v-for="month in months" :key="month" class="weekly-grid__month">
        {{ month }}
      </span>
    </div>

    <!-- Week boxes -->
    <div class="weekly-grid__weeks">
      <v-tooltip
        v-for="week in 52"
        :key="week"
        :text="getWeekTooltip(week)"
        :disabled="mobile"
        location="top"
      >
        <template #activator="{ props }">
          <div
            v-bind="props"
            class="weekly-grid__week"
            :class="{
              'weekly-grid__week--achieved': isWeekAchieved(week),
              'weekly-grid__week--missed':
                !isWeekAchieved(week) && week < effectiveCurrentWeek,
              'weekly-grid__week--current': week === effectiveCurrentWeek,
              'weekly-grid__week--future': week > effectiveCurrentWeek,
              'weekly-grid__week--clickable':
                !readonly && week <= effectiveCurrentWeek,
            }"
            @click="handleClick(week)"
          >
            <v-icon v-if="isWeekAchieved(week)" size="12" color="white">
              mdi-check
            </v-icon>
            <v-icon
              v-else-if="week < effectiveCurrentWeek"
              size="12"
              color="error"
            >
              mdi-close
            </v-icon>
          </div>
        </template>
      </v-tooltip>
    </div>

    <!-- Legend -->
    <div class="weekly-grid__legend mt-3">
      <div class="weekly-grid__legend-item">
        <div
          class="weekly-grid__week weekly-grid__week--achieved"
          style="width: 16px; height: 16px"
        />
        <span class="text-caption ml-1">{{ $t("progress.achieved") }}</span>
      </div>
      <div class="weekly-grid__legend-item">
        <div
          class="weekly-grid__week weekly-grid__week--missed"
          style="width: 16px; height: 16px"
        />
        <span class="text-caption ml-1">{{ $t("progress.missed") }}</span>
      </div>
      <div class="weekly-grid__legend-item">
        <div class="weekly-grid__week" style="width: 16px; height: 16px" />
        <span class="text-caption ml-1">{{ $t("progress.future") }}</span>
      </div>
      <div class="weekly-grid__legend-item">
        <div
          class="weekly-grid__week weekly-grid__week--current"
          style="width: 16px; height: 16px"
        />
        <span class="text-caption ml-1">{{ $t("progress.thisWeek") }}</span>
      </div>
    </div>

    <!-- Stats -->
    <div class="mt-3 text-body-2">
      {{
        $t("progress.weeksAchievedStats", {
          achieved: achievedCount,
          total: 52,
          percentage: Math.round((achievedCount / 52) * 100),
        })
      }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useDisplay } from "vuetify";
import type { GoalWithRelations } from "@/types/database";
import { getCurrentWeekNumber } from "@/composables/useProgress";

const props = defineProps<{
  goal: GoalWithRelations;
  readonly?: boolean;
}>();

const emit = defineEmits<{
  toggle: [weekNumber: number, achieved: boolean];
}>();

const { t } = useI18n();
const { mobile } = useDisplay();

const months = [
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

// Calculate current week relative to the goal's year
const effectiveCurrentWeek = computed(() => {
  const now = new Date();
  const thisYear = now.getFullYear();

  if (props.goal.year < thisYear) return 53; // Everything is in the past
  if (props.goal.year > thisYear) return 0; // Everything is in the future

  return getCurrentWeekNumber();
});

const achievedWeeks = computed(() => {
  const achieved = new Set<number>();
  props.goal.progress_entries?.forEach((entry) => {
    if (entry.achieved && entry.week_number) {
      achieved.add(entry.week_number);
    }
  });
  return achieved;
});

const achievedCount = computed(() => achievedWeeks.value.size);

function isWeekAchieved(week: number): boolean {
  return achievedWeeks.value.has(week);
}

function getWeekTooltip(week: number): string {
  const label = t("progress.week");
  if (isWeekAchieved(week))
    return `${label} ${week}: ✓ ${t("progress.achieved")}`;
  if (week < effectiveCurrentWeek.value)
    return `${label} ${week}: ✗ ${t("progress.missed")}`;
  if (week === effectiveCurrentWeek.value)
    return `${label} ${week}: ${t("celebration.inProgress")}`;
  return `${label} ${week}: ${t("progress.future")}`;
}

function handleClick(week: number) {
  if (props.readonly || week > effectiveCurrentWeek.value) return;
  emit("toggle", week, !isWeekAchieved(week));
}
</script>

<style scoped>
.weekly-grid__months {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.weekly-grid__month {
  font-size: 10px;
  color: rgba(var(--v-theme-on-surface), 0.6);
  width: calc(100% / 12);
  text-align: center;
}

.weekly-grid__weeks {
  display: grid;
  grid-template-rows: repeat(4, 1fr);
  grid-auto-flow: column;
  gap: 4px;
}

.weekly-grid__week {
  aspect-ratio: 1;
  border-radius: 4px;
  background: rgba(var(--v-theme-on-surface), 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  position: relative;
  touch-action: manipulation;
}

.weekly-grid__week--achieved {
  background: rgb(var(--v-theme-success)) !important;
  opacity: 1 !important;
}

.weekly-grid__week--missed {
  background: rgba(var(--v-theme-error), 0.2);
  border: 1px dashed rgb(var(--v-theme-error));
}

.weekly-grid__week--current {
  border: 2px solid rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.05);
}

.weekly-grid__week--future {
  opacity: 0.3;
}

.weekly-grid__week--clickable {
  cursor: pointer;
}

.weekly-grid__week--clickable:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  z-index: 1;
}

.weekly-grid__legend {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.weekly-grid__legend-item {
  display: flex;
  align-items: center;
}
</style>
