<template>
  <div style="background: var(--page-bg); min-height: 100vh; transition: background var(--transition-speed) ease;" class="flex flex-col items-center justify-center px-4 py-12">
    <div class="w-full max-w-md mx-auto">
      <router-link to="/" class="inline-flex items-center text-sm mb-8 transition-colors" :style="{ color: 'var(--text-secondary)' }">
        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        返回首页
      </router-link>

      <div class="glass rounded-2xl p-6 md:p-8">
        <div class="text-center mb-6">
          <span class="text-4xl">🥑</span>
          <h2 class="text-xl font-light mt-3" :style="{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }">想进小黑屋？先过我这关</h2>
          <p class="text-xs mt-1" :style="{ color: 'var(--text-muted)' }">答对了就放你进去（笑）</p>
        </div>

        <div v-if="loading" class="text-center py-8">
          <p :style="{ color: 'var(--text-muted)' }" class="text-sm">加载中...</p>
        </div>

        <form v-else @submit.prevent="submitAnswers" class="space-y-6">
          <div v-for="q in questions" :key="q.id" class="space-y-2">
            <label class="block text-sm font-medium" :style="{ color: 'var(--text-primary)' }">
              {{ q.title }}
            </label>
            <input
              v-model="answers[q.id]"
              type="text"
              class="w-full px-4 py-2.5 rounded-xl text-sm transition-all outline-none"
              :style="{
                background: 'var(--input-bg)',
                color: 'var(--text-primary)',
                border: '1px solid var(--input-border)',
                borderRadius: 'var(--card-radius)',
                fontFamily: 'var(--font-body)',
              }"
              placeholder="把答案敲这里"
              :disabled="submitting"
              @focus="(e: any) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)'; }"
              @blur="(e: any) => { e.target.style.borderColor = 'var(--input-border)'; e.target.style.boxShadow = 'none'; }"
            />
          </div>

          <div v-if="errorMsg" class="text-sm text-center py-2" :style="{ color: 'var(--danger-text)' }">
            {{ errorMsg }}
          </div>

          <button type="submit" :disabled="submitting"
            class="w-full py-3 rounded-xl text-sm font-medium disabled:opacity-40 transition-all shadow-lg cursor-pointer"
            :style="{
              background: 'var(--accent)',
              color: '#FFFFFF',
              borderRadius: 'var(--card-radius)',
              boxShadow: '0 4px 12px var(--accent-glow)',
            }">
            {{ submitting ? '验证中...' : '我确定！' }}
          </button>
        </form>

        <div v-if="!loading && questions.length === 0" class="text-center py-8">
          <p :style="{ color: 'var(--text-muted)' }" class="text-sm">暂无需回答的问题</p>
          <router-link to="/" :style="{ color: 'var(--accent)' }" class="text-sm mt-2 inline-block hover:underline">
            返回首页
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
  for (const q of questions.value) {
    if (!answers[q.id]?.trim()) {
      errorMsg.value = '请回答所有问题'
      return
    }
  }
  submitting.value = true
  try {
    const result = await verifyAnswers(
      questions.value.map(q => ({ questionId: q.id, answer: answers[q.id].trim() }))
    )
    if (result.passed) {
      authStore.setVisitorPassed()
      router.push('/')
    } else {
      errorMsg.value = result.message || '答案好像还差一点，再想想？'
    }
  } catch (err: unknown) {
    errorMsg.value = err instanceof Error ? err.message : '验证失败'
  } finally {
    submitting.value = false
  }
}
</script>