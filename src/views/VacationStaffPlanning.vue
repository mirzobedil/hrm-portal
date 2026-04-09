<script setup>
import { ref, computed, watch, inject } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronLeft, ChevronRight, Info } from 'lucide-vue-next'
import { UiButton, UiIconButton } from '@/components/ui'
import { STATUS_LABELS as statusLabel, VACATION_PLANNING_BLOCKING_STATUSES } from '@/constants/vacation'
import { EMPLOYEE_DATA } from '@/data/vacationRequests'
import { useVacationRequests } from '@/composables/useVacationRequests'
import { vacationPlanFlash } from '@/composables/useVacationPlanFlash'

const router = useRouter()
const sessionUser = inject('sessionUser')
const { allRequests } = useVacationRequests()

const currentUser = computed(() => ({ name: sessionUser.value.name }))

const balance = computed(() => {
  const b = EMPLOYEE_DATA[sessionUser.value.name]?.balance
  return b ? { total: b.total, used: b.used } : { total: 28, used: 0 }
})

/** Черновик ежегодного плана (planned) — только для подписи в интерфейсе */
const draftAnnualPlannedDays = computed(() =>
  allRequests.value
    .filter(r => r.employee === currentUser.value.name && r.status === 'planned' && r.type === 'Ежегодный')
    .reduce((sum, r) => sum + r.days, 0),
)

/**
 * Годовой план задаётся один раз на положенные дни ежегодного отпуска (не «остаток»).
 */
const planningDays = computed(() => Math.max(0, balance.value.total))

const calYear = ref(new Date().getFullYear())

const yearStart = computed(() => `${calYear.value}-01-01`)
const yearEnd = computed(() => `${calYear.value}-12-31`)

/** Заявки, которые реально блокируют выбор периода (не planned / не rejected) */
const overlapBlocks = computed(() =>
  allRequests.value.filter(
    r =>
      r.employee === currentUser.value.name &&
      VACATION_PLANNING_BLOCKING_STATUSES.includes(r.status) &&
      r.from <= yearEnd.value &&
      r.to >= yearStart.value,
  ),
)

const myBlocks = computed(() =>
  allRequests.value.filter(
    r =>
      r.employee === currentUser.value.name &&
      r.status !== 'rejected' &&
      r.from <= yearEnd.value &&
      r.to >= yearStart.value,
  ),
)

const MONTHS_RU = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
]
const DAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

const yearMonths = computed(() =>
  Array.from({ length: 12 }, (_, m) => {
    const total = new Date(calYear.value, m + 1, 0).getDate()
    let dow = new Date(calYear.value, m, 1).getDay()
    dow = dow === 0 ? 6 : dow - 1
    const cells = []
    for (let i = 0; i < dow; i++) cells.push(null)
    for (let d = 1; d <= total; d++) {
      cells.push(`${calYear.value}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
    }
    return { title: MONTHS_RU[m], cells }
  }),
)

function prevYear() {
  calYear.value--
}
function nextYear() {
  calYear.value++
}

function fmtDate(iso) {
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}

function hasOverlap(a1, a2, b1, b2) {
  return a1 <= b2 && a2 >= b1
}

function addCalendarDays(iso, delta) {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1, d + delta)
  const pad = n => String(n).padStart(2, '0')
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`
}

function isWeekend(dateStr) {
  if (!dateStr) return false
  const day = new Date(dateStr).getDay()
  return day === 0 || day === 6
}

function getPageDayMark(dateStr) {
  if (!dateStr) return null
  for (const r of myBlocks.value) {
    if (dateStr >= r.from && dateStr <= r.to) return r.status
  }
  return null
}

/** n ketma-ket kalendar kuni: start dan boshlab overlap yo‘qmi */
function canStartRangeAt(startIso, n) {
  if (n < 1) return false
  const endIso = addCalendarDays(startIso, n - 1)
  if (endIso > yearEnd.value || startIso < yearStart.value) return false
  return !overlapBlocks.value.some(b => hasOverlap(startIso, endIso, b.from, b.to))
}

const selectedRange = ref(null)

watch(calYear, () => {
  selectedRange.value = null
})

function isInSelectedRange(iso) {
  if (!selectedRange.value || !iso) return false
  return iso >= selectedRange.value.from && iso <= selectedRange.value.to
}

function onCellClick(cell) {
  if (!cell || planningDays.value < 1) return
  if (!canStartRangeAt(cell, planningDays.value)) return
  const n = planningDays.value
  selectedRange.value = {
    from: cell,
    to: addCalendarDays(cell, n - 1),
  }
}

function clearSelection() {
  selectedRange.value = null
}

function cellClasses(cell) {
  if (!cell) return []
  const n = planningDays.value
  const inRange = !!(selectedRange.value && isInSelectedRange(cell))
  const canStart = n >= 1 && canStartRangeAt(cell, n)
  const list = []
  if (inRange) list.push('vsp-cell--picked')
  if (!canStart || n < 1) list.push('vsp-cell--disabled')
  else list.push('vsp-cell--go')
  if (isWeekend(cell)) list.push('vsp-cell--weekend')
  const mk = getPageDayMark(cell)
  if (mk && !inRange) list.push('vsp-mark', `mark-${mk}`)
  return list
}

function cellDisabled(cell) {
  if (!cell) return true
  if (planningDays.value < 1) return true
  return !canStartRangeAt(cell, planningDays.value)
}

function cellTabindex(cell) {
  if (!cell || planningDays.value < 1) return -1
  return canStartRangeAt(cell, planningDays.value) ? 0 : -1
}

function cellTitle(cell) {
  if (!cell) return ''
  const mk = getPageDayMark(cell)
  const base = mk ? `${statusLabel[mk] ?? mk} · ` : ''
  return `${base}${fmtDate(cell)}`
}

const saveError = ref('')

function savePlan() {
  saveError.value = ''
  if (!selectedRange.value) {
    saveError.value = 'Выберите дату начала в календаре'
    return
  }
  const { from, to } = selectedRange.value
  const days = planningDays.value
  if (!canStartRangeAt(from, days)) {
    saveError.value = 'Период больше недоступен — сбросьте и выберите снова'
    return
  }
  const y = from.slice(0, 4)
  const ys = `${y}-01-01`
  const ye = `${y}-12-31`
  allRequests.value = allRequests.value.filter(r => {
    if (r.employee !== currentUser.value.name || r.type !== 'Ежегодный' || r.status !== 'planned') return true
    return !(r.from <= ye && r.to >= ys)
  })
  allRequests.value.push({
    id: Date.now(),
    employee: currentUser.value.name,
    from,
    to,
    days,
    type: 'Ежегодный',
    status: 'planned',
  })
  vacationPlanFlash.value = { from, to }
  router.push({ name: 'vacations' })
}
</script>

<template>
  <div class="vsp-page">
    <RouterLink :to="{ name: 'vacations' }" class="vsp-back">
      <ChevronLeft :size="16" stroke-width="2" />
      К отпускам
    </RouterLink>

    <template v-if="planningDays >= 1">
      <p class="vsp-lead">
        Нажмите день начала — подсветится период на {{ planningDays }}&nbsp;{{ planningDays === 1 ? 'день' : planningDays < 5 ? 'дня' : 'дней' }}.
        Другой доступный день — новый период.
      </p>

      <div class="vsp-stat">
        <span class="vsp-stat-num">{{ planningDays }}</span>
        <span class="vsp-stat-meta">
          положено ежегодно · использовано {{ balance.used }} из {{ balance.total }}
          <template v-if="draftAnnualPlannedDays > 0"> · черновик в плане {{ draftAnnualPlannedDays }} дн.</template>
        </span>
      </div>
    </template>

    <div v-if="planningDays < 1" class="vsp-empty" role="status">
      <Info :size="16" stroke-width="1.75" class="vsp-empty-ic" aria-hidden="true" />
      <p>Нет доступных дней для плана.</p>
      <UiButton variant="secondary" type="button" @click="router.push({ name: 'vacations' })">
        К отпускам
      </UiButton>
    </div>

    <template v-else>
      <div class="vsp-toolbar">
        <div class="vsp-cal-nav">
          <UiIconButton type="button" size="nav" aria-label="Предыдущий год" @click="prevYear">
            <ChevronLeft :size="14" stroke-width="2" />
          </UiIconButton>
          <span class="vsp-year-label">{{ calYear }}</span>
          <UiIconButton type="button" size="nav" aria-label="Следующий год" @click="nextYear">
            <ChevronRight :size="14" stroke-width="2" />
          </UiIconButton>
        </div>

        <div class="vsp-toolbar-right">
          <div v-if="selectedRange" class="vsp-summary">
            <span class="vsp-sum-dates">{{ fmtDate(selectedRange.from) }} — {{ fmtDate(selectedRange.to) }}</span>
            <span class="vsp-sum-days">{{ planningDays }} дн.</span>
          </div>
          <div v-else class="vsp-summary vsp-summary--placeholder">Выберите дату в календаре</div>

          <p v-if="saveError" class="vsp-error">{{ saveError }}</p>

          <div class="vsp-actions">
            <UiButton variant="secondary" type="button" :disabled="!selectedRange" @click="clearSelection">
              Сбросить
            </UiButton>
            <UiButton variant="primary" type="button" :disabled="!selectedRange" @click="savePlan">
              В план
            </UiButton>
          </div>
        </div>
      </div>

      <div class="vsp-months">
        <div v-for="mo in yearMonths" :key="mo.title" class="vsp-month">
          <div class="vsp-mo-title">{{ mo.title }}</div>
          <div class="vsp-grid">
            <div v-for="d in DAYS_SHORT" :key="d" class="vsp-dow">{{ d }}</div>
            <template v-for="(cell, i) in mo.cells" :key="`${mo.title}-${i}`">
              <div v-if="!cell" class="vsp-cell vsp-cell--empty" />
              <button
                v-else
                type="button"
                class="vsp-cell"
                :class="cellClasses(cell)"
                :disabled="cellDisabled(cell)"
                :tabindex="cellTabindex(cell)"
                :title="cellTitle(cell)"
                @click="onCellClick(cell)"
              >
                <span class="vsp-day">{{ Number(cell.split('-')[2]) }}</span>
              </button>
            </template>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.vsp-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
  max-width: min(1040px, 100%);
}

.vsp-back {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #888;
  text-decoration: none;
  width: fit-content;
}
.vsp-back:hover {
  color: #333;
}

.vsp-lead {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: #777;
  max-width: 52em;
}

.vsp-stat {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px 12px;
  padding-bottom: 4px;
  border-bottom: 1px solid #e8e8e8;
}
.vsp-stat-num {
  font-size: 28px;
  font-weight: 600;
  letter-spacing: -0.03em;
  color: #1a1a1a;
  line-height: 1;
}
.vsp-stat-meta {
  font-size: 12px;
  color: #999;
}

.vsp-empty {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  color: #666;
  font-size: 13px;
  line-height: 1.5;
}
.vsp-empty-ic {
  color: #bbb;
  flex-shrink: 0;
}

.vsp-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px 24px;
  padding: 4px 0 12px;
  border-bottom: 1px solid #e8e8e8;
}

.vsp-cal-nav {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.vsp-year-label {
  font-size: 15px;
  font-weight: 500;
  color: #1a1a1a;
  min-width: 48px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.vsp-toolbar-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  min-width: 0;
  flex: 1;
}

.vsp-summary {
  font-size: 13px;
  color: #333;
  text-align: right;
  line-height: 1.35;
}
.vsp-summary--placeholder {
  color: #aaa;
  font-weight: 400;
}
.vsp-sum-dates {
  font-weight: 500;
}
.vsp-sum-days {
  margin-left: 6px;
  color: #888;
  font-size: 12px;
}

.vsp-error {
  margin: 0;
  font-size: 12px;
  color: #c62828;
  text-align: right;
}

.vsp-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.vsp-months {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px 20px;
  padding-top: 4px;
}
@media (max-width: 900px) {
  .vsp-months {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .vsp-toolbar-right {
    align-items: flex-start;
  }
  .vsp-summary,
  .vsp-error {
    text-align: left;
  }
  .vsp-actions {
    justify-content: flex-start;
  }
}
@media (max-width: 480px) {
  .vsp-months {
    grid-template-columns: 1fr;
  }
}

.vsp-mo-title {
  font-size: 11px;
  font-weight: 500;
  color: #999;
  margin-bottom: 6px;
  text-align: left;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.vsp-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
}
.vsp-dow {
  text-align: center;
  font-size: 9px;
  color: #c8c8c8;
  font-weight: 500;
  padding: 0 0 3px;
  letter-spacing: -0.02em;
}

.vsp-cell {
  aspect-ratio: 1;
  min-height: 0;
  border-radius: 2px;
  border: none;
  padding: 0;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-family: inherit;
  background: transparent;
  transition: background 0.1s, color 0.1s, opacity 0.1s;
}
.vsp-cell--empty {
  visibility: hidden;
  pointer-events: none;
}
.vsp-cell--go {
  color: #444;
}
.vsp-cell--go:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.05);
}
.vsp-cell--disabled {
  opacity: 0.22;
  cursor: not-allowed;
  pointer-events: none;
  color: #999;
}
.vsp-cell--picked {
  background: rgba(0, 0, 0, 0.08);
  color: #111;
  font-weight: 600;
}
.vsp-cell--picked.vsp-cell--disabled {
  opacity: 0.42;
  cursor: not-allowed;
}
.vsp-cell--picked.vsp-cell--go {
  cursor: pointer;
}
.vsp-cell--weekend:not(.vsp-cell--picked):not(.vsp-mark) .vsp-day {
  color: #b0b0b0;
}
.vsp-cell--picked.vsp-cell--weekend .vsp-day {
  color: #111;
}

.vsp-mark.mark-planned {
  background: rgba(91, 142, 240, 0.12);
}
.vsp-mark.mark-planned .vsp-day {
  color: #4a7fd4;
  font-weight: 500;
}
.vsp-mark.mark-approved,
.vsp-mark.mark-confirmed {
  background: rgba(76, 175, 125, 0.1);
}
.vsp-mark.mark-approved .vsp-day,
.vsp-mark.mark-confirmed .vsp-day {
  color: #3d9a6a;
  font-weight: 500;
}
.vsp-mark.mark-pending,
.vsp-mark.mark-pending_manager,
.vsp-mark.mark-approved_by_manager {
  background: rgba(0, 0, 0, 0.04);
}
.vsp-mark.mark-pending_manager .vsp-day {
  color: #666;
  font-weight: 500;
}

.vsp-day {
  font-size: 11px;
  user-select: none;
  line-height: 1;
}
</style>
