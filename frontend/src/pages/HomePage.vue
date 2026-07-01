<template>
  <div class="min-h-screen">
    <!-- Cursor particles background -->
    <CursorParticles />

    <!-- Scroll progress bar -->
    <div class="scroll-progress" :style="{ width: scrollProgress + '%' }"></div>

    <!-- Back to top -->
    <button v-show="showBackTop" @click="scrollToTop" class="back-top-btn" title="回到顶部">⬆</button>

    <!-- Floating hearts container -->
    <div class="floating-hearts" ref="heartsContainer"></div>

    <!-- EmojiPicker overlay -->
    <EmojiPicker :visible="showEmoji" @close="showEmoji = false" @pick="insertEmoji" />

    <!-- ======== Top-right login buttons ======== -->
    <div class="fixed top-5 right-5 z-50 flex items-center gap-2.5">
      <template v-if="!authStore.isAuthor && !authStore.isVisitorPassed">
        <router-link to="/gate" class="nav-btn">👥 粉丝登录</router-link>
        <router-link to="/author/login" class="nav-btn">✍️ 作者登录</router-link>
      </template>
      <template v-else>
        <span v-if="authStore.isAuthor" class="nav-badge-accent">🥑 {{ authStore.authorDisplayName }}</span>
        <span v-else class="nav-badge">✅ 已通过门禁</span>
        <button @click="handleLogout" class="nav-btn nav-btn-out">退出</button>
      </template>
    </div>

    <!-- ======== SECTION 1: Countdown ======== -->
    <section class="countdown-section reveal-section" data-reveal>
      <div class="countdown-inner">
        <CountdownDisplay v-if="countdownData" :release-time-str="countdownData.releaseTime" :server-time-str="countdownData.serverTime" />
        <CountdownDisplay v-else />
        <div class="scroll-hint">
          <svg class="w-4 h-4 mx-auto animate-bounce" :style="{ color: 'var(--text-muted)' }" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg>
          <p class="text-xs mt-2" :style="{ color: 'var(--text-muted)' }">向下滚动探索</p>
        </div>
      </div>
    </section>

    <!-- ======== SECTION 2: Rankings (single column, one card per row) ======== -->
    <section class="ranking-section reveal-section" data-reveal>
      <div class="max-w-3xl mx-auto px-4">
        <div class="section-header">
          <div>
            <h2 class="section-title">🏆 角色卡排行</h2>
            <p class="section-subtitle">粉丝们的最爱，点进去看看？</p>
          </div>
          <router-link v-if="authStore.isAuthor" to="/create" class="btn-primary">+ 创建角色卡</router-link>
        </div>

        <div class="tabs-row">
          <button v-for="t in tabs" :key="t.key" @click="switchTab(t.key)" class="tab-btn" :class="{ active: rank === t.key }">{{ t.label }}</button>
        </div>

        <div v-if="loadingCards" class="loading-msg">加载中...</div>

        <!-- Single column list -->
        <div v-else class="rank-list">
          <div v-for="(item, idx) in items" :key="item.id"
            class="rank-row"
            :class="{ 'rank-gold': item.rank === 1, 'rank-silver': item.rank === 2, 'rank-bronze': item.rank === 3 }"
            :style="{ animationDelay: idx * 0.04 + 's' }"
            @click="router.push('/card/' + item.id)">

            <!-- Rank number -->
            <div class="rank-pos">
              <span v-if="item.rank === 1" class="rank-medal">🥇</span>
              <span v-else-if="item.rank === 2" class="rank-medal">🥈</span>
              <span v-else-if="item.rank === 3" class="rank-medal">🥉</span>
              <span v-else class="rank-num">{{ String(item.rank).padStart(2, '0') }}</span>
            </div>

            <!-- Thumb -->
            <div class="rank-row-thumb">
              <img v-if="item.thumbPath" :src="item.thumbPath" :alt="item.name" class="rank-row-thumb-img" />
              <span v-else class="rank-row-thumb-placeholder">🖼</span>
            </div>

            <!-- Info -->
            <div class="rank-row-info">
              <h3 class="rank-row-name">{{ item.name }}</h3>
              <p v-if="item.intro" class="rank-row-intro">{{ item.intro }}</p>
              <div v-if="item.tags.length" class="rank-row-tags">
                <span v-for="t in item.tags.slice(0,4)" :key="t" class="rank-row-tag">{{ t }}</span>
              </div>
            </div>

            <!-- Like button + rolling count -->
            <div class="rank-like-area" @click.stop>
              <button @click="handleCardLike(item)" :disabled="likingCard === item.id" class="rank-like-btn">
                <span class="like-heart" :class="{ 'like-pop': likePopId === item.id }">❤️</span>
              </button>
              <div class="like-count-wrapper">
                <span class="like-count" :key="'like-' + item.id + '-' + item.totalLikes">{{ formatLikeCount(item.totalLikes) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="totalPages > 1" class="pagination">
          <button v-for="p in totalPages" :key="p" @click="changePage(p)" class="page-btn" :class="{ active: p === page }">{{ p }}</button>
        </div>
      </div>
    </section>

    <!-- ======== SECTION 3: Message Wall ======== -->
    <section class="message-section reveal-section" data-reveal>
      <div class="max-w-2xl mx-auto px-4">
        <div class="section-header">
          <div>
            <h2 class="section-title">💬 留言板</h2>
            <p class="section-subtitle">来都来了，留下点痕迹再走呗～</p>
          </div>
        </div>

        <div v-if="canPost" class="post-form animate-slide-up">
          <div class="post-form-avatar">💬</div>
          <div class="post-form-body">
            <div class="post-input-row"><input v-model="msgNickname" type="text" maxlength="20" class="post-input" placeholder="你的昵称" /><button @click="showEmoji = !showEmoji" class="emoji-toggle" title="表情">😊</button></div>
            <textarea v-model="msgContent" rows="2" maxlength="500" class="post-textarea" placeholder="说点什么吧..."></textarea>
            <div class="post-form-footer">
              <p v-if="msgError" class="post-error">{{ msgError }}</p>
              <p v-if="msgSuccess" class="post-success">{{ msgSuccess }}</p>
              <button @click="submitMessage" :disabled="submittingMsg" class="btn-primary btn-sm">{{ submittingMsg ? '发送中...' : '📨 留言' }}</button>
            </div>
          </div>
        </div>

        <div v-else class="login-prompt">
          <p>想留言、点赞、下载？先 <router-link to="/gate" class="accent-link">回答几个小问题</router-link> 或 <router-link to="/author/login" class="accent-link">作者登录</router-link> 吧~</p>
        </div>

        <div v-if="loadingMsgs" class="loading-msg">加载中...</div>
        <div v-else class="messages-list">
          <MessageCard v-for="msg in allMessages" :key="msg.type + '-' + msg.id" :msg="msg" :isAuthor="authStore.isAuthor" @pin="handlePin" @delete="handleDelete" />
        </div>
      </div>
    </section>

    <!-- ======== Author tools ======== -->
    <section v-if="authStore.isAuthor" class="author-section reveal-section" data-reveal>
      <div class="max-w-2xl mx-auto px-4">
        <h2 class="section-title mb-5">🛠️ 作者工具箱</h2>
        <div class="author-tools">
          <router-link to="/create" class="tool-card"><span class="text-2xl">⭐</span><span>创建角色卡</span></router-link>
          <router-link to="/author/questions" class="tool-card"><span class="text-2xl">🔐</span><span>修改门禁问题</span></router-link>
        </div>
      </div>
    </section>

    <StatsSection />

    <footer class="site-footer">🥑 niuyouguo &copy; 2026 — 这不是结束，只是冷却时间</footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import CountdownDisplay from '../components/CountdownDisplay.vue'
import MessageCard from '../components/MessageCard.vue'
import StatsSection from '../components/StatsSection.vue'
import EmojiPicker from '../components/EmojiPicker.vue'
import CursorParticles from '../components/CursorParticles.vue'
import { playPop, playDing } from '../utils/sound'
import { useAuthStore } from '../stores/auth'
import { useThemeStore } from '../stores/theme'
import {
  getCountdown, getCards, likeCard, getMessages, postMessage, deleteMessage, togglePin,
  authorLogout, visitorLogout,
  type CardListItem, type MessageItem, type AuthorMessageItem
} from '../api'

const router = useRouter()
const authStore = useAuthStore()
const themeStore = useThemeStore()

const countdownData = ref<{ releaseTime: string; serverTime: string } | null>(null)
const tabs = [{ key: 'total', label: '🏆 总榜' }, { key: 'daily', label: '🔥 日榜' }, { key: 'weekly', label: '📅 周榜' }]
const rank = ref('total')
const page = ref(1)
const items = ref<CardListItem[]>([])
const loadingCards = ref(true)
const totalPages = ref(0)
const loadingMsgs = ref(true)
const submittingMsg = ref(false)
const msgError = ref('')
const msgNickname = ref('')
const msgContent = ref('')
const visitorMessages = ref<MessageItem[]>([])
const authorMessages = ref<AuthorMessageItem[]>([])
const canPost = computed(() => authStore.isAuthor || authStore.isVisitorPassed)
const allMessages = computed(() => [...authorMessages.value, ...visitorMessages.value])
const likingCard = ref<number | null>(null)
const likePopId = ref<number | null>(null)
const showEmoji = ref(false)
const msgSuccess = ref('')
const showBackTop = ref(false)
const scrollProgress = ref(0)
const heartsContainer = ref<HTMLElement | null>(null)
let scrollObserver: IntersectionObserver | null = null

function insertEmoji(emoji: string) {
  msgContent.value += emoji
}

function spawnHeart(x: number, y: number) {
  const el = document.createElement('span')
  el.className = 'floating-heart'
  el.textContent = '❤️'
  el.style.left = x + 'px'
  el.style.top = y + 'px'
  el.style.animationDuration = (0.8 + Math.random() * 0.6) + 's'
  heartsContainer.value?.appendChild(el)
  setTimeout(() => el.remove(), 1400)
}

function formatLikeCount(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1) + 'w'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return String(n)
}

onMounted(async () => {
  await authStore.checkAuth()
  try { countdownData.value = await getCountdown() } catch {}
  await loadCards()
  await loadMessages()

  window.addEventListener('scroll', onScroll, { passive: true })

  scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('revealed')
      }
    })
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' })

  document.querySelectorAll('[data-reveal]').forEach(el => scrollObserver!.observe(el))
})

function onScroll() {
  const scrollY = window.scrollY
  const docH = document.documentElement.scrollHeight - window.innerHeight
  showBackTop.value = scrollY > 400
  scrollProgress.value = docH > 0 ? Math.min((scrollY / docH) * 100, 100) : 0
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  scrollObserver?.disconnect()
})

async function loadCards() {
  loadingCards.value = true
  try { const data = await getCards(rank.value, page.value, 20); items.value = data.items; totalPages.value = Math.ceil(data.total / data.limit) }
  catch { items.value = [] }
  loadingCards.value = false
  setTimeout(() => {
    document.querySelectorAll('.rank-row[data-reveal]:not(.revealed)').forEach(el => scrollObserver?.observe(el))
  }, 100)
}

async function handleCardLike(item: CardListItem) {
  if (likingCard.value) return
  likingCard.value = item.id
  likePopId.value = item.id
  playPop()
  setTimeout(() => { likePopId.value = null }, 400)
  const btn = document.activeElement
  if (btn) {
    const rect = (btn as HTMLElement).getBoundingClientRect()
    spawnHeart(rect.left + rect.width / 2, rect.top)
    spawnHeart(rect.left + rect.width / 3, rect.top + 10)
  }
  try {
    const result = await likeCard(item.id)
    item.totalLikes = result.totalLikes
    item.score = result.totalLikes
  }
  catch (err: unknown) { alert(err instanceof Error ? err.message : 'error') }
  likingCard.value = null
}

function switchTab(key: string) { rank.value = key; page.value = 1; loadCards() }
function changePage(p: number) { page.value = p; loadCards() }

async function loadMessages() {
  loadingMsgs.value = true
  try { const data = await getMessages(); visitorMessages.value = data.messages || []; authorMessages.value = data.authorMessages || [] }
  catch {}
  loadingMsgs.value = false
}

async function submitMessage() {
  msgError.value = ''
  msgSuccess.value = ''
  if (!msgNickname.value.trim() || !msgContent.value.trim()) return
  submittingMsg.value = true
  try { const msg = await postMessage(msgNickname.value.trim(), msgContent.value.trim()); visitorMessages.value.unshift(msg); msgNickname.value = ''; msgContent.value = '' }
  catch (err: unknown) { msgError.value = err instanceof Error ? err.message : 'error' }
  finally { submittingMsg.value = false }
}

async function handlePin(msg: MessageItem | AuthorMessageItem) {
  try {
    const result = await togglePin(msg.id)
    if (msg.type === 'visitor') { const m = visitorMessages.value.find(m => m.id === msg.id); if (m) (m as any).pinned = result.pinned }
    else { const m = authorMessages.value.find(m => m.id === msg.id); if (m) (m as any).pinned = result.pinned }
    visitorMessages.value = [...visitorMessages.value]; authorMessages.value = [...authorMessages.value]
  } catch (err: unknown) { alert(err instanceof Error ? err.message : 'error') }
}

async function handleDelete(msg: MessageItem | AuthorMessageItem) {
  if (!confirm('确定删除？')) return
  try { await deleteMessage(msg.id); if (msg.type === 'visitor') visitorMessages.value = visitorMessages.value.filter(m => m.id !== msg.id); else authorMessages.value = authorMessages.value.filter(m => m.id !== msg.id) }
  catch (err: unknown) { alert(err instanceof Error ? err.message : 'error') }
}

async function handleLogout() {
  try { if (authStore.isAuthor) { await authorLogout(); authStore.clearAuthor() } else if (authStore.isVisitorPassed) { await visitorLogout(); authStore.isVisitorPassed = false } }
  catch {}
}
</script>

<style scoped>
/* ====== NAV BUTTONS ====== */
.nav-btn {
  padding: 8px 18px; border-radius: var(--card-radius-sm); font-size: 0.8rem; font-weight: 500;
  background: var(--card-bg); color: var(--text-secondary); border: 1px solid var(--border);
  transition: all 0.2s ease; text-decoration: none; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
  box-shadow: var(--card-shadow); cursor: pointer;
}
.nav-btn:hover { color: var(--text-primary); background: var(--surface-hover); border-color: var(--accent-glow); }
.nav-btn-out:hover { color: var(--danger-text) !important; }
.nav-badge { padding: 8px 18px; border-radius: var(--card-radius-sm); font-size: 0.8rem; background: var(--card-bg); color: var(--text-secondary); border: 1px solid var(--border); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
.nav-badge-accent { padding: 8px 18px; border-radius: var(--card-radius-sm); font-size: 0.8rem; font-weight: 600; background: var(--badge-bg); color: var(--badge-text); border: 1px solid var(--accent-glow); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }

/* ====== COUNTDOWN ====== */
.countdown-section { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 6rem 1rem 2rem; }
.countdown-inner { max-width: 600px; width: 100%; text-align: center; }
.scroll-hint { margin-top: 5rem; animation: fadeIn 0.6s ease-out 0.5s both; }

/* ====== SECTION HEADERS ====== */
.section-header { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem; }
.section-title { font-family: var(--font-heading); font-size: 1.5rem; font-weight: 600; color: var(--text-primary); }
.section-subtitle { font-size: 0.85rem; color: var(--text-muted); margin-top: 4px; }

/* ====== BUTTONS ====== */
.btn-primary { padding: 10px 24px; border-radius: var(--card-radius-sm); font-size: 0.85rem; font-weight: 500; background: var(--accent); color: #fff; border: none; cursor: pointer; transition: all 0.2s ease; text-decoration: none; display: inline-block; box-shadow: 0 4px 16px var(--accent-glow); }
.btn-primary:hover { filter: brightness(1.1); transform: translateY(-1px); }
.btn-sm { padding: 8px 18px; font-size: 0.8rem; }

/* ====== TABS ====== */
.tabs-row { display: flex; gap: 8px; margin-bottom: 1.5rem; flex-wrap: wrap; }
.tab-btn { padding: 8px 20px; border-radius: var(--card-radius-sm); font-size: 0.82rem; font-weight: 500; border: 1px solid transparent; cursor: pointer; transition: all 0.2s ease; background: transparent; color: var(--text-muted); }
.tab-btn.active { background: var(--card-bg); color: var(--text-primary); border-color: var(--border); box-shadow: var(--card-shadow); }
.tab-btn:hover:not(.active) { color: var(--text-secondary); background: var(--card-bg); }

/* ====== RANKINGS - Single Column List ====== */
.ranking-section { padding: 4rem 1rem 4rem; border-top: 1px solid var(--border); }
.rank-list { display: flex; flex-direction: column; gap: 10px; }

.rank-row {
  display: flex; align-items: center; gap: 16px;
  padding: 14px 20px;
  background: var(--card-bg); border: 1px solid var(--border);
  border-radius: var(--card-radius); cursor: pointer;
  transition: all 0.25s ease;
  animation: slideUp 0.45s ease-out both;
}
.rank-row:hover {
  border-color: var(--accent-glow);
  box-shadow: var(--card-shadow-hover);
  transform: translateX(6px);
}
.rank-gold { border-left: 4px solid #FFC107; background: linear-gradient(90deg, rgba(255,193,7,0.05), var(--card-bg) 20%); }
.rank-silver { border-left: 4px solid #C0C0C0; background: linear-gradient(90deg, rgba(192,192,192,0.05), var(--card-bg) 20%); }
.rank-bronze { border-left: 4px solid #CD7F32; background: linear-gradient(90deg, rgba(205,127,50,0.05), var(--card-bg) 20%); }

/* Rank position */
.rank-pos { width: 40px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.rank-medal { font-size: 1.8rem; }
.rank-num { font-family: var(--font-mono); font-size: 1.1rem; font-weight: 700; color: var(--text-muted); }

/* Thumb */
.rank-row-thumb {
  width: 64px; height: 64px; border-radius: 16px; overflow: hidden; flex-shrink: 0;
  border: 1px solid var(--border); background: var(--surface-hover);
}
.rank-row-thumb-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease; }
.rank-row:hover .rank-row-thumb-img { transform: scale(1.08); }
.rank-row-thumb-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; color: var(--text-muted); }

/* Info */
.rank-row-info { flex: 1; min-width: 0; }
.rank-row-name { font-family: var(--font-heading); font-size: 1rem; font-weight: 600; color: var(--text-primary); }
.rank-row-intro { font-size: 0.8rem; color: var(--text-secondary); margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rank-row-tags { display: flex; gap: 4px; margin-top: 6px; flex-wrap: wrap; }
.rank-row-tag { font-size: 0.65rem; padding: 2px 10px; border-radius: 10px; background: var(--badge-bg); color: var(--badge-text); font-weight: 500; }

/* Like area */
.rank-like-area { display: flex; flex-direction: column; align-items: center; gap: 4px; flex-shrink: 0; min-width: 56px; }
.rank-like-btn { background: none; border: none; cursor: pointer; padding: 6px; border-radius: 12px; transition: all 0.2s ease; }
.rank-like-btn:hover { background: var(--accent-glow); }
.rank-like-btn:active { transform: scale(0.9); }

.like-heart { font-size: 1.4rem; display: inline-block; transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.like-pop { animation: heartPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }

@keyframes heartPop {
  0% { transform: scale(1); }
  40% { transform: scale(1.5); }
  100% { transform: scale(1); }
}

.like-count-wrapper {
  position: relative; height: 24px; overflow: hidden;
}
.like-count {
  display: block;
  font-family: var(--font-mono);
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--accent);
  animation: countRoll 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes countRoll {
  0% { transform: translateY(-100%); opacity: 0; }
  60% { transform: translateY(8%); opacity: 1; }
  100% { transform: translateY(0); opacity: 1; }
}

/* ====== PAGINATION ====== */
.pagination { display: flex; justify-content: center; gap: 8px; margin-top: 2rem; }
.page-btn { width: 36px; height: 36px; border-radius: var(--card-radius-sm); font-size: 0.82rem; font-weight: 500; border: 1px solid var(--border); cursor: pointer; transition: all 0.2s ease; background: var(--card-bg); color: var(--text-secondary); }
.page-btn.active { background: var(--accent); color: #fff; border-color: var(--accent); box-shadow: 0 0 10px var(--accent-glow); }
.page-btn:hover:not(.active) { border-color: var(--accent-glow); color: var(--text-primary); }

/* ====== MESSAGE WALL ====== */
.message-section { padding: 4rem 1rem 4rem; border-top: 1px solid var(--border); }
.post-form { display: flex; gap: 14px; padding: 20px; margin-bottom: 2rem; background: var(--card-bg); border: 1px solid var(--border); border-radius: var(--card-radius); box-shadow: var(--card-shadow); }
.post-form-avatar { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: var(--surface-hover); font-size: 1.3rem; flex-shrink: 0; }
.post-form-body { flex: 1; display: flex; flex-direction: column; gap: 10px; }
.post-input, .post-textarea { width: 100%; padding: 10px 14px; border-radius: var(--card-radius-sm); font-size: 0.85rem; background: var(--input-bg); color: var(--text-primary); border: 1px solid var(--input-border); outline: none; transition: all 0.2s ease; font-family: var(--font-body); }
.post-textarea { resize: vertical; min-height: 60px; }
.post-input:focus, .post-textarea:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-glow); }
.post-form-footer { display: flex; align-items: center; justify-content: flex-end; gap: 12px; }
.post-error { font-size: 0.8rem; color: var(--danger-text); margin-right: auto; }

.login-prompt { text-align: center; padding: 2rem; margin-bottom: 2rem; background: var(--card-bg); border: 1px solid var(--border); border-radius: var(--card-radius); font-size: 0.9rem; color: var(--text-muted); }
.accent-link { color: var(--accent); text-decoration: none; font-weight: 500; }
.accent-link:hover { text-decoration: underline; }

.messages-list { display: flex; flex-direction: column; gap: 10px; }
.loading-msg { text-align: center; padding: 3rem; font-size: 0.85rem; color: var(--text-muted); }

/* ====== AUTHOR TOOLS ====== */
.author-section { padding: 3rem 1rem 4rem; border-top: 1px solid var(--border); }
.author-tools { display: flex; gap: 14px; flex-wrap: wrap; }
.tool-card { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 24px 32px; background: var(--card-bg); border: 1px solid var(--border); border-radius: var(--card-radius); color: var(--text-primary); text-decoration: none; font-size: 0.85rem; font-weight: 500; transition: all 0.2s ease; cursor: pointer; }
.tool-card:hover { border-color: var(--accent-glow); box-shadow: var(--card-shadow-hover); transform: translateY(-2px); }


/* ====== SCROLL PROGRESS ====== */
.scroll-progress {
  position: fixed; top: 0; left: 0; height: 2px;
  background: linear-gradient(90deg, var(--accent), var(--accent-hover));
  z-index: 9999; transition: width 0.1s linear;
}

/* ====== BACK TO TOP ====== */
.back-top-btn {
  position: fixed; bottom: 28px; right: 24px; z-index: 9998;
  width: 44px; height: 44px; border-radius: 50%;
  background: var(--card-bg); border: 1px solid var(--border);
  color: var(--text-primary); font-size: 1.2rem; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  box-shadow: var(--card-shadow); transition: all 0.25s ease;
}
.back-top-btn:hover {
  border-color: var(--accent); box-shadow: 0 0 16px var(--accent-glow);
  transform: translateY(-2px);
}

/* ====== FLOATING HEARTS ====== */
.floating-hearts { position: fixed; inset: 0; z-index: 9997; pointer-events: none; }
.floating-heart {
  position: absolute;
  font-size: 1.3rem;
  animation: floatUp 1.2s ease-out forwards;
  pointer-events: none;
  opacity: 0;
}
@keyframes floatUp {
  0% { transform: translateY(0) scale(0.5); opacity: 1; }
  40% { transform: translateY(-30px) scale(1.2); opacity: 1; }
  100% { transform: translateY(-80px) scale(0.6); opacity: 0; }
}

/* ====== SCROLL REVEAL ====== */
.reveal-section {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.6s ease-out, transform 0.6s ease-out;
}
.reveal-section.revealed {
  opacity: 1;
  transform: translateY(0);
}

/* ====== EMOJI TOGGLE ====== */
.post-input-row { display: flex; gap: 8px; }
.emoji-toggle {
  background: var(--surface-hover); border: 1px solid var(--border); border-radius: 10px;
  padding: 8px 12px; cursor: pointer; font-size: 1.1rem; transition: all 0.2s ease;
  flex-shrink: 0;
}
.emoji-toggle:hover { border-color: var(--accent); background: var(--accent-glow); }

/* ====== SUCCESS MSG ====== */
.post-success { font-size: 0.8rem; color: var(--accent); margin-right: auto; animation: fadeOut 2s ease forwards; }
@keyframes fadeOut {
  0%, 50% { opacity: 1; }
  100% { opacity: 0; }
}

.site-footer { text-align: center; padding: 2rem; font-size: 0.75rem; color: var(--text-muted); border-top: 1px solid var(--border); }
</style>