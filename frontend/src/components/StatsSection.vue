<template>
  <section class="stats-section" ref="sectionRef">
    <div class="max-w-5xl mx-auto px-4">
      <div class="section-header">
        <div>
          <h2 class="section-title">📊 作者数据</h2>
          <p class="section-subtitle">30周运营数据可视化</p>
        </div>
        <button v-if="authStore.isAuthor" @click="showForm = !showForm" class="btn-primary">
          {{ showForm ? '关闭表单' : '+ 添加/修改数据' }}
        </button>
      </div>

      <!-- Author Data Form -->
      <div v-if="showForm && authStore.isAuthor" class="stats-form glass-card animate-slide-up">
        <h3 class="form-title">{{ editingId ? '修改第' + formWeek + '周数据' : '添加新周数据' }}</h3>
        <div class="form-grid">
          <div class="form-field">
            <label>周序 *</label>
            <input v-model.number="formWeek" type="number" min="1" class="stat-input" placeholder="1" />
          </div>
          <div class="form-field">
            <label>时间段 *</label>
            <input v-model="formDateRange" type="text" class="stat-input" placeholder="1.1-1.7" />
          </div>
          <div class="form-field">
            <label>浏览量(万)</label>
            <input v-model.number="formViews" type="number" step="0.1" min="0" class="stat-input" placeholder="0" />
          </div>
          <div class="form-field">
            <label>累计消息(万)</label>
            <input v-model.number="formMessages" type="number" step="0.1" min="0" class="stat-input" placeholder="0" />
          </div>
          <div class="form-field">
            <label>点赞数</label>
            <input v-model.number="formLikes" type="number" min="0" class="stat-input" placeholder="0" />
          </div>
          <div class="form-field">
            <label>聊天用户数</label>
            <input v-model.number="formChatUsers" type="number" min="0" class="stat-input" placeholder="0" />
          </div>
          <div class="form-field">
            <label>本周创建内容</label>
            <input v-model="formContent" type="text" class="stat-input" placeholder="如: 8个角色, 2个故事" />
          </div>
          <div class="form-field">
            <label>最受欢迎作品</label>
            <input v-model="formTopWork" type="text" class="stat-input" placeholder="如: 玉溪" />
          </div>
        </div>
        <div class="form-actions">
          <button @click="submitStats" :disabled="submitting" class="btn-primary btn-sm">
            {{ submitting ? '保存中...' : '保存数据' }}
          </button>
          <button v-if="editingId" @click="resetForm" class="btn-ghost">取消编辑</button>
          <p v-if="formError" class="form-msg form-msg-err">{{ formError }}</p>
          <p v-if="formOk" class="form-msg form-msg-ok">{{ formOk }}</p>
        </div>
      </div>

      <!-- Charts -->
      <div v-if="loading" class="loading-msg">加载数据中...</div>

      <div v-else-if="sortedStats.length === 0" class="empty-state glass-card">
        <p class="empty-icon">📊</p>
        <p>还没有数据，等待作者添加~</p>
      </div>

      <div v-else class="charts-area">
        <!-- Chart 1: Views & Messages -->
        <div class="glass-card chart-card">
          <h3 class="chart-title">📈 浏览量(万) & 累计消息(万) 平滑折线趋势</h3>
          <div ref="chart1Ref" class="chart-box"></div>
        </div>

        <!-- Chart 2: Likes & Chat Users -->
        <div class="glass-card chart-card">
          <h3 class="chart-title">📈 点赞数 & 聊天用户数 折线趋势</h3>
          <div ref="chart2Ref" class="chart-box"></div>
        </div>

        <!-- Chart 3: Ring chart - Three-phase views -->
        <div class="glass-card chart-card">
          <h3 class="chart-title">🥧 三阶段总浏览量占比</h3>
          <div ref="chart3Ref" class="chart-box chart-box-sm"></div>
        </div>

        <!-- Data Table -->
        <div class="glass-card chart-card">
          <h3 class="chart-title">📋 完整数据表</h3>
          <div class="table-wrap">
            <table class="stats-table">
              <thead>
                <tr>
                  <th>周序</th>
                  <th>时间段</th>
                  <th>浏览量(万)</th>
                  <th>累计消息(万)</th>
                  <th>点赞数</th>
                  <th>聊天用户数</th>
                  <th>本周创建内容</th>
                  <th>最受欢迎作品</th>
                  <th v-if="authStore.isAuthor">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="s in sortedStats" :key="s.id">
                  <td class="font-mono">W{{ s.week }}</td>
                  <td>{{ s.dateRange }}</td>
                  <td class="font-mono">{{ s.views }}</td>
                  <td class="font-mono">{{ s.messages }}</td>
                  <td class="font-mono">{{ formatNum(s.likes) }}</td>
                  <td class="font-mono">{{ formatNum(s.chatUsers) }}</td>
                  <td>{{ s.content || '-' }}</td>
                  <td>{{ s.topWork || '-' }}</td>
                  <td v-if="authStore.isAuthor">
                    <button @click="editRow(s)" class="btn-ghost btn-xs">编辑</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick, computed } from 'vue'
import * as echarts from 'echarts'
import { useAuthStore } from '../stores/auth'
import { useThemeStore } from '../stores/theme'
import { getStats, saveStats, type StatsRow } from '../api'

const authStore = useAuthStore()
const themeStore = useThemeStore()

const stats = ref<StatsRow[]>([])
const loading = ref(true)
const showForm = ref(false)
const submitting = ref(false)
const editingId = ref<number | null>(null)
const formError = ref('')
const formOk = ref('')

const formWeek = ref(1)
const formDateRange = ref('')
const formViews = ref(0)
const formMessages = ref(0)
const formLikes = ref(0)
const formChatUsers = ref(0)
const formContent = ref('')
const formTopWork = ref('')

const sortedStats = computed(() => [...stats.value].sort((a, b) => a.week - b.week))

const chart1Ref = ref<HTMLElement | null>(null)
const chart2Ref = ref<HTMLElement | null>(null)
const chart3Ref = ref<HTMLElement | null>(null)

let chart1: echarts.ECharts | null = null
let chart2: echarts.ECharts | null = null
let chart3: echarts.ECharts | null = null

function formatNum(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1) + '万'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return String(n)
}

function getChartColors() {
  const isDark = themeStore.currentTheme === 'cyberpunk'
  return {
    text: isDark ? '#A0A0B0' : '#6E6E73',
    textStrong: isDark ? '#E0E0E0' : '#1D1D1F',
    c1: isDark ? '#00FF88' : '#86C440',
    c2: isDark ? '#FF00FF' : '#8B5CF6',
    c3: isDark ? '#00FFFF' : '#3B82F6',
    c4: isDark ? '#FFD700' : '#F59E0B',
    c5: isDark ? '#FF4466' : '#EF4444',
    split: isDark ? 'rgba(0,255,136,0.1)' : 'rgba(0,0,0,0.06)',
    bg: isDark ? '#12121A' : '#FFFFFF',
  }
}

function renderCharts() {
  const data = sortedStats.value
  if (data.length === 0) return
  const cols = getChartColors()

  const weeks = data.map(d => 'W' + d.week)
  const views = data.map(d => d.views)
  const msgs = data.map(d => d.messages)
  const likes = data.map(d => d.likes)
  const chatUsers = data.map(d => d.chatUsers)

  const commonGrid = { left: 50, right: 20, top: 20, bottom: 30 }

  // Chart 1: Views & Messages
  if (chart1Ref.value) {
    if (!chart1) chart1 = echarts.init(chart1Ref.value)
    chart1.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['浏览量(万)', '累计消息(万)'], textStyle: { color: cols.text } },
      grid: commonGrid,
      xAxis: { type: 'category', data: weeks, axisLabel: { color: cols.text, fontSize: 10, rotate: 45 }, axisLine: { lineStyle: { color: cols.split } } },
      yAxis: { type: 'value', axisLabel: { color: cols.text }, splitLine: { lineStyle: { color: cols.split } } },
      series: [
        { name: '浏览量(万)', type: 'line', smooth: true, data: views, itemStyle: { color: cols.c1 }, lineStyle: { width: 2 }, symbol: 'circle', symbolSize: 4 },
        { name: '累计消息(万)', type: 'line', smooth: true, data: msgs, itemStyle: { color: cols.c2 }, lineStyle: { width: 2 }, symbol: 'circle', symbolSize: 4 },
      ],
    }, true)
  }

  // Chart 2: Likes & Chat Users
  if (chart2Ref.value) {
    if (!chart2) chart2 = echarts.init(chart2Ref.value)
    chart2.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['点赞数', '聊天用户数'], textStyle: { color: cols.text } },
      grid: commonGrid,
      xAxis: { type: 'category', data: weeks, axisLabel: { color: cols.text, fontSize: 10, rotate: 45 }, axisLine: { lineStyle: { color: cols.split } } },
      yAxis: { type: 'value', axisLabel: { color: cols.text, formatter: (v: number) => v >= 10000 ? (v/10000).toFixed(0)+'万' : String(v) }, splitLine: { lineStyle: { color: cols.split } } },
      series: [
        { name: '点赞数', type: 'line', smooth: true, data: likes, itemStyle: { color: cols.c3 }, lineStyle: { width: 2 }, symbol: 'circle', symbolSize: 4 },
        { name: '聊天用户数', type: 'line', smooth: true, data: chatUsers, itemStyle: { color: cols.c4 }, lineStyle: { width: 2 }, symbol: 'circle', symbolSize: 4 },
      ],
    }, true)
  }

  // Chart 3: Donut - Three-phase views
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
    chart3.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c}万 ({d}%)' },
      legend: { orient: 'vertical', left: 'left', textStyle: { color: cols.text } },
      series: [{
        type: 'pie', radius: ['40%', '70%'], center: ['55%', '55%'],
        data: [
          { value: Math.round(sum1 * 10) / 10, name: '前期 (W1-W' + third + ')', itemStyle: { color: cols.c1 } },
          { value: Math.round(sum2 * 10) / 10, name: '中期 (W' + (third+1) + '-W' + (third*2) + ')', itemStyle: { color: cols.c2 } },
          { value: Math.round(sum3 * 10) / 10, name: '后期 (W' + (third*2+1) + '-W' + total + ')', itemStyle: { color: cols.c3 } },
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
  formContent.value = s.content || ''
  formTopWork.value = s.topWork || ''
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
  formContent.value = ''
  formTopWork.value = ''
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
      content: formContent.value,
      topWork: formTopWork.value,
    })
    const idx = stats.value.findIndex(s => s.id === result.id || s.week === result.week)
    if (idx >= 0) stats.value[idx] = result
    else stats.value.push(result)
    stats.value = [...stats.value]
    formOk.value = '保存成功!'
    resetForm()
    await nextTick()
    renderCharts()
  } catch (err: unknown) {
    formError.value = err instanceof Error ? err.message : '保存失败'
  }
  submitting.value = false
}

watch(() => themeStore.currentTheme, () => {
  if (chart1) { chart1.dispose(); chart1 = null }
  if (chart2) { chart2.dispose(); chart2 = null }
  if (chart3) { chart3.dispose(); chart3 = null }
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
.stats-section { padding: 4rem 1rem 4rem; border-top: 1px solid var(--border); }
.stats-form { padding: 24px; margin-bottom: 2rem; }
.form-title { font-family: var(--font-heading); font-size: 1rem; font-weight: 600; color: var(--text-primary); margin-bottom: 16px; }
.form-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; margin-bottom: 16px; }
.form-field { display: flex; flex-direction: column; gap: 4px; }
.form-field label { font-size: 0.75rem; color: var(--text-secondary); }
.form-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.form-msg { font-size: 0.82rem; }
.form-msg-err { color: var(--danger-text); }
.form-msg-ok { color: var(--success-text); }

.stat-input {
  width: 100%; padding: 8px 12px; border-radius: var(--card-radius-sm);
  font-size: 0.82rem; font-family: var(--font-body);
  background: var(--input-bg); color: var(--text-primary);
  border: 1px solid var(--input-border); outline: none; transition: all 0.2s ease;
}
.stat-input:focus { border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent-glow); }

.charts-area { display: flex; flex-direction: column; gap: 20px; }
.chart-card { padding: 20px; }
.chart-title { font-size: 0.9rem; font-weight: 600; color: var(--text-primary); font-family: var(--font-heading); margin-bottom: 12px; }
.chart-box { width: 100%; height: 380px; }
.chart-box-sm { height: 340px; }

.btn-primary {
  padding: 10px 22px; border-radius: var(--card-radius-sm); font-size: 0.85rem; font-weight: 500;
  background: var(--accent); color: #fff; border: none; cursor: pointer;
  transition: all 0.2s ease; text-decoration: none; display: inline-block;
  box-shadow: 0 4px 12px var(--accent-glow);
}
.btn-primary:hover { filter: brightness(1.1); }
.btn-sm { padding: 8px 16px; font-size: 0.8rem; }
.btn-ghost { background: none; border: 1px solid var(--border); color: var(--text-secondary); padding: 8px 16px; border-radius: var(--card-radius-sm); font-size: 0.8rem; cursor: pointer; transition: all 0.2s ease; }
.btn-ghost:hover { border-color: var(--accent); color: var(--text-primary); }
.btn-xs { padding: 4px 10px; font-size: 0.72rem; }

.table-wrap { overflow-x: auto; }
.stats-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
.stats-table th {
  padding: 10px 10px; text-align: left; font-weight: 600; white-space: nowrap;
  background: var(--surface-hover); color: var(--text-primary);
  border-bottom: 2px solid var(--border);
}
.stats-table td {
  padding: 7px 10px; border-bottom: 1px solid var(--border); color: var(--text-secondary);
}
.stats-table tr:hover td { background: var(--surface-hover); }
.font-mono { font-family: var(--font-mono); }
.loading-msg { text-align: center; padding: 3rem; font-size: 0.85rem; color: var(--text-muted); }
.empty-state { text-align: center; padding: 3rem; color: var(--text-muted); }
.empty-icon { font-size: 3rem; margin-bottom: 0.5rem; }
</style>
