<template>
  <div class="text-center">
    <div v-if="isFinished" class="space-y-4">
      <h2 class="text-3xl md:text-5xl font-light text-rose-400 tracking-wider">
        欢迎回来。
      </h2>
      <p class="text-lg text-slate-500">
        冷却结束，故事继续。
      </p>
    </div>

    <div v-else class="space-y-6">
      <p class="text-base md:text-lg text-slate-400 tracking-wide">
        距离回归还有
      </p>
      <div class="flex items-center justify-center gap-2 md:gap-4">
        <DigitBox :value="days" label="天" />
        <span class="text-2xl md:text-4xl font-thin text-slate-300 -mt-6">:</span>
        <DigitBox :value="hours" label="时" />
        <span class="text-2xl md:text-4xl font-thin text-slate-300 -mt-6">:</span>
        <DigitBox :value="minutes" label="分" />
        <span class="text-2xl md:text-4xl font-thin text-slate-300 -mt-6">:</span>
        <DigitBox :value="seconds" label="秒" />
      </div>
      <p class="text-sm text-slate-400">
        解封时间：2026年07月11日 15:57:15
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

let timer: ReturnType<typeof setInterval> | null = null
let targetMs = 0

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

onMounted(async () => {
  try {
    const data = await getCountdown()
    targetMs = new Date(data.releaseTime).getTime()
  } catch {
    // fallback: hardcoded target
    targetMs = new Date('2026-07-11T15:57:15+08:00').getTime()
  }
  update()
  timer = setInterval(update, 1000)
})

onUnmounted(() => {
  if (timer) { clearInterval(timer); timer = null }
})
</script>