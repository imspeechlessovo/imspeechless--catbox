<template>
  <div class="min-h-screen px-4 py-8">
    <div class="w-full max-w-md mx-auto">
      <router-link to="/" class="inline-flex items-center text-sm text-slate-400 hover:text-slate-600 mb-6 transition-colors">
        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        返回
      </router-link>

      <div class="glass rounded-2xl p-6 shadow-sm">
        <h2 class="text-xl font-light text-slate-700 text-center mb-6">管理角色卡</h2>

        <!-- Password gate -->
        <div v-if="!authorized" class="space-y-4">
          <p class="text-sm text-slate-500 text-center">请输入创建时设置的管理密码</p>
          <input v-model="password" type="password"
            class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 transition-all"
            placeholder="管理密码" @keyup.enter="verifyPassword" />
          <button @click="verifyPassword" :disabled="checking"
            class="w-full py-3 rounded-xl text-sm font-medium bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50 transition-all">
            {{ checking ? '验证中...' : '验证' }}
          </button>
          <p v-if="authError" class="text-sm text-rose-500 text-center">{{ authError }}</p>
        </div>

        <!-- Edit form -->
        <div v-else class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-600 mb-1">角色名</label>
            <input v-model="editName" type="text" maxlength="30"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 transition-all" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-600 mb-1">一句话简介</label>
            <input v-model="editIntro" type="text" maxlength="100"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 transition-all" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-600 mb-1">标签（逗号分隔）</label>
            <input v-model="editTags" type="text"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 transition-all" />
          </div>

          <p v-if="saveMsg" class="text-sm text-center" :class="saveOk ? 'text-emerald-500' : 'text-rose-500'">{{ saveMsg }}</p>

          <button @click="handleSave" :disabled="saving"
            class="w-full py-3 rounded-xl text-sm font-medium bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50 transition-all">
            {{ saving ? '保存中...' : '保存修改' }}
          </button>

          <button @click="handleDelete" :disabled="deleting"
            class="w-full py-3 rounded-xl text-sm font-medium bg-rose-50 text-rose-500 hover:bg-rose-100 disabled:opacity-50 transition-all">
            {{ deleting ? '删除中...' : '删除角色卡' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getCard, verifyCardPassword, updateCard, deleteCard, type CardDetail } from '../api'

const route = useRoute()
const router = useRouter()
const cardId = Number(route.params.id)

const authorized = ref(false)
const manageToken = ref('')
const password = ref('')
const checking = ref(false)
const authError = ref('')

const editName = ref('')
const editIntro = ref('')
const editTags = ref('')
const saving = ref(false)
const deleting = ref(false)
const saveMsg = ref('')
const saveOk = ref(false)

onMounted(async () => {
  try {
    const card = await getCard(cardId)
    editName.value = card.name
    editIntro.value = card.intro
    editTags.value = card.tags.join(', ')
  } catch {}
})

async function verifyPassword() {
  authError.value = ''
  checking.value = true
  try {
    const result = await verifyCardPassword(cardId, password.value)
    manageToken.value = result.token
    authorized.value = true
  } catch (err: unknown) {
    authError.value = err instanceof Error ? err.message : '密码错误'
  }
  checking.value = false
}

async function handleSave() {
  saveMsg.value = ''; saving.value = true
  try {
    await updateCard(cardId, {
      name: editName.value.trim(),
      intro: editIntro.value.trim(),
      tags: editTags.value.split(/[,，\s]+/).filter(Boolean),
    }, manageToken.value)
    saveMsg.value = '保存成功'; saveOk.value = true
  } catch (err: unknown) {
    saveMsg.value = err instanceof Error ? err.message : '保存失败'; saveOk.value = false
  }
  saving.value = false
}

async function handleDelete() {
  if (!confirm('确定删除这张角色卡？此操作不可撤销。')) return
  deleting.value = true
  try {
    await deleteCard(cardId, manageToken.value)
    router.push('/')
  } catch (err: unknown) {
    saveMsg.value = err instanceof Error ? err.message : '删除失败'; saveOk.value = false
  }
  deleting.value = false
}
</script>