<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { LayoutGrid, List, Filter, CalendarClock } from 'lucide-vue-next'
import { UiSearchField, UiButton, UiSwitcher, UiSwitcherTab, UiPillTabs, UiPillTab, UiSelect } from '@/components/ui'
import {
  REC_CYCLE_STAGES,
  REC_CYCLE_CANDIDATES,
  REC_CYCLE_STAGE_SEG_FILL,
  REC_CYCLE_SEGMENT_STAGE_ID,
  getStageColor,
  formatCycleSalary,
  formatCycleDate,
} from '@/data/recruitingVacancyCycleDemo.js'

/**
 * Один массив с демо-данными: канбан DnD и таблица обновляют те же объекты,
 * что и карточка кандидата (getRecruitingCandidateById).
 */
const cycleCandidates = ref(REC_CYCLE_CANDIDATES)

/** Вкладки карточки вакансии (под общим заголовком в App). */
const vacancySectionTab = ref('cycle')

const VACANCY_DETAIL_TABS = [
  { id: 'cycle', label: 'Цикл' },
  { id: 'offer', label: 'Оффер', badge: 3 },
  { id: 'documents', label: 'Документы', badge: 1 },
  { id: 'details', label: 'Подробности' },
  { id: 'integrations', label: 'Интеграции' },
  { id: 'history', label: 'История' },
  { id: 'comments', label: 'Комментарии' },
]

const cycleViewMode = ref('table')
const cycleFilter = ref('all')
const cycleSearch = ref('')

const SEGMENTS = 10

const cycleCounts = computed(() => {
  const all = cycleCandidates.value.length
  const active = cycleCandidates.value.filter((c) => c.pipeline === 'active').length
  const rejected = cycleCandidates.value.filter((c) => c.pipeline === 'rejected').length
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

const cycleRows = computed(() => {
  let rows = cycleCandidates.value
  if (cycleFilter.value === 'active') rows = rows.filter((r) => r.pipeline === 'active')
  if (cycleFilter.value === 'rejected') rows = rows.filter((r) => r.pipeline === 'rejected')
  const q = cycleSearch.value.trim().toLowerCase()
  if (q) {
    rows = rows.filter((r) => {
      const blob = `${r.name} ${r.email} ${r.phone} ${r.vacancyHint ?? ''}`.toLowerCase()
      return blob.includes(q)
    })
  }
  return sortCycleRows(rows)
})

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
  return cycleRows.value.filter((c) => c.stageId === stageId)
}

const route = useRoute()
const router = useRouter()

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
const dropTargetStageId = ref(null)
const DND_MIME = 'application/x-rec-cycle-candidate-id'

function onCardDragStart(e, c) {
  draggingCandidateId.value = c.id
  e.dataTransfer?.setData(DND_MIME, c.id)
  e.dataTransfer?.setData('text/plain', c.id)
  e.dataTransfer.effectAllowed = 'move'
}

function onCardDragEnd() {
  draggingCandidateId.value = null
  dropTargetStageId.value = null
}

function onKanbanColumnDragOver(e, stageId) {
  e.preventDefault()
  e.dataTransfer.dropEffect = 'move'
  dropTargetStageId.value = stageId
}

function onKanbanColumnDragLeave(e) {
  const next = e.relatedTarget
  if (next && e.currentTarget?.contains(next)) return
  dropTargetStageId.value = null
}

function moveCandidateToStage(candidateId, targetStageId) {
  const list = cycleCandidates.value
  const idx = list.findIndex((x) => x.id === candidateId)
  if (idx === -1) return false
  const c = list[idx]
  if (c.stageId === targetStageId) return false

  if (targetStageId === 'failed') {
    c.stageId = 'failed'
    c.pipeline = 'rejected'
    if (!c.failedReason) c.failedReason = 'Переведено в отказ'
  } else {
    c.stageId = targetStageId
    c.pipeline = 'active'
    delete c.failedReason
  }
  return true
}

function onKanbanColumnDrop(e, targetStageId) {
  e.preventDefault()
  dropTargetStageId.value = null
  const id = e.dataTransfer?.getData(DND_MIME) || e.dataTransfer?.getData('text/plain')
  if (!id) return
  if (moveCandidateToStage(id, targetStageId)) blockKanbanCardClick.value = true
}
</script>

<template>
  <div class="rec-vac-detail">
    <UiPillTabs v-model="vacancySectionTab" class="rec-vac-pill-tabs" aria-label="Разделы вакансии">
      <UiPillTab
        v-for="tab in VACANCY_DETAIL_TABS"
        :key="tab.id"
        :id="tab.id"
        :badge="tab.badge"
      >
        {{ tab.label }}
      </UiPillTab>
    </UiPillTabs>

    <template v-if="vacancySectionTab === 'cycle'">
      <section class="rec-vac-cycle" aria-label="Цикл подбора">
        <div class="rec-cycle-head">
          <h2 class="rec-cycle-title">Цикл</h2>
          <UiSwitcher v-model="cycleViewMode" variant="icon" class="rec-cycle-view-switch">
            <UiSwitcherTab id="kanban" title="Канбан">
              <LayoutGrid :size="15" stroke-width="1.75" />
            </UiSwitcherTab>
            <UiSwitcherTab id="table" title="Таблица">
              <List :size="15" stroke-width="1.75" />
            </UiSwitcherTab>
          </UiSwitcher>
        </div>

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
              <label class="rec-vac-status-field">
                <span class="visually-hidden">Кандидаты по статусу</span>
                <UiSelect
                  v-model="cycleFilter"
                  class="rec-vac-status-select"
                  :options="cyclePipelineOptions"
                />
              </label>
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
              gridTemplateColumns: `repeat(${REC_CYCLE_STAGES.length}, minmax(260px, 280px))`,
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
              :class="{ 'rec-cycle-col-body--drop-hover': dropTargetStageId === col.id }"
              :style="{ gridColumn: idx + 1, gridRow: 2 }"
              @dragover="onKanbanColumnDragOver($event, col.id)"
              @dragleave="onKanbanColumnDragLeave"
              @drop="onKanbanColumnDrop($event, col.id)"
            >
              <article
                v-for="c in candidatesInColumn(col.id)"
                :key="c.id"
                class="rec-cycle-card rec-cycle-card--interactive"
                :class="{ 'rec-cycle-card--dragging': draggingCandidateId === c.id }"
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
            </div>
          </div>
        </div>
        </div>
      </section>
    </template>

    <div v-else class="rec-vac-tab-panel" role="tabpanel">
      <p class="rec-vac-empty-state">Карточка вакансии пока пустая — контент будет позже.</p>
    </div>
  </div>
</template>

<style scoped>
.rec-vac-detail {
  width: 100%;
  min-width: 0;
}

/* Как на странице «Рекрутинг»: отступ под pill-вкладками */
.rec-vac-pill-tabs {
  margin-bottom: 16px;
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

/* ── Цикл ── */
.rec-vac-cycle {
  min-width: 0;
}

.rec-cycle-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.rec-cycle-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  letter-spacing: -0.3px;
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
  transition:
    background 0.12s ease,
    outline 0.12s ease;
}

.rec-cycle-col-body--drop-hover {
  background: rgba(37, 99, 235, 0.07);
  outline: 2px dashed rgba(37, 99, 235, 0.4);
  outline-offset: -2px;
}

.rec-cycle-card {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  padding: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.rec-cycle-card--interactive {
  cursor: grab;
  user-select: none;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    background 0.15s ease,
    opacity 0.12s ease;
}

.rec-cycle-card--interactive:active {
  cursor: grabbing;
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
