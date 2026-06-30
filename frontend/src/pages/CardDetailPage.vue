<template>
  <div class="min-h-screen px-4 py-8">
    <div class="w-full max-w-2xl mx-auto">
      <router-link to="/" class="inline-flex items-center text-sm text-slate-400 hover:text-slate-600 mb-6 transition-colors">
        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        返回排行榜
      </router-link>

      <div v-if="loading" class="text-center py-12"><p class="text-slate-400">加载中...</p></div>
      <div v-else-if="!card" class="text-center py-12"><p class="text-slate-400">角色卡不存在</p></div>

      <div v-else class="space-y-6">
        <!-- Image -->
        <div class="glass rounded-2xl overflow-hidden shadow-sm">
          <img :src="card.imagePath" :alt="card.name" class="w-full object-contain max-h-96 bg-slate-50" />
        </div>

        <!-- Info -->
        <div class="glass rounded-2xl p-6 shadow-sm space-y-4">
          <h1 class="text-2xl font-light text-slate-700">{{ card.name }}</h1>
          <p v-if="card.intro" class="text-sm text-slate-500">{{ card.intro }}</p>
          <div v-if="card.tags.length" class="flex flex-wrap gap-2">
            <span v-for="t in card.tags" :key="t" class="text-xs px-2 py-1 rounded-full bg-violet-50 text-violet-500">{{ t }}</span>
          </div>

          <!-- Stats -->
          <div class="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100">
            <div class="text-center"><p class="text-2xl font-light text-rose-400">{{ card.totalLikes }}</p><p class="text-xs text-slate-400">总点赞</p></div>
            <div class="text-center"><p class="text-2xl font-light text-amber-400">{{ card.todayLikes }}</p><p class="text-xs text-slate-400">今日</p></div>
            <div class="text-center"><p class="text-2xl font-light text-slate-400">{{ card.totalDownloads }}</p><p class="text-xs text-slate-400">下载</p></div>
          </div>

          <!-- Actions (require auth) -->
          <div v-if="canInteract" class="flex gap-3 pt-2">
            <button @click="handleLike" :disabled="liking"
              class="flex-1 py-3 rounded-xl text-sm font-medium bg-rose-50 text-rose-500 hover:bg-rose-100 disabled:opacity-50 transition-all">
              {{ liking ? '...' : '❤️ 点赞' }}
            </button>
            <a :href="'/api/cards/' + card.id + '/download'"
              @click="handleDownload"
              class="flex-1 py-3 rounded-xl text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all text-center">
              ⬇️ 下载原图
            </a>
          </div>

          <!-- Not authed -->
          <div v-else class="text-center py-3">
            <p class="text-sm text-slate-400">
              想互动？先
              <router-link to="/gate" class="text-violet-500 hover:underline">回答几个小问题</router-link>
              或
              <router-link to="/author/login" class="text-violet-500 hover:underline">作者登录</router-link>
            </p>
          </div>

          <p v-if="likeMsg" class="text-xs text-center" :class="likeOk ? 'text-rose-400' : 'text-slate-400'">{{ likeMsg }}</p>

          <!-- Manage link -->
          <div class="text-center pt-2">
            <router-link :to="'/manage/' + card.id" class="text-xs text-slate-300 hover:text-slate-500 transition-colors">
              管理此角色卡
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getCard, likeCard, type CardDetail } from '../api'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const authStore = useAuthStore()
const card = ref<CardDetail | null>(null)
const loading = ref(true)
const liking = ref(false)
const likeMsg = ref('')
const likeOk = ref(false)

const canInteract = computed(() => authStore.isAuthor || authStore.isVisitorPassed)

onMounted(async () => {
  await authStore.checkAuth()
  const id = Number(route.params.id)
  if (isNaN(id)) { loading.value = false; return }
  try { card.value = await getCard(id) } catch {}
  loading.value = false
})

async function handleLike() {
  if (!card.value) return
  liking.value = true; likeMsg.value = ''
  try {
    const result = await likeCard(card.value.id)
    card.value.totalLikes = result.totalLikes
    card.value.todayLikes++
    likeMsg.value = '+1'
    likeOk.value = true
    setTimeout(() => { likeMsg.value = '' }, 1500)
  } catch (err: unknown) {
    likeMsg.value = err instanceof Error ? err.message : '点赞失败'
    likeOk.value = false
  }
  liking.value = false
}

function handleDownload() {
  if (card.value) card.value.totalDownloads++
}
</script>