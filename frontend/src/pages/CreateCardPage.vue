<template>
  <div style="background: var(--page-bg); min-height: 100vh; transition: background var(--transition-speed) ease;" class="px-4 py-8">
    <div class="w-full max-w-md mx-auto">
      <router-link to="/" class="inline-flex items-center text-sm mb-6 transition-colors" :style="{ color: 'var(--text-secondary)' }">
        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        返回
      </router-link>

      <div class="glass rounded-2xl p-6">
        <div class="text-center mb-6">
          <span class="text-3xl">🥑</span>
          <h2 class="text-xl font-light mt-2" :style="{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }">捏个新角色</h2>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1" :style="{ color: 'var(--text-primary)' }">角色叫啥 *</label>
            <input v-model="name" type="text" maxlength="30"
              class="w-full px-4 py-2.5 rounded-xl text-sm transition-all outline-none"
              :style="{
                background: 'var(--input-bg)',
                color: 'var(--text-primary)',
                border: '1px solid var(--input-border)',
                borderRadius: 'var(--card-radius)',
                fontFamily: 'var(--font-body)',
              }"
              placeholder="角色名"
              @focus="(e: any) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)'; }"
              @blur="(e: any) => { e.target.style.borderColor = 'var(--input-border)'; e.target.style.boxShadow = 'none'; }" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1" :style="{ color: 'var(--text-primary)' }">一句话简介</label>
            <input v-model="intro" type="text" maxlength="100"
              class="w-full px-4 py-2.5 rounded-xl text-sm transition-all outline-none"
              :style="{
                background: 'var(--input-bg)',
                color: 'var(--text-primary)',
                border: '1px solid var(--input-border)',
                borderRadius: 'var(--card-radius)',
                fontFamily: 'var(--font-body)',
              }"
              placeholder="简短介绍"
              @focus="(e: any) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)'; }"
              @blur="(e: any) => { e.target.style.borderColor = 'var(--input-border)'; e.target.style.boxShadow = 'none'; }" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1" :style="{ color: 'var(--text-primary)' }">标签（逗号分隔，最多5个）</label>
            <input v-model="tagsInput" type="text"
              class="w-full px-4 py-2.5 rounded-xl text-sm transition-all outline-none"
              :style="{
                background: 'var(--input-bg)',
                color: 'var(--text-primary)',
                border: '1px solid var(--input-border)',
                borderRadius: 'var(--card-radius)',
                fontFamily: 'var(--font-body)',
              }"
              placeholder="如：可爱, 傲娇, 高冷"
              @focus="(e: any) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)'; }"
              @blur="(e: any) => { e.target.style.borderColor = 'var(--input-border)'; e.target.style.boxShadow = 'none'; }" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1" :style="{ color: 'var(--text-primary)' }">来张靓照 *</label>
            <div class="border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer"
              :style="{ borderColor: 'var(--border)' }"
              @click="fileInput?.click()" @dragover.prevent @drop.prevent="onDrop">
              <input ref="fileInput" type="file" accept="image/png,image/jpeg,image/webp" class="hidden" @change="onFileChange" />
              <div v-if="!preview" :style="{ color: 'var(--text-muted)' }">
                <p class="text-sm">点击或拖拽上传</p>
                <p class="text-xs mt-1">PNG / JPG / WebP，最大5MB</p>
              </div>
              <img v-else :src="preview" class="max-h-48 mx-auto rounded-lg" />
            </div>
          </div>
          <p v-if="error" class="text-sm text-center" :style="{ color: 'var(--danger-text)' }">{{ error }}</p>
          <button type="submit" :disabled="submitting"
            class="w-full py-3 rounded-xl text-sm font-medium disabled:opacity-40 transition-all shadow-lg cursor-pointer"
            :style="{
              background: 'var(--accent)',
              color: '#FFFFFF',
              borderRadius: 'var(--card-radius)',
              boxShadow: '0 4px 12px var(--accent-glow)',
            }">
            {{ submitting ? '捏好了！中...' : '捏个新角色' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { createCard } from '../api'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()
if (!authStore.isAuthor) { authStore.checkAuth().then(() => { if (!authStore.isAuthor) router.replace('/') }) }

const name = ref('')
const intro = ref('')
const tagsInput = ref('')
const file = ref<File | null>(null)
const preview = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const error = ref('')
const submitting = ref(false)

function onFileChange(e: Event) { const f = (e.target as HTMLInputElement).files?.[0]; if (f) setFile(f) }
function onDrop(e: DragEvent) { const f = e.dataTransfer?.files?.[0]; if (f) setFile(f) }
function setFile(f: File) {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(f.type)) { error.value = '只支持 PNG/JPG/WebP'; return }
  if (f.size > 5 * 1024 * 1024) { error.value = '文件大小不能超过 5MB'; return }
  file.value = f; error.value = ''
  const reader = new FileReader()
  reader.onload = (e) => { preview.value = e.target?.result as string }
  reader.readAsDataURL(f)
}

async function handleSubmit() {
  error.value = ''
  if (!name.value.trim()) { error.value = '请输入角色名'; return }
  if (!file.value) { error.value = '请上传角色图'; return }
  submitting.value = true
  try {
    const formData = new FormData()
    formData.append('name', name.value.trim())
    formData.append('intro', intro.value.trim())
    formData.append('tags', JSON.stringify(tagsInput.value.split(/[,]/).filter(Boolean).slice(0, 5)))
    formData.append('image', file.value)
    const result = await createCard(formData)
    router.push('/card/' + result.id)
  } catch (err: unknown) { error.value = err instanceof Error ? err.message : '捏好了！失败' }
  submitting.value = false
}
</script>