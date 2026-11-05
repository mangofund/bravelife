<template>
  <view class="issues-overlay" @click.stop="emit('close')">
    <view class="issues-panel" role="dialog" aria-modal="true" aria-label="代理问题面板" @click.stop>
      <header class="issues-heading">
        <view><strong>代理问题</strong><text class="issues-subtitle">本浏览器保存 · 共 {{ issues.length }} 项</text></view>
        <button :disabled="!issues.length" @click="emit('export')">导出全部 JSON</button>
        <button aria-label="关闭问题面板" @click="emit('close')">关闭</button>
      </header>
      <view class="issues-tabs" aria-label="问题分类">
        <button v-for="type in categories" :key="type" :aria-pressed="category === type"
          @click="category = type">{{ type }} {{ issues.filter(issue => issue.category === type).length }}</button>
      </view>
      <view class="issues-form">
        <textarea v-model.trim="note" maxlength="600" :placeholder="'补充' + category + '观察，例如现象、影响和预期'" aria-label="补充观察" />
        <button :disabled="!note" @click="addNote">记录观察</button>
      </view>
      <p v-if="!visibleIssues.length">这个分类暂无记录。</p>
      <article v-for="issue in visibleIssues" :key="issue.id" class="issues-item">
        <strong>{{ issue.title }}</strong>
        <small>{{ issue.source }} · {{ new Date(issue.lastSeen).toLocaleString() }} · {{ issue.count }} 次</small>
        <small v-if="issue.evidence">游戏第 {{ issue.evidence.before.day }} 天 · {{ issue.evidence.before.location }} · {{ issue.evidence.label }}</small>
      </article>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({ issues: { type: Array, required: true } })
const emit = defineEmits(['add', 'close', 'export'])
const categories = ['功能', '产品', '设计', '策划']
const category = ref(categories[0])
const note = ref('')
const visibleIssues = computed(() => props.issues.filter(issue => issue.category === category.value))

function addNote() {
  if (!note.value) return
  emit('add', { category: category.value, title: note.value, source: '作者观察' })
  note.value = ''
}
</script>

<style scoped>
.issues-overlay { position: fixed; inset: 0; z-index: 10003; display: grid; place-items: center; padding: 16px; background: #161425bd; }
.issues-panel { width: min(100%, 680px); max-height: 85vh; overflow: auto; box-sizing: border-box; padding: 18px; background: var(--card); color: var(--ink); border-radius: 16px; }
.issues-heading, .issues-tabs { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
.issues-heading > view { flex: 1; }
.issues-heading strong { font-size: 20px; }
.issues-subtitle, .issues-item small { display: block; color: var(--muted); }
.issues-panel button { margin: 0; font-size: 14px; background: var(--paper); color: var(--ink); }
.issues-tabs button[aria-pressed="true"] { background: var(--hud); color: white; }
.issues-form textarea { width: 100%; box-sizing: border-box; height: 72px; margin-bottom: 8px; padding: 8px; border: 1px solid var(--paper-deep); background: var(--paper); color: var(--ink); border-radius: 6px; }
.issues-item { border-top: 1px solid var(--paper-deep); margin-top: 12px; padding-top: 10px; overflow-wrap: anywhere; }
</style>
