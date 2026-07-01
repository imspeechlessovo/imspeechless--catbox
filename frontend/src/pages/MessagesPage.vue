<template>
  <div class="min-h-screen bg-[#0d1117] px-4 py-8">
    <div class="w-full max-w-2xl mx-auto">
      <div class="flex items-center justify-between mb-8">
        <router-link to="/" class="inline-flex items-center text-sm text-[#8b949e] hover:text-[#86C440] transition-colors">
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          返回首页
        </router-link>
        <div v-if="authStore.isAuthor" class="flex items-center gap-2">
          <span class="text-xs text-[#86C440]">🥑 {{ authStore.authorDisplayName }}</span>
        </div>
      </div>

      <div class="text-center mb-8">
        <h2 class="text-xl font-light text-[#e6edf3]">🗣️ 留言墙</h2>
        <p class="text-xs text-[#484f58] mt-1">畅所欲言</p>
      </div>

      <div v-if="canPost" class="glass rounded-2xl p-4 md:p-6 mb-8">
        <form @submit.prevent="submitMessage" class="space-y-4">
          <input v-model="nickname" type="text" maxlength="20" :disabled="submitting"
            class="w-full px-4 py-2.5 rounded-xl border border-[#21262d] bg-[#0d1117]/60 text-sm text-[#e6edf3] placeholder-[#484f58] focus:outline-none focus:ring-2 focus:ring-[#86C440]/30 focus:border-[#86C440]/50 transition-all"
            placeholder="你的昵称（最多20字）" />
          <textarea v-model="content" rows="3" maxlength="200" :disabled="submitting"
            class="w-full px-4 py-2.5 rounded-xl border border-[#21262d] bg-[#0d1117]/60 text-sm text-[#e6edf3] placeholder-[#484f58] resize-none focus:outline-none focus:ring-2 focus:ring-[#86C440]/30 focus:border-[#86C440]/50 transition-all"
            placeholder="写下你想说的话（最多200字）"></textarea>
          <div class="flex items-center justify-between">
            <span class="text-xs text-[#484f58]">{{ content.length }}/200</span>
            <button type="submit" :disabled="submitting || !nickname.trim() || !content.trim()"
              class="px-6 py-2 rounded-xl text-sm font-medium bg-[#86C440] text-[#0d1117] hover:bg-[#A8D96A] disabled:opacity-40 transition-all">
              {{ submitting ? '发送中...' : '留言' }}
            </button>
          </div>
        </form>
        <p v-if="formError" class="text-sm text-rose-400 mt-3">{{ formError }}</p>
      </div>

      <div v-else class="text-center py-4 mb-4">
        <p class="text-sm text-[#8b949e]">
          想留言？先
          <router-link to="/gate" class="text-[#86C440] hover:underline">回答几个小问题</router-link>
          或
          <router-link to="/author/login" class="text-[#86C440] hover:underline">作者登录</router-link>
        </p>
      </div>

      <div v-if="loading" class="text-center py-8"><p class="text-[#8b949e] text-sm">加载中...</p></div>
      <div v-else class="space-y-4">
        <div v-for="msg in allMessages" :key="msg.type + '-' + msg.id">
          <MessageCard :message="msg" :is-author="authStore.isAuthor" @pin="handlePin" @delete="handleDelete" />
        </div>
        <div v-if="allMessages.length === 0" class="text-center py-12">
          <p class="text-[#8b949e] text-sm">还没有留言，来做第一个留言的人吧</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import MessageCard from '../components/MessageCard.vue'
import { useAuthStore } from '../stores/auth'
import { getMessages, postMessage, deleteMessage, togglePin, type MessageItem, type AuthorMessageItem } from '../api'

const authStore = useAuthStore()
const loading = ref(true)
const submitting = ref(false)
const formError = ref('')
const nickname = ref('')
const content = ref('')
const visitorMessages = ref<MessageItem[]>([])
const authorMessages = ref<AuthorMessageItem[]>([])
const canPost = computed(() => authStore.isAuthor || authStore.isVisitorPassed)
const allMessages = computed(() => [...authorMessages.value, ...visitorMessages.value])

onMounted(async () => {
  await authStore.checkAuth()
  await loadMessages()
  loading.value = false
})

async function loadMessages() {
  try {
    const data = await getMessages()
    visitorMessages.value = data.messages || []
    authorMessages.value = data.authorMessages || []
  } catch {}
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
  } finally { submitting.value = false }
}

async function handlePin(msg: MessageItem | AuthorMessageItem) {
  try {
    const result = await togglePin(msg.id)
    if (msg.type === 'visitor') { const m = visitorMessages.value.find(m => m.id === msg.id); if (m) (m as any).pinned = result.pinned }
    else { const m = authorMessages.value.find(m => m.id === msg.id); if (m) (m as any).pinned = result.pinned }
    visitorMessages.value = [...visitorMessages.value]
    authorMessages.value = [...authorMessages.value]
  } catch (err: unknown) { alert(err instanceof Error ? err.message : '操作失败') }
}

async function handleDelete(msg: MessageItem | AuthorMessageItem) {
  if (!confirm('确定删除这条留言？')) return
  try {
    await deleteMessage(msg.id)
    if (msg.type === 'visitor') visitorMessages.value = visitorMessages.value.filter(m => m.id !== msg.id)
    else authorMessages.value = authorMessages.value.filter(m => m.id !== msg.id)
  } catch (err: unknown) { alert(err instanceof Error ? err.message : '删除失败') }
}
</script>