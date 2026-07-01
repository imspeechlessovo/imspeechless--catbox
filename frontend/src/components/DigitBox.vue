<template>
  <div class="fd-group">
    <div class="fd-box" :class="{ surge: surging }">
      <!-- Flame going UP from digit -->
      <div class="fd-flames">
        <div class="fd-flame f1" :style="{ height: flameH + '%' }"></div>
        <div class="fd-flame f2" :style="{ height: (flameH * 0.7) + '%' }"></div>
        <div class="fd-flame f3" :style="{ height: (flameH * 0.5) + '%' }"></div>
      </div>
      <!-- Sparks -->
      <span v-for="i in sparkCount" :key="i" class="fd-spark"
        :style="{ left: (15 + i * 18) % 80 + '%', animationDelay: (i * 0.25) + 's' }"
      ></span>
      <!-- Digit -->
      <span class="fd-num" :key="padded">{{ padded }}</span>
      <!-- Heat glow behind -->
      <div class="fd-heat"></div>
    </div>
    <span class="fd-label">{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = defineProps<{ value: number; label: string; fireLevel: number }>()
const padded = computed(() => String(props.value).padStart(2, '0'))
const flameH = computed(() => 24 + props.fireLevel * 3)
const sparkCount = computed(() => Math.min(6, Math.floor(props.fireLevel / 3)))
const surging = ref(false)

watch(() => props.fireLevel, () => {
  surging.value = true
  setTimeout(() => surging.value = false, 500)
})
</script>

<style scoped>
.fd-group { display: flex; flex-direction: column; align-items: center; gap: 10px; }

.fd-box {
  position: relative;
  width: clamp(78px, 15vw, 110px);
  height: clamp(92px, 18vw, 140px);
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(180deg, #2D1A0A 0%, #1A0D03 100%);
  border-radius: 18px;
  overflow: visible;
  box-shadow:
    0 4px 16px rgba(255,100,20,0.15),
    inset 0 2px 0 rgba(255,255,255,0.03);
  border: 1.5px solid rgba(255,120,30,0.2);
  transition: box-shadow 0.3s ease;
}

.fd-box.surge {
  box-shadow:
    0 8px 32px rgba(255,80,10,0.35),
    0 0 60px rgba(255,100,20,0.15);
}

/* Flames going UP from top of box */
.fd-flames {
  position: absolute;
  bottom: 98%; left: 0; right: 0;
  height: 50px; z-index: 0;
  pointer-events: none;
}
.fd-flame {
  position: absolute; bottom: 0;
  border-radius: 50% 50% 0 0;
  animation: fireDance 0.7s ease-in-out infinite alternate;
  transition: height 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.f1 {
  left: 20%; width: 60%;
  background: linear-gradient(to top, #FF4500, #FF6B35 30%, #FF8C42 60%, #FFA500 85%, transparent);
  animation-delay: 0s;
}
.f2 {
  left: 30%; width: 40%;
  background: linear-gradient(to top, #FF6B35, #FF8C42 25%, #FFD700 55%, transparent);
  animation-delay: 0.2s;
}
.f3 {
  left: 35%; width: 30%;
  background: linear-gradient(to top, #FF8C42, #FFA500 20%, #FFF8DC 50%, transparent);
  animation-delay: 0.4s;
}

@keyframes fireDance {
  0% { transform: scaleY(0.9) translateY(0); opacity: 0.8; }
  100% { transform: scaleY(1.15) translateY(-4px); opacity: 1; }
}

.fd-box.surge .fd-flame {
  animation: fireSurge 0.5s ease-out;
}
@keyframes fireSurge {
  0% { transform: scaleY(1.5) translateY(-10px); opacity: 1; }
  100% { transform: scaleY(1) translateY(0); opacity: 0.85; }
}

/* Sparks */
.fd-spark {
  position: absolute; bottom: 85%; width: 3px; height: 3px;
  background: #FFD700; border-radius: 50%;
  animation: sparkUp 1.2s ease-out infinite;
  z-index: 1; pointer-events: none;
}
@keyframes sparkUp {
  0% { transform: translateY(0) scale(1); opacity: 1; }
  100% { transform: translateY(-40px) scale(0); opacity: 0; }
}

/* Number */
.fd-num {
  position: relative; z-index: 2;
  font-family: var(--font-heading);
  font-size: clamp(2.6rem, 8vw, 4.6rem);
  font-weight: 900;
  background: linear-gradient(180deg, #FFE0B0 0%, #FF8C00 40%, #DD5500 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 0 8px rgba(255,100,20,0.5))
          drop-shadow(0 0 20px rgba(255,80,10,0.3));
  transition: filter 0.3s ease;
  animation: numBreathe 2.5s ease-in-out infinite;
}

@keyframes numBreathe {
  0%, 100% { filter: drop-shadow(0 0 8px rgba(255,100,20,0.5)) drop-shadow(0 0 20px rgba(255,80,10,0.3)); }
  50% { filter: drop-shadow(0 0 14px rgba(255,100,20,0.7)) drop-shadow(0 0 30px rgba(255,80,10,0.5)); }
}

.fd-box.surge .fd-num {
  filter: drop-shadow(0 0 18px rgba(255,60,0,0.8))
          drop-shadow(0 0 40px rgba(255,60,0,0.5));
}

.fd-heat {
  position: absolute; inset: -4px;
  background: radial-gradient(ellipse at center top, rgba(255,100,20,0.12) 0%, transparent 70%);
  border-radius: inherit; z-index: 0; pointer-events: none;
}

.fd-label {
  font-family: var(--font-heading); font-size: 0.75rem; font-weight: 600;
  color: #B0A090; letter-spacing: 0.15em; text-transform: uppercase;
}
</style>
