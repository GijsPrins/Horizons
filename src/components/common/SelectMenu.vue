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
        class="d-none d-sm-flex select-menu-btn"
      >
        <v-icon start>{{ icon }}</v-icon>
        <span class="text-truncate">{{ selectedLabel }}</span>
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
import { computed } from 'vue';

export interface SelectOption {
  value: string
  label: string
}

const props = defineProps<{
  modelValue: string
  label: string
  icon: string
  options: SelectOption[]
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()

const selectedLabel = computed(() => {
  const selected = props.options.find(opt => opt.value === props.modelValue);
  return selected?.label || props.label;
});
</script>

<style scoped>
.select-menu-btn {
  max-width: 200px;
}

.select-menu-btn .text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
