<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="5" lg="4">
        <v-card class="pa-4" elevation="0" border>
          <!-- Logo -->
          <div class="text-center mb-6">
            <v-avatar size="80" class="mb-2 border">
              <v-img :src="logoPath" contain />
            </v-avatar>
            <h1 class="text-h4 font-weight-bold mt-2">Horizons</h1>
            <p class="text-body-2 text-medium-emphasis">
              Samen naar nieuwe horizons
            </p>
          </div>

          <!-- Login Form -->
          <v-form @submit.prevent="handleLogin" ref="formRef">
            <v-text-field
              v-model="email"
              label="E-mailadres"
              type="email"
              prepend-inner-icon="mdi-email"
              :rules="[rules.required, rules.email]"
              :error-messages="emailError"
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
              :rules="[rules.required]"
              :error-messages="passwordError"
              autocomplete="current-password"
              class="mb-4"
            />

            <v-btn
              type="submit"
              color="primary"
              size="large"
              block
              :loading="loading"
            >
              Inloggen
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

          <!-- Register link -->
          <div class="text-center mt-6">
            <span class="text-body-2 text-medium-emphasis">
              Nog geen account?
            </span>
            <router-link
              :to="{ name: 'register' }"
              class="text-primary font-weight-medium ml-1"
            >
              Registreren
            </router-link>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, inject } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const route = useRoute()
const { login, loading } = useAuth()
const showSnackbar = inject<(msg: string, color?: string) => void>('showSnackbar')

const logoPath = `${import.meta.env.BASE_URL}favicon.png`

const formRef = ref()
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const error = ref('')
const emailError = ref('')
const passwordError = ref('')

const rules = {
  required: (v: string) => !!v || 'Dit veld is verplicht',
  email: (v: string) => /.+@.+\..+/.test(v) || 'Ongeldig e-mailadres'
}

async function handleLogin() {
  const { valid } = await formRef.value.validate()
  if (!valid) return

  error.value = ''
  const result = await login(email.value, password.value)

  if (result.success) {
    showSnackbar?.('Welkom terug!', 'success')
    const redirect = route.query.redirect as string
    router.push(redirect || { name: 'dashboard' })
  } else {
    error.value = result.error || 'Inloggen mislukt'
  }
}
</script>
