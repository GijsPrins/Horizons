<template>
  <DefaultLayout>
    <v-container fluid class="pa-4">
      <h1 class="text-h4 font-weight-bold mb-4">{{ $t("admin.title") }}</h1>

      <!-- Not admin warning -->
      <v-alert v-if="!isAdmin" type="warning" variant="tonal" class="mb-4">
        {{ $t("admin.noAccess") }}
      </v-alert>

      <v-row v-else>
        <v-col cols="12" md="8">
          <!-- Global categories -->
          <v-card elevation="0" border>
            <v-card-title class="d-flex align-center">
              <v-icon start>mdi-tag-multiple</v-icon>
              {{ $t("admin.globalCategories") }}
              <v-spacer />
              <v-btn size="small" color="primary" @click="openCategoryDialog()">
                <v-icon start>mdi-plus</v-icon>
                {{ $t("common.add") }}
              </v-btn>
            </v-card-title>
            <v-card-text>
              <v-list v-if="categories && categories.length > 0">
                <v-list-item v-for="category in categories" :key="category.id">
                  <template #prepend>
                    <v-avatar :color="category.color" size="36">
                      <v-icon size="18">{{ category.icon }}</v-icon>
                    </v-avatar>
                  </template>

                  <v-list-item-title>{{ category.name }}</v-list-item-title>
                  <v-list-item-subtitle>
                    {{
                      $t("categories.colorAndIcon", {
                        color: category.color,
                        icon: category.icon,
                      })
                    }}
                  </v-list-item-subtitle>

                  <template #append>
                    <v-btn
                      icon
                      variant="text"
                      size="small"
                      @click="openCategoryDialog(category)"
                    >
                      <v-icon>mdi-pencil</v-icon>
                    </v-btn>
                    <v-btn
                      icon
                      variant="text"
                      size="small"
                      color="error"
                      @click="confirmDeleteCategory(category)"
                    >
                      <v-icon>mdi-delete</v-icon>
                    </v-btn>
                  </template>
                </v-list-item>
              </v-list>

              <div v-else class="text-center py-4 text-medium-emphasis">
                {{ $t("admin.noCategories") }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Category Dialog -->
      <v-dialog v-model="categoryDialogOpen" max-width="600" :fullscreen="$vuetify.display.mobile">
        <v-card>
          <v-card-title>
            {{
              editingCategory
                ? $t("categories.editCategory")
                : $t("admin.newCategory")
            }}
          </v-card-title>
          <v-card-text>
            <v-form ref="categoryFormRef">
              <v-text-field
                v-model="categoryForm.name"
                :label="$t('categories.name')"
                :rules="[rules.required]"
                class="mb-4"
              />

              <!-- Color Picker -->
              <div class="mb-4">
                <label class="text-subtitle-2 font-weight-medium mb-2 d-block">
                  {{ $t("categories.color") }}
                </label>
                <v-menu :close-on-content-click="false">
                  <template #activator="{ props }">
                    <v-card
                      v-bind="props"
                      variant="outlined"
                      class="color-picker-card pa-3"
                      hover
                    >
                      <div class="d-flex align-center justify-space-between">
                        <div class="d-flex align-center">
                          <div
                            class="color-preview-large mr-3"
                            :style="{ backgroundColor: categoryForm.color }"
                          />
                          <div>
                            <div class="text-body-2 font-weight-medium">
                              {{ categoryForm.color }}
                            </div>
                            <div class="text-caption text-medium-emphasis">
                              {{ $t("categories.clickToChange") }}
                            </div>
                          </div>
                        </div>
                        <v-icon>mdi-chevron-down</v-icon>
                      </div>
                    </v-card>
                  </template>
                  <v-card min-width="300">
                    <v-card-text class="pa-2">
                      <v-color-picker
                        v-model="categoryForm.color"
                        mode="hex"
                        :modes="['hex']"
                        show-swatches
                        :swatches="commonColors"
                      />
                    </v-card-text>
                  </v-card>
                </v-menu>
              </div>

              <!-- Icon Picker -->
              <div class="mb-4">
                <label class="text-subtitle-2 font-weight-medium mb-2 d-block">
                  {{ $t("categories.icon") }}
                </label>
                <v-menu :close-on-content-click="false" max-width="420">
                  <template #activator="{ props }">
                    <v-card
                      v-bind="props"
                      variant="outlined"
                      class="icon-picker-card pa-3"
                      hover
                    >
                      <div class="d-flex align-center justify-space-between">
                        <div class="d-flex align-center">
                          <v-avatar
                            :color="categoryForm.color"
                            size="36"
                            class="mr-3"
                          >
                            <v-icon color="white" size="20">
                              {{ categoryForm.icon || "mdi-tag" }}
                            </v-icon>
                          </v-avatar>
                          <div>
                            <div class="text-body-2 font-weight-medium">
                              {{ categoryForm.icon }}
                            </div>
                            <div class="text-caption text-medium-emphasis">
                              {{ $t("categories.clickToChange") }}
                            </div>
                          </div>
                        </div>
                        <v-icon>mdi-chevron-down</v-icon>
                      </div>
                    </v-card>
                  </template>
                  <v-card>
                    <v-card-title class="text-subtitle-1">
                      {{ $t("categories.selectIcon") }}
                    </v-card-title>
                    <v-divider />
                    <v-card-text class="pa-3">
                      <div class="icon-grid mb-3">
                        <v-btn
                          v-for="icon in commonIcons"
                          :key="icon"
                          :variant="
                            categoryForm.icon === icon ? 'tonal' : 'text'
                          "
                          :color="
                            categoryForm.icon === icon ? 'primary' : undefined
                          "
                          size="large"
                          class="icon-option"
                          :class="{ 'icon-in-use': isIconInUse(icon) }"
                          @click="categoryForm.icon = icon"
                        >
                          <v-icon size="22">{{ icon }}</v-icon>
                          <v-icon
                            v-if="isIconInUse(icon)"
                            size="12"
                            class="icon-in-use-badge"
                          >
                            mdi-check-circle
                          </v-icon>
                        </v-btn>
                      </div>
                      <v-divider class="mb-3" />
                      <v-text-field
                        v-model="categoryForm.icon"
                        :label="$t('categories.customIcon')"
                        :placeholder="$t('categories.iconPlaceholder')"
                        density="compact"
                        variant="outlined"
                        :hint="$t('categories.customIconHint')"
                        persistent-hint
                      >
                        <template #prepend-inner>
                          <v-icon size="20">{{
                            categoryForm.icon || "mdi-tag"
                          }}</v-icon>
                        </template>
                      </v-text-field>
                    </v-card-text>
                  </v-card>
                </v-menu>
              </div>

              <!-- Preview -->
              <v-card variant="outlined" class="pa-3">
                <div class="text-caption mb-2">
                  {{ $t("categories.preview") }}
                </div>
                <div class="d-flex align-center">
                  <v-avatar :color="categoryForm.color" size="40" class="mr-3">
                    <v-icon color="white">{{
                      categoryForm.icon || "mdi-tag"
                    }}</v-icon>
                  </v-avatar>
                  <div>
                    <div class="font-weight-medium">
                      {{ categoryForm.name || $t("categories.name") }}
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      {{ categoryForm.color }} • {{ categoryForm.icon }}
                    </div>
                  </div>
                </div>
              </v-card>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" @click="categoryDialogOpen = false">
              {{ $t("common.cancel") }}
            </v-btn>
            <v-btn color="primary" variant="flat" @click="saveCategory">
              {{ $t("common.save") }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Delete confirmation -->
      <v-dialog v-model="deleteDialogOpen" max-width="400">
        <v-card>
          <v-card-title>{{ $t("categories.deleteQuestion") }}</v-card-title>
          <v-card-text>
            {{
              $t("admin.confirmDeleteCategory", {
                name: deletingCategory?.name,
              })
            }}
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" @click="deleteDialogOpen = false">
              {{ $t("common.cancel") }}
            </v-btn>
            <v-btn color="error" variant="flat" @click="handleDeleteCategory">
              {{ $t("common.delete") }}
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
import { useAuth } from "@/composables/useAuth";
import { useCategories } from "@/composables/useCategories";
import type { Category } from "@/types/database";

const { t } = useI18n();

const { isAdmin } = useAuth();
const { categories, createCategory, updateCategory, deleteCategory } =
  useCategories();
const showSnackbar =
  inject<(msg: string, color?: string) => void>("showSnackbar");

const categoryDialogOpen = ref(false);
const deleteDialogOpen = ref(false);
const categoryFormRef = ref();
const editingCategory = ref<Category | null>(null);
const deletingCategory = ref<Category | null>(null);

const categoryForm = reactive({
  name: "",
  color: "#607D8B",
  icon: "mdi-tag",
});

const rules = {
  required: (v: string) => !!v || t("common.required"),
};

// Common colors for quick selection
const commonColors = [
  ["#F44336", "#E91E63", "#9C27B0", "#673AB7"],
  ["#3F51B5", "#2196F3", "#03A9F4", "#00BCD4"],
  ["#009688", "#4CAF50", "#8BC34A", "#CDDC39"],
  ["#FFEB3B", "#FFC107", "#FF9800", "#FF5722"],
  ["#795548", "#9E9E9E", "#607D8B", "#000000"],
];

// Common icons for categories
const commonIcons = [
  "mdi-tag",
  "mdi-star",
  "mdi-heart",
  "mdi-home",
  "mdi-briefcase",
  "mdi-school",
  "mdi-dumbbell",
  "mdi-book",
  "mdi-lightbulb",
  "mdi-target",
  "mdi-rocket",
  "mdi-trophy",
  "mdi-flag",
  "mdi-chart-line",
  "mdi-brain",
  "mdi-account-group",
  "mdi-cash",
  "mdi-camera",
  "mdi-music",
  "mdi-gamepad",
  "mdi-airplane",
  "mdi-hammer",
  "mdi-palette",
  "mdi-laptop",
  "mdi-pizza",
  "mdi-tree",
  "mdi-run",
  "mdi-meditation",
  "mdi-yoga",
  "mdi-weight-lifter",
  "mdi-bike",
  "mdi-food-apple",
  "mdi-water",
  "mdi-sleep",
  "mdi-coffee",
  "mdi-tea",
  "mdi-shopping",
];

function openCategoryDialog(category?: Category) {
  editingCategory.value = category || null;
  if (category) {
    categoryForm.name = category.name;
    categoryForm.color = category.color;
    categoryForm.icon = category.icon;
  } else {
    categoryForm.name = "";
    categoryForm.color = "#607D8B";
    categoryForm.icon = "mdi-tag";
  }
  categoryDialogOpen.value = true;
}

function isIconInUse(icon: string): boolean {
  if (!categories.value) return false;
  // Don't mark as in-use if it's the current category being edited
  return categories.value.some(
    (cat) => cat.icon === icon && cat.id !== editingCategory.value?.id,
  );
}

async function saveCategory() {
  const { valid } = await categoryFormRef.value.validate();
  if (!valid) return;

  try {
    if (editingCategory.value) {
      await updateCategory({
        id: editingCategory.value.id,
        name: categoryForm.name,
        color: categoryForm.color,
        icon: categoryForm.icon,
      });
      showSnackbar?.(t("admin.categoryUpdated"), "success");
    } else {
      await createCategory({
        name: categoryForm.name,
        color: categoryForm.color,
        icon: categoryForm.icon,
        sort_order: (categories.value?.length || 0) + 1,
        team_id: null,
      });
      showSnackbar?.(t("admin.categoryCreated"), "success");
    }
    categoryDialogOpen.value = false;
  } catch (error: any) {
    showSnackbar?.(error.message || t("common.error"), "error");
  }
}

function confirmDeleteCategory(category: Category) {
  deletingCategory.value = category;
  deleteDialogOpen.value = true;
}

async function handleDeleteCategory() {
  if (!deletingCategory.value) return;
  try {
    await deleteCategory(deletingCategory.value.id);
    showSnackbar?.(t("admin.categoryDeleted"), "success");
  } catch (error: any) {
    showSnackbar?.(error.message || t("common.error"), "error");
  }
  deleteDialogOpen.value = false;
}
</script>

<style scoped>
.color-preview {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.2);
}

.color-preview-large {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  border: 2px solid rgba(var(--v-theme-on-surface), 0.12);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.color-picker-card,
.icon-picker-card {
  cursor: pointer;
  transition: all 0.2s ease;
}

.color-picker-card:hover,
.icon-picker-card:hover {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.04);
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
  max-height: 350px;
  overflow-y: auto;
}

@media (max-width: 600px) {
  .icon-grid {
    grid-template-columns: repeat(5, 1fr);
    gap: 6px;
    max-height: 300px;
  }

  .icon-option {
    min-width: 48px !important;
    height: 48px !important;
  }
}

.icon-option {
  aspect-ratio: 1;
  min-width: 56px !important;
  height: 56px !important;
  position: relative;
}

.icon-option.icon-in-use {
  opacity: 0.5;
}

.icon-in-use-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgb(var(--v-theme-surface));
  border-radius: 50%;
  color: rgb(var(--v-theme-success));
}
</style>
