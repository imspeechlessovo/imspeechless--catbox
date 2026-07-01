<template>
  <div class="msg-card" :class="{ 'msg-author': message.type === 'author', 'msg-visitor': message.type === 'visitor' }">
    <!-- Author badge -->
    <div v-if="message.type === 'author'" class="msg-badges">
      <span class="msg-badge-author">作者</span>
      <span v-if="authorMsg?.pinned" class="msg-badge-pin">📌 置顶</span>
    </div>
    <div v-else-if="visitorMsg?.pinned" class="msg-badges">
      <span class="msg-badge-pin">📌 置顶</span>
    </div>

    <!-- Avatar -->
    <div class="msg-avatar" :class="{ 'avatar-author': message.type === 'author' }">
      {{ message.type === 'author' ? '🥑' : (visitorMsg?.nickname || '?')[0] }}
    </div>

    <!-- Content bubble -->
    <div class="msg-bubble">
      <h3 v-if="message.type === 'author' && authorMsg?.title" class="msg-title">
        {{ authorMsg.title }}
      </h3>
      <p class="msg-content">
        {{ message.type === 'author' ? (authorMsg?.content || '') : visitorMsg?.content || '' }}
      </p>
    </div>

    <!-- Meta row -->
    <div class="msg-meta">
      <span class="msg-nickname" :title="message.type === 'visitor' ? visitorMsg?.nickname : '作者'">
        {{ message.type === 'author' ? '🥑 牛油果' : (visitorMsg?.nickname || '匿名') }}
      </span>
      <span class="msg-time">{{ formatTime(message.createdAt) }}</span>

      <!-- Author controls -->
      <div v-if="isAuthor" class="msg-controls">
        <button @click="emit('pin', message)" class="msg-ctrl-btn" :class="{ active: isPinned }" title="置顶">
          📌
        </button>
        <button @click="emit('delete', message)" class="msg-ctrl-btn msg-ctrl-del" title="删除">
          🗑
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { MessageItem, AuthorMessageItem } from '../api'

const props = defineProps<{ message: MessageItem | AuthorMessageItem; isAuthor?: boolean }>()
const emit = defineEmits<{ pin: [message: MessageItem | AuthorMessageItem]; delete: [message: MessageItem | AuthorMessageItem] }>()

const visitorMsg = computed(() => props.message.type === 'visitor' ? props.message as MessageItem : null)
const authorMsg = computed(() => props.message.type === 'author' ? props.message as AuthorMessageItem : null)
const isPinned = computed(() => props.message.type === 'visitor' ? !!(props.message as MessageItem).pinned : !!(props.message as AuthorMessageItem).pinned)

function formatTime(iso: string): string {
  const d = new Date(iso)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return month + '-' + day + ' ' + h + ':' + m
}
</script>

<style scoped>
.msg-card {
  display: grid;
  grid-template-columns: 40px 1fr;
  grid-template-rows: auto auto auto;
  gap: 6px 12px;
  padding: 16px 20px;
  border-radius: var(--card-radius);
  background: var(--card-bg);
  border: 1px solid var(--border);
  transition: all var(--transition-speed) ease;
  animation: msgSlideIn 0.4s ease-out forwards;
}
.msg-card:hover {
  border-color: var(--accent-glow);
  box-shadow: var(--card-shadow-hover);
  transform: translateX(4px);
}
.msg-author {
  border-left: 3px solid var(--accent);
  background: linear-gradient(135deg, var(--accent-glow) 0%, var(--card-bg) 5%);
}
.msg-visitor:hover {
  transform: translateX(-4px);
}

.msg-badges {
  grid-column: 1 / -1;
  display: flex;
  gap: 8px;
}
.msg-badge-author {
  font-size: 0.65rem;
  padding: 2px 10px;
  border-radius: 20px;
  background: var(--badge-bg);
  color: var(--badge-text);
  font-weight: 600;
  letter-spacing: 0.05em;
}
.msg-badge-pin {
  font-size: 0.65rem;
  padding: 2px 10px;
  border-radius: 20px;
  background: var(--amber-bg);
  color: var(--amber-text);
  font-weight: 600;
}

.msg-avatar {
  grid-row: span 2;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  font-weight: 700;
  background: var(--surface-hover);
  color: var(--text-secondary);
  flex-shrink: 0;
  border: 2px solid var(--border);
}
.avatar-author {
  background: var(--accent-glow);
  border-color: var(--accent);
}

.msg-bubble {
  grid-column: 2;
}
.msg-title {
  font-family: var(--font-heading);
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--accent);
  margin-bottom: 4px;
  letter-spacing: 0.02em;
}
.msg-content {
  font-size: 0.9rem;
  line-height: 1.7;
  color: var(--text-primary);
  white-space: pre-wrap;
  word-break: break-word;
}

.msg-meta {
  grid-column: 2;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.msg-nickname {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-secondary);
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.msg-time {
  font-size: 0.7rem;
  color: var(--text-muted);
  font-family: var(--font-mono);
}
.msg-controls {
  margin-left: auto;
  display: flex;
  gap: 4px;
}
.msg-ctrl-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.85rem;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.2s ease;
  opacity: 0.4;
}
.msg-ctrl-btn:hover {
  opacity: 1;
  background: var(--surface-hover);
}
.msg-ctrl-btn.active {
  opacity: 1;
  background: var(--amber-bg);
}
.msg-ctrl-del:hover {
  background: var(--danger-bg);
}

@keyframes msgSlideIn {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>