<template>
  <div class="min-h-screen" style="background: var(--page-bg); color: var(--text-primary); transition: background 0.4s ease, color 0.3s ease;">

    <!-- Animated Background Layer -->
    <div class="bg-deco-layer">
      <div class="breath-orb breath-orb-1"></div>
      <div class="breath-orb breath-orb-2"></div>
      <div class="breath-orb breath-orb-3"></div>
      <div class="deco-ring ring-1"></div>
      <div class="deco-ring ring-2"></div>
      <div class="deco-ring ring-3"></div>
      <div class="deco-line line-1"></div>
      <div class="deco-line line-2"></div>
      <div class="deco-line line-3"></div>
      <div class="deco-line line-4"></div>
      <div class="deco-frame frame-1"></div>
      <div class="deco-frame frame-2"></div>
      <div class="deco-frame frame-3"></div>
      <div class="deco-corner corner-tl"></div>
      <div class="deco-corner corner-tr"></div>
      <div class="deco-corner corner-bl"></div>
      <div class="deco-corner corner-br"></div>
      <div class="deco-scanline"></div>
      <div class="deco-scanline"></div>
    </div>
    <!-- Theme toggle -->
    <button
      @click="themeStore.toggleTheme()"
      class="fixed bottom-6 right-6 z-[100] w-11 h-11 rounded-full flex items-center justify-center text-lg shadow-lg border transition-all duration-300 hover:scale-115 cursor-pointer"
      :style="{
        background: 'var(--card-bg)',
        borderColor: 'var(--border)',
        boxShadow: 'var(--card-shadow)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }"
      :title="themeStore.currentTheme === 'bento' ? 'Switch to Cyberpunk' : 'Switch to Bento'"
    >
      <span v-if="themeStore.currentTheme === 'bento'">🌙</span>
      <span v-else>☀️</span>
    </button>

    <!-- Page content - plain router-view (no transition to avoid lazy-load blank screen) -->
    <div style="position: relative; z-index: 1;">
      <router-view :key="$route.fullPath" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useThemeStore } from './stores/theme'
const themeStore = useThemeStore()
</script>
