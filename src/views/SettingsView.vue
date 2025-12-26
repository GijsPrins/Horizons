<template>
  <DefaultLayout>
    <v-container fluid class="pa-4">
      <h1 class="text-h4 font-weight-bold mb-4">Instellingen</h1>

      <v-row>
        <v-col cols="12" md="6">
          <!-- Profile settings -->
          <v-card elevation="0" border class="mb-4">
            <v-card-title>
              <v-icon start>mdi-account</v-icon>
              Profiel
            </v-card-title>
            <v-card-text>
              <v-form ref="formRef">
                <v-text-field
                  v-model="form.display_name"
                  label="Weergavenaam"
                  :rules="[rules.required]"
                  class="mb-2"
                />

                <v-text-field
                  v-model="form.avatar_url"
                  label="Avatar URL (optioneel)"
                  placeholder="https://..."
                  hint="Plak een URL naar je profielfoto"
                  persistent-hint
                  class="mb-4"
                />

                <v-btn
                  color="primary"
                  :loading="isSaving"
                  @click="saveProfile"
                >
                  Opslaan
                </v-btn>
              </v-form>
            </v-card-text>
          </v-card>

          <!-- Theme settings -->
          <v-card elevation="0" border>
            <v-card-title>
              <v-icon start>mdi-palette</v-icon>
              Thema
            </v-card-title>
            <v-card-text>
              <v-btn-toggle
                v-model="themeMode"
                mandatory
                variant="outlined"
                @update:model-value="setTheme"
              >
                <v-btn value="light">
                  <v-icon start>mdi-weather-sunny</v-icon>
                  Licht
                </v-btn>
                <v-btn value="dark">
                  <v-icon start>mdi-weather-night</v-icon>
                  Donker
                </v-btn>
              </v-btn-toggle>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <!-- Account info -->
          <v-card elevation="0" border>
            <v-card-title>
              <v-icon start>mdi-information</v-icon>
              Account
            </v-card-title>
            <v-list>
              <v-list-item>
                <v-list-item-title>E-mail</v-list-item-title>
                <v-list-item-subtitle>{{ user?.email }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>Aangemaakt</v-list-item-title>
                <v-list-item-subtitle>
                  {{ formatDate(profile?.created_at) }}
                </v-list-item-subtitle>
              </v-list-item>
              <v-list-item v-if="isAdmin">
                <v-list-item-title>Rol</v-list-item-title>
                <v-list-item-subtitle>
                  <v-chip size="small" color="primary">
                    App Beheerder
                  </v-chip>
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { ref, reactive, watch, inject } from 'vue'
import { useTheme } from 'vuetify'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { useAuth } from '@/composables/useAuth'

const theme = useTheme()
const { user, profile, isAdmin, updateProfile } = useAuth()
const showSnackbar = inject<(msg: string, color?: string) => void>('showSnackbar')

const formRef = ref()
const isSaving = ref(false)
const themeMode = ref(theme.global.name.value)

const form = reactive({
  display_name: '',
  avatar_url: ''
})

const rules = {
  required: (v: string) => !!v || 'Dit veld is verplicht'
}

// Populate form when profile loads
watch(profile, (newProfile) => {
  if (newProfile) {
    form.display_name = newProfile.display_name
    form.avatar_url = newProfile.avatar_url || ''
  }
}, { immediate: true })

function formatDate(dateString?: string) {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

function setTheme(mode: string) {
  theme.global.name.value = mode
}

async function saveProfile() {
  const { valid } = await formRef.value.validate()
  if (!valid) return

  isSaving.value = true
  try {
    const result = await updateProfile({
      display_name: form.display_name,
      avatar_url: form.avatar_url || null
    })

    if (result.success) {
      showSnackbar?.('Profiel opgeslagen!', 'success')
    } else {
      showSnackbar?.(result.error || 'Er is een fout opgetreden', 'error')
    }
  } finally {
    isSaving.value = false
  }
}
</script>
