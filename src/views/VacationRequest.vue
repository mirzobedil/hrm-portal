<script setup>
import { ref, computed, watch, inject, onMounted, onUnmounted } from 'vue'
import { useRouter, onBeforeRouteLeave } from 'vue-router'
import {
  UiInput, UiSelect, UiTextarea, UiButton, UiField, UiSlider,
} from '@/components/ui'
import {
  ChevronLeft, Send, CalendarDays, Minus,
  CalendarRange, Wallet, MessageSquare,
} from 'lucide-vue-next'
import { LINE_MANAGER } from '@/constants/vacation'
import { VACATION_REQUEST_FLASH_TOAST_KEY } from '@/constants/vacationRequestUi'
import { EMPLOYEE_DATA } from '@/data/vacationRequests'
import { COLLEAGUES } from '@/data/colleagues'
import { useVacationRequests } from '@/composables/useVacationRequests'
import TeamAbsenceCalendar from '@/components/TeamAbsenceCalendar.vue'

const router = useRouter()
const sessionUser = inject('sessionUser')
const addNotification = inject('addNotification', () => {})

const { allRequests } = useVacationRequests()

const currentUser = computed(() => ({
  name: sessionUser.value.name,
  isTopLevel: sessionUser.value.isTopLevel,
}))

const balance = computed(() => {
  const b = EMPLOYEE_DATA[sessionUser.value.name]?.balance
  return b ? { total: b.total, used: b.used } : { total: 28, used: 0 }
})

const plannedDays = computed(() =>
  allRequests.value
    .filter(r => r.employee === currentUser.value.name && r.status === 'planned' && r.type === 'Ежегодный')
    .reduce((sum, r) => sum + r.days, 0),
)
const remaining = computed(() => balance.value.total - balance.value.used - plannedDays.value)

/** Уже зарезервировано под запланированные заявки «Компенсация» (списывается с ежегодного остатка) */
const plannedCompensationReserve = computed(() =>
  allRequests.value
    .filter(r => r.employee === currentUser.value.name && r.status === 'planned' && r.type === 'Компенсация')
    .reduce((sum, r) => sum + (r.compensationDays ?? r.days), 0),
)

/** Сколько дней ежегодного отпуска ещё можно направить в компенсацию (до выбора дат заявки) */
const annualAvailableForCompensation = computed(() =>
  Math.max(0, remaining.value - plannedCompensationReserve.value),
)

const managerProfile = computed(() => EMPLOYEE_DATA[LINE_MANAGER.name] || null)

function emptyForm() {
  return { from: '', to: '', compensationDays: '', comment: '', substituteId: '' }
}
const form = ref(emptyForm())
const error = ref('')
const submitSucceeded = ref(false)

const isDirty = computed(() => {
  const i = emptyForm()
  const f = form.value
  const sub = f.substituteId === '' || f.substituteId == null ? '' : String(f.substituteId)
  return (
    f.from !== i.from ||
    f.to !== i.to ||
    String(f.compensationDays ?? '') !== String(i.compensationDays ?? '') ||
    (f.comment || '') !== i.comment ||
    sub !== ''
  )
})

function beforeUnloadHandler(e) {
  if (isDirty.value && !submitSucceeded.value) {
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
  if (submitSucceeded.value || !isDirty.value) return true
  return window.confirm('Покинуть страницу? Внесённые данные не сохранятся.')
})

const substituteOptions = computed(() =>
  COLLEAGUES.filter(c => c.name !== currentUser.value.name),
)

const substituteIdOptions = computed(() => [
  { value: '', label: '— Не выбран —' },
  ...substituteOptions.value.map(c => ({ value: c.id, label: c.name })),
])

function fmtDate(iso) {
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}

function pluralDaysRu(n) {
  const x = Math.abs(n) % 100
  const y = x % 10
  if (x > 10 && x < 20) return 'дней'
  if (y === 1) return 'день'
  if (y >= 2 && y <= 4) return 'дня'
  return 'дней'
}

function daysBetween(from, to) {
  return Math.round((new Date(to) - new Date(from)) / 86400000) + 1
}

function hasOverlap(a1, a2, b1, b2) {
  return a1 <= b2 && a2 >= b1
}

const reqDays = computed(() => {
  if (!form.value.from || !form.value.to || form.value.from > form.value.to) return 0
  return daysBetween(form.value.from, form.value.to)
})

/** Верхняя граница: и период, и остаток ежегодного */
const maxCompensationDays = computed(() => {
  if (!reqDays.value) return 0
  return Math.min(annualAvailableForCompensation.value, reqDays.value)
})

const compMaxHint = computed(() => {
  const n = maxCompensationDays.value
  if (!reqDays.value) return '—'
  return `Макс. ${n} ${pluralDaysRu(n)}`
})

const compensationDaysNum = computed(() => {
  const n = parseInt(String(form.value.compensationDays ?? '').trim(), 10)
  return Number.isFinite(n) && n >= 0 ? n : NaN
})

/** Значение для range (всегда в [1, max], пока max ≥ 1) */
const compSliderValue = computed(() => {
  const max = maxCompensationDays.value
  if (max < 1) return 1
  const n = compensationDaysNum.value
  if (!Number.isFinite(n) || n < 1) return 1
  return Math.min(max, Math.max(1, n))
})

const remainingAnnualAfterComp = computed(() => {
  if (!reqDays.value || !Number.isFinite(compensationDaysNum.value) || compensationDaysNum.value < 1) return null
  return annualAvailableForCompensation.value - compensationDaysNum.value
})

function clampCompensationToLimit() {
  const max = maxCompensationDays.value
  if (max < 1) {
    form.value.compensationDays = ''
    return
  }
  const raw = parseInt(String(form.value.compensationDays ?? '').trim(), 10)
  if (!Number.isFinite(raw)) return
  if (raw > max) form.value.compensationDays = String(max)
  else if (raw < 1) form.value.compensationDays = '1'
}

watch(maxCompensationDays, max => {
  clampCompensationToLimit()
  if (max >= 1 && (form.value.compensationDays === '' || form.value.compensationDays == null)) {
    form.value.compensationDays = String(max)
  }
})

function onCompensationSliderVueform(val) {
  if (typeof val === 'number' && Number.isFinite(val)) {
    form.value.compensationDays = String(val)
  }
}

function onCompensationFieldInput(e) {
  const max = maxCompensationDays.value
  const raw = e.target.value
  if (raw === '' || raw === '-') {
    form.value.compensationDays = ''
    return
  }
  if (max < 1) {
    form.value.compensationDays = ''
    return
  }
  const v = parseInt(raw, 10)
  if (!Number.isFinite(v)) return
  form.value.compensationDays = String(Math.min(max, Math.max(1, v)))
}

function submit() {
  error.value = ''
  if (!form.value.from || !form.value.to) {
    error.value = 'Укажите дату начала и окончания'
    return
  }
  if (form.value.from > form.value.to) {
    error.value = 'Дата окончания раньше даты начала'
    return
  }
  const days = reqDays.value
  if (maxCompensationDays.value < 1) {
    error.value = 'Недостаточно дней ежегодного отпуска для компенсации по этой заявке'
    return
  }
  const comp = parseInt(String(form.value.compensationDays ?? '').trim(), 10)
  if (!Number.isFinite(comp) || comp < 1) {
    error.value = 'Укажите количество дней компенсации (ползунок или поле ввода)'
    return
  }
  if (comp > days) {
    error.value = `Дней компенсации не может быть больше длительности периода (${days} дн.)`
    return
  }
  if (comp > maxCompensationDays.value) {
    error.value = `Превышен лимит: не больше ${maxCompensationDays.value} дн. (ежегодный остаток и период)`
    return
  }
  const myActive = allRequests.value.filter(
    r => r.employee === currentUser.value.name && r.status !== 'rejected',
  )
  if (myActive.some(r => hasOverlap(form.value.from, form.value.to, r.from, r.to))) {
    error.value = 'Даты пересекаются с существующей заявкой'
    return
  }
  const newReq = {
    id: Date.now(),
    employee: currentUser.value.name,
    from: form.value.from,
    to: form.value.to,
    days,
    type: 'Компенсация',
    compensationDays: comp,
    comment: form.value.comment,
    substituteId: form.value.substituteId || null,
    status: 'pending_manager',
    activity: [
      { actor: currentUser.value.name, role: 'staff', action: 'submitted', time: new Date(), note: form.value.comment || '' },
    ],
  }
  allRequests.value.push(newReq)
  submitSucceeded.value = true
  try {
    sessionStorage.setItem(
      VACATION_REQUEST_FLASH_TOAST_KEY,
      'Заявка отправлена. Руководитель уведомлён.',
    )
  } catch {
    /* ignore */
  }
  addNotification({
    title: 'Новая заявка на рассмотрение',
    body: `${currentUser.value.name} — ${fmtDate(newReq.from)}–${fmtDate(newReq.to)} · ${days} дн. · компенсация ${comp} дн.`,
    roles: ['manager', 'hr', 'admin'],
    requestId: newReq.id,
    cta: 'Рассмотреть',
    ctaAction: 'approve',
  })
  router.push({ name: 'vacations' })
}
</script>

<template>
  <div class="vacation-request">
    <RouterLink :to="{ name: 'vacations' }" class="back-link">
      <ChevronLeft :size="16" stroke-width="2" />
      К отпускам
    </RouterLink>

    <div class="vr-layout">
      <section class="vr-panel vr-form">
        <h2 class="vr-section-title">Параметры заявки</h2>

        <div class="vr-section">
          <h3 class="vr-section__title">
            <CalendarRange :size="14" stroke-width="2" class="vr-section__ic" aria-hidden="true" />
            Сроки
          </h3>
          <div class="form-row">
            <UiField label="Дата начала">
              <UiInput v-model="form.from" type="date" full-width />
            </UiField>
            <UiField label="Дата окончания">
              <UiInput v-model="form.to" type="date" full-width />
            </UiField>
          </div>
          <div v-if="reqDays > 0" class="form-calc">
            <span class="calc-days">{{ reqDays }} {{ reqDays === 1 ? 'календарный день' : reqDays < 5 ? 'календарных дня' : 'календарных дней' }}</span>
            <template v-if="remainingAnnualAfterComp !== null">
              <span class="calc-sep"> · </span>
              <span :class="['calc-remaining', remainingAnnualAfterComp < 0 ? 'negative' : '']">
                останется {{ remainingAnnualAfterComp }} дн. ежегодного отпуска
              </span>
            </template>
          </div>
        </div>

        <div class="vr-section vr-section--follow">
          <h3 class="vr-section__title">
            <Wallet :size="14" stroke-width="2" class="vr-section__ic" aria-hidden="true" />
            Компенсация и замещение
          </h3>
          <UiField label="Дней к компенсации">
            <div
              class="vr-comp-control"
              :class="{ 'vr-comp-control--disabled': maxCompensationDays < 1 }"
            >
              <div class="vr-comp-control__row">
                <input
                  class="vr-comp-control__input"
                  type="number"
                  inputmode="numeric"
                  min="0"
                  :max="maxCompensationDays > 0 ? maxCompensationDays : 0"
                  step="1"
                  :disabled="maxCompensationDays < 1"
                  :value="maxCompensationDays < 1 ? '0' : (form.compensationDays === '' ? '' : form.compensationDays)"
                  placeholder="0"
                  aria-describedby="vr-comp-hint"
                  autocomplete="off"
                  @input="onCompensationFieldInput"
                />
                <span class="vr-comp-control__max" :title="compMaxHint">{{ compMaxHint }}</span>
              </div>
              <div v-if="maxCompensationDays >= 1" class="vr-comp-control__slider">
                <UiSlider
                  class="vr-comp-control__vueform"
                  :model-value="compSliderValue"
                  :min="1"
                  :max="maxCompensationDays"
                  :step="1"
                  @update:model-value="onCompensationSliderVueform"
                />
              </div>
            </div>
          </UiField>
          <p id="vr-comp-hint" class="vr-field-hint">
            <template v-if="reqDays < 1">Сначала выберите даты — появится лимит.</template>
            <template v-else-if="maxCompensationDays < 1">
              Недостаточно дней ежегодного отпуска для компенсации (доступно {{ annualAvailableForCompensation }} дн.).
            </template>
            <template v-else>
              Не больше {{ maxCompensationDays }} дн.: минимум из периода ({{ reqDays }} дн.) и остатка ежегодного отпуска ({{ annualAvailableForCompensation }} дн.).
            </template>
          </p>
          <UiField v-if="currentUser.isTopLevel" label="Замещающий сотрудник">
            <UiSelect v-model="form.substituteId" full-width :options="substituteIdOptions" />
          </UiField>
        </div>

        <div class="vr-section vr-section--follow">
          <h3 class="vr-section__title">
            <MessageSquare :size="14" stroke-width="2" class="vr-section__ic" aria-hidden="true" />
            Комментарий
          </h3>
          <UiField>
            <UiTextarea
              v-model="form.comment"
              placeholder="Необязательно — комментарий к заявке…"
              rows="4"
              full-width
            />
          </UiField>
        </div>

        <div v-if="error" class="form-error" role="alert" aria-live="assertive">{{ error }}</div>

        <div class="vr-form-footer-actions">
          <UiButton variant="primary" class="vr-submit vr-submit--form-end" type="button" @click="submit">
            <Send :size="15" stroke-width="2" />
            Отправить заявку
          </UiButton>
        </div>
      </section>

      <aside class="vr-aside">
        <div class="vr-panel vr-aside-panel">
          <div class="vr-aside-block">
            <h3 class="vr-aside-title">Остаток отпуска</h3>
            <div class="vr-stats">
              <div class="vr-stat">
                <div class="vr-stat-top">
                  <span class="vr-stat-label">Всего дней</span>
                  <CalendarDays :size="15" stroke-width="1.5" class="vr-stat-ic" />
                </div>
                <div class="vr-stat-value">{{ balance.total }}</div>
              </div>
              <div class="vr-stat">
                <div class="vr-stat-top">
                  <span class="vr-stat-label">Использовано</span>
                  <Minus :size="15" stroke-width="1.5" class="vr-stat-ic" />
                </div>
                <div class="vr-stat-value vr-stat-value--muted">{{ balance.used }}</div>
                <div class="vr-stat-sub">из {{ balance.total }}</div>
              </div>
              <div class="vr-stat vr-stat--highlight">
                <div class="vr-stat-top">
                  <span class="vr-stat-label">Доступно</span>
                </div>
                <div class="vr-stat-value vr-stat-value--blue">{{ remaining }}</div>
                <div class="vr-stat-sub">дней (ежегодный)</div>
              </div>
            </div>
          </div>

          <div class="vr-panel-divider" role="presentation" />

          <div class="vr-aside-block vr-aside-comp">
            <h3 class="vr-aside-title">
              <Wallet :size="14" stroke-width="1.75" class="vr-aside-title-ic" aria-hidden="true" />
              Компенсация
            </h3>
            <p class="vr-aside-lead">
              Лимит считается от <strong>ежегодного остатка</strong> (блок выше) и не может превышать выбранный период.
            </p>
            <div v-if="reqDays > 0" class="vr-comp-aside-cap">
              <span class="vr-comp-aside-cap-label">Макс. дней в заявке</span>
              <span class="vr-comp-aside-cap-val">{{ maxCompensationDays }}</span>
            </div>
            <p v-else class="vr-aside-muted">После выбора дат здесь появится максимум дней компенсации.</p>
          </div>

          <div class="vr-panel-divider" role="presentation" />

          <div class="vr-aside-block">
            <h3 class="vr-aside-title">Согласующий руководитель</h3>
            <div class="vr-manager-body">
              <div class="vr-manager-avatar" aria-hidden="true">{{ LINE_MANAGER.initials }}</div>
              <div class="vr-manager-text">
                <div class="vr-manager-name">{{ LINE_MANAGER.name }}</div>
                <div class="vr-manager-role">{{ managerProfile?.position || LINE_MANAGER.role }}</div>
                <div v-if="managerProfile" class="vr-manager-meta">
                  {{ managerProfile.dept }}<template v-if="managerProfile.subdept"> · {{ managerProfile.subdept }}</template>
                </div>
              </div>
            </div>
            <p class="vr-manager-hint">Заявка будет направлена на согласование.</p>
          </div>

          <UiButton variant="primary" class="vr-submit" @click="submit">
            <Send :size="15" stroke-width="2" />
            Отправить заявку
          </UiButton>
        </div>
      </aside>
    </div>

    <section class="vr-team-below" aria-labelledby="vr-team-heading">
      <h2 id="vr-team-heading" class="vr-team-title">Календарь команды</h2>
      <p class="vr-team-lead">
        Отделение и команда по месяцам. Оранжевая точка в шапке — пересечение отсутствий; синяя подсветка столбца — ваш план из формы.
      </p>
      <TeamAbsenceCalendar
        :draft-from="form.from"
        :draft-to="form.to"
        draft-type="Компенсация"
      />
    </section>
  </div>
</template>

<style scoped>
.vacation-request {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
  max-width: min(1200px, 100%);
}

.vr-team-below {
  margin-top: 8px;
  padding-top: 22px;
  border-top: 1px solid #ececec;
  min-width: 0;
}

.vr-team-title {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 8px;
}

.vr-team-lead {
  font-size: 13px;
  line-height: 1.45;
  color: #777;
  margin: 0 0 16px;
  max-width: 720px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #666;
  text-decoration: none;
  width: fit-content;
}
.back-link:hover {
  color: #111;
}

.vr-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 360px);
  gap: 20px;
  align-items: start;
}

@media (max-width: 900px) {
  .vr-layout {
    grid-template-columns: 1fr;
  }
}

/* Одна оболочка на колонку: без «карточки в карточке» */
.vr-panel {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  padding: 20px 22px;
}

.vr-form {
  display: flex;
  flex-direction: column;
  gap: 0;
  min-width: 0;
}

.vr-section-title {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 18px;
  padding-bottom: 14px;
  border-bottom: 1px solid #f0f0f0;
}

.vr-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.vr-section--follow {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.vr-section__title {
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 0;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6b6b6b;
}

.vr-section__ic {
  flex-shrink: 0;
  color: #9a9a9a;
}

.vr-aside {
  position: sticky;
  top: 12px;
}

.vr-aside-panel {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.vr-aside-block {
  min-width: 0;
}

.vr-panel-divider {
  height: 1px;
  margin: 18px 0;
  background: linear-gradient(90deg, transparent, #e8e8e8 12%, #e8e8e8 88%, transparent);
  border: none;
}

.vr-aside-title {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #888;
  margin: 0 0 12px;
}

.vr-stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.vr-stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.vr-stat--highlight {
  padding-top: 10px;
  margin-top: 4px;
  border-top: 1px solid #f0f0f0;
}

.vr-stat-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.vr-stat-label {
  font-size: 12px;
  color: #999;
  font-weight: 450;
}

.vr-stat-ic {
  color: #bbb;
  flex-shrink: 0;
}

.vr-stat-value {
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.5px;
  line-height: 1;
  color: #1a1a1a;
}

.vr-stat-value--muted {
  color: #c0c0c0;
}

.vr-stat-value--blue {
  color: #5b8ef0;
}

.vr-field-hint {
  margin: -6px 0 4px;
  font-size: 12px;
  line-height: 1.45;
  color: #888;
}

.vr-aside-title {
  display: flex;
  align-items: center;
  gap: 6px;
}

.vr-aside-title-ic {
  color: #c27803;
  flex-shrink: 0;
}

.vr-aside-comp .vr-aside-title {
  text-transform: none;
  letter-spacing: 0;
  font-size: 13px;
  color: #444;
}

.vr-aside-lead {
  margin: 0 0 12px;
  font-size: 12px;
  line-height: 1.45;
  color: #777;
}

.vr-aside-lead strong {
  font-weight: 600;
  color: #555;
}

.vr-aside-muted {
  margin: 0;
  font-size: 12px;
  color: #aaa;
  line-height: 1.4;
}

.vr-comp-aside-cap {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px;
  border-radius: 10px;
  background: linear-gradient(135deg, #fff9f0, #fff4e6);
  border: 1px solid #f0e0cc;
}

.vr-comp-aside-cap-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #a67c32;
}

.vr-comp-aside-cap-val {
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.5px;
  color: #b45309;
  line-height: 1;
}

/* Единый блок (макет): binafsha chegarа, input + slider yopishgan */
.vr-comp-control {
  --vr-comp-accent: #3d2c55;
  --vr-comp-accent-soft: rgba(61, 44, 85, 0.14);
  box-sizing: border-box;
  border: 1px solid var(--vr-comp-accent);
  border-radius: 12px;
  background: #fff;
  overflow: hidden;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.vr-comp-control:focus-within:not(.vr-comp-control--disabled) {
  border-color: var(--vr-comp-accent);
  box-shadow: 0 0 0 2px var(--vr-comp-accent-soft);
}

.vr-comp-control--disabled {
  opacity: 0.65;
  background: #fafafa;
}

.vr-comp-control__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
  padding: 12px 14px 0;
}

.vr-comp-control__input {
  box-sizing: border-box;
  flex: 1;
  min-width: 0;
  border: none;
  padding: 0;
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
  color: var(--vr-comp-accent);
  background: transparent;
  font-family: inherit;
}

.vr-comp-control__input:focus {
  outline: none;
}

.vr-comp-control__input::placeholder {
  color: #c8c8c8;
}

.vr-comp-control__input:disabled {
  cursor: not-allowed;
  color: #a89bb8;
}

.vr-comp-control__input::-webkit-outer-spin-button,
.vr-comp-control__input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.vr-comp-control__input[type='number'] {
  appearance: textfield;
  -moz-appearance: textfield;
}

.vr-comp-control__max {
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 450;
  color: #9b8fad;
  white-space: nowrap;
}

.vr-comp-control--disabled .vr-comp-control__max {
  color: #bbb;
}

.vr-comp-control__slider {
  padding: 0 14px 14px;
  margin: 0;
  border-top: none;
  background: #fff;
}

.vr-comp-control__slider :deep(.slider-target),
.vr-comp-control__slider :deep(.slider-base) {
  margin-top: 0;
}

/* Slider: maketdagi track qalinligi / rang — root da var */
.vr-comp-control__vueform {
  display: block;
  width: 100%;
  --slider-bg: #e4e1ec;
  --slider-connect-bg: #3d2c55;
  --slider-height: 10px;
  --slider-radius: 9999px;
  --slider-handle-bg: #3d2c55;
  --slider-handle-border: 2px solid #f2f0f7;
  --slider-handle-width: 22px;
  --slider-handle-height: 22px;
  --slider-handle-shadow: 0 0 0 1px rgba(61, 44, 85, 0.1), 0 2px 6px rgba(61, 44, 85, 0.18);
}

.vr-stat-sub {
  font-size: 11.5px;
  color: #aaa;
  line-height: 1.3;
}

.vr-form-footer-actions {
  margin-top: 20px;
  padding-top: 18px;
  border-top: 1px solid #f0f0f0;
}

.vr-submit--form-end {
  width: 100%;
  max-width: 280px;
  justify-content: center;
}

@media (min-width: 901px) {
  .vr-submit--form-end {
    display: none;
  }
}

.vr-manager-body {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  position: relative;
}

.vr-manager-avatar {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: linear-gradient(135deg, #e8ecf5, #f2f0fa);
  color: #4a5568;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.vr-manager-text {
  flex: 1;
  min-width: 0;
}

.vr-manager-name {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
}

.vr-manager-role {
  font-size: 12.5px;
  color: #666;
  margin-top: 2px;
}

.vr-manager-meta {
  font-size: 11.5px;
  color: #999;
  margin-top: 4px;
}

.vr-manager-hint {
  margin: 12px 0 0;
  font-size: 12px;
  color: #888;
  line-height: 1.4;
}

.vr-submit {
  width: 100%;
  justify-content: center;
  margin-top: 20px;
}

.form-row {
  display: flex;
  gap: 12px;
}

.form-calc {
  padding: 8px 0 8px 12px;
  border-left: 3px solid #c5d4eb;
  font-size: 12.5px;
  color: #444;
}

.calc-days {
  font-weight: 500;
  color: #222;
}

.calc-sep {
  color: #ccc;
}

.calc-remaining {
  color: #4caf7d;
}

.calc-remaining.negative {
  color: #e05a5a;
}

.form-error {
  margin-top: 18px;
  font-size: 12.5px;
  color: #e05a5a;
  padding: 10px 12px;
  border-left: 3px solid #e8a0a0;
  background: #fff8f8;
  border-radius: 0 7px 7px 0;
}
</style>
