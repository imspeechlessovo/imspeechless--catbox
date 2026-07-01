<template>
  <canvas ref="canvas" class="cursor-canvas"></canvas>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const canvas = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let particles: Particle[] = []
let mouse = { x: -100, y: -100 }
let animId = 0
let w = 0, h = 0

class Particle {
  x: number; y: number; vx: number; vy: number
  life: number; maxLife: number; size: number; opacity: number
  constructor(x: number, y: number) {
    this.x = x; this.y = y
    this.vx = (Math.random() - 0.5) * 1.2
    this.vy = (Math.random() - 0.5) * 1.2
    this.life = 0; this.maxLife = 60 + Math.random() * 80
    this.size = 1.5 + Math.random() * 2.5
    this.opacity = 0.3 + Math.random() * 0.4
  }
  update() {
    this.life++
    this.x += this.vx
    this.y += this.vy
    this.vx *= 0.98
    this.vy *= 0.98
    const dx = mouse.x - this.x, dy = mouse.y - this.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < 120) {
      this.vx += (dx / dist) * 0.15
      this.vy += (dy / dist) * 0.15
    }
  }
  draw(ctx: CanvasRenderingContext2D) {
    const alpha = this.opacity * (1 - this.life / this.maxLife)
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(134,196,64,${alpha})`
    ctx.fill()
  }
  get dead() { return this.life >= this.maxLife }
}

function resize() {
  if (!canvas.value) return
  w = window.innerWidth; h = window.innerHeight
  canvas.value.width = w; canvas.value.height = h
}

function animate() {
  if (!ctx || !canvas.value) return
  ctx.clearRect(0, 0, w, h)
  if (mouse.x > 0 && mouse.y > 0 && Math.random() < 0.3) {
    particles.push(new Particle(mouse.x, mouse.y))
  }
  particles = particles.filter(p => !p.dead)
  particles.forEach(p => { p.update(); p.draw(ctx!) })
  if (particles.length > 40) particles.splice(0, particles.length - 40)
  animId = requestAnimationFrame(animate)
}

function onMouse(e: MouseEvent) { mouse.x = e.clientX; mouse.y = e.clientY }
function onTouch(e: TouchEvent) { if (e.touches[0]) { mouse.x = e.touches[0].clientX; mouse.y = e.touches[0].clientY } }

onMounted(() => {
  if (!canvas.value) return
  ctx = canvas.value.getContext('2d')
  resize()
  window.addEventListener('resize', resize)
  window.addEventListener('mousemove', onMouse, { passive: true })
  window.addEventListener('touchmove', onTouch, { passive: true })
  animate()
})
onUnmounted(() => {
  cancelAnimationFrame(animId)
  window.removeEventListener('resize', resize)
  window.removeEventListener('mousemove', onMouse)
  window.removeEventListener('touchmove', onTouch)
})
</script>

<style scoped>
.cursor-canvas {
  position: fixed; inset: 0; z-index: 0; pointer-events: none;
  opacity: 0.6;
}
</style>
