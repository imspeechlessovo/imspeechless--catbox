<template>
  <div v-if="visible" class="emoji-backdrop" @click.self="$emit('close')">
    <div class="emoji-panel">
      <div class="emoji-grid">
        <button v-for="e in emojis" :key="e" @click="pick(e)" class="emoji-btn">{{ e }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ visible: boolean }>()
const emit = defineEmits<{ close: []; pick: [emoji: string] }>()

const emojis = [
  '\ud83d\ude02', '\ud83d\ude0d', '\ud83d\ude0e', '\ud83e\udd23', '\ud83d\ude2d',
  '\ud83d\ude18', '\ud83d\ude0a', '\ud83e\udd70', '\ud83d\ude0f', '\ud83d\ude1c',
  '\ud83d\udc4d', '\ud83d\udc4e', '\ud83d\udc4f', '\ud83d\udcaa', '\ud83e\udd32',
  '\u2764\ufe0f', '\ud83d\udd25', '\ud83d\udcaf', '\u2728', '\ud83c\udf1f',
  '\ud83e\udd14', '\ud83d\udc40', '\ud83d\ude31', '\ud83d\ude33', '\ud83e\udd2f',
  '\ud83c\udf89', '\ud83c\udf38', '\ud83c\udf3a', '\ud83c\udf08', '\u2600\ufe0f',
  '\ud83d\udc36', '\ud83d\udc31', '\ud83d\udc30', '\ud83e\udd8a', '\ud83e\udd8b',
  '\ud83e\udd51', '\ud83c\udf55', '\u2615', '\ud83c\udf6d', '\ud83c\udf6a',
]

function pick(e: string) {
  emit('pick', e)
  emit('close')
}
</script>

<style scoped>
.emoji-backdrop {
  position: fixed; inset: 0; z-index: 10001;
  display: flex; align-items: flex-end; justify-content: center;
  padding-bottom: 10px;
}
.emoji-panel {
  background: var(--card-bg);
  backdrop-filter: var(--card-blur);
  -webkit-backdrop-filter: var(--card-blur);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 10px;
  box-shadow: 0 -4px 24px rgba(0,0,0,0.12);
  max-width: 320px; width: 100%;
}
.emoji-grid {
  display: grid; grid-template-columns: repeat(8, 1fr); gap: 4px;
}
.emoji-btn {
  width: 36px; height: 36px; font-size: 1.3rem;
  background: none; border: none; border-radius: 8px;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: background 0.15s ease;
}
.emoji-btn:hover { background: var(--surface-hover); }
</style>
