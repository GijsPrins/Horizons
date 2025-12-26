<template>
  <DefaultLayout>
    <v-container fluid class="pa-4">
      <!-- Header -->
      <div class="d-flex align-center mb-4">
        <v-btn icon variant="text" @click="$router.back()">
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>
        <div class="ml-2">
          <h1 class="text-h4 font-weight-bold">{{ team?.name || 'Team laden...' }}</h1>
          <p class="text-body-2 text-medium-emphasis">
            {{ team?.description || 'Geen beschrijving' }}
          </p>
        </div>

        <v-spacer />

        <!-- Invite code -->
        <v-chip
          v-if="team"
          color="primary"
          variant="outlined"
          size="large"
          @click="copyInviteCode"
        >
          <v-icon start>mdi-key</v-icon>
          {{ team.invite_code }}
          <v-icon end size="16">mdi-content-copy</v-icon>
        </v-chip>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="text-center py-12">
        <v-progress-circular indeterminate color="primary" size="48" />
      </div>

      <v-row v-else-if="team">
        <!-- Members list -->
        <v-col cols="12" md="6">
          <v-card elevation="0" border>
            <v-card-title>
              <v-icon start>mdi-account-group</v-icon>
              Leden ({{ team.team_members?.length || 0 }})
            </v-card-title>
            <v-list>
              <v-list-item
                v-for="member in team.team_members"
                :key="member.id"
              >
                <template #prepend>
                  <v-avatar color="primary" size="40">
                    <v-img
                      v-if="member.profile?.avatar_url"
                      :src="member.profile.avatar_url"
                    />
                    <span v-else class="text-white">
                      {{ member.profile?.display_name?.charAt(0)?.toUpperCase() }}
                    </span>
                  </v-avatar>
                </template>

                <v-list-item-title>
                  {{ member.profile?.display_name }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  <v-chip
                    size="x-small"
                    :color="member.role === 'admin' ? 'primary' : 'default'"
                  >
                    {{ member.role === 'admin' ? 'Beheerder' : 'Lid' }}
                  </v-chip>
                </v-list-item-subtitle>

                <template #append>
                  <span class="text-caption text-medium-emphasis">
                    {{ formatDate(member.joined_at) }}
                  </span>
                </template>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>

        <!-- Team actions -->
        <v-col cols="12" md="6">
          <v-card elevation="0" border class="mb-4">
            <v-card-title>
              <v-icon start>mdi-share-variant</v-icon>
              Uitnodigen
            </v-card-title>
            <v-card-text>
              <p class="text-body-2 mb-4">
                Deel deze code met anderen om ze uit te nodigen voor dit team.
              </p>

              <v-text-field
                :model-value="team.invite_code"
                label="Uitnodigingscode"
                readonly
                variant="outlined"
              >
                <template #append>
                  <v-btn icon variant="text" @click="copyInviteCode">
                    <v-icon>mdi-content-copy</v-icon>
                  </v-btn>
                </template>
              </v-text-field>
            </v-card-text>
          </v-card>

          <!-- Team settings (admin only) -->
          <v-card v-if="isTeamAdmin" elevation="0" border>
            <v-card-title>
              <v-icon start>mdi-cog</v-icon>
              Team instellingen
            </v-card-title>
            <v-card-text>
              <v-btn
                color="error"
                variant="outlined"
                block
                @click="confirmLeave = true"
              >
                <v-icon start>mdi-logout</v-icon>
                Team verlaten
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Leave confirmation -->
      <v-dialog v-model="confirmLeave" max-width="400">
        <v-card>
          <v-card-title>Team verlaten?</v-card-title>
          <v-card-text>
            Weet je zeker dat je "{{ team?.name }}" wilt verlaten?
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" @click="confirmLeave = false">Annuleren</v-btn>
            <v-btn color="error" variant="flat" @click="handleLeave">Verlaten</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { ref, inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { useTeam, useTeams } from '@/composables/useTeams'

const route = useRoute()
const router = useRouter()
const showSnackbar = inject<(msg: string, color?: string) => void>('showSnackbar')

const teamId = route.params.id as string
const { team, isLoading, isTeamAdmin } = useTeam(teamId)
const { leaveTeam } = useTeams()

const confirmLeave = ref(false)

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

async function copyInviteCode() {
  if (!team.value) return
  await navigator.clipboard.writeText(team.value.invite_code)
  showSnackbar?.('Code gekopieerd!', 'success')
}

async function handleLeave() {
  if (!team.value) return
  try {
    await leaveTeam(team.value.id)
    showSnackbar?.('Je hebt het team verlaten', 'success')
    router.push({ name: 'teams' })
  } catch (error: any) {
    showSnackbar?.(error.message || 'Er is een fout opgetreden', 'error')
  }
  confirmLeave.value = false
}
</script>
