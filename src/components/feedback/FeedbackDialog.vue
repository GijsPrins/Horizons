<template>
  <v-dialog v-model="isOpen" max-width="600" persistent>
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">{{
          selectedType === "bug" ? "mdi-bug" : "mdi-lightbulb"
        }}</v-icon>
        {{ $t(`feedback.${selectedType}Report`) }}
        <v-spacer />
        <v-btn icon variant="text" @click="close">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-divider />

      <v-card-text>
        <!-- Type tabs -->
        <v-tabs v-model="selectedType" grow class="mb-4">
          <v-tab value="bug">
            <v-icon start>mdi-bug</v-icon>
            {{ $t("feedback.types.bug") }}
          </v-tab>
          <v-tab value="feature">
            <v-icon start>mdi-lightbulb</v-icon>
            {{ $t("feedback.types.feature") }}
          </v-tab>
        </v-tabs>

        <v-form ref="formRef">
          <!-- Title (required) -->
          <v-text-field
            v-model="form.title"
            :label="$t('feedback.form.title') + ' *'"
            :placeholder="$t('feedback.form.titlePlaceholder')"
            :rules="[rules.required, rules.maxLength]"
            :counter="100"
            variant="outlined"
            density="compact"
            class="mb-3"
            prepend-inner-icon="mdi-format-title"
            autofocus
          />

          <!-- Description (required) -->
          <v-textarea
            v-model="form.description"
            :label="$t('feedback.form.description') + ' *'"
            :placeholder="$t('feedback.form.descriptionPlaceholder')"
            :rules="[rules.required, rules.minLength]"
            :counter="20"
            variant="outlined"
            rows="4"
            auto-grow
            class="mb-3"
            prepend-inner-icon="mdi-text"
          />

          <!-- Priority (required) -->
          <v-select
            v-model="form.priority"
            :label="$t('feedback.form.priority') + ' *'"
            :items="priorityOptions"
            item-title="label"
            item-value="value"
            variant="outlined"
            density="compact"
            class="mb-3"
            prepend-inner-icon="mdi-flag"
          />

          <!-- Use case (for features only, optional) -->
          <v-textarea
            v-if="selectedType === 'feature'"
            v-model="form.use_case"
            :label="
              $t('feedback.form.useCase') +
              ' (' +
              $t('common.optional') +
              ')'
            "
            :placeholder="$t('feedback.form.useCasePlaceholder')"
            variant="outlined"
            rows="3"
            auto-grow
            class="mb-3"
            prepend-inner-icon="mdi-lightbulb-question"
          />

          <!-- Current URL (auto-filled, readonly) -->
          <v-text-field
            :model-value="currentUrl"
            :label="$t('feedback.form.currentUrl')"
            variant="outlined"
            density="compact"
            readonly
            class="mb-3"
            prepend-inner-icon="mdi-link"
          />

          <!-- Screenshot placeholder (Phase 2) -->
          <v-alert
            v-if="selectedType === 'bug'"
            type="info"
            variant="tonal"
            density="compact"
            class="mb-3"
          >
            {{ $t("feedback.messages.screenshotComingSoon") }}
          </v-alert>
        </v-form>
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="close">
          {{ $t("common.cancel") }}
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :loading="isSubmitting"
          @click="handleSubmit"
        >
          {{ $t("common.submit") }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed, inject } from "vue";
import { useI18n } from "vue-i18n";
import type { FeedbackType, FeedbackPriority } from "@/types/database";

const isOpen = defineModel<boolean>({ required: true });

const props = defineProps<{
  initialType?: FeedbackType;
}>();

const emit = defineEmits<{
  submit: [
    formData: {
      type: FeedbackType;
      title: string;
      description: string;
      priority: FeedbackPriority;
      use_case?: string;
    },
  ];
}>();

const { t } = useI18n();
const formRef = ref();
const isSubmitting = ref(false);
const selectedType = ref<FeedbackType>(props.initialType || "bug");

const currentUrl = computed(() => window.location.href);

const showSnackbar =
  inject<(msg: string, color?: string) => void>("showSnackbar");

// Form data
const form = reactive({
  title: "",
  description: "",
  priority: "medium" as FeedbackPriority,
  use_case: "",
});

// Priority options
const priorityOptions = computed(() => [
  {
    label: t("feedback.priority.low"),
    value: "low" as FeedbackPriority,
  },
  {
    label: t("feedback.priority.medium"),
    value: "medium" as FeedbackPriority,
  },
  {
    label: t("feedback.priority.high"),
    value: "high" as FeedbackPriority,
  },
  {
    label: t("feedback.priority.critical"),
    value: "critical" as FeedbackPriority,
  },
]);

// Validation rules
const rules = {
  required: (v: string) => !!v || t("common.required"),
  minLength: (v: string) =>
    (v && v.length >= 20) || t("common.minLength", { count: 20 }),
  maxLength: (v: string) =>
    !v || v.length <= 100 || t("common.maxLength", { count: 100 }),
};

// Watch for dialog open/close
watch(isOpen, (open) => {
  if (open) {
    // Reset form when opening
    form.title = "";
    form.description = "";
    form.priority = selectedType.value === "bug" ? "medium" : "low";
    form.use_case = "";
    selectedType.value = props.initialType || "bug";
    formRef.value?.resetValidation();
  } else {
    // Cleanup when closing
    isSubmitting.value = false;
  }
});

function close() {
  isOpen.value = false;
}

async function handleSubmit() {
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  isSubmitting.value = true;

  try {
    emit("submit", {
      type: selectedType.value,
      title: form.title,
      description: form.description,
      priority: form.priority,
      use_case: form.use_case || undefined,
    });
  } catch (error) {
    isSubmitting.value = false;
    // Error handled by parent
  }
}
</script>
