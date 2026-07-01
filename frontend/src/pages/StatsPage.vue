<template>
  <div style="background: var(--page-bg); min-height: 100vh; transition: background var(--transition-speed) ease;" class="px-4 py-8">
    <div class="max-w-5xl mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div class="flex items-center gap-4">
          <router-link to="/" class="text-sm transition-colors" :style="{ color: 'var(--text-secondary)' }">
            ← 返回首页
          </router-link>
          <h1 class="text-xl font-semibold" :style="{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }">
            📊 作者数据
          </h1>
        </div>
        <button v-if="authStore.isAuthor" @click="showForm = !showForm" class="btn-primary">
          {{ showForm ? '关闭表单' : '+ 添加/修改数据' }}
        </button>
      </div>

      <!-- Data form (author only) -->
      <div v-if="showForm && authStore.isAuthor" class="glass-card p-6 mb-8 space-y-4 animate-slide-up">
        <h3 class="font-semibold" :style="{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }">
          {{ editingId ? '修改第' + formWeek + '周数据' : '添加新周数据' }}
        </h3>
        <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <label class="block text-xs mb-1" :style="{ color: 'var(--text-secondary)' }">周序 *</label>
            <input v-model.number="formWeek" type="number" min="1" class="stat-input" placeholder="1" />
          </div>
          <div>
            <label class="block text-xs mb-1" :style="{ color: 'var(--text-secondary)' }">时间段 *</label>
            <input v-model="formDateRange" type="text" class="stat-input" placeholder="1.1-1.7" />
          </div>
          <div>
            <label class="block text-xs mb-1" :style="{ color: 'var(--text-secondary)' }">浏览量(万)</label>
            <input v-model.number="formViews" type="number" step="0.1" min="0" class="stat-input" placeholder="0" />
          </div>
          <div>
            <label class="block text-xs mb-1" :style="{ color: 'var(--text-secondary)' }">累计消息(万)</label>
            <input v-model.number="formMessages" type="number" step="0.1" min="0" class="stat-input" placeholder="0" />
          </div>
          <div>
            <label class="block text-xs mb-1" :style="{ color: 'var(--text-secondary)' }">点赞数</label>
            <input v-model.number="formLikes" type="number" min="0" class="stat-input" placeholder="0" />
          </div>
          <div>
            <label class="block text-xs mb-1" :style="{ color: 'var(--text-secondary)' }">聊天用户数</label>
            <input v-model.number="formChatUsers" type="number" min="0" class="stat-input" placeholder="0" />
          </div>
        </div>
        <div class="flex items-center gap-3">
          <button @click="submitStats" :disabled="submitting" class="btn-primary btn-sm">
            {{ submitting ? '保存中...' : '保存数据' }}
          </button>
          <button v-if="editingId" @click="resetForm" class="text-sm" :style="{ color: 'var(--text-muted)' }">取消编辑</button>
          <p v-if="formError" class="text-sm" :style="{ color: 'var(--danger-text)' }">{{ formError }}</p>
          <p v-if="formOk" class="text-sm" :style="{ color: 'var(--success-text)' }">{{ formOk }}</p>
        </div>
      </div>

      <!-- Charts -->
      <div v-if="loading" class="text-center py-16"><p :style="{ color: 'var(--text-muted)' }">加载数据中...</p></div>

      <div v-else-if="sortedStats.length === 0" class="text-center py-16 glass-card p-10">
        <p class="text-5xl mb-4">📊</p>
        <p :style="{ color: 'var(--text-muted)' }">还没有数据，等待作者添加~</p>
      </div>

      <div v-else class="space-y-6">
        <!-- Chart 1: 浏览量 & 累计消息 -->
        <div class="glass-card p-5">
          <h3 class="text-sm font-semibold mb-1" :style="{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }">
            📈 浏览量(万) & 累计消息(万) 平滑折线趋势
          </h3>
          <div ref="chart1Ref" class="chart-box"></div>
        </div>

        <!-- Chart 2: 点赞数 & 聊天用户数 -->
        <div class="glass-card p-5">
          <h3 class="text-sm font-semibold mb-1" :style="{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }">
            📈 点赞数 & 聊天用户数 折线趋势
          </h3>
          <div ref="chart2Ref" class="chart-box"></div>
        </div>

        <!-- Chart 3: Pie -->
        <div class="glass-card p-5">
          <h3 class="text-sm font-semibold mb-1" :style="{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }">
            🥧 分阶段总浏览量占比
          </h3>
          <div ref="chart3Ref" class="chart-box" style="height: 360px;"></div>
        </div>

        <!-- Data table -->
        <div class="glass-card p-5">
          <h3 class="text-sm font-semibold mb-3" :style="{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }">
            📋 数据明细
          </h3>
          <div class="table-wrap">
            <table class="stats-table">
              <thead>
                <tr>
                  <th>周序</th><th>时间段</th><th>浏览量(万)</th><th>累计消息(万)</th><th>点赞数</th><th>聊天用户数</th>
                  <th v-if="authStore.isAuthor">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="s in sortedStats" :key="s.id">
                  <td class="font-mono">第{{ s.week }}周</td>
                  <td>{{ s.dateRange }}</td>
                  <td>{{ s.views }}</td>
                  <td>{{ s.messages }}</td>
                  <td>{{ s.likes.toLocaleString() }}</td>
                  <td>{{ s.chatUsers.toLocaleString() }}</td>
                  <td v-if="authStore.isAuthor">
                    <button @click="editRow(s)" class="text-xs px-2 py-1 rounded" :style="{ color: 'var(--accent)', background: 'var(--accent-glow)' }">编辑</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useThemeStore } from '../stores/theme'
import { getStats, saveStats, type StatsRow } from '../api'
import * as echarts from 'echarts'

const authStore = useAuthStore()
const themeStore = useThemeStore()

const stats = ref<StatsRow[]>([])
const loading = ref(true)
const showForm = ref(false)
const formWeek = ref(1)
const formDateRange = ref('')
const formViews = ref(0)
const formMessages = ref(0)
const formLikes = ref(0)
const formChatUsers = ref(0)
const editingId = ref<number | null>(null)
const submitting = ref(false)
const formError = ref('')
const formOk = ref('')

const chart1Ref = ref<HTMLDivElement | null>(null)
const chart2Ref = ref<HTMLDivElement | null>(null)
const chart3Ref = ref<HTMLDivElement | null>(null)

let chart1: echarts.ECharts | null = null
let chart2: echarts.ECharts | null = null
let chart3: echarts.ECharts | null = null

const sortedStats = computed(() => [...stats.value].sort((a, b) => a.week - b.week))

function getChartColors() {
  const isCyber = themeStore.currentTheme === 'cyberpunk'
  return {
    c1: isCyber ? '#00FF88' : '#86C440',
    c2: isCyber ? '#FF00FF' : '#0891B2',
    c3: isCyber ? '#00FFFF' : '#F59E0B',
    c4: isCyber ? '#FFD700' : '#EF4444',
    text: isCyber ? '#A0A0B0' : '#6E6E73',
    textMuted: isCyber ? '#606070' : '#9999A0',
    border: isCyber ? 'rgba(0,255,136,0.08)' : 'rgba(0,0,0,0.06)',
    bg: isCyber ? '#0A0A0F' : '#F5F5F7',
  }
}

function renderCharts() {
  const data = sortedStats.value
  if (data.length === 0) return
  const cols = getChartColors()
  const weeks = data.map(d => 'W' + d.week)
  const views = data.map(d => d.views)
  const messages = data.map(d => d.messages)
  const likes = data.map(d => d.likes)
  const chatUsers = data.map(d => d.chatUsers)

  // Chart 1: 浏览量 & 累计消息
  if (chart1Ref.value) {
    if (!chart1) chart1 = echarts.init(chart1Ref.value)
    chart1.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['浏览量(万)', '累计消息(万)'], textStyle: { color: cols.text }, top: 0 },
      grid: { left: '3%', right: '4%', bottom: '8%', top: '12%', containLabel: true },
      xAxis: { type: 'category', data: weeks, axisLabel: { color: cols.textMuted }, axisLine: { lineStyle: { color: cols.border } } },
      yAxis: { type: 'value', axisLabel: { color: cols.textMuted }, splitLine: { lineStyle: { color: cols.border } } },
      series: [
        { name: '浏览量(万)', type: 'line', smooth: true, data: views, itemStyle: { color: cols.c1 }, lineStyle: { width: 2 } },
        { name: '累计消息(万)', type: 'line', smooth: true, data: messages, itemStyle: { color: cols.c2 }, lineStyle: { width: 2 } },
      ],
    }, true)
  }

  // Chart 2: 点赞数 & 聊天用户数
  if (chart2Ref.value) {
    if (!chart2) chart2 = echarts.init(chart2Ref.value)
    chart2.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['点赞数', '聊天用户数'], textStyle: { color: cols.text }, top: 0 },
      grid: { left: '5%', right: '4%', bottom: '8%', top: '12%', containLabel: true },
      xAxis: { type: 'category', data: weeks, axisLabel: { color: cols.textMuted }, axisLine: { lineStyle: { color: cols.border } } },
      yAxis: { type: 'value', axisLabel: { color: cols.textMuted, formatter: (v: number) => v >= 10000 ? (v/10000).toFixed(1)+'w' : String(v) }, splitLine: { lineStyle: { color: cols.border } } },
      series: [
        { name: '点赞数', type: 'line', smooth: true, data: likes, itemStyle: { color: cols.c3 }, lineStyle: { width: 2 } },
        { name: '聊天用户数', type: 'line', smooth: true, data: chatUsers, itemStyle: { color: cols.c4 }, lineStyle: { width: 2 } },
      ],
    }, true)
  }

  // Chart 3: Pie - 分阶段浏览量占比
  if (chart3Ref.value && data.length > 0) {
    if (!chart3) chart3 = echarts.init(chart3Ref.value)
    const total = data.length
    const third = Math.ceil(total / 3)
    const p1 = data.slice(0, third)
    const p2 = data.slice(third, third * 2)
    const p3 = data.slice(third * 2)
    const sum1 = p1.reduce((s, d) => s + d.views, 0)
    const sum2 = p2.reduce((s, d) => s + d.views, 0)
    const sum3 = p3.reduce((s, d) => s + d.views, 0)
    const labels = [
      前期 (W-W),
      中期 (W-W),
      后期 (W-W),
    ]
    chart3.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c}万 ({d}%)' },
      legend: { orient: 'vertical', left: 'left', textStyle: { color: cols.text } },
      series: [{
        type: 'pie', radius: ['40%', '70%'], center: ['55%', '55%'],
        data: [
          { value: Math.round(sum1 * 10) / 10, name: labels[0], itemStyle: { color: cols.c1 } },
          { value: Math.round(sum2 * 10) / 10, name: labels[1], itemStyle: { color: cols.c2 } },
          { value: Math.round(sum3 * 10) / 10, name: labels[2], itemStyle: { color: cols.c3 } },
        ].filter(d => d.value > 0),
        label: { formatter: '{b}\n{d}%', fontSize: 11, color: cols.text },
      }],
    }, true)
  }
}

function editRow(s: StatsRow) {
  editingId.value = s.id
  formWeek.value = s.week
  formDateRange.value = s.dateRange
  formViews.value = s.views
  formMessages.value = s.messages
  formLikes.value = s.likes
  formChatUsers.value = s.chatUsers
  showForm.value = true
  formError.value = ''
  formOk.value = ''
}

function resetForm() {
  editingId.value = null
  formWeek.value = (sortedStats.value.length || 0) + 1
  formDateRange.value = ''
  formViews.value = 0
  formMessages.value = 0
  formLikes.value = 0
  formChatUsers.value = 0
  formError.value = ''
  formOk.value = ''
}

async function submitStats() {
  formError.value = ''
  formOk.value = ''
  if (!formWeek.value || formWeek.value < 1) { formError.value = '请输入周序'; return }
  if (!formDateRange.value.trim()) { formError.value = '请输入时间段'; return }
  submitting.value = true
  try {
    const result = await saveStats({
      week: formWeek.value,
      dateRange: formDateRange.value.trim(),
      views: formViews.value || 0,
      messages: formMessages.value || 0,
      likes: formLikes.value || 0,
      chatUsers: formChatUsers.value || 0,
    })
    const idx = stats.value.findIndex(s => s.id === result.id || s.week === result.week)
    if (idx >= 0) stats.value[idx] = result
    else stats.value.push(result)
    stats.value = [...stats.value]
    formOk.value = '保存成功！'
    resetForm()
    await nextTick()
    renderCharts()
  } catch (err: unknown) {
    formError.value = err instanceof Error ? err.message : '保存失败'
  }
  submitting.value = false
}

watch(() => themeStore.currentTheme, () => {
  if (chart1) chart1.dispose(); chart1 = null
  if (chart2) chart2.dispose(); chart2 = null
  if (chart3) chart3.dispose(); chart3 = null
  nextTick(renderCharts)
})

onMounted(async () => {
  await authStore.checkAuth()
  try { stats.value = await getStats() } catch {}
  loading.value = false
  await nextTick()
  renderCharts()

  window.addEventListener('resize', () => {
    chart1?.resize(); chart2?.resize(); chart3?.resize()
  })
})
</script>

<style scoped>
.chart-box { width: 100%; height: 380px; }

.stat-input {
  width: 100%; padding: 8px 12px; border-radius: var(--card-radius-sm);
  font-size: 0.82rem; font-family: var(--font-body);
  background: var(--input-bg); color: var(--text-primary);
  border: 1px solid var(--input-border); outline: none; transition: all 0.2s ease;
}
.stat-input:focus { border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent-glow); }

.btn-primary {
  padding: 10px 22px; border-radius: var(--card-radius-sm); font-size: 0.85rem; font-weight: 500;
  background: var(--accent); color: #fff; border: none; cursor: pointer;
  transition: all 0.2s ease; text-decoration: none; display: inline-block;
  box-shadow: 0 4px 12px var(--accent-glow);
}
.btn-primary:hover { filter: brightness(1.1); }
.btn-sm { padding: 8px 16px; font-size: 0.8rem; }

.table-wrap { overflow-x: auto; }
.stats-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
.stats-table th {
  padding: 10px 12px; text-align: left; font-weight: 600; white-space: nowrap;
  background: var(--surface-hover); color: var(--text-primary);
  border-bottom: 2px solid var(--border);
}
.stats-table td {
  padding: 8px 12px; border-bottom: 1px solid var(--border); color: var(--text-secondary);
}
.stats-table tr:hover td { background: var(--surface-hover); }
.font-mono { font-family: var(--font-mono); }
</style>