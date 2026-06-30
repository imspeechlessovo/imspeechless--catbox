<template>
  <div class="min-h-screen px-4 py-8">
    <div class="w-full max-w-md mx-auto">
      <router-link to="/" class="inline-flex items-center text-sm text-slate-400 hover:text-slate-600 mb-6 transition-colors">
        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        返回首页
      </router-link>

      <div class="glass rounded-2xl p-6 shadow-sm">
        <h2 class="text-xl font-light text-slate-700 text-center mb-6">修改粉丝登录问题</h2>

        <div v-if="loading" class="text-center py-8"><p class="text-slate-400 text-sm">加载中...</p></div>

        <div v-else class="space-y-4">
          <div v-for="q in questions" :key="q.id" class="p-4 rounded-xl border border-slate-100 bg-white/40 space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-xs text-slate-400">问题 #{{ q.id }}</span>
              <div class="flex items-center gap-2">
                <button @click="toggleEnabled(q)" class="text-xs px-2 py-0.5 rounded-full transition-colors"
                  :class="q.enabled ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-100 text-slate-400'">
                  {{ q.enabled ? '启用' : '停用' }}
                </button>
                <button @click="deleteQ(q.id)" class="text-xs text-slate-300 hover:text-rose-500 transition-colors">删除</button>
              </div>
            </div>
            <input v-model="q.title" class="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white/60 text-sm focus:outline-none focus:ring-1 focus:ring-violet-200" />
            <div class="flex items-center gap-2">
              <input v-model="q._answer" type="text" placeholder="正确答案" class="flex-1 px-3 py-2 rounded-lg border border-slate-200 bg-white/60 text-sm focus:outline-none focus:ring-1 focus:ring-violet-200" />
              <button @click="saveQ(q)" :disabled="q._saving" class="px-4 py-2 rounded-lg text-xs font-medium bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50 transition-all">
                {{ q._saving ? '保存中' : '保存' }}
              </button>
            </div>
          </div>

          <!-- Add new question -->
          <div class="p-4 rounded-xl border border-dashed border-slate-200 space-y-3">
            <p class="text-xs text-slate-400">新增问题</p>
            <input v-model="newTitle" class="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white/60 text-sm focus:outline-none focus:ring-1 focus:ring-violet-200" placeholder="问题内容" />
            <div class="flex items-center gap-2">
              <input v-model="newAnswer" type="text" placeholder="正确答案" class="flex-1 px-3 py-2 rounded-lg border border-slate-200 bg-white/60 text-sm focus:outline-none focus:ring-1 focus:ring-violet-200" />
              <button @click="addQ" :disabled="adding || !newTitle.trim() || !newAnswer.trim()" class="px-4 py-2 rounded-lg text-xs font-medium bg-violet-500 text-white hover:bg-violet-600 disabled:opacity-50 transition-all">
                {{ adding ? '添加中' : '添加' }}
              </button>
            </div>
          </div>

          <p v-if="saveMsg" class="text-xs text-center" :class="saveOk ? 'text-emerald-500' : 'text-rose-500'">{{ saveMsg }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { getAuthorQuestions, createQuestion, updateQuestion, deleteQuestion, type QuestionFull } from '../api'

const router = useRouter()
const authStore = useAuthStore()

interface Q extends QuestionFull {
  _answer: string
  _saving: boolean
}

const questions = ref<Q[]>([])
const loading = ref(true)
const newTitle = ref('')
const newAnswer = ref('')
const adding = ref(false)
const saveMsg = ref('')
const saveOk = ref(false)

onMounted(async () => {
  await authStore.checkAuth()
  if (!authStore.isAuthor) { router.replace('/'); return }
  await load()
  loading.value = false
})

async function load() {
  try {
    const data = await getAuthorQuestions()
    questions.value = data.map(q => ({ ...q, _answer: '', _saving: false }))
  } catch {}
}

async function saveQ(q: Q) {
  q._saving = true
  try {
    const body: Record<string, unknown> = { title: q.title, enabled: q.enabled }
    if (q._answer.trim()) body.answer = q._answer.trim()
    await updateQuestion(q.id, body)
    q._answer = ''
    showMsg('已保存', true)
  } catch (err: unknown) {
    showMsg(err instanceof Error ? err.message : '保存失败', false)
  }
  q._saving = false
}

async function toggleEnabled(q: Q) {
  try {
    await updateQuestion(q.id, { enabled: !q.enabled })
    q.enabled = !q.enabled
  } catch {}
}

async function deleteQ(id: number) {
  if (!confirm('确定删除此问题？')) return
  try {
    await deleteQuestion(id)
    questions.value = questions.value.filter(q => q.id !== id)
    showMsg('已删除', true)
  } catch (err: unknown) {
    showMsg(err instanceof Error ? err.message : '删除失败', false)
  }
}

async function addQ() {
  if (!newTitle.value.trim() || !newAnswer.value.trim()) return
  adding.value = true
  try {
    const q = await createQuestion({ title: newTitle.value.trim(), answer: newAnswer.value.trim() })
    questions.value.push({ ...q, _answer: '', _saving: false })
    newTitle.value = ''
    newAnswer.value = ''
    showMsg('已添加', true)
  } catch (err: unknown) {
    showMsg(err instanceof Error ? err.message : '添加失败', false)
  }
  adding.value = false
}

function showMsg(msg: string, ok: boolean) {
  saveMsg.value = msg
  saveOk.value = ok
  setTimeout(() => { saveMsg.value = '' }, 2000)
}
</script>