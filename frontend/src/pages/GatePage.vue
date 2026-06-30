<template>
  <div class="min-h-screen flex flex-col items-center justify-center px-4 py-12">
    <div class="w-full max-w-md mx-auto">
      <!-- Back link -->
      <router-link to="/" class="inline-flex items-center text-sm text-slate-400 hover:text-slate-600 mb-8 transition-colors">
        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        返回首页
      </router-link>

      <div class="glass rounded-2xl p-6 md:p-8 shadow-sm">
        <h2 class="text-xl font-light text-slate-700 text-center mb-6">
          回答几个小问题
        </h2>

        <!-- Loading -->
        <div v-if="loading" class="text-center py-8">
          <p class="text-slate-400 text-sm">加载中...</p>
        </div>

        <!-- Questions form -->
        <form v-else @submit.prevent="submitAnswers" class="space-y-6">
          <div v-for="q in questions" :key="q.id" class="space-y-2">
            <label class="block text-sm font-medium text-slate-600">
              {{ q.title }}
            </label>
            <input
              v-model="answers[q.id]"
              type="text"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/60
                     text-sm text-slate-700 placeholder-slate-300
                     focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300
                     transition-all duration-200"
              placeholder="请输入答案"
              :disabled="submitting"
            />
          </div>

          <!-- Error message -->
          <div v-if="errorMsg" class="text-sm text-rose-500 text-center py-2">
            {{ errorMsg }}
          </div>

          <!-- Submit -->
          <button
            type="submit"
            :disabled="submitting"
            class="w-full py-3 rounded-xl text-sm font-medium
                   bg-slate-800 text-white hover:bg-slate-700
                   disabled:opacity-50 disabled:cursor-not-allowed
                   transition-all duration-200 shadow-sm"
          >
            {{ submitting ? '验证中...' : '提交答案' }}
          </button>
        </form>

        <!-- No questions -->
        <div v-if="!loading && questions.length === 0" class="text-center py-8">
          <p class="text-slate-400 text-sm">暂无需回答的问题</p>
          <router-link to="/messages" class="text-violet-500 text-sm mt-2 inline-block hover:underline">
            直接进入留言区
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { getQuestions, verifyAnswers, type QuestionItem } from '../api'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const questions = ref<QuestionItem[]>([])
const loading = ref(true)
const submitting = ref(false)
const errorMsg = ref('')
const answers = reactive<Record<number, string>>({})

onMounted(async () => {
  try {
    questions.value = await getQuestions()
    // Auto-fill empty answers
    for (const q of questions.value) {
      answers[q.id] = ''
    }
  } catch {
    errorMsg.value = '加载问题失败，请刷新页面重试'
  } finally {
    loading.value = false
  }
})

async function submitAnswers() {
  errorMsg.value = ''

  // Validate all filled
  for (const q of questions.value) {
    if (!answers[q.id]?.trim()) {
      errorMsg.value = '请回答所有问题'
      return
    }
  }

  submitting.value = true
  try {
    const result = await verifyAnswers(
      questions.value.map(q => ({
        questionId: q.id,
        answer: answers[q.id].trim(),
      }))
    )

    if (result.passed) {
      authStore.setVisitorPassed()
      router.push('/messages')
    } else {
      errorMsg.value = result.message || '答案好像还差一点，再想想？'
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '验证失败'
    errorMsg.value = msg
  } finally {
    submitting.value = false
  }
}
</script>
