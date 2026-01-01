<template>
  <DefaultLayout>
    <v-container fluid class="pa-4">
      <!-- Back button -->
      <v-btn
        :to="{ name: 'feedback' }"
        prepend-icon="mdi-arrow-left"
        variant="text"
        class="mb-4"
      >
        {{ $t("common.back") }}
      </v-btn>

      <!-- Loading -->
      <div v-if="isLoading" class="d-flex justify-center pa-8">
        <v-progress-circular indeterminate color="primary" />
      </div>

      <!-- Error -->
      <v-alert v-else-if="isError" type="error" variant="tonal">
        {{ error?.message || $t("common.error") }}
      </v-alert>

      <!-- Feedback detail -->
      <div v-else-if="feedback">
        <!-- Header card -->
        <v-card class="mb-4">
          <v-card-title class="d-flex align-center gap-2">
            <v-icon :color="feedback.type === 'bug' ? 'error' : 'secondary'" size="large">
              {{ feedback.type === "bug" ? "mdi-bug" : "mdi-lightbulb" }}
            </v-icon>
            <span>{{ feedback.title }}</span>
          </v-card-title>

          <v-card-subtitle class="mt-2">
            <div class="d-flex align-center gap-2 flex-wrap">
              <!-- Type badge -->
              <v-chip size="small" :color="feedback.type === 'bug' ? 'error' : 'secondary'" variant="tonal">
                {{ $t(`feedback.types.${feedback.type}`) }}
              </v-chip>

              <!-- Status badge -->
              <v-chip :color="getStatusColor(feedback.status)" size="small" variant="tonal">
                {{ $t(`feedback.status.${feedback.status}`) }}
              </v-chip>

              <!-- Priority chip -->
              <v-chip :color="getPriorityColor(feedback.priority)" size="small" variant="outlined">
                <v-icon start size="small">mdi-flag</v-icon>
                {{ $t(`feedback.priority.${feedback.priority}`) }}
              </v-chip>

              <v-spacer />

              <!-- Timestamps -->
              <span class="text-caption text-medium-emphasis">
                {{ $t("feedback.detail.reportedOn", { date: formatDate(feedback.created_at) }) }}
              </span>
            </div>
          </v-card-subtitle>

          <v-divider class="my-3" />

          <v-card-text>
            <!-- Description -->
            <div class="mb-4">
              <h3 class="text-subtitle-1 font-weight-bold mb-2">
                {{ $t("feedback.form.description") }}
              </h3>
              <p class="text-body-1" style="white-space: pre-wrap">{{ feedback.description }}</p>
            </div>

            <!-- Metadata (collapsible) -->
            <v-expansion-panels variant="accordion">
              <v-expansion-panel>
                <v-expansion-panel-title>
                  <v-icon start>mdi-information-outline</v-icon>
                  {{ $t("feedback.detail.metadata") }}
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-list density="compact">
                    <v-list-item v-if="feedback.current_url">
                      <template #prepend>
                        <v-icon>mdi-link</v-icon>
                      </template>
                      <v-list-item-title class="text-caption">{{ $t("feedback.form.currentUrl") }}</v-list-item-title>
                      <v-list-item-subtitle>
                        <a :href="feedback.current_url" target="_blank" class="text-primary">
                          {{ feedback.current_url }}
                        </a>
                      </v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item v-if="feedback.browser_info">
                      <template #prepend>
                        <v-icon>mdi-information</v-icon>
                      </template>
                      <v-list-item-title class="text-caption">{{ $t("feedback.form.browserInfo") }}</v-list-item-title>
                      <v-list-item-subtitle class="text-caption">
                        <pre class="text-caption">{{ formatBrowserInfo(feedback.browser_info) }}</pre>
                      </v-list-item-subtitle>
                    </v-list-item>
                  </v-list>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-card-text>
        </v-card>

        <!-- Comments section -->
        <v-card>
          <v-card-title>
            <v-icon start>mdi-comment-multiple</v-icon>
            {{ $t("feedback.detail.comments") }}
            <v-chip size="small" class="ml-2">{{ comments?.length || 0 }}</v-chip>
          </v-card-title>

          <v-divider />

          <v-card-text>
            <!-- Comments list -->
            <div v-if="isLoadingComments" class="d-flex justify-center pa-4">
              <v-progress-circular indeterminate color="primary" size="small" />
            </div>

            <div v-else-if="!comments || comments.length === 0" class="text-center pa-4 text-medium-emphasis">
              {{ $t("feedback.detail.noComments") }}
            </div>

            <div v-else class="comments-list">
              <div
                v-for="comment in comments"
                :key="comment.id"
                class="comment-item mb-4"
              >
                <div class="d-flex align-start gap-3">
                  <!-- Avatar -->
                  <v-avatar size="40" color="primary">
                    <v-img v-if="comment.profile?.avatar_url" :src="comment.profile.avatar_url" />
                    <span v-else class="text-white">
                      {{ comment.profile?.display_name?.charAt(0)?.toUpperCase() || '?' }}
                    </span>
                  </v-avatar>

                  <!-- Comment content -->
                  <div class="flex-grow-1">
                    <div class="d-flex align-center gap-2 mb-1">
                      <span class="font-weight-bold">{{ comment.profile?.display_name || 'Unknown' }}</span>
                      <v-chip v-if="comment.is_admin_comment" size="x-small" color="primary" variant="tonal">
                        Admin
                      </v-chip>
                      <span class="text-caption text-medium-emphasis">
                        {{ formatDate(comment.created_at) }}
                      </span>
                    </div>
                    <p class="text-body-2" style="white-space: pre-wrap">{{ comment.comment }}</p>
                  </div>
                </div>
                <v-divider v-if="comment !== comments[comments.length - 1]" class="mt-4" />
              </div>
            </div>

            <!-- Add comment form -->
            <v-divider class="my-4" />
            <div>
              <h3 class="text-subtitle-2 mb-3">{{ $t("feedback.detail.addComment") }}</h3>
              <v-form @submit.prevent="handleAddComment">
                <v-textarea
                  v-model="newComment"
                  :placeholder="$t('feedback.detail.commentPlaceholder')"
                  variant="outlined"
                  rows="3"
                  auto-grow
                  :disabled="isAddingComment"
                />
                <div class="d-flex justify-end mt-2">
                  <v-btn
                    type="submit"
                    color="primary"
                    :loading="isAddingComment"
                    :disabled="!newComment.trim()"
                  >
                    {{ $t("common.submit") }}
                  </v-btn>
                </div>
              </v-form>
            </div>
          </v-card-text>
        </v-card>
      </div>
    </v-container>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { ref, inject } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import { useFeedbackDetail } from "@/composables/useFeedback";
import { useFeedbackComments } from "@/composables/useFeedbackComments";
import type { FeedbackStatus } from "@/types/database";

const route = useRoute();
const { t, d } = useI18n();
const feedbackId = route.params.id as string;

const showSnackbar = inject<(msg: string, color?: string) => void>("showSnackbar");

// Feedback detail
const { feedback, isLoading, isError, error } = useFeedbackDetail(feedbackId);

// Comments
const {
  comments,
  isLoading: isLoadingComments,
  addComment,
  isAdding: isAddingComment,
} = useFeedbackComments(feedbackId);

const newComment = ref("");

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
  return d(date, "long");
}

function formatBrowserInfo(info: string): string {
  try {
    const parsed = JSON.parse(info);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return info;
  }
}

async function handleAddComment() {
  if (!newComment.value.trim()) return;

  try {
    await addComment(newComment.value.trim());
    showSnackbar?.(t("feedback.messages.commentAdded"), "success");
    newComment.value = "";
  } catch (error: any) {
    showSnackbar?.(error.message || t("common.error"), "error");
  }
}
</script>

<style scoped>
.comments-list {
  max-width: 100%;
}

.comment-item {
  position: relative;
}

pre {
  font-family: monospace;
  font-size: 0.75rem;
  overflow-x: auto;
}
</style>
