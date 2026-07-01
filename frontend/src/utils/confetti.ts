// Canvas confetti burst
export function launchConfetti() {
  const canvas = document.createElement('canvas')
  canvas.style.cssText = 'position:fixed;inset:0;z-index:9999;pointer-events:none'
  document.body.appendChild(canvas)
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  const ctx = canvas.getContext('2d')!
  const particles: { x: number; y: number; vx: number; vy: number; w: number; h: number; color: string; life: number; rot: number; rotV: number }[] = []
  const colors = ['#FF6B6B', '#FFE66D', '#4ECDC4', '#FF9FF3', '#54A0FF', '#5F27CD', '#01A3A4', '#F368E0', '#86C440', '#00FF88']

  for (let i = 0; i < 150; i++) {
    particles.push({
      x: canvas.width / 2 + (Math.random() - 0.5) * 40,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 16,
      vy: -Math.random() * 14 - 4,
      w: 6 + Math.random() * 10,
      h: 4 + Math.random() * 8,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 1,
      rot: Math.random() * 360,
      rotV: (Math.random() - 0.5) * 12,
    })
  }

  let start: number | null = null
  function animate(ts: number) {
    if (!start) start = ts
    const elapsed = (ts - start) / 1000
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    let alive = false
    particles.forEach(p => {
      p.life = Math.max(0, 1 - elapsed / 2.5)
      if (p.life <= 0) return
      alive = true
      p.x += p.vx * 0.6
      p.y += p.vy * 0.6 + (1 - p.life) * 3
      p.vy += 0.15
      p.rot += p.rotV
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate((p.rot * Math.PI) / 180)
      ctx.globalAlpha = p.life
      ctx.fillStyle = p.color
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
      ctx.restore()
    })
    if (alive && elapsed < 3) requestAnimationFrame(animate)
    else { canvas.remove() }
  }
  requestAnimationFrame(animate)
}
