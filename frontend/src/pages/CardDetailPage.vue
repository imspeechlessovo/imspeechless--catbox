<template>
  <div style="background: var(--page-bg); min-height: 100vh; transition: background var(--transition-speed) ease;" class="px-4 py-8">
    <div class="w-full max-w-2xl mx-auto">
      <router-link to="/" class="inline-flex items-center text-sm mb-6 transition-colors" :style="{ color: 'var(--text-secondary)' }">
        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        回排行榜
      </router-link>

      <div v-if="loading" class="text-center py-12"><p :style="{ color: 'var(--text-muted)' }">加载中...</p></div>
      <div v-else-if="!card" class="text-center py-12"><p :style="{ color: 'var(--text-muted)' }">角色卡不存在</p></div>

      <div v-else class="space-y-6">
        <div class="glass rounded-2xl overflow-hidden">
          <img :src="card.imagePath" :alt="card.name" class="w-full object-contain max-h-96" :style="{ background: 'var(--page-bg)' }" />
        </div>

        <div class="glass rounded-2xl p-6 space-y-4">
          <h1 class="text-2xl font-light neon-text" :style="{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }">{{ card.name }}</h1>
          <p v-if="card.intro" class="text-sm" :style="{ color: 'var(--text-secondary)' }">{{ card.intro }}</p>
          <div v-if="card.tags.length" class="flex flex-wrap gap-2">
            <span v-for="t in card.tags" :key="t" class="text-xs px-2 py-1 rounded-full border"
              :style="{ background: 'var(--badge-bg)', color: 'var(--badge-text)', borderColor: 'var(--accent-glow)' }">{{ t }}</span>
          </div>

          <div class="grid grid-cols-3 gap-4 pt-4" :style="{ borderTop: '1px solid var(--border)' }">
            <div class="text-center"><p class="text-2xl font-light" :style="{ color: 'var(--accent)' }">{{ card.totalLikes }}</p><p class="text-xs" :style="{ color: 'var(--text-muted)' }">总点赞</p></div>
            <div class="text-center"><p class="text-2xl font-light" :style="{ color: 'var(--amber-text)' }">{{ card.todayLikes }}</p><p class="text-xs" :style="{ color: 'var(--text-muted)' }">今日</p></div>
            <div class="text-center"><p class="text-2xl font-light" :style="{ color: 'var(--text-secondary)' }">{{ card.totalDownloads }}</p><p class="text-xs" :style="{ color: 'var(--text-muted)' }">下载</p></div>
          </div>

          <div v-if="canInteract" class="flex gap-3 pt-2">
            <button @click="handleLike" :disabled="liking"
              class="flex-1 py-3 rounded-xl text-sm font-medium disabled:opacity-50 transition-all border"
              :style="{
                background: 'var(--accent-glow)',
                color: 'var(--accent)',
                borderColor: 'var(--accent-glow)',
                borderRadius: 'var(--card-radius)',
              }">
              {{ liking ? '...' : '♥ 点赞' }}
            </button>
            <a :href="'/api/cards/' + card.id + '/download'"
              @click="handleDownload"
              class="flex-1 py-3 rounded-xl text-sm font-medium transition-all text-center border"
              :style="{
                background: 'var(--card-bg)',
                color: 'var(--text-secondary)',
                borderColor: 'var(--border)',
                borderRadius: 'var(--card-radius)',
              }">
              ⬇ 下载原图
            </a>
          </div>

          <div v-else class="text-center py-3">
            <p class="text-sm" :style="{ color: 'var(--text-muted)' }">
              想互动？先
              <router-link to="/gate" :style="{ color: 'var(--accent)' }" class="hover:underline">回答几个小问题</router-link>
              或
              <router-link to="/author/login" :style="{ color: 'var(--accent)' }" class="hover:underline">作者登录</router-link>
            </p>
          </div>

          <p v-if="likeMsg" class="text-xs text-center" :style="{ color: likeOk ? 'var(--success-text)' : 'var(--text-muted)' }">{{ likeMsg }}</p>

          <div v-if="authStore.isAuthor" class="text-center pt-2">
            <router-link :to="'/manage/' + card.id" class="text-xs transition-colors" :style="{ color: 'var(--text-muted)' }">
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
    likeMsg.value = err instanceof Error ? err.message : 'error'
    likeOk.value = false
  }
  liking.value = false
}

function handleDownload() {
  if (card.value) card.value.totalDownloads++
}
</script>