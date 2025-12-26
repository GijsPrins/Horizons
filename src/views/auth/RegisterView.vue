<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="5" lg="4">
        <v-card class="pa-4" elevation="0" border>
          <!-- Logo -->
          <div class="text-center mb-6">
            <v-icon size="64" color="primary">mdi-compass-outline</v-icon>
            <h1 class="text-h4 font-weight-bold mt-2">Horizons</h1>
            <p class="text-body-2 text-medium-emphasis">
              Maak een account aan
            </p>
          </div>

          <!-- Register Form -->
          <v-form @submit.prevent="handleRegister" ref="formRef">
            <v-text-field
              v-model="displayName"
              label="Weergavenaam"
              prepend-inner-icon="mdi-account"
              :rules="[rules.required, rules.minLength]"
              autocomplete="name"
              class="mb-2"
            />

            <v-text-field
              v-model="email"
              label="E-mailadres"
              type="email"
              prepend-inner-icon="mdi-email"
              :rules="[rules.required, rules.email]"
              autocomplete="email"
              class="mb-2"
            />

            <v-text-field
              v-model="password"
              label="Wachtwoord"
              :type="showPassword ? 'text' : 'password'"
              prepend-inner-icon="mdi-lock"
              :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append-inner="showPassword = !showPassword"
              :rules="[rules.required, rules.password]"
              autocomplete="new-password"
              class="mb-2"
            />

            <v-text-field
              v-model="passwordConfirm"
              label="Wachtwoord bevestigen"
              :type="showPassword ? 'text' : 'password'"
              prepend-inner-icon="mdi-lock-check"
              :rules="[rules.required, rules.passwordMatch]"
              autocomplete="new-password"
              class="mb-4"
            />

            <v-btn
              type="submit"
              color="primary"
              size="large"
              block
              :loading="loading"
            >
              Registreren
            </v-btn>
          </v-form>

          <!-- Error message -->
          <v-alert
            v-if="error"
            type="error"
            variant="tonal"
            class="mt-4"
            closable
            @click:close="error = ''"
          >
            {{ error }}
          </v-alert>

          <!-- Login link -->
          <div class="text-center mt-6">
            <span class="text-body-2 text-medium-emphasis">
              Al een account?
            </span>
            <router-link
              :to="{ name: 'login' }"
              class="text-primary font-weight-medium ml-1"
            >
              Inloggen
            </router-link>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, inject } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { register, loading } = useAuth()
const showSnackbar = inject<(msg: string, color?: string) => void>('showSnackbar')

const formRef = ref()
const displayName = ref('')
const email = ref('')
const password = ref('')
const passwordConfirm = ref('')
const showPassword = ref(false)
const error = ref('')

const rules = {
  required: (v: string) => !!v || 'Dit veld is verplicht',
  minLength: (v: string) => v.length >= 2 || 'Minimaal 2 tekens',
  email: (v: string) => /.+@.+\..+/.test(v) || 'Ongeldig e-mailadres',
  password: (v: string) => v.length >= 6 || 'Minimaal 6 tekens',
  passwordMatch: (v: string) => v === password.value || 'Wachtwoorden komen niet overeen'
}

async function handleRegister() {
  const { valid } = await formRef.value.validate()
  if (!valid) return

  error.value = ''
  const result = await register(email.value, password.value, displayName.value)

  if (result.success) {
    showSnackbar?.('Account aangemaakt! Welkom bij Horizons.', 'success')
    router.push({ name: 'teams' })
  } else {
    error.value = result.error || 'Registreren mislukt'
  }
}
</script>
