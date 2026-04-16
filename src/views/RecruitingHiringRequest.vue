<script setup>
import { ref, computed, onMounted, onUnmounted, inject } from 'vue'
import { useRouter, onBeforeRouteLeave } from 'vue-router'
import {
  UiInput, UiSelect, UiTextarea, UiButton, UiField, UiIconButton,
} from '@/components/ui'
import { Eraser, Paperclip } from 'lucide-vue-next'
import { REC_HIRING_DEPT_OPTIONS } from '@/data/recruitingHiringRequestDemo.js'

const router = useRouter()
const addNotification = inject('addNotification', () => {})

const deptOptions = [
  { value: '', label: '— Выберите подразделение —' },
  ...REC_HIRING_DEPT_OPTIONS,
]

function emptyForm() {
  return {
    recruitmentType: 'internal',
    department: '',
    position: '',
    headcount: '',
    employmentType: 'full',
    duties: '',
    requirements: '',
    salaryLevel: '',
  }
}

const form = ref(emptyForm())
const attachmentFiles = ref([])
const fileInputRef = ref(null)
const formError = ref('')
const saveSucceeded = ref(false)

const recruitmentRadios = [
  { value: 'internal', label: 'Внутренний' },
  { value: 'external', label: 'Внешний' },
]

const employmentRadios = [
  { value: 'full', label: 'Полная' },
  { value: 'part', label: 'Частичная' },
  { value: 'remote', label: 'Удалённая' },
]

const isDirty = computed(() => {
  const i = emptyForm()
  const f = form.value
  if (
    f.recruitmentType !== i.recruitmentType ||
    f.department !== i.department ||
    (f.position || '') !== i.position ||
    String(f.headcount ?? '') !== String(i.headcount) ||
    f.employmentType !== i.employmentType ||
    (f.duties || '') !== i.duties ||
    (f.requirements || '') !== i.requirements ||
    (f.salaryLevel || '') !== i.salaryLevel
  ) {
    return true
  }
  return attachmentFiles.value.length > 0
})

function beforeUnloadHandler(e) {
  if (isDirty.value && !saveSucceeded.value) {
    e.preventDefault()
    e.returnValue = ''
  }
}

onMounted(() => {
  window.addEventListener('beforeunload', beforeUnloadHandler)
})
onUnmounted(() => {
  window.removeEventListener('beforeunload', beforeUnloadHandler)
})

onBeforeRouteLeave(() => {
  if (saveSucceeded.value || !isDirty.value) return true
  return window.confirm('Покинуть страницу? Внесённые данные не сохранятся.')
})

function onFilesSelected(e) {
  const input = e.target
  const files = input.files ? Array.from(input.files) : []
  if (files.length) {
    attachmentFiles.value = [...attachmentFiles.value, ...files]
  }
  input.value = ''
}

function removeAttachment(idx) {
  attachmentFiles.value.splice(idx, 1)
}

function openFilePicker() {
  fileInputRef.value?.click()
}

function clearAll() {
  form.value = emptyForm()
  attachmentFiles.value = []
  formError.value = ''
  if (fileInputRef.value) fileInputRef.value.value = ''
}

function validate() {
  const f = form.value
  if (!f.department) return 'Выберите подразделение.'
  if (!(f.position || '').trim()) return 'Укажите должность.'
  const n = Number(f.headcount)
  if (!Number.isFinite(n) || n < 1 || !Number.isInteger(n)) {
    return 'Укажите количество позиций (целое число ≥ 1).'
  }
  if (!(f.duties || '').trim()) return 'Заполните функциональные обязанности.'
  if (!(f.requirements || '').trim()) return 'Заполните требования к кандидату.'
  if (!(f.salaryLevel || '').trim()) return 'Укажите уровень оплаты труда.'
  return ''
}

function onSaveDraft() {
  formError.value = validate()
  if (formError.value) return
  addNotification({
    title: 'Черновик сохранён',
    body: `Заявка «${form.value.position.trim()}» сохранена в статусе «Черновик».`,
    roles: ['staff', 'manager', 'hr', 'admin'],
    cta: null,
  })
}

function onSubmitApproval() {
  formError.value = validate()
  if (formError.value) return
  saveSucceeded.value = true
  addNotification({
    title: 'На согласовании',
    body: `Заявка «${form.value.position.trim()}» отправлена на согласование.`,
    roles: ['staff', 'manager', 'hr', 'admin'],
    cta: null,
  })
  router.push({ path: '/recruiting', query: { tab: 'vacancies' } })
}

function onCancel() {
  router.push({ path: '/recruiting', query: { tab: 'vacancies' } })
}
</script>

<template>
  <div class="rec-hr-req">
    <div class="rec-hr-req__panel">
      <h1 class="rec-hr-req__title">Создание заявки</h1>
      <p class="rec-hr-req__lead">
        Заявка на подбор персонала: заполните поля и при необходимости прикрепите документы.
      </p>

      <div class="rec-hr-req__section">
        <h2 class="rec-hr-req__section-title">Параметры</h2>

        <UiField label="Тип подбора">
          <div class="rec-hr-req__radios" role="radiogroup" aria-label="Тип подбора">
            <label
              v-for="opt in recruitmentRadios"
              :key="opt.value"
              class="rec-hr-req__radio"
            >
              <input
                v-model="form.recruitmentType"
                type="radio"
                name="recruitmentType"
                :value="opt.value"
                class="rec-hr-req__radio-input"
              />
              <span>{{ opt.label }}</span>
            </label>
          </div>
        </UiField>

        <div class="rec-hr-req__row">
          <UiField label="Подразделение" class="rec-hr-req__grow">
            <UiSelect
              v-model="form.department"
              full-width
              placeholder="Подразделение"
              :options="deptOptions"
            />
          </UiField>
          <UiField label="Количество позиций" class="rec-hr-req__narrow">
            <UiInput
              v-model="form.headcount"
              type="number"
              min="1"
              step="1"
              inputmode="numeric"
              placeholder="1"
              full-width
            />
          </UiField>
        </div>

        <UiField label="Должность">
          <UiInput v-model="form.position" type="text" full-width placeholder="Наименование должности" />
        </UiField>

        <UiField label="Тип занятости">
          <div class="rec-hr-req__radios" role="radiogroup" aria-label="Тип занятости">
            <label
              v-for="opt in employmentRadios"
              :key="opt.value"
              class="rec-hr-req__radio"
            >
              <input
                v-model="form.employmentType"
                type="radio"
                name="employmentType"
                :value="opt.value"
                class="rec-hr-req__radio-input"
              />
              <span>{{ opt.label }}</span>
            </label>
          </div>
        </UiField>

        <UiField label="Функциональные обязанности">
          <UiTextarea
            v-model="form.duties"
            full-width
            rows="4"
            placeholder="Основные задачи и функции должности"
          />
        </UiField>

        <UiField label="Требования к кандидату">
          <UiTextarea
            v-model="form.requirements"
            full-width
            rows="4"
            placeholder="Опыт, навыки, квалификация"
          />
        </UiField>

        <UiField label="Уровень оплаты труда">
          <UiInput
            v-model="form.salaryLevel"
            type="text"
            full-width
            placeholder="Например: по результатам собеседования, вилка 15–25 млн"
          />
        </UiField>
      </div>

      <div class="rec-hr-req__section rec-hr-req__section--follow">
        <h2 class="rec-hr-req__section-title">Вложения</h2>
        <p class="rec-hr-req__hint">
          Должностная инструкция, штатное расписание, обоснование и др. (по необходимости).
        </p>
        <input
          ref="fileInputRef"
          type="file"
          class="rec-hr-req__file-input"
          multiple
          @change="onFilesSelected"
        />
        <UiButton variant="secondary" size="sm" type="button" @click="openFilePicker">
          <Paperclip :size="14" stroke-width="2" aria-hidden="true" />
          Прикрепить файлы
        </UiButton>
        <ul v-if="attachmentFiles.length" class="rec-hr-req__files">
          <li v-for="(file, idx) in attachmentFiles" :key="`${file.name}-${idx}`" class="rec-hr-req__file-item">
            <span class="rec-hr-req__file-name" :title="file.name">{{ file.name }}</span>
            <button type="button" class="rec-hr-req__file-remove" @click="removeAttachment(idx)">
              Удалить
            </button>
          </li>
        </ul>
      </div>

      <div v-if="formError" class="rec-hr-req__error" role="alert">{{ formError }}</div>

      <div class="rec-hr-req__footer">
        <div class="rec-hr-req__footer-left">
          <UiIconButton
            type="button"
            size="md"
            title="Стереть"
            aria-label="Стереть все поля формы"
            @click="clearAll"
          >
            <Eraser :size="18" stroke-width="2" />
          </UiIconButton>
        </div>
        <div class="rec-hr-req__footer-right">
          <UiButton variant="secondary" type="button" @click="onCancel">Отмена</UiButton>
          <UiButton variant="secondary" type="button" @click="onSaveDraft">Сохранить</UiButton>
          <UiButton variant="primary" type="button" @click="onSubmitApproval">
            Отправить на согласование
          </UiButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rec-hr-req {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
  max-width: min(720px, 100%);
}

.rec-hr-req__panel {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  padding: 20px 22px 22px;
  min-width: 0;
}

.rec-hr-req__title {
  margin: 0 0 6px;
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
}

.rec-hr-req__lead {
  margin: 0 0 18px;
  font-size: 13px;
  line-height: 1.45;
  color: #777;
  padding-bottom: 14px;
  border-bottom: 1px solid #f0f0f0;
}

.rec-hr-req__section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.rec-hr-req__section--follow {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.rec-hr-req__section-title {
  margin: 0;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6b6b6b;
}

.rec-hr-req__row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-start;
}

.rec-hr-req__grow {
  flex: 1 1 200px;
  min-width: 0;
}

.rec-hr-req__narrow {
  flex: 0 0 140px;
  min-width: 0;
}

.rec-hr-req__radios {
  display: flex;
  flex-wrap: wrap;
  gap: 14px 20px;
}

.rec-hr-req__radio {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #333;
  cursor: pointer;
  user-select: none;
}

.rec-hr-req__radio-input {
  width: 15px;
  height: 15px;
  accent-color: #3b6fd8;
  cursor: pointer;
}

.rec-hr-req__hint {
  margin: -6px 0 4px;
  font-size: 12px;
  line-height: 1.4;
  color: #999;
}

.rec-hr-req__file-input {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.rec-hr-req__files {
  list-style: none;
  margin: 10px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.rec-hr-req__file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 12px;
  padding: 6px 10px;
  background: #f8f8f8;
  border-radius: 8px;
  border: 1px solid #eee;
}

.rec-hr-req__file-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #444;
}

.rec-hr-req__file-remove {
  flex-shrink: 0;
  border: none;
  background: none;
  color: #888;
  font-size: 12px;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
}
.rec-hr-req__file-remove:hover {
  color: #c00;
  background: #fff5f5;
}

.rec-hr-req__error {
  margin-top: 14px;
  padding: 10px 12px;
  font-size: 13px;
  color: #b91c1c;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
}

.rec-hr-req__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 22px;
  padding-top: 18px;
  border-top: 1px solid #f0f0f0;
}

.rec-hr-req__footer-right {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

@media (max-width: 560px) {
  .rec-hr-req__footer {
    flex-direction: column;
    align-items: stretch;
  }
  .rec-hr-req__footer-left {
    order: 1;
  }
  .rec-hr-req__footer-right {
    flex-direction: column;
    width: 100%;
  }
  .rec-hr-req__footer-right :deep(.ui-btn) {
    width: 100%;
    justify-content: center;
  }
}
</style>
