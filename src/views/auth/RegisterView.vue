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
            <h1 class="text-h4 font-weight-bold mt-2">{{ $t('app.name') }}</h1>
            <p class="text-body-2 text-medium-emphasis">
              {{ $t('auth.createAccount') }}
            </p>
          </div>

          <!-- Register Form -->
          <v-form @submit.prevent="handleRegister" ref="formRef">
            <v-text-field
              v-model="displayName"
              :label="$t('auth.displayName')"
              prepend-inner-icon="mdi-account"
              :rules="[rules.required, rules.minLength]"
              autocomplete="name"
              class="mb-2"
            />

            <v-text-field
              v-model="email"
              :label="$t('auth.email')"
              type="email"
              prepend-inner-icon="mdi-email"
              :rules="[rules.required, rules.email]"
              autocomplete="email"
              class="mb-2"
            />

            <v-text-field
              v-model="password"
              :label="$t('auth.password')"
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
              :label="$t('auth.passwordConfirm')"
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
              {{ $t('auth.register') }}
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
              {{ $t('auth.hasAccount') }}
            </span>
            <router-link
              :to="{ name: 'login' }"
              class="text-primary font-weight-medium ml-1"
            >
              {{ $t('auth.login') }}
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
import { useI18n } from 'vue-i18n'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { t } = useI18n()
const { register, loading } = useAuth()
const showSnackbar = inject<(msg: string, color?: string) => void>('showSnackbar')

const logoPath = `${import.meta.env.BASE_URL}favicon.png`

const formRef = ref()
const displayName = ref('')
const email = ref('')
const password = ref('')
const passwordConfirm = ref('')
const showPassword = ref(false)
const error = ref('')

const rules = {
  required: (v: string) => !!v || t('common.required'),
  minLength: (v: string) => v.length >= 2 || t('auth.errors.minLength', { n: 2 }),
  email: (v: string) => /.+@.+\..+/.test(v) || t('auth.errors.invalidEmail'),
  password: (v: string) => v.length >= 6 || t('auth.errors.invalidPassword'),
  passwordMatch: (v: string) => v === password.value || t('auth.errors.passwordMismatch')
}

async function handleRegister() {
  const { valid } = await formRef.value.validate()
  if (!valid) return

  error.value = ''
  const result = await register(email.value, password.value, displayName.value)

  if (result.success) {
    showSnackbar?.(t('auth.registerSuccess'), 'success')
    router.push({ name: 'teams' })
  } else {
    error.value = result.error || t('auth.errors.registerFailed')
  }
}
</script>
