<template>
  <v-dialog v-model="isOpen" max-width="500">
    <v-card>
      <v-card-title>{{ $t("attachments.addAttachment") }}</v-card-title>

      <v-card-text>
        <!-- Type tabs -->
        <v-tabs v-model="selectedType" grow class="mb-4">
          <v-tab value="url">
            <v-icon start>mdi-link</v-icon>
            {{ $t("attachments.link") }}
          </v-tab>
          <v-tab value="image">
            <v-icon start>mdi-image</v-icon>
            {{ $t("attachments.image") }}
          </v-tab>
          <v-tab value="note">
            <v-icon start>mdi-note-text</v-icon>
            {{ $t("attachments.note") }}
          </v-tab>
        </v-tabs>

        <v-form ref="formRef">
          <!-- Title (optional) -->
          <v-text-field
            v-model="form.title"
            :label="$t('common.title') + ' (' + $t('common.optional') + ')'"
            variant="outlined"
            density="compact"
            class="mb-3"
            :placeholder="$t('attachments.titlePlaceholder')"
          />

          <!-- Image toggle: URL or File -->
          <v-radio-group
            v-if="selectedType === 'image'"
            v-model="imageSource"
            inline
            density="compact"
            class="mb-2"
          >
            <v-radio :label="$t('attachments.url')" value="url" />
            <v-radio :label="$t('attachments.upload')" value="file" />
          </v-radio-group>

          <!-- URL input -->
          <v-text-field
            v-if="
              selectedType === 'url' ||
              (selectedType === 'image' && imageSource === 'url')
            "
            v-model="form.url"
            :label="
              selectedType === 'image'
                ? $t('attachments.imageUrl')
                : $t('attachments.url')
            "
            :placeholder="
              selectedType === 'image'
                ? $t('common.imageUrlPlaceholder')
                : $t('common.urlPlaceholder')
            "
            :rules="[rules.required, rules.url]"
            variant="outlined"
            density="compact"
            prepend-inner-icon="mdi-link"
          />

          <!-- File upload -->
          <v-file-input
            v-if="selectedType === 'image' && imageSource === 'file'"
            v-model="form.file"
            :label="$t('attachments.chooseImage')"
            variant="outlined"
            density="compact"
            prepend-icon="mdi-camera"
            accept="image/*"
            :rules="[rules.requiredFile]"
          />

          <!-- Note input -->
          <v-textarea
            v-if="selectedType === 'note'"
            v-model="form.content"
            :label="$t('attachments.note')"
            :placeholder="$t('attachments.notePlaceholder')"
            :rules="[rules.required]"
            variant="outlined"
            rows="4"
            auto-grow
          />
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="close">{{ $t("common.cancel") }}</v-btn>
        <v-btn color="primary" variant="flat" @click="handleSubmit">
          {{ $t("common.add") }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from "vue";
import { useI18n } from "vue-i18n";
import type { AttachmentType } from "@/types/database";

const isOpen = defineModel<boolean>({ required: true });

const props = defineProps<{
  goalId: string;
}>();

const { t } = useI18n();

const emit = defineEmits<{
  submit: [
    data: {
      type: AttachmentType;
      title: string;
      url?: string;
      content?: string;
      file?: File;
    },
  ];
}>();

const formRef = ref();
const selectedType = ref<AttachmentType>("url");
const imageSource = ref<"url" | "file">("file");

const form = reactive({
  title: "",
  url: "",
  content: "",
  file: null as File | null,
});

const rules = {
  required: (v: string) => !!v || t("common.required"),
  requiredFile: (v: any) => !!v || t("common.selectFile"),
  url: (v: string) => {
    if (!v) return true;
    try {
      new URL(v);
      return true;
    } catch {
      return t("common.invalidUrl");
    }
  },
};

// Reset form when dialog opens
watch(isOpen, (open) => {
  if (open) {
    form.title = "";
    form.url = "";
    form.content = "";
    form.file = null;
    selectedType.value = "url";
    imageSource.value = "file";
  }
});

function close() {
  isOpen.value = false;
}

async function handleSubmit() {
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  emit("submit", {
    type: selectedType.value,
    title: form.title,
    url:
      selectedType.value === "url" ||
      (selectedType.value === "image" && imageSource.value === "url")
        ? form.url
        : undefined,
    content: selectedType.value === "note" ? form.content : undefined,
    file:
      selectedType.value === "image" && imageSource.value === "file"
        ? form.file || undefined
        : undefined,
  });

  close();
}
</script>
