<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="500"
  >
    <v-card>
      <v-card-title>Bijlage toevoegen</v-card-title>

      <v-card-text>
        <!-- Type tabs -->
        <v-tabs v-model="selectedType" grow class="mb-4">
          <v-tab value="url">
            <v-icon start>mdi-link</v-icon>
            Link
          </v-tab>
          <v-tab value="image">
            <v-icon start>mdi-image</v-icon>
            Afbeelding
          </v-tab>
          <v-tab value="note">
            <v-icon start>mdi-note-text</v-icon>
            Notitie
          </v-tab>
        </v-tabs>

        <v-form ref="formRef">
          <!-- Title (optional) -->
          <v-text-field
            v-model="form.title"
            label="Titel (optioneel)"
            variant="outlined"
            density="compact"
            class="mb-3"
            placeholder="Bijv. Foto van de overwinning"
          />

          <!-- Image toggle: URL or File -->
          <v-radio-group
            v-if="selectedType === 'image'"
            v-model="imageSource"
            inline
            density="compact"
            class="mb-2"
          >
            <v-radio label="URL" value="url" />
            <v-radio label="Uploaden" value="file" />
          </v-radio-group>

          <!-- URL input -->
          <v-text-field
            v-if="selectedType === 'url' || (selectedType === 'image' && imageSource === 'url')"
            v-model="form.url"
            :label="selectedType === 'image' ? 'Afbeelding URL' : 'URL'"
            :placeholder="selectedType === 'image' ? 'https://example.com/image.jpg' : 'https://...'"
            :rules="[rules.required, rules.url]"
            variant="outlined"
            density="compact"
            prepend-inner-icon="mdi-link"
          />

          <!-- File upload -->
          <v-file-input
            v-if="selectedType === 'image' && imageSource === 'file'"
            v-model="form.file"
            label="Kies afbeelding"
            variant="outlined"
            density="compact"
            prepend-icon="mdi-camera"
            accept="image/*"
            :rules="[rules.requiredFile]"
          />

          <!-- Note input -->
          <v-textarea
            v-if="selectedType === 'note'"
            v-model="form.content"
            label="Notitie"
            placeholder="Schrijf je gedachten, herinneringen of notities..."
            :rules="[rules.required]"
            variant="outlined"
            rows="4"
            auto-grow
          />
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="close">Annuleren</v-btn>
        <v-btn color="primary" variant="flat" @click="handleSubmit">
          Toevoegen
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import type { AttachmentType } from '@/types/database'

const props = defineProps<{
  modelValue: boolean
  goalId: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [data: { type: AttachmentType; title: string; url?: string; content?: string; file?: File }]
}>()

const formRef = ref()
const selectedType = ref<AttachmentType>('url')
const imageSource = ref<'url' | 'file'>('file')

const form = reactive({
  title: '',
  url: '',
  content: '',
  file: null as File | null
})

const rules = {
  required: (v: string) => !!v || 'Dit veld is verplicht',
  requiredFile: (v: any) => !!v || 'Selecteer een bestand',
  url: (v: string) => {
    if (!v) return true
    try {
      new URL(v)
      return true
    } catch {
      return 'Ongeldige URL'
    }
  }
}

// Reset form when dialog opens
watch(() => props.modelValue, (open) => {
  if (open) {
    form.title = ''
    form.url = ''
    form.content = ''
    form.file = null
    selectedType.value = 'url'
    imageSource.value = 'file'
  }
})

function close() {
  emit('update:modelValue', false)
}

async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) return

  emit('submit', {
    type: selectedType.value,
    title: form.title,
    url: selectedType.value === 'url' || (selectedType.value === 'image' && imageSource.value === 'url') ? form.url : undefined,
    content: selectedType.value === 'note' ? form.content : undefined,
    file: selectedType.value === 'image' && imageSource.value === 'file' ? form.file || undefined : undefined
  })

  close()
}
</script>
