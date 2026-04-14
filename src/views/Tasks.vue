<script setup>
import { ref, computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { List, LayoutGrid } from 'lucide-vue-next'
import { UiButton, UiSearchField, UiSelect, UiSwitcher, UiSwitcherTab } from '@/components/ui'
import {
  TASK_FILTER_STATUS,
  TASK_FILTER_PRIORITY,
  TASK_FILTER_CATEGORY,
  TASK_FILTER_ASSIGNEES,
} from '@/constants/tasks'
import { todayIsoLocal } from '@/data/tasksDemo'
import { useTasks } from '@/composables/useTasks'
import TaskCreateModal from '@/components/TaskCreateModal.vue'

const router = useRouter()
const { tasks } = useTasks()

const createOpen = ref(false)

function onTaskCreated({ id }) {
  router.push({ name: 'task-detail', params: { id } })
}

const searchQuery = ref('')
const filterStatus = ref('')
const filterPriority = ref('')
const filterCategory = ref('')
const filterAssignee = ref('')

const viewMode = ref('list')

const KANBAN_COLUMNS = [
  { id: 'open', label: 'Открыта' },
  { id: 'in_progress', label: 'В работе' },
  { id: 'blocked', label: 'Блок' },
  { id: 'done', label: 'Выполнена' },
]

function matchesFilters(t) {
  if (filterStatus.value) {
    if (t.status !== filterStatus.value) return false
  }
  if (filterPriority.value && t.priority !== filterPriority.value) return false
  if (filterCategory.value && t.category !== filterCategory.value) return false
  if (filterAssignee.value && t.assigneeKey !== filterAssignee.value) return false
  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    const hay = `${t.title} ${t.summary}`.toLowerCase()
    if (!hay.includes(q)) return false
  }
  return true
}

const filteredTasks = computed(() => tasks.value.filter(matchesFilters))

function tasksInColumn(columnId) {
  return filteredTasks.value.filter(t => t.status === columnId)
}

function isOverdue(task) {
  if (task.status === 'done') return false
  return task.due < todayIsoLocal()
}

function fmtDue(iso) {
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}

function priorityLabel(p) {
  if (p === 'high') return 'Высокий'
  if (p === 'low') return 'Низкий'
  return 'Обычный'
}
</script>

<template>
  <div class="tasks-page">
    <header class="tasks-header">
      <h1 class="tasks-title">Tasks</h1>
      <UiButton type="button" variant="primary" @click="createOpen = true">
        + Create task
      </UiButton>
    </header>

    <TaskCreateModal v-model:open="createOpen" @created="onTaskCreated" />

    <div class="tasks-toolbar">
      <UiSearchField
        v-model="searchQuery"
        class="tasks-toolbar-search"
        placeholder="Поиск…"
        autocomplete="off"
      />
      <div class="tasks-toolbar-right">
        <div class="tasks-toolbar-filters">
          <UiSelect v-model="filterStatus" variant="toolbar" :options="TASK_FILTER_STATUS" />
          <UiSelect v-model="filterPriority" variant="toolbar" :options="TASK_FILTER_PRIORITY" />
          <UiSelect v-model="filterAssignee" variant="toolbar" :options="TASK_FILTER_ASSIGNEES" />
          <UiSelect v-model="filterCategory" variant="toolbar" :options="TASK_FILTER_CATEGORY" />
        </div>
        <div class="tasks-toolbar-views">
          <UiSwitcher v-model="viewMode" variant="icon" class="tasks-view-switch">
            <UiSwitcherTab id="list" title="Список">
              <List :size="15" stroke-width="1.75" />
            </UiSwitcherTab>
            <UiSwitcherTab id="kanban" title="Канбан">
              <LayoutGrid :size="15" stroke-width="1.75" />
            </UiSwitcherTab>
          </UiSwitcher>
        </div>
      </div>
    </div>

    <!-- List: tashqi ramka yo‘q, har bir vazifa alohida karta -->
    <div v-if="viewMode === 'list'" class="tasks-list-stack">
      <ul class="tasks-list">
        <li v-for="task in filteredTasks" :key="task.id" class="tasks-item-wrap">
          <RouterLink
            class="tasks-item tasks-item--card"
            :class="{ 'tasks-item--done': task.status === 'done' }"
            :to="{ name: 'task-detail', params: { id: task.id } }"
          >
            <div class="tasks-item-body">
              <div class="tasks-item-title">{{ task.title }}</div>
              <div class="tasks-item-summary">{{ task.summary }}</div>
              <div class="tasks-item-meta">
                <span class="tasks-tag">{{ task.categoryLabel }}</span>
                <span
                  class="tasks-prio"
                  :class="`tasks-prio--${task.priority}`"
                >{{ priorityLabel(task.priority) }}</span>
                <span
                  class="tasks-due"
                  :class="{ 'tasks-due--overdue': isOverdue(task) }"
                >{{ fmtDue(task.due) }}</span>
              </div>
            </div>
            <div class="tasks-item-avatar" :title="task.assignee.name">
              {{ task.assignee.initials }}
            </div>
          </RouterLink>
        </li>
        <li v-if="filteredTasks.length === 0" class="tasks-list-empty">
          Нет задач по фильтрам.
        </li>
      </ul>
    </div>

    <!-- Kanban -->
    <div v-else class="tasks-kanban">
      <div
        v-for="col in KANBAN_COLUMNS"
        :key="col.id"
        class="tasks-kan-col card"
      >
        <div class="tasks-kan-head">
          <span class="tasks-kan-title">{{ col.label }}</span>
          <span class="tasks-kan-count">{{ tasksInColumn(col.id).length }}</span>
        </div>
        <div class="tasks-kan-cards">
          <RouterLink
            v-for="task in tasksInColumn(col.id)"
            :key="task.id"
            class="tasks-kan-card"
            :class="{ 'tasks-kan-card--done': task.status === 'done' }"
            :to="{ name: 'task-detail', params: { id: task.id } }"
          >
            <div class="tasks-kan-card-title">{{ task.title }}</div>
            <p class="tasks-kan-card-sum">{{ task.summary }}</p>
            <div class="tasks-kan-card-meta">
              <span class="tasks-tag">{{ task.categoryLabel }}</span>
              <span class="tasks-prio" :class="`tasks-prio--${task.priority}`">
                {{ priorityLabel(task.priority) }}
              </span>
            </div>
            <div class="tasks-kan-card-foot">
              <span
                class="tasks-due"
                :class="{ 'tasks-due--overdue': isOverdue(task) }"
              >{{ fmtDue(task.due) }}</span>
              <div class="tasks-item-avatar tasks-item-avatar--sm" :title="task.assignee.name">
                {{ task.assignee.initials }}
              </div>
            </div>
          </RouterLink>
          <p v-if="tasksInColumn(col.id).length === 0" class="tasks-kan-empty">Пусто</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tasks-page {
  width: 100%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px 0 48px;
  box-sizing: border-box;
}

.tasks-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.tasks-title {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: #1a1a1a;
  letter-spacing: -0.03em;
}

/* Bir qator: chapda qidiruv, o‘ngda filtrlar + switcher */
.tasks-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px 16px;
  flex-wrap: wrap;
}

.tasks-toolbar-search {
  flex: 1 1 200px;
  min-width: 0;
  max-width: 400px;
}

.tasks-toolbar-right {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-end;
  flex: 1 1 min(0, 100%);
  min-width: 0;
}

.tasks-toolbar-filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  justify-content: flex-end;
}

.tasks-toolbar-views {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  padding-left: 10px;
  border-left: 1px solid #e5e5e5;
}

.tasks-view-switch {
  flex-shrink: 0;
}

@media (max-width: 640px) {
  .tasks-toolbar-right {
    flex-basis: 100%;
    justify-content: flex-start;
  }
  .tasks-toolbar-views {
    padding-left: 0;
    border-left: none;
    width: 100%;
    justify-content: flex-end;
  }
}

.tasks-list-stack {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.tasks-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tasks-item-wrap {
  margin: 0;
}

.tasks-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  text-decoration: none;
  color: inherit;
  box-sizing: border-box;
}

.tasks-item--card {
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 10px;
  transition: border-color 0.12s, box-shadow 0.12s, opacity 0.15s;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.04);
}

.tasks-item--card:hover {
  border-color: #d8d8d8;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.tasks-item.router-link-active {
  border-color: #b8d4f8;
  box-shadow: 0 0 0 1px rgba(91, 142, 240, 0.2);
}

.tasks-item--done {
  opacity: 0.52;
}

.tasks-item--done .tasks-item-title {
  text-decoration: line-through;
  color: #888;
}

.tasks-item-body {
  flex: 1;
  min-width: 0;
}

.tasks-item-title {
  font-size: 13.5px;
  font-weight: 600;
  color: #1a1a1a;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tasks-item-summary {
  font-size: 12.5px;
  color: #777;
  margin-top: 4px;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tasks-item-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.tasks-tag {
  font-size: 11px;
  font-weight: 500;
  color: #5b8ef0;
  background: #eef3fd;
  padding: 2px 8px;
  border-radius: 6px;
}

.tasks-prio {
  font-size: 11px;
  font-weight: 600;
}
.tasks-prio--high { color: #c02626; }
.tasks-prio--normal { color: #6b7280; }
.tasks-prio--low { color: #9ca3af; }

.tasks-due {
  font-size: 12px;
  color: #666;
}

.tasks-due--overdue {
  color: #c02626;
  font-weight: 600;
}

.tasks-item-avatar {
  width: 36px;
  height: 36px;
  border-radius: 9px;
  background: #ede9f8;
  color: #5c4a9e;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.tasks-item-avatar--sm {
  width: 28px;
  height: 28px;
  font-size: 10px;
  border-radius: 7px;
}

.tasks-list-empty {
  padding: 32px 16px;
  text-align: center;
  color: #bbb;
  font-size: 13px;
  list-style: none;
}

/* Kanban */
.tasks-kanban {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  align-items: start;
  min-width: 0;
}

@media (max-width: 1100px) {
  .tasks-kanban {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .tasks-kanban {
    grid-template-columns: 1fr;
  }
}

.tasks-kan-col {
  padding: 0;
  display: flex;
  flex-direction: column;
  max-height: min(calc(100vh - 280px), 640px);
  min-height: 200px;
}

.tasks-kan-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid #eee;
  flex-shrink: 0;
}

.tasks-kan-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #666;
}

.tasks-kan-count {
  font-size: 12px;
  font-weight: 600;
  color: #aaa;
}

.tasks-kan-cards {
  padding: 8px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tasks-kan-card {
  padding: 10px;
  border-radius: 8px;
  background: #fafafa;
  border: 1px solid #eee;
  transition: opacity 0.15s, border-color 0.12s;
  text-decoration: none;
  color: inherit;
  display: block;
  box-sizing: border-box;
}

.tasks-kan-card:hover {
  border-color: #e0e0e0;
}

.tasks-kan-card.router-link-active {
  border-color: #5b8ef0;
  background: #f5f9ff;
}

.tasks-kan-card--done {
  opacity: 0.55;
}

.tasks-kan-card--done .tasks-kan-card-title {
  text-decoration: line-through;
  color: #888;
}

.tasks-kan-card-title {
  font-size: 12.5px;
  font-weight: 600;
  color: #1a1a1a;
  line-height: 1.35;
  flex: 1;
  min-width: 0;
}

.tasks-kan-card-sum {
  margin: 6px 0 0;
  font-size: 11.5px;
  color: #888;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tasks-kan-card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.tasks-kan-card-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid #eee;
}

.tasks-kan-empty {
  margin: 0;
  padding: 16px 8px;
  text-align: center;
  font-size: 12px;
  color: #ccc;
}

.card {
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 10px;
}
</style>
