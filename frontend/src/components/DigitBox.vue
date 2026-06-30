<template>
  <div class="flex flex-col items-center">
    <div class="countdown-digit w-16 h-20 md:w-24 md:h-28 glass rounded-2xl flex items-center justify-center shadow-sm">
      <span class="text-3xl md:text-5xl font-light text-slate-700 tabular-nums">
        {{ padded }}
      </span>
    </div>
    <span class="text-xs md:text-sm text-slate-400 mt-2 tracking-wider">{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  value: number
  label: string
}>()

const padded = computed(() => String(props.value).padStart(2, '0'))
</script>
