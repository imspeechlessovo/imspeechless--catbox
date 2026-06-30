<template>
  <div class="min-h-screen px-4 py-8">
    <div class="w-full max-w-2xl mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <router-link to="/" class="inline-flex items-center text-sm text-slate-400 hover:text-slate-600 transition-colors">
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          返回首页
        </router-link>
        <div v-if="authStore.isAuthor" class="flex items-center gap-3">
          <span class="text-xs text-slate-400">作者：{{ authStore.authorDisplayName }}</span>
          <router-link to="/author/dashboard" class="text-xs text-violet-500 hover:text-violet-600 transition-colors">
            后台管理
          </router-link>
        </div>
      </div>

      <h2 class="text-xl font-light text-slate-700 text-center mb-2">留言墙</h2>
      <p class="text-xs text-slate-400 text-center mb-8">留下你想说的话</p>

      <!-- Auth check -->
      <div v-if="!canAccess" class="text-center py-12">
        <p class="text-slate-400 text-sm mb-4">你需要先通过答题门禁才能进入留言区</p>
        <router-link to="/gate" class="text-violet-500 text-sm hover:underline">
          前往答题
        </router-link>
      </div>

      <template v-else>
        <!-- Message form -->
        <div class="glass rounded-2xl p-4 md:p-6 mb-8 shadow-sm">
          <form @submit.prevent="submitMessage" class="space-y-4">
            <input
              v-model="nickname"
              type="text"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/60
                     text-sm text-slate-700 placeholder-slate-300
                     focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300
                     transition-all duration-200"
              placeholder="你的昵称（最多20字）"
              maxlength="20"
              :disabled="submitting"
            />
            <textarea
              v-model="content"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/60
                     text-sm text-slate-700 placeholder-slate-300 resize-none
                     focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300
                     transition-all duration-200"
              rows="3"
              placeholder="写下你想说的话（最多200字）"
              maxlength="200"
              :disabled="submitting"
            ></textarea>
            <div class="flex items-center justify-between">
              <span class="text-xs text-slate-400">{{ content.length }}/200</span>
              <button
                type="submit"
                :disabled="submitting || !nickname.trim() || !content.trim()"
                class="px-6 py-2 rounded-xl text-sm font-medium
                       bg-slate-800 text-white hover:bg-slate-700
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-200 shadow-sm"
              >
                {{ submitting ? '发送中...' : '留言' }}
              </button>
            </div>
          </form>
          <p v-if="formError" class="text-sm text-rose-500 mt-3">{{ formError }}</p>
        </div>

        <!-- Messages list -->
        <div v-if="loading" class="text-center py-8">
          <p class="text-slate-400 text-sm">加载中...</p>
        </div>

        <div v-else class="space-y-4">
          <!-- Author messages first (pinned on top) -->
          <div v-for="msg in allMessages" :key="msg.type + '-' + msg.id">
            <MessageCard :message="msg" />
          </div>

          <div v-if="allMessages.length === 0" class="text-center py-12">
            <p class="text-slate-400 text-sm">还没有留言，来做第一个留言的人吧</p>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import MessageCard from '../components/MessageCard.vue'
import { useAuthStore } from '../stores/auth'
import { getMessages, postMessage, getAuthStatus, type MessageItem, type AuthorMessageItem } from '../api'

const authStore = useAuthStore()

const canAccess = ref(false)
const loading = ref(true)
const submitting = ref(false)
const formError = ref('')
const nickname = ref('')
const content = ref('')

const visitorMessages = ref<MessageItem[]>([])
const authorMessages = ref<AuthorMessageItem[]>([])

const allMessages = computed(() => {
  return [...authorMessages.value, ...visitorMessages.value]
})

onMounted(async () => {
  await authStore.checkAuth()

  if (authStore.isAuthor || authStore.isVisitorPassed) {
    canAccess.value = true
    await loadMessages()
  } else {
    // Try checking auth status directly
    try {
      const status = await getAuthStatus()
      if (status.isAuthor || status.isVisitorPassed) {
        authStore.setVisitorPassed()
        if (status.isAuthor) {
          authStore.setAuthor(status.author?.displayName || '')
        }
        canAccess.value = true
        await loadMessages()
      }
    } catch {
      canAccess.value = false
    }
  }

  loading.value = false
})

async function loadMessages() {
  try {
    const data = await getMessages()
    visitorMessages.value = data.messages || []
    authorMessages.value = data.authorMessages || []
  } catch {
    // fail silently
  }
}

async function submitMessage() {
  formError.value = ''
  if (!nickname.value.trim() || !content.value.trim()) return

  submitting.value = true
  try {
    const msg = await postMessage(nickname.value.trim(), content.value.trim())
    visitorMessages.value.unshift(msg)
    nickname.value = ''
    content.value = ''
  } catch (err: unknown) {
    formError.value = err instanceof Error ? err.message : '留言失败'
  } finally {
    submitting.value = false
  }
}
</script>
