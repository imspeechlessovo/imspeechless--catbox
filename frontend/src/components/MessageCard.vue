<template>
  <div class="msg-card" :class="{ pinned: msg.pinned, 'author-msg': msg.type === 'author' }">
    <!-- Main message -->
    <div class="msg-main">
      <!-- Avatar -->
      <div class="msg-avatar" :style="{ background: avColor }">{{ avInitial }}</div>
      <!-- Content -->
      <div class="msg-body">
        <div class="msg-top">
          <span class="msg-nick">{{ msg.type === 'author' ? (msg as any).title || '作者' : msg.nickname }}</span>
          <span v-if="msg.pinned" class="msg-pin-badge">📌 置顶</span>
          <span class="msg-time">{{ timeAgo(msg.createdAt) }}</span>
        </div>
        <p class="msg-text">{{ msg.type === 'author' ? (msg as any).content : msg.content }}</p>
        <!-- Actions -->
        <div class="msg-actions">
          <button @click="toggleReply" class="msg-act-btn">💬 {{ replyBtnText }}</button>
          <button @click="doLike" class="msg-act-btn" :class="{ liked: (msg as any).liked }">
            ❤️ {{ msgLikeCount || '' }}
          </button>
          <button v-if="authStore.isAuthor" @click="$emit('pin', msg)" class="msg-act-btn" :class="{ active: msg.pinned }">
            {{ msg.pinned ? '📌 取消' : '📌 置顶' }}
          </button>
          <button v-if="authStore.isAuthor" @click="$emit('delete', msg)" class="msg-act-btn danger">🗑 删</button>
        </div>

        <!-- Reply input -->
        <div v-if="showReply" class="reply-form">
          <input v-model="replyNick" placeholder="你的名字" class="reply-input nick" />
          <div class="reply-input-row">
            <input v-model="replyContent" placeholder="回复一下..." class="reply-input content" @keyup.enter="submitReply" />
            <button @click="submitReply" :disabled="!replyContent.trim()" class="reply-send">发</button>
          </div>
        </div>

        <!-- Replies list -->
        <div v-if="replies.length > 0" class="replies-list">
          <div v-for="r in replies" :key="r.id" class="reply-item">
            <span class="reply-nick" :style="{ color: avatarColor(r.nickname) }">{{ r.nickname }}</span>
            <span class="reply-text">{{ r.content }}</span>
            <span class="reply-time">{{ timeAgo(r.createdAt) }}</span>
          </div>
        </div>
        <button v-if="(msg as any).replyCount > replies.length" @click="loadReplies" class="load-replies-btn">
          查看全部 {{ (msg as any).replyCount }} 条回复
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { getReplies, postReply, likeMessage, type MessageItem, type AuthorMessageItem, type ReplyItem } from '../api'
import { timeAgo } from '../utils/time'
import { avatarColor, avatarInitial } from '../utils/avatar'

const props = defineProps<{ msg: MessageItem | AuthorMessageItem }>()
defineEmits<{ pin: [msg: MessageItem | AuthorMessageItem]; delete: [msg: MessageItem | AuthorMessageItem] }>()

const authStore = useAuthStore()
const showReply = ref(false)
const replyNick = ref('')
const replyContent = ref('')
const replies = ref<ReplyItem[]>([])
const msgLikeCount = ref((props.msg as any).likeCount || 0)
const localLiked = ref((props.msg as any).liked || false)

const avColor = computed(() => {
  const name = props.msg.type === 'author' ? ((props.msg as any).title || 'A') : props.msg.nickname
  return avatarColor(name)
})
const avInitial = computed(() => {
  const name = props.msg.type === 'author' ? ((props.msg as any).title || 'A') : props.msg.nickname
  return avatarInitial(name)
})
const replyBtnText = computed(() => showReply.value ? '收起' : replies.value.length > 0 ? String(replies.value.length) : '回复')

function toggleReply() {
  showReply.value = !showReply.value
  if (showReply.value) {
    replyNick.value = authStore.isAuthor ? authStore.authorDisplayName : ''
  }
}

async function submitReply() {
  if (!replyContent.value.trim()) return
  try {
    const r = await postReply(props.msg.id, replyNick.value.trim() || '匿名', replyContent.value.trim())
    replies.value.push(r)
    replyContent.value = ''
  } catch {}
}

async function loadReplies() {
  try {
    replies.value = await getReplies(props.msg.id)
  } catch {}
}

async function doLike() {
  if (localLiked.value) return
  try {
    const r = await likeMessage(props.msg.id)
    msgLikeCount.value = r.likeCount
    if (!r.alreadyLiked) localLiked.value = true
  } catch {}
}

onMounted(() => {
  if ((props.msg as any).replyCount > 0) loadReplies()
})
</script>

<style scoped>
.msg-card {
  background: var(--card-bg);
  backdrop-filter: var(--card-blur);
  -webkit-backdrop-filter: var(--card-blur);
  border: 1px solid var(--border);
  border-radius: var(--card-radius);
  padding: 14px 16px;
  transition: all 0.25s ease;
}
.msg-card.pinned {
  border-color: var(--accent-glow);
  box-shadow: 0 0 12px var(--accent-glow);
}
.msg-card.author-msg {
  border-left: 3px solid var(--accent);
}

.msg-main { display: flex; gap: 12px; }

.msg-avatar {
  width: 40px; height: 40px; border-radius: 50%;
  flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-weight: 700; font-size: 1rem; font-family: var(--font-heading);
}

.msg-body { flex: 1; min-width: 0; }

.msg-top { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 6px; }
.msg-nick { font-weight: 600; font-size: 0.88rem; color: var(--text-primary); }
.msg-pin-badge { font-size: 0.65rem; padding: 1px 8px; border-radius: 8px; background: var(--accent-glow); color: var(--accent-dark); }
.msg-time { font-size: 0.7rem; color: var(--text-muted); margin-left: auto; }

.msg-text { font-size: 0.88rem; line-height: 1.55; color: var(--text-secondary); word-break: break-word; }

.msg-actions { display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; }
.msg-act-btn {
  background: none; border: 1px solid var(--border); border-radius: 14px;
  padding: 3px 12px; font-size: 0.75rem; color: var(--text-muted);
  cursor: pointer; transition: all 0.15s ease;
}
.msg-act-btn:hover { border-color: var(--accent); color: var(--text-primary); }
.msg-act-btn.liked { color: #E74C3C; border-color: #E74C3C40; background: #E74C3C10; }
.msg-act-btn.active { color: var(--accent); border-color: var(--accent-glow); }
.msg-act-btn.danger { color: var(--danger-text); }
.msg-act-btn.danger:hover { border-color: var(--danger-text); }

/* Reply form */
.reply-form {
  margin-top: 10px; padding: 10px; background: var(--surface-hover);
  border-radius: 12px; display: flex; flex-direction: column; gap: 8px;
}
.reply-input {
  border: 1px solid var(--input-border); border-radius: 8px;
  padding: 6px 10px; font-size: 0.8rem; background: var(--input-bg);
  color: var(--text-primary); outline: none; font-family: var(--font-body);
}
.reply-input.nick { width: 120px; }
.reply-input.content { flex: 1; }
.reply-input:focus { border-color: var(--accent); }
.reply-input-row { display: flex; gap: 8px; }
.reply-send {
  padding: 6px 16px; border-radius: 8px; border: none;
  background: var(--accent); color: #fff; font-weight: 600;
  cursor: pointer; font-size: 0.82rem;
}
.reply-send:disabled { opacity: 0.4; cursor: default; }

/* Replies */
.replies-list {
  margin-top: 10px; padding-left: 6px;
  border-left: 2px solid var(--border);
  display: flex; flex-direction: column; gap: 8px;
}
.reply-item {
  font-size: 0.8rem; display: flex; gap: 6px; align-items: baseline; flex-wrap: wrap;
}
.reply-nick { font-weight: 600; white-space: nowrap; }
.reply-text { color: var(--text-secondary); flex: 1; min-width: 0; word-break: break-word; }
.reply-time { font-size: 0.65rem; color: var(--text-muted); white-space: nowrap; }
.load-replies-btn {
  margin-top: 8px; background: none; border: none; color: var(--accent);
  font-size: 0.75rem; cursor: pointer; padding: 4px 0;
}
.load-replies-btn:hover { text-decoration: underline; }
</style>
