<template>
  <div class="text-center" ref="el">
    <!-- Finished state -->
    <div v-if="isFinished" class="space-y-8 animate-fade-in">
      <div class="text-6xl md:text-8xl mb-6 animate-float">🥑</div>
      <h2 class="text-3xl md:text-5xl font-bold tracking-tight neon-text"
        :style="{ color: 'var(--accent)', fontFamily: 'var(--font-heading)' }">
        欢迎回来！
      </h2>
      <p class="text-lg font-light" :style="{ color: 'var(--text-secondary)' }">
        冷却结束，故事继续 ✨
      </p>
    </div>

    <!-- Countdown -->
    <div v-else class="space-y-10">
      <!-- Avocado emoji -->
      <div class="text-4xl md:text-5xl mb-2 animate-float">🥑</div>

      <!-- Title -->
      <div class="space-y-3">
        <h1 class="text-sm md:text-base font-light tracking-[0.3em] uppercase neon-text"
          :style="{ color: 'var(--text-secondary)', fontFamily: 'var(--font-heading)' }">
          等待作者回归
        </h1>
        <p class="text-xs italic opacity-60" :style="{ color: 'var(--text-muted)' }">
          "这不是结束，只是冷却时间。"
        </p>
      </div>

      <!-- Digits -->
      <div class="flex items-center justify-center gap-2 md:gap-4" :style="{ transform: 'scale(' + scale + ')' }">
        <DigitBox :value="days" label="天" />
        <span class="text-3xl md:text-5xl font-thin -mt-8" :style="{ color: 'var(--text-muted)', animation: 'colon-pulse 1.5s ease-in-out infinite' }">:</span>
        <DigitBox :value="hours" label="时" />
        <span class="text-3xl md:text-5xl font-thin -mt-8" :style="{ color: 'var(--text-muted)', animation: 'colon-pulse 1.5s ease-in-out infinite 0.5s' }">:</span>
        <DigitBox :value="minutes" label="分" />
        <span class="text-3xl md:text-5xl font-thin -mt-8" :style="{ color: 'var(--text-muted)', animation: 'colon-pulse 1.5s ease-in-out infinite 1s' }">:</span>
        <DigitBox :value="seconds" label="秒" />
      </div>

      <!-- Release date -->
      <p class="text-xs md:text-sm font-light tracking-wide" :style="{ color: 'var(--text-muted)' }">
        解封：2026.07.11  15:57:15
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import DigitBox from './DigitBox.vue'
import { getCountdown } from '../api'

const days = ref(0)
const hours = ref(0)
const minutes = ref(0)
const seconds = ref(0)
const isFinished = ref(false)
const scale = ref(1)
const el = ref<HTMLElement | null>(null)

let timer: ReturnType<typeof setInterval> | null = null
let targetMs = 0
let scrollHandler: (() => void) | null = null

function update() {
  const now = Date.now()
  const diff = targetMs - now
  if (diff <= 0) {
    isFinished.value = true
    days.value = hours.value = minutes.value = seconds.value = 0
    if (timer) { clearInterval(timer); timer = null }
    return
  }
  isFinished.value = false
  days.value = Math.floor(diff / 86400000)
  hours.value = Math.floor((diff / 3600000) % 24)
  minutes.value = Math.floor((diff / 60000) % 60)
  seconds.value = Math.floor((diff / 1000) % 60)
}

function onScroll() {
  if (!el.value) return
  const rect = el.value.getBoundingClientRect()
  const windowH = window.innerHeight
  const center = rect.top + rect.height / 2
  const distFromCenter = Math.abs(center - windowH / 2)
  const maxDist = windowH / 2
  const proximity = 1 - Math.min(distFromCenter / maxDist, 1)
  scale.value = 0.85 + proximity * 0.15
}

onMounted(async () => {
  try { const data = await getCountdown(); targetMs = new Date(data.releaseTime).getTime() }
  catch { targetMs = new Date('2026-07-11T15:57:15+08:00').getTime() }
  update()
  timer = setInterval(update, 1000)
  scrollHandler = onScroll
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})

onUnmounted(() => {
  if (timer) { clearInterval(timer); timer = null }
  if (scrollHandler) window.removeEventListener('scroll', scrollHandler)
})
</script>

<style scoped>
@keyframes colon-pulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}
</style>