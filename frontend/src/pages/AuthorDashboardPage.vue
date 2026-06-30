<template>
  <div class="min-h-screen px-4 py-8">
    <div class="w-full max-w-4xl mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div class="flex items-center gap-4">
          <router-link to="/" class="text-sm text-slate-400 hover:text-slate-600 transition-colors">
            首页
          </router-link>
          <router-link to="/messages" class="text-sm text-slate-400 hover:text-slate-600 transition-colors">
            留言墙
          </router-link>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-xs text-slate-400">作者：{{ authStore.authorDisplayName }}</span>
          <button @click="handleLogout" class="text-xs text-rose-400 hover:text-rose-500 transition-colors">
            退出
          </button>
        </div>
      </div>

      <h2 class="text-xl font-light text-slate-700 mb-6">作者后台</h2>

      <!-- Auth guard -->
      <div v-if="!authStore.isAuthor && !authStore.loading" class="text-center py-12">
        <p class="text-slate-400 text-sm mb-4">需要作者登录</p>
        <router-link to="/author/login" class="text-violet-500 text-sm hover:underline">
          前往登录
        </router-link>
      </div>

      <template v-else-if="authStore.isAuthor">
        <!-- Tabs -->
        <div class="flex gap-2 mb-6 border-b border-slate-200 pb-2 overflow-x-auto">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            @click="activeTab = tab.key"
            class="px-4 py-2 text-sm rounded-lg transition-colors whitespace-nowrap"
            :class="activeTab === tab.key
              ? 'bg-slate-800 text-white'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- Tab: Author Messages -->
        <div v-if="activeTab === 'author-messages'" class="space-y-6">
          <!-- Create form -->
          <div class="glass rounded-2xl p-4 md:p-6 shadow-sm">
            <h3 class="text-sm font-medium text-slate-600 mb-4">发布作者留言</h3>
            <form @submit.prevent="createAuthorMsg" class="space-y-3">
              <input v-model="authorForm.title" type="text" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/60 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-200 transition-all" placeholder="标题（必填）" maxlength="100" />
              <textarea v-model="authorForm.content" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/60 text-sm text-slate-700 placeholder-slate-300 resize-none focus:outline-none focus:ring-2 focus:ring-violet-200 transition-all" rows="3" placeholder="内容（必填）" maxlength="500"></textarea>
              <div class="flex items-center gap-4">
                <label class="flex items-center gap-2 text-sm text-slate-500">
                  <input v-model="authorForm.pinned" type="checkbox" class="rounded" /> 置顶
                </label>
                <label class="flex items-center gap-2 text-sm text-slate-500">
                  <input v-model="authorForm.visible" type="checkbox" class="rounded" /> 可见
                </label>
              </div>
              <button type="submit" class="px-6 py-2 rounded-xl text-sm font-medium bg-slate-800 text-white hover:bg-slate-700 transition-all shadow-sm">发布</button>
            </form>
            <p v-if="authorFormError" class="text-sm text-rose-500 mt-2">{{ authorFormError }}</p>
          </div>

          <!-- List -->
          <div class="space-y-3">
            <div v-for="msg in authorMsgList" :key="msg.id" class="glass rounded-xl p-4 shadow-sm">
              <div class="flex items-start justify-between">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <h4 class="font-medium text-slate-700 text-sm">{{ msg.title }}</h4>
                    <span v-if="msg.pinned" class="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-600">置顶</span>
                    <span v-if="!msg.visible" class="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-400">隐藏</span>
                  </div>
                  <p class="text-sm text-slate-500 line-clamp-2">{{ msg.content }}</p>
                  <p class="text-xs text-slate-400 mt-1">{{ formatTime(msg.createdAt) }}</p>
                </div>
                <div class="flex items-center gap-2 ml-4 flex-shrink-0">
                  <button @click="toggleAuthorMsg(msg)" class="text-xs text-slate-400 hover:text-slate-600 transition-colors">
                    {{ msg.visible ? '隐藏' : '显示' }}
                  </button>
                  <button @click="deleteAuthorMsg(msg.id)" class="text-xs text-rose-400 hover:text-rose-500 transition-colors">删除</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab: Visitor Messages -->
        <div v-if="activeTab === 'visitor-messages'" class="space-y-3">
          <div v-for="msg in visitorMsgList" :key="msg.id" class="glass rounded-xl p-4 shadow-sm">
            <div class="flex items-start justify-between">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-sm font-medium text-slate-600">{{ msg.nickname }}</span>
                  <span v-if="!msg.visible" class="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-400">隐藏</span>
                </div>
                <p class="text-sm text-slate-500">{{ msg.content }}</p>
                <p class="text-xs text-slate-400 mt-1">{{ formatTime(msg.createdAt) }}</p>
              </div>
              <div class="flex items-center gap-2 ml-4 flex-shrink-0">
                <button @click="toggleVisitorMsg(msg)" class="text-xs text-slate-400 hover:text-slate-600 transition-colors">
                  {{ msg.visible ? '隐藏' : '显示' }}
                </button>
                <button @click="deleteVisitorMsg(msg.id)" class="text-xs text-rose-400 hover:text-rose-500 transition-colors">删除</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab: Questions -->
        <div v-if="activeTab === 'questions'" class="space-y-6">
          <!-- Create form -->
          <div class="glass rounded-2xl p-4 md:p-6 shadow-sm">
            <h3 class="text-sm font-medium text-slate-600 mb-4">新增问题</h3>
            <form @submit.prevent="createQ" class="space-y-3">
              <input v-model="questionForm.title" type="text" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/60 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-200 transition-all" placeholder="问题内容" maxlength="200" />
              <div class="flex gap-3">
                <input v-model="questionForm.answer" type="text" class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white/60 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-200 transition-all" placeholder="答案（不区分大小写）" />
                <input v-model.number="questionForm.sortOrder" type="number" class="w-20 px-3 py-2.5 rounded-xl border border-slate-200 bg-white/60 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-200 transition-all" placeholder="排序" />
              </div>
              <button type="submit" class="px-6 py-2 rounded-xl text-sm font-medium bg-slate-800 text-white hover:bg-slate-700 transition-all shadow-sm">添加</button>
            </form>
          </div>

          <!-- List -->
          <div class="space-y-3">
            <div v-for="q in questionList" :key="q.id" class="glass rounded-xl p-4 shadow-sm">
              <div class="flex items-start justify-between">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-sm font-medium text-slate-700">{{ q.title }}</span>
                    <span v-if="!q.enabled" class="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-400">已禁用</span>
                    <span class="text-xs text-slate-400">排序: {{ q.sortOrder }}</span>
                  </div>
                </div>
                <div class="flex items-center gap-2 ml-4 flex-shrink-0">
                  <button @click="toggleQuestion(q)" class="text-xs text-slate-400 hover:text-slate-600 transition-colors">
                    {{ q.enabled ? '禁用' : '启用' }}
                  </button>
                  <button @click="handleDeleteQuestion(q.id)" class="text-xs text-rose-400 hover:text-rose-500 transition-colors">删除</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import {
  authorLogout,
  getAuthorMessages, createAuthorMessage, updateAuthorMessage, deleteAuthorMessage,
  getVisitorMessages, updateVisitorMessage, deleteVisitorMessage,
  getAuthorQuestions, createQuestion, updateQuestion, deleteQuestion,
  type AuthorMessageFull, type VisitorMessageFull, type QuestionFull,
} from '../api'

const router = useRouter()
const authStore = useAuthStore()

const activeTab = ref('author-messages')
const tabs = [
  { key: 'author-messages', label: '作者留言' },
  { key: 'visitor-messages', label: '访客留言' },
  { key: 'questions', label: '答题问题' },
]

// Author messages
const authorMsgList = ref<AuthorMessageFull[]>([])
const authorForm = reactive({ title: '', content: '', pinned: false, visible: true })
const authorFormError = ref('')

// Visitor messages
const visitorMsgList = ref<VisitorMessageFull[]>([])

// Questions
const questionList = ref<QuestionFull[]>([])
const questionForm = reactive({ title: '', answer: '', sortOrder: 0 })

onMounted(async () => {
  await authStore.checkAuth()
  if (authStore.isAuthor) {
    loadTab()
  }
})

watch(activeTab, () => loadTab())

function loadTab() {
  switch (activeTab.value) {
    case 'author-messages': loadAuthorMessages(); break
    case 'visitor-messages': loadVisitorMessages(); break
    case 'questions': loadQuestions(); break
  }
}

async function loadAuthorMessages() {
  try { authorMsgList.value = await getAuthorMessages() } catch {}
}

async function loadVisitorMessages() {
  try { visitorMsgList.value = await getVisitorMessages() } catch {}
}

async function loadQuestions() {
  try { questionList.value = await getAuthorQuestions() } catch {}
}

async function handleLogout() {
  try {
    await authorLogout()
  } catch {}
  authStore.clearAuthor()
  router.push('/')
}

// Author message actions
async function createAuthorMsg() {
  authorFormError.value = ''
  if (!authorForm.title.trim() || !authorForm.content.trim()) {
    authorFormError.value = '请填写标题和内容'
    return
  }
  try {
    await createAuthorMessage({
      title: authorForm.title.trim(),
      content: authorForm.content.trim(),
      pinned: authorForm.pinned,
      visible: authorForm.visible,
    })
    authorForm.title = ''
    authorForm.content = ''
    authorForm.pinned = false
    authorForm.visible = true
    await loadAuthorMessages()
  } catch (err: unknown) {
    authorFormError.value = err instanceof Error ? err.message : '发布失败'
  }
}

async function toggleAuthorMsg(msg: AuthorMessageFull) {
  try {
    await updateAuthorMessage(msg.id, { visible: !msg.visible })
    await loadAuthorMessages()
  } catch {}
}

async function deleteAuthorMsg(id: number) {
  if (!confirm('确定删除这条作者留言？')) return
  try {
    await deleteAuthorMessage(id)
    await loadAuthorMessages()
  } catch {}
}

// Visitor message actions
async function toggleVisitorMsg(msg: VisitorMessageFull) {
  try {
    await updateVisitorMessage(msg.id, { visible: !msg.visible })
    await loadVisitorMessages()
  } catch {}
}

async function deleteVisitorMsg(id: number) {
  if (!confirm('确定删除这条访客留言？')) return
  try {
    await deleteVisitorMessage(id)
    await loadVisitorMessages()
  } catch {}
}

// Question actions
async function createQ() {
  if (!questionForm.title.trim() || !questionForm.answer.trim()) return
  try {
    await createQuestion({
      title: questionForm.title.trim(),
      answer: questionForm.answer.trim(),
      sortOrder: questionForm.sortOrder,
    })
    questionForm.title = ''
    questionForm.answer = ''
    questionForm.sortOrder = 0
    await loadQuestions()
  } catch {}
}

async function toggleQuestion(q: QuestionFull) {
  try {
    await updateQuestion(q.id, { enabled: !q.enabled })
    await loadQuestions()
  } catch {}
}

async function handleDeleteQuestion(id: number) {
  if (!confirm('确定删除这个问题？')) return
  try {
    await deleteQuestion(id)
    await loadQuestions()
  } catch {}
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}
</script>


