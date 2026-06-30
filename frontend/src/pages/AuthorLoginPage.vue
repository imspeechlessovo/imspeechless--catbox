<template>
  <div class="min-h-screen flex flex-col items-center justify-center px-4 py-12">
    <div class="w-full max-w-sm mx-auto">
      <router-link to="/" class="inline-flex items-center text-sm text-slate-400 hover:text-slate-600 mb-8 transition-colors">
        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        返回首页
      </router-link>

      <div class="glass rounded-2xl p-6 md:p-8 shadow-sm">
        <h2 class="text-xl font-light text-slate-700 text-center mb-6">
          作者登录
        </h2>

        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-600 mb-1.5">用户名</label>
            <input
              v-model="username"
              type="text"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/60
                     text-sm text-slate-700 placeholder-slate-300
                     focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300
                     transition-all duration-200"
              placeholder="请输入用户名"
              :disabled="submitting"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-600 mb-1.5">密码</label>
            <input
              v-model="password"
              type="password"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/60
                     text-sm text-slate-700 placeholder-slate-300
                     focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300
                     transition-all duration-200"
              placeholder="请输入密码"
              :disabled="submitting"
            />
          </div>

          <div v-if="errorMsg" class="text-sm text-rose-500 text-center py-1">
            {{ errorMsg }}
          </div>

          <button
            type="submit"
            :disabled="submitting || !username.trim() || !password"
            class="w-full py-3 rounded-xl text-sm font-medium
                   bg-slate-800 text-white hover:bg-slate-700
                   disabled:opacity-50 disabled:cursor-not-allowed
                   transition-all duration-200 shadow-sm"
          >
            {{ submitting ? '登录中...' : '登录' }}
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
const submitting = ref(false)
const errorMsg = ref('')

async function handleLogin() {
  errorMsg.value = ''
  if (!username.value.trim() || !password.value) return

  submitting.value = true
  try {
    const result = await authorLogin(username.value.trim(), password.value)
    authStore.setAuthor(result.author.displayName)
    router.push('/author/dashboard')
  } catch (err: unknown) {
    errorMsg.value = err instanceof Error ? err.message : '登录失败'
  } finally {
    submitting.value = false
  }
}
</script>
