<script setup>
import { computed, watch, ref, inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft } from 'lucide-vue-next'
import { UiButton, UiTextarea, UiSelect } from '@/components/ui'
import { useTasks } from '@/composables/useTasks'
import { todayIsoLocal } from '@/data/tasksDemo'

const route = useRoute()
const router = useRouter()
const sessionUser = inject('sessionUser')
const { taskById } = useTasks()

const newComment = ref('')

const task = computed(() => taskById(route.params.id))

const STATUS_OPTIONS = [
  { value: 'open', label: 'Открыта' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'blocked', label: 'Блок' },
  { value: 'done', label: 'Выполнена' },
]

const PRIORITY_OPTIONS = [
  { value: 'high', label: 'Высокий' },
  { value: 'normal', label: 'Обычный' },
  { value: 'low', label: 'Низкий' },
]

watch(
  () => route.params.id,
  (id) => {
    if (!taskById(id)) router.replace({ name: 'tasks' })
  },
  { immediate: true },
)

function goBack() {
  router.push({ name: 'tasks' })
}

function fmtDue(iso) {
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}

function fmtCommentAt(iso) {
  try {
    const d = new Date(iso)
    const diff = Math.floor((Date.now() - d) / 60000)
    if (diff < 60) return `${diff} мин. назад`
    if (diff < 1440) return `${Math.floor(diff / 60)} ч. назад`
    return fmtDue(iso.split('T')[0])
  } catch {
    return ''
  }
}

function isOverdue(t) {
  if (!t || t.status === 'done') return false
  return t.due < todayIsoLocal()
}

function toggleChecklistItem(item) {
  item.done = !item.done
}

function addComment() {
  const t = task.value
  const text = newComment.value.trim()
  if (!t || !text) return
  t.comments.push({
    id: `c-${Date.now()}`,
    author: sessionUser.value?.name ?? 'Вы',
    text,
    at: new Date().toISOString(),
  })
  newComment.value = ''
}

function markComplete() {
  const t = task.value
  if (t) t.status = 'done'
}
</script>

<template>
  <div v-if="task" class="td-page">
    <button type="button" class="td-back" @click="goBack">
      <ArrowLeft :size="16" stroke-width="1.75" />
      К задачам
    </button>

    <div class="td-layout">
      <main class="td-main">
        <header class="td-header">
          <div class="td-header-text">
            <h1 class="td-title" :class="{ 'td-title--done': task.status === 'done' }">{{ task.title }}</h1>
            <p class="td-summary">{{ task.summary }}</p>
          </div>
          <UiButton
            v-if="task.status !== 'done'"
            type="button"
            variant="primary"
            class="td-complete-btn"
            @click="markComplete"
          >
            Завершить
          </UiButton>
        </header>

        <section class="td-section">
          <h2 class="td-section-title">Описание</h2>
          <p class="td-desc">{{ task.description }}</p>
        </section>

        <section v-if="task.checklist.length" class="td-section">
          <h2 class="td-section-title">Чеклист</h2>
          <ul class="td-checklist">
            <li v-for="item in task.checklist" :key="item.id" class="td-check-row">
              <label>
                <input type="checkbox" :checked="item.done" @change="toggleChecklistItem(item)">
                <span :class="{ 'td-check-done': item.done }">{{ item.text }}</span>
              </label>
            </li>
          </ul>
        </section>

        <section class="td-section">
          <h2 class="td-section-title">Комментарии</h2>
          <ul class="td-comments">
            <li v-for="c in task.comments" :key="c.id" class="td-comment">
              <div class="td-comment-top">
                <span class="td-comment-author">{{ c.author }}</span>
                <span class="td-comment-time">{{ fmtCommentAt(c.at) }}</span>
              </div>
              <p class="td-comment-body">{{ c.text }}</p>
            </li>
          </ul>
          <p v-if="task.comments.length === 0" class="td-empty">Комментариев пока нет.</p>
          <div class="td-comment-form">
            <UiTextarea v-model="newComment" rows="3" placeholder="Добавить комментарий…" />
            <UiButton type="button" variant="secondary" @click="addComment">Отправить</UiButton>
          </div>
        </section>
      </main>

      <!-- Linear-style o‘ng sidebar: faqat meta -->
      <aside class="td-sidebar card" aria-label="Свойства задачи">
        <div class="td-sidebar-inner">
          <div class="td-sidebar-row">
            <span class="td-meta-label">Статус</span>
            <div class="td-sidebar-control">
              <UiSelect v-model="task.status" variant="toolbar" :options="STATUS_OPTIONS" />
            </div>
          </div>
          <div class="td-sidebar-row">
            <span class="td-meta-label">Приоритет</span>
            <div class="td-sidebar-control">
              <UiSelect v-model="task.priority" variant="toolbar" :options="PRIORITY_OPTIONS" />
            </div>
          </div>
          <div class="td-sidebar-row">
            <span class="td-meta-label">Срок</span>
            <span
              class="td-sidebar-value td-sidebar-due"
              :class="{ 'td-overdue': isOverdue(task) }"
            >{{ fmtDue(task.due) }}</span>
          </div>
          <div class="td-sidebar-row">
            <span class="td-meta-label">Исполнитель</span>
            <div class="td-sidebar-assignee">
              <span class="td-avatar">{{ task.assignee.initials }}</span>
              <span class="td-sidebar-name">{{ task.assignee.name }}</span>
            </div>
          </div>
          <div class="td-sidebar-row">
            <span class="td-meta-label">Категория</span>
            <span class="td-tag">{{ task.categoryLabel }}</span>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.td-page {
  max-width: 1080px;
  margin: 0 auto;
  padding: 8px 0 56px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  box-sizing: border-box;
}

.td-back {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0;
  border: none;
  background: none;
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  width: fit-content;
  transition: color 0.15s;
}
.td-back:hover {
  color: #1a1a1a;
}

.td-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 272px;
  gap: 32px 40px;
  align-items: start;
}

.td-main {
  min-width: 0;
}

.td-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 28px;
}

.td-header-text {
  flex: 1;
  min-width: 0;
}

.td-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #0d0d0d;
  letter-spacing: -0.04em;
  line-height: 1.25;
}

.td-title--done {
  text-decoration: line-through;
  color: #888;
}

.td-summary {
  margin: 10px 0 0;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

.td-complete-btn {
  flex-shrink: 0;
}

/* ── O‘ng sidebar (Linear) ── */
.td-sidebar {
  position: sticky;
  top: 12px;
  align-self: start;
  padding: 0;
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.04);
}

.td-sidebar-inner {
  padding: 14px 14px 12px;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.td-sidebar-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 4px;
  min-height: 40px;
  box-sizing: border-box;
}

.td-sidebar-row + .td-sidebar-row {
  border-top: 1px solid #f0f0f0;
}

.td-sidebar-row:first-child {
  padding-top: 6px;
}

.td-meta-label {
  font-size: 12px;
  font-weight: 500;
  color: #8e8e8e;
  flex-shrink: 0;
  max-width: 42%;
}

.td-sidebar-control {
  flex: 1;
  min-width: 0;
  display: flex;
  justify-content: flex-end;
}

.td-sidebar-control :deep(.ui-dropdown-trigger) {
  max-width: 148px;
  min-width: 112px;
}

.td-sidebar-value {
  font-size: 13px;
  font-weight: 500;
  color: #1a1a1a;
  text-align: right;
}

.td-sidebar-due {
  font-variant-numeric: tabular-nums;
}

.td-overdue {
  color: #dc2626;
  font-weight: 600;
}

.td-sidebar-assignee {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  min-width: 0;
  text-align: right;
}

.td-avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #ede9f8;
  color: #5c4a9e;
  font-size: 9px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.td-sidebar-name {
  font-size: 13px;
  font-weight: 500;
  color: #333;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 140px;
}

.td-tag {
  font-size: 12px;
  font-weight: 500;
  color: #5b8ef0;
  background: #eef3fd;
  padding: 4px 10px;
  border-radius: 6px;
  white-space: nowrap;
}

.td-section {
  margin-bottom: 28px;
}

.td-section:last-child {
  margin-bottom: 0;
}

.td-section-title {
  margin: 0 0 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #999;
}

.td-desc {
  margin: 0;
  font-size: 14px;
  color: #333;
  line-height: 1.6;
}

.td-checklist {
  list-style: none;
  margin: 0;
  padding: 0;
}

.td-check-row {
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}
.td-check-row:last-child {
  border-bottom: none;
}

.td-check-row label {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 14px;
  color: #222;
  cursor: pointer;
}

.td-check-row input {
  margin-top: 3px;
  accent-color: #1a1a1a;
}

.td-check-done {
  text-decoration: line-through;
  color: #999;
}

.td-comments {
  list-style: none;
  margin: 0 0 16px;
  padding: 0;
}

.td-comment {
  padding: 14px 0;
  border-bottom: 1px solid #f0f0f0;
}

.td-comment-top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
}

.td-comment-author {
  font-size: 13px;
  font-weight: 600;
  color: #1a1a1a;
}

.td-comment-time {
  font-size: 11px;
  color: #aaa;
}

.td-comment-body {
  margin: 0;
  font-size: 13.5px;
  color: #444;
  line-height: 1.5;
}

.td-empty {
  margin: 0 0 16px;
  font-size: 13px;
  color: #bbb;
}

.td-comment-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-start;
}

.card {
  background: #fff;
}

@media (max-width: 900px) {
  .td-layout {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .td-sidebar {
    position: static;
    max-width: 100%;
  }

  .td-sidebar-control :deep(.ui-dropdown-trigger) {
    max-width: 220px;
  }
}
</style>
