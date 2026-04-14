<script setup>
import { ref, computed } from 'vue'
import {
  Check, X, AlertTriangle, GanttChart, List,
} from 'lucide-vue-next'
import StatusBadge from '@/components/StatusBadge.vue'
import {
  UiSelect, UiTextarea, UiButton, UiIconButton,
  UiSwitcher, UiSwitcherTab, UiDateRangeInput,
} from '@/components/ui'
import { STATUS_LABELS as statusLabel, DEPT_VACATION_COVERAGE_LIMIT_PERCENT } from '@/constants/vacation'
import { peakDeptLoadFromPlanning } from '@/utils/vacationDepartmentLoad'

// ── Static employee directory ─────────────────────────────────────────────
const EMPLOYEES = [
  { id: 1, name: 'Mirzo Bedil',      dept: 'ИТ',       subdept: 'Разработка программного обеспечения', position: 'Ведущий специалист' },
  { id: 2, name: 'Сардор Тошматов',  dept: 'ИТ',       subdept: 'Разработка программного обеспечения', position: 'Главный специалист' },
  { id: 3, name: 'Малика Рахимова',  dept: 'ИТ',       subdept: 'Обеспечение качества и тестирование', position: 'Эксперт' },
  { id: 4, name: 'Нилуфар Юсупова',  dept: 'HR',       subdept: 'Подбор и адаптация персонала',       position: 'Ведущий специалист' },
  { id: 5, name: 'Жасур Мирзаев',    dept: 'HR',       subdept: 'Кадровый учёт и кадровое делопроизводство', position: 'Специалист' },
  { id: 6, name: 'Бобур Хасанов',    dept: 'Финансы',  subdept: 'Бухгалтерский учёт и отчётность',   position: 'Главный специалист' },
  { id: 7, name: 'Дилноза Атаева',   dept: 'ИТ',       subdept: 'Информационная безопасность',        position: 'Главный специалист' },
  { id: 8, name: 'Камол Юсупов',     dept: 'Продажи',  subdept: 'B2B',              position: 'Менеджер продаж'       },
  { id: 9, name: 'Зулфия Норова',    dept: 'Продажи',  subdept: 'B2C',              position: 'Менеджер продаж'       },
]

const vacations = ref([
  /** Два фрагмента одного годового плана (один статус) — в таблице одна строка, в деталях части */
  { id: 1,  empId: 1, from: '2025-04-10', to: '2025-04-18', days: 9,  type: 'Ежегодный',    status: 'planned'  },
  { id: 2,  empId: 2, from: '2025-04-14', to: '2025-04-22', days: 9,  type: 'Ежегодный',    status: 'planned'  },
  { id: 3,  empId: 3, from: '2025-04-22', to: '2025-04-26', days: 5,  type: 'Ежегодный',    status: 'approved' },
  { id: 4,  empId: 4, from: '2025-05-01', to: '2025-05-12', days: 12, type: 'Ежегодный',    status: 'planned'  },
  { id: 5,  empId: 5, from: '2025-04-28', to: '2025-05-02', days: 5,  type: 'За свой счёт', status: 'approved' },
  { id: 6,  empId: 6, from: '2025-05-05', to: '2025-05-09', days: 5,  type: 'Ежегодный',    status: 'planned'  },
  { id: 7,  empId: 7, from: '2025-05-12', to: '2025-05-23', days: 12, type: 'Ежегодный',    status: 'planned'  },
  { id: 8,  empId: 8, from: '2025-06-01', to: '2025-06-14', days: 14, type: 'Ежегодный',    status: 'planned'  },
  { id: 9,  empId: 9, from: '2025-06-09', to: '2025-06-20', days: 12, type: 'Ежегодный',    status: 'planned'  },
  { id: 10, empId: 1, from: '2025-06-23', to: '2025-06-30', days: 8,  type: 'Ежегодный',    status: 'planned'  },
])

// ── Utils ─────────────────────────────────────────────────────────────────
function fmtDate(iso) {
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}
function hasOverlap(a1, a2, b1, b2) {
  return a1 <= b2 && a2 >= b1
}

/** Части ежегодного плана одного сотрудника за год (несколько строк в данных). */
function annualPlanSegmentsSameStatus(v) {
  if (!v || v.type !== 'Ежегодный') return []
  const year = v.from.slice(0, 4)
  const ys = `${year}-01-01`
  const ye = `${year}-12-31`
  return vacations.value
    .filter(
      x =>
        x.empId === v.empId &&
        x.type === 'Ежегодный' &&
        x.status === v.status &&
        x.from <= ye &&
        x.to >= ys,
    )
    .sort((a, b) => a.from.localeCompare(b.from))
}

function combinedDateRangeFromSegments(segments) {
  if (!segments.length) return null
  return {
    from: segments.reduce((m, r) => (r.from < m ? r.from : m), segments[0].from),
    to: segments.reduce((m, r) => (r.to > m ? r.to : m), segments[0].to),
  }
}

/**
 * Одна строка таблицы планирования = один отпуск; несколько частей ежегодного — с partCount и _segments.
 */
function mergeAnnualPlanTableRows(rowsWithEmp) {
  const seenIds = new Set()
  const groups = new Map()
  const order = []
  for (const r of rowsWithEmp) {
    if (seenIds.has(r.id)) continue
    seenIds.add(r.id)
    const key =
      r.type === 'Ежегодный'
        ? `${r.empId}\u0000${r.from.slice(0, 4)}\u0000${r.status}`
        : `id:${r.id}`
    if (!groups.has(key)) {
      groups.set(key, [])
      order.push(key)
    }
    groups.get(key).push(r)
  }
  const out = []
  for (const key of order) {
    const group = groups.get(key)
    const sorted = [...group].sort((a, b) => a.from.localeCompare(b.from))
    const first = sorted[0]
    const emp = first.emp
    if (sorted.length === 1 || first.type !== 'Ежегодный') {
      out.push({ ...first, partCount: 1 })
      continue
    }
    const range = combinedDateRangeFromSegments(sorted)
    const totalDays = sorted.reduce((s, x) => s + x.days, 0)
    out.push({
      ...first,
      id: `grp-${first.id}`,
      from: range.from,
      to: range.to,
      days: totalDays,
      partCount: sorted.length,
      _segments: sorted,
      emp,
    })
  }
  return out
}

function initials(name) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('')
}

// ── View mode ─────────────────────────────────────────────────────────────
const viewMode = ref('table')

// ── Filters ───────────────────────────────────────────────────────────────
const filterDept   = ref('')
const filterStatus = ref('')
const filterDateRange = ref({ from: '', to: '' })
const DEPTS        = [...new Set(EMPLOYEES.map(e => e.dept))]

const filteredEmployees = computed(() =>
  filterDept.value
    ? EMPLOYEES.filter(e => e.dept === filterDept.value)
    : EMPLOYEES
)

function vacOverlapsDateRange(v, fromStr, toStr) {
  if (!fromStr && !toStr) return true
  const dmin = fromStr || '0000-01-01'
  const dmax = toStr || '9999-12-31'
  return v.from <= dmax && v.to >= dmin
}

const filteredVacations = computed(() => {
  let list = filterStatus.value
    ? vacations.value.filter(v => v.status === filterStatus.value)
    : [...vacations.value]
  const { from: df, to: dt } = filterDateRange.value
  if (df || dt) {
    list = list.filter(v => vacOverlapsDateRange(v, df, dt))
  }
  return list
})

const deptFilterOptions = computed(() => [
  { value: '', label: 'Все подразделения' },
  ...DEPTS.map(d => ({ value: d, label: d })),
])

const statusFilterOptions = [
  { value: '', label: 'Все статусы' },
  { value: 'planned', label: 'Запланировано' },
  { value: 'approved', label: 'Одобрено' },
  { value: 'rejected', label: 'Отклонено' },
]

// ── Plan Gantt: один календарный год — 12 колонок (месяцы), без переключения ─
const MONTHS_SHORT = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек']

/** Год плана (только заголовок, без контролов) */
const PLANNING_YEAR = 2025

const tlMonths = computed(() => {
  const y = PLANNING_YEAR
  return Array.from({ length: 12 }, (_, m) => ({
    label: MONTHS_SHORT[m],
    days: new Date(y, m + 1, 0).getDate(),
    iso: `${y}-${String(m + 1).padStart(2, '0')}`,
  }))
})

const tlTotalDays = computed(() => tlMonths.value.reduce((s, m) => s + m.days, 0))

/** Ширина колонок ∝ числу дней в месяце */
const planMonthGridTemplate = computed(() =>
  tlMonths.value.map(m => `${m.days}fr`).join(' '),
)

const planTimelineMinWidth = computed(() => '1120px')

const tlStartDate = computed(() => `${PLANNING_YEAR}-01-01`)
const tlEndDate = computed(() => `${PLANNING_YEAR}-12-31`)

// ── Gantt: drag-to-scroll (горизонтально), ячейки плана — pointer ─────────
const ganttScrollEl = ref(null)
const ganttDragging = ref(false)

function onGanttPointerDown(e) {
  if (e.pointerType === 'mouse' && e.button !== 0) return
  const t = e.target
  if (t && typeof t.closest === 'function' && t.closest('.tl-bar')) return

  const el = ganttScrollEl.value
  if (!el) return

  el.setPointerCapture(e.pointerId)
  ganttDragging.value = true
  const originX = e.clientX
  const originScroll = el.scrollLeft

  function move(ev) {
    el.scrollLeft = originScroll - (ev.clientX - originX)
  }
  function up(ev) {
    if (el.hasPointerCapture(ev.pointerId)) el.releasePointerCapture(ev.pointerId)
    ganttDragging.value = false
    el.removeEventListener('pointermove', move)
    el.removeEventListener('pointerup', up)
    el.removeEventListener('pointercancel', up)
  }

  el.addEventListener('pointermove', move)
  el.addEventListener('pointerup', up)
  el.addEventListener('pointercancel', up)
}

function dayIndexInPlanningYear(iso) {
  const [Y, M, D] = iso.split('-').map(Number)
  if (Y !== PLANNING_YEAR) return -1
  const start = new Date(PLANNING_YEAR, 0, 1)
  const d = new Date(PLANNING_YEAR, M - 1, D)
  return Math.round((d - start) / 86400000)
}

// Returns { left%, width%, status } — полоса по дням года (12 месяцев в сетке)
function getBar(v) {
  const tS = tlStartDate.value
  const tE = tlEndDate.value
  if (v.to < tS || v.from > tE) return null
  const visFrom = v.from < tS ? tS : v.from
  const visTo = v.to > tE ? tE : v.to
  const i0 = dayIndexInPlanningYear(visFrom)
  const i1 = dayIndexInPlanningYear(visTo)
  if (i0 < 0 || i1 < 0) return null
  const total = tlTotalDays.value
  return {
    left: (i0 / total) * 100,
    width: ((i1 - i0 + 1) / total) * 100,
    status: v.status,
  }
}

function empBars(empId) {
  return filteredVacations.value
    .filter(v => v.empId === empId)
    .map(v => {
      const bar = getBar(v)
      return bar ? { ...bar, id: v.id, vac: v } : null
    })
    .filter(Boolean)
}

// ── Summary: сотрудники с хотя бы одной заявкой «planned» / всего в справочнике ─
const totalStaffCount = EMPLOYEES.length

const plannedStaffCount = computed(() => {
  const ids = new Set()
  for (const v of vacations.value) {
    if (v.status === 'planned') ids.add(v.empId)
  }
  return ids.size
})

// ── Risk detection ─────────────────────────────────────────────────────────
const risks = computed(() => {
  const result = []
  for (const dept of DEPTS) {
    const deptEmpIds = EMPLOYEES.filter(e => e.dept === dept).map(e => e.id)
    const active = vacations.value.filter(v =>
      deptEmpIds.includes(v.empId) &&
      (v.status === 'approved' || v.status === 'planned') &&
      v.from <= tlEndDate.value && v.to >= tlStartDate.value
    )
    const overlapping = []
    for (let i = 0; i < active.length; i++) {
      for (let j = i + 1; j < active.length; j++) {
        if (hasOverlap(active[i].from, active[i].to, active[j].from, active[j].to)) {
          const e1 = EMPLOYEES.find(e => e.id === active[i].empId)
          const e2 = EMPLOYEES.find(e => e.id === active[j].empId)
          if (e1 && e2) overlapping.push(`${e1.name.split(' ')[0]} и ${e2.name.split(' ')[0]}`)
        }
      }
    }
    if (overlapping.length) {
      result.push({ dept, overlapping: [...new Set(overlapping)] })
    }
  }
  return result
})

/** HR: пиковая доля штата отдела в отпуске в один день (год плана) выше лимита — предупреждение */
const deptLoadHrWarnings = computed(() => {
  const limit = DEPT_VACATION_COVERAGE_LIMIT_PERCENT
  const includeStatus = s => s === 'approved' || s === 'planned'
  const out = []
  for (const dept of DEPTS) {
    const { maxPercent, worstDay, maxConcurrent } = peakDeptLoadFromPlanning({
      employees: EMPLOYEES,
      vacations: vacations.value,
      department: dept,
      rangeFrom: tlStartDate.value,
      rangeTo: tlEndDate.value,
      includeStatus,
    })
    if (maxPercent <= limit) continue
    const headcount = EMPLOYEES.filter(e => e.dept === dept).length
    out.push({
      dept,
      maxPercent: Math.round(maxPercent * 10) / 10,
      worstDay,
      maxConcurrent,
      headcount,
      limit,
    })
  }
  return out
})

// ── Simultaneous on vacation count per day ────────────────────────────────
// For each row in the gantt, count how many from same dept are also on vac
function deptCountAtDate(empId, dateStr) {
  const emp  = EMPLOYEES.find(e => e.id === empId)
  if (!emp) return 0
  return vacations.value.filter(v => {
    const e = EMPLOYEES.find(x => x.id === v.empId)
    return e?.dept === emp.dept &&
           (v.status === 'approved' || v.status === 'planned') &&
           dateStr >= v.from && dateStr <= v.to
  }).length
}

function approveAllPlanned() {
  vacations.value
    .filter(v => v.status === 'planned')
    .forEach(v => v.status = 'approved')
}

// ── Conflict detection (per vacation ID) ─────────────────────────────────
const conflictingVacIds = computed(() => {
  const ids = new Set()
  for (const dept of DEPTS) {
    const deptEmpIds = EMPLOYEES.filter(e => e.dept === dept).map(e => e.id)
    const relevant = vacations.value.filter(v =>
      deptEmpIds.includes(v.empId) &&
      (v.status === 'approved' || v.status === 'planned')
    )
    for (let i = 0; i < relevant.length; i++) {
      for (let j = i + 1; j < relevant.length; j++) {
        if (hasOverlap(relevant[i].from, relevant[i].to, relevant[j].from, relevant[j].to)) {
          ids.add(relevant[i].id)
          ids.add(relevant[j].id)
        }
      }
    }
  }
  return ids
})

/** Сколько записей плана участвуют в пересечении отпусков внутри отдела (как в таблице / Gantt). */
const conflictingVacationCount = computed(() => conflictingVacIds.value.size)

function escHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function ganttBarTooltip(v) {
  const parts = [
    escHtml(`${fmtDate(v.from)} — ${fmtDate(v.to)}`),
    escHtml(`${v.days} дн. · ${v.type}`),
    escHtml(String(statusLabel[v.status])),
  ]
  if (conflictingVacIds.value.has(v.id)) {
    parts.push('<span class="gantt-tooltip-warn">Внимание: пересечение отпусков в отделе</span>')
  }
  return parts.join('<br>')
}

/** Строка Gantt: есть ли у сотрудника видимый отпуск с пересечением в отделе */
function empHasRowConflict(empId) {
  return filteredVacations.value
    .filter(v => v.empId === empId)
    .some(v => conflictingVacIds.value.has(v.id))
}

// ── Plan drawer ───────────────────────────────────────────────────────────
const showPlanDrawer  = ref(false)
const planDrawerItem  = ref(null)
const planRejectInput = ref(false)
const planRejectNote  = ref('')

function openPlanDrawer(v) {
  const raw = v._segments?.[0] ?? v
  const emp = EMPLOYEES.find(e => e.id === (raw.empId ?? v.empId))
  planDrawerItem.value = emp ? { ...raw, emp } : { ...raw }
  planRejectInput.value = false
  planRejectNote.value = ''
  showPlanDrawer.value = true
}

const planDrawerAnnualSegments = computed(() =>
  planDrawerItem.value ? annualPlanSegmentsSameStatus(planDrawerItem.value) : [],
)

const planDrawerHeadRange = computed(() => {
  const segs = planDrawerAnnualSegments.value
  if (!planDrawerItem.value) return null
  if (segs.length <= 1) {
    return {
      from: planDrawerItem.value.from,
      to: planDrawerItem.value.to,
      days: planDrawerItem.value.days,
    }
  }
  const r = combinedDateRangeFromSegments(segs)
  const days = segs.reduce((s, x) => s + x.days, 0)
  return { ...r, days }
})

const planDrawerConflicts = computed(() => {
  if (!planDrawerItem.value) return []
  const item = planDrawerItem.value
  const segs = planDrawerAnnualSegments.value
  const range =
    segs.length > 1 ? combinedDateRangeFromSegments(segs) : { from: item.from, to: item.to }
  const segmentIds = new Set(segs.map(s => s.id))
  return vacations.value
    .filter(v =>
      !segmentIds.has(v.id) &&
      (v.status === 'approved' || v.status === 'planned') &&
      hasOverlap(v.from, v.to, range.from, range.to)
    )
    .map(v => ({ ...v, emp: EMPLOYEES.find(e => e.id === v.empId) }))
    .filter(v => v.emp)
})

function doPlanApprove() {
  const item = planDrawerItem.value
  if (!item) return
  const segs = annualPlanSegmentsSameStatus(item)
  const targets = segs.length ? segs : [item]
  for (const t of targets) {
    const v = vacations.value.find(x => x.id === t.id)
    if (v) v.status = 'approved'
  }
  showPlanDrawer.value = false
}
function doPlanReject() {
  const item = planDrawerItem.value
  if (!item) return
  const segs = annualPlanSegmentsSameStatus(item)
  const targets = segs.length ? segs : [item]
  for (const t of targets) {
    const v = vacations.value.find(x => x.id === t.id)
    if (v) {
      v.status = 'rejected'
      v.rejectNote = planRejectNote.value
    }
  }
  showPlanDrawer.value = false
}

function planningRowHasConflict(row) {
  if (row._segments?.length)
    return row._segments.some(s => conflictingVacIds.value.has(s.id))
  return conflictingVacIds.value.has(row.id)
}

// ── Table rows ────────────────────────────────────────────────────────────
const tableRowsFlat = computed(() =>
  filteredVacations.value
    .filter(v =>
      filterDept.value
        ? EMPLOYEES.find(e => e.id === v.empId)?.dept === filterDept.value
        : true,
    )
    .map(v => ({ ...v, emp: EMPLOYEES.find(e => e.id === v.empId) }))
    .filter(v => v.emp),
)

const tableRowsExpanded = computed(() => {
  const base = tableRowsFlat.value
  const idSet = new Set()
  for (const r of base) {
    idSet.add(r.id)
    if (r.type === 'Ежегодный') {
      for (const s of annualPlanSegmentsSameStatus(r)) idSet.add(s.id)
    }
  }
  return filteredVacations.value
    .filter(v => {
      if (!idSet.has(v.id)) return false
      if (
        filterDept.value &&
        EMPLOYEES.find(e => e.id === v.empId)?.dept !== filterDept.value
      )
        return false
      return true
    })
    .map(v => ({ ...v, emp: EMPLOYEES.find(e => e.id === v.empId) }))
    .filter(v => v.emp)
})

const tableRows = computed(() => mergeAnnualPlanTableRows(tableRowsExpanded.value))
</script>

<template>
  <div class="vp">

    <!-- ── Сводка плана: запланировали / всего + согласование ─────────── -->
    <div class="card plan-summary-card">
      <div class="plan-summary-main">
        <div class="plan-summary-stat">
          <div class="plan-summary-label">Годовой план отпусков</div>
          <div class="plan-summary-value-row">
            <span class="plan-summary-nums">
              <span class="plan-summary-num">{{ plannedStaffCount }}</span>
              <span class="plan-summary-sep">/</span>
              <span class="plan-summary-den">{{ totalStaffCount }}</span>
            </span>
            <span class="plan-summary-hint">сотрудников с запланированным отпуском</span>
          </div>
        </div>
        <div class="plan-summary-meta">
          <span class="plan-summary-meta-label">Конфликтов</span>
          <span
            class="plan-summary-meta-num"
            :class="{
              'plan-summary-meta-num--ok': conflictingVacationCount === 0,
              'plan-summary-meta-num--warn': conflictingVacationCount > 0,
            }"
          >{{ conflictingVacationCount }}</span>
          <span class="plan-summary-meta-hint">заявок с пересечением в отделе</span>
        </div>
      </div>
      <UiButton variant="primary" class="plan-summary-btn" @click="approveAllPlanned">
        <Check :size="13" stroke-width="2" />
        Согласовать план
      </UiButton>
    </div>

    <!-- ── Risk alerts ────────────────────────────────────────────────── -->
    <div v-if="risks.length" class="risk-alerts">
      <div v-for="r in risks" :key="r.dept" class="risk-alert">
        <span class="risk-alert-icon" aria-hidden="true">
          <AlertTriangle :size="14" stroke-width="2" />
        </span>
        <span class="risk-alert-text">
          <strong>{{ r.dept }}</strong>
          <span class="risk-alert-dash"> — </span>
          одновременный отпуск: {{ r.overlapping.join(', ') }}
        </span>
      </div>
    </div>

    <div v-if="deptLoadHrWarnings.length" class="risk-alerts risk-alerts--dept-load">
      <div v-for="w in deptLoadHrWarnings" :key="`${w.dept}-load`" class="risk-alert risk-alert--dept-load">
        <span class="risk-alert-icon" aria-hidden="true">
          <AlertTriangle :size="14" stroke-width="2" />
        </span>
        <span class="risk-alert-text">
          <strong>{{ w.dept }}</strong>
          <span class="risk-alert-dash"> — </span>
          до {{ w.maxPercent }}% штата в отпуске в один день (лимит {{ w.limit }}%)
          <template v-if="w.worstDay">
            <span class="risk-alert-dash"> · </span>
            напр. {{ fmtDate(w.worstDay) }} — {{ w.maxConcurrent }}/{{ w.headcount }} чел.
          </template>
        </span>
      </div>
    </div>

    <!-- ── Filters + action ───────────────────────────────────────────── -->
    <div class="toolbar">
      <div class="filters">
        <UiSelect v-model="filterDept" :options="deptFilterOptions" />
        <UiSelect v-model="filterStatus" :options="statusFilterOptions" />
        <UiDateRangeInput v-model="filterDateRange" />
      </div>
      <div class="toolbar-right">
        <UiSwitcher v-model="viewMode" variant="icon">
          <UiSwitcherTab id="table" title="Таблица">
            <List :size="14" stroke-width="1.8" />
          </UiSwitcherTab>
          <UiSwitcherTab id="gantt" title="Диаграмма">
            <GanttChart :size="14" stroke-width="1.8" />
          </UiSwitcherTab>
        </UiSwitcher>
      </div>
    </div>

    <!-- ── Requests table ─────────────────────────────────────────────── -->
    <div v-if="viewMode === 'table'" class="card table-card">
      <table class="data-table">
        <thead>
          <tr>
            <th>Сотрудник</th>
            <th>Подразделение</th>
            <th>Должность</th>
            <th>Тип</th>
            <th>С</th>
            <th>По</th>
            <th class="align-right">Дней</th>
            <th class="align-center col-parts">Частей</th>
            <th class="align-right">Статус</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in tableRows" :key="row.id" class="row-clickable" @click="openPlanDrawer(row)">
            <td class="col-name">
              <div class="name-cell">
                {{ row.emp.name }}
                <AlertTriangle v-if="planningRowHasConflict(row)" :size="11" stroke-width="2.2" class="conflict-icon" title="Пересечение с другим отпуском" />
              </div>
            </td>
            <td class="col-dept">
              <span class="dept-tag">{{ row.emp.dept }}</span>
              <span class="subdept">{{ row.emp.subdept }}</span>
            </td>
            <td class="col-pos">{{ row.emp.position }}</td>
            <td class="col-muted">{{ row.type }}</td>
            <td class="col-date col-muted">{{ row.partCount > 1 ? '—' : fmtDate(row.from) }}</td>
            <td class="col-date col-muted">{{ row.partCount > 1 ? '—' : fmtDate(row.to) }}</td>
            <td class="align-right col-muted">{{ row.days }}</td>
            <td class="align-center col-muted col-parts">{{ row.partCount }}</td>
            <td class="align-right">
              <StatusBadge :status="row.status" :label="statusLabel[row.status]" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ── Gantt: календарный год — 12 месяцев, горизонтальный скролл ─────── -->
    <div v-if="viewMode === 'gantt'" class="card gantt-card">
      <div class="gantt-topbar">
        <h2 class="gantt-year-title">{{ PLANNING_YEAR }}</h2>
        <div class="gantt-legend">
          <span class="leg-item"><span class="leg-dot approved"></span>Одобрено</span>
          <span class="leg-item"><span class="leg-dot planned"></span>Запланировано</span>
          <span class="leg-item leg-item--muted">
            <span class="leg-dot leg-dot-warn"></span>Пересечение в отделе
          </span>
        </div>
      </div>

      <div class="gantt-layout">
        <div class="gantt-sidebar">
          <div class="gantt-info-header">Сотрудник</div>
          <div
            v-for="emp in filteredEmployees"
            :key="emp.id"
            class="gantt-info"
          >
            <div class="emp-avatar">{{ initials(emp.name) }}</div>
            <div class="emp-text">
              <div class="emp-name-line">
                <span class="emp-name">{{ emp.name }}</span>
                <span
                  v-if="empHasRowConflict(emp.id)"
                  class="gantt-emp-conflict-mark"
                  title="Пересечение отпусков в отделе"
                />
              </div>
              <div class="emp-meta">{{ emp.dept }} · {{ emp.subdept }}</div>
              <div class="emp-pos">{{ emp.position }}</div>
            </div>
          </div>
        </div>

        <div
          ref="ganttScrollEl"
          class="gantt-tl-scroll"
          :class="{ 'gantt-tl-dragging': ganttDragging }"
          @pointerdown="onGanttPointerDown"
        >
          <div class="gantt-tl-inner" :style="{ minWidth: planTimelineMinWidth }">
            <div
              class="gantt-month-grid gantt-month-grid--head"
              :style="{ gridTemplateColumns: planMonthGridTemplate }"
            >
              <div
                v-for="mo in tlMonths"
                :key="'h-' + mo.iso"
                class="gantt-month-col-h"
              >
                <span class="gantt-month-col-h-txt">{{ mo.label }}</span>
              </div>
            </div>
            <div
              v-for="emp in filteredEmployees"
              :key="'row-' + emp.id"
              class="gantt-plan-row"
            >
              <div class="gantt-year-track">
                <div
                  class="gantt-month-grid gantt-month-grid--cells"
                  :style="{ gridTemplateColumns: planMonthGridTemplate }"
                >
                  <div
                    v-for="mo in tlMonths"
                    :key="'c-' + mo.iso"
                    class="gantt-month-col-cell"
                  />
                </div>
                <div
                  v-for="bar in empBars(emp.id)"
                  :key="bar.id"
                  class="tl-bar"
                  :class="[`bar-${bar.status}`, { 'bar-conflict-hatch': conflictingVacIds.has(bar.id) }]"
                  :style="{ left: bar.left + '%', width: bar.width + '%' }"
                  tabindex="0"
                  v-tooltip="{
                    content: ganttBarTooltip(bar.vac),
                    html: true,
                    placement: 'top',
                    delay: { show: 180, hide: 0 },
                    triggers: ['hover', 'focus'],
                  }"
                  @click.stop="openPlanDrawer(bar.vac)"
                >
                  <AlertTriangle
                    v-if="conflictingVacIds.has(bar.id)"
                    class="tl-bar-warn-ic"
                    :size="10"
                    stroke-width="2.2"
                    aria-hidden="true"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Plan drawer ───────────────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="drawer">
        <div v-if="showPlanDrawer && planDrawerItem" class="drawer-overlay" @click.self="showPlanDrawer = false">
          <div class="drawer-panel">

            <!-- Header -->
            <div class="drawer-header">
              <div class="drawer-header-left">
                <span class="drawer-title">План отпуска</span>
                <StatusBadge :status="planDrawerItem.status" :label="statusLabel[planDrawerItem.status]" />
              </div>
              <UiIconButton type="button" size="sm" aria-label="Закрыть" @click="showPlanDrawer = false"><X :size="14" stroke-width="2" /></UiIconButton>
            </div>

            <!-- Body -->
            <div class="drawer-body">

              <!-- Employee -->
              <div class="drawer-emp">
                <div class="drawer-emp-avatar">{{ initials(planDrawerItem.emp?.name || '') }}</div>
                <div class="drawer-emp-info">
                  <div class="drawer-emp-name">{{ planDrawerItem.emp?.name }}</div>
                  <div class="drawer-emp-meta">{{ planDrawerItem.emp?.dept }} · {{ planDrawerItem.emp?.subdept }}</div>
                  <div class="drawer-emp-pos">{{ planDrawerItem.emp?.position }}</div>
                </div>
              </div>

              <div v-if="planDrawerAnnualSegments.length <= 1" class="drawer-details">
                <div class="drawer-detail">
                  <div class="drawer-detail-label">С</div>
                  <div class="drawer-detail-val">{{ fmtDate(planDrawerItem.from) }}</div>
                </div>
                <div class="drawer-detail">
                  <div class="drawer-detail-label">По</div>
                  <div class="drawer-detail-val">{{ fmtDate(planDrawerItem.to) }}</div>
                </div>
                <div class="drawer-detail">
                  <div class="drawer-detail-label">Дней</div>
                  <div class="drawer-detail-val">{{ planDrawerItem.days }}</div>
                </div>
                <div class="drawer-detail">
                  <div class="drawer-detail-label">Тип</div>
                  <div class="drawer-detail-val">{{ planDrawerItem.type }}</div>
                </div>
              </div>
              <div v-else class="drawer-details drawer-details--compact">
                <div class="drawer-detail">
                  <div class="drawer-detail-label">Тип</div>
                  <div class="drawer-detail-val">{{ planDrawerItem.type }}</div>
                </div>
                <div class="drawer-detail">
                  <div class="drawer-detail-label">Всего дней</div>
                  <div class="drawer-detail-val">{{ planDrawerHeadRange.days }}</div>
                </div>
              </div>

              <div
                v-if="planDrawerAnnualSegments.length > 1"
                class="vp-drawer-plan-parts"
              >
                <div class="vp-drawer-plan-parts-title">Части плана</div>
                <ul class="vp-drawer-plan-parts-list" role="list">
                  <li
                    v-for="seg in planDrawerAnnualSegments"
                    :key="seg.id"
                    class="vp-drawer-plan-part"
                  >
                    <span class="vp-drawer-plan-part-dates">{{ fmtDate(seg.from) }} — {{ fmtDate(seg.to) }}</span>
                    <span class="vp-drawer-plan-part-days">{{ seg.days }} дн.</span>
                  </li>
                </ul>
              </div>

              <!-- Conflict warning -->
              <div v-if="planDrawerConflicts.length" class="drawer-conflicts">
                <div class="drawer-conflicts-title">
                  <AlertTriangle :size="13" stroke-width="2" />
                  Пересечение с {{ planDrawerConflicts.length }} {{ planDrawerConflicts.length === 1 ? 'сотрудником' : 'сотрудниками' }}
                </div>
                <div v-for="c in planDrawerConflicts" :key="c.id" class="conflict-row">
                  <div class="conflict-avatar">{{ initials(c.emp.name) }}</div>
                  <div class="conflict-info">
                    <div class="conflict-name">{{ c.emp.name }}</div>
                    <div class="conflict-dates">{{ fmtDate(c.from) }} — {{ fmtDate(c.to) }} · {{ c.days }} дн.</div>
                  </div>
                  <StatusBadge :status="c.status" :label="statusLabel[c.status]" small />
                </div>
              </div>

            </div>

            <!-- Footer -->
            <div v-if="planDrawerItem.status === 'planned'" class="drawer-footer">
              <template v-if="!planRejectInput">
                <UiButton variant="reject" @click="planRejectInput = true">
                  <X :size="13" stroke-width="2" /> Отклонить
                </UiButton>
                <UiButton variant="primary" @click="doPlanApprove">
                  <Check :size="13" stroke-width="2" /> Одобрить
                </UiButton>
              </template>
              <template v-else>
                <div class="reject-input-wrap">
                  <UiTextarea v-model="planRejectNote" class="vp-reject-note" rows="2" placeholder="Причина (необязательно)" />
                  <div class="reject-btns">
                    <UiButton variant="secondary" @click="planRejectInput = false">Назад</UiButton>
                    <UiButton variant="danger" @click="doPlanReject">Подтвердить отказ</UiButton>
                  </div>
                </div>
              </template>
            </div>

          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<style scoped>
.vp { display: flex; flex-direction: column; gap: 20px; min-width: 0; }

.card {
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 10px;
}

/* ── Сводка плана ── */
.plan-summary-card {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  padding: 14px 16px;
  border-color: #e8e8e8;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.03), 0 1px 2px rgba(0, 0, 0, 0.04);
}
.plan-summary-main {
  display: flex;
  flex-direction: column;
  gap: 0;
  min-width: 0;
  flex: 1;
}
.plan-summary-stat {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.plan-summary-label {
  font-size: 11px;
  color: #888;
  font-weight: 500;
  letter-spacing: 0.01em;
}
.plan-summary-value-row {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px 12px;
}
.plan-summary-nums {
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.03em;
  color: #1a1a1a;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}
.plan-summary-num { color: #1a1a1a; }
.plan-summary-sep { color: #d4d4d4; font-weight: 500; margin: 0 2px; }
.plan-summary-den { color: #9a9a9a; font-weight: 500; font-variant-numeric: tabular-nums; }
.plan-summary-hint {
  font-size: 12px;
  color: #888;
  line-height: 1.4;
  max-width: 420px;
}
.plan-summary-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 10px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
  font-size: 11px;
  color: #888;
}
.plan-summary-meta-label { font-weight: 500; color: #737373; }
.plan-summary-meta-num {
  font-weight: 600;
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  min-width: 1ch;
}
.plan-summary-meta-num--ok { color: #2f8f5f; }
.plan-summary-meta-num--warn { color: #b87a0a; }
.plan-summary-meta-hint { color: #a3a3a3; }
.plan-summary-btn {
  flex-shrink: 0;
  align-self: center;
}

@media (max-width: 640px) {
  .plan-summary-card {
    flex-direction: column;
    align-items: stretch;
  }
  .plan-summary-btn {
    align-self: stretch;
    justify-content: center;
  }
}

/* ── Risk alerts ── */
.risk-alerts { display: flex; flex-direction: column; gap: 8px; }
.risk-alert {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 11px 14px;
  background: #fdfaf6;
  border: 1px solid #f0e6d8;
  border-radius: 10px;
  font-size: 12px;
  line-height: 1.5;
  color: #7a5a20;
}
.risk-alert-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  border-radius: 8px;
  background: rgba(232, 160, 32, 0.12);
  color: #c98a18;
}
.risk-alert-text { min-width: 0; }
.risk-alert-text strong { color: #5c4518; font-weight: 600; }
.risk-alert-dash { font-weight: 400; color: #a89880; }

.risk-alerts--dept-load { margin-top: 4px; }
.risk-alert--dept-load {
  background: #fffbeb;
  border-color: #fcd34d;
  color: #92400e;
}
.risk-alert--dept-load .risk-alert-icon {
  background: rgba(217, 119, 6, 0.12);
  color: #d97706;
}
.risk-alert--dept-load .risk-alert-text strong { color: #78350f; }

/* ── Toolbar ── */
.toolbar       { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.toolbar-right { display: flex; align-items: center; gap: 10px; }

.filters  { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }

/* ── Gantt card (год + скролл по горизонтали) ── */
.gantt-card { padding: 0; overflow: hidden; }

.gantt-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px 20px;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  background: #fff;
}
.gantt-year-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: -0.3px;
  line-height: 1.2;
}

.gantt-layout {
  display: flex;
  align-items: stretch;
  min-width: 0;
}

.gantt-sidebar {
  width: 260px;
  flex-shrink: 0;
  border-right: 1px solid #f0f0f0;
  background: #fff;
}

.gantt-info-header {
  height: 52px;
  min-height: 52px;
  max-height: 52px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  padding: 0 16px;
  font-size: 11.5px;
  font-weight: 500;
  color: #aaa;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
}

.gantt-tl-scroll {
  flex: 1;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  cursor: move;
  touch-action: pan-x;
  background: #fff;
}
.gantt-tl-scroll.gantt-tl-dragging {
  cursor: move;
  user-select: none;
  -webkit-user-select: none;
}
.gantt-tl-scroll.gantt-tl-dragging .tl-bar {
  cursor: move;
}

.gantt-tl-inner {
  width: max(100%, 1120px);
  box-sizing: border-box;
}

/* 12 колонок — месяцы года, лёгкие вертикальные линии */
.gantt-month-grid {
  display: grid;
  width: 100%;
  box-sizing: border-box;
}
.gantt-month-grid--head {
  min-height: 52px;
  height: 52px;
  border-bottom: 1px solid #ececec;
  background: #fff;
  align-items: stretch;
}
.gantt-month-col-h {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 0;
  background: #fff;
  box-sizing: border-box;
  border-left: 1px solid #f3f3f3;
  transition: filter 0.12s ease;
}
.gantt-month-col-h:first-child {
  border-left: none;
}
.gantt-month-col-h:hover {
  filter: brightness(0.98);
}
.gantt-month-col-h-txt {
  font-size: 11px;
  font-weight: 600;
  color: #444;
  letter-spacing: -0.2px;
}

.gantt-month-grid--cells {
  position: absolute;
  inset: 0;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}
.gantt-month-col-cell {
  min-height: 100%;
  background: #fff;
  box-sizing: border-box;
  border-left: 1px solid #f3f3f3;
}
.gantt-month-col-cell:first-child {
  border-left: none;
}

.gantt-plan-row {
  border-bottom: 1px solid #f0f0f0;
  min-height: 64px;
}
.gantt-plan-row:last-child { border-bottom: none; }

.gantt-year-track {
  position: relative;
  height: 100%;
  min-height: 64px;
}

.gantt-info {
  height: 64px;
  min-height: 64px;
  max-height: 64px;
  box-sizing: border-box;
  padding: 0 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid #f5f5f5;
  transition: background 0.12s;
}
.gantt-sidebar .gantt-info:last-child { border-bottom: none; }
.gantt-info:hover { background: #fafafa; }

.emp-avatar {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #f0f0f0;
  color: #888;
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.emp-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.emp-name-line {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.emp-name { font-size: 12.5px; font-weight: 500; color: #1a1a1a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
.gantt-emp-conflict-mark {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #e8a020;
  flex-shrink: 0;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.9);
}
.emp-meta { font-size: 11px; color: #aaa; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.emp-pos  { font-size: 11px; color: #bbb; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.tl-bar {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  height: 18px;
  border-radius: 4px;
  min-width: 4px;
  transition: filter 0.12s ease;
  cursor: pointer;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}
.tl-bar:hover {
  filter: brightness(0.93);
}
.bar-approved { background: #c8eedd; }
.bar-planned  { background: #d6e4fd; }
.bar-rejected { background: #fde8e8; opacity: 0.5; }

/* Пересечение: лёгкая диагональная штриховка поверх цвета статуса */
.tl-bar.bar-conflict-hatch::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  z-index: 0;
  background: repeating-linear-gradient(
    -36deg,
    transparent 0,
    transparent 2px,
    rgba(0, 0, 0, 0.07) 2px,
    rgba(0, 0, 0, 0.07) 3px
  );
}

.tl-bar-warn-ic {
  color: #e8a020;
  flex-shrink: 0;
  pointer-events: none;
  z-index: 1;
  filter: drop-shadow(0 0 0.5px rgba(255, 255, 255, 0.95));
}

/* ── Gantt legend (в topbar справа) ── */
.gantt-legend {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
}
.leg-item { display: flex; align-items: center; gap: 5px; font-size: 11.5px; color: #aaa; }
.leg-dot  { width: 10px; height: 8px; border-radius: 2px; }
.leg-dot.approved { background: #c8eedd; }
.leg-dot.planned  { background: #d6e4fd; }
.leg-dot-warn { background: #e8a020; border-radius: 50%; width: 8px; height: 8px; }
.leg-item--muted { color: #bbb; font-size: 11px; }
.leg-item--muted .leg-dot-warn { width: 7px; height: 7px; }

/* ── Table ── */
.table-card {
  padding: 0;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  max-width: 100%;
}
.data-table {
  width: max-content;
  min-width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.data-table thead tr { border-bottom: 1px solid #f0f0f0; }
.data-table th { padding: 11px 16px; font-size: 11.5px; font-weight: 500; color: #aaa; text-align: left; }
.data-table tbody tr { border-bottom: 1px solid #f5f5f5; transition: background 0.12s; }
.data-table tbody tr:last-child { border-bottom: none; }
.data-table tbody tr:hover { background: #fafafa; }
.data-table td { padding: 11px 16px; color: #444; }
.align-right { text-align: right; }
.align-center { text-align: center; }
.data-table th.align-right { text-align: right; }
.data-table th.align-center { text-align: center; }
.col-parts { width: 56px; }

.col-name { color: #222; font-weight: 450; font-size: 12.5px; white-space: nowrap; }
.col-dept { display: flex; flex-direction: column; gap: 2px; }
.dept-tag { font-size: 11.5px; color: #5b8ef0; font-weight: 500; }
.subdept  { font-size: 11px; color: #bbb; }
.col-pos  { font-size: 12px; color: #888; }
.col-date { color: #888; font-size: 12.5px; white-space: nowrap; }
.col-muted { color: #aaa; font-size: 12.5px; }

/* ── Row clickable ── */
.row-clickable { cursor: pointer; }

/* ── Name cell with conflict icon ── */
.name-cell { display: flex; align-items: center; gap: 5px; }
.conflict-icon { color: #e8a020; flex-shrink: 0; }

/* ── Drawer (как «Заявка на отпуск» в Vacations.vue) ── */
.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.18);
  z-index: 400;
  display: flex;
  justify-content: flex-end;
}
.drawer-panel {
  width: 440px;
  height: 100%;
  background: #fff;
  display: flex;
  flex-direction: column;
  box-shadow: -8px 0 32px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}
.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}
.drawer-header-left { display: flex; align-items: center; gap: 10px; }
.drawer-title { font-size: 14px; font-weight: 600; color: #1a1a1a; }
.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.drawer-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.drawer-emp {
  display: flex;
  align-items: center;
  gap: 12px;
}
.drawer-emp-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e8e8e8;
  color: #555;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.drawer-emp-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.drawer-emp-name { font-size: 14px; font-weight: 500; color: #1a1a1a; }
.drawer-emp-meta { font-size: 12px; color: #999; }
.drawer-emp-pos  { font-size: 12px; color: #999; }

.drawer-details {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
  background: #f0f0f0;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}
.drawer-detail {
  background: #fff;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}
.drawer-detail-label { font-size: 11px; color: #bbb; font-weight: 500; }
.drawer-detail-val   { font-size: 13px; color: #1a1a1a; font-weight: 450; }

/* Два поля: flex надёжнее grid внутри flex-колонки drawer-body (иначе высота ~0 и клип по overflow) */
.drawer-details.drawer-details--compact {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
}
.drawer-details.drawer-details--compact .drawer-detail {
  flex: 1 1 0;
}

.vp-drawer-plan-parts {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid #eee;
}
.vp-drawer-plan-parts-title {
  font-size: 10.5px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #999;
  margin-bottom: 8px;
}
.vp-drawer-plan-parts-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.vp-drawer-plan-part {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
  font-size: 13px;
}
.vp-drawer-plan-part:last-child { border-bottom: none; padding-bottom: 0; }
.vp-drawer-plan-part-dates { color: #333; font-weight: 500; }
.vp-drawer-plan-part-days { color: #888; font-size: 12.5px; white-space: nowrap; }

/* ── Conflict section ── */
.drawer-conflicts {
  background: #fff9f0;
  border: 1px solid #fde8c0;
  border-radius: 8px;
  padding: 12px 14px;
  display: flex; flex-direction: column; gap: 10px;
}
.drawer-conflicts-title {
  display: flex; align-items: center; gap: 7px;
  font-size: 12px; font-weight: 500; color: #9a6400;
}
.drawer-conflicts-title svg { color: #e8a020; }
.conflict-row {
  display: flex; align-items: center; gap: 10px;
}
.conflict-avatar {
  width: 32px; height: 32px;
  border-radius: 7px;
  background: #f0e6c8;
  color: #9a6400;
  font-size: 11px; font-weight: 600;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.conflict-info { flex: 1; display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.conflict-name  { font-size: 12px; font-weight: 500; color: #1a1a1a; }
.conflict-dates { font-size: 11px; color: #aaa; }

/* ── Reject in drawer footer ── */
.reject-input-wrap { width: 100%; display: flex; flex-direction: column; gap: 8px; }
.reject-btns { display: flex; justify-content: flex-end; gap: 8px; }

.vp-reject-note {
  resize: none;
  min-height: 52px;
}

/* ── Drawer slide transition ── */
.drawer-enter-active, .drawer-leave-active { transition: opacity 0.2s; }
.drawer-enter-active .drawer-panel, .drawer-leave-active .drawer-panel { transition: transform 0.25s cubic-bezier(0.4,0,0.2,1); }
.drawer-enter-from, .drawer-leave-to { opacity: 0; }
.drawer-enter-from .drawer-panel, .drawer-leave-to .drawer-panel { transform: translateX(100%); }

</style>
