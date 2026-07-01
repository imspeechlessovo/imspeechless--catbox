import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export type ThemeName = 'bento' | 'cyberpunk'

export const useThemeStore = defineStore('theme', () => {
  const saved = localStorage.getItem('maoxiang-theme') as ThemeName | null
  const currentTheme = ref<ThemeName>(saved === 'cyberpunk' ? 'cyberpunk' : 'bento')

  function applyTheme(theme: ThemeName) {
    document.documentElement.setAttribute('data-theme', theme)
  }

  function toggleTheme() {
    currentTheme.value = currentTheme.value === 'bento' ? 'cyberpunk' : 'bento'
  }

  watch(currentTheme, (t) => {
    localStorage.setItem('maoxiang-theme', t)
    applyTheme(t)
  }, { immediate: true })

  return { currentTheme, toggleTheme, applyTheme }
})