<template>
  <div class="min-h-screen bg-[#0d1117] px-4 py-8">
    <div class="w-full max-w-md mx-auto">
      <router-link to="/" class="inline-flex items-center text-sm text-[#8b949e] hover:text-[#86C440] mb-6 transition-colors">
        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        返回
      </router-link>

      <div class="glass rounded-2xl p-6">
        <h2 class="text-xl font-light text-[#e6edf3] text-center mb-6">管理角色卡</h2>

        <div v-if="loading" class="text-center py-8"><p class="text-[#8b949e] text-sm">加载中...</p></div>

        <div v-else-if="!isAuthor" class="text-center py-8">
          <p class="text-[#8b949e] text-sm">只有作者才能管理角色卡</p>
          <router-link to="/author/login" class="text-[#86C440] text-sm mt-2 inline-block hover:underline">作者登录</router-link>
        </div>

        <div v-else class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-[#e6edf3] mb-1">角色名</label>
            <input v-model="editName" type="text" maxlength="30"
              class="w-full px-4 py-2.5 rounded-xl border border-[#21262d] bg-[#0d1117]/60 text-sm text-[#e6edf3] focus:outline-none focus:ring-2 focus:ring-[#86C440]/30 transition-all" />
          </div>
          <div>
            <label class="block text-sm font-medium text-[#e6edf3] mb-1">一句话简介</label>
            <input v-model="editIntro" type="text" maxlength="100"
              class="w-full px-4 py-2.5 rounded-xl border border-[#21262d] bg-[#0d1117]/60 text-sm text-[#e6edf3] focus:outline-none focus:ring-2 focus:ring-[#86C440]/30 transition-all" />
          </div>
          <div>
            <label class="block text-sm font-medium text-[#e6edf3] mb-1">标签（逗号分隔）</label>
            <input v-model="editTags" type="text"
              class="w-full px-4 py-2.5 rounded-xl border border-[#21262d] bg-[#0d1117]/60 text-sm text-[#e6edf3] focus:outline-none focus:ring-2 focus:ring-[#86C440]/30 transition-all" />
          </div>

          <p v-if="saveMsg" class="text-sm text-center" :class="saveOk ? 'text-[#86C440]' : 'text-rose-400'">{{ saveMsg }}</p>

          <button @click="handleSave" :disabled="saving"
            class="w-full py-3 rounded-xl text-sm font-medium bg-[#86C440] text-[#0d1117] hover:bg-[#A8D96A] disabled:opacity-40 transition-all">
            {{ saving ? '保存中...' : '保存修改' }}
          </button>

          <button @click="handleDelete" :disabled="deleting"
            class="w-full py-3 rounded-xl text-sm font-medium bg-rose-400/15 text-rose-400 hover:bg-rose-400/25 disabled:opacity-40 transition-all border border-rose-400/20">
            {{ deleting ? '删除中...' : '删除角色卡' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getCard, updateCard, deleteCard, type CardDetail } from '../api'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const cardId = Number(route.params.id)

const isAuthor = computed(() => authStore.isAuthor)
const loading = ref(true)

const editName = ref('')
const editIntro = ref('')
const editTags = ref('')
const saving = ref(false)
const deleting = ref(false)
const saveMsg = ref('')
const saveOk = ref(false)

onMounted(async () => {
  await authStore.checkAuth()
  try {
    const card = await getCard(cardId)
    editName.value = card.name
    editIntro.value = card.intro
    editTags.value = card.tags.join(', ')
  } catch {}
  loading.value = false
})

async function handleSave() {
  saveMsg.value = ''; saving.value = true
  try {
    await updateCard(cardId, {
      name: editName.value.trim(),
      intro: editIntro.value.trim(),
      tags: editTags.value.split(/[,，\s]+/).filter(Boolean),
    })
    saveMsg.value = '保存成功'; saveOk.value = true
  } catch (err: unknown) {
    saveMsg.value = err instanceof Error ? err.message : '保存失败'; saveOk.value = false
  }
  saving.value = false
}

async function handleDelete() {
  if (!confirm('确定删除这张角色卡？不可撤销。')) return
  deleting.value = true
  try {
    await deleteCard(cardId)
    router.push('/')
  } catch (err: unknown) {
    saveMsg.value = err instanceof Error ? err.message : '删除失败'; saveOk.value = false
  }
  deleting.value = false
}
</script>