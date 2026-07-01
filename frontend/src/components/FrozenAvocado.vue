<template>
  <div class="frozen-wrap">
    <div class="avo-container">
      <!-- Avocado -->
      <div class="avo-body">
        <span class="avo-emoji">🥑</span>
      </div>
      <!-- Ice shell - bottom 1/3 -->
      <div class="ice-shell" :class="{ cracking: crackFlash }">
        <div class="ice-surface"></div>
        <div class="ice-crack ck1"></div>
        <div class="ice-crack ck2"></div>
        <div class="ice-crack ck3"></div>
        <div class="ice-frost"></div>
      </div>
      <!-- Melt edge glow -->
      <div class="melt-edge"></div>
      <!-- Drips -->
      <div class="drips">
        <span class="drip d1">💧</span>
        <span class="drip d2">💧</span>
        <span class="drip d3">💧</span>
      </div>
    </div>
    <p class="ice-status">🧊 冰封还剩 <strong>{{ daysRemaining }}</strong> 天</p>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{ daysRemaining: number; fireLevel: number }>()
const crackFlash = ref(false)

watch(() => props.fireLevel, () => {
  crackFlash.value = true
  setTimeout(() => crackFlash.value = false, 400)
})
</script>

<style scoped>
.frozen-wrap {
  display: flex; flex-direction: column; align-items: center; gap: 10px;
}

.avo-container {
  position: relative;
  width: clamp(140px, 35vw, 180px); height: clamp(140px, 35vw, 180px);
  display: flex; align-items: center; justify-content: center;
}

.avo-body {
  position: relative; z-index: 2;
  filter: drop-shadow(0 4px 12px rgba(0,0,0,0.08));
}
.avo-emoji {
  font-size: 110px;
  animation: gentleFloat 5s ease-in-out infinite;
}
@keyframes gentleFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

/* Ice shell - bottom third */
.ice-shell {
  position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%);
  width: clamp(90px, 24vw, 120px); height: clamp(40px, 10vw, 55px);
  background: linear-gradient(to top,
    rgba(180, 215, 240, 0.75) 0%,
    rgba(200, 230, 250, 0.55) 40%,
    rgba(220, 240, 255, 0.25) 75%,
    transparent 100%
  );
  border-radius: 30px 30px 15px 15px;
  z-index: 3;
  box-shadow:
    0 -2px 8px rgba(180,215,240,0.3),
    inset 0 2px 6px rgba(255,255,255,0.3);
  transition: opacity 0.3s ease;
}

.ice-surface {
  position: absolute; inset: 0; border-radius: inherit;
  background: linear-gradient(180deg,
    rgba(255,255,255,0.35) 0%,
    transparent 40%
  );
}

/* Cracks */
.ice-crack {
  position: absolute;
  background: rgba(255,255,255,0.9);
  border-radius: 1px;
  opacity: 0.5;
  transition: opacity 0.3s ease;
}
.ck1 {
  top: 6px; left: 30%; width: 1.5px; height: 18px;
  transform: rotate(-15deg);
}
.ck2 {
  top: 10px; right: 25%; width: 1px; height: 24px;
  transform: rotate(20deg);
}
.ck3 {
  top: 4px; left: 55%; width: 1px; height: 14px;
  transform: rotate(-8deg);
}
.ice-shell.cracking .ice-crack {
  opacity: 1;
}

/* Frost layer */
.ice-frost {
  position: absolute; inset: 0; border-radius: inherit;
  background:
    radial-gradient(circle at 25% 30%, rgba(255,255,255,0.4) 0%, transparent 30%),
    radial-gradient(circle at 65% 25%, rgba(255,255,255,0.3) 0%, transparent 25%),
    radial-gradient(circle at 45% 50%, rgba(255,255,255,0.25) 0%, transparent 20%);
  pointer-events: none;
}

/* Melt edge glow */
.melt-edge {
  position: absolute; bottom: 62px; left: 50%; transform: translateX(-50%);
  width: clamp(100px, 26vw, 130px); height: 3px;
  background: linear-gradient(90deg,
    transparent, rgba(255,255,255,0.7), rgba(180,220,245,0.9),
    rgba(255,255,255,0.7), transparent
  );
  border-radius: 2px;
  z-index: 4;
  box-shadow: 0 0 10px rgba(180,215,245,0.5);
}

/* Drips */
.drips { position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); z-index: 5; }
.drip {
  position: absolute; bottom: 0; font-size: 14px;
  animation: dripDown 2.2s ease-in infinite;
  opacity: 0;
}
.d1 { left: 10px; animation-delay: 0s; }
.d2 { left: 40px; animation-delay: 0.8s; }
.d3 { left: 70px; animation-delay: 1.6s; }
@keyframes dripDown {
  0% { transform: translateY(0); opacity: 0; }
  20% { transform: translateY(0); opacity: 0.8; }
  60% { transform: translateY(28px); opacity: 0.4; }
  100% { transform: translateY(40px); opacity: 0; }
}

.ice-status {
  font-size: 0.85rem; color: #6B9DB5;
  font-family: var(--font-heading);
  font-weight: 500;
}
.ice-status strong {
  color: #4A8BA8; font-size: 1.1rem;
}
</style>
