<template>
  <v-dialog v-model="isOpen" max-width="600" persistent>
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">{{
          isEditing ? "mdi-pencil" : "mdi-plus"
        }}</v-icon>
        {{ isEditing ? $t("goals.editGoal") : $t("goals.addGoal") }}
        <v-spacer />
        <v-btn icon variant="text" @click="close">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-divider />

      <v-card-text>
        <v-form ref="formRef" @submit.prevent="handleSubmit">
          <!-- Title -->
          <v-text-field
            v-model="form.title"
            :label="$t('goals.goalTitle')"
            :placeholder="$t('goals.titlePlaceholder')"
            :rules="[rules.required]"
            prepend-inner-icon="mdi-flag"
            class="mb-2"
          />

          <!-- Description -->
          <v-textarea
            v-model="form.description"
            :label="$t('goals.goalDescription')"
            :placeholder="$t('goals.descriptionPlaceholder')"
            rows="2"
            auto-grow
            prepend-inner-icon="mdi-text"
            class="mb-2"
          />

          <!-- Year -->
          <v-select
            v-model="form.year"
            :label="$t('goals.goalYear')"
            :items="yearOptions"
            prepend-inner-icon="mdi-calendar"
            class="mb-2"
          />

          <!-- Goal Type -->
          <v-select
            v-model="form.goal_type"
            :label="$t('goals.goalType')"
            :items="goalTypes"
            item-title="label"
            item-value="value"
            prepend-inner-icon="mdi-shape"
            class="mb-2"
          >
            <template #item="{ item, props }">
              <v-list-item v-bind="props">
                <template #prepend>
                  <v-icon :color="item.raw.color">{{ item.raw.icon }}</v-icon>
                </template>
                <template #subtitle>
                  {{ item.raw.description }}
                </template>
              </v-list-item>
            </template>
          </v-select>

          <!-- Target count for milestone goals -->
          <v-text-field
            v-if="form.goal_type === 'milestone'"
            v-model.number="form.target_count"
            :label="$t('progress.targetCount')"
            type="number"
            min="1"
            max="100"
            :rules="[rules.required, rules.positiveNumber]"
            prepend-inner-icon="mdi-stairs"
            :hint="$t('goals.stepsHint')"
            class="mb-2"
          />

          <!-- Category -->
          <v-select
            v-model="form.category_id"
            :label="$t('goals.goalCategory')"
            :items="categories"
            item-title="name"
            item-value="id"
            prepend-inner-icon="mdi-tag"
            clearable
            class="mb-2"
          >
            <template #item="{ item, props }">
              <v-list-item v-bind="props">
                <template #prepend>
                  <v-icon :color="item.raw.color">{{ item.raw.icon }}</v-icon>
                </template>
              </v-list-item>
            </template>
            <template #selection="{ item }">
              <v-chip size="small" :color="item.raw.color">
                <v-icon start size="16">{{ item.raw.icon }}</v-icon>
                {{ item.title }}
              </v-chip>
            </template>
          </v-select>

          <!-- Share with team -->
          <v-switch
            v-model="form.is_shared"
            :label="$t('goals.isShared')"
            :hint="$t('goals.sharedHint')"
            persistent-hint
            color="primary"
            class="mb-4"
          />

          <!-- Deadline -->
          <v-text-field
            v-model="form.deadline_date"
            :label="$t('goals.deadline')"
            type="date"
            prepend-inner-icon="mdi-calendar-alert"
            clearable
            class="mb-4"
            :hint="$t('goals.deadlineHint')"
            persistent-hint
          />

          <!-- Optional Initial Image -->
          <div class="mt-4">
            <h4 class="text-subtitle-2 mb-2">
              {{ $t("attachments.addImage") }}
            </h4>
            <v-file-input
              v-model="form.file"
              :label="$t('attachments.choosePhoto')"
              prepend-icon="mdi-camera"
              accept="image/*"
              variant="outlined"
              density="compact"
              :hint="$t('attachments.firstImageHint')"
              persistent-hint
            />
          </div>
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
          :loading="loading"
          @click="handleSubmit"
        >
          {{ isEditing ? $t("common.save") : $t("common.create") }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed, inject } from "vue";
import { useI18n } from "vue-i18n";
import type { Goal, GoalFormData, Category } from "@/types/database";

const isOpen = defineModel<boolean>({ required: true });

const props = defineProps<{
  goal?: Goal | null;
  teamId: string;
  categories: Category[];
  loading?: boolean;
}>();

const emit = defineEmits<{
  submit: [formData: GoalFormData & { team_id: string }];
}>();

inject<(msg: string, color?: string) => void>("showSnackbar");
const { t } = useI18n();

const formRef = ref();

const isEditing = computed(() => !!props.goal);

const form = reactive<GoalFormData>({
  title: "",
  description: "",
  year: new Date().getFullYear() + 1,
  category_id: null,
  goal_type: "single",
  target_count: null,
  is_shared: false,
  deadline_date: null,
  file: null,
});

const yearOptions = computed(() => {
  const current = new Date().getFullYear();
  const years = [];
  for (let i = 0; i <= 5; i++) {
    years.push(current + i);
  }
  return years;
});

const goalTypes = computed(() => [
  {
    value: "single",
    label: t("goals.types.single"),
    icon: "mdi-flag-checkered",
    color: "info",
    description: t("goals.typeDescriptions.single"),
  },
  {
    value: "weekly",
    label: t("goals.types.weekly"),
    icon: "mdi-calendar-week",
    color: "warning",
    description: t("goals.typeDescriptions.weekly"),
  },
  {
    value: "milestone",
    label: t("goals.types.milestone"),
    icon: "mdi-stairs",
    color: "secondary",
    description: t("goals.typeDescriptions.milestone"),
  },
]);

const rules = {
  required: (v: any) => !!v || t("common.required"),
  positiveNumber: (v: number) => v > 0 || t("common.positiveNumber"),
};

// Reset form when dialog opens
watch(isOpen, (open) => {
  if (open) {
    if (props.goal) {
      // Editing - populate form
      form.title = props.goal.title;
      form.description = props.goal.description || "";
      form.year = props.goal.year;
      form.category_id = props.goal.category_id;
      form.goal_type = props.goal.goal_type;
      form.target_count = props.goal.target_count;
      form.is_shared = props.goal.is_shared;
      form.deadline_date = props.goal.deadline_date;
      form.file = null;
    } else {
      // New goal - reset form
      form.title = "";
      form.description = "";
      form.year = new Date().getFullYear() + 1;
      form.category_id = null;
      form.goal_type = "single";
      form.target_count = null;
      form.is_shared = false;
      form.deadline_date = null;
      form.file = null;
    }
  }
});

function close() {
  isOpen.value = false;
}

async function handleSubmit() {
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  emit("submit", {
    ...form,
    team_id: props.teamId,
  });
  // Note: Dialog will be closed by parent after successful submission
}
</script>
