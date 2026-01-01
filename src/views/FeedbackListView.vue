<template>
  <DefaultLayout>
    <v-container fluid class="pa-4">
      <!-- Header -->
      <div class="feedback-header mb-6">
        <div class="d-flex align-center justify-space-between flex-wrap gap-4">
          <div>
            <h1 class="text-h4 font-weight-bold">{{ $t("feedback.myFeedback") }}</h1>
            <p class="text-body-2 text-medium-emphasis">
              {{ $t("feedback.subtitle") }}
            </p>
          </div>

          <div class="d-flex align-center gap-2">
            <!-- Type filter -->
            <v-btn-toggle
              v-model="typeFilter"
              color="primary"
              variant="outlined"
              density="compact"
              divided
            >
              <v-btn value="all" size="small">
                {{ $t("feedback.filters.all") }}
              </v-btn>
              <v-btn value="bug" size="small">
                <v-icon start size="small">mdi-bug</v-icon>
                {{ $t("feedback.filters.bugs") }}
              </v-btn>
              <v-btn value="feature" size="small">
                <v-icon start size="small">mdi-lightbulb</v-icon>
                {{ $t("feedback.filters.features") }}
              </v-btn>
            </v-btn-toggle>

            <!-- Status filter -->
            <v-select
              v-model="statusFilter"
              :items="statusFilterOptions"
              item-title="label"
              item-value="value"
              density="compact"
              variant="outlined"
              hide-details
              style="min-width: 150px"
            >
              <template #prepend-inner>
                <v-icon>mdi-filter</v-icon>
              </template>
            </v-select>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="d-flex justify-center pa-8">
        <v-progress-circular indeterminate color="primary" />
      </div>

      <!-- Empty state -->
      <div
        v-else-if="!filteredFeedback || filteredFeedback.length === 0"
        class="text-center pa-8"
      >
        <v-icon size="64" color="grey-lighten-1" class="mb-4">
          mdi-message-alert-outline
        </v-icon>
        <h3 class="text-h6 mb-2">{{ $t("feedback.messages.noFeedback") }}</h3>
        <p class="text-body-2 text-medium-emphasis">
          {{ $t("feedback.messages.noFeedbackDescription") }}
        </p>
      </div>

      <!-- Feedback list -->
      <v-row v-else>
        <v-col
          v-for="feedback in filteredFeedback"
          :key="feedback.id"
          cols="12"
          md="6"
          lg="4"
        >
          <v-card
            class="feedback-card"
            :ripple="false"
            hover
            @click="$router.push({ name: 'feedback-detail', params: { id: feedback.id } })"
          >
            <v-card-title class="d-flex align-center gap-2">
              <v-icon :color="feedback.type === 'bug' ? 'error' : 'secondary'">
                {{ feedback.type === "bug" ? "mdi-bug" : "mdi-lightbulb" }}
              </v-icon>
              <span class="text-truncate">{{ feedback.title }}</span>
            </v-card-title>

            <v-card-subtitle class="mt-1">
              {{ formatDate(feedback.created_at) }}
            </v-card-subtitle>

            <v-card-text>
              <p class="text-body-2 text-truncate-3-lines mb-3">
                {{ feedback.description }}
              </p>

              <div class="d-flex align-center gap-2 flex-wrap">
                <!-- Status badge -->
                <v-chip
                  :color="getStatusColor(feedback.status)"
                  size="small"
                  variant="tonal"
                >
                  {{ $t(`feedback.status.${feedback.status}`) }}
                </v-chip>

                <!-- Priority chip -->
                <v-chip
                  :color="getPriorityColor(feedback.priority)"
                  size="small"
                  variant="outlined"
                >
                  <v-icon start size="small">mdi-flag</v-icon>
                  {{ $t(`feedback.priority.${feedback.priority}`) }}
                </v-chip>

                <v-spacer />

                <!-- Comments count -->
                <v-chip size="small" variant="text">
                  <v-icon start size="small">mdi-comment</v-icon>
                  {{ feedback.comments_count || 0 }}
                </v-chip>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import { useFeedback } from "@/composables/useFeedback";
import type { FeedbackType, FeedbackStatus } from "@/types/database";

const { t, d } = useI18n();
const { feedbackList, isLoading } = useFeedback();

const typeFilter = ref<FeedbackType | "all">("all");
const statusFilter = ref<FeedbackStatus | "all">("all");

const statusFilterOptions = computed(() => [
  { label: t("feedback.filters.all"), value: "all" },
  { label: t("feedback.status.open"), value: "open" },
  { label: t("feedback.status.in_progress"), value: "in_progress" },
  { label: t("feedback.status.resolved"), value: "resolved" },
  { label: t("feedback.status.closed"), value: "closed" },
]);

const filteredFeedback = computed(() => {
  if (!feedbackList.value) return [];

  return feedbackList.value.filter((feedback) => {
    const matchesType = typeFilter.value === "all" || feedback.type === typeFilter.value;
    const matchesStatus = statusFilter.value === "all" || feedback.status === statusFilter.value;
    return matchesType && matchesStatus;
  });
});

function getStatusColor(status: FeedbackStatus): string {
  const colors = {
    open: "primary",
    in_progress: "warning",
    resolved: "success",
    closed: "grey",
  };
  return colors[status] || "grey";
}

function getPriorityColor(priority: string): string {
  const colors = {
    low: "grey",
    medium: "primary",
    high: "warning",
    critical: "error",
  };
  return colors[priority as keyof typeof colors] || "grey";
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return d(date, "short");
}
</script>

<style scoped>
.feedback-card {
  cursor: pointer;
  transition: all 0.2s ease;
}

.feedback-card:hover {
  transform: translateY(-2px);
}

.text-truncate-3-lines {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
