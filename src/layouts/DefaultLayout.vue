<template>
  <v-app>
    <!-- App Bar -->
    <v-app-bar color="surface" elevation="0" border="b">
      <v-app-bar-nav-icon
        v-if="isAuthenticated"
        @click="drawer = !drawer"
      />

      <v-app-bar-title class="pointer" @click="$router.push({ name: 'dashboard' })">
        <div class="d-flex align-center">
          <v-avatar size="28" class="mr-2 border">
            <v-img :src="logoPath" contain />
          </v-avatar>
          <span class="font-weight-bold title-text">Horizons</span>
        </div>
      </v-app-bar-title>

      <v-spacer />





      <!-- User menu -->
      <v-menu v-if="isAuthenticated">
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            icon
            variant="text"
          >
            <v-avatar size="32" color="primary">
              <v-img
                v-if="profile?.avatar_url"
                :src="profile.avatar_url"
              />
              <span v-else class="text-white text-body-2">
                {{ profile?.display_name?.charAt(0)?.toUpperCase() || '?' }}
              </span>
            </v-avatar>
          </v-btn>
        </template>
        <v-list>
          <v-list-item>
            <v-list-item-title class="font-weight-bold">
              {{ profile?.display_name }}
            </v-list-item-title>
          </v-list-item>
          <v-divider />
          <v-list-item :to="{ name: 'settings' }">
            <template #prepend>
              <v-icon>mdi-cog</v-icon>
            </template>
            <v-list-item-title>Instellingen</v-list-item-title>
          </v-list-item>
          <v-list-item v-if="isAdmin" :to="{ name: 'admin' }">
            <template #prepend>
              <v-icon>mdi-shield-crown</v-icon>
            </template>
            <v-list-item-title>Beheer</v-list-item-title>
          </v-list-item>
          <v-divider />
          <v-list-item @click="handleLogout">
            <template #prepend>
              <v-icon color="error">mdi-logout</v-icon>
            </template>
            <v-list-item-title class="text-error">Uitloggen</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <!-- Navigation Drawer -->
    <v-navigation-drawer
      v-if="isAuthenticated"
      v-model="drawer"
      :rail="rail"
      @update:rail="rail = $event"
    >
      <v-list nav>
        <v-list-item
          :to="{ name: 'dashboard' }"
          prepend-icon="mdi-view-dashboard"
          title="Dashboard"
          :active="$route.name === 'dashboard'"
        />
        <v-list-item
          :to="{ name: 'teams' }"
          prepend-icon="mdi-account-group"
          title="Teams"
          :active="$route.name === 'teams'"
        />
        <v-list-item
          :to="{ name: 'celebration' }"
          prepend-icon="mdi-party-popper"
          title="Viering"
          :active="$route.name === 'celebration'"
        />
        <v-list-item
          :to="{ name: 'history' }"
          prepend-icon="mdi-history"
          title="Geschiedenis"
          :active="$route.name === 'history'"
        />
      </v-list>

      <template #append>
        <v-list nav>
          <v-list-item
            @click="rail = !rail"
            :prepend-icon="rail ? 'mdi-chevron-right' : 'mdi-chevron-left'"
            :title="rail ? '' : 'Inklappen'"
          />
        </v-list>
      </template>
    </v-navigation-drawer>

    <!-- Main content -->
    <v-main>
      <slot />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useDisplay } from 'vuetify'
import { useAuth } from '@/composables/useAuth'

const { isAuthenticated, isAdmin, profile, logout } = useAuth()
const route = useRoute()
const { mobile } = useDisplay()

const logoPath = `${import.meta.env.BASE_URL}favicon.png`

const drawer = ref(!mobile.value)
const rail = ref(false)

// Auto-collapse drawer on mobile after navigation
watch(() => route.path, () => {
  if (mobile.value) {
    drawer.value = false
  }
})

async function handleLogout() {
  await logout()
}
</script>

<style scoped>
.pointer {
  cursor: pointer;
}

.invert-icon {
  filter: brightness(0) invert(1);
}

.title-text {
  line-height: normal;
  display: inline-flex;
  align-items: center;
}
</style>
