<template>
  <DefaultLayout>
    <v-container fluid class="pa-4">
      <h1 class="text-h4 font-weight-bold mb-4">Beheer</h1>

      <!-- Not admin warning -->
      <v-alert
        v-if="!isAdmin"
        type="warning"
        variant="tonal"
        class="mb-4"
      >
        Je hebt geen toegang tot deze pagina.
      </v-alert>

      <v-row v-else>
        <v-col cols="12" md="8">
          <!-- Global categories -->
          <v-card elevation="0" border>
            <v-card-title class="d-flex align-center">
              <v-icon start>mdi-tag-multiple</v-icon>
              Globale categorieën
              <v-spacer />
              <v-btn
                size="small"
                color="primary"
                @click="openCategoryDialog()"
              >
                <v-icon start>mdi-plus</v-icon>
                Toevoegen
              </v-btn>
            </v-card-title>
            <v-card-text>
              <v-list v-if="categories && categories.length > 0">
                <v-list-item
                  v-for="category in categories"
                  :key="category.id"
                >
                  <template #prepend>
                    <v-avatar :color="category.color" size="36">
                      <v-icon size="18">{{ category.icon }}</v-icon>
                    </v-avatar>
                  </template>

                  <v-list-item-title>{{ category.name }}</v-list-item-title>
                  <v-list-item-subtitle>
                    {{ category.color }} &bull; {{ category.icon }}
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
                Geen categorieën gevonden.
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Category Dialog -->
      <v-dialog v-model="categoryDialogOpen" max-width="500">
        <v-card>
          <v-card-title>
            {{ editingCategory ? 'Categorie bewerken' : 'Nieuwe categorie' }}
          </v-card-title>
          <v-card-text>
            <v-form ref="categoryFormRef">
              <v-text-field
                v-model="categoryForm.name"
                label="Naam"
                :rules="[rules.required]"
                class="mb-2"
              />
              <v-text-field
                v-model="categoryForm.color"
                label="Kleur (hex)"
                placeholder="#4CAF50"
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
                label="Icoon (mdi-...)"
                placeholder="mdi-heart"
                :rules="[rules.required]"
              >
                <template #prepend>
                  <v-icon>{{ categoryForm.icon || 'mdi-tag' }}</v-icon>
                </template>
              </v-text-field>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" @click="categoryDialogOpen = false">
              Annuleren
            </v-btn>
            <v-btn color="primary" variant="flat" @click="saveCategory">
              Opslaan
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Delete confirmation -->
      <v-dialog v-model="deleteDialogOpen" max-width="400">
        <v-card>
          <v-card-title>Categorie verwijderen?</v-card-title>
          <v-card-text>
            Weet je zeker dat je "{{ deletingCategory?.name }}" wilt verwijderen?
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" @click="deleteDialogOpen = false">
              Annuleren
            </v-btn>
            <v-btn color="error" variant="flat" @click="handleDeleteCategory">
              Verwijderen
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { ref, reactive, inject } from 'vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { useAuth } from '@/composables/useAuth'
import { useCategories } from '@/composables/useCategories'
import type { Category } from '@/types/database'

const { isAdmin } = useAuth()
const { categories, createCategory, updateCategory, deleteCategory } = useCategories()
const showSnackbar = inject<(msg: string, color?: string) => void>('showSnackbar')

const categoryDialogOpen = ref(false)
const deleteDialogOpen = ref(false)
const categoryFormRef = ref()
const editingCategory = ref<Category | null>(null)
const deletingCategory = ref<Category | null>(null)

const categoryForm = reactive({
  name: '',
  color: '#607D8B',
  icon: 'mdi-tag'
})

const rules = {
  required: (v: string) => !!v || 'Dit veld is verplicht'
}

function openCategoryDialog(category?: Category) {
  editingCategory.value = category || null
  if (category) {
    categoryForm.name = category.name
    categoryForm.color = category.color
    categoryForm.icon = category.icon
  } else {
    categoryForm.name = ''
    categoryForm.color = '#607D8B'
    categoryForm.icon = 'mdi-tag'
  }
  categoryDialogOpen.value = true
}

async function saveCategory() {
  const { valid } = await categoryFormRef.value.validate()
  if (!valid) return

  try {
    if (editingCategory.value) {
      await updateCategory({
        id: editingCategory.value.id,
        name: categoryForm.name,
        color: categoryForm.color,
        icon: categoryForm.icon
      })
      showSnackbar?.('Categorie bijgewerkt!', 'success')
    } else {
      await createCategory({
        name: categoryForm.name,
        color: categoryForm.color,
        icon: categoryForm.icon,
        sort_order: (categories.value?.length || 0) + 1,
        team_id: null
      })
      showSnackbar?.('Categorie aangemaakt!', 'success')
    }
    categoryDialogOpen.value = false
  } catch (error: any) {
    showSnackbar?.(error.message || 'Er is een fout opgetreden', 'error')
  }
}

function confirmDeleteCategory(category: Category) {
  deletingCategory.value = category
  deleteDialogOpen.value = true
}

async function handleDeleteCategory() {
  if (!deletingCategory.value) return
  try {
    await deleteCategory(deletingCategory.value.id)
    showSnackbar?.('Categorie verwijderd', 'success')
  } catch (error: any) {
    showSnackbar?.(error.message || 'Er is een fout opgetreden', 'error')
  }
  deleteDialogOpen.value = false
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
