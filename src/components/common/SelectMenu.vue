<template>
  <v-menu>
    <template #activator="{ props }">
      <v-btn
        v-bind="props"
        variant="outlined"
        :icon="icon"
        class="d-sm-none"
      />
      <v-btn
        v-bind="props"
        variant="outlined"
        class="d-none d-sm-flex"
      >
        <v-icon start>{{ icon }}</v-icon>
        {{ label }}
      </v-btn>
    </template>
    <v-list density="compact">
      <v-list-item
        v-for="option in options"
        :key="option.value"
        :active="modelValue === option.value"
        @click="$emit('update:modelValue', option.value)"
      >
        <template v-if="modelValue === option.value" #prepend>
          <v-icon>mdi-check</v-icon>
        </template>
        <v-list-item-title>{{ option.label }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script setup lang="ts">
export interface SelectOption {
  value: string
  label: string
}

defineProps<{
  modelValue: string
  label: string
  icon: string
  options: SelectOption[]
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>
