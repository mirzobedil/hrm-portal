<script setup>
import { ref, watch } from 'vue'
import {
  X,
  ChevronUp,
  Minus,
  ChevronDown,
} from 'lucide-vue-next'
import {
  UiButton,
  UiTextField,
  UiTextarea,
  UiSelect,
  UiIconButton,
} from '@/components/ui'
import {
  TASK_CREATE_TEMPLATES,
  TASK_CREATE_TYPES,
  TASK_CATEGORY_CHIPS,
  TASK_CREATE_ASSIGNEES,
  TASK_ESCALATION_OPTIONS,
  TASK_ASSIGNEE_BY_KEY,
} from '@/constants/tasks'
import { todayIsoLocal } from '@/data/tasksDemo'
import { useTasks } from '@/composables/useTasks'

const DRAFT_KEY = 'hrm-portal-task-create-draft'

const open = defineModel('open', { type: Boolean, default: false })

const emit = defineEmits(['created'])

const { nextTaskId, addTask } = useTasks()

const PRIORITY_SEG = [
  { id: 'high', label: 'Высокий', icon: ChevronUp },
  { id: 'normal', label: 'Средний', icon: Minus },
  { id: 'low', label: 'Низкий', icon: ChevronDown },
]

function emptyForm() {
  return {
    templateId: '',
    title: '',
    description: '',
    taskType: 'manual',
    due: todayIsoLocal(),
    priority: 'normal',
    categoryIds: ['onboarding'],
    assigneeKey: 'aa',
    escalation: 'manager',
  }
}

function readDraft() {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const o = JSON.parse(raw)
    const base = emptyForm()
    for (const k of Object.keys(base)) {
      if (o[k] !== undefined) base[k] = o[k]
    }
    return base
  } catch {
    return null
  }
}

const form = ref(emptyForm())
const titleError = ref('')
const draftSaved = ref(false)
let draftToastTimer = null

watch(open, (v) => {
  if (v) {
    form.value = readDraft() ?? emptyForm()
    titleError.value = ''
    draftSaved.value = false
  }
})

function close() {
  open.value = false
}

function toggleCategory(id) {
  const cur = form.value.categoryIds
  const i = cur.indexOf(id)
  if (i >= 0) {
    if (cur.length <= 1) return
    cur.splice(i, 1)
  } else {
    cur.push(id)
  }
}

function chipToneClass(tone) {
  return `task-cat-chip--${tone}`
}

function saveDraft() {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(form.value))
    draftSaved.value = true
    if (draftToastTimer) clearTimeout(draftToastTimer)
    draftToastTimer = setTimeout(() => {
      draftSaved.value = false
    }, 2600)
  } catch {
    /* ignore quota */
  }
}

function submit() {
  titleError.value = ''
  const title = form.value.title.trim()
  if (!title) {
    titleError.value = 'Укажите название'
    return
  }

  const chips = TASK_CATEGORY_CHIPS.filter(c => form.value.categoryIds.includes(c.id))
  const category = chips[0]?.id ?? 'onboarding'
  const categoryLabel = chips.map(c => c.label).join(', ') || 'Онбординг'

  const assignee = TASK_ASSIGNEE_BY_KEY[form.value.assigneeKey]
  if (!assignee) return

  const desc = form.value.description.trim()
  const id = nextTaskId()

  addTask({
    id,
    title,
    summary: desc ? desc.slice(0, 160) : title,
    description: desc || title,
    status: 'open',
    priority: form.value.priority,
    category,
    categoryLabel,
    assigneeKey: form.value.assigneeKey,
    assignee: { name: assignee.name, initials: assignee.initials },
    due: form.value.due,
    source: form.value.taskType === 'system' ? 'system' : 'manual',
    templateId: form.value.templateId || null,
    escalation: form.value.escalation,
    checklist: [],
    comments: [],
  })

  try {
    sessionStorage.removeItem(DRAFT_KEY)
  } catch {
    /* ignore */
  }

  emit('created', { id })
  close()
}
</script>

<template>
  <Teleport to="body">
    <Transition name="task-modal">
      <div
        v-if="open"
        class="task-create-overlay"
        role="presentation"
        @click.self="close"
      >
        <div
          class="task-create-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="task-create-heading"
          @click.stop
        >
          <header class="task-create-top">
            <h2 id="task-create-heading" class="task-create-h">
              Новая задача
            </h2>
            <div class="task-create-tmpl">
              <span class="task-create-tmpl-lbl">Из шаблона</span>
              <UiSelect
                v-model="form.templateId"
                variant="toolbar"
                class="task-create-tmpl-select"
                :options="TASK_CREATE_TEMPLATES"
              />
            </div>
            <UiIconButton
              type="button"
              aria-label="Закрыть"
              class="task-create-close"
              @click="close"
            >
              <X :size="18" stroke-width="1.75" />
            </UiIconButton>
          </header>

          <div class="task-create-body">
            <div class="task-field">
              <label class="task-lbl" for="task-create-title">
                Название задачи <span class="task-req" aria-hidden="true">*</span>
              </label>
              <UiTextField
                id="task-create-title"
                v-model="form.title"
                placeholder="Например: Подписать трудовой договор"
                autocomplete="off"
                full-width
                :invalid="!!titleError"
              />
              <p v-if="titleError" class="task-err">{{ titleError }}</p>
            </div>

            <div class="task-field">
              <label class="task-lbl" for="task-create-desc">Описание</label>
              <UiTextarea
                id="task-create-desc"
                v-model="form.description"
                class="task-textarea"
                rows="4"
                full-width
                placeholder="Кратко опишите суть задачи"
              />
            </div>

            <div class="task-row2">
              <div class="task-field task-field--half">
                <label class="task-lbl" for="task-create-type">
                  Тип задачи <span class="task-req" aria-hidden="true">*</span>
                </label>
                <UiSelect
                  id="task-create-type"
                  v-model="form.taskType"
                  variant="toolbar"
                  full-width
                  :options="TASK_CREATE_TYPES"
                />
              </div>
              <div class="task-field task-field--half">
                <label class="task-lbl" for="task-create-due">Дедлайн</label>
                <input
                  id="task-create-due"
                  v-model="form.due"
                  type="date"
                  class="ui-field ui-field--full"
                >
              </div>
            </div>

            <div class="task-field">
              <span class="task-lbl">Приоритет</span>
              <div class="task-prio-row" role="group" aria-label="Приоритет">
                <button
                  v-for="p in PRIORITY_SEG"
                  :key="p.id"
                  type="button"
                  class="task-prio-btn"
                  :class="{ 'is-on': form.priority === p.id }"
                  @click="form.priority = p.id"
                >
                  <component :is="p.icon" :size="14" stroke-width="2.25" class="task-prio-ic" />
                  {{ p.label }}
                </button>
              </div>
            </div>

            <div class="task-field">
              <span class="task-lbl">Категория</span>
              <div class="task-cat-row">
                <button
                  v-for="c in TASK_CATEGORY_CHIPS"
                  :key="c.id"
                  type="button"
                  class="task-cat-chip"
                  :class="[
                    chipToneClass(c.tone),
                    { 'task-cat-chip--on': form.categoryIds.includes(c.id) },
                  ]"
                  @click="toggleCategory(c.id)"
                >
                  {{ c.label }}
                </button>
              </div>
            </div>

            <div class="task-row2">
              <div class="task-field task-field--half">
                <label class="task-lbl" for="task-create-assign">Назначить</label>
                <UiSelect
                  id="task-create-assign"
                  v-model="form.assigneeKey"
                  variant="toolbar"
                  full-width
                  :options="TASK_CREATE_ASSIGNEES"
                />
              </div>
              <div class="task-field task-field--half">
                <label class="task-lbl" for="task-create-esc">Уведомить при просрочке</label>
                <UiSelect
                  id="task-create-esc"
                  v-model="form.escalation"
                  variant="toolbar"
                  full-width
                  :options="TASK_ESCALATION_OPTIONS"
                />
              </div>
            </div>

            <p v-if="draftSaved" class="task-draft-hint" role="status">
              Черновик сохранён
            </p>
          </div>

          <footer class="task-create-footer">
            <button type="button" class="task-footer-cancel" @click="close">
              Отмена
            </button>
            <div class="task-footer-actions">
              <UiButton type="button" variant="secondary" @click="saveDraft">
                Сохранить черновик
              </UiButton>
              <UiButton type="button" variant="primary" @click="submit">
                Создать задачу
              </UiButton>
            </div>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.task-create-overlay {
  position: fixed;
  inset: 0;
  z-index: 120;
  background: rgba(0, 0, 0, 0.28);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 40px 16px;
  overflow-y: auto;
  box-sizing: border-box;
}

.task-create-modal {
  width: 100%;
  max-width: 640px;
  background: #fff;
  border-radius: 10px;
  border: 1px solid #e8e8e8;
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.04),
    0 20px 40px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.task-create-top {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px 12px;
  flex-shrink: 0;
  border-bottom: 1px solid #f0f0f0;
}

.task-create-h {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  color: #111;
  letter-spacing: -0.02em;
}

.task-create-tmpl {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.task-create-tmpl-lbl {
  font-size: 13px;
  color: #666;
  white-space: nowrap;
}

.task-create-tmpl-select {
  flex: 1;
  max-width: 280px;
  min-width: 160px;
}

.task-create-tmpl-select :deep(.ui-dropdown-trigger) {
  font-size: 13px;
}

.task-create-close {
  margin-left: auto;
  flex-shrink: 0;
  color: #888;
}

.task-create-body {
  padding: 18px 20px 8px;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.task-field {
  margin-bottom: 16px;
}

.task-field--half {
  margin-bottom: 0;
  min-width: 0;
}

.task-lbl {
  display: block;
  font-size: 12.5px;
  font-weight: 500;
  color: #555;
  margin-bottom: 6px;
}

.task-req {
  color: #c2410c;
  font-weight: 600;
}

.task-err {
  margin: 6px 0 0;
  font-size: 12px;
  color: #dc2626;
}

.task-textarea :deep(textarea) {
  font-size: 13.5px;
  line-height: 1.45;
  resize: vertical;
  min-height: 96px;
}

.task-row2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

@media (max-width: 560px) {
  .task-row2 {
    grid-template-columns: 1fr;
  }
}

.task-prio-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.task-prio-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 14px;
  min-height: 36px;
  border-radius: 8px;
  border: 1px solid #e5e5e5;
  background: #fff;
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  color: #444;
  cursor: pointer;
  transition:
    background 0.12s,
    border-color 0.12s,
    color 0.12s;
}

.task-prio-btn:hover {
  background: #fafafa;
  border-color: #ddd;
}

.task-prio-ic {
  flex-shrink: 0;
  color: #888;
}

.task-prio-btn.is-on {
  background: #fffbeb;
  border-color: #fbbf24;
  color: #92400e;
}

.task-prio-btn.is-on .task-prio-ic {
  color: #b45309;
}

.task-cat-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.task-cat-chip {
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid #e8e8e8;
  background: #fff;
  font: inherit;
  font-size: 12.5px;
  font-weight: 500;
  color: #555;
  cursor: pointer;
  transition: background 0.12s, border-color 0.12s, color 0.12s;
}

.task-cat-chip:hover {
  border-color: #ddd;
}

.task-cat-chip--blue.task-cat-chip--on {
  background: #eef3fd;
  border-color: #93b4f4;
  color: #1d4ed8;
}
.task-cat-chip--violet.task-cat-chip--on {
  background: #f3f0ff;
  border-color: #c4b5fd;
  color: #5b21b6;
}
.task-cat-chip--teal.task-cat-chip--on {
  background: #e6f7f4;
  border-color: #7dd3c0;
  color: #0f766e;
}
.task-cat-chip--sky.task-cat-chip--on {
  background: #e8f4fc;
  border-color: #7cb8ea;
  color: #1d4ed8;
}
.task-cat-chip--rose.task-cat-chip--on {
  background: #fceff4;
  border-color: #f9a8d4;
  color: #9d174d;
}
.task-cat-chip--slate.task-cat-chip--on {
  background: #f1f5f9;
  border-color: #94a3b8;
  color: #334155;
}

.task-draft-hint {
  margin: 4px 0 0;
  font-size: 12.5px;
  color: #15803d;
}

.task-create-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 14px 20px 18px;
  border-top: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.task-footer-cancel {
  padding: 0 4px;
  border: none;
  background: none;
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  border-radius: 6px;
}

.task-footer-cancel:hover {
  color: #111;
  background: #f5f5f5;
}

.task-footer-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

.task-modal-enter-active,
.task-modal-leave-active {
  transition: opacity 0.2s ease;
}
.task-modal-enter-active .task-create-modal,
.task-modal-leave-active .task-create-modal {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.task-modal-enter-from,
.task-modal-leave-to {
  opacity: 0;
}
.task-modal-enter-from .task-create-modal,
.task-modal-leave-to .task-create-modal {
  opacity: 0;
  transform: translateY(10px) scale(0.99);
}
</style>
