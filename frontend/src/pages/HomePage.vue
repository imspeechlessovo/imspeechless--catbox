<template>
  <div class="min-h-screen">
    <!-- === Section 1: Countdown === -->
    <div class="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div class="w-full max-w-lg mx-auto text-center space-y-8">
        <div class="space-y-2">
          <h1 class="text-2xl md:text-3xl font-light text-slate-700 tracking-wider">等待作者回归</h1>
          <p class="text-sm md:text-base text-slate-400 italic">"这不是结束，只是冷却时间。"</p>
        </div>

        <CountdownDisplay v-if="countdownData" :release-time-str="countdownData.releaseTime" :server-time-str="countdownData.serverTime" />
        <CountdownDisplay v-else />

        <div class="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <router-link to="/gate"
            class="w-full sm:w-auto px-8 py-3 rounded-xl text-sm font-medium bg-slate-800 text-white hover:bg-slate-700 transition-all duration-200 shadow-sm text-center">
            回答问题，进入留言区
          </router-link>
          <router-link to="/author/login"
            class="w-full sm:w-auto px-8 py-3 rounded-xl text-sm font-medium glass text-slate-600 hover:text-slate-800 transition-all duration-200 hover:shadow-sm text-center">
            作者登录
          </router-link>
        </div>

        <p class="text-xs text-slate-300 pt-8 animate-bounce">↓ 向下滑动查看角色卡排行榜 ↓</p>
      </div>
    </div>

    <!-- === Section 2: Character Card Rankings === -->
    <div class="px-4 py-12 bg-white/30">
      <div class="w-full max-w-3xl mx-auto">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-light text-slate-700">角色卡排行榜</h2>
          <router-link v-if="authStore.isAuthor" to="/create"
            class="px-4 py-2 rounded-xl text-sm font-medium bg-slate-800 text-white hover:bg-slate-700 transition-all shadow-sm">
            + 创建角色卡
          </router-link>
        </div>

        <!-- Rank tabs -->
        <div class="flex gap-2 mb-6">
          <button v-for="t in tabs" :key="t.key" @click="switchTab(t.key)"
            class="px-5 py-2 rounded-full text-sm transition-all"
            :class="rank === t.key ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'">
            {{ t.label }}
          </button>
        </div>

        <div v-if="loading" class="text-center py-12"><p class="text-slate-400 text-sm">加载中...</p></div>

        <div v-else class="space-y-3">
          <div v-for="item in items" :key="item.id"
            class="glass rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-all cursor-pointer"
            @click="$router.push('/card/' + item.id)">
            <div class="w-10 h-10 flex items-center justify-center flex-shrink-0">
              <span v-if="item.rank === 1" class="text-2xl">&#x1F947;</span>
              <span v-else-if="item.rank === 2" class="text-2xl">&#x1F948;</span>
              <span v-else-if="item.rank === 3" class="text-2xl">&#x1F949;</span>
              <span v-else class="text-sm font-medium text-slate-400">#{{ item.rank }}</span>
            </div>
            <img :src="item.thumbPath" :alt="item.name" class="w-16 h-16 rounded-xl object-cover flex-shrink-0 bg-slate-100" />
            <div class="flex-1 min-w-0">
              <h3 class="font-medium text-slate-700 truncate">{{ item.name }}</h3>
              <p v-if="item.intro" class="text-xs text-slate-400 mt-0.5 line-clamp-1">{{ item.intro }}</p>
              <div class="flex items-center gap-2 mt-1">
                <span v-for="t in item.tags" :key="t" class="text-xs px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-500">{{ t }}</span>
              </div>
            </div>
            <div class="text-right flex-shrink-0">
              <p class="text-lg font-light text-rose-400">{{ item.score }}</p>
              <p class="text-xs text-slate-400">&#x1F44D;</p>
            </div>
          </div>
          <div v-if="items.length === 0" class="text-center py-12">
            <p class="text-slate-400 text-sm">暂无角色卡</p>
            <p v-if="authStore.isAuthor" class="text-slate-400 text-xs mt-1">点击右上角创建第一张</p>
          </div>
        </div>

        <div v-if="totalPages > 1" class="flex justify-center gap-2 mt-8">
          <button @click="changePage(page - 1)" :disabled="page <= 1"
            class="px-4 py-2 rounded-xl text-sm text-slate-500 hover:text-slate-700 disabled:opacity-30 transition-colors">上一页</button>
          <span class="px-4 py-2 text-sm text-slate-400">{{ page }} / {{ totalPages }}</span>
          <button @click="changePage(page + 1)" :disabled="page >= totalPages"
            class="px-4 py-2 rounded-xl text-sm text-slate-500 hover:text-slate-700 disabled:opacity-30 transition-colors">下一页</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import CountdownDisplay from '../components/CountdownDisplay.vue'
import { useAuthStore } from '../stores/auth'
import { getCountdown, getCards, type CardListItem } from '../api'

const authStore = useAuthStore()

const countdownData = ref<{ releaseTime: string; serverTime: string } | null>(null)
const tabs = [{ key: 'total', label: '总榜' }, { key: 'daily', label: '日榜' }, { key: 'weekly', label: '周榜' }]
const rank = ref('total')
const page = ref(1)
const items = ref<CardListItem[]>([])
const total = ref(0)
const loading = ref(true)
const totalPages = ref(0)

onMounted(async () => {
  await authStore.checkAuth()
  try { countdownData.value = await getCountdown() } catch {}
  await loadCards()
})

async function loadCards() {
  loading.value = true
  try {
    const data = await getCards(rank.value, page.value, 20)
    items.value = data.items
    total.value = data.total
    totalPages.value = Math.ceil(data.total / data.limit)
  } catch { items.value = [] }
  loading.value = false
}

function switchTab(key: string) { rank.value = key; page.value = 1; loadCards() }
function changePage(p: number) { page.value = p; loadCards() }
</script>