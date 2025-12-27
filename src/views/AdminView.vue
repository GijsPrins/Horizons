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
      <v-dialog v-model="categoryDialogOpen" max-width="500">
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
                class="mb-2"
              />
              <v-text-field
                v-model="categoryForm.color"
                :label="$t('categories.colorHex')"
                :placeholder="$t('categories.colorPlaceholder')"
                :rules="[rules.required]"
                class="mb-2"
              >
                <template #prepend>
                  <div
                    class="color-preview"
                    :style="{ backgroundColor: categoryForm.color }"
                  />
                </template>
              </v-text-field>
              <v-text-field
                v-model="categoryForm.icon"
                :label="$t('categories.iconMdi')"
                :placeholder="$t('categories.iconPlaceholder')"
                :rules="[rules.required]"
              >
                <template #prepend>
                  <v-icon>{{ categoryForm.icon || "mdi-tag" }}</v-icon>
                </template>
              </v-text-field>
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
</style>
