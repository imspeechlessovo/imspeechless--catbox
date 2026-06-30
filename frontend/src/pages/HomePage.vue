<template>
  <div class="min-h-screen">
    <!-- === Login buttons: top-right === -->
    <div class="fixed top-4 right-4 z-50 flex items-center gap-2">
      <template v-if="!authStore.isAuthor && !authStore.isVisitorPassed">
        <router-link to="/gate"
          class="px-4 py-2 rounded-full text-xs font-medium bg-white/70 backdrop-blur text-slate-500 hover:text-slate-700 hover:bg-white/90 transition-all shadow-sm">
          粉丝登录
        </router-link>
        <router-link to="/author/login"
          class="px-4 py-2 rounded-full text-xs font-medium bg-white/70 backdrop-blur text-slate-500 hover:text-slate-700 hover:bg-white/90 transition-all shadow-sm">
          作者登录
        </router-link>
      </template>
      <template v-else>
        <span v-if="authStore.isAuthor" class="text-xs text-slate-500 bg-white/70 backdrop-blur px-3 py-1.5 rounded-full">
          作者：{{ authStore.authorDisplayName }}
        </span>
        <span v-else-if="authStore.isVisitorPassed" class="text-xs text-slate-500 bg-white/70 backdrop-blur px-3 py-1.5 rounded-full">
          已通过门禁
        </span>
        <button v-if="authStore.isAuthor || authStore.isVisitorPassed" @click="handleLogout"
          class="px-3 py-1.5 rounded-full text-xs font-medium bg-white/70 backdrop-blur text-slate-400 hover:text-rose-500 transition-all shadow-sm">
          退出
        </button>
      </template>
    </div>

    <!-- === Section 1: Countdown === -->
    <div class="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div class="w-full max-w-lg mx-auto text-center space-y-8">
        <div class="space-y-2">
          <h1 class="text-2xl md:text-3xl font-light text-slate-700 tracking-wider">等待作者回归</h1>
          <p class="text-sm md:text-base text-slate-400 italic">"这不是结束，只是冷却时间。"</p>
        </div>

        <CountdownDisplay v-if="countdownData" :release-time-str="countdownData.releaseTime" :server-time-str="countdownData.serverTime" />
        <CountdownDisplay v-else />

        <p class="text-xs text-slate-300 pt-8 animate-bounce">↓ 向下滑动查看角色卡排行 ↓</p>
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

        <div v-if="loadingCards" class="text-center py-12"><p class="text-slate-400 text-sm">加载中...</p></div>

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

    <!-- === Section 3: Message Wall === -->
    <div class="px-4 py-12">
      <div class="w-full max-w-2xl mx-auto">
        <h2 class="text-xl font-light text-slate-700 text-center mb-2">留言板</h2>
        <p class="text-xs text-slate-400 text-center mb-8">留下你想说的话</p>

        <!-- Posting form (authed only) -->
        <div v-if="canPost" class="glass rounded-2xl p-4 md:p-6 mb-8 shadow-sm">
          <form @submit.prevent="submitMessage" class="space-y-4">
            <input
              v-model="msgNickname"
              type="text"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/60 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300 transition-all"
              placeholder="你的昵称（最多20字）"
              maxlength="20"
              :disabled="submittingMsg"
            />
            <textarea
              v-model="msgContent"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/60 text-sm text-slate-700 placeholder-slate-300 resize-none focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300 transition-all"
              rows="3"
              placeholder="写下你想说的话（最多200字）"
              maxlength="200"
              :disabled="submittingMsg"
            ></textarea>
            <div class="flex items-center justify-between">
              <span class="text-xs text-slate-400">{{ msgContent.length }}/200</span>
              <button type="submit" :disabled="submittingMsg || !msgNickname.trim() || !msgContent.trim()"
                class="px-6 py-2 rounded-xl text-sm font-medium bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50 transition-all shadow-sm">
                {{ submittingMsg ? '发送中...' : '留言' }}
              </button>
            </div>
          </form>
          <p v-if="msgError" class="text-sm text-rose-500 mt-3">{{ msgError }}</p>
        </div>

        <div v-else class="text-center py-4 mb-4">
          <p class="text-sm text-slate-400">
            想留言？先
            <router-link to="/gate" class="text-violet-500 hover:underline">回答几个小问题</router-link>
            或
            <router-link to="/author/login" class="text-violet-500 hover:underline">作者登录</router-link>
          </p>
        </div>

        <!-- Messages -->
        <div v-if="loadingMsgs" class="text-center py-8"><p class="text-slate-400 text-sm">加载中...</p></div>
        <div v-else class="space-y-4">
          <div v-for="msg in allMessages" :key="msg.type + '-' + msg.id">
            <MessageCard :message="msg" :is-author="authStore.isAuthor" @pin="handlePin" @delete="handleDelete" />
          </div>
          <div v-if="allMessages.length === 0" class="text-center py-12">
            <p class="text-slate-400 text-sm">还没有留言，来做第一个留言的人吧</p>
          </div>
        </div>
      </div>
    </div>

    <!-- === Section 4: Author Tools === -->
    <div v-if="authStore.isAuthor" class="px-4 py-12 bg-white/30">
      <div class="w-full max-w-2xl mx-auto text-center">
        <h2 class="text-lg font-light text-slate-600 mb-6">作者工具</h2>
        <div class="flex flex-col sm:flex-row justify-center gap-4">
          <router-link to="/create"
            class="px-8 py-4 rounded-2xl glass text-slate-700 hover:text-slate-900 hover:shadow-md transition-all">
            <span class="text-2xl mr-2">+</span> 创建角色卡
          </router-link>
          <router-link to="/author/questions"
            class="px-8 py-4 rounded-2xl glass text-slate-700 hover:text-slate-900 hover:shadow-md transition-all">
            ✏️ 修改粉丝登录问题
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import CountdownDisplay from '../components/CountdownDisplay.vue'
import MessageCard from '../components/MessageCard.vue'
import { useAuthStore } from '../stores/auth'
import {
  getCountdown, getCards, getMessages, postMessage, deleteMessage, togglePin,
  authorLogout, visitorLogout,
  type CardListItem, type MessageItem, type AuthorMessageItem
} from '../api'

const authStore = useAuthStore()

// Countdown
const countdownData = ref<{ releaseTime: string; serverTime: string } | null>(null)

// Cards
const tabs = [{ key: 'total', label: '总榜' }, { key: 'daily', label: '日榜' }, { key: 'weekly', label: '周榜' }]
const rank = ref('total')
const page = ref(1)
const items = ref<CardListItem[]>([])
const total = ref(0)
const loadingCards = ref(true)
const totalPages = ref(0)

// Messages
const loadingMsgs = ref(true)
const submittingMsg = ref(false)
const msgError = ref('')
const msgNickname = ref('')
const msgContent = ref('')
const visitorMessages = ref<MessageItem[]>([])
const authorMessages = ref<AuthorMessageItem[]>([])

const canPost = computed(() => authStore.isAuthor || authStore.isVisitorPassed)

const allMessages = computed(() => [...authorMessages.value, ...visitorMessages.value])

onMounted(async () => {
  await authStore.checkAuth()
  try { countdownData.value = await getCountdown() } catch {}
  await loadCards()
  await loadMessages()
})

// --- Cards ---
async function loadCards() {
  loadingCards.value = true
  try {
    const data = await getCards(rank.value, page.value, 20)
    items.value = data.items
    total.value = data.total
    totalPages.value = Math.ceil(data.total / data.limit)
  } catch { items.value = [] }
  loadingCards.value = false
}

function switchTab(key: string) { rank.value = key; page.value = 1; loadCards() }
function changePage(p: number) { page.value = p; loadCards() }

// --- Messages ---
async function loadMessages() {
  loadingMsgs.value = true
  try {
    const data = await getMessages()
    visitorMessages.value = data.messages || []
    authorMessages.value = data.authorMessages || []
  } catch {}
  loadingMsgs.value = false
}

async function submitMessage() {
  msgError.value = ''
  if (!msgNickname.value.trim() || !msgContent.value.trim()) return
  submittingMsg.value = true
  try {
    const msg = await postMessage(msgNickname.value.trim(), msgContent.value.trim())
    visitorMessages.value.unshift(msg)
    msgNickname.value = ''
    msgContent.value = ''
  } catch (err: unknown) {
    msgError.value = err instanceof Error ? err.message : '留言失败'
  } finally {
    submittingMsg.value = false
  }
}

async function handlePin(msg: MessageItem | AuthorMessageItem) {
  try {
    const result = await togglePin(msg.id)
    if (msg.type === 'visitor') {
      const m = visitorMessages.value.find(m => m.id === msg.id)
      if (m) (m as any).pinned = result.pinned
    } else {
      const m = authorMessages.value.find(m => m.id === msg.id)
      if (m) (m as any).pinned = result.pinned
    }
    visitorMessages.value = [...visitorMessages.value]
    authorMessages.value = [...authorMessages.value]
  } catch (err: unknown) {
    alert(err instanceof Error ? err.message : '操作失败')
  }
}

async function handleDelete(msg: MessageItem | AuthorMessageItem) {
  if (!confirm('确定删除这条留言？')) return
  try {
    await deleteMessage(msg.id)
    if (msg.type === 'visitor') {
      visitorMessages.value = visitorMessages.value.filter(m => m.id !== msg.id)
    } else {
      authorMessages.value = authorMessages.value.filter(m => m.id !== msg.id)
    }
  } catch (err: unknown) {
    alert(err instanceof Error ? err.message : '删除失败')
  }
}

async function handleLogout() {
  try {
    if (authStore.isAuthor) { await authorLogout(); authStore.clearAuthor(); }
    else if (authStore.isVisitorPassed) { await visitorLogout(); authStore.isVisitorPassed = false; }
  } catch {}
}
</script>