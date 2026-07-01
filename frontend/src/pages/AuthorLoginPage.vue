<template>
  <div style="background: var(--page-bg); min-height: 100vh; transition: background var(--transition-speed) ease;" class="flex flex-col items-center justify-center px-4 py-12">
    <div class="w-full max-w-md mx-auto">
      <router-link to="/" class="inline-flex items-center text-sm mb-8 transition-colors" :style="{ color: 'var(--text-secondary)' }">
        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        算了，回首页
      </router-link>

      <div class="glass rounded-2xl p-6 md:p-8">
        <div class="text-center mb-6">
          <span class="text-4xl">✍️</span>
          <h2 class="text-xl font-light mt-3" :style="{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }">作者本尊驾到</h2>
          <p class="text-xs mt-1" :style="{ color: 'var(--text-muted)' }">牛油果本果请进~</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1" :style="{ color: 'var(--text-primary)' }">账号</label>
            <input v-model="username" type="text"
              class="w-full px-4 py-2.5 rounded-xl text-sm transition-all outline-none"
              :style="{
                background: 'var(--input-bg)',
                color: 'var(--text-primary)',
                border: '1px solid var(--input-border)',
                borderRadius: 'var(--card-radius)',
                fontFamily: 'var(--font-body)',
              }"
              placeholder="输入作者账号"
              @focus="(e: any) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)'; }"
              @blur="(e: any) => { e.target.style.borderColor = 'var(--input-border)'; e.target.style.boxShadow = 'none'; }" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1" :style="{ color: 'var(--text-primary)' }">密码</label>
            <input v-model="password" type="password"
              class="w-full px-4 py-2.5 rounded-xl text-sm transition-all outline-none"
              :style="{
                background: 'var(--input-bg)',
                color: 'var(--text-primary)',
                border: '1px solid var(--input-border)',
                borderRadius: 'var(--card-radius)',
                fontFamily: 'var(--font-body)',
              }"
              placeholder="输入密码"
              @focus="(e: any) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)'; }"
              @blur="(e: any) => { e.target.style.borderColor = 'var(--input-border)'; e.target.style.boxShadow = 'none'; }" />
          </div>
          <p v-if="error" class="text-sm text-center" :style="{ color: 'var(--danger-text)' }">{{ error }}</p>
          <button type="submit" :disabled="loading"
            class="w-full py-3 rounded-xl text-sm font-medium disabled:opacity-40 transition-all shadow-lg cursor-pointer"
            :style="{
              background: 'var(--accent)',
              color: '#FFFFFF',
              borderRadius: 'var(--card-radius)',
              boxShadow: '0 4px 12px var(--accent-glow)',
            }">
            {{ loading ? '进去！中...' : '进去！' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authorLogin } from '../api'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  error.value = ''
  if (!username.value.trim() || !password.value.trim()) {
    error.value = '请输入账号和密码'
    return
  }
  loading.value = true
  try {
    const result = await authorLogin(username.value.trim(), password.value)
    authStore.setAuthor(result.author.displayName)
    router.push('/')
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : '进去！失败'
  } finally {
    loading.value = false
  }
}
</script>