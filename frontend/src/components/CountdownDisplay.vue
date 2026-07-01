<template>
  <div class="icf-root" ref="el">
    <div v-if="isFinished" class="icf-done">
      <div class="icf-done-emoji">🥑</div>
      <h2 class="icf-done-title">解封啦！！</h2>
      <p class="icf-done-sub">冰全化了，火焰完成了使命 🔥</p>
    </div>

    <div v-else class="icf-active">
      <!-- 1. ICE AVOCADO -->
      <FrozenAvocado :days-remaining="days" :fire-level="fireLevel" />

      <!-- 2. FIRE going upward (visual connection) -->
      <div class="fire-connector">
        <div class="fire-connector-flame" :style="{ height: (12 + fireLevel * 2) + 'px' }"></div>
        <div class="fire-connector-flame flame2" :style="{ height: (8 + fireLevel * 1.5) + 'px' }"></div>
        <div class="fire-connector-flame flame3" :style="{ height: (5 + fireLevel * 1) + 'px' }"></div>
      </div>

      <!-- 3. COUNTDOWN (fire digits) -->
      <div class="icf-digits" :style="{ transform: 'scale(' + scale + ')' }">
        <DigitBox :value="days" label="天" :fire-level="fireLevel" />
        <span class="icf-colon">:</span>
        <DigitBox :value="hours" label="时" :fire-level="fireLevel" />
        <span class="icf-colon _d2">:</span>
        <DigitBox :value="minutes" label="分" :fire-level="fireLevel" />
        <span class="icf-colon _d3">:</span>
        <DigitBox :value="seconds" label="秒" :fire-level="fireLevel" />
      </div>

      <!-- 4. ADD FIRE BUTTON -->
      <div class="icf-btn-area">
        <button @click="addFire" class="icf-btn" :class="{ maxed: fireLevel >= maxFire }">
          <span class="icf-btn-icon">🔥</span>
          <span class="icf-btn-label">{{ fireLevel >= maxFire ? '火力全开！' : '添点火' }}</span>
          <span class="icf-btn-count">x{{ fireLevel }}</span>
        </button>
        <p class="icf-btn-hint" v-if="fireLevel >= maxFire">🔥 已到极限！火焰在全力融化冰块</p>
        <p class="icf-btn-hint" v-else-if="fireLevel > 20">🔥 火势凶猛！冰块在加速融化</p>
        <p class="icf-btn-hint" v-else-if="fireLevel > 10">🔥 火越烧越旺了</p>
        <p class="icf-btn-hint" v-else>👆 点一下，火势更旺，融化更快</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import DigitBox from './DigitBox.vue'
import FrozenAvocado from './FrozenAvocado.vue'
import { getCountdown } from '../api'
import { launchConfetti } from '../utils/confetti'
import { playCelebrate, playPop } from '../utils/sound'

const days = ref(0); const hours = ref(0); const minutes = ref(0); const seconds = ref(0)
const isFinished = ref(false); const scale = ref(1); const el = ref<HTMLElement | null>(null)
let timer: ReturnType<typeof setInterval> | null = null
let targetMs = 0
let confettiLaunched = false

const fireLevel = ref(0)
const maxFire = 30

try {
  const saved = localStorage.getItem('catbox_fire')
  if (saved) fireLevel.value = Math.min(maxFire, parseInt(saved) || 0)
} catch {}

function addFire() {
  if (fireLevel.value >= maxFire) return
  fireLevel.value++
  playPop()
  try { localStorage.setItem('catbox_fire', String(fireLevel.value)) } catch {}
}

function update() {
  const diff = targetMs - Date.now()
  if (diff <= 0) {
    if (!isFinished.value && !confettiLaunched) {
      confettiLaunched = true
      setTimeout(() => { launchConfetti(); playCelebrate() }, 400)
    }
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
  const d = Math.abs(rect.top + rect.height/2 - window.innerHeight/2)
  scale.value = 0.82 + (1 - Math.min(d / (window.innerHeight/2), 1)) * 0.18
}

onMounted(async () => {
  try { const d = await getCountdown(); targetMs = new Date(d.releaseTime).getTime() }
  catch { targetMs = new Date('2026-07-11T15:57:15+08:00').getTime() }
  update()
  timer = setInterval(update, 1000)
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})
onUnmounted(() => {
  if (timer) clearInterval(timer)
  window.removeEventListener('scroll', onScroll)
})
</script>

<style scoped>
.icf-root { text-align: center; user-select: none; padding: 1.5rem 0.5rem; }

.icf-done { padding: 2rem; }
.icf-done-emoji { font-size: 4rem; animation: float 4s ease-in-out infinite; }
.icf-done-title {
  font-family: var(--font-heading); font-size: 2rem; font-weight: 800;
  color: var(--accent); margin-top: 0.5rem;
}
.icf-done-sub { color: var(--text-secondary); font-size: 0.95rem; }

.icf-active {
  display: flex; flex-direction: column; align-items: center;
  gap: 6px;
}

/* Fire connector - flames reaching up toward ice */
.fire-connector {
  position: relative; width: clamp(140px, 40vw, 200px); height: clamp(20px, 5vw, 30px);
  display: flex; justify-content: center; gap: 20px;
}
.fire-connector-flame {
  width: 10px;
  background: linear-gradient(to top, #FF4500, #FF8C42 40%, transparent);
  border-radius: 50% 50% 0 0;
  animation: connFlame 0.5s ease-in-out infinite alternate;
  transition: height 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.flame2 { animation-delay: 0.15s; width: 7px; }
.flame3 { animation-delay: 0.3s; width: 5px; }
@keyframes connFlame {
  0% { transform: scaleY(0.8); opacity: 0.6; }
  100% { transform: scaleY(1.2); opacity: 1; }
}

/* Digits row */
.icf-digits {
  display: flex; align-items: center; justify-content: center;
  gap: clamp(6px, 2vw, 14px);
  transition: transform 0.15s ease-out;
  margin-top: 4px;
}

.icf-colon {
  font-family: var(--font-heading); font-size: clamp(1.8rem, 5vw, 3.5rem);
  font-weight: 200; color: #CC7744; margin-top: -1.5rem;
  animation: colPulse 1.8s ease-in-out infinite;
}
._d2 { animation-delay: 0.5s; }
._d3 { animation-delay: 1s; }
@keyframes colPulse {
  0%, 100% { opacity: 0.25; }
  50% { opacity: 1; }
}

/* Button area */
.icf-btn-area {
  margin-top: 6px;
  display: flex; flex-direction: column; align-items: center; gap: 6px;
}

.icf-btn {
  display: inline-flex; align-items: center; gap: 10px;
  padding: 10px 26px;
  background: linear-gradient(180deg, #FF6B35 0%, #E0451A 100%);
  border: 2px solid #FF9966;
  border-radius: 50px;
  color: #FFF;
  font-family: var(--font-heading);
  font-size: 0.95rem; font-weight: 700;
  cursor: pointer;
  box-shadow:
    0 4px 0 #B83515,
    0 6px 20px rgba(255,100,30,0.3);
  transition: all 0.15s ease;
  position: relative;
  top: 0;
}

.icf-btn:hover {
  box-shadow:
    0 6px 0 #B83515,
    0 10px 28px rgba(255,100,30,0.45);
  top: -2px;
}

.icf-btn:active {
  box-shadow:
    0 1px 0 #B83515,
    0 2px 8px rgba(255,100,30,0.2);
  top: 3px;
}

.icf-btn.maxed {
  background: linear-gradient(180deg, #CC3300 0%, #992200 100%);
  border-color: #FF6633;
  cursor: default;
  box-shadow: 0 2px 0 #661100, 0 4px 16px rgba(255,40,0,0.4);
}
.icf-btn.maxed:hover { top: 0; }
.icf-btn.maxed:active { top: 0; }

.icf-btn-icon { font-size: 1.2rem; }
.icf-btn-label { letter-spacing: 0.05em; }
.icf-btn-count {
  background: rgba(0,0,0,0.2); padding: 2px 10px;
  border-radius: 12px; font-size: 0.78rem;
  font-family: var(--font-mono);
}

.icf-btn-hint {
  font-size: 0.73rem; color: #BB9977; font-style: italic;
}
</style>
