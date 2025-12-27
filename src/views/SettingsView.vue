<template>
  <DefaultLayout>
    <v-container fluid class="pa-4">
      <h1 class="text-h4 font-weight-bold mb-4">{{ $t("settings.title") }}</h1>

      <v-row>
        <v-col cols="12" md="6">
          <!-- Profile settings -->
          <v-card elevation="0" border class="mb-4">
            <v-card-title>
              <v-icon start>mdi-account</v-icon>
              {{ $t("settings.profile") }}
            </v-card-title>
            <v-card-text>
              <v-form ref="formRef">
                <div class="d-flex align-center mb-6">
                  <v-avatar size="80" color="primary" class="mr-4">
                    <v-img
                      v-if="profile?.avatar_url"
                      :src="profile.avatar_url"
                    />
                    <span v-else class="text-h4 text-white">
                      {{ profile?.display_name?.charAt(0)?.toUpperCase() }}
                    </span>
                  </v-avatar>
                  <div>
                    <v-file-input
                      v-model="avatarFile"
                      :label="$t('settings.uploadAvatar')"
                      prepend-icon="mdi-camera"
                      accept="image/*"
                      density="compact"
                      variant="outlined"
                      hide-details
                      class="mb-2"
                      @update:model-value="handleAvatarUpload"
                    />
                    <div class="text-caption text-medium-emphasis">
                      {{ $t("settings.avatarFileHint") }}
                    </div>
                  </div>
                </div>

                <v-text-field
                  v-model="form.display_name"
                  :label="$t('settings.displayName')"
                  :rules="[rules.required]"
                  variant="outlined"
                  class="mb-2"
                />

                <v-text-field
                  v-model="form.avatar_url"
                  :label="$t('settings.avatarUrlManual')"
                  :placeholder="$t('settings.avatarUrlManualPlaceholder')"
                  variant="outlined"
                  :hint="$t('settings.avatarHint')"
                  persistent-hint
                  class="mb-4"
                />

                <v-btn
                  color="primary"
                  :loading="isSaving"
                  block
                  @click="saveProfile"
                >
                  {{ $t("common.save") }}
                </v-btn>
              </v-form>
            </v-card-text>
          </v-card>

          <!-- Theme settings -->
          <v-card elevation="0" border>
            <v-card-title>
              <v-icon start>mdi-palette</v-icon>
              {{ $t("settings.theme") }}
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
                  {{ $t("settings.themes.light") }}
                </v-btn>
                <v-btn value="dark">
                  <v-icon start>mdi-weather-night</v-icon>
                  {{ $t("settings.themes.dark") }}
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
              {{ $t("settings.account") }}
            </v-card-title>
            <v-list>
              <v-list-item>
                <v-list-item-title>{{ $t("auth.email") }}</v-list-item-title>
                <v-list-item-subtitle>{{ user?.email }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>{{
                  $t("common.created")
                }}</v-list-item-title>
                <v-list-item-subtitle>
                  {{ formatDate(profile?.created_at) }}
                </v-list-item-subtitle>
              </v-list-item>
              <v-list-item v-if="isAdmin">
                <v-list-item-title>{{ $t("teams.role") }}</v-list-item-title>
                <v-list-item-subtitle>
                  <v-chip size="small" color="primary">
                    {{ $t("teams.roles.admin") }}
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
import { ref, reactive, watch, inject } from "vue";
import { useTheme } from "vuetify";
import { useI18n } from "vue-i18n";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import { useAuth } from "@/composables/useAuth";
import { formatDate } from "@/utils/format";

const theme = useTheme();
const { t } = useI18n();
const { user, profile, isAdmin, updateProfile, uploadAvatar } = useAuth();
const showSnackbar =
  inject<(msg: string, color?: string) => void>("showSnackbar");

const formRef = ref();
const isSaving = ref(false);
const themeMode = ref(theme.global.name.value);
const avatarFile = ref<File | null>(null);

const form = reactive({
  display_name: "",
  avatar_url: "",
});

async function handleAvatarUpload(file: File | File[]) {
  // Vuetify file input can return an array or single file depending on props
  const targetFile = Array.isArray(file) ? file[0] : file;
  if (!targetFile) return;

  isSaving.value = true;
  try {
    const result = await uploadAvatar(targetFile);
    if (result.success) {
      showSnackbar?.(t("settings.avatarUploaded"), "success");
      avatarFile.value = null;
    } else {
      showSnackbar?.(result.error || t("common.error"), "error");
    }
  } finally {
    isSaving.value = false;
  }
}

const rules = {
  required: (v: string) => !!v || t("common.required"),
};

// Populate form when profile loads
watch(
  profile,
  (newProfile) => {
    if (newProfile) {
      form.display_name = newProfile.display_name;
      form.avatar_url = newProfile.avatar_url || "";
    }
  },
  { immediate: true },
);

function setTheme(mode: any) {
  theme.global.name.value = mode;
  localStorage.setItem("horizons-theme", mode);
}

async function saveProfile() {
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  isSaving.value = true;
  try {
    const result = await updateProfile({
      display_name: form.display_name,
      avatar_url: form.avatar_url || null,
    });

    if (result.success) {
      showSnackbar?.(t("settings.saved"), "success");
    } else {
      showSnackbar?.(result.error || t("common.error"), "error");
    }
  } finally {
    isSaving.value = false;
  }
}
</script>
