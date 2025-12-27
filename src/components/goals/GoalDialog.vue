<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="600"
    persistent
  >
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">{{ isEditing ? 'mdi-pencil' : 'mdi-plus' }}</v-icon>
        {{ isEditing ? 'Doel bewerken' : 'Nieuw doel' }}
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
            label="Titel"
            placeholder="Bijv. Mijn eerste marathon lopen"
            :rules="[rules.required]"
            prepend-inner-icon="mdi-flag"
            class="mb-2"
          />

          <!-- Description -->
          <v-textarea
            v-model="form.description"
            label="Beschrijving (optioneel)"
            placeholder="Voeg extra details toe..."
            rows="2"
            auto-grow
            prepend-inner-icon="mdi-text"
            class="mb-2"
          />

          <!-- Year -->
          <v-select
            v-model="form.year"
            label="Jaar"
            :items="yearOptions"
            prepend-inner-icon="mdi-calendar"
            class="mb-2"
          />

          <!-- Goal Type -->
          <v-select
            v-model="form.goal_type"
            label="Type doel"
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
            label="Aantal mijlpalen"
            type="number"
            min="1"
            max="100"
            :rules="[rules.required, rules.positiveNumber]"
            prepend-inner-icon="mdi-stairs"
            hint="Hoeveel stappen heeft dit doel?"
            class="mb-2"
          />

          <!-- Category -->
          <v-select
            v-model="form.category_id"
            label="Categorie"
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
            label="Delen met team"
            hint="Als dit aan staat, kunnen teamleden dit doel zien"
            persistent-hint
            color="primary"
            class="mb-4"
          />

          <!-- Optional Initial Image -->
          <div class="mt-4">
            <h4 class="text-subtitle-2 mb-2">Afbeelding toevoegen (optioneel)</h4>
            <v-file-input
              v-model="form.file"
              label="Kies een foto"
              prepend-icon="mdi-camera"
              accept="image/*"
              variant="outlined"
              density="compact"
              hint="Deze wordt als eerste bijlage toegevoegd"
              persistent-hint
            />
          </div>
        </v-form>
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="close">
          Annuleren
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :loading="isSubmitting"
          @click="handleSubmit"
        >
          {{ isEditing ? 'Opslaan' : 'Aanmaken' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed, inject } from 'vue'
import type { Goal, GoalFormData, Category } from '@/types/database'

const props = defineProps<{
  modelValue: boolean
  goal?: Goal | null
  teamId: string
  categories: Category[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'submit': [formData: GoalFormData & { team_id: string }]
}>()

const showSnackbar = inject<(msg: string, color?: string) => void>('showSnackbar')

const formRef = ref()
const isSubmitting = ref(false)

const isEditing = computed(() => !!props.goal)

const form = reactive<GoalFormData>({
  title: '',
  description: '',
  year: new Date().getFullYear() + 1,
  category_id: null,
  goal_type: 'single',
  target_count: null,
  is_shared: false,
  file: null
})

const yearOptions = computed(() => {
  const current = new Date().getFullYear()
  const years = []
  for (let i = 0; i <= 5; i++) {
    years.push(current + i)
  }
  return years
})

const goalTypes = [
  {
    value: 'single',
    label: 'Eenmalig',
    icon: 'mdi-flag-checkered',
    color: 'info',
    description: 'Een doel dat je één keer bereikt'
  },
  {
    value: 'weekly',
    label: 'Wekelijks',
    icon: 'mdi-calendar-week',
    color: 'warning',
    description: 'Track je voortgang per week (52 weken)'
  },
  {
    value: 'milestone',
    label: 'Mijlpalen',
    icon: 'mdi-stairs',
    color: 'secondary',
    description: 'Een doel met meerdere stappen'
  }
]

const rules = {
  required: (v: any) => !!v || 'Dit veld is verplicht',
  positiveNumber: (v: number) => v > 0 || 'Moet groter dan 0 zijn'
}

// Reset form when dialog opens
watch(() => props.modelValue, (open) => {
  if (open) {
    if (props.goal) {
      // Editing - populate form
      form.title = props.goal.title
      form.description = props.goal.description || ''
      form.year = props.goal.year
      form.category_id = props.goal.category_id
      form.goal_type = props.goal.goal_type
      form.target_count = props.goal.target_count
      form.is_shared = props.goal.is_shared
      form.file = null
    } else {
      // New goal - reset form
      form.title = ''
      form.description = ''
      form.year = new Date().getFullYear() + 1
      form.category_id = null
      form.goal_type = 'single'
      form.target_count = null
      form.is_shared = false
      form.file = null
    }
  }
})

function close() {
  emit('update:modelValue', false)
}

async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) return

  isSubmitting.value = true
  try {
    emit('submit', {
      ...form,
      team_id: props.teamId
    })
    close()
  } catch (error: any) {
    showSnackbar?.(error.message || 'Er is een fout opgetreden', 'error')
  } finally {
    isSubmitting.value = false
  }
}
</script>
