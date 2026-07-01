<template>
  <div class="flex flex-col items-center group">
    <!-- Digit container -->
    <div class="digit-pill" :style="pillStyle">
      <div class="digit-inner">
        <span class="digit-value" :key="padded">{{ padded }}</span>
      </div>
      <!-- Glow ring -->
      <div class="digit-glow"></div>
    </div>
    <!-- Label -->
    <span class="digit-label">{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useThemeStore } from '../stores/theme'

const props = defineProps<{ value: number; label: string }>()
const themeStore = useThemeStore()

const padded = computed(() => String(props.value).padStart(2, '0'))
const isCyber = computed(() => themeStore.currentTheme === 'cyberpunk')

const pillStyle = computed(() => ({
  borderRadius: isCyber.value ? '8px' : '28px',
  boxShadow: isCyber.value
    ? '0 0 20px var(--accent-glow), inset 0 0 10px rgba(0,0,0,0.5)'
    : '0 8px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.5)',
}))
</script>

<style scoped>
.digit-pill {
  position: relative;
  width: clamp(72px, 15vw, 110px);
  height: clamp(88px, 18vw, 130px);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--card-bg);
  border: 1px solid var(--border);
  overflow: hidden;
  transition: all var(--transition-speed) ease;
}
.digit-pill:hover {
  transform: translateY(-4px);
  border-color: var(--accent-glow);
}
.digit-pill:hover .digit-glow {
  opacity: 1;
}

.digit-inner {
  position: relative;
  z-index: 1;
}

.digit-value {
  font-family: var(--font-heading);
  font-size: clamp(2.5rem, 8vw, 4.5rem);
  font-weight: 700;
  color: var(--accent);
  line-height: 1;
  letter-spacing: 0.02em;
  text-shadow: var(--neon-text-shadow);
  transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
  display: inline-block;
}

.digit-glow {
  position: absolute;
  inset: -2px;
  border-radius: inherit;
  background: var(--accent-glow);
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
  z-index: 0;
}

.digit-label {
  margin-top: 12px;
  font-family: var(--font-heading);
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-muted);
  letter-spacing: 0.15em;
  text-transform: uppercase;
  transition: color var(--transition-speed) ease;
}
.group:hover .digit-label {
  color: var(--accent);
}
</style>