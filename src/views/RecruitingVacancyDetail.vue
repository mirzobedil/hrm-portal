<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  LayoutGrid,
  List,
  Filter,
  CalendarClock,
  FileText,
  Plug,
  History,
  MessageSquare,
  Upload,
  Download,
  Check,
  ExternalLink,
  RefreshCw,
  Send,
  ChevronRight,
  Briefcase,
  Banknote,
  Building2,
  BarChart3,
} from 'lucide-vue-next'
import {
  UiSearchField,
  UiButton,
  UiSwitcher,
  UiSwitcherTab,
  UiPillTabs,
  UiPillTab,
  UiSelect,
  UiTextarea,
} from '@/components/ui'
import RecruitingStageTransitionModal from '@/components/recruiting/RecruitingStageTransitionModal.vue'
import { useRecruitingStageTransition } from '@/composables/useRecruitingStageTransition.js'
import {
  REC_CYCLE_STAGES,
  REC_CYCLE_CANDIDATES,
  REC_CYCLE_STAGE_SEG_FILL,
  REC_CYCLE_SEGMENT_STAGE_ID,
  getStageColor,
  formatCycleSalary,
  formatCycleDate,
} from '@/data/recruitingVacancyCycleDemo.js'
import { getVacancyDetailView } from '@/data/recruitingDashboardDemo.js'
import {
  VACANCY_TAB_DOCUMENTS,
  getVacancyHhIntegrationState,
  VACANCY_TAB_INTEGRATIONS_COUNT,
  VACANCY_TAB_HISTORY,
  VACANCY_TAB_COMMENTS,
} from '@/data/recruitingVacancyTabsDemo.js'

/**
 * Один массив с демо-данными: канбан DnD и таблица обновляют те же объекты,
 * что и карточка кандидата (getRecruitingCandidateById).
 */
const route = useRoute()
const router = useRouter()

const cycleCandidates = ref(REC_CYCLE_CANDIDATES)

/** Вкладки карточки вакансии (под общим заголовком в App). */
const vacancySectionTab = ref('cycle')

const commentList = ref(VACANCY_TAB_COMMENTS.map((c) => ({ ...c })))
const newCommentText = ref('')

/** Документы по id вакансии (демо: в памяти страницы). */
const vacancyDocsByVacancyId = ref({})

function ensureVacancyDocList(vacancyId) {
  const vid = vacancyId || 'unknown'
  if (!vacancyDocsByVacancyId.value[vid]) {
    vacancyDocsByVacancyId.value[vid] = VACANCY_TAB_DOCUMENTS.map((d) => ({ ...d }))
  }
  return vacancyDocsByVacancyId.value[vid]
}

const vacancyDocList = computed(() => ensureVacancyDocList(String(route.params.id ?? '')))

/** Бейдж без побочных эффектов до первого открытия вкладки / загрузки */
const documentsTabBadge = computed(() => {
  const vid = String(route.params.id ?? '')
  const list = vacancyDocsByVacancyId.value[vid]
  return list ? list.length : VACANCY_TAB_DOCUMENTS.length
})

const docFileInputRef = ref(null)

function openVacancyDocPicker() {
  docFileInputRef.value?.click()
}

function onVacancyDocumentsSelected(e) {
  const input = e.target
  const files = input?.files
  if (!files?.length) return
  const vid = String(route.params.id ?? '')
  const list = ensureVacancyDocList(vid)
  const today = new Date().toISOString().slice(0, 10)
  for (let i = 0; i < files.length; i++) {
    const f = files[i]
    list.unshift({
      id: `up-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
      name: f.name,
      date: today,
      file: f,
    })
  }
  input.value = ''
}

function sanitizeDownloadBaseName(name) {
  const s = String(name ?? 'document')
    .replace(/[/\\?%*:|"<>]/g, '_')
    .trim()
  return s || 'document'
}

/** Демо: загруженные — реальный файл; из списка демо — текстовая заглушка. */
function downloadVacancyDocument(doc) {
  if (doc.file instanceof File) {
    const url = URL.createObjectURL(doc.file)
    const a = document.createElement('a')
    a.href = url
    a.download = doc.file.name || doc.name
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    return
  }
  const body = [
    'Демо: файл отсутствует на сервере.',
    '',
    `Документ: ${doc.name}`,
    `Дата в списке: ${doc.date}`,
    '',
    'Это заглушка для проверки интерфейса.',
  ].join('\n')
  const blob = new Blob([body], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const base = sanitizeDownloadBaseName(doc.name.replace(/\.[^.]+$/, '') || doc.name)
  a.download = `${base}.txt`
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

const vacancyTabs = computed(() => [
  { id: 'cycle', label: 'Цикл' },
  { id: 'documents', label: 'Документы', badge: documentsTabBadge.value },
  { id: 'details', label: 'Подробности' },
  { id: 'integrations', label: 'Интеграции', badge: VACANCY_TAB_INTEGRATIONS_COUNT },
  { id: 'history', label: 'История', badge: VACANCY_TAB_HISTORY.length },
  { id: 'comments', label: 'Комментарии', badge: commentList.value.length },
])

const vacancyDetail = computed(() => getVacancyDetailView(String(route.params.id ?? '')))

/** Состояние интеграции hh.uz по вакансии (демо: действия на вкладке, без реального API). */
const hhVacancyState = ref({})

function buildHhState(vid) {
  const base = getVacancyHhIntegrationState(vid)
  return {
    ...base,
    pulledResponsesCount: null,
    lastCandidateStatusSyncAt: base.lastSyncAt || null,
    busy: null,
    toast: '',
  }
}

watch(
  () => String(route.params.id ?? ''),
  (vid) => {
    if (!vid) return
    if (hhVacancyState.value[vid] === undefined) {
      hhVacancyState.value = { ...hhVacancyState.value, [vid]: buildHhState(vid) }
    }
  },
  { immediate: true },
)

function patchHh(vid, patch) {
  const cur = hhVacancyState.value[vid] ?? buildHhState(vid)
  hhVacancyState.value = { ...hhVacancyState.value, [vid]: { ...cur, ...patch } }
}

const hhUi = computed(() => {
  const vid = String(route.params.id ?? '')
  return hhVacancyState.value[vid] ?? buildHhState(vid)
})

function hhPublicationPillClass(status) {
  const m = {
    published: 'rec-vac-hh-pill--ok',
    moderation: 'rec-vac-hh-pill--warn',
    paused: 'rec-vac-hh-pill--muted',
    draft: 'rec-vac-hh-pill--muted',
  }
  return m[status] ?? 'rec-vac-hh-pill--muted'
}

function hhDelay(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

const hhActionsDisabled = computed(() => !hhUi.value.apiAccessOk || !!hhUi.value.busy)

const hhCanUseHhApi = computed(() => {
  const u = hhUi.value
  return u.apiAccessOk && u.externalVacancyId && u.publicationStatus !== 'draft'
})

async function onHhPublishToSite() {
  const vid = String(route.params.id ?? '')
  patchHh(vid, { busy: 'publish', toast: '' })
  await hhDelay(900)
  const ext = String(Math.floor(80000 + Math.random() * 9999))
  patchHh(vid, {
    busy: null,
    externalVacancyId: ext,
    vacancyUrl: `https://hh.uz/vacancy/${ext}`,
    publicationStatus: 'moderation',
    publicationStatusLabel: 'На модерации',
    lastSyncAt: new Date().toISOString(),
    toast: 'Вакансия отправлена в hh.uz. Ожидайте модерации (демо).',
  })
}

async function onHhResumePublication() {
  const vid = String(route.params.id ?? '')
  const cur = hhVacancyState.value[vid] ?? buildHhState(vid)
  const ext = cur.externalVacancyId || String(Math.floor(80000 + Math.random() * 9999))
  patchHh(vid, { busy: 'publish', toast: '' })
  await hhDelay(750)
  patchHh(vid, {
    busy: null,
    externalVacancyId: ext,
    vacancyUrl: cur.vacancyUrl || `https://hh.uz/vacancy/${ext}`,
    publicationStatus: 'moderation',
    publicationStatusLabel: 'На модерации',
    lastSyncAt: new Date().toISOString(),
    toast: 'Публикация возобновлена, вакансия на модерации в hh.uz (демо).',
  })
}

async function onHhSyncResponses() {
  const vid = String(route.params.id ?? '')
  const vac = getVacancyDetailView(vid)
  const n = vac?.responses ?? 0
  patchHh(vid, { busy: 'responses', toast: '' })
  await hhDelay(800)
  patchHh(vid, {
    busy: null,
    lastSyncAt: new Date().toISOString(),
    pulledResponsesCount: n,
    toast: `Загружено откликов из hh.uz: ${n}. Карточки кандидатов в цикле обновлены (демо).`,
  })
}

async function onHhRefreshPublicationStatus() {
  const vid = String(route.params.id ?? '')
  const cur = hhVacancyState.value[vid] ?? buildHhState(vid)
  patchHh(vid, { busy: 'refresh', toast: '' })
  await hhDelay(650)
  patchHh(vid, {
    busy: null,
    toast: `Статус публикации: «${cur.publicationStatusLabel}» (демо-запрос к API hh.uz).`,
  })
}

async function onHhSyncCandidateStatuses() {
  const vid = String(route.params.id ?? '')
  patchHh(vid, { busy: 'statuses', toast: '' })
  await hhDelay(700)
  const iso = new Date().toISOString()
  patchHh(vid, {
    busy: null,
    lastCandidateStatusSyncAt: iso,
    toast: 'Статусы кандидатов из HR-платформы отправлены в hh.uz (демо).',
  })
}

const commentsTabPreview = computed(() => commentList.value.slice(0, 2))

function goToVacancyCommentsTab() {
  vacancySectionTab.value = 'comments'
}

function commentInitials(name) {
  const parts = String(name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function detailStr(v) {
  if (v == null || v === '') return '—'
  return String(v)
}

function formatVacancyDateTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${dd}.${mm}.${yyyy} ${hh}:${min}`
}

function formatSalaryRange(min, max) {
  if (min == null && max == null) return '—'
  if (min != null && max != null) return `${formatCycleSalary(min)} — ${formatCycleSalary(max)}`
  if (min != null) return `от ${formatCycleSalary(min)}`
  return `до ${formatCycleSalary(max)}`
}

function submitVacancyComment() {
  const t = newCommentText.value.trim()
  if (!t) return
  commentList.value.unshift({
    id: `cm-${Date.now()}`,
    author: 'Вы',
    at: '2026-04-16',
    text: t,
  })
  newCommentText.value = ''
}

const cycleViewMode = ref('table')
const cycleFilter = ref('all')
const cycleSearch = ref('')

const SEGMENTS = 10

const currentVacancyId = computed(() => String(route.params.id ?? ''))

function candidatesForVacancy(list) {
  const vid = currentVacancyId.value
  return list.filter((c) => c.vacancyId === vid)
}

const cycleCounts = computed(() => {
  const pool = candidatesForVacancy(cycleCandidates.value)
  const all = pool.length
  const active = pool.filter((c) => c.pipeline === 'active').length
  const rejected = pool.filter((c) => c.pipeline === 'rejected').length
  return { all, active, rejected }
})

const cyclePipelineOptions = computed(() => {
  const c = cycleCounts.value
  return [
    { value: 'all', label: `Все (${c.all})` },
    { value: 'active', label: `Активные (${c.active})` },
    { value: 'rejected', label: `Отклонённые (${c.rejected})` },
  ]
})

/** Сортировка фиксированная: дата добавления, сначала новые. */
function sortCycleRows(rows) {
  const out = [...rows]
  out.sort((a, b) => b.addedAt.localeCompare(a.addedAt))
  return out
}

/** Общие фильтры таблицы и канбана (без сортировки — порядок в массиве как в канбане). */
function filteredCycleRowsSource() {
  let rows = candidatesForVacancy(cycleCandidates.value)
  if (cycleFilter.value === 'active') rows = rows.filter((r) => r.pipeline === 'active')
  if (cycleFilter.value === 'rejected') rows = rows.filter((r) => r.pipeline === 'rejected')
  const q = cycleSearch.value.trim().toLowerCase()
  if (q) {
    rows = rows.filter((r) => {
      const blob = `${r.name} ${r.email} ${r.phone} ${r.vacancyHint ?? ''}`.toLowerCase()
      return blob.includes(q)
    })
  }
  return rows
}

const cycleRows = computed(() => sortCycleRows(filteredCycleRowsSource()))

/** Канбан: порядок карточек = порядок в `cycleCandidates` (не по дате). */
const cycleRowsKanban = computed(() => filteredCycleRowsSource())

function stageLabel(row) {
  if (row.stageId === 'failed') return row.failedReason || 'Наем провален'
  const s = REC_CYCLE_STAGES.find((x) => x.id === row.stageId)
  return s?.label ?? '—'
}

function stageBarFilled(row) {
  if (row.stageId === 'failed') return { filled: SEGMENTS, failed: true }
  const n = REC_CYCLE_STAGE_SEG_FILL[row.stageId] ?? 2
  return { filled: Math.min(SEGMENTS, n), failed: false }
}

/** Цвет сегмента полосы в таблице (каждый сегмент — свой этап). */
function segmentStyle(row, i) {
  const bar = stageBarFilled(row)
  if (bar.failed) {
    if (i <= bar.filled) return { backgroundColor: getStageColor('failed') }
    return {}
  }
  if (i <= bar.filled) {
    const sid = REC_CYCLE_SEGMENT_STAGE_ID[i - 1]
    return { backgroundColor: getStageColor(sid) }
  }
  return {}
}

function stageHintAccentStyle(row) {
  const id = row.stageId === 'failed' ? 'failed' : row.stageId
  return { borderLeftColor: getStageColor(id) }
}

function candidatesInColumn(stageId) {
  return cycleRowsKanban.value.filter((c) => c.stageId === stageId)
}

function rowMatchesCycleUi(c) {
  if (cycleFilter.value === 'active' && c.pipeline !== 'active') return false
  if (cycleFilter.value === 'rejected' && c.pipeline !== 'rejected') return false
  const q = cycleSearch.value.trim().toLowerCase()
  if (q) {
    const blob = `${c.name} ${c.email} ${c.phone} ${c.vacancyHint ?? ''}`.toLowerCase()
    if (!blob.includes(q)) return false
  }
  return true
}

function stageOrderIndex(stageId) {
  const i = REC_CYCLE_STAGES.findIndex((s) => s.id === stageId)
  return i === -1 ? 999 : i
}

/** Индекс вставки по положению курсора относительно середин карточек в колонке. */
function getInsertIndexFromDrop(e, columnEl) {
  const cards = [...columnEl.querySelectorAll('[data-candidate-id]')]
  if (cards.length === 0) return 0
  const y = e.clientY
  for (let i = 0; i < cards.length; i++) {
    const rect = cards[i].getBoundingClientRect()
    if (y < rect.top + rect.height / 2) return i
  }
  return cards.length
}

function adjustInsertIndexAfterRemoval(listBefore, draggedId, insertAtDom) {
  const oldIdx = listBefore.findIndex((c) => c.id === draggedId)
  if (oldIdx === -1) return insertAtDom
  return oldIdx < insertAtDom ? insertAtDom - 1 : insertAtDom
}

function applyStageToCandidate(moving, targetStageId) {
  if (targetStageId === 'failed') {
    moving.stageId = 'failed'
    moving.pipeline = 'rejected'
    if (!moving.failedReason) moving.failedReason = 'Переведено в отказ'
  } else {
    moving.stageId = targetStageId
    moving.pipeline = 'active'
    delete moving.failedReason
  }
}

/**
 * Вставка кандидата в `pool` так, чтобы порядок в колонке совпадал с insertAt
 * (после удаления из старого места, stage у moving уже обновлён).
 */
function insertCandidateIntoPool(pool, moving, vid, targetStageId, insertAt) {
  const siblings = pool.filter(
    (c) => c.vacancyId === vid && rowMatchesCycleUi(c) && c.stageId === targetStageId,
  )
  const insertIdx = Math.min(Math.max(0, insertAt), siblings.length)

  if (siblings.length === 0) {
    let pos = pool.length
    for (let i = 0; i < pool.length; i++) {
      const c = pool[i]
      if (c.vacancyId !== vid || !rowMatchesCycleUi(c)) continue
      if (stageOrderIndex(c.stageId) > stageOrderIndex(targetStageId)) {
        pos = i
        break
      }
    }
    if (pos === pool.length) {
      for (let i = pool.length - 1; i >= 0; i--) {
        if (pool[i].vacancyId === vid) {
          pos = i + 1
          break
        }
      }
    }
    pool.splice(pos, 0, moving)
    return
  }

  if (insertIdx >= siblings.length) {
    const last = siblings[siblings.length - 1]
    const pos = pool.findIndex((c) => c.id === last.id)
    pool.splice(pos + 1, 0, moving)
  } else {
    const before = siblings[insertIdx]
    const pos = pool.findIndex((c) => c.id === before.id)
    pool.splice(pos, 0, moving)
  }
}

/** ── Переходы между этапами (ТЗ ч.2): общий composable с карточкой кандидата ── */
const {
  cycleTransitionOpen,
  cyclePending,
  cycleTransitionForm,
  cycleTransitionError,
  cycleToast,
  cycleModalTitle,
  stageTitle,
  showCycleToast,
  closeCycleTransition,
  confirmCycleTransition,
  beginStageTransitionFromKanban,
} = useRecruitingStageTransition({
  getPool: () => cycleCandidates.value,
  getVacancyId: () => currentVacancyId.value,
  rowMatches: rowMatchesCycleUi,
})

const DND_BODY_CLASS = 'rec-cycle-dnd-active'

function moveCandidateInKanban(candidateId, targetStageId, e) {
  const pool = cycleCandidates.value
  const vid = currentVacancyId.value
  const idx = pool.findIndex((x) => x.id === candidateId && x.vacancyId === vid)
  if (idx === -1) return false

  const columnEl = e.currentTarget
  const listBeforeTarget = candidatesInColumn(targetStageId)
  const insertAtDom = getInsertIndexFromDrop(e, columnEl)

  const moving = pool[idx]
  const oldStage = moving.stageId
  const wasInTarget = oldStage === targetStageId

  pool.splice(idx, 1)

  let insertAt = insertAtDom
  if (wasInTarget) {
    insertAt = adjustInsertIndexAfterRemoval(listBeforeTarget, candidateId, insertAtDom)
  }

  applyStageToCandidate(moving, targetStageId)
  insertCandidateIntoPool(pool, moving, vid, targetStageId, insertAt)
  return true
}

function openCandidateProfile(c) {
  const vid = route.params.id
  router.push({
    name: 'recruiting-candidate',
    params: { id: c.id },
    query: vid ? { vacancy: String(vid) } : {},
  })
}

/** После успешного drop клик по карточке не должен открывать профиль. */
const blockKanbanCardClick = ref(false)

function onKanbanCardClick(candidate) {
  if (blockKanbanCardClick.value) {
    blockKanbanCardClick.value = false
    return
  }
  openCandidateProfile(candidate)
}

function onKanbanCardKeydown(e, candidate) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    onKanbanCardClick(candidate)
  }
}

const draggingCandidateId = ref(null)
/** Предпросмотр слота при DnD: куда вставится карточка (как в Trello). */
const dropPreview = ref({ stageId: null, insertIndex: 0 })
const DND_MIME = 'application/x-rec-cycle-candidate-id'

function clearDropPreview() {
  dropPreview.value = { stageId: null, insertIndex: 0 }
}

function isKanbanDropPlaceholder(colId, insertIndex) {
  const p = dropPreview.value
  return (
    draggingCandidateId.value != null &&
    p.stageId === colId &&
    p.insertIndex === insertIndex
  )
}

function onCardDragStart(e, c) {
  draggingCandidateId.value = c.id
  e.dataTransfer?.setData(DND_MIME, c.id)
  e.dataTransfer?.setData('text/plain', c.id)
  e.dataTransfer.effectAllowed = 'move'
  document.body.classList.add(DND_BODY_CLASS)
  clearDropPreview()
}

function onCardDragEnd() {
  draggingCandidateId.value = null
  clearDropPreview()
  document.body.classList.remove(DND_BODY_CLASS)
}

function onKanbanColumnDragOver(e, stageId) {
  e.preventDefault()
  e.dataTransfer.dropEffect = 'move'
  if (!draggingCandidateId.value) return
  dropPreview.value = {
    stageId,
    insertIndex: getInsertIndexFromDrop(e, e.currentTarget),
  }
}

function onKanbanColumnDragLeave(e) {
  const next = e.relatedTarget
  if (next && e.currentTarget?.contains(next)) return
  clearDropPreview()
}

function onKanbanColumnDrop(e, targetStageId) {
  e.preventDefault()
  clearDropPreview()
  const id = e.dataTransfer?.getData(DND_MIME) || e.dataTransfer?.getData('text/plain')
  if (!id) return

  const pool = cycleCandidates.value
  const vid = currentVacancyId.value
  const idx = pool.findIndex((x) => x.id === id && x.vacancyId === vid)
  if (idx === -1) return

  const oldStage = pool[idx].stageId

  if (oldStage === targetStageId) {
    if (moveCandidateInKanban(id, targetStageId, e)) blockKanbanCardClick.value = true
    return
  }

  const columnEl = e.currentTarget
  const listBeforeTarget = candidatesInColumn(targetStageId)
  const insertAtDom = getInsertIndexFromDrop(e, columnEl)
  const wasInTarget = oldStage === targetStageId
  let insertAt = insertAtDom
  if (wasInTarget) {
    insertAt = adjustInsertIndexAfterRemoval(listBeforeTarget, id, insertAtDom)
  }

  if (beginStageTransitionFromKanban({ candidateId: id, targetStageId, insertAt })) {
    blockKanbanCardClick.value = true
  }
}
</script>

<template>
  <div class="rec-vac-detail">
    <UiPillTabs v-model="vacancySectionTab" class="rec-vac-pill-tabs" aria-label="Разделы вакансии">
      <UiPillTab
        v-for="tab in vacancyTabs"
        :key="tab.id"
        :id="tab.id"
        :badge="tab.badge"
      >
        {{ tab.label }}
      </UiPillTab>
    </UiPillTabs>

    <template v-if="vacancySectionTab === 'cycle'">
      <section class="rec-vac-cycle" aria-label="Цикл подбора">
        <div
          class="card rec-vac-list-card"
          :class="{ 'rec-vac-list-card--kanban-full': cycleViewMode === 'kanban' }"
        >
          <div class="rec-vac-toolbar" role="search" aria-label="Поиск и фильтры кандидатов">
            <div class="rec-vac-toolbar-left">
              <div class="rec-vac-search-wrap">
                <UiSearchField
                  v-model="cycleSearch"
                  placeholder="Поиск по имени, почте, номеру телефона и вакансии"
                  autocomplete="off"
                />
              </div>
              <UiButton variant="secondary" size="sm" type="button" class="rec-vac-filters-placeholder">
                <span class="rec-vac-filters-toggle-inner">
                  <Filter :size="14" stroke-width="2" aria-hidden="true" />
                  Фильтры
                </span>
              </UiButton>
            </div>
            <div class="rec-vac-toolbar-right">
              <div class="rec-vac-toolbar-status-view">
                <label class="rec-vac-status-field">
                  <span class="visually-hidden">Кандидаты по статусу</span>
                  <UiSelect
                    v-model="cycleFilter"
                    class="rec-vac-status-select"
                    :options="cyclePipelineOptions"
                  />
                </label>
                <UiSwitcher v-model="cycleViewMode" variant="icon" class="rec-cycle-view-switch">
                  <UiSwitcherTab id="kanban" title="Канбан">
                    <LayoutGrid :size="15" stroke-width="1.75" />
                  </UiSwitcherTab>
                  <UiSwitcherTab id="table" title="Таблица">
                    <List :size="15" stroke-width="1.75" />
                  </UiSwitcherTab>
                </UiSwitcher>
              </div>
            </div>
          </div>

          <div v-if="cycleViewMode === 'table'" class="table-card rec-vac-table-outer rec-cycle-table-wrap">
          <table class="data-table rec-cycle-table">
            <thead>
              <tr>
                <th scope="col">Кандидат</th>
                <th scope="col">Стадия</th>
                <th scope="col" class="align-right">Желаемая зарплата</th>
                <th scope="col">Дата добавления</th>
                <th scope="col">Тип отклика</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in cycleRows"
                :key="row.id"
                class="rec-cycle-row-click"
                role="button"
                tabindex="0"
                @click="openCandidateProfile(row)"
                @keydown.enter.prevent="openCandidateProfile(row)"
                @keydown.space.prevent="openCandidateProfile(row)"
              >
                <td>
                  <div class="rec-cycle-candidate">
                    <span class="rec-cycle-avatar">{{ row.initials }}</span>
                    <span class="rec-cycle-name">{{ row.name }}</span>
                  </div>
                </td>
                <td>
                  <div class="rec-cycle-stage-cell">
                    <div class="rec-cycle-segbar" :aria-label="stageLabel(row)">
                      <span
                        v-for="i in SEGMENTS"
                        :key="i"
                        class="rec-cycle-seg"
                        :style="segmentStyle(row, i)"
                      />
                    </div>
                    <span class="rec-cycle-stage-hint" :style="stageHintAccentStyle(row)">{{
                      stageLabel(row)
                    }}</span>
                  </div>
                </td>
                <td class="align-right rec-cycle-mono">{{ formatCycleSalary(row.salary) }}</td>
                <td class="rec-cycle-muted">{{ formatCycleDate(row.addedAt) }}</td>
                <td>
                  <span v-if="row.responseTag" class="rec-cycle-tag">{{ row.responseTag }}</span>
                  <span v-else class="rec-cycle-dash">—</span>
                </td>
              </tr>
              <tr v-if="cycleRows.length === 0">
                <td colspan="5" class="rec-cycle-empty-row">Никого не найдено — измените поиск или фильтры.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="rec-cycle-kanban rec-vac-cycle-kanban-inner">
          <div
            class="rec-cycle-kanban-scroll rec-cycle-kanban-grid"
            :style="{
              gridTemplateColumns: `repeat(${REC_CYCLE_STAGES.length}, minmax(220px, 260px))`,
            }"
          >
            <div
              v-for="(col, idx) in REC_CYCLE_STAGES"
              :key="'kb-h-' + col.id"
              class="rec-cycle-col-head"
              :style="{
                gridColumn: idx + 1,
                gridRow: 1,
                borderBottomColor: col.color,
              }"
            >
              <span class="rec-cycle-col-title" :style="{ color: col.color }">{{ col.label }}</span>
              <span
                class="rec-cycle-col-badge"
                :style="{ background: `${col.color}22`, color: col.color }"
              >{{ candidatesInColumn(col.id).length }}</span>
            </div>
            <div
              v-for="(col, idx) in REC_CYCLE_STAGES"
              :key="'kb-b-' + col.id"
              class="rec-cycle-col-body"
              :class="{ 'rec-cycle-col-body--active': draggingCandidateId && dropPreview.stageId === col.id }"
              :style="{ gridColumn: idx + 1, gridRow: 2 }"
              @dragover="onKanbanColumnDragOver($event, col.id)"
              @dragleave="onKanbanColumnDragLeave"
              @drop="onKanbanColumnDrop($event, col.id)"
            >
              <template v-for="(c, cardIdx) in candidatesInColumn(col.id)" :key="c.id">
                <div
                  v-if="isKanbanDropPlaceholder(col.id, cardIdx)"
                  class="rec-cycle-drop-slot"
                  aria-hidden="true"
                />
                <article
                  class="rec-cycle-card rec-cycle-card--interactive"
                  :class="{ 'rec-cycle-card--dragging': draggingCandidateId === c.id }"
                  :data-candidate-id="c.id"
                  role="button"
                  tabindex="0"
                  draggable="true"
                  :aria-grabbed="draggingCandidateId === c.id"
                  :aria-label="`Кандидат ${c.name}. Перетащите в другую колонку или нажмите Enter для открытия.`"
                  @dragstart="onCardDragStart($event, c)"
                  @dragend="onCardDragEnd"
                  @click="onKanbanCardClick(c)"
                  @keydown="onKanbanCardKeydown($event, c)"
                >
                  <div class="rec-cycle-card-top">
                    <span class="rec-cycle-card-tenure">
                      <CalendarClock :size="15" stroke-width="1.5" class="rec-cycle-card-tenure-ic" />
                      {{ c.tenure }}
                    </span>
                    <span class="rec-cycle-avatar rec-cycle-avatar--sm">{{ c.initials }}</span>
                  </div>
                  <div class="rec-cycle-card-name">{{ c.name }}</div>
                  <div class="rec-cycle-card-row">
                    <span class="rec-cycle-card-k">Зарплата</span>
                    <span class="rec-cycle-card-v">{{ formatCycleSalary(c.salary) }}</span>
                  </div>
                  <div class="rec-cycle-card-row">
                    <span class="rec-cycle-card-k">{{ c.metricLabel }}</span>
                    <span class="rec-cycle-card-v">{{ c.metricValue }}</span>
                  </div>
                </article>
              </template>
              <div
                v-if="isKanbanDropPlaceholder(col.id, candidatesInColumn(col.id).length)"
                class="rec-cycle-drop-slot"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
        </div>
      </section>
    </template>

    <template v-else-if="vacancySectionTab === 'documents'">
      <section class="rec-vac-panel" aria-label="Документы">
        <div class="card rec-vac-panel-card rec-vac-panel-card--pad">
          <div class="rec-vac-doc-upload-row">
            <input
              ref="docFileInputRef"
              type="file"
              class="visually-hidden"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.webp,.txt"
              @change="onVacancyDocumentsSelected"
            />
            <UiButton
              variant="secondary"
              size="sm"
              type="button"
              class="rec-vac-doc-upload-btn"
              @click="openVacancyDocPicker"
            >
              <Upload :size="14" stroke-width="2" aria-hidden="true" />
              Загрузить файлы
            </UiButton>
            <span class="rec-vac-doc-upload-hint">PDF, Office, изображения — демо, файлы не отправляются на сервер</span>
          </div>
          <ul class="rec-vac-doc-list">
            <li v-for="d in vacancyDocList" :key="d.id" class="rec-vac-doc-item">
              <FileText :size="16" stroke-width="1.5" class="rec-vac-doc-ic" aria-hidden="true" />
              <div class="rec-vac-doc-text">
                <span class="rec-vac-doc-name">{{ d.name }}</span>
                <span class="rec-vac-doc-date">{{ formatCycleDate(d.date) }}</span>
              </div>
              <UiButton
                variant="secondary"
                size="sm"
                type="button"
                class="rec-vac-doc-download"
                :aria-label="`Скачать ${d.name}`"
                @click="downloadVacancyDocument(d)"
              >
                <Download :size="14" stroke-width="2" aria-hidden="true" />
                Скачать
              </UiButton>
            </li>
          </ul>
          <p v-if="vacancyDocList.length === 0" class="rec-vac-empty-state">Документов пока нет.</p>
        </div>
      </section>
    </template>

    <template v-else-if="vacancySectionTab === 'details'">
      <section class="rec-vac-panel" aria-label="Подробности">
        <div v-if="vacancyDetail" class="rec-vac-detail-page">
          <div class="stats-grid" role="group" aria-label="Кратко по заявке">
            <div class="card stat-card">
              <span class="stat-label">Создано</span>
              <div class="stat-value stat-value--detail">{{ formatVacancyDateTime(vacancyDetail.detail.createdAt) }}</div>
            </div>
            <div class="card stat-card">
              <span class="stat-label">Создатель</span>
              <div class="stat-value stat-value--detail">{{ detailStr(vacancyDetail.detail.creator) }}</div>
            </div>
            <div class="card stat-card">
              <span class="stat-label">Прогресс найма</span>
              <div class="stat-value green rec-vac-detail-stat-mono">
                {{ vacancyDetail.detail.hiringFilled }} / {{ vacancyDetail.detail.hiringTotal }}
              </div>
            </div>
            <div class="card stat-card">
              <span class="stat-label">Связанная вакансия</span>
              <div class="stat-value stat-value--detail">{{ detailStr(vacancyDetail.detail.linkedVacancyTitle) }}</div>
            </div>
          </div>

          <div class="rec-vac-detail-body">
            <div class="rec-vac-detail-col-main">
              <section class="card panel" aria-labelledby="det-sec-request">
                <div class="panel-head">
                  <h3 id="det-sec-request" class="panel-title panel-title--icon">
                    <Briefcase :size="15" stroke-width="2" class="panel-title-ic" aria-hidden="true" />
                    Заявка и статус
                  </h3>
                </div>
                <div class="rec-vac-detail-fields">
                  <div class="rec-vac-detail-field">
                    <span class="rec-vac-detail-field-label">Статус</span>
                    <span class="rec-vac-detail-field-value">
                      <span
                        :class="['rec-vac-detail-status-pill', `rec-vac-detail-status-pill--${vacancyDetail.status}`]"
                        >{{ vacancyDetail.statusLabel }}</span
                      >
                    </span>
                  </div>
                  <div class="rec-vac-detail-field">
                    <span class="rec-vac-detail-field-label">Должность</span>
                    <span class="rec-vac-detail-field-value">{{ detailStr(vacancyDetail.detail.position) }}</span>
                  </div>
                  <div class="rec-vac-detail-field">
                    <span class="rec-vac-detail-field-label">Разряд</span>
                    <span class="rec-vac-detail-field-value">{{ detailStr(vacancyDetail.detail.grade) }}</span>
                  </div>
                  <div class="rec-vac-detail-field">
                    <span class="rec-vac-detail-field-label">Приоритет</span>
                    <span class="rec-vac-detail-field-value">{{ detailStr(vacancyDetail.detail.priorityLabel) }}</span>
                  </div>
                  <div class="rec-vac-detail-field">
                    <span class="rec-vac-detail-field-label">Кол-во открытых позиций</span>
                    <span class="rec-vac-detail-field-value">{{ vacancyDetail.detail.openPositionsCount ?? '—' }}</span>
                  </div>
                  <div class="rec-vac-detail-field">
                    <span class="rec-vac-detail-field-label">Причина заявки</span>
                    <span class="rec-vac-detail-field-value">{{ detailStr(vacancyDetail.detail.requestReason) }}</span>
                  </div>
                </div>
              </section>

              <section class="card panel" aria-labelledby="det-sec-conditions">
                <div class="panel-head">
                  <h3 id="det-sec-conditions" class="panel-title panel-title--icon">
                    <Banknote :size="15" stroke-width="2" class="panel-title-ic" aria-hidden="true" />
                    Условия
                  </h3>
                </div>
                <div class="rec-vac-detail-fields">
                  <div class="rec-vac-detail-field">
                    <span class="rec-vac-detail-field-label">Мин. — макс. зарплата</span>
                    <span class="rec-vac-detail-field-value rec-vac-detail-field-value--accent">{{
                      formatSalaryRange(vacancyDetail.detail.salaryMin, vacancyDetail.detail.salaryMax)
                    }}</span>
                  </div>
                  <div class="rec-vac-detail-field">
                    <span class="rec-vac-detail-field-label">Вид занятости</span>
                    <span class="rec-vac-detail-field-value">{{ detailStr(vacancyDetail.employment) }}</span>
                  </div>
                  <div class="rec-vac-detail-field">
                    <span class="rec-vac-detail-field-label">Опыт кандидата</span>
                    <span class="rec-vac-detail-field-value">{{ detailStr(vacancyDetail.detail.experience) }}</span>
                  </div>
                  <div class="rec-vac-detail-field">
                    <span class="rec-vac-detail-field-label">Желаемая дата выхода</span>
                    <span class="rec-vac-detail-field-value">{{
                      vacancyDetail.detail.desiredStartDate
                        ? formatCycleDate(vacancyDetail.detail.desiredStartDate)
                        : '—'
                    }}</span>
                  </div>
                  <div class="rec-vac-detail-field rec-vac-detail-field--block">
                    <span class="rec-vac-detail-field-label">Заметка</span>
                    <span class="rec-vac-detail-field-value">{{ detailStr(vacancyDetail.detail.note) }}</span>
                  </div>
                </div>
              </section>

              <section class="card panel" aria-labelledby="det-sec-org">
                <div class="panel-head">
                  <h3 id="det-sec-org" class="panel-title panel-title--icon">
                    <Building2 :size="15" stroke-width="2" class="panel-title-ic" aria-hidden="true" />
                    Организация и навыки
                  </h3>
                </div>
                <div class="rec-vac-detail-fields">
                  <div class="rec-vac-detail-field">
                    <span class="rec-vac-detail-field-label">Юридическое лицо</span>
                    <span class="rec-vac-detail-field-value">{{ detailStr(vacancyDetail.detail.legalEntity) }}</span>
                  </div>
                  <div class="rec-vac-detail-field">
                    <span class="rec-vac-detail-field-label">Подразделение</span>
                    <span class="rec-vac-detail-field-value">{{ detailStr(vacancyDetail.dept) }}</span>
                  </div>
                  <div class="rec-vac-detail-field">
                    <span class="rec-vac-detail-field-label">Локация</span>
                    <span class="rec-vac-detail-field-value">{{ detailStr(vacancyDetail.region) }}</span>
                  </div>
                  <div class="rec-vac-detail-field rec-vac-detail-field--block">
                    <span class="rec-vac-detail-field-label">Желаемые навыки</span>
                    <span class="rec-vac-detail-field-value">{{ detailStr(vacancyDetail.detail.skills) }}</span>
                  </div>
                </div>
              </section>

              <section class="card panel" aria-labelledby="det-sec-pub">
                <div class="panel-head">
                  <h3 id="det-sec-pub" class="panel-title panel-title--icon">
                    <BarChart3 :size="15" stroke-width="2" class="panel-title-ic" aria-hidden="true" />
                    Публикация и рекрутинг
                  </h3>
                </div>
                <div class="rec-vac-detail-fields">
                  <div class="rec-vac-detail-field">
                    <span class="rec-vac-detail-field-label">Рекрутер</span>
                    <span class="rec-vac-detail-field-value">{{ detailStr(vacancyDetail.owner) }}</span>
                  </div>
                  <div class="rec-vac-detail-field">
                    <span class="rec-vac-detail-field-label">Истекает публикация</span>
                    <span class="rec-vac-detail-field-value">{{
                      vacancyDetail.expiresAt ? formatCycleDate(vacancyDetail.expiresAt) : '—'
                    }}</span>
                  </div>
                  <div class="rec-vac-detail-field">
                    <span class="rec-vac-detail-field-label">Просмотры</span>
                    <span class="rec-vac-detail-field-value rec-vac-detail-field-value--mono">{{ vacancyDetail.views }}</span>
                  </div>
                  <div class="rec-vac-detail-field">
                    <span class="rec-vac-detail-field-label">Отклики</span>
                    <span class="rec-vac-detail-field-value"
                      >{{ vacancyDetail.responses }}
                      <span class="rec-vac-detail-inline-muted">(новых: {{ vacancyDetail.responsesNew }})</span></span
                    >
                  </div>
                </div>
              </section>
            </div>

            <aside class="rec-vac-detail-col-aside" aria-label="Согласование и комментарии">
              <div class="card panel">
                <div class="panel-head">
                  <h3 class="panel-title">Кто утверждает</h3>
                </div>
                <div class="rec-vac-detail-aside-body">
                  <ul v-if="vacancyDetail.detail.approvers.length" class="rec-vac-appr-list">
                    <li v-for="a in vacancyDetail.detail.approvers" :key="a.id" class="rec-vac-appr-item">
                      <span class="rec-vac-appr-avatar" aria-hidden="true">{{ a.initials }}</span>
                      <div class="rec-vac-appr-body">
                        <span class="rec-vac-appr-name">{{ a.name }}</span>
                        <span class="rec-vac-appr-line">{{ a.line }}</span>
                      </div>
                      <Check :size="16" stroke-width="2" class="rec-vac-appr-check" aria-hidden="true" />
                    </li>
                  </ul>
                  <p v-else class="rec-vac-aside-empty">Утверждающие не назначены.</p>
                </div>
              </div>
              <div class="card panel">
                <div class="panel-head">
                  <h3 class="panel-title">Комментарии</h3>
                  <button type="button" class="rec-vac-aside-link" @click="goToVacancyCommentsTab">
                    Все комментарии <ChevronRight :size="13" stroke-width="2" aria-hidden="true" />
                  </button>
                </div>
                <div class="rec-vac-detail-aside-body">
                  <ul v-if="commentsTabPreview.length" class="rec-vac-aside-com-list">
                    <li v-for="c in commentsTabPreview" :key="c.id" class="rec-vac-com-item">
                      <span class="rec-vac-com-avatar" aria-hidden="true">{{ commentInitials(c.author) }}</span>
                      <div class="rec-vac-com-body">
                        <div class="rec-vac-com-head">
                          <span class="rec-vac-com-author">{{ c.author }}</span>
                          <time class="rec-vac-com-date" :datetime="c.at">{{ formatCycleDate(c.at) }}</time>
                        </div>
                        <p class="rec-vac-com-text">{{ c.text }}</p>
                      </div>
                    </li>
                  </ul>
                  <p v-else class="rec-vac-aside-empty">Комментариев пока нет.</p>
                </div>
              </div>
            </aside>
          </div>
        </div>
        <p v-else class="rec-vac-empty-state">Вакансия не найдена в демо-данных.</p>
      </section>
    </template>

    <template v-else-if="vacancySectionTab === 'integrations'">
      <section class="rec-vac-panel" aria-label="Интеграции">
        <div class="card rec-vac-panel-card rec-vac-panel-card--pad rec-vac-int-card">
          <header class="rec-vac-int-head">
            <div class="rec-vac-int-title-row">
              <Plug :size="18" stroke-width="1.75" class="rec-vac-int-head-ic" aria-hidden="true" />
              <div class="rec-vac-int-title-text">
                <span class="rec-vac-int-title">hh.uz</span>
                <span class="rec-vac-int-sub">Публикация вакансии, загрузка откликов, синхронизация статусов</span>
              </div>
              <span :class="['rec-vac-hh-pill', hhPublicationPillClass(hhUi.publicationStatus)]">{{
                hhUi.publicationStatusLabel
              }}</span>
            </div>
            <p class="rec-vac-int-demo-note">Демо: кнопки имитируют API hh.uz, запросы к серверу не отправляются.</p>
          </header>

          <p v-if="hhUi.toast" class="rec-vac-int-toast" role="status">{{ hhUi.toast }}</p>

          <div class="rec-vac-int-metrics">
            <div class="rec-vac-int-metric">
              <span class="rec-vac-int-metric-label">Доступ к API</span>
              <span class="rec-vac-int-metric-value" :class="{ 'rec-vac-int-metric-value--bad': !hhUi.apiAccessOk }">{{
                hhUi.apiAccessOk ? 'Да' : 'Нет'
              }}</span>
            </div>
            <div class="rec-vac-int-metric">
              <span class="rec-vac-int-metric-label">ID в hh.uz</span>
              <span class="rec-vac-int-metric-value rec-vac-int-metric-value--mono">{{
                hhUi.externalVacancyId || '—'
              }}</span>
            </div>
            <div class="rec-vac-int-metric">
              <span class="rec-vac-int-metric-label">Откликов (последняя выгрузка)</span>
              <span class="rec-vac-int-metric-value rec-vac-int-metric-value--mono">{{
                hhUi.pulledResponsesCount != null ? hhUi.pulledResponsesCount : '—'
              }}</span>
            </div>
            <div class="rec-vac-int-metric">
              <span class="rec-vac-int-metric-label">Синхронизация откликов</span>
              <span class="rec-vac-int-metric-value">{{ formatVacancyDateTime(hhUi.lastSyncAt) }}</span>
            </div>
            <div class="rec-vac-int-metric">
              <span class="rec-vac-int-metric-label">Синхронизация статусов → hh.uz</span>
              <span class="rec-vac-int-metric-value">{{ formatVacancyDateTime(hhUi.lastCandidateStatusSyncAt) }}</span>
            </div>
            <div class="rec-vac-int-metric rec-vac-int-metric--link">
              <span class="rec-vac-int-metric-label">Ссылка</span>
              <span class="rec-vac-int-metric-value">
                <a
                  v-if="hhUi.vacancyUrl"
                  class="rec-vac-int-ext-link"
                  :href="hhUi.vacancyUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Открыть на hh.uz
                  <ExternalLink :size="12" stroke-width="2" aria-hidden="true" />
                </a>
                <span v-else>—</span>
              </span>
            </div>
          </div>

          <div class="rec-vac-int-actions" role="toolbar" aria-label="Действия hh.uz">
            <UiButton
              v-if="hhUi.publicationStatus === 'draft'"
              variant="primary"
              size="sm"
              type="button"
              :disabled="hhActionsDisabled"
              @click="onHhPublishToSite"
            >
              <Send :size="14" stroke-width="2" class="rec-vac-int-btn-ic" aria-hidden="true" />
              Отправить на hh.uz
            </UiButton>
            <UiButton
              v-if="hhUi.publicationStatus === 'paused'"
              variant="primary"
              size="sm"
              type="button"
              :disabled="hhActionsDisabled"
              @click="onHhResumePublication"
            >
              <Send :size="14" stroke-width="2" class="rec-vac-int-btn-ic" aria-hidden="true" />
              Возобновить публикацию
            </UiButton>
            <UiButton
              variant="secondary"
              size="sm"
              type="button"
              :disabled="hhActionsDisabled || !hhCanUseHhApi"
              @click="onHhSyncResponses"
            >
              <RefreshCw
                :size="14"
                stroke-width="2"
                class="rec-vac-int-btn-ic"
                :class="{ 'rec-vac-int-icon-spin': hhUi.busy === 'responses' }"
                aria-hidden="true"
              />
              Синхронизировать отклики
            </UiButton>
            <UiButton
              variant="secondary"
              size="sm"
              type="button"
              :disabled="hhActionsDisabled || !hhCanUseHhApi"
              @click="onHhRefreshPublicationStatus"
            >
              <RefreshCw
                :size="14"
                stroke-width="2"
                class="rec-vac-int-btn-ic"
                :class="{ 'rec-vac-int-icon-spin': hhUi.busy === 'refresh' }"
                aria-hidden="true"
              />
              Обновить статус публикации
            </UiButton>
            <UiButton
              variant="secondary"
              size="sm"
              type="button"
              :disabled="hhActionsDisabled || !hhCanUseHhApi"
              @click="onHhSyncCandidateStatuses"
            >
              <RefreshCw
                :size="14"
                stroke-width="2"
                class="rec-vac-int-btn-ic"
                :class="{ 'rec-vac-int-icon-spin': hhUi.busy === 'statuses' }"
                aria-hidden="true"
              />
              Отправить статусы в hh.uz
            </UiButton>
          </div>

          <details class="rec-vac-int-help">
            <summary class="rec-vac-int-help-sum">Как это работает</summary>
            <p class="rec-vac-int-help-body">
              После публикации платформа периодически запрашивает отклики по API, создаёт карточки кандидатов и при
              смене этапа передаёт статус обратно в hh.uz. Здесь показаны действия из ТЗ; в демо данные не уходят
              за пределы браузера.
            </p>
          </details>
        </div>
      </section>
    </template>

    <template v-else-if="vacancySectionTab === 'history'">
      <section class="rec-vac-panel" aria-label="История">
        <div class="card rec-vac-panel-card rec-vac-feed-card">
          <ul class="rec-vac-hist-list">
            <li v-for="h in VACANCY_TAB_HISTORY" :key="h.id" class="rec-vac-hist-item">
              <div class="rec-vac-hist-icon" aria-hidden="true">
                <History :size="15" stroke-width="2" class="rec-vac-hist-ic" />
              </div>
              <div class="rec-vac-hist-body">
                <time class="rec-vac-hist-date" :datetime="h.at">{{ formatCycleDate(h.at) }}</time>
                <p class="rec-vac-hist-text">{{ h.text }}</p>
              </div>
            </li>
          </ul>
        </div>
      </section>
    </template>

    <template v-else-if="vacancySectionTab === 'comments'">
      <section class="rec-vac-panel" aria-label="Комментарии">
        <div class="card rec-vac-panel-card rec-vac-feed-card">
          <ul class="rec-vac-com-list">
            <li v-for="c in commentList" :key="c.id" class="rec-vac-com-item">
              <span class="rec-vac-com-avatar" :aria-label="c.author">{{ commentInitials(c.author) }}</span>
              <div class="rec-vac-com-body">
                <div class="rec-vac-com-head">
                  <span class="rec-vac-com-author">{{ c.author }}</span>
                  <time class="rec-vac-com-date" :datetime="c.at">{{ formatCycleDate(c.at) }}</time>
                </div>
                <p class="rec-vac-com-text">{{ c.text }}</p>
              </div>
            </li>
          </ul>
          <div class="rec-vac-com-compose">
            <UiTextarea
              v-model="newCommentText"
              placeholder="Новый комментарий…"
              rows="3"
              full-width
            />
            <div class="rec-vac-com-actions">
              <UiButton
                variant="secondary"
                size="sm"
                type="button"
                :disabled="!newCommentText.trim()"
                @click="submitVacancyComment"
              >
                Отправить
              </UiButton>
            </div>
          </div>
        </div>
      </section>
    </template>

    <div v-if="cycleToast" class="rec-cycle-toast" role="status">{{ cycleToast }}</div>

    <RecruitingStageTransitionModal
      v-if="cycleTransitionOpen && cyclePending"
      :title="cycleModalTitle"
      :pending="cyclePending"
      :form="cycleTransitionForm"
      :error="cycleTransitionError"
      :stage-title-fn="stageTitle"
      @close="closeCycleTransition"
      @confirm="confirmCycleTransition"
    />
  </div>
</template>

<style scoped>
.rec-vac-detail {
  width: 100%;
  min-width: 0;
}

/* Отступ между pill-вкладками и контентом */
.rec-vac-pill-tabs {
  margin-bottom: 28px;
}

.rec-vac-tab-panel {
  min-width: 0;
}

.rec-vac-empty-state {
  margin: 0;
  font-size: 14px;
  color: #999;
  line-height: 1.5;
}

/* Вкладки кроме «Цикл» */
.rec-vac-panel {
  min-width: 0;
}

.rec-vac-panel-card {
  overflow: hidden;
}

.rec-vac-panel-card--pad {
  padding: 16px 18px 18px;
}

.rec-vac-mini-table {
  font-size: 13px;
}

.rec-vac-doc-upload-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
  padding-bottom: 14px;
  border-bottom: 1px solid #f0f0f0;
}

.rec-vac-doc-upload-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.rec-vac-doc-upload-hint {
  font-size: 11.5px;
  color: #aaa;
  line-height: 1.35;
  flex: 1;
  min-width: 200px;
}

.rec-vac-doc-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.rec-vac-doc-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}
.rec-vac-doc-download {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  margin-left: auto;
  margin-top: -2px;
}
.rec-vac-doc-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}
.rec-vac-doc-ic {
  color: #bbb;
  flex-shrink: 0;
  margin-top: 2px;
}
.rec-vac-doc-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.rec-vac-doc-name {
  font-size: 13px;
  font-weight: 500;
  color: #1a1a1a;
}
.rec-vac-doc-date {
  font-size: 11.5px;
  color: #999;
}

/* Подробности: те же приёмы, что на Dashboard (stats-grid, card, panel) */
.rec-vac-detail-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
}

.rec-vac-detail-page .stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}
@media (max-width: 900px) {
  .rec-vac-detail-page .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 420px) {
  .rec-vac-detail-page .stats-grid {
    grid-template-columns: 1fr;
  }
}

.rec-vac-detail-page .stats-grid > .card {
  padding: 12px 14px;
  border-radius: 8px;
  border-color: #ebebeb;
  background: #fff;
}

.rec-vac-detail-page .card {
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 10px;
}

.rec-vac-detail-page .stat-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.rec-vac-detail-page .stat-label {
  font-size: 11px;
  color: #8a8a8a;
  font-weight: 500;
  letter-spacing: 0.01em;
  line-height: 1.3;
}

.rec-vac-detail-page .stat-value {
  font-size: 20px;
  font-weight: 500;
  color: #1a1a1a;
  letter-spacing: -0.02em;
  line-height: 1.15;
}

.rec-vac-detail-page .stat-value.green {
  color: #3d9a6e;
}

.rec-vac-detail-page .stat-value--detail {
  font-size: 14px;
  font-weight: 500;
  letter-spacing: -0.01em;
  line-height: 1.35;
  word-break: break-word;
}

.rec-vac-detail-stat-mono {
  font-variant-numeric: tabular-nums;
}

.rec-vac-detail-page .panel {
  padding: 0;
  overflow: hidden;
}

.rec-vac-detail-page .panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 14px 20px 12px;
  border-bottom: 1px solid #f5f5f5;
}

.rec-vac-detail-page .panel-title {
  margin: 0;
  font-size: 13px;
  font-weight: 500;
  color: #1a1a1a;
  min-width: 0;
}

.rec-vac-detail-page .panel-title--icon {
  display: flex;
  align-items: center;
  gap: 7px;
}

.rec-vac-detail-page .panel-title-ic {
  color: #aaa;
  flex-shrink: 0;
}

.rec-vac-detail-fields {
  padding: 14px 20px 18px;
}

.rec-vac-detail-aside-body {
  padding: 14px 20px 18px;
}

.rec-vac-detail-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(260px, 320px);
  gap: 16px;
  align-items: start;
}
@media (max-width: 1040px) {
  .rec-vac-detail-body {
    grid-template-columns: 1fr;
  }
}

.rec-vac-detail-col-main {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.rec-vac-detail-field {
  display: grid;
  grid-template-columns: minmax(130px, 175px) 1fr;
  gap: 10px 20px;
  padding: 11px 0;
  border-bottom: 1px solid #f5f5f5;
  font-size: 13px;
  align-items: start;
}
.rec-vac-detail-field:last-child {
  border-bottom: none;
}
@media (max-width: 560px) {
  .rec-vac-detail-field {
    grid-template-columns: 1fr;
    gap: 4px;
    padding: 12px 0;
  }
}
.rec-vac-detail-field--block .rec-vac-detail-field-value {
  white-space: pre-wrap;
}
.rec-vac-detail-field-label {
  color: #888;
  font-weight: 500;
  font-size: 12.5px;
  line-height: 1.45;
}
.rec-vac-detail-field-value {
  color: #1a1a1a;
  line-height: 1.5;
  word-break: break-word;
}
.rec-vac-detail-field-value--accent {
  font-weight: 600;
  color: #1a1a1a;
}
.rec-vac-detail-field-value--mono {
  font-variant-numeric: tabular-nums;
}
.rec-vac-detail-inline-muted {
  font-weight: 500;
  color: #aaa;
  font-size: 12.5px;
}

.rec-vac-detail-status-pill {
  display: inline-block;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 8px;
}
.rec-vac-detail-status-pill--open {
  color: #1d4ed8;
  background: #eff6ff;
}
.rec-vac-detail-status-pill--paused {
  color: #b45309;
  background: #fffbeb;
}
.rec-vac-detail-status-pill--closed {
  color: #6b7280;
  background: #f3f4f6;
}

.rec-vac-detail-col-aside {
  position: sticky;
  top: 12px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
@media (max-width: 1040px) {
  .rec-vac-detail-col-aside {
    position: static;
  }
}

.rec-vac-appr-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.rec-vac-appr-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 12px;
}
.rec-vac-appr-avatar {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e0e7ff, #fae8ff);
  color: #4338ca;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}
.rec-vac-appr-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.rec-vac-appr-name {
  font-weight: 600;
  color: #1a1a1a;
  font-size: 13px;
}
.rec-vac-appr-line {
  color: #888;
  line-height: 1.35;
}
.rec-vac-appr-check {
  flex-shrink: 0;
  color: #22c55e;
  margin-top: 2px;
}

.rec-vac-aside-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 12px;
  color: #888;
  font-family: inherit;
  font-weight: 500;
  padding: 3px 4px;
  border-radius: 5px;
  transition:
    color 0.15s,
    background 0.15s;
}
.rec-vac-aside-link:hover {
  color: #1a1a1a;
  background: #f5f5f5;
}
.rec-vac-aside-com-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.rec-vac-aside-com-list .rec-vac-com-item {
  padding: 12px 0;
}
.rec-vac-aside-com-list .rec-vac-com-item:first-child {
  padding-top: 0;
}
.rec-vac-aside-com-list .rec-vac-com-avatar {
  width: 32px;
  height: 32px;
  font-size: 11px;
  border-radius: 9px;
}
.rec-vac-aside-com-list .rec-vac-com-text {
  font-size: 13px;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.rec-vac-aside-empty {
  margin: 0;
  font-size: 12px;
  color: #aaa;
  line-height: 1.4;
}

.rec-vac-int-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.rec-vac-int-item {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  font-size: 13px;
}
.rec-vac-int-ic {
  color: #94a3b8;
  flex-shrink: 0;
}
.rec-vac-int-body {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.rec-vac-int-name {
  font-weight: 600;
  color: #1a1a1a;
}
.rec-vac-int-status {
  font-size: 11px;
  font-weight: 600;
  color: #059669;
  background: #ecfdf5;
  padding: 2px 8px;
  border-radius: 6px;
}
.rec-vac-int-hint {
  width: 100%;
  flex-basis: 100%;
  margin-left: 26px;
  font-size: 12px;
  color: #888;
  line-height: 1.35;
}
@media (min-width: 520px) {
  .rec-vac-int-hint {
    width: auto;
    flex: 1;
    flex-basis: auto;
    margin-left: 0;
    text-align: right;
  }
}

.rec-vac-int-card {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.rec-vac-int-head {
  padding-bottom: 2px;
  border-bottom: 1px solid #f0f0f0;
}
.rec-vac-int-title-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 10px 14px;
  margin-bottom: 8px;
}
.rec-vac-int-head-ic {
  color: #64748b;
  flex-shrink: 0;
  margin-top: 2px;
}
.rec-vac-int-title-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  flex: 1;
}
.rec-vac-int-title {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}
.rec-vac-int-sub {
  font-size: 12.5px;
  line-height: 1.4;
  color: #64748b;
}
.rec-vac-int-demo-note {
  margin: 0;
  font-size: 11.5px;
  line-height: 1.4;
  color: #94a3b8;
}
.rec-vac-hh-pill {
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 6px;
  margin-left: auto;
}
.rec-vac-hh-pill--ok {
  color: #15803d;
  background: #ecfdf5;
}
.rec-vac-hh-pill--warn {
  color: #b45309;
  background: #fffbeb;
}
.rec-vac-hh-pill--muted {
  color: #64748b;
  background: #f1f5f9;
}
.rec-vac-int-toast {
  margin: 0;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 12.5px;
  line-height: 1.45;
  color: #0f172a;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
}
.rec-vac-int-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}
@media (max-width: 900px) {
  .rec-vac-int-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 480px) {
  .rec-vac-int-metrics {
    grid-template-columns: 1fr;
  }
}
.rec-vac-int-metric {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #e8ecf1;
  background: #fafbfc;
}
.rec-vac-int-metric--link {
  grid-column: 1 / -1;
}
@media (min-width: 901px) {
  .rec-vac-int-metric--link {
    grid-column: span 3;
  }
}
.rec-vac-int-metric-label {
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #94a3b8;
}
.rec-vac-int-metric-value {
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
  line-height: 1.35;
  word-break: break-word;
}
.rec-vac-int-metric-value--mono {
  font-variant-numeric: tabular-nums;
}
.rec-vac-int-metric-value--bad {
  color: #b91c1c;
}
.rec-vac-int-ext-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #2563eb;
  text-decoration: none;
}
.rec-vac-int-ext-link:hover {
  text-decoration: underline;
  text-underline-offset: 2px;
}
.rec-vac-int-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.rec-vac-int-btn-ic {
  flex-shrink: 0;
  margin-right: 2px;
}
@keyframes rec-vac-int-spin {
  to {
    transform: rotate(360deg);
  }
}
.rec-vac-int-icon-spin {
  animation: rec-vac-int-spin 0.75s linear infinite;
}
.rec-vac-int-help {
  margin: 0;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px dashed #e2e8f0;
  background: #fff;
}
.rec-vac-int-help-sum {
  font-size: 12.5px;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
}
.rec-vac-int-help-body {
  margin: 8px 0 0;
  font-size: 12px;
  line-height: 1.5;
  color: #64748b;
}

/* История и комментарии: лента событий */
.rec-vac-feed-card {
  padding: 0;
  overflow: hidden;
}

.rec-vac-hist-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.rec-vac-hist-item {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  padding: 14px 18px;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.12s ease;
}
.rec-vac-hist-item:last-child {
  border-bottom: none;
}
.rec-vac-hist-item:hover {
  background: #fafafa;
}

.rec-vac-hist-icon {
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(145deg, #eef2ff 0%, #faf5ff 100%);
  border: 1px solid #e8e8ef;
}

.rec-vac-hist-ic {
  color: #6366f1;
}

.rec-vac-hist-body {
  flex: 1;
  min-width: 0;
  padding-top: 1px;
}

.rec-vac-hist-date {
  display: block;
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #9ca3af;
  margin-bottom: 6px;
}

.rec-vac-hist-text {
  margin: 0;
  font-size: 13.5px;
  line-height: 1.5;
  color: #374151;
}

.rec-vac-com-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.rec-vac-com-item {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  padding: 14px 18px;
  border-bottom: 1px solid #f0f0f0;
}
.rec-vac-com-item:last-child {
  border-bottom: none;
}

.rec-vac-com-avatar {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12.5px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #4f46e5;
  background: linear-gradient(145deg, #eef2ff 0%, #faf5ff 100%);
  border: 1px solid #e5e7eb;
}

.rec-vac-com-body {
  flex: 1;
  min-width: 0;
}

.rec-vac-com-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 6px 12px;
  margin-bottom: 6px;
}

.rec-vac-com-author {
  font-size: 13px;
  font-weight: 600;
  color: #111827;
}

.rec-vac-com-date {
  font-size: 11.5px;
  font-weight: 500;
  color: #9ca3af;
}

.rec-vac-com-text {
  margin: 0;
  font-size: 13.5px;
  line-height: 1.5;
  color: #4b5563;
}

.rec-vac-com-compose {
  padding: 16px 18px 18px;
  background: #fafbfc;
  border-top: 1px solid #ececec;
}

.rec-vac-com-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

/* ── Цикл ── */
.rec-vac-cycle {
  min-width: 0;
}

.rec-cycle-view-switch {
  flex-shrink: 0;
}

.card {
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 10px;
}

.rec-vac-list-card {
  padding: 0;
  overflow: hidden;
}

/* Kanban: на всю ширину колонки main (сайдбар 280px + отступы main-content 24px). Таблица: без класса. */
.rec-vac-list-card--kanban-full {
  width: calc(100vw - 328px);
  max-width: none;
  margin-left: calc((100% - 100vw + 328px) / 2);
  box-sizing: border-box;
}

.rec-vac-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  background: #fff;
}

.rec-vac-toolbar-left {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.rec-vac-search-wrap {
  width: 280px;
  max-width: min(100%, 320px);
  flex: 0 0 auto;
}

.rec-vac-search-wrap :deep(.ui-search-field) {
  width: 100%;
  max-width: 100%;
}

.rec-vac-filters-toggle-inner {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.rec-vac-toolbar-right {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

.rec-vac-toolbar-status-view {
  display: inline-flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.rec-vac-status-field {
  display: block;
  margin: 0;
  min-width: 0;
}

.rec-vac-status-select {
  min-width: 170px;
  max-width: 100%;
}

.visually-hidden {
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

@media (max-width: 720px) {
  .rec-vac-toolbar-right {
    margin-left: 0;
    width: 100%;
  }
}

.rec-vac-table-outer {
  border-radius: 0;
}

.rec-cycle-table-wrap {
  overflow-x: auto;
}

.rec-cycle-row-click {
  cursor: pointer;
}

.rec-cycle-row-click:focus-visible {
  outline: 2px solid #93c5fd;
  outline-offset: -2px;
}

.rec-vac-cycle-kanban-inner {
  padding: 16px 20px 20px;
  min-width: 0;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.data-table thead tr {
  border-bottom: 1px solid #f0f0f0;
}

.data-table th {
  padding: 10px 16px;
  font-size: 11.5px;
  font-weight: 500;
  color: #aaa;
  text-align: left;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.data-table tbody tr {
  border-bottom: 1px solid #f5f5f5;
  transition: background 0.12s;
}

.data-table tbody tr:hover {
  background: #fafafa;
}

.data-table tbody tr:last-child {
  border-bottom: none;
}

.data-table td {
  padding: 12px 16px;
  color: #444;
  vertical-align: middle;
}

.data-table .align-right {
  text-align: right;
}

.rec-cycle-candidate {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.rec-cycle-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(145deg, #e8e8e8, #d4d4d4);
  color: #555;
  font-size: 0.72rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.rec-cycle-avatar--sm {
  width: 32px;
  height: 32px;
  font-size: 0.65rem;
}

.rec-cycle-name {
  font-weight: 500;
  color: #1a1a1a;
}

.rec-cycle-stage-cell {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-width: 320px;
}

.rec-cycle-segbar {
  display: flex;
  gap: 3px;
  height: 8px;
}

.rec-cycle-seg {
  flex: 1;
  min-width: 0;
  height: 100%;
  border-radius: 2px;
  background: #e8e8e8;
}

.rec-cycle-stage-hint {
  display: block;
  margin-top: 6px;
  padding-left: 8px;
  border-left: 3px solid transparent;
  font-size: 11.5px;
  color: #555;
  line-height: 1.35;
}

.rec-cycle-mono {
  font-variant-numeric: tabular-nums;
}

.rec-cycle-muted {
  color: #666;
  font-variant-numeric: tabular-nums;
}

.rec-cycle-tag {
  display: inline-block;
  font-size: 12px;
  color: #555;
  background: #f0f0f0;
  padding: 3px 8px;
  border-radius: 6px;
}

.rec-cycle-dash {
  color: #ccc;
}

.rec-cycle-empty-row {
  text-align: center;
  color: #999;
  padding: 24px 16px !important;
}

/* Kanban */
.rec-cycle-kanban {
  min-width: 0;
}

/* Birinchi qator: barcha ustun sarlavhalari bir xil balandlik (CSS Grid) */
.rec-cycle-kanban-scroll.rec-cycle-kanban-grid {
  display: grid;
  grid-template-rows: auto auto;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 8px;
  scrollbar-gutter: stable;
}

.rec-cycle-col-head {
  display: flex;
  flex-wrap: nowrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  padding: 0 4px 10px;
  border-bottom-width: 2px;
  border-bottom-style: solid;
  box-sizing: border-box;
  align-self: stretch;
  min-height: 0;
}

.rec-cycle-col-title {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.35;
}

.rec-cycle-col-badge {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  min-width: 22px;
  height: 22px;
  padding: 0 7px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  margin-top: 1px;
}

.rec-cycle-col-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 4px 8px 8px 4px;
  margin: -4px -8px -8px -4px;
  min-width: 0;
  min-height: 120px;
  align-self: stretch;
  border-radius: 10px;
  transition: background 0.12s ease;
}

.rec-cycle-col-body--active {
  background: rgba(100, 100, 110, 0.07);
}

/** Слот вставки — мягкий голубой, чуть выше тонкой полоски. */
.rec-cycle-drop-slot {
  flex-shrink: 0;
  height: 14px;
  min-height: 14px;
  margin: 4px 0 6px;
  border-radius: 7px;
  border: none;
  background: linear-gradient(
    180deg,
    rgba(96, 165, 250, 0.42) 0%,
    rgba(147, 197, 253, 0.28) 100%
  );
  box-sizing: border-box;
  pointer-events: none;
}

.rec-cycle-card {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  padding: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.rec-cycle-card--interactive {
  cursor: move;
  user-select: none;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    background 0.15s ease,
    opacity 0.12s ease;
}

.rec-cycle-card--interactive:active {
  cursor: move;
}

.rec-cycle-card--interactive:hover {
  border-color: #d4d4d4;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
  background: #fafafa;
}

.rec-cycle-card--interactive:focus-visible {
  outline: 2px solid #1a1a1a;
  outline-offset: 2px;
}

.rec-cycle-card--dragging {
  opacity: 0.55;
  cursor: move !important;
}

/* Курсор «перемещение» на время HTML5 drag (как системный move). */
:global(body.rec-cycle-dnd-active) {
  cursor: move !important;
}

.rec-cycle-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
}

.rec-cycle-card-tenure {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #888;
}

.rec-cycle-card-tenure-ic {
  flex-shrink: 0;
  color: #aaa;
}

.rec-cycle-card-name {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 10px;
}

.rec-cycle-card-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 12px;
  margin-bottom: 6px;
}

.rec-cycle-card-k {
  color: #999;
}

.rec-cycle-card-v {
  color: #444;
  font-variant-numeric: tabular-nums;
  font-weight: 500;
}
</style>

<style>
/* Toast канбана — вне scoped */
.rec-cycle-toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 99;
  max-width: min(420px, calc(100% - 32px));
  padding: 10px 16px;
  border-radius: 10px;
  background: #1e293b;
  color: #f8fafc;
  font-size: 13px;
  line-height: 1.45;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
  pointer-events: none;
}
</style>
