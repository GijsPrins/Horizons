<template>
  <DefaultLayout>
    <v-container fluid class="pa-4">
      <!-- Header -->
      <div class="d-flex align-center mb-4">
        <div>
          <h1 class="text-h4 font-weight-bold">{{ $t("teams.title") }}</h1>
          <p class="text-body-2 text-medium-emphasis">
            {{ $t("teams.description") }}
          </p>
        </div>

        <v-spacer />

        <v-btn color="primary" @click="createDialogOpen = true">
          <v-icon start>mdi-plus</v-icon>
          {{ $t("teams.createTeam") }}
        </v-btn>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="text-center py-12">
        <v-progress-circular indeterminate color="primary" size="48" />
      </div>

      <!-- Empty state -->
      <v-card
        v-else-if="!teams || teams.length === 0"
        class="pa-8 text-center"
        elevation="0"
        border
      >
        <v-icon size="64" color="primary" class="mb-4"
          >mdi-account-group</v-icon
        >
        <h2 class="text-h6 mb-2">{{ $t("teams.noTeamsTitle") }}</h2>
        <p class="text-body-2 text-medium-emphasis mb-4">
          {{ $t("teams.createOrJoin") }}
        </p>
        <div class="d-flex justify-center gap-3">
          <v-btn color="primary" @click="createDialogOpen = true">
            <v-icon start>mdi-plus</v-icon>
            {{ $t("teams.createTeam") }}
          </v-btn>
          <v-btn variant="outlined" @click="joinDialogOpen = true">
            <v-icon start>mdi-account-plus</v-icon>
            {{ $t("teams.joinTeam") }}
          </v-btn>
        </div>
      </v-card>

      <!-- Teams grid -->
      <v-row v-else>
        <v-col v-for="team in teams" :key="team.id" cols="12" sm="6" md="4">
          <v-card
            elevation="0"
            border
            hover
            @click="$router.push({ name: 'team', params: { id: team.id } })"
          >
            <v-card-text>
              <div class="d-flex align-center mb-3">
                <v-avatar color="primary" size="48">
                  <v-icon>mdi-account-group</v-icon>
                </v-avatar>
                <div class="ml-3">
                  <h3 class="text-h6 font-weight-bold">{{ team.name }}</h3>
                  <p class="text-body-2 text-medium-emphasis">
                    {{ $t("teams.members", { count: getMemberCount(team) }) }}
                  </p>
                </div>
              </div>

              <p v-if="team.description" class="text-body-2 mb-3">
                {{ team.description }}
              </p>

              <!-- Member avatars -->
              <div class="d-flex align-center">
                <v-avatar
                  v-for="(member, index) in getVisibleMembers(team)"
                  :key="member.id"
                  size="28"
                  :style="{ marginLeft: index > 0 ? '-8px' : '0' }"
                  color="secondary"
                >
                  <v-img
                    v-if="member.profile?.avatar_url"
                    :src="member.profile.avatar_url"
                  />
                  <span v-else class="text-caption text-white">
                    {{ member.profile?.display_name?.charAt(0)?.toUpperCase() }}
                  </span>
                </v-avatar>
                <span
                  v-if="getMemberCount(team) > 3"
                  class="text-caption text-medium-emphasis ml-2"
                >
                  {{
                    $t("teams.moreMembers", { count: getMemberCount(team) - 3 })
                  }}
                </span>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- FAB for joining team -->
      <v-fab
        icon="mdi-account-plus"
        color="secondary"
        location="bottom end"
        size="large"
        style="bottom: 88px"
        app
        @click="joinDialogOpen = true"
      />

      <!-- Create Team Dialog -->
      <v-dialog v-model="createDialogOpen" max-width="500">
        <v-card>
          <v-card-title>{{ $t("teams.createTeam") }}</v-card-title>
          <v-card-text>
            <v-form ref="createFormRef" @submit.prevent="handleCreate">
              <v-text-field
                v-model="createForm.name"
                :label="$t('teams.teamName')"
                :placeholder="$t('teams.teamNamePlaceholder')"
                :rules="[rules.required]"
                prepend-inner-icon="mdi-account-group"
                class="mb-2"
              />
              <v-textarea
                v-model="createForm.description"
                :label="$t('teams.teamDescription')"
                :placeholder="$t('teams.teamDescriptionPlaceholder')"
                rows="2"
                auto-grow
              />
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" @click="createDialogOpen = false">{{
              $t("common.cancel")
            }}</v-btn>
            <v-btn
              color="primary"
              variant="flat"
              :loading="isCreating"
              @click="handleCreate"
            >
              {{ $t("teams.create") }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Join Team Dialog -->
      <v-dialog v-model="joinDialogOpen" max-width="400">
        <v-card>
          <v-card-title>{{ $t("teams.joinTeam") }}</v-card-title>
          <v-card-text>
            <p class="text-body-2 text-medium-emphasis mb-4">
              {{ $t("teams.joinDescription") }}
            </p>
            <v-text-field
              v-model="inviteCode"
              :label="$t('teams.inviteCode')"
              :placeholder="$t('teams.inviteCodePlaceholder')"
              :rules="[rules.required]"
              prepend-inner-icon="mdi-key"
              :error-messages="joinError"
              @keyup.enter="handleJoin"
            />
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" @click="joinDialogOpen = false">{{
              $t("common.cancel")
            }}</v-btn>
            <v-btn
              color="primary"
              variant="flat"
              :loading="isJoining"
              @click="handleJoin"
            >
              {{ $t("teams.join") }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { ref, reactive, inject } from "vue";
import { useI18n } from "vue-i18n";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import { useTeams } from "@/composables/useTeams";
import type { TeamWithMembers } from "@/types/database";

const { teams, isLoading, createTeam, joinTeam, isCreating, isJoining } =
  useTeams();
const { t } = useI18n();
const showSnackbar =
  inject<(msg: string, color?: string) => void>("showSnackbar");

const createDialogOpen = ref(false);
const joinDialogOpen = ref(false);
const createFormRef = ref();

const createForm = reactive({
  name: "",
  description: "",
});

const inviteCode = ref("");
const joinError = ref("");

const rules = {
  required: (v: string) => !!v || t("common.required"),
};

function getMemberCount(team: TeamWithMembers): number {
  return team.team_members?.length || 0;
}

function getVisibleMembers(team: TeamWithMembers) {
  return team.team_members?.slice(0, 3) || [];
}

async function handleCreate() {
  const { valid } = await createFormRef.value.validate();
  if (!valid) return;

  try {
    await createTeam(createForm);
    showSnackbar?.(t("teams.created"), "success");
    createDialogOpen.value = false;
    createForm.name = "";
    createForm.description = "";
  } catch (error: any) {
    showSnackbar?.(error.message || t("common.error"), "error");
  }
}

async function handleJoin() {
  const sanitizedCode = inviteCode.value.trim().toUpperCase();
  if (!sanitizedCode) return;

  joinError.value = "";
  try {
    await joinTeam(sanitizedCode);
    showSnackbar?.(t("teams.joined"), "success");
    joinDialogOpen.value = false;
    inviteCode.value = "";

    // Explicitly refetch teams to show the new one
    await useTeams().refetch();
  } catch (error: any) {
    joinError.value = error.message || t("teams.invalidCode");
  }
}
</script>
