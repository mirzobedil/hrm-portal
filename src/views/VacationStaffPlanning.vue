<script setup>
import { ref, computed, watch, inject } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronLeft, ChevronRight, Info, X, Check, Plus, RotateCcw, AlertTriangle } from 'lucide-vue-next'
import { UiButton, UiIconButton } from '@/components/ui'
import { STATUS_LABELS as statusLabel, VACATION_PLANNING_BLOCKING_STATUSES } from '@/constants/vacation'
import { EMPLOYEE_DATA } from '@/data/vacationRequests'
import { useVacationRequests } from '@/composables/useVacationRequests'
import { vacationPlanFlash } from '@/composables/useVacationPlanFlash'

/** Минимальная длительность календарного периода для хотя бы одной из частей плана (не обязательно первой). */
const ONE_PART_MIN_CALENDAR_DAYS = 14
const SEGMENT_COLORS = ['#5b8ef0', '#7c5cc4', '#e8a020', '#4caf7d', '#e05a5a', '#2e9dc8']

const router = useRouter()
const sessionUser = inject('sessionUser')
const { allRequests } = useVacationRequests()

const currentUser = computed(() => ({ name: sessionUser.value.name }))

const balance = computed(() => {
  const b = EMPLOYEE_DATA[sessionUser.value.name]?.balance
  return b ? { total: b.total, used: b.used } : { total: 28, used: 0 }
})

const totalAnnualDays = computed(() => Math.max(0, balance.value.total))

const calYear = ref(new Date().getFullYear())
const yearStart = computed(() => `${calYear.value}-01-01`)
const yearEnd = computed(() => `${calYear.value}-12-31`)

const overlapBlocks = computed(() =>
  allRequests.value.filter(
    r =>
      r.employee === currentUser.value.name &&
      VACATION_PLANNING_BLOCKING_STATUSES.includes(r.status) &&
      r.from <= yearEnd.value &&
      r.to >= yearStart.value &&
      !(r.status === 'planned' && r.type === 'Ежегодный' && r.from.slice(0, 4) === String(calYear.value)),
  ),
)

const myBlocksForMark = computed(() =>
  allRequests.value.filter(
    r =>
      r.employee === currentUser.value.name &&
      r.status !== 'rejected' &&
      r.from <= yearEnd.value &&
      r.to >= yearStart.value &&
      !(r.status === 'planned' && r.type === 'Ежегодный' && r.from.slice(0, 4) === String(calYear.value)),
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

function prevYear() { calYear.value-- }
function nextYear() { calYear.value++ }

function fmtDate(iso) {
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}
function fmtDateShort(iso) {
  const [, m, d] = iso.split('-')
  return `${d}.${m}`
}
function hasOverlap(a1, a2, b1, b2) { return a1 <= b2 && a2 >= b1 }
function inclusiveCalendarDays(fromIso, toIso) {
  const t0 = new Date(fromIso)
  const t1 = new Date(toIso)
  return Math.round((t1 - t0) / 86400000) + 1
}
function isWeekend(dateStr) {
  if (!dateStr) return false
  const day = new Date(dateStr).getDay()
  return day === 0 || day === 6
}

// ── Segments (draft) ──────────────────────────────────────────────────────
const segments = ref([])
const rangeAnchor = ref(null)
const hoverCell = ref(null)
const saveError = ref('')

function syncSegmentsFromStore() {
  const y = String(calYear.value)
  segments.value = allRequests.value
    .filter(r => r.employee === currentUser.value.name && r.type === 'Ежегодный' && r.status === 'planned' && r.from.startsWith(y))
    .sort((a, b) => a.from.localeCompare(b.from))
    .map(r => ({ from: r.from, to: r.to, days: r.days }))
}

watch(calYear, () => { syncSegmentsFromStore(); rangeAnchor.value = null; hoverCell.value = null; saveError.value = '' }, { immediate: true })

const allocatedDays = computed(() => segments.value.reduce((s, seg) => s + seg.days, 0))
const remainingDays = computed(() => Math.max(0, totalAnnualDays.value - allocatedDays.value))
const hasLongSegment = computed(() => segments.value.some(s => s.days >= ONE_PART_MIN_CALENDAR_DAYS))

/** Уже добавлены части, но ни одна не ≥14 дн., и дальше правило выполнить нельзя (мало остатка или всё разложено «короткими» кусками). */
const longPartPlanStuck = computed(() => {
  if (hasLongSegment.value) return false
  if (allocatedDays.value === 0) return false
  if (remainingDays.value === 0) return true
  return remainingDays.value < ONE_PART_MIN_CALENDAR_DAYS
})

/** Пока нет части ≥14 дн.: нельзя выбрать короткий период так, что после него останется меньше 14 дн. на будущую основную часть (кроме случая, когда текущий выбор сам ≥14 дн.). */
function canSatisfyLongPartAfterAddingDays(d) {
  if (hasLongSegment.value) return true
  if (d >= ONE_PART_MIN_CALENDAR_DAYS) return true
  const rem = remainingDays.value - d
  return rem >= ONE_PART_MIN_CALENDAR_DAYS
}

function validateInclusiveRange(from, to) {
  if (from > to || from < yearStart.value || to > yearEnd.value) return { ok: false, reason: 'bounds' }
  const d = inclusiveCalendarDays(from, to)
  if (d < 1) return { ok: false, reason: 'bounds' }
  if (d > remainingDays.value) return { ok: false, reason: 'overflow' }
  const blocking = [...overlapBlocks.value, ...segmentBlockList()]
  if (rangeOverlapsAnyBlock(from, to, blocking)) return { ok: false, reason: 'overlap' }
  if (!canSatisfyLongPartAfterAddingDays(d)) return { ok: false, reason: 'longPart' }
  return { ok: true, reason: null }
}

function segColor(i) { return SEGMENT_COLORS[i % SEGMENT_COLORS.length] }

function segmentBlockList() { return segments.value.map(s => ({ from: s.from, to: s.to })) }
function rangeOverlapsAnyBlock(from, to, blocks) { return blocks.some(b => hasOverlap(from, to, b.from, b.to)) }

function isCellOccupiedByBlocks(cell) {
  return overlapBlocks.value.some(b => cell >= b.from && cell <= b.to) ||
    segments.value.some(s => cell >= s.from && cell <= s.to)
}

function canAddInclusiveRange(from, to) {
  return validateInclusiveRange(from, to).ok
}

/** Preview range while hovering (anchor already set). */
const previewRange = computed(() => {
  if (!rangeAnchor.value || !hoverCell.value) return null
  const a = rangeAnchor.value
  const b = hoverCell.value
  const from = a <= b ? a : b
  const to = a <= b ? b : a
  if (from < yearStart.value || to > yearEnd.value) return null
  const d = inclusiveCalendarDays(from, to)
  const v = validateInclusiveRange(from, to)
  return { from, to, days: d, valid: v.ok, invalidReason: v.reason }
})

function onCellClick(cell) {
  saveError.value = ''
  if (!cell || totalAnnualDays.value < ONE_PART_MIN_CALENDAR_DAYS) return

  if (!rangeAnchor.value) {
    if (isCellOccupiedByBlocks(cell)) return
    rangeAnchor.value = cell
    return
  }

  const from = rangeAnchor.value <= cell ? rangeAnchor.value : cell
  const to = rangeAnchor.value <= cell ? cell : rangeAnchor.value
  rangeAnchor.value = null
  hoverCell.value = null

  const addCheck = validateInclusiveRange(from, to)
  if (!addCheck.ok) {
    const v = addCheck
    if (v.reason === 'overlap') saveError.value = 'Период пересекается с другой частью или заявкой.'
    else if (v.reason === 'overflow') saveError.value = `Не хватает дней (осталось ${remainingDays.value}).`
    else if (v.reason === 'longPart') {
      saveError.value =
        `После этой части для основного отпуска (≥${ONE_PART_MIN_CALENDAR_DAYS} дн.) не останется достаточно дней. ` +
        'Сократите период или удалите часть и перераспределите.'
    }
    else saveError.value = 'Нельзя добавить такой период.'
    return
  }
  segments.value = [...segments.value, { from, to, days: inclusiveCalendarDays(from, to) }]
}

function onCellHover(cell) { hoverCell.value = cell }
function onCalendarLeave() { hoverCell.value = null }

function removeSegment(index) { segments.value = segments.value.filter((_, i) => i !== index); rangeAnchor.value = null; saveError.value = '' }
function cancelAnchor() { rangeAnchor.value = null; hoverCell.value = null; saveError.value = '' }
function resetDraft() { segments.value = []; rangeAnchor.value = null; hoverCell.value = null; saveError.value = '' }

function getPageDayMark(dateStr) {
  if (!dateStr) return null
  for (const r of myBlocksForMark.value) {
    if (dateStr >= r.from && dateStr <= r.to) return r.status
  }
  return null
}

function segmentIndexForCell(cell) {
  if (!cell) return -1
  return segments.value.findIndex(s => cell >= s.from && cell <= s.to)
}

function cellClasses(cell) {
  if (!cell) return []
  const list = []
  const segIdx = segmentIndexForCell(cell)
  const inSeg = segIdx >= 0

  if (inSeg) list.push('vsp-cell--seg')
  if (rangeAnchor.value === cell) list.push('vsp-cell--anchor')
  if (isWeekend(cell)) list.push('vsp-cell--weekend')

  const pr = previewRange.value
  if (pr && cell >= pr.from && cell <= pr.to && !inSeg) {
    list.push(pr.valid ? 'vsp-cell--preview' : 'vsp-cell--preview-bad')
  }

  if (!inSeg && !rangeAnchor.value && isCellOccupiedByBlocks(cell)) {
    const mk = getPageDayMark(cell)
    if (mk) list.push('vsp-mark', `mark-${mk}`)
    else list.push('vsp-cell--blocked')
  }

  return list
}

function cellStyle(cell) {
  if (!cell) return null
  const segIdx = segmentIndexForCell(cell)
  if (segIdx >= 0) return { '--seg-color': segColor(segIdx) }
  return null
}

function cellDisabled(cell) {
  if (!cell || totalAnnualDays.value < ONE_PART_MIN_CALENDAR_DAYS) return true
  if (remainingDays.value === 0 && !rangeAnchor.value && segmentIndexForCell(cell) < 0) return true
  return false
}

function cellTabindex(cell) {
  return cellDisabled(cell) ? -1 : 0
}

function cellTitle(cell) {
  if (!cell) return ''
  const mk = getPageDayMark(cell)
  const base = mk ? `${statusLabel[mk] ?? mk} · ` : ''
  return `${base}${fmtDate(cell)}`
}

function savePlan() {
  saveError.value = ''
  if (segments.value.length === 0) { saveError.value = 'Добавьте хотя бы одну часть.'; return }
  if (longPartPlanStuck.value) {
    saveError.value =
      remainingDays.value === 0
        ? `Ни одна часть не длится ≥${ONE_PART_MIN_CALENDAR_DAYS} дн. Удалите части и перераспределите.`
        : `Осталось ${remainingDays.value} дн. — этого мало, чтобы выделить часть ≥${ONE_PART_MIN_CALENDAR_DAYS} дн. Удалите или измените части.`
    return
  }
  if (remainingDays.value !== 0) { saveError.value = `Осталось ${remainingDays.value} нераспределённых дней.`; return }
  if (!hasLongSegment.value) { saveError.value = `Хотя бы одна часть должна быть не менее ${ONE_PART_MIN_CALENDAR_DAYS} дней.`; return }

  const y = String(calYear.value)
  allRequests.value = allRequests.value.filter(r => {
    if (r.employee !== currentUser.value.name || r.type !== 'Ежегодный' || r.status !== 'planned') return true
    return !(r.from <= `${y}-12-31` && r.to >= `${y}-01-01`)
  })
  let baseId = Date.now()
  for (const seg of segments.value) {
    allRequests.value.push({ id: baseId++, employee: currentUser.value.name, from: seg.from, to: seg.to, days: seg.days, type: 'Ежегодный', status: 'planned' })
  }
  vacationPlanFlash.value = { from: segments.value[0].from, to: segments.value[segments.value.length - 1].to }
  router.push({ name: 'vacations' })
}
</script>

<template>
  <div class="vsp">
    <RouterLink :to="{ name: 'vacations' }" class="vsp-back">
      <ChevronLeft :size="16" stroke-width="2" />
      К отпускам
    </RouterLink>

    <!-- Not enough days -->
    <div v-if="totalAnnualDays < ONE_PART_MIN_CALENDAR_DAYS" class="vsp-empty-card" role="status">
      <Info :size="18" stroke-width="1.75" class="vsp-empty-ic" />
      <p v-if="totalAnnualDays < 1">Нет доступных дней для планирования.</p>
      <p v-else>
        Недостаточно дней: хотя бы одна из частей ежегодного отпуска — не менее {{ ONE_PART_MIN_CALENDAR_DAYS }} календарных дней.
      </p>
      <UiButton variant="secondary" type="button" @click="router.push({ name: 'vacations' })">К отпускам</UiButton>
    </div>

    <template v-else>
      <div class="vsp-info-alert">
        <Info :size="15" stroke-width="1.75" class="vsp-info-alert-ic" />
        <div class="vsp-info-alert-body">
          <span class="vsp-info-alert-title">Планирование ежегодного отпуска · {{ totalAnnualDays }} дней</span>
          <span class="vsp-info-alert-text">
            Разделите отпуск на части и расставьте в календаре.
            Хотя бы одна из частей — не менее <strong>{{ ONE_PART_MIN_CALENDAR_DAYS }}</strong> календарных дней, остальные — любого размера.
          </span>
        </div>
      </div>

      <!-- ── Two-column layout ─────────────────────────────────────────── -->
      <div class="vsp-layout">

        <!-- LEFT: calendar -->
        <div class="vsp-cal-area">
          <div class="vsp-cal-head">
            <UiIconButton type="button" size="nav" aria-label="Предыдущий год" @click="prevYear">
              <ChevronLeft :size="14" stroke-width="2" />
            </UiIconButton>
            <span class="vsp-year">{{ calYear }}</span>
            <UiIconButton type="button" size="nav" aria-label="Следующий год" @click="nextYear">
              <ChevronRight :size="14" stroke-width="2" />
            </UiIconButton>
          </div>

          <div class="vsp-months" @mouseleave="onCalendarLeave">
            <div v-for="mo in yearMonths" :key="mo.title" class="vsp-month">
              <div class="vsp-mo-title">{{ mo.title }}</div>
              <div class="vsp-grid">
                <div v-for="d in DAYS_SHORT" :key="d" class="vsp-dow">{{ d }}</div>
                <template v-for="(cell, ci) in mo.cells" :key="`${mo.title}-${ci}`">
                  <div v-if="!cell" class="vsp-cell vsp-cell--empty" />
                  <button
                    v-else
                    type="button"
                    class="vsp-cell"
                    :class="cellClasses(cell)"
                    :style="cellStyle(cell)"
                    :disabled="cellDisabled(cell)"
                    :tabindex="cellTabindex(cell)"
                    :title="cellTitle(cell)"
                    @click="onCellClick(cell)"
                    @mouseenter="onCellHover(cell)"
                  >
                    <span class="vsp-day">{{ Number(cell.split('-')[2]) }}</span>
                  </button>
                </template>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT: sidebar -->
        <div class="vsp-sidebar">
          <!-- Progress card -->
          <div class="vsp-progress-card" :class="{ 'vsp-progress-card--stuck': longPartPlanStuck }">
            <div class="vsp-progress-title">Распределение дней</div>
            <div class="vsp-progress-bar-wrap">
              <div class="vsp-progress-bar" :class="{ 'vsp-progress-bar--stuck': longPartPlanStuck }">
                <div
                  v-for="(seg, i) in segments"
                  :key="`bar-${i}`"
                  class="vsp-bar-seg"
                  :style="{ width: `${(seg.days / totalAnnualDays) * 100}%`, background: segColor(i) }"
                  :title="`Часть ${i + 1}: ${seg.days} дн.`"
                />
              </div>
              <div class="vsp-progress-labels">
                <span>{{ allocatedDays }} из {{ totalAnnualDays }}</span>
                <span v-if="longPartPlanStuck" class="vsp-progress-stuck">
                  <template v-if="remainingDays === 0">Все дни распределены без части ≥{{ ONE_PART_MIN_CALENDAR_DAYS }} дн.</template>
                  <template v-else>Осталось {{ remainingDays }} дн. — мало для части ≥{{ ONE_PART_MIN_CALENDAR_DAYS }} дн.</template>
                </span>
                <span v-else-if="remainingDays > 0" class="vsp-progress-remaining">осталось {{ remainingDays }}</span>
                <span v-else class="vsp-progress-done">готово</span>
              </div>
            </div>
            <div class="vsp-progress-rule">
              <Info :size="12" stroke-width="2" />
              Хотя бы одна часть — не менее {{ ONE_PART_MIN_CALENDAR_DAYS }} календарных дней
            </div>
          </div>

          <!-- Status hint -->
          <div
            class="vsp-hint"
            :class="{
              'vsp-hint--active': rangeAnchor,
              'vsp-hint--stuck': longPartPlanStuck && !rangeAnchor,
            }"
          >
            <template v-if="rangeAnchor">
              <span class="vsp-hint-dot vsp-hint-dot--pulse" />
              <span>Выберите последний день</span>
              <button type="button" class="vsp-hint-cancel" @click="cancelAnchor">Отменить</button>
            </template>
            <template v-else-if="longPartPlanStuck">
              <AlertTriangle :size="13" stroke-width="2" class="vsp-hint-ic vsp-hint-ic--stuck" />
              <span>
                Нужна часть не короче {{ ONE_PART_MIN_CALENDAR_DAYS }} дн. Сократите период в календаре или удалите часть справа.
              </span>
            </template>
            <template v-else-if="remainingDays > 0">
              <Plus :size="13" stroke-width="2" class="vsp-hint-ic" />
              <span>{{ segments.length === 0 ? 'Нажмите первый день в календаре' : 'Добавьте следующую часть' }}</span>
            </template>
            <template v-else>
              <Check :size="13" stroke-width="2" class="vsp-hint-ic vsp-hint-ic--done" />
              <span>Все дни распределены</span>
            </template>
          </div>

          <!-- Preview of current selection -->
          <Transition name="preview-fade">
            <div v-if="previewRange" class="vsp-preview" :class="{ 'vsp-preview--bad': !previewRange.valid }">
              <span class="vsp-preview-dates">{{ fmtDateShort(previewRange.from) }} — {{ fmtDateShort(previewRange.to) }}</span>
              <span class="vsp-preview-days">{{ previewRange.days }} дн.</span>
              <span v-if="!previewRange.valid" class="vsp-preview-warn">
                {{
                  previewRange.invalidReason === 'overflow'
                    ? 'превышает остаток'
                    : previewRange.invalidReason === 'overlap'
                      ? 'пересечение'
                      : previewRange.invalidReason === 'longPart'
                        ? `мало дней на часть ≥${ONE_PART_MIN_CALENDAR_DAYS}`
                        : 'недоступно'
                }}
              </span>
            </div>
          </Transition>

          <!-- Parts list -->
          <div class="vsp-parts-list">
            <TransitionGroup name="part-list">
              <div
                v-for="(seg, i) in segments"
                :key="`${seg.from}-${seg.to}`"
                class="vsp-part"
              >
                <div class="vsp-part-dot" :style="{ background: segColor(i) }" />
                <div class="vsp-part-body">
                  <div class="vsp-part-head">
                    <span class="vsp-part-name">Часть {{ i + 1 }}</span>
                    <span v-if="seg.days >= ONE_PART_MIN_CALENDAR_DAYS" class="vsp-part-badge">основная</span>
                  </div>
                  <div class="vsp-part-meta">
                    {{ fmtDate(seg.from) }} — {{ fmtDate(seg.to) }} · {{ seg.days }} дн.
                  </div>
                </div>
                <button type="button" class="vsp-part-rm" :title="`Удалить часть ${i + 1}`" @click="removeSegment(i)">
                  <X :size="14" stroke-width="2" />
                </button>
              </div>
            </TransitionGroup>
            <div v-if="segments.length === 0" class="vsp-parts-empty">
              Частей пока нет — выберите период в календаре
            </div>
          </div>

          <!-- Error -->
          <Transition name="preview-fade">
            <div v-if="saveError" class="vsp-error">{{ saveError }}</div>
          </Transition>

          <!-- Actions -->
          <div class="vsp-actions">
            <UiButton
              variant="secondary"
              type="button"
              :disabled="segments.length === 0 && !rangeAnchor"
              @click="resetDraft"
            >
              <RotateCcw :size="13" stroke-width="2" />
              Сбросить
            </UiButton>
            <UiButton
              variant="primary"
              type="button"
              :disabled="remainingDays !== 0 || segments.length === 0 || longPartPlanStuck"
              @click="savePlan"
            >
              <Check :size="13" stroke-width="2" />
              Сохранить план
            </UiButton>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.vsp {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.vsp-back {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #888;
  text-decoration: none;
  width: fit-content;
  transition: color 0.12s;
}
.vsp-back:hover { color: #333; }

/* ── Empty state ── */
.vsp-empty-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  padding: 24px;
  border-radius: 12px;
  border: 1px solid #e5e5e5;
  background: #fff;
  color: #555;
  font-size: 13.5px;
  line-height: 1.5;
}
.vsp-empty-card p { margin: 0; }
.vsp-empty-ic { color: #bbb; flex-shrink: 0; }

/* ── Info alert ── */
.vsp-info-alert {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 18px;
  border-radius: 10px;
  background: #f6f8fe;
  border: 1px solid #e2e8f6;
}
.vsp-info-alert-ic {
  color: #7a9ae0;
  flex-shrink: 0;
  margin-top: 1px;
}
.vsp-info-alert-body {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}
.vsp-info-alert-title {
  font-size: 13px;
  font-weight: 600;
  color: #2d4a8f;
}
.vsp-info-alert-text {
  font-size: 12.5px;
  color: #667;
  line-height: 1.5;
}
.vsp-info-alert-text strong {
  font-weight: 700;
  color: #444;
}

/* ── Two-column layout ── */
.vsp-layout {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 24px;
  align-items: start;
}
@media (max-width: 960px) {
  .vsp-layout {
    grid-template-columns: 1fr;
  }
}

/* ── Calendar area ── */
.vsp-cal-area {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}
.vsp-cal-head {
  display: flex;
  align-items: center;
  gap: 10px;
}
.vsp-year {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  min-width: 52px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.vsp-months {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 20px 18px;
}
@media (max-width: 720px) {
  .vsp-months { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 480px) {
  .vsp-months { grid-template-columns: 1fr; }
}

.vsp-mo-title {
  font-size: 11px;
  font-weight: 600;
  color: #888;
  margin-bottom: 6px;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}
.vsp-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}
.vsp-dow {
  text-align: center;
  font-size: 9.5px;
  color: #bbb;
  font-weight: 600;
  padding: 0 0 4px;
}

/* ── Calendar cells ── */
.vsp-cell {
  aspect-ratio: 1;
  min-height: 0;
  border-radius: 4px;
  border: none;
  padding: 0;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-family: inherit;
  background: transparent;
  color: #444;
  transition: background 0.08s, box-shadow 0.08s, color 0.08s;
  position: relative;
}
.vsp-cell:hover:not(:disabled):not(.vsp-cell--seg) {
  background: #f0f2f8;
}
.vsp-cell--empty {
  visibility: hidden;
  pointer-events: none;
}
.vsp-cell:disabled {
  opacity: 0.2;
  cursor: default;
  pointer-events: none;
}
.vsp-cell--weekend:not(.vsp-cell--seg):not(.vsp-cell--preview):not(.vsp-cell--preview-bad) .vsp-day {
  color: #bbb;
}

/* Segment cells — colored by segment index via CSS var */
.vsp-cell--seg {
  background: var(--seg-color, #5b8ef0);
  opacity: 0.25;
  cursor: default;
  pointer-events: none;
}
.vsp-cell--seg .vsp-day {
  color: #fff;
  font-weight: 700;
  mix-blend-mode: normal;
}
/* override disabled look for segments */
button.vsp-cell.vsp-cell--seg:disabled {
  opacity: 0.25;
  pointer-events: none;
}

/* Anchor cell */
.vsp-cell--anchor {
  box-shadow: inset 0 0 0 2px #5b8ef0;
  background: rgba(91, 142, 240, 0.12);
  z-index: 1;
}
.vsp-cell--anchor .vsp-day {
  color: #2d5dc9;
  font-weight: 700;
}

/* Preview range (valid) */
.vsp-cell--preview {
  background: rgba(91, 142, 240, 0.14);
}
.vsp-cell--preview .vsp-day {
  color: #2d5dc9;
  font-weight: 600;
}

/* Preview range (invalid) */
.vsp-cell--preview-bad {
  background: rgba(224, 90, 90, 0.1);
}
.vsp-cell--preview-bad .vsp-day {
  color: #c04040;
  font-weight: 600;
}

/* Blocked (other requests) */
.vsp-cell--blocked {
  pointer-events: none;
  opacity: 0.18;
}

/* Existing request marks */
.vsp-mark.mark-approved,
.vsp-mark.mark-confirmed {
  background: rgba(76, 175, 125, 0.12);
  pointer-events: none;
}
.vsp-mark.mark-approved .vsp-day,
.vsp-mark.mark-confirmed .vsp-day { color: #3d9a6a; font-weight: 600; }
.vsp-mark.mark-pending,
.vsp-mark.mark-pending_manager,
.vsp-mark.mark-approved_by_manager {
  background: rgba(0, 0, 0, 0.04);
  pointer-events: none;
}
.vsp-mark.mark-pending_manager .vsp-day { color: #666; font-weight: 600; }

.vsp-day {
  font-size: 11.5px;
  user-select: none;
  line-height: 1;
  position: relative;
  z-index: 1;
}

/* ── Sidebar ── */
.vsp-sidebar {
  display: flex;
  flex-direction: column;
  gap: 14px;
  position: sticky;
  top: 16px;
}

/* Progress card */
.vsp-progress-card {
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.vsp-progress-title {
  font-size: 13px;
  font-weight: 600;
  color: #1a1a1a;
}
.vsp-progress-bar-wrap {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.vsp-progress-bar {
  height: 10px;
  border-radius: 5px;
  background: #f0f0f0;
  display: flex;
  overflow: hidden;
  gap: 1px;
}
.vsp-bar-seg {
  height: 100%;
  min-width: 3px;
  border-radius: 5px;
  transition: width 0.2s ease;
}
.vsp-progress-labels {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #888;
}
.vsp-progress-remaining { color: #c47a00; font-weight: 500; }
.vsp-progress-done { color: #4caf7d; font-weight: 600; }
.vsp-progress-stuck {
  color: #c45c2d;
  font-weight: 600;
  max-width: 58%;
  text-align: right;
  font-size: 11.5px;
  line-height: 1.35;
}
.vsp-progress-card--stuck {
  border-color: #f0d4c4;
  background: #fffaf7;
}
.vsp-progress-bar--stuck { background: #ffe8dc; }
.vsp-progress-rule {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #aaa;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
}
.vsp-progress-rule svg { color: #ccc; flex-shrink: 0; }

/* Hint */
.vsp-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  background: #f8f9fc;
  font-size: 12.5px;
  color: #888;
  min-height: 38px;
  transition: background 0.15s, color 0.15s;
}
.vsp-hint--active {
  background: #eef3ff;
  color: #3366cc;
}
.vsp-hint--stuck {
  background: #fff4ed;
  color: #8a3d22;
  border: 1px solid #f0d4c4;
}
.vsp-hint-ic--stuck {
  color: #e07030;
  flex-shrink: 0;
}
.vsp-hint-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #5b8ef0;
  flex-shrink: 0;
}
.vsp-hint-dot--pulse {
  animation: pulse-dot 1.2s ease-in-out infinite;
}
@keyframes pulse-dot {
  0%, 100% { box-shadow: 0 0 0 0 rgba(91, 142, 240, 0.5); }
  50% { box-shadow: 0 0 0 5px rgba(91, 142, 240, 0); }
}
.vsp-hint-ic { color: #bbb; flex-shrink: 0; }
.vsp-hint-ic--done { color: #4caf7d; }
.vsp-hint-cancel {
  margin-left: auto;
  padding: 2px 8px;
  border: 1px solid #dde4f8;
  border-radius: 5px;
  background: #fff;
  font-size: 11.5px;
  color: #5b8ef0;
  cursor: pointer;
  transition: background 0.1s;
}
.vsp-hint-cancel:hover { background: #eef3ff; }

/* Preview */
.vsp-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  background: #eef3ff;
  border: 1px solid #d6e4fd;
  font-size: 12.5px;
  color: #2d5dc9;
}
.vsp-preview--bad {
  background: #fef5f5;
  border-color: #fbd5d5;
  color: #c04040;
}
.vsp-preview-dates { font-weight: 600; }
.vsp-preview-days { color: inherit; opacity: 0.7; }
.vsp-preview-warn { margin-left: auto; font-size: 11px; font-weight: 500; }

.preview-fade-enter-active,
.preview-fade-leave-active { transition: opacity 0.12s ease; }
.preview-fade-enter-from,
.preview-fade-leave-to { opacity: 0; }

/* Parts list */
.vsp-parts-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 48px;
}
.vsp-parts-empty {
  font-size: 12px;
  color: #bbb;
  text-align: center;
  padding: 14px 8px;
}
.vsp-part {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 10px 10px 12px;
  background: #fff;
  border: 1px solid #eceef5;
  border-radius: 10px;
  transition: box-shadow 0.12s;
}
.vsp-part:hover {
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}
.vsp-part-dot {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  flex-shrink: 0;
}
.vsp-part-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.vsp-part-head {
  display: flex;
  align-items: center;
  gap: 6px;
}
.vsp-part-name {
  font-size: 12.5px;
  font-weight: 600;
  color: #333;
}
.vsp-part-badge {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #5b8ef0;
  background: #eef3ff;
  padding: 1px 6px;
  border-radius: 4px;
}
.vsp-part-meta {
  font-size: 12px;
  color: #999;
}
.vsp-part-rm {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #ccc;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.12s, color 0.12s;
}
.vsp-part-rm:hover {
  background: #fef5f5;
  color: #c62828;
}

/* Part list transitions */
.part-list-enter-active { transition: all 0.2s ease-out; }
.part-list-leave-active { transition: all 0.15s ease-in; }
.part-list-enter-from { opacity: 0; transform: translateX(12px); }
.part-list-leave-to   { opacity: 0; transform: translateX(-12px); }
.part-list-move { transition: transform 0.2s ease; }

/* Error */
.vsp-error {
  font-size: 12px;
  color: #c62828;
  background: #fef5f5;
  border: 1px solid #fbd5d5;
  border-radius: 8px;
  padding: 8px 12px;
  line-height: 1.4;
}

/* Actions */
.vsp-actions {
  display: flex;
  gap: 8px;
  padding-top: 4px;
}
.vsp-actions > * { flex: 1; }
</style>
