<template>
  <div class="min-h-screen px-4 py-8">
    <div class="w-full max-w-md mx-auto">
      <router-link to="/" class="inline-flex items-center text-sm text-slate-400 hover:text-slate-600 mb-6 transition-colors">
        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        Back
      </router-link>

      <div class="glass rounded-2xl p-6 shadow-sm">
        <h2 class="text-xl font-light text-slate-700 text-center mb-6">Create Character Card</h2>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-600 mb-1">Name *</label>
            <input v-model="name" type="text" maxlength="30"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 transition-all"
              placeholder="Character name" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-600 mb-1">Intro</label>
            <input v-model="intro" type="text" maxlength="100"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 transition-all"
              placeholder="Brief intro" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-600 mb-1">Tags (comma separated, max 5)</label>
            <input v-model="tagsInput" type="text"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 transition-all"
              placeholder="e.g. cute, cool, tsundere" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-600 mb-1">Image *</label>
            <div class="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-violet-300 transition-colors cursor-pointer"
              @click="fileInput?.click()" @dragover.prevent @drop.prevent="onDrop">
              <input ref="fileInput" type="file" accept="image/png,image/jpeg,image/webp" class="hidden" @change="onFileChange" />
              <div v-if="!preview" class="text-slate-400">
                <p class="text-sm">Click or drag to upload</p>
                <p class="text-xs mt-1">PNG / JPG / WebP, max 5MB</p>
              </div>
              <img v-else :src="preview" class="max-h-48 mx-auto rounded-lg" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-600 mb-1">Password *</label>
            <input v-model="password" type="password"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 transition-all"
              placeholder="For editing/deleting later" />
          </div>
          <p v-if="error" class="text-sm text-rose-500 text-center">{{ error }}</p>
          <button type="submit" :disabled="submitting"
            class="w-full py-3 rounded-xl text-sm font-medium bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50 transition-all shadow-sm">
            {{ submitting ? 'Creating...' : 'Create Card' }}
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

// Redirect non-authors
if (!authStore.isAuthor) {
  authStore.checkAuth().then(() => {
    if (!authStore.isAuthor) router.replace('/')
  })
}
const name = ref('')
const intro = ref('')
const tagsInput = ref('')
const password = ref('')
const file = ref<File | null>(null)
const preview = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const error = ref('')
const submitting = ref(false)

function onFileChange(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (f) setFile(f)
}
function onDrop(e: DragEvent) {
  const f = e.dataTransfer?.files?.[0]
  if (f) setFile(f)
}
function setFile(f: File) {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(f.type)) { error.value = 'Only PNG/JPG/WebP'; return }
  if (f.size > 5 * 1024 * 1024) { error.value = 'Max 5MB'; return }
  file.value = f; error.value = ''
  const reader = new FileReader()
  reader.onload = (e) => { preview.value = e.target?.result as string }
  reader.readAsDataURL(f)
}

async function handleSubmit() {
  error.value = ''
  if (!name.value.trim()) { error.value = 'Name required'; return }
  if (!file.value) { error.value = 'Image required'; return }
  if (!password.value.trim()) { error.value = 'Password required'; return }
  submitting.value = true
  try {
    const formData = new FormData()
    formData.append('name', name.value.trim())
    formData.append('intro', intro.value.trim())
    formData.append('tags', JSON.stringify(tagsInput.value.split(/[,锛孿s]+/).filter(Boolean).slice(0, 5)))
    formData.append('password', password.value.trim())
    formData.append('image', file.value)
    const result = await createCard(formData)
    router.push('/card/' + result.id)
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Create failed'
  }
  submitting.value = false
}
</script>