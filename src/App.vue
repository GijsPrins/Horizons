<template>
  <v-app>
    <v-main>
      <router-view />
    </v-main>

    <!-- Global snackbar for notifications -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="3000"
      location="bottom"
    >
      {{ snackbar.message }}
      <template #actions>
        <v-btn variant="text" @click="snackbar.show = false">
          Sluiten
        </v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>

<script setup lang="ts">
import { reactive, provide, onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'

// Global snackbar state
const snackbar = reactive({
  show: false,
  message: '',
  color: 'success'
})

function showSnackbar(message: string, color: string = 'success') {
  snackbar.message = message
  snackbar.color = color
  snackbar.show = true
}

// Provide snackbar function to all components
provide('showSnackbar', showSnackbar)

// Initialize auth
const { initialize } = useAuth()

onMounted(() => {
  initialize()
})
</script>

<style>
/* Global styles */
html {
  overflow-y: auto !important;
}

.v-application {
  font-family: 'Inter', 'Roboto', sans-serif;
}

/* Smooth transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
