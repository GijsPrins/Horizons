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
              {{ $t('auth.forgotPasswordTitle') }}
            </p>
          </div>

          <!-- Description -->
          <p class="text-body-2 mb-4 text-center">
            {{ $t('auth.enterEmail') }}
          </p>

          <!-- Form -->
          <v-form @submit.prevent="handleReset" ref="formRef">
            <v-text-field
              v-model="email"
              :label="$t('auth.email')"
              type="email"
              prepend-inner-icon="mdi-email"
              :rules="[rules.required, rules.email]"
              autocomplete="email"
              class="mb-4"
            />

            <!-- Captcha -->
            <div class="mb-4 d-flex justify-center">
               <vue-turnstile ref="turnstile" :site-key="siteKey" v-model="captchaToken" />
            </div>

            <v-btn
              type="submit"
              color="primary"
              size="large"
              block
              :loading="loading"
            >
              {{ $t('auth.sendResetLink') }}
            </v-btn>
          </v-form>

          <!-- Feedback message -->
          <v-alert
            v-if="message"
            :type="isError ? 'error' : 'success'"
            variant="tonal"
            class="mt-4"
            closable
            @click:close="message = ''"
          >
            {{ message }}
          </v-alert>

          <!-- Back to login -->
          <div class="text-center mt-6">
            <router-link
              :to="{ name: 'login' }"
              class="text-body-2 text-primary font-weight-medium"
            >
              <v-icon start size="small">mdi-arrow-left</v-icon>
              {{ $t('auth.backToLogin') }}
            </router-link>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import VueTurnstile from 'vue-turnstile'
import { useI18n } from 'vue-i18n'
import { useAuth } from '@/composables/useAuth'

const { t } = useI18n()
const { resetPassword, loading } = useAuth()

const logoPath = `${import.meta.env.BASE_URL}favicon.png`
const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || ''

const formRef = ref()
const turnstile = ref()
const email = ref('')
const captchaToken = ref('')
const message = ref('')
const isError = ref(false)

const rules = {
  required: (v: string) => !!v || t('common.required'),
  email: (v: string) => /.+@.+\..+/.test(v) || t('auth.errors.invalidEmail')
}

async function handleReset() {
  const { valid } = await formRef.value.validate()
  if (!valid) return

  if (!captchaToken.value) {
     message.value = "Please complete the captcha"
     isError.value = true
     return
  }

  isError.value = false
  message.value = ''
  
  const result = await resetPassword(email.value, captchaToken.value)

  if (result.success) {
    message.value = t('auth.errors.resetPasswordSuccess')
    isError.value = false
    // Clear form
    email.value = ''
    captchaToken.value = ''
    turnstile.value?.reset()
  } else {
    message.value = result.error || t('common.error')
    isError.value = true
    captchaToken.value = ''
    turnstile.value?.reset()
  }
}
</script>
