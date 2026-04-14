<script setup>
import { ref, inject, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import VacationPlanning from './VacationPlanning.vue'
import VacationHrDashboard from './VacationHrDashboard.vue'
import TeamAbsenceCalendar from '@/components/TeamAbsenceCalendar.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import ActivityFeed from '@/components/ActivityFeed.vue'
import ActivityFeedItem from '@/components/ActivityFeedItem.vue'
import {
  UiDateRangeInput, UiTextField, UiSelect, UiTextarea, UiSearchField, UiButton, UiIconButton,
  UiPillTabs, UiPillTab, UiTableToolbar,
} from '@/components/ui'
import { useClientTableFilter } from '@/composables/useClientTableFilter'
import {
  isInManagerTeam,
  VACATION_TYPES,
  STATUS_LABELS as statusLabel,
  LINE_MANAGER,
  DEPT_VACATION_COVERAGE_LIMIT_PERCENT,
  DEPT_LOAD_REQUEST_STATUSES,
} from '@/constants/vacation'
import { peakDeptLoadFromNamedRequests } from '@/utils/vacationDepartmentLoad'
import { EMPLOYEE_DATA } from '@/data/vacationRequests'
import { COLLEAGUES } from '@/data/colleagues'
import { useVacationRequests } from '@/composables/useVacationRequests'
import { vacationPlanFlash } from '@/composables/useVacationPlanFlash'
import { VACATION_REQUEST_FLASH_TOAST_KEY } from '@/constants/vacationRequestUi'
import {
  Plus, Check, X, ChevronLeft, ChevronRight, Send, CheckCircle2, AlertCircle, AlertTriangle,
  Clock, ClipboardList, ShieldCheck, Ban, CalendarDays, Minus, Users, Palmtree,
  Briefcase,
} from 'lucide-vue-next'

const activeRole      = inject('activeRole')
const sessionUser     = inject('sessionUser')
const addNotification = inject('addNotification', () => {})
const pendingOpen     = inject('pendingOpen', ref(null))

const route  = useRoute()
const router = useRouter()

/** `/vacations` — личные отпуска для всех ролей; `/vacations/approvals` — очереди руководителя/HR */
const isPersonalVacationsRoute = computed(() => route.name === 'vacations')
const isApprovalsRoute = computed(() => route.name === 'vacations-approvals')

const activeTab = ref('dashboard')

const isManager = computed(() => activeRole.value === 'manager')
const isHrOrAdmin = computed(() => activeRole.value === 'hr' || activeRole.value === 'admin')
/** Руководитель видит только вкладку заявок (согласование), без планирования и финального HR */
const showRequestsPanel = computed(() => isManager.value || activeTab.value === 'requests')

watch(
  () => [route.name, activeRole.value],
  ([name, role]) => {
    if (name === 'vacations-approvals' && role === 'staff') {
      router.replace({ name: 'vacations' })
    }
    if (name === 'vacations-approvals' && role === 'manager') {
      activeTab.value = 'requests'
    }
  },
  { immediate: true },
)

watch(
  () => [activeRole.value, activeTab.value],
  ([role, tab]) => {
    if (tab === 'dashboard' && role !== 'hr' && role !== 'admin') activeTab.value = 'requests'
  },
)

/** Личный кабинет отпусков — от имени sessionUser (в демо совпадает с выбранной ролью в App.vue) */
const currentUser = computed(() => ({
  name: sessionUser.value.name,
  isTopLevel: sessionUser.value.isTopLevel,
}))

const balance = computed(() => {
  const b = EMPLOYEE_DATA[sessionUser.value.name]?.balance
  return b ? { total: b.total, used: b.used } : { total: 28, used: 0 }
})

// ── Data ────────────────────────────────────────────────────────────────
const { allRequests } = useVacationRequests()

function goDashboardHrToday() {
  router.push({ name: 'dashboard', hash: '#hr-absences-today' })
}

function dismissVacationPlanFlash() {
  vacationPlanFlash.value = null
}

function editVacationPlanFromFlash() {
  vacationPlanFlash.value = null
  router.push({ name: 'vacations-plan' })
}

// ── Utils ────────────────────────────────────────────────────────────────
function fmtDate(iso) {
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}
function daysBetween(from, to) {
  return Math.round((new Date(to) - new Date(from)) / 86400000) + 1
}
function hasOverlap(a1, a2, b1, b2) {
  return a1 <= b2 && a2 >= b1
}

/**
 * Части ежегодного плана, сохранённые отдельными строками (VacationStaffPlanning),
 * с тем же статусом и в том же календарном году, что и у переданной заявки.
 */
function annualLeaveSamePlanSegments(req) {
  if (!req || req.type !== 'Ежегодный') return []
  const year = req.from.slice(0, 4)
  const ys = `${year}-01-01`
  const ye = `${year}-12-31`
  return allRequests.value
    .filter(
      r =>
        r.employee === req.employee &&
        r.type === 'Ежегодный' &&
        r.status === req.status &&
        r.from <= ye &&
        r.to >= ys,
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

/** Если в выборку попала часть ежегодного плана — показываем весь план (все части). */
function expandAnnualPlanGroupsFromRows(baseRows, scopeRows) {
  const idSet = new Set()
  for (const r of baseRows) {
    idSet.add(r.id)
    if (r.type === 'Ежегодный') {
      for (const s of annualLeaveSamePlanSegments(r)) idSet.add(s.id)
    }
  }
  return scopeRows.filter(r => idSet.has(r.id))
}

/**
 * Одна строка таблицы = один отпуск; ежегодный план из нескольких частей — с суммой дней и диапазоном.
 * _segments — все записи группы (для согласования целиком).
 */
function mergeAnnualPlanGroups(rows) {
  const seenIds = new Set()
  const groups = new Map()
  const order = []
  for (const r of rows) {
    if (seenIds.has(r.id)) continue
    seenIds.add(r.id)
    const key =
      r.type === 'Ежегодный'
        ? `${r.employee}\u0000${r.from.slice(0, 4)}\u0000${r.status}`
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
    })
  }
  return out
}

// ── Filtered requests ────────────────────────────────────────────────────
const requests = computed(() => {
  if (isPersonalVacationsRoute.value)
    return allRequests.value.filter(r => r.employee === currentUser.value.name)
  if (activeRole.value === 'manager')
    return allRequests.value.filter(r => isInManagerTeam(r.employee))
  return allRequests.value
})

function approvalRowSearchText(r) {
  const emp = EMPLOYEE_DATA[r.employee]
  return [
    r.employee,
    r.type,
    statusLabel[r.status] || r.status,
    r.from,
    r.to,
    r.partCount > 1 ? `частей ${r.partCount}` : '',
    emp?.dept,
    emp?.subdept,
    emp?.position,
  ].filter(Boolean).join(' ')
}

/**
 * Руководитель: вкладки + те же 3 группы в колонке «Статус» таблицы (как в табах, плюс «Все»).
 */
const managerApprovalStatusTab = ref('all')

const MANAGER_TAB_APPROVED_STATUSES = ['approved_by_manager', 'approved', 'confirmed', 'planned']

/** Три группы для руководителя: те же подписи, что на вкладках (таблица + табы). */
function managerApprovalsStatusLabel(s) {
  if (s === 'pending' || s === 'pending_manager') return 'Ожидает'
  if (s === 'rejected') return 'Отклонено'
  if (MANAGER_TAB_APPROVED_STATUSES.includes(s)) return 'Согласовано'
  return statusLabel[s] || s
}

const approvalsTableInput = computed(() => {
  const list = requests.value
  if (!isApprovalsRoute.value || !isManager.value) return list
  switch (managerApprovalStatusTab.value) {
    case 'pending':
      return list.filter(r => r.status === 'pending_manager' || r.status === 'pending')
    case 'approved':
      return list.filter(r => MANAGER_TAB_APPROVED_STATUSES.includes(r.status))
    case 'rejected':
      return list.filter(r => r.status === 'rejected')
    default:
      return list
  }
})

const managerTabCounts = computed(() => {
  const list = requests.value
  if (!isManager.value) {
    return { all: 0, pending: 0, approved: 0, rejected: 0 }
  }
  const merged = mergeAnnualPlanGroups(list)
  return {
    all: merged.length,
    pending: merged.filter(r => r.status === 'pending_manager' || r.status === 'pending').length,
    approved: merged.filter(r => MANAGER_TAB_APPROVED_STATUSES.includes(r.status)).length,
    rejected: merged.filter(r => r.status === 'rejected').length,
  }
})

const {
  searchQuery: approvalsSearchQuery,
  statusFilter: approvalsStatusFilter,
  dateRange: approvalsDateRange,
  filteredRows: approvalsTableRows,
} = useClientTableFilter(approvalsTableInput, { searchText: approvalRowSearchText })

watch(managerApprovalStatusTab, () => {
  if (isManager.value) approvalsStatusFilter.value = ''
})

const approvalsStatusOptions = computed(() => [
  { value: '', label: 'Все статусы' },
  ...Object.entries(statusLabel).map(([value, label]) => ({ value, label })),
])

const approvalsDeptFilter = ref('')

const approvalsDeptOptions = computed(() => {
  const keys = new Set()
  for (const r of requests.value) {
    const e = EMPLOYEE_DATA[r.employee]
    if (e) keys.add(`${e.dept} · ${e.subdept}`)
  }
  const sorted = [...keys].sort((a, b) => a.localeCompare(b, 'ru'))
  return [{ value: '', label: 'Все отделы' }, ...sorted.map(k => ({ value: k, label: k }))]
})

const approvalsTableRowsFinal = computed(() => {
  let rows = approvalsTableRows.value
  const d = approvalsDeptFilter.value
  if (d) {
    rows = rows.filter(r => empDeptLabel(r.employee) === d)
  }
  return rows
})

/** Очередь согласований: полные группы ежегодного плана + объединённые строки */
const approvalsDisplayRows = computed(() => {
  const expanded = expandAnnualPlanGroupsFromRows(approvalsTableRowsFinal.value, requests.value)
  return mergeAnnualPlanGroups(expanded)
})

const hrQueueApprovedByManager = computed(() =>
  mergeAnnualPlanGroups(
    allRequests.value.filter(r => r.status === 'approved_by_manager'),
  ),
)

/** Личный таб «Заявки»: одна строка на отпуск, части в деталях */
const staffRequestsDisplayRows = computed(() => mergeAnnualPlanGroups(requests.value))

const summary = computed(() => {
  const listRaw =
    activeRole.value === 'manager'
      ? allRequests.value.filter(r => isInManagerTeam(r.employee))
      : allRequests.value
  const viewRaw = requests.value

  const list = mergeAnnualPlanGroups(listRaw)
  const view = mergeAnnualPlanGroups(viewRaw)
  const total = view.length

  const pendingManagerRows = list.filter(r => r.status === 'pending_manager')
  const approvedByMgrRows = list.filter(r => r.status === 'approved_by_manager')
  const pendingGeneric = list.filter(r => r.status === 'pending')

  const approved = view.filter(r => r.status === 'approved' || r.status === 'confirmed')
  const rejected = view.filter(r => r.status === 'rejected')

  const daysPendingManager = pendingManagerRows.reduce((s, r) => s + r.days, 0)
  const inProgress =
    pendingManagerRows.length + approvedByMgrRows.length + pendingGeneric.length

  const approvedPct = total ? Math.round((approved.length / total) * 100) : 0
  const rejectedPct = total ? Math.round((rejected.length / total) * 100) : 0

  const pendingManagerOrg = mergeAnnualPlanGroups(
    allRequests.value.filter(r => r.status === 'pending_manager'),
  ).length
  const daysAwaitingHr = list
    .filter(r => r.status === 'approved_by_manager')
    .reduce((s, r) => s + r.days, 0)

  return {
    total,
    pendingManager: pendingManagerRows.length,
    approvedByManager: approvedByMgrRows.length,
    approved: approved.length,
    rejected: rejected.length,
    daysPendingManager,
    inProgress,
    approvedPct,
    rejectedPct,
    pendingManagerOrg,
    daysAwaitingHr,
  }
})

// ── Staff balance ────────────────────────────────────────────────────────
const plannedDays = computed(() =>
  allRequests.value
    .filter(r => r.employee === currentUser.value.name && r.status === 'planned' && r.type === 'Ежегодный')
    .reduce((sum, r) => sum + r.days, 0)
)
const remaining = computed(() => balance.value.total - balance.value.used - plannedDays.value)

/** Уже в статусе «запланировано» — для подсказки в модалке планирования */
const myPlannedRequests = computed(() =>
  allRequests.value.filter(r => r.employee === currentUser.value.name && r.status === 'planned'),
)

function todayIsoLocal() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function daysFromTodayToDate(iso) {
  const t = new Date(todayIsoLocal())
  const f = new Date(iso)
  return Math.round((f - t) / 86400000)
}

function pluralizeDaysRu(n) {
  const k = Math.abs(n) % 100
  const n1 = n % 10
  if (k > 10 && k < 20) return 'дней'
  if (n1 === 1) return 'день'
  if (n1 >= 2 && n1 <= 4) return 'дня'
  return 'дней'
}

/** Личный блок «сейчас / ближайшее отсутствие» на /vacations */
const MY_ABSENCE_STATUSES = ['planned', 'pending_manager', 'approved_by_manager', 'pending', 'approved', 'confirmed']

const mySpotlightRequests = computed(() =>
  requests.value.filter(r => r.status !== 'rejected' && MY_ABSENCE_STATUSES.includes(r.status)),
)

const myCurrentAbsence = computed(() => {
  const t = todayIsoLocal()
  return mySpotlightRequests.value.find(r => r.from <= t && r.to >= t) ?? null
})

const myNextAbsence = computed(() => {
  const t = todayIsoLocal()
  const future = mySpotlightRequests.value.filter(r => r.from > t)
  if (!future.length) return null
  return [...future].sort((a, b) => a.from.localeCompare(b.from))[0]
})

const daysLeftInCurrentAbsence = computed(() => {
  const r = myCurrentAbsence.value
  if (!r) return null
  const t = todayIsoLocal()
  if (t > r.to) return 0
  return daysBetween(t, r.to)
})

const daysUntilNextAbsence = computed(() => {
  const r = myNextAbsence.value
  if (!r) return null
  return daysFromTodayToDate(r.from)
})

function titleForCurrentAbsence(r) {
  if (!r) return ''
  if (r.type === 'Командировка') return 'Сейчас в командировке'
  if (r.type === 'Больничный') return 'Сейчас на больничном'
  if (r.type === 'Удалённая работа') return 'Сейчас в удалённой работе'
  if (r.type === 'Ежегодный') return 'Сейчас в отпуске'
  if (r.type === 'Компенсация') return 'Сейчас в отпуске (компенсация)'
  return 'Сейчас отсутствуете'
}

function titleForNextAbsence(r) {
  if (!r) return ''
  if (r.type === 'Командировка') return 'Ближайшая командировка'
  if (r.type === 'Больничный') return 'Ближайший больничный'
  if (r.type === 'Удалённая работа') return 'Ближайшая удалённая работа'
  if (r.type === 'Ежегодный') return 'Ближайший отпуск'
  if (r.type === 'Компенсация') return 'Ближайший отпуск (компенсация)'
  return 'Ближайшее отсутствие'
}

function isTripType(t) {
  return t === 'Командировка'
}

// ── Staff tabs ────────────────────────────────────────────────────────────
const staffTab = ref('calendar')

// ── Annual calendar ───────────────────────────────────────────────────────
const calYear = ref(new Date().getFullYear())

const yearMonths = computed(() =>
  Array.from({ length: 12 }, (_, m) => {
    const date  = new Date(calYear.value, m, 1)
    const total = new Date(calYear.value, m + 1, 0).getDate()
    let dow = date.getDay() - 1
    if (dow < 0) dow = 6
    const cells = []
    for (let i = 0; i < dow; i++) cells.push(null)
    for (let d = 1; d <= total; d++) {
      cells.push(`${calYear.value}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
    }
    return { title: MONTHS_RU[m], cells }
  })
)

function prevYear() { calYear.value-- }
function nextYear() { calYear.value++ }

function getMyRequestForCalendarDay(dateStr) {
  if (!dateStr) return null
  const myActive = allRequests.value.filter(
    r => r.employee === currentUser.value.name && r.status !== 'rejected',
  )
  for (const req of myActive) {
    if (dateStr >= req.from && dateStr <= req.to) return req
  }
  return null
}

function getPageDayMark(dateStr) {
  return getMyRequestForCalendarDay(dateStr)?.status ?? null
}

/** Подсказка при наведении на день в годовом календаре (floating-vue) */
function calendarDayTooltipContent(dateStr) {
  const req = getMyRequestForCalendarDay(dateStr)
  if (!req) return ''
  const st = statusLabel[req.status] ?? req.status
  return `${req.type}\n${st}\n${fmtDate(req.from)} — ${fmtDate(req.to)}\n${req.days} дн.`
}

function ymCellTooltipOptions(cell) {
  if (!cell || !getPageDayMark(cell)) return false
  return {
    content: calendarDayTooltipContent(cell),
    placement: 'top',
    delay: { show: 180, hide: 0 },
    triggers: ['hover', 'focus'],
  }
}


const MONTHS_RU = [
  'Январь','Февраль','Март','Апрель','Май','Июнь',
  'Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь',
]
const DAYS_SHORT = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс']

function isWeekend(dateStr) {
  if (!dateStr) return false
  const d = new Date(dateStr).getDay()
  return d === 0 || d === 6
}

// ── Vacation request (UC3) — имя заявителя = sessionUser (см. App.vue) ───

const substituteOptions = computed(() =>
  COLLEAGUES.filter(c => c.name !== currentUser.value.name),
)

const substituteIdOptions = computed(() => [
  { value: '', label: '— Не выбран —' },
  ...substituteOptions.value.map(c => ({ value: c.id, label: c.name })),
])

// ── Notification toast ────────────────────────────────────────────────────
const toastMsg = ref('')
let toastTimer = null
function notify(msg) {
  toastMsg.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => toastMsg.value = '', 4000)
}

onMounted(() => {
  try {
    const flash = sessionStorage.getItem(VACATION_REQUEST_FLASH_TOAST_KEY)
    if (flash) {
      notify(flash)
      sessionStorage.removeItem(VACATION_REQUEST_FLASH_TOAST_KEY)
    }
  } catch {
    /* ignore */
  }
})

// ── pendingOpen: drawer / модалка по CTA из bell (согласование — через drawer) ─
watch(pendingOpen, (val) => {
  if (!val) return
  const req = allRequests.value.find(r => r.id === val.id)
  if (!req) return
  if (val.action === 'approve')     openDrawer(req)
  if (val.action === 'hr_confirm')  openHrConfirm(req)
  pendingOpen.value = null
}, { immediate: true })

// ── HR/Admin actions ─────────────────────────────────────────────────────
function primaryPlanRequest(row) {
  if (row && row._segments && row._segments.length) return row._segments[0]
  return row
}

function approve(id) {
  const r = allRequests.value.find(x => x.id === id)
  if (!r) return
  const targets = annualLeaveSamePlanSegments(r).length ? annualLeaveSamePlanSegments(r) : [r]
  for (const t of targets) {
    const row = allRequests.value.find(x => x.id === t.id)
    if (row) row.status = 'approved'
  }
}
function reject(id) {
  const r = allRequests.value.find(x => x.id === id)
  if (!r) return
  const targets = annualLeaveSamePlanSegments(r).length ? annualLeaveSamePlanSegments(r) : [r]
  for (const t of targets) {
    const row = allRequests.value.find(x => x.id === t.id)
    if (row) row.status = 'rejected'
  }
}

function drawerHrApprove() {
  const id = drawerReq.value?.id
  if (id != null) approve(id)
  showDrawer.value = false
}
function drawerHrReject() {
  const id = drawerReq.value?.id
  if (id != null) reject(id)
  showDrawer.value = false
}

// ── Drawer ────────────────────────────────────────────────────────────────
const showDrawer = ref(false)
const drawerReq  = ref(null)

const drawerAnnualSegments = computed(() =>
  drawerReq.value ? annualLeaveSamePlanSegments(drawerReq.value) : [],
)

const drawerHeadRange = computed(() => {
  const segs = drawerAnnualSegments.value
  if (!drawerReq.value) return null
  if (segs.length <= 1) {
    return {
      from: drawerReq.value.from,
      to: drawerReq.value.to,
      days: drawerReq.value.days,
    }
  }
  const r = combinedDateRangeFromSegments(segs)
  const days = segs.reduce((s, x) => s + x.days, 0)
  return { ...r, days }
})

function openDrawer(req) {
  drawerReq.value = primaryPlanRequest(req)
  showDrawer.value = true
}

const APPROVAL_CHAIN = [
  { key: 'manager', initials: LINE_MANAGER.initials, name: LINE_MANAGER.name, role: LINE_MANAGER.role },
  { key: 'hr',      initials: 'ЗХ', name: 'Зарина Хасанова', role: 'HR-менеджер' },
]

const drawerActivitySteps = computed(() => {
  if (!drawerReq.value) return []
  const req      = drawerReq.value
  const activity = req.activity || []
  const byAction = (a) => activity.find(e => e.action === a)

  const submitted   = byAction('submitted')
  const mgApproved  = byAction('approved')
  const mgRejected  = byAction('rejected')
  const hrConfirmed = byAction('confirmed')
  const hrRejected  = byAction('hr_rejected')

  // Step 1 — submission
  const step1 = {
    label: 'Заявка подана',
    actor: submitted?.actor || req.employee,
    time:  submitted?.time  || null,
    note:  submitted?.note  || null,
    state: 'done',
    feedVariant: 'success',
    feedPerson: submitted?.actor || req.employee,
    feedAction: 'отправил заявку',
    feedMuted: false,
  }

  // Step 2 — manager
  let step2State = 'waiting'
  if (mgRejected)                                      step2State = 'rejected'
  else if (mgApproved)                                 step2State = 'done'
  else if (req.status === 'pending_manager')           step2State = 'pending'

  const role = activeRole.value
  const step2FeedAction =
    step2State === 'done'
      ? 'одобрил заявку'
      : step2State === 'rejected'
        ? 'отклонил заявку'
        : step2State === 'pending'
          ? 'ожидает решения руководителя'
          : 'этап согласования в очереди'

  const step2 = {
    label: step2State === 'done'     ? 'Одобрено руководителем'
         : step2State === 'rejected' ? 'Отклонено руководителем'
         : step2State === 'pending'  ? 'Ожидает руководителя'
         :                            'Согласование руководителя',
    actor: (mgApproved || mgRejected)?.actor || null,
    time:  (mgApproved || mgRejected)?.time  || null,
    note:  (mgApproved || mgRejected)?.note  || null,
    state: step2State,
    feedVariant:
      step2State === 'done'
        ? 'success'
        : step2State === 'rejected'
          ? 'danger'
          : step2State === 'pending'
            ? 'pending'
            : 'waiting',
    feedPerson: (mgApproved || mgRejected)?.actor || APPROVAL_CHAIN[0].name,
    feedAction: step2FeedAction,
    feedMuted: step2State === 'waiting',
    cta:
      step2State === 'pending' &&
      role === 'manager' &&
      req.status === 'pending_manager' &&
      isInManagerTeam(req.employee)
        ? { kind: 'manager', label: 'Рассмотреть' }
        : null,
  }

  // Step 3 — HR
  let step3State = 'waiting'
  if (hrRejected)                                      step3State = 'rejected'
  else if (hrConfirmed)                                step3State = 'done'
  else if (req.status === 'approved_by_manager')       step3State = 'pending'

  const step3FeedAction =
    step3State === 'done'
      ? 'подтвердил заявку'
      : step3State === 'rejected'
        ? 'отклонил заявку'
        : step3State === 'pending'
          ? 'ожидает подтверждения HR'
          : 'этап HR в очереди'

  const step3 = {
    label: step3State === 'done'     ? 'Подтверждено HR'
         : step3State === 'rejected' ? 'Отклонено HR'
         : step3State === 'pending'  ? 'Ожидает подтверждения HR'
         :                            'Подтверждение HR',
    actor: (hrConfirmed || hrRejected)?.actor || null,
    time:  (hrConfirmed || hrRejected)?.time  || null,
    note:  (hrConfirmed || hrRejected)?.note  || null,
    state: step3State,
    feedVariant:
      step3State === 'done'
        ? 'success'
        : step3State === 'rejected'
          ? 'danger'
          : step3State === 'pending'
            ? 'pending'
            : 'waiting',
    feedPerson: (hrConfirmed || hrRejected)?.actor || APPROVAL_CHAIN[1].name,
    feedAction: step3FeedAction,
    feedMuted: step3State === 'waiting',
    cta:
      step3State === 'pending' &&
      (role === 'hr' || role === 'admin') &&
      req.status === 'approved_by_manager'
        ? { kind: 'hr', label: 'Подтвердить' }
        : null,
  }

  return [step1, step2, step3]
})

function onDrawerStepCta(kind) {
  const req = drawerReq.value
  if (!req) return
  showDrawer.value = false
  if (kind === 'manager') openApproval(req)
  else if (kind === 'hr') openHrConfirm(req)
}

function empInitials(name) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('')
}

function empDeptLabel(name) {
  const e = EMPLOYEE_DATA[name]
  if (!e) return '—'
  return `${e.dept} · ${e.subdept}`
}

function getApproverStates(req) {
  const act = req.activity || []
  const mgDone     = act.some(a => a.role === 'manager' && a.action === 'approved')
  const mgRejected = act.some(a => a.role === 'manager' && a.action === 'rejected')
  const hrDone     = act.some(a => a.role === 'hr'      && a.action === 'confirmed')
  const hrRejected = act.some(a => a.role === 'hr'      && a.action === 'hr_rejected')

  const mgState =
    mgRejected ? 'rejected' :
    mgDone     ? 'done'     :
    req.status === 'pending_manager' ? 'active' : 'waiting'

  const hrState =
    hrRejected ? 'rejected' :
    hrDone     ? 'done'     :
    req.status === 'approved_by_manager' ? 'active' : 'waiting'

  return [
    { ...APPROVAL_CHAIN[0], state: mgState },
    { ...APPROVAL_CHAIN[1], state: hrState },
  ]
}

// ── Manager approval (UC4) ────────────────────────────────────────────────
const showApproval    = ref(false)
const approvalReq     = ref(null)
const showRejectInput = ref(false)
const rejectReason    = ref('')

const approvalEmp = computed(() =>
  approvalReq.value ? (EMPLOYEE_DATA[approvalReq.value.employee] || null) : null
)
const approvalAnnualSegments = computed(() =>
  approvalReq.value ? annualLeaveSamePlanSegments(approvalReq.value) : [],
)
const approvalAnnualTotalDays = computed(() => {
  const segs = approvalAnnualSegments.value
  if (!segs.length) return approvalReq.value?.days ?? 0
  return segs.reduce((s, r) => s + r.days, 0)
})
const approvalWorkloadRange = computed(() => {
  const req = approvalReq.value
  if (!req) return null
  const segs = approvalAnnualSegments.value
  if (segs.length <= 1) return { from: req.from, to: req.to }
  return combinedDateRangeFromSegments(segs)
})
const approvalBalance = computed(() => {
  if (!approvalEmp.value) return null
  const b = approvalEmp.value.balance
  const days = approvalAnnualTotalDays.value
  return { total: b.total, used: b.used, remaining: b.total - b.used - days }
})
const workloadPeers = computed(() => {
  if (!approvalReq.value) return []
  const req = approvalReq.value
  const range = approvalWorkloadRange.value
  if (!range) return []
  const peerIds = new Set(approvalAnnualSegments.value.map(r => r.id))
  return allRequests.value.filter(r =>
    !peerIds.has(r.id) &&
    r.employee !== req.employee &&
    (r.status === 'approved' || r.status === 'planned') &&
    hasOverlap(r.from, r.to, range.from, range.to)
  )
})
const substituteColleague = computed(() =>
  approvalReq.value?.substituteId
    ? COLLEAGUES.find(c => c.id === approvalReq.value.substituteId)
    : null
)

function openApproval(req) {
  approvalReq.value = req
  showRejectInput.value = false
  rejectReason.value = ''
  showApproval.value = true
}
function doApprove() {
  const req = approvalReq.value
  if (!req) return
  const segments = approvalAnnualSegments.value.length ? approvalAnnualSegments.value : [req]
  for (const seg of segments) {
    const r = allRequests.value.find(x => x.id === seg.id)
    if (r) {
      r.status = 'approved_by_manager'
      if (!r.activity) r.activity = []
      r.activity.push({ actor: 'Менеджер', role: 'manager', action: 'approved', time: new Date(), note: '' })
    }
  }
  showApproval.value = false
  const range = approvalWorkloadRange.value
  const totalDays = approvalAnnualTotalDays.value
  addNotification({
    title: 'Заявка ожидает подтверждения HR',
    body: `${req.employee} — ${fmtDate(range.from)}–${fmtDate(range.to)} · ${totalDays} дн.`,
    roles: ['hr', 'admin'],
    requestId: req.id,
    cta: 'Подтвердить',
    ctaAction: 'hr_confirm',
  })
  addNotification({
    title: 'Заявка одобрена руководителем',
    body: `Ваш отпуск ${fmtDate(range.from)}–${fmtDate(range.to)} передан на подтверждение HR`,
    roles: ['staff'],
    requestId: req.id,
    cta: null,
  })
  notify('Заявка утверждена менеджером. Передана на финальное подтверждение HR.')
}
function doReject() {
  const req = approvalReq.value
  if (!req) return
  const segments = approvalAnnualSegments.value.length ? approvalAnnualSegments.value : [req]
  for (const seg of segments) {
    const r = allRequests.value.find(x => x.id === seg.id)
    if (r) {
      r.status = 'rejected'
      r.rejectReason = rejectReason.value
      if (!r.activity) r.activity = []
      r.activity.push({ actor: 'Менеджер', role: 'manager', action: 'rejected', time: new Date(), note: rejectReason.value })
    }
  }
  showApproval.value = false
  const range = approvalWorkloadRange.value
  addNotification({
    title: 'Заявка отклонена',
    body: `Ваш отпуск ${fmtDate(range.from)}–${fmtDate(range.to)} отклонён руководителем`,
    roles: ['staff'],
    requestId: req.id,
    cta: null,
  })
  notify('Заявка отклонена.')
}

// ── HR final confirmation (UC5) ───────────────────────────────────────────
const showHrConfirm    = ref(false)
const hrConfirmReq     = ref(null)
const showHrRejectInput= ref(false)
const hrRejectReason   = ref('')

const hrConfirmAnnualSegments = computed(() =>
  hrConfirmReq.value ? annualLeaveSamePlanSegments(hrConfirmReq.value) : [],
)
const hrConfirmAnnualTotalDays = computed(() => {
  const segs = hrConfirmAnnualSegments.value
  if (!segs.length) return hrConfirmReq.value?.days ?? 0
  return segs.reduce((s, r) => s + r.days, 0)
})

const hrConfirmModalRange = computed(() => {
  const req = hrConfirmReq.value
  if (!req) return null
  const segs = hrConfirmAnnualSegments.value
  if (segs.length <= 1) return { from: req.from, to: req.to }
  return combinedDateRangeFromSegments(segs)
})

const hrConfirmChecks = computed(() => {
  if (!hrConfirmReq.value) return []
  const req = hrConfirmReq.value
  const emp = EMPLOYEE_DATA[req.employee]
  const avail = emp ? emp.balance.total - emp.balance.used : 0
  const daysNeeded = hrConfirmAnnualTotalDays.value
  const balanceOk = avail >= daysNeeded

  const range =
    hrConfirmAnnualSegments.value.length > 1
      ? combinedDateRangeFromSegments(hrConfirmAnnualSegments.value)
      : { from: req.from, to: req.to }
  const segmentIds = new Set(hrConfirmAnnualSegments.value.map(r => r.id))

  const conflicts = allRequests.value.filter(r =>
    !segmentIds.has(r.id) &&
    r.employee === req.employee &&
    (r.status === 'confirmed' || r.status === 'approved') &&
    hasOverlap(r.from, r.to, range.from, range.to)
  )

  const dept = emp?.dept
  const limitPct = DEPT_VACATION_COVERAGE_LIMIT_PERCENT
  const statusInDeptLoad = s => DEPT_LOAD_REQUEST_STATUSES.includes(s)
  let deptLoadRow = {
    label: 'Нагрузка отдела',
    ok: true,
    value: 'Нет данных по подразделению',
    blocksConfirmation: false,
  }
  if (dept) {
    const peak = peakDeptLoadFromNamedRequests({
      employeeData: EMPLOYEE_DATA,
      requests: allRequests.value,
      department: dept,
      rangeFrom: range.from,
      rangeTo: range.to,
      includeStatus: statusInDeptLoad,
    })
    const rounded = Math.round(peak.maxPercent * 10) / 10
    const over = peak.maxPercent > limitPct
    const headcount = Object.values(EMPLOYEE_DATA).filter(e => e.dept === dept).length
    deptLoadRow = {
      label: 'Нагрузка отдела',
      ok: !over,
      value: over
        ? `Предупреждение: до ${rounded}% штата в отпуске в один день (лимит ${limitPct}%)${peak.worstDay ? ` — напр. ${fmtDate(peak.worstDay)} (${peak.maxConcurrent}/${headcount} чел.)` : ''}`
        : `В пределах нормы — до ${rounded}% одновременно (лимит ${limitPct}%)`,
      blocksConfirmation: false,
    }
  }

  return [
    {
      label: 'Баланс',
      ok: balanceOk,
      value: balanceOk
        ? `Достаточно — доступно ${avail} дн., запрошено ${daysNeeded}`
        : `Недостаточно — доступно ${avail} дн., запрошено ${daysNeeded}`,
    },
    {
      label: 'Конфликт дат',
      ok: conflicts.length === 0,
      value: conflicts.length === 0
        ? 'Не обнаружен'
        : `Пересечение с ${conflicts.length} подтверждённой заявкой`,
    },
    deptLoadRow,
    {
      label: 'Тип отпуска',
      ok: true,
      value: req.type,
    },
  ]
})

const hrChecksAllOk = computed(() =>
  hrConfirmChecks.value.filter(c => c.blocksConfirmation !== false).every(c => c.ok),
)

function openHrConfirm(req) {
  hrConfirmReq.value = req
  showHrRejectInput.value = false
  hrRejectReason.value = ''
  showHrConfirm.value = true
}

function doHrConfirm() {
  const req = hrConfirmReq.value
  if (!req) return
  const segments = hrConfirmAnnualSegments.value.length ? hrConfirmAnnualSegments.value : [req]
  const totalDays = hrConfirmAnnualTotalDays.value
  const emp = EMPLOYEE_DATA[req.employee]
  for (const seg of segments) {
    const r = allRequests.value.find(x => x.id === seg.id)
    if (r) {
      r.status = 'confirmed'
      if (!r.activity) r.activity = []
      r.activity.push({ actor: 'HR Менеджер', role: 'hr', action: 'confirmed', time: new Date(), note: '' })
    }
  }
  if (emp) emp.balance.used += totalDays
  showHrConfirm.value = false
  const range =
    hrConfirmAnnualSegments.value.length > 1
      ? combinedDateRangeFromSegments(hrConfirmAnnualSegments.value)
      : { from: req.from, to: req.to }
  const orderNum = `АНТ-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`
  addNotification({
    title: 'Отпуск подтверждён',
    body: `Ваш отпуск ${fmtDate(range.from)}–${fmtDate(range.to)} официально подтверждён. Приказ ${orderNum}.`,
    roles: ['staff'],
    requestId: req.id,
    cta: null,
  })
  notify(`Приказ ${orderNum} создан в АНЕТ. Дни зарезервированы. Сотрудник уведомлён.`)
}

function doHrReject() {
  const req = hrConfirmReq.value
  if (!req) return
  const segments = hrConfirmAnnualSegments.value.length ? hrConfirmAnnualSegments.value : [req]
  for (const seg of segments) {
    const r = allRequests.value.find(x => x.id === seg.id)
    if (r) {
      r.status = 'rejected'
      r.rejectReason = hrRejectReason.value
      if (!r.activity) r.activity = []
      r.activity.push({ actor: 'HR Менеджер', role: 'hr', action: 'hr_rejected', time: new Date(), note: hrRejectReason.value })
    }
  }
  showHrConfirm.value = false
  const range =
    hrConfirmAnnualSegments.value.length > 1
      ? combinedDateRangeFromSegments(hrConfirmAnnualSegments.value)
      : { from: req.from, to: req.to }
  addNotification({
    title: 'Заявка отклонена HR',
    body: `Ваш отпуск ${fmtDate(range.from)}–${fmtDate(range.to)} отклонён службой HR`,
    roles: ['staff'],
    requestId: req.id,
    cta: null,
  })
  notify('Заявка отклонена HR.')
}
</script>

<template>
  <div class="vacations">

    <!-- ── Личные отпуска (все роли) — маршрут /vacations ─────────────── -->
    <template v-if="isPersonalVacationsRoute">

      <!-- Buttons teleported into App.vue page header -->
      <Teleport to="#page-header-inner">
        <div class="page-header-actions">
          <UiButton variant="secondary" type="button" @click="router.push({ name: 'vacations-plan' })">
            <Plus :size="13" stroke-width="2" />
            {{ myPlannedRequests.length ? 'Добавить в план' : 'Запланировать' }}
          </UiButton>
          <UiButton variant="primary" type="button" @click="router.push({ name: 'vacations-new' })">
            <Send :size="13" stroke-width="2" />
            Создать заявку
          </UiButton>
        </div>
      </Teleport>

      <div class="stats-grid">
        <div class="card stat-card">
          <div class="stat-top">
            <span class="stat-label">Всего дней</span>
            <CalendarDays :size="15" stroke-width="1.5" class="stat-icon" />
          </div>
          <div class="stat-value">{{ balance.total }}</div>
        </div>
        <div class="card stat-card">
          <div class="stat-top">
            <span class="stat-label">Использовано</span>
            <Minus :size="15" stroke-width="1.5" class="stat-icon" />
          </div>
          <div class="stat-value stat-value--muted">{{ balance.used }}</div>
          <div class="stat-sub">из {{ balance.total }}</div>
        </div>
        <div class="card stat-card">
          <div class="stat-top">
            <span class="stat-label">Запланировано</span>
            <ClipboardList :size="15" stroke-width="1.5" class="stat-icon" />
          </div>
          <div class="stat-value stat-value--blue">{{ plannedDays }}</div>
          <div class="stat-sub">из {{ balance.total }}</div>
        </div>
        <div class="card stat-card">
          <div class="stat-top">
            <span class="stat-label">Доступно</span>
            <CheckCircle2 :size="15" stroke-width="1.5" class="stat-icon" />
          </div>
          <div class="stat-value stat-value--green">{{ remaining }}</div>
        </div>
      </div>

      <div
        v-if="vacationPlanFlash"
        class="vacation-plan-flash"
        role="alert"
      >
        <CheckCircle2 :size="18" stroke-width="1.75" class="vacation-plan-flash__ic" aria-hidden="true" />
        <div class="vacation-plan-flash__body">
          <div class="vacation-plan-flash__title">Вы запланировали ежегодный отпуск</div>
          <div class="vacation-plan-flash__meta">
            {{ fmtDate(vacationPlanFlash.from) }} — {{ fmtDate(vacationPlanFlash.to) }}
          </div>
        </div>
        <div class="vacation-plan-flash__actions">
          <UiButton variant="secondary" type="button" @click="editVacationPlanFromFlash">
            Изменить
          </UiButton>
          <UiIconButton
            type="button"
            size="sm"
            aria-label="Закрыть уведомление"
            @click="dismissVacationPlanFlash"
          >
            <X :size="16" stroke-width="2" />
          </UiIconButton>
        </div>
      </div>

      <!-- Текущее / ближайшее отсутствие — alert, без вложенной карточки -->
      <div v-if="myCurrentAbsence || myNextAbsence" class="vacation-absence-alerts" role="status">
        <div
          v-if="myCurrentAbsence"
          class="vacation-absence-alert vacation-absence-alert--current"
          :class="{ 'vacation-absence-alert--trip': isTripType(myCurrentAbsence.type) }"
        >
          <Briefcase v-if="isTripType(myCurrentAbsence.type)" :size="18" stroke-width="1.75" class="vacation-absence-alert__ic" aria-hidden="true" />
          <Palmtree v-else :size="18" stroke-width="1.75" class="vacation-absence-alert__ic" aria-hidden="true" />
          <div class="vacation-absence-alert__body">
            <div class="vacation-absence-alert__title">{{ titleForCurrentAbsence(myCurrentAbsence) }}</div>
            <div class="vacation-absence-alert__meta">
              {{ myCurrentAbsence.type }} · {{ fmtDate(myCurrentAbsence.from) }} — {{ fmtDate(myCurrentAbsence.to) }}
              · {{ myCurrentAbsence.days }} дн.
              <span v-if="daysLeftInCurrentAbsence != null">
                · осталось {{ daysLeftInCurrentAbsence }} {{ pluralizeDaysRu(daysLeftInCurrentAbsence) }}
              </span>
            </div>
          </div>
        </div>
        <div
          v-if="myNextAbsence && (!myCurrentAbsence || myNextAbsence.id !== myCurrentAbsence.id)"
          class="vacation-absence-alert vacation-absence-alert--next"
          :class="{ 'vacation-absence-alert--trip': isTripType(myNextAbsence.type) }"
        >
          <Briefcase v-if="isTripType(myNextAbsence.type)" :size="18" stroke-width="1.75" class="vacation-absence-alert__ic" aria-hidden="true" />
          <CalendarDays v-else :size="18" stroke-width="1.75" class="vacation-absence-alert__ic vacation-absence-alert__ic--next" aria-hidden="true" />
          <div class="vacation-absence-alert__body">
            <div class="vacation-absence-alert__title">{{ titleForNextAbsence(myNextAbsence) }}</div>
            <div class="vacation-absence-alert__meta">
              {{ myNextAbsence.type }} · {{ fmtDate(myNextAbsence.from) }} — {{ fmtDate(myNextAbsence.to) }}
              · {{ myNextAbsence.days }} дн.
              <span v-if="daysUntilNextAbsence != null && daysUntilNextAbsence > 0">
                · через {{ daysUntilNextAbsence }} {{ pluralizeDaysRu(daysUntilNextAbsence) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Staff tabs -->
      <UiPillTabs v-model="staffTab" class="vacations-page-tabs">
        <UiPillTab id="calendar">Календарь</UiPillTab>
        <UiPillTab
          id="team"
          title="Кто в отпуске, на больничном, удалённо, в командировке"
        >
          <Users :size="14" stroke-width="2" class="ui-pill-tab__ic" />
          Команда
        </UiPillTab>
        <UiPillTab id="requests" :badge="staffRequestsDisplayRows.length">
          Заявки
        </UiPillTab>
      </UiPillTabs>

      <!-- ── Team calendar (Gantt) ── -->
      <TeamAbsenceCalendar v-if="staffTab === 'team'" />

      <!-- ── Calendar tab ── -->
      <template v-if="staffTab === 'calendar'">
        <div class="card year-cal-card">
          <!-- Year nav -->
          <div class="year-cal-nav">
            <UiIconButton type="button" size="nav" aria-label="Предыдущий год" @click="prevYear">
              <ChevronLeft :size="14" stroke-width="2" />
            </UiIconButton>
            <span class="year-label">{{ calYear }}</span>
            <UiIconButton type="button" size="nav" aria-label="Следующий год" @click="nextYear">
              <ChevronRight :size="14" stroke-width="2" />
            </UiIconButton>
          </div>

          <div class="year-cal-legend">
            <span class="legend-item"><span class="legend-dot approved"></span>Одобрено / подтверждено</span>
            <span class="legend-item"><span class="legend-dot pending"></span>На рассмотрении</span>
            <span class="legend-item"><span class="legend-dot planned"></span>Запланировано</span>
          </div>

          <!-- 12 months grid -->
          <div class="year-months-grid">
            <div v-for="mo in yearMonths" :key="mo.title" class="ym-month">
              <div class="ym-title">{{ mo.title }}</div>
              <div class="ym-grid">
                <div v-for="day in DAYS_SHORT" :key="day" class="ym-dow">{{ day }}</div>
                <div
                  v-for="(cell, i) in mo.cells"
                  :key="i"
                  class="ym-cell"
                  :class="[
                    getPageDayMark(cell) ? `mark-${getPageDayMark(cell)}` : '',
                    isWeekend(cell) ? 'weekend' : '',
                    !cell ? 'empty' : '',
                  ]"
                  v-tooltip="ymCellTooltipOptions(cell)"
                >
                  <span v-if="cell" class="ym-day-num">{{ cell.split('-')[2].replace(/^0/, '') }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- ── Requests tab ── -->
      <template v-if="staffTab === 'requests'">
        <div class="card table-card">
          <table class="data-table">
            <thead>
              <tr>
                <th>Тип</th>
                <th>С</th>
                <th>По</th>
                <th class="align-right">Дней</th>
                <th class="align-center col-parts">Частей</th>
                <th>Маршрут</th>
                <th class="align-right">Статус</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in staffRequestsDisplayRows" :key="row.id" class="row-clickable" @click="openDrawer(row)">
                <td class="col-muted">{{ row.type }}</td>
                <td class="col-date col-muted">{{ row.partCount > 1 ? '—' : fmtDate(row.from) }}</td>
                <td class="col-date col-muted">{{ row.partCount > 1 ? '—' : fmtDate(row.to) }}</td>
                <td class="align-right col-muted">{{ row.days }}</td>
                <td class="align-center col-parts col-muted">{{ row.partCount }}</td>
                <td>
                  <div class="approver-chain">
                    <div
                      v-for="ap in getApproverStates(primaryPlanRequest(row))"
                      :key="ap.key"
                      :class="['approver-av', `approver-av--${ap.state}`]"
                      :title="`${ap.name} (${ap.role})`"
                    >{{ ap.initials }}</div>
                  </div>
                </td>
                <td class="align-right">
                  <StatusBadge :status="row.status" :label="statusLabel[row.status]" />
                </td>
              </tr>
              <tr v-if="staffRequestsDisplayRows.length === 0">
                <td colspan="7" class="empty-row">Заявок пока нет</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

    </template>

    <!-- ── Согласования — маршрут /vacations/approvals (рук. / HR / админ) ─ -->
    <template v-else-if="isApprovalsRoute && (isManager || isHrOrAdmin)">

      <Teleport to="#page-header-inner">
        <div v-if="isHrOrAdmin && activeTab === 'requests'" class="page-header-actions">
          <UiButton variant="primary" type="button">
            <Plus :size="13" stroke-width="2" />
            Новая заявка
          </UiButton>
        </div>
      </Teleport>

      <!-- Tab bar: только HR / админ (у руководителя — сразу список заявок) -->
      <UiPillTabs v-if="isHrOrAdmin" v-model="activeTab" class="vacations-page-tabs">
        <UiPillTab id="dashboard">Дашборд</UiPillTab>
        <UiPillTab id="requests">Заявки</UiPillTab>
        <UiPillTab id="planning">Планирование</UiPillTab>
      </UiPillTabs>

      <!-- HR: сводка «кто сегодня в отпуске» — на главной; здесь только ссылка (UX: не дублировать блоки) -->
      <div v-if="isHrOrAdmin && showRequestsPanel" class="approvals-hint-banner">
        <span class="approvals-hint-banner__text">
          Сводка «кто сегодня в отпуске» — на
          <button type="button" class="approvals-hint-link" @click="goDashboardHrToday">главной странице</button>.
          Здесь — очереди и реестр заявок.
        </span>
      </div>

      <!-- ── Requests (руководитель + вкладка «Заявки» у HR) ── -->
      <template v-if="showRequestsPanel">
      <UiPillTabs
        v-if="isManager"
        v-model="managerApprovalStatusTab"
        class="vacations-page-tabs manager-approvals-tabs"
      >
        <UiPillTab id="all" :badge="managerTabCounts.all" :hide-badge-when-zero="false">Все</UiPillTab>
        <UiPillTab id="pending" :badge="managerTabCounts.pending">Ожидают</UiPillTab>
        <UiPillTab id="approved" :badge="managerTabCounts.approved">Согласовано</UiPillTab>
        <UiPillTab id="rejected" :badge="managerTabCounts.rejected">Отклонено</UiPillTab>
      </UiPillTabs>

      <div class="vacations-header">
        <div class="stats-grid">
          <div v-if="isManager" class="card stat-card">
            <div class="stat-top">
              <span class="stat-label">К вам</span>
              <Clock :size="15" stroke-width="1.5" class="stat-icon" />
            </div>
            <div class="stat-value" :class="{ 'stat-value--purple': summary.pendingManager }">{{ summary.pendingManager }}</div>
            <div class="stat-sub">{{ summary.daysPendingManager ? `${summary.daysPendingManager} дн. в запросах` : '—' }}</div>
          </div>
          <div v-else-if="isHrOrAdmin" class="card stat-card">
            <div class="stat-top">
              <span class="stat-label">Ждут HR</span>
              <ShieldCheck :size="15" stroke-width="1.5" class="stat-icon" />
            </div>
            <div class="stat-value" :class="{ 'stat-value--teal': summary.approvedByManager }">{{ summary.approvedByManager }}</div>
            <div class="stat-sub">{{ summary.daysAwaitingHr ? `${summary.daysAwaitingHr} дн.` : '—' }}</div>
          </div>

          <div class="card stat-card">
            <div class="stat-top">
              <span class="stat-label">{{ isManager ? 'Команда' : 'Всего' }}</span>
              <ClipboardList :size="15" stroke-width="1.5" class="stat-icon" />
            </div>
            <div class="stat-value">{{ summary.total }}</div>
            <div class="stat-sub">
              <template v-if="isManager">в работе {{ summary.inProgress }}<template v-if="summary.approvedByManager"> · у HR {{ summary.approvedByManager }}</template></template>
              <template v-else-if="isHrOrAdmin">в работе {{ summary.inProgress }}<template v-if="summary.pendingManagerOrg"> · у рук. {{ summary.pendingManagerOrg }}</template></template>
            </div>
          </div>
          <div class="card stat-card">
            <div class="stat-top">
              <span class="stat-label">Одобрено</span>
              <CheckCircle2 :size="15" stroke-width="1.5" class="stat-icon" />
            </div>
            <div class="stat-value stat-value--green">{{ summary.approved }}</div>
            <div class="stat-sub">{{ summary.approvedPct }}% заявок</div>
          </div>
          <div class="card stat-card">
            <div class="stat-top">
              <span class="stat-label">Отклонено</span>
              <Ban :size="15" stroke-width="1.5" class="stat-icon" />
            </div>
            <div class="stat-value stat-value--red">{{ summary.rejected }}</div>
            <div class="stat-sub">{{ summary.rejectedPct }}%</div>
          </div>
        </div>
      </div>

      <!-- HR final confirmation queue (только HR / админ) -->
      <div v-if="isHrOrAdmin && summary.approvedByManager" class="card approval-queue-card hr-queue-card">
        <div class="aq-title aq-title-hr">Утверждены менеджером — ожидают финального подтверждения HR</div>
        <div class="aq-list">
          <div v-for="r in hrQueueApprovedByManager" :key="r.id" class="aq-row aq-row-hr">
            <div class="aq-emp">
              <div class="aq-avatar aq-avatar-hr">{{ empInitials(r.employee) }}</div>
              <div class="aq-emp-info">
                <div class="aq-emp-name">{{ r.employee }}</div>
                <div class="aq-emp-meta">{{ EMPLOYEE_DATA[r.employee]?.dept }} · {{ EMPLOYEE_DATA[r.employee]?.position }}</div>
              </div>
            </div>
            <div class="aq-dates">{{ r.partCount > 1 ? '—' : `${fmtDate(r.from)} — ${fmtDate(r.to)}` }}</div>
            <div class="aq-type">{{ r.type }}</div>
            <div class="aq-parts" :title="r.partCount > 1 ? 'Частей в плане' : ''">{{ r.partCount > 1 ? `${r.partCount} ч.` : '—' }}</div>
            <div class="aq-days">{{ r.days }} дн.</div>
            <button class="btn-review btn-review-hr" @click="openHrConfirm(primaryPlanRequest(r))">Подтвердить</button>
          </div>
        </div>
      </div>

      <div class="card table-card">
        <UiTableToolbar aria-label="Поиск и фильтры заявок">
          <template #search>
            <UiSearchField
              v-model="approvalsSearchQuery"
              placeholder="Сотрудник, должность, отдел, статус…"
              autocomplete="off"
            />
          </template>
          <template #filters>
            <UiDateRangeInput v-model="approvalsDateRange" />
            <label v-if="!isManager" class="visually-hidden">Статус</label>
            <UiSelect
              v-if="!isManager"
              v-model="approvalsStatusFilter"
              class="vacations-toolbar-select"
              :options="approvalsStatusOptions"
            />
            <label class="visually-hidden">Отдел</label>
            <UiSelect
              v-model="approvalsDeptFilter"
              class="vacations-toolbar-select"
              :options="approvalsDeptOptions"
            />
          </template>
        </UiTableToolbar>
        <table class="data-table">
          <thead>
            <tr>
              <th>Сотрудник</th>
              <th>Отдел</th>
              <th>С</th>
              <th>По</th>
              <th class="align-right">Дней</th>
              <th class="align-center">Частей</th>
              <th class="align-right">Статус</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in approvalsDisplayRows" :key="row.id" class="row-clickable" @click="openDrawer(row)">
              <td class="col-emp">
                <div class="approvals-emp-cell">
                  <div class="approvals-emp-avatar" aria-hidden="true">{{ empInitials(row.employee) }}</div>
                  <div class="approvals-emp-text">
                    <div class="approvals-emp-name">{{ row.employee }}</div>
                    <div class="approvals-emp-position">{{ EMPLOYEE_DATA[row.employee]?.position || '—' }}</div>
                  </div>
                </div>
              </td>
              <td class="col-muted">{{ empDeptLabel(row.employee) }}</td>
              <td class="col-date col-muted">{{ row.partCount > 1 ? '—' : fmtDate(row.from) }}</td>
              <td class="col-date col-muted">{{ row.partCount > 1 ? '—' : fmtDate(row.to) }}</td>
              <td class="align-right col-muted">{{ row.days }}</td>
              <td class="align-center col-muted">{{ row.partCount }}</td>
              <td class="align-right">
                <StatusBadge
                  :status="row.status"
                  :label="isManager ? managerApprovalsStatusLabel(row.status) : statusLabel[row.status]"
                />
              </td>
            </tr>
            <tr v-if="approvalsDisplayRows.length === 0">
              <td colspan="7" class="empty-row">Ничего не найдено — измените поиск или фильтры.</td>
            </tr>
          </tbody>
        </table>
      </div>
      </template>

      <!-- ── HR: дашборд планирования (только роль HR) ── -->
      <VacationHrDashboard v-else-if="isHrOrAdmin && activeTab === 'dashboard'" />

      <!-- ── Planning tab (только HR / админ) ── -->
      <VacationPlanning v-else-if="isHrOrAdmin && activeTab === 'planning'" />

    </template>

    <!-- ── Drawer ────────────────────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="drawer">
        <div v-if="showDrawer && drawerReq" class="drawer-overlay" @click.self="showDrawer = false">
          <div class="drawer-panel">

            <!-- Header -->
            <div class="drawer-header">
              <div class="drawer-header-left">
                <span class="drawer-title">Заявка на отпуск</span>
                <StatusBadge :status="drawerReq.status" :label="statusLabel[drawerReq.status]" />
              </div>
              <UiIconButton type="button" size="sm" aria-label="Закрыть" @click="showDrawer = false"><X :size="14" stroke-width="2" /></UiIconButton>
            </div>

            <!-- Body -->
            <div class="drawer-body">

              <!-- Employee -->
              <div class="drawer-emp">
                <div class="drawer-emp-avatar">{{ empInitials(drawerReq.employee) }}</div>
                <div class="drawer-emp-info">
                  <div class="drawer-emp-name">{{ drawerReq.employee }}</div>
                  <div class="drawer-emp-meta">{{ EMPLOYEE_DATA[drawerReq.employee]?.dept }} · {{ EMPLOYEE_DATA[drawerReq.employee]?.position }}</div>
                </div>
              </div>

              <!-- Одна часть: даты в сетке. Несколько частей: только тип, всего дней и список частей (без «С—По» целиком). -->
              <div v-if="drawerAnnualSegments.length <= 1" class="drawer-details">
                <div class="drawer-detail">
                  <div class="drawer-detail-label">С</div>
                  <div class="drawer-detail-val">{{ fmtDate(drawerReq.from) }}</div>
                </div>
                <div class="drawer-detail">
                  <div class="drawer-detail-label">По</div>
                  <div class="drawer-detail-val">{{ fmtDate(drawerReq.to) }}</div>
                </div>
                <div class="drawer-detail">
                  <div class="drawer-detail-label">Дней</div>
                  <div class="drawer-detail-val">{{ drawerReq.days }}</div>
                </div>
                <div class="drawer-detail">
                  <div class="drawer-detail-label">Тип</div>
                  <div class="drawer-detail-val">{{ drawerReq.type }}</div>
                </div>
              </div>
              <div v-else class="drawer-details drawer-details--compact">
                <div class="drawer-detail">
                  <div class="drawer-detail-label">Тип</div>
                  <div class="drawer-detail-val">{{ drawerReq.type }}</div>
                </div>
                <div class="drawer-detail">
                  <div class="drawer-detail-label">Всего дней</div>
                  <div class="drawer-detail-val">{{ drawerHeadRange.days }}</div>
                </div>
              </div>

              <div
                v-if="drawerAnnualSegments.length > 1"
                class="drawer-plan-parts"
              >
                <div class="drawer-plan-parts-title">Части плана</div>
                <ul class="drawer-plan-parts-list" role="list">
                  <li
                    v-for="seg in drawerAnnualSegments"
                    :key="seg.id"
                    class="drawer-plan-part"
                  >
                    <span class="drawer-plan-part-dates">{{ fmtDate(seg.from) }} — {{ fmtDate(seg.to) }}</span>
                    <span class="drawer-plan-part-days">{{ seg.days }} дн.</span>
                  </li>
                </ul>
              </div>

              <!-- Comment -->
              <div v-if="drawerReq.comment" class="drawer-comment">
                <div class="drawer-comment-label">Комментарий</div>
                <div class="drawer-comment-text">{{ drawerReq.comment }}</div>
              </div>

              <!-- Reject reason -->
              <div v-if="drawerReq.rejectReason" class="drawer-comment drawer-reject">
                <div class="drawer-comment-label">Причина отклонения</div>
                <div class="drawer-comment-text">{{ drawerReq.rejectReason }}</div>
              </div>

              <!-- Activity feed -->
              <ActivityFeed title="Процесс утверждения">
                <ActivityFeedItem
                  v-for="(step, i) in drawerActivitySteps"
                  :key="i"
                  :variant="step.feedVariant"
                  :person-name="step.feedPerson"
                  :action="step.feedAction"
                  :time="step.time"
                  :comment="step.note || ''"
                  :is-last="i === drawerActivitySteps.length - 1"
                  :muted="step.feedMuted"
                >
                  <template v-if="step.cta">
                    <div class="act-cta">
                      <button
                        type="button"
                        class="btn-act-cta"
                        :class="{ 'btn-act-cta--hr': step.cta.kind === 'hr' }"
                        @click.stop="onDrawerStepCta(step.cta.kind)"
                      >
                        {{ step.cta.label }}
                      </button>
                    </div>
                  </template>
                </ActivityFeedItem>
              </ActivityFeed>

            </div>

            <!-- Действия HR: только заявки «На рассмотрении» (без кнопок в таблице) -->
            <div
              v-if="isHrOrAdmin && drawerReq.status === 'pending'"
              class="drawer-footer"
            >
              <UiButton variant="reject" @click="drawerHrReject">
                <X :size="13" stroke-width="2" /> Отклонить
              </UiButton>
              <UiButton variant="primary" @click="drawerHrApprove">
                <Check :size="13" stroke-width="2" /> Одобрить
              </UiButton>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Approval modal (UC4) ─────────────────────────────────────── -->
    <Teleport to="body">
      <div v-if="showApproval && approvalReq" class="modal-overlay" @click.self="showApproval = false">
        <div class="modal modal-wide hr-confirm-modal">

          <div class="modal-header">
            <span class="modal-title">Согласование заявки</span>
            <UiIconButton type="button" size="sm" aria-label="Закрыть" @click="showApproval = false"><X :size="14" stroke-width="2" /></UiIconButton>
          </div>

          <div class="modal-body hr-confirm-body">

            <div class="hr-confirm-head">
              <div class="hr-confirm-emp">
                <div class="ap-avatar">{{ empInitials(approvalReq.employee) }}</div>
                <div class="hr-confirm-emp-text">
                  <div class="hr-confirm-name">{{ approvalReq.employee }}</div>
                  <div class="hr-confirm-meta">
                    {{ approvalEmp?.dept }} · {{ approvalEmp?.subdept }}
                  </div>
                  <div class="hr-confirm-pos">{{ approvalEmp?.position }}</div>
                </div>
              </div>
              <div v-if="substituteColleague" class="ap-sub">
                <span class="ap-sub-label">Замещает</span>
                <span class="ap-sub-name">{{ substituteColleague.name }}</span>
              </div>
            </div>

            <div class="hr-confirm-section">
              <div class="hr-confirm-section-title">Параметры отпуска</div>
              <div v-if="approvalAnnualSegments.length <= 1" class="hr-confirm-grid">
                <div class="hr-confirm-cell">
                  <span class="hr-confirm-label">Тип</span>
                  <span class="hr-confirm-val">{{ approvalReq.type }}</span>
                </div>
                <div class="hr-confirm-cell">
                  <span class="hr-confirm-label">С</span>
                  <span class="hr-confirm-val">{{ fmtDate(approvalWorkloadRange.from) }}</span>
                </div>
                <div class="hr-confirm-cell">
                  <span class="hr-confirm-label">По</span>
                  <span class="hr-confirm-val">{{ fmtDate(approvalWorkloadRange.to) }}</span>
                </div>
                <div class="hr-confirm-cell">
                  <span class="hr-confirm-label">Дней</span>
                  <span class="hr-confirm-val">{{ approvalAnnualTotalDays }}</span>
                </div>
              </div>
              <div v-else class="hr-confirm-grid hr-confirm-grid--twocol">
                <div class="hr-confirm-cell">
                  <span class="hr-confirm-label">Тип</span>
                  <span class="hr-confirm-val">{{ approvalReq.type }}</span>
                </div>
                <div class="hr-confirm-cell">
                  <span class="hr-confirm-label">Всего дней</span>
                  <span class="hr-confirm-val">{{ approvalAnnualTotalDays }}</span>
                </div>
              </div>
              <div v-if="approvalAnnualSegments.length > 1" class="hr-confirm-plan-parts">
                <div class="hr-confirm-section-title hr-confirm-section-title--inline">Части плана</div>
                <ul class="drawer-plan-parts-list" role="list">
                  <li
                    v-for="seg in approvalAnnualSegments"
                    :key="seg.id"
                    class="drawer-plan-part"
                  >
                    <span class="drawer-plan-part-dates">{{ fmtDate(seg.from) }} — {{ fmtDate(seg.to) }}</span>
                    <span class="drawer-plan-part-days">{{ seg.days }} дн.</span>
                  </li>
                </ul>
              </div>
              <div v-if="approvalReq.comment" class="hr-confirm-comment">
                <span class="hr-confirm-label">Комментарий</span>
                <p class="hr-confirm-comment-text">{{ approvalReq.comment }}</p>
              </div>
            </div>

            <div v-if="approvalBalance" class="hr-confirm-section">
              <div class="hr-confirm-section-title">Баланс сотрудника</div>
              <div class="ap-balance">
                <div class="ap-bal-item">
                  <div class="ap-bal-val">{{ approvalBalance.total }}</div>
                  <div class="ap-bal-label">Всего дней</div>
                </div>
                <div class="ap-bal-item">
                  <div class="ap-bal-val used">{{ approvalEmp.balance.used }}</div>
                  <div class="ap-bal-label">Использовано</div>
                </div>
                <div class="ap-bal-item">
                  <div class="ap-bal-val" :class="approvalBalance.remaining >= 0 ? 'green' : 'red'">
                    {{ approvalBalance.remaining }}
                  </div>
                  <div class="ap-bal-label">После отпуска</div>
                </div>
              </div>
            </div>

            <div class="hr-confirm-section hr-confirm-section--checks">
              <div class="hr-confirm-section-title">План загрузки в этот период</div>
              <div v-if="workloadPeers.length" class="ap-peers">
                <div v-for="p in workloadPeers" :key="p.id" class="ap-peer">
                  <span class="ap-peer-name">{{ p.employee }}</span>
                  <span class="ap-peer-dates">{{ fmtDate(p.from) }} — {{ fmtDate(p.to) }}</span>
                  <StatusBadge :status="p.status" :label="statusLabel[p.status]" small />
                </div>
              </div>
              <div v-else class="ap-peers-empty">Команда свободна в этот период</div>
            </div>

            <div v-if="showRejectInput" class="hr-confirm-reject">
              <div class="form-group">
                <label class="form-label">Причина отказа</label>
                <UiTextarea v-model="rejectReason" rows="3" placeholder="Укажите причину..." />
              </div>
            </div>

          </div>

          <div class="modal-footer">
            <template v-if="!showRejectInput">
              <UiButton variant="reject" @click="showRejectInput = true">
                <X :size="13" stroke-width="2" /> Отклонить
              </UiButton>
              <UiButton variant="primary" @click="doApprove">
                <Check :size="13" stroke-width="2" /> Утвердить
              </UiButton>
            </template>
            <template v-else>
              <UiButton variant="secondary" @click="showRejectInput = false">Назад</UiButton>
              <UiButton variant="danger" @click="doReject">Подтвердить отказ</UiButton>
            </template>
          </div>

        </div>
      </div>
    </Teleport>

    <!-- ── HR confirmation modal (UC5) ──────────────────────────────── -->
    <Teleport to="body">
      <div v-if="showHrConfirm && hrConfirmReq" class="modal-overlay" @click.self="showHrConfirm = false">
        <div class="modal modal-wide hr-confirm-modal">

          <div class="modal-header">
            <span class="modal-title">Финальное подтверждение HR</span>
            <UiIconButton type="button" size="sm" aria-label="Закрыть" @click="showHrConfirm = false"><X :size="14" stroke-width="2" /></UiIconButton>
          </div>

          <div class="modal-body hr-confirm-body">

              <div class="hr-confirm-head">
                <div class="hr-confirm-emp">
                  <div class="hr-confirm-avatar">{{ empInitials(hrConfirmReq.employee) }}</div>
                  <div class="hr-confirm-emp-text">
                    <div class="hr-confirm-name">{{ hrConfirmReq.employee }}</div>
                    <div class="hr-confirm-meta">
                      {{ EMPLOYEE_DATA[hrConfirmReq.employee]?.dept }} · {{ EMPLOYEE_DATA[hrConfirmReq.employee]?.subdept }}
                    </div>
                    <div class="hr-confirm-pos">{{ EMPLOYEE_DATA[hrConfirmReq.employee]?.position }}</div>
                  </div>
                </div>
                <StatusBadge status="approved_by_manager" :label="statusLabel.approved_by_manager" />
              </div>

              <div class="hr-confirm-section">
                <div class="hr-confirm-section-title">Параметры отпуска</div>
                <div v-if="hrConfirmAnnualSegments.length <= 1" class="hr-confirm-grid">
                  <div class="hr-confirm-cell">
                    <span class="hr-confirm-label">Тип</span>
                    <span class="hr-confirm-val">{{ hrConfirmReq.type }}</span>
                  </div>
                  <div class="hr-confirm-cell">
                    <span class="hr-confirm-label">С</span>
                    <span class="hr-confirm-val">{{ fmtDate(hrConfirmModalRange.from) }}</span>
                  </div>
                  <div class="hr-confirm-cell">
                    <span class="hr-confirm-label">По</span>
                    <span class="hr-confirm-val">{{ fmtDate(hrConfirmModalRange.to) }}</span>
                  </div>
                  <div class="hr-confirm-cell">
                    <span class="hr-confirm-label">Дней</span>
                    <span class="hr-confirm-val">{{ hrConfirmAnnualTotalDays }}</span>
                  </div>
                </div>
                <div v-else class="hr-confirm-grid hr-confirm-grid--twocol">
                  <div class="hr-confirm-cell">
                    <span class="hr-confirm-label">Тип</span>
                    <span class="hr-confirm-val">{{ hrConfirmReq.type }}</span>
                  </div>
                  <div class="hr-confirm-cell">
                    <span class="hr-confirm-label">Всего дней</span>
                    <span class="hr-confirm-val">{{ hrConfirmAnnualTotalDays }}</span>
                  </div>
                </div>
                <div v-if="hrConfirmAnnualSegments.length > 1" class="hr-confirm-plan-parts">
                  <div class="hr-confirm-section-title hr-confirm-section-title--inline">Части плана</div>
                  <ul class="drawer-plan-parts-list" role="list">
                    <li
                      v-for="seg in hrConfirmAnnualSegments"
                      :key="seg.id"
                      class="drawer-plan-part"
                    >
                      <span class="drawer-plan-part-dates">{{ fmtDate(seg.from) }} — {{ fmtDate(seg.to) }}</span>
                      <span class="drawer-plan-part-days">{{ seg.days }} дн.</span>
                    </li>
                  </ul>
                </div>
                <div v-if="hrConfirmReq.comment" class="hr-confirm-comment">
                  <span class="hr-confirm-label">Комментарий</span>
                  <p class="hr-confirm-comment-text">{{ hrConfirmReq.comment }}</p>
                </div>
              </div>

              <div class="hr-confirm-section hr-confirm-section--checks">
                <div class="hr-confirm-section-title">Проверка перед подтверждением</div>
                <ul class="hr-confirm-checklist">
                  <li
                    v-for="c in hrConfirmChecks"
                    :key="c.label"
                    class="hr-confirm-checkitem"
                    :class="c.ok ? 'is-ok' : (c.blocksConfirmation === false ? 'is-warn' : 'is-fail')"
                  >
                    <CheckCircle2 v-if="c.ok" :size="16" stroke-width="2" class="hr-cc-ic ok" />
                    <AlertTriangle v-else-if="c.blocksConfirmation === false" :size="16" stroke-width="2" class="hr-cc-ic warn" />
                    <AlertCircle v-else :size="16" stroke-width="2" class="hr-cc-ic fail" />
                    <div class="hr-cc-body">
                      <span class="hr-cc-title">{{ c.label }}</span>
                      <span class="hr-cc-detail">{{ c.value }}</span>
                    </div>
                  </li>
                </ul>
              </div>

            <!-- Reject reason -->
            <div v-if="showHrRejectInput" class="hr-confirm-reject">
              <div class="form-group">
                <label class="form-label">Причина отказа</label>
                <UiTextarea v-model="hrRejectReason" rows="3" placeholder="Укажите причину..." />
              </div>
            </div>

          </div>

          <div class="modal-footer">
            <template v-if="!showHrRejectInput">
              <UiButton variant="reject" @click="showHrRejectInput = true">
                <X :size="13" stroke-width="2" /> Отклонить
              </UiButton>
              <UiButton variant="primary" :disabled="!hrChecksAllOk" @click="doHrConfirm">
                <Check :size="13" stroke-width="2" /> Подтвердить и создать приказ
              </UiButton>
            </template>
            <template v-else>
              <UiButton variant="secondary" @click="showHrRejectInput = false">Назад</UiButton>
              <UiButton variant="danger" @click="doHrReject">Подтвердить отказ</UiButton>
            </template>
          </div>

        </div>
      </div>
    </Teleport>

    <!-- ── Toast ─────────────────────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="toast">
        <div v-if="toastMsg" class="toast">
          <CheckCircle2 :size="14" stroke-width="2" />
          {{ toastMsg }}
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<style scoped>
.vacations { display: flex; flex-direction: column; gap: 20px; min-width: 0; }

.vacations-page-tabs {
  margin-bottom: 0;
}

.manager-approvals-tabs {
  margin-bottom: 16px;
}

.card {
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 10px;
  padding: 18px 20px;
}

/* ── Page header actions (teleported) ── */
.page-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 4px;
}

/* ── Stats (как на Dashboard: компактные карточки) ── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  width: 100%;
}
.stat-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}
.stat-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.stat-label {
  font-size: 12px;
  color: #999;
  font-weight: 450;
  line-height: 1.25;
}
.stat-icon {
  color: #bbb;
  flex-shrink: 0;
}
.stat-value {
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.5px;
  line-height: 1;
  color: #1a1a1a;
}
.stat-value--purple { color: #7c5cc4; }
.stat-value--teal   { color: #2ba896; }
.stat-value--green  { color: #4caf7d; }
.stat-value--red    { color: #e05a5a; }
.stat-value--muted  { color: #c0c0c0; }
.stat-value--blue   { color: #5b8ef0; }
.stat-sub {
  font-size: 11.5px;
  color: #aaa;
  line-height: 1.3;
}

/* ── Баннер после сохранения годового плана ── */
.vacation-plan-flash {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 8px;
  border: 1px solid #c8e8d8;
  background: #ecf8f3;
}
.vacation-plan-flash__ic {
  flex-shrink: 0;
  color: #2e9d7a;
  margin-top: 1px;
}
.vacation-plan-flash__body {
  min-width: 0;
  flex: 1;
}
.vacation-plan-flash__title {
  font-size: 13px;
  font-weight: 600;
  color: #1a1a1a;
  letter-spacing: -0.2px;
}
.vacation-plan-flash__meta {
  font-size: 13px;
  color: #333;
  margin-top: 4px;
  line-height: 1.45;
  font-weight: 500;
}
.vacation-plan-flash__actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

/* ── Текущее / ближайшее отсутствие: alert-стиль, без карточки в карточке ── */
.vacation-absence-alerts {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.vacation-absence-alert {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 8px;
  border: 1px solid #e5e5e5;
  background: #fafafa;
}
.vacation-absence-alert__ic {
  flex-shrink: 0;
  color: #2ba896;
  margin-top: 1px;
}
.vacation-absence-alert__ic--next {
  color: #5b8ef0;
}
.vacation-absence-alert--current {
  background: #ecf8f3;
  border-color: #c8e8d8;
}
.vacation-absence-alert--current.vacation-absence-alert--trip {
  background: #f4f0fb;
  border-color: #ddd0f0;
}
.vacation-absence-alert--current.vacation-absence-alert--trip .vacation-absence-alert__ic {
  color: #7c5cc4;
}
.vacation-absence-alert--next {
  background: #f5f8ff;
  border-color: #d6e4fd;
}
.vacation-absence-alert--next.vacation-absence-alert--trip {
  background: #f4f0fb;
  border-color: #ddd0f0;
}
.vacation-absence-alert--next.vacation-absence-alert--trip .vacation-absence-alert__ic {
  color: #7c5cc4;
}
.vacation-absence-alert__body {
  min-width: 0;
}
.vacation-absence-alert__title {
  font-size: 13px;
  font-weight: 600;
  color: #1a1a1a;
  letter-spacing: -0.2px;
}
.vacation-absence-alert__meta {
  font-size: 12px;
  color: #555;
  margin-top: 4px;
  line-height: 1.45;
}

/* ── Annual calendar ── */
.year-cal-card { padding: 20px 24px; }

.year-cal-nav {
  display: flex; align-items: center; gap: 12px;
  margin-bottom: 20px;
}
.year-label {
  font-size: 16px; font-weight: 600; color: #1a1a1a;
  letter-spacing: -0.3px; min-width: 52px; text-align: center;
}

.year-months-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px 28px;
}
.ym-month {}
.ym-title {
  font-size: 12px; font-weight: 600; color: #444;
  margin-bottom: 7px; text-align: center;
}
.ym-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}
.ym-dow {
  text-align: center; font-size: 10px; color: #ccc;
  font-weight: 500; padding: 2px 0 4px;
}
.ym-cell {
  aspect-ratio: 1;
  border-radius: 3px;
  display: flex; align-items: center; justify-content: center;
}
.ym-cell:not(.empty) {
  transition: filter 0.12s ease;
}
.ym-cell:not(.empty):hover {
  filter: brightness(0.97);
}
.ym-cell.empty { pointer-events: none; }
.ym-day-num { font-size: 11px; color: #555; user-select: none; line-height: 1; }
.ym-cell.weekend .ym-day-num { color: #ccc; }

.ym-cell.mark-approved             { background: #edf7f2; }
.ym-cell.mark-approved .ym-day-num { color: #4caf7d; font-weight: 600; }
.ym-cell.mark-planned              { background: #ebf1fd; }
.ym-cell.mark-planned  .ym-day-num { color: #5b8ef0; font-weight: 600; }
.ym-cell.mark-pending              { background: #fef9ec; }
.ym-cell.mark-pending  .ym-day-num { color: #e8a020; font-weight: 600; }
.ym-cell.mark-pending_manager      { background: #f4f0fb; }
.ym-cell.mark-pending_manager      .ym-day-num { color: #7c5cc4; font-weight: 600; }
.ym-cell.mark-approved_by_manager  { background: #edf7f2; }
.ym-cell.mark-approved_by_manager  .ym-day-num { color: #4caf7d; font-weight: 600; }
.ym-cell.mark-confirmed            { background: #e6f7f4; }
.ym-cell.mark-confirmed .ym-day-num { color: #0d9488; font-weight: 600; }

/* ── Legend ── */
.legend-item { display: flex; align-items: center; gap: 5px; font-size: 11.5px; color: #999; }
.legend-dot  { width: 10px; height: 10px; border-radius: 2px; flex-shrink: 0; }
.legend-dot.approved { background: #c8eedd; }
.legend-dot.planned  { background: #d6e4fd; }
.legend-dot.pending  { background: #fef3d0; }

.year-cal-legend {
  display: flex; align-items: center; flex-wrap: wrap; gap: 14px;
  margin-bottom: 16px; padding-bottom: 14px;
  border-bottom: 1px solid #f0f0f0;
}

.visually-hidden {
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap; border: 0;
}

.vacations-toolbar-select {
  min-width: 0;
  max-width: 100%;
}
@media (min-width: 480px) {
  .vacations-toolbar-select { min-width: 170px; }
}

/* ── HR/Admin header ── */
.vacations-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.btn-act-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  min-height: 32px;
  padding: 0 12px;
  border-radius: 7px;
  border: none;
  font-size: 12px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  background: #7c5cc4;
  color: #fff;
  transition: background 0.15s;
}
.btn-act-cta:hover { background: #6548ae; }
.btn-act-cta--hr {
  background: #2ba896;
}
.btn-act-cta--hr:hover { background: #228e7e; }

.act-cta {
  margin-top: 4px;
}

/* Кнопки: ui-buttons.css + UiButton / UiIconButton */

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
.data-table th { padding: 12px 20px; font-size: 12px; font-weight: 500; color: #aaa; text-align: left; }
.data-table tbody tr { border-bottom: 1px solid #f5f5f5; transition: background 0.12s; }
.data-table tbody tr:last-child { border-bottom: none; }
.data-table tbody tr:hover { background: #fafafa; }
.data-table td { padding: 13px 20px; color: #444; }
.align-right { text-align: right; }
.align-center { text-align: center; }
.data-table th.align-right { text-align: right; }
.col-parts { width: 56px; }
.col-name  { color: #222; font-weight: 450; }
.col-emp {
  min-width: 200px;
  max-width: 360px;
  vertical-align: middle;
}
.approvals-emp-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.approvals-emp-avatar {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #ede9f8;
  color: #7c5cc4;
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.approvals-emp-text { min-width: 0; }
.approvals-emp-name {
  font-size: 13px;
  font-weight: 500;
  color: #1a1a1a;
  line-height: 1.25;
}
.approvals-emp-position {
  font-size: 11px;
  color: #999;
  margin-top: 2px;
  line-height: 1.25;
}
.col-date  { color: #666; }
.col-muted { color: #aaa; }
.empty-row { text-align: center; color: #ccc; font-size: 13px; }

/* ── Approver chain ── */
.approver-chain { display: flex; align-items: center; gap: 4px; }
.approver-av {
  width: 26px; height: 26px;
  border-radius: 7px;
  font-size: 10px; font-weight: 600;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  cursor: default;
}
.approver-av--done    { background: #edf7f2; color: #4caf7d; border: 1.5px solid #c8eedd; }
.approver-av--active  { background: #f4f0fb; color: #7c5cc4; border: 1.5px solid #c5b8ef; box-shadow: 0 0 0 2px rgba(130,108,210,0.15); }
.approver-av--waiting { background: #f5f5f5; color: #bbb;    border: 1.5px solid #e8e8e8; }
.approver-av--rejected{ background: #fdf0f0; color: #e05a5a; border: 1.5px solid #fbc4c4; }

/* ── Modal ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.modal {
  background: #fff;
  border-radius: 12px;
  width: 360px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  overflow: hidden;
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}
.modal-title { font-size: 14px; font-weight: 500; color: #1a1a1a; }

.modal-body { padding: 20px; display: flex; flex-direction: column; gap: 14px; }

/* ── Form ── */
.form-row      { display: flex; gap: 12px; }
.form-calc     { padding: 8px 12px; background: #f5f5f5; border-radius: 7px; font-size: 12.5px; }
.calc-days     { font-weight: 500; color: #222; }
.calc-sep      { color: #ccc; }
.calc-remaining          { color: #4caf7d; }
.calc-remaining.negative { color: #e05a5a; }
/* Поля: UiInput / UiSelect / UiTextarea / UiSearchField + ui-fields.css */

.form-group { display: flex; flex-direction: column; gap: 5px; flex: 1; min-width: 0; }
.form-label { font-size: 12px; color: #888; font-weight: 450; }

.bal-hint {
  font-size: 12.5px;
  color: #4caf7d;
  padding: 8px 12px;
  background: #edf7f2;
  border-radius: 7px;
}
.bal-hint.negative { color: #e05a5a; background: #fdf0f0; }

.form-error {
  font-size: 12.5px;
  color: #e05a5a;
  padding: 8px 12px;
  background: #fdf0f0;
  border-radius: 7px;
}

.plan-modal-notice {
  padding: 10px 12px;
  background: #f4f7fb;
  border: 1px solid #e2eaf4;
  border-radius: 8px;
  font-size: 12px;
  color: #445;
  line-height: 1.45;
}
.plan-modal-notice-title {
  font-weight: 600;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #6b7a90;
  margin-bottom: 6px;
}
.plan-modal-list {
  margin: 0 0 8px;
  padding-left: 18px;
}
.plan-modal-list li { margin-bottom: 2px; }
.plan-modal-notice-hint {
  margin: 0;
  font-size: 11.5px;
  color: #7a8799;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
}

/* ── Toast ── */
.toast {
  position: fixed;
  bottom: 28px;
  left: 50%;
  transform: translateX(-50%);
  background: #1a1a1a;
  color: #fff;
  border-radius: 8px;
  padding: 10px 18px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.18);
  z-index: 200;
  white-space: nowrap;
}
.toast svg { color: #4caf7d; }

.toast-enter-active, .toast-leave-active { transition: opacity 0.25s, transform 0.25s; }
.toast-enter-from { opacity: 0; transform: translateX(-50%) translateY(10px); }
.toast-leave-to   { opacity: 0; transform: translateX(-50%) translateY(10px); }

/* ── Summary card variants ── */

/* ── Approval queue: одна карточка, строки — разделители, без «карточки в карточке» ── */
.approval-queue-card {
  padding: 0;
  overflow: hidden;
}
.approval-queue-card .aq-title {
  margin: 0;
  padding: 14px 20px 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #888;
  border-bottom: 1px solid #eee;
}
.approval-queue-card:not(.hr-queue-card) .aq-title {
  color: #6b5b95;
}
.aq-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.aq-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 20px;
  background: transparent;
  border: none;
  border-radius: 0;
  border-bottom: 1px solid #eee;
  transition: background 0.12s;
}
.aq-row:last-child {
  border-bottom: none;
}
.aq-row:hover {
  background: #fafafa;
}
.aq-emp  { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
.aq-avatar {
  width: 32px; height: 32px; border-radius: 8px;
  background: #ede9f8; color: #7c5cc4;
  font-size: 11px; font-weight: 600;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.aq-emp-name { font-size: 13px; font-weight: 500; color: #1a1a1a; }
.aq-emp-meta { font-size: 11px; color: #aaa; margin-top: 1px; }
.aq-dates    { font-size: 12.5px; color: #666; white-space: nowrap; }
.aq-type     { font-size: 12px; color: #aaa; white-space: nowrap; }
.aq-parts    { font-size: 11.5px; color: #999; white-space: nowrap; flex-shrink: 0; min-width: 36px; }
.aq-days     { font-size: 12.5px; color: #888; white-space: nowrap; }

.btn-review {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
  padding: 0 12px;
  background: #fff;
  color: #5c4a9e;
  border: 1px solid #d4cce8;
  border-radius: 6px;
  font-size: 12.5px;
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
  flex-shrink: 0;
}
.btn-review:hover {
  background: #faf8ff;
  border-color: #7c5cc4;
  color: #4a3d82;
}
.btn-review-sm {
  min-height: 28px;
  padding: 0 10px;
  font-size: 12px;
}

/* ── Approval modal ── */
.modal-wide { width: 500px; }

.ap-avatar {
  width: 40px; height: 40px; border-radius: 10px;
  background: #ede9f8; color: #7c5cc4;
  font-size: 13px; font-weight: 600;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.hr-confirm-head .ap-avatar {
  width: 44px;
  height: 44px;
  border-radius: 10px;
}
.ap-sub {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  flex-shrink: 0;
  text-align: right;
  max-width: 42%;
}
.ap-sub-label { font-size: 10.5px; color: #bbb; }
.ap-sub-name { font-size: 12px; font-weight: 500; color: #7c5cc4; }

.ap-balance  { display: flex; gap: 16px; }
.ap-bal-item { display: flex; flex-direction: column; gap: 3px; }
.ap-bal-val  { font-size: 20px; font-weight: 600; color: #1a1a1a; letter-spacing: -0.5px; line-height: 1; }
.ap-bal-val.used  { color: #aaa; }
.ap-bal-val.green { color: #4caf7d; }
.ap-bal-val.red   { color: #e05a5a; }
.ap-bal-label     { font-size: 11px; color: #aaa; }

.ap-peers       { display: flex; flex-direction: column; gap: 0; }
.ap-peer        {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}
.ap-peer:last-child { border-bottom: none; padding-bottom: 0; }
.ap-peer:first-child { padding-top: 0; }
.ap-peer-name   { font-size: 12.5px; font-weight: 500; color: #333; flex: 1; min-width: 0; }
.ap-peer-dates  { font-size: 12px; color: #aaa; white-space: nowrap; }
.ap-peers-empty { font-size: 12.5px; color: #2a9d6e; line-height: 1.45; }

/* Подсказка: сводка на главной, здесь — реестр */
.approvals-hint-banner {
  margin: 0 0 14px;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
  background: #fafafa;
  font-size: 12.5px;
  color: #666;
  line-height: 1.45;
}
.approvals-hint-link {
  margin: 0;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  font: inherit;
  color: #5c4a9e;
  text-decoration: underline;
  text-underline-offset: 2px;
}
.approvals-hint-link:hover { color: #3d2f6e; }

/* ── HR queue: те же плоские строки, акцент — заголовок и кнопка ── */
.hr-queue-card {
  border-color: #e5e5e5;
  background: #fff;
}
.aq-title-hr {
  color: #2a8f7e !important;
}
.aq-avatar-hr { background: #d4f3ee; color: #1a7a6e; }
.btn-review-hr {
  background: #fff;
  color: #1a7a6e;
  border: 1px solid #9dd4cc;
}
.btn-review-hr:hover {
  background: #f5fdfb;
  border-color: #2ba896;
  color: #146b5e;
}
.aq-row-badge { margin-left: auto; }
.ap-avatar-hr { background: #d4f3ee; color: #2ba896; }

/* ── HR final confirm modal (структурированный layout) ── */
.hr-confirm-modal.modal-wide {
  width: 520px;
  max-width: calc(100vw - 32px);
}
/* Один «слой» с белым фоном модалки — без вложенной карточки */
.modal-body.hr-confirm-body {
  padding: 0;
  gap: 0;
  display: flex;
  flex-direction: column;
}
.hr-confirm-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px;
  background: #fff;
  border-bottom: 1px solid #eee;
}
.hr-confirm-emp { display: flex; align-items: flex-start; gap: 12px; min-width: 0; flex: 1; }
.hr-confirm-avatar {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: #d4f3ee;
  color: #1a7a6e;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.hr-confirm-name { font-size: 14px; font-weight: 600; color: #1a1a1a; line-height: 1.25; }
.hr-confirm-meta { font-size: 11.5px; color: #888; margin-top: 4px; }
.hr-confirm-pos { font-size: 11.5px; color: #aaa; margin-top: 2px; }

.hr-confirm-section {
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
  background: #fff;
}
/* Блок проверки — последний контентный блок; линия от футера модалки, не дублируем низ */
.hr-confirm-section--checks {
  border-bottom: none;
  padding-bottom: 18px;
}
.hr-confirm-section-title {
  font-size: 10.5px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #999;
  margin-bottom: 12px;
}
.hr-confirm-section-title--inline {
  margin-bottom: 8px;
}
.hr-confirm-plan-parts {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}
.hr-confirm-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px 12px;
}
.hr-confirm-grid--twocol {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.hr-confirm-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.hr-confirm-label { font-size: 11px; color: #aaa; }
.hr-confirm-val { font-size: 13px; font-weight: 600; color: #222; }

.hr-confirm-comment {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}
.hr-confirm-comment-text {
  margin: 6px 0 0;
  font-size: 12.5px;
  color: #555;
  line-height: 1.45;
}

.hr-confirm-checklist {
  list-style: none;
  margin: 0;
  padding: 0;
}
.hr-confirm-checkitem {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}
.hr-confirm-checkitem:last-child { border-bottom: none; padding-bottom: 0; }
.hr-confirm-checkitem:first-child { padding-top: 0; }
.hr-cc-ic { flex-shrink: 0; margin-top: 2px; }
.hr-cc-ic.ok { color: #2ba896; }
.hr-cc-ic.warn { color: #d97706; }
.hr-cc-ic.fail { color: #e05a5a; }
.hr-cc-body {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}
.hr-cc-title { font-size: 12.5px; font-weight: 600; color: #333; }
.hr-cc-detail { font-size: 12px; color: #666; line-height: 1.4; }
.hr-confirm-checkitem.is-fail .hr-cc-detail { color: #b91c1c; }
.hr-confirm-checkitem.is-warn .hr-cc-detail { color: #b45309; }

.hr-confirm-reject {
  padding: 16px 20px 20px;
  border-top: 1px solid #eee;
  margin: 0;
}

button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ── Clickable rows ── */
.row-clickable { cursor: pointer; }
.row-clickable:hover td { background: #fafafa; }

/* ── Drawer ── */
.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.18);
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
  box-shadow: -8px 0 32px rgba(0,0,0,0.1);
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
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 20px;
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
}

/* Employee card */
.drawer-emp { display: flex; align-items: center; gap: 12px; }
.drawer-emp-avatar {
  width: 40px; height: 40px;
  border-radius: 50%;
  background: #e8e8e8;
  color: #555;
  font-size: 13px;
  font-weight: 600;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.drawer-emp-name { font-size: 14px; font-weight: 500; color: #1a1a1a; }
.drawer-emp-meta { font-size: 12px; color: #999; margin-top: 2px; }

/* Details grid */
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

.drawer-details.drawer-details--compact {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
}
.drawer-details.drawer-details--compact .drawer-detail {
  flex: 1 1 0;
}

.drawer-plan-parts {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid #eee;
}
.drawer-plan-parts-title {
  font-size: 10.5px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #999;
  margin-bottom: 8px;
}
.drawer-plan-parts-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.drawer-plan-part {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
  font-size: 13px;
}
.drawer-plan-part:last-child { border-bottom: none; padding-bottom: 0; }
.drawer-plan-part-dates { color: #333; font-weight: 500; }
.drawer-plan-part-days { color: #888; font-size: 12.5px; white-space: nowrap; }

/* Comment */
.drawer-comment {
  background: #f9f9f9;
  border-radius: 8px;
  padding: 12px 14px;
}
.drawer-reject { background: #fff5f5; }
.drawer-comment-label { font-size: 11px; color: #bbb; font-weight: 500; margin-bottom: 4px; }
.drawer-comment-text  { font-size: 13px; color: #444; line-height: 1.5; }

/* Section label */
.drawer-section-label {
  font-size: 11.5px;
  font-weight: 600;
  color: #bbb;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: -8px;
}

/* Drawer transition */
.drawer-enter-active,
.drawer-leave-active { transition: opacity 0.2s; }
.drawer-enter-active .drawer-panel,
.drawer-leave-active .drawer-panel { transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
.drawer-enter-from,
.drawer-leave-to { opacity: 0; }
.drawer-enter-from .drawer-panel,
.drawer-leave-to  .drawer-panel { transform: translateX(100%); }
</style>
