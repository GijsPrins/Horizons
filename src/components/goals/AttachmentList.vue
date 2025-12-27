<template>
  <div class="attachment-list">
    <!-- Image Gallery Section -->
    <div v-if="images.length > 0" class="image-grid mb-4">
      <div v-for="img in images" :key="img.id" class="image-item">
        <v-img
          :src="img.url || ''"
          aspect-ratio="1"
          cover
          class="rounded-lg bg-grey-lighten-2 cursor-pointer"
          @click="openImage(img.url)"
        >
          <template #placeholder>
            <v-row class="fill-height ma-0" align="center" justify="center">
              <v-progress-circular indeterminate color="grey-lighten-5" />
            </v-row>
          </template>

          <!-- Delete overlay -->
          <div v-if="!readonly" class="image-delete-overlay">
            <v-btn
              icon="mdi-delete"
              variant="flat"
              color="error"
              size="x-small"
              @click.stop="$emit('delete', img.id)"
            />
          </div>
        </v-img>
        <div class="text-caption mt-1 text-truncate px-1">
          {{ img.title || $t("attachments.image") }}
        </div>
      </div>
    </div>

    <!-- Other Attachments List -->
    <v-list v-if="otherAttachments.length > 0" density="compact" class="pa-0">
      <v-list-item
        v-for="attachment in otherAttachments"
        :key="attachment.id"
        class="attachment-item mb-2"
        elevation="0"
        border
        rounded="lg"
        :href="
          attachment.type === 'url' ? attachment.url || undefined : undefined
        "
        :target="attachment.type === 'url' ? '_blank' : undefined"
      >
        <template #prepend>
          <v-avatar :color="getTypeColor(attachment.type)" size="36">
            <v-icon size="20" color="white">{{
              getTypeIcon(attachment.type)
            }}</v-icon>
          </v-avatar>
        </template>

        <v-list-item-title class="font-weight-medium">
          {{ attachment.title || getDefaultTitle(attachment) }}
        </v-list-item-title>

        <v-list-item-subtitle>
          <template v-if="attachment.type === 'note'">
            {{ attachment.content }}
          </template>
          <template v-else-if="attachment.type === 'milestone'">
            {{ formatDate(attachment.milestone_date || attachment.created_at) }}
          </template>
          <template v-else>
            {{ attachment.url }}
          </template>
        </v-list-item-subtitle>

        <template #append>
          <v-btn
            v-if="!readonly"
            icon="mdi-delete"
            variant="text"
            size="small"
            color="error"
            @click.prevent="$emit('delete', attachment.id)"
          />
        </template>
      </v-list-item>
    </v-list>

    <div
      v-if="attachments.length === 0"
      class="text-center py-8 text-medium-emphasis border rounded-xl border-dashed"
    >
      <v-icon size="48" class="mb-2 opacity-20">mdi-paperclip</v-icon>
      <p class="text-body-2">{{ $t("attachments.noAttachments") }}</p>
    </div>

    <!-- Lightbox for images -->
    <v-dialog v-model="showLightbox" max-width="90vw" scrollable>
      <v-card class="bg-black">
        <v-toolbar color="transparent" density="compact" class="text-white">
          <v-spacer />
          <v-btn icon="mdi-close" @click="showLightbox = false" />
        </v-toolbar>
        <v-img :src="lightboxImage" width="100%" height="auto" contain />
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import type { Attachment, AttachmentType } from "@/types/database";
import { formatDate } from "@/utils/format";

const props = defineProps<{
  attachments: Attachment[];
  readonly?: boolean;
}>();

defineEmits<{
  delete: [attachmentId: string];
}>();

const { t } = useI18n();

const showLightbox = ref(false);
const lightboxImage = ref("");

const images = computed(() =>
  props.attachments.filter(
    (a) => a.type === "image" || (a.type === "url" && isImageUrl(a.url)),
  ),
);

const otherAttachments = computed(() =>
  props.attachments.filter((a) => !isImage(a)),
);

function isImage(a: Attachment) {
  return a.type === "image" || (a.type === "url" && isImageUrl(a.url));
}

function isImageUrl(url: string | null) {
  if (!url) return false;
  return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
}

function openImage(url: string | null) {
  if (url) {
    lightboxImage.value = url;
    showLightbox.value = true;
  }
}

const typeConfig = computed(() => ({
  url: { icon: "mdi-link", color: "info", label: t("attachments.link") },
  image: { icon: "mdi-image", color: "success", label: t("attachments.image") },
  note: {
    icon: "mdi-note-text",
    color: "warning",
    label: t("attachments.note"),
  },
  milestone: {
    icon: "mdi-flag",
    color: "secondary",
    label: t("attachments.milestone"),
  },
}));

function getTypeIcon(type: AttachmentType): string {
  return (
    typeConfig.value[type as keyof typeof typeConfig.value]?.icon ||
    "mdi-paperclip"
  );
}

function getTypeColor(type: AttachmentType): string {
  return (
    typeConfig.value[type as keyof typeof typeConfig.value]?.color || "grey"
  );
}

function getDefaultTitle(attachment: Attachment): string {
  return (
    typeConfig.value[attachment.type as keyof typeof typeConfig.value]?.label ||
    t("attachments.title")
  );
}
</script>

<style scoped>
.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
}

.image-item {
  position: relative;
}

.image-delete-overlay {
  position: absolute;
  top: 4px;
  right: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.image-item:hover .image-delete-overlay {
  opacity: 1;
}

.attachment-item {
  transition: all 0.2s ease;
}

.attachment-item:hover {
  background: rgba(var(--v-theme-on-surface), 0.05);
  transform: translateX(4px);
}
</style>
