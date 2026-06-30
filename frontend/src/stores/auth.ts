import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getAuthStatus, type AuthStatus } from '../api'

export const useAuthStore = defineStore('auth', () => {
  const isVisitorPassed = ref(false)
  const isAuthor = ref(false)
  const authorDisplayName = ref('')
  const loading = ref(true)

  async function checkAuth() {
    try {
      const status: AuthStatus = await getAuthStatus()
      isVisitorPassed.value = status.isVisitorPassed
      isAuthor.value = status.isAuthor
      authorDisplayName.value = status.author?.displayName || ''
    } catch {
      isVisitorPassed.value = false
      isAuthor.value = false
      authorDisplayName.value = ''
    } finally {
      loading.value = false
    }
  }

  function setVisitorPassed() {
    isVisitorPassed.value = true
  }

  function setAuthor(name: string) {
    isAuthor.value = true
    authorDisplayName.value = name
  }

  function clearAuthor() {
    isAuthor.value = false
    authorDisplayName.value = ''
  }

  return {
    isVisitorPassed,
    isAuthor,
    authorDisplayName,
    loading,
    checkAuth,
    setVisitorPassed,
    setAuthor,
    clearAuthor,
  }
})
