<template>
  <div
    class="rounded-2xl p-4 md:p-5 shadow-sm transition-all duration-200 hover:shadow-md"
    :class="cardClass"
  >
    <!-- Author message header -->
    <div v-if="message.type === 'author'" class="flex items-center gap-2 mb-3">
      <span class="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-600 font-medium">
        作者
      </span>
      <span v-if="authorMsg?.pinned" class="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-600 font-medium">
        置顶
      </span>
    </div>

    <!-- Author message title -->
    <h3 v-if="message.type === 'author' && authorMsg?.title" class="font-medium text-slate-800 mb-2">
      {{ authorMsg.title }}
    </h3>

    <!-- Content -->
    <p class="text-slate-600 leading-relaxed text-sm md:text-base whitespace-pre-wrap break-words">
      {{ message.type === 'author' ? (authorMsg?.content || '') : visitorMsg?.content || '' }}
    </p>

    <!-- Footer -->
    <div class="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
      <span v-if="message.type === 'visitor'" class="text-xs text-slate-400">
        {{ visitorMsg?.nickname || '匿名' }}
      </span>
      <span v-else class="text-xs text-slate-400">
        {{ formatTime(message.createdAt) }}
      </span>
      <span v-if="message.type === 'visitor'" class="text-xs text-slate-400">
        {{ formatTime(message.createdAt) }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { MessageItem, AuthorMessageItem } from '../api'

const props = defineProps<{
  message: MessageItem | AuthorMessageItem
}>()

const visitorMsg = computed(() => props.message.type === 'visitor' ? props.message as MessageItem : null)
const authorMsg = computed(() => props.message.type === 'author' ? props.message as AuthorMessageItem : null)

const cardClass = computed(() => {
  if (props.message.type === 'author') {
    return 'glass-strong border-l-4 border-l-violet-300'
  }
  return 'glass'
})

function formatTime(iso: string): string {
  const d = new Date(iso)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${month}-${day} ${h}:${m}`
}
</script>
