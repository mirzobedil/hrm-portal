<script setup>
import { computed, ref } from 'vue'
import {
  Briefcase, Users, CalendarClock, FileSignature, Plus,
} from 'lucide-vue-next'
import { UiSearchField, UiSelect } from '@/components/ui'
import {
  VACANCIES,
  CANDIDATES,
  INTERVIEWS_WEEK,
  VACANCY_STATUS,
  CANDIDATE_STAGE,
} from '@/constants/recruiting'

const searchVacancy = ref('')
const searchCandidate = ref('')
const stageFilter = ref('')

const openVacanciesCount = computed(() => VACANCIES.filter(v => v.status === 'open').length)

const activeCandidatesCount = computed(() =>
  CANDIDATES.filter(c => c.stage !== 'rejected' && c.stage !== 'hired').length,
)

const offersPending = computed(() => CANDIDATES.filter(c => c.stage === 'offer').length)

const pipelineStages = [
  { key: 'new', label: 'Новый' },
  { key: 'screening', label: 'Скрининг' },
  { key: 'interview', label: 'Интервью' },
  { key: 'offer', label: 'Оффер' },
  { key: 'hired', label: 'Принят' },
  { key: 'rejected', label: 'Отказ' },
]

const pipelineCounts = computed(() => {
  const m = Object.fromEntries(pipelineStages.map(s => [s.key, 0]))
  for (const c of CANDIDATES) {
    if (m[c.stage] !== undefined) m[c.stage]++
  }
  return m
})

const vacanciesFiltered = computed(() => {
  const q = searchVacancy.value.trim().toLowerCase()
  return VACANCIES.filter(v =>
    !q || `${v.title} ${v.dept} ${v.owner}`.toLowerCase().includes(q),
  )
})

const candidatesFiltered = computed(() => {
  const q = searchCandidate.value.trim().toLowerCase()
  return CANDIDATES.filter(c => {
    if (stageFilter.value && c.stage !== stageFilter.value) return false
    if (!q) return true
    return `${c.name} ${c.vacancy} ${c.source}`.toLowerCase().includes(q)
  }).sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
})

const stageFilterOptions = [
  { value: '', label: 'Все этапы' },
  ...pipelineStages.map(s => ({ value: s.key, label: s.label })),
]
</script>

<template>
  <div class="recruiting">
    <!-- Stats -->
    <div class="rec-stats">
      <div class="card rec-stat">
        <div class="rec-stat-top">
          <span class="rec-stat-label">Открытые вакансии</span>
          <Briefcase :size="15" stroke-width="1.5" class="rec-stat-ic" />
        </div>
        <div class="rec-stat-value">{{ openVacanciesCount }}</div>
      </div>
      <div class="card rec-stat">
        <div class="rec-stat-top">
          <span class="rec-stat-label">Активные кандидаты</span>
          <Users :size="15" stroke-width="1.5" class="rec-stat-ic" />
        </div>
        <div class="rec-stat-value rec-stat-value--teal">{{ activeCandidatesCount }}</div>
      </div>
      <div class="card rec-stat">
        <div class="rec-stat-top">
          <span class="rec-stat-label">Собеседования (неделя)</span>
          <CalendarClock :size="15" stroke-width="1.5" class="rec-stat-ic" />
        </div>
        <div class="rec-stat-value">{{ INTERVIEWS_WEEK.length }}</div>
      </div>
      <div class="card rec-stat">
        <div class="rec-stat-top">
          <span class="rec-stat-label">Офферы на решении</span>
          <FileSignature :size="15" stroke-width="1.5" class="rec-stat-ic" />
        </div>
        <div class="rec-stat-value rec-stat-value--amber">{{ offersPending }}</div>
      </div>
    </div>

    <!-- Pipeline funnel -->
    <div class="card rec-funnel">
      <h3 class="rec-funnel-title">Воронка подбора</h3>
      <div class="rec-funnel-row">
        <div
          v-for="s in pipelineStages"
          :key="s.key"
          class="rec-funnel-cell"
        >
          <span class="rec-funnel-count">{{ pipelineCounts[s.key] ?? 0 }}</span>
          <span class="rec-funnel-label">{{ s.label }}</span>
        </div>
      </div>
    </div>

    <div class="rec-two-col">
      <!-- Vacancies -->
      <div class="card rec-panel">
        <div class="rec-panel-head">
          <h3 class="rec-panel-title">Вакансии</h3>
          <button type="button" class="btn-recruit" disabled title="Демо">
            <Plus :size="14" stroke-width="2" /> Новая вакансия
          </button>
        </div>
        <div class="rec-toolbar">
          <UiSearchField v-model="searchVacancy" class="rec-search" placeholder="Поиск..." autocomplete="off" />
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Вакансия</th>
                <th>Отдел</th>
                <th>Статус</th>
                <th class="align-right">Отклики</th>
                <th>Рекрутер</th>
                <th>Обновлено</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="v in vacanciesFiltered" :key="v.id">
                <td class="td-strong">{{ v.title }}</td>
                <td class="col-muted">{{ v.dept }}</td>
                <td>
                  <span :class="['rs-pill', VACANCY_STATUS[v.status]?.class]">
                    {{ VACANCY_STATUS[v.status]?.label }}
                  </span>
                </td>
                <td class="align-right">{{ v.applicants }}</td>
                <td>{{ v.owner }}</td>
                <td class="col-muted">{{ v.updatedAt }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Interviews this week -->
      <div class="card rec-panel rec-panel--aside">
        <h3 class="rec-panel-title">Собеседования на неделе</h3>
        <ul class="rec-interviews">
          <li v-for="it in INTERVIEWS_WEEK" :key="it.id" class="rec-int-item">
            <div class="rec-int-main">
              <span class="rec-int-name">{{ it.candidate }}</span>
              <span class="rec-int-vac">{{ it.vacancy }}</span>
            </div>
            <div class="rec-int-meta">
              {{ it.when }} · {{ it.format }}
            </div>
          </li>
        </ul>
      </div>
    </div>

    <!-- Candidates -->
    <div class="card rec-panel rec-panel--full">
      <div class="rec-panel-head">
        <h3 class="rec-panel-title">Кандидаты</h3>
        <label class="rec-filter">
          <span class="visually-hidden">Этап</span>
          <UiSelect v-model="stageFilter" class="rec-select" :options="stageFilterOptions" />
        </label>
      </div>
      <div class="rec-toolbar">
        <UiSearchField v-model="searchCandidate" class="rec-search" placeholder="Имя, вакансия, источник..." autocomplete="off" />
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Кандидат</th>
              <th>Вакансия</th>
              <th>Этап</th>
              <th>Источник</th>
              <th>Обновлено</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in candidatesFiltered" :key="c.id">
              <td class="td-strong">{{ c.name }}</td>
              <td>{{ c.vacancy }}</td>
              <td>
                <span :class="['st-pill', CANDIDATE_STAGE[c.stage]?.class]">
                  {{ CANDIDATE_STAGE[c.stage]?.label }}
                </span>
              </td>
              <td class="col-muted">{{ c.source }}</td>
              <td class="col-muted">{{ c.updatedAt }}</td>
            </tr>
          </tbody>
        </table>
        <p v-if="candidatesFiltered.length === 0" class="rec-empty">Никого не найдено.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.recruiting {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  overflow-x: hidden;
  contain: inline-size;
}

.card {
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 10px;
}

.rec-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}
@media (max-width: 900px) {
  .rec-stats { grid-template-columns: repeat(2, 1fr); }
}

.rec-stat {
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}
.rec-stat-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.rec-stat-label {
  font-size: 12px;
  color: #999;
  font-weight: 450;
  min-width: 0;
  overflow-wrap: anywhere;
}
.rec-stat-ic { color: #bbb; flex-shrink: 0; }
.rec-stat-value {
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.5px;
  color: #1a1a1a;
  line-height: 1;
}
.rec-stat-value--teal { color: #2ba896; }
.rec-stat-value--amber { color: #d97706; }

.rec-funnel {
  padding: 18px 20px 20px;
  min-width: 0;
  overflow: hidden;
}
.rec-funnel-title {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 14px;
}
.rec-funnel-row {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 8px;
  min-width: 0;
}
@media (max-width: 720px) {
  .rec-funnel-row {
    grid-template-columns: repeat(3, 1fr);
  }
}
.rec-funnel-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 8px;
  background: #fafafa;
  border: 1px solid #eee;
  border-radius: 8px;
  text-align: center;
}
.rec-funnel-count {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
}
.rec-funnel-label {
  font-size: 10.5px;
  font-weight: 500;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  line-height: 1.2;
}

.rec-two-col {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 280px);
  gap: 16px;
  align-items: start;
  min-width: 0;
}
@media (max-width: 900px) {
  .rec-two-col { grid-template-columns: 1fr; }
}

.rec-panel {
  padding: 0;
  overflow: hidden;
  min-width: 0;
}
.rec-panel--aside {
  padding: 16px 18px 18px;
}
.rec-panel--full {
  padding: 0;
  overflow: hidden;
}
.rec-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px 0;
  flex-wrap: wrap;
}
.rec-panel-title {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
}
.rec-panel--aside .rec-panel-title {
  margin-bottom: 12px;
}

.btn-recruit {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  font-size: 12.5px;
  font-weight: 500;
  font-family: inherit;
  color: #666;
  background: #f5f5f5;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  cursor: not-allowed;
  opacity: 0.85;
}

.rec-toolbar {
  padding: 12px 20px 8px;
}
.rec-search {
  max-width: 100%;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}
@media (min-width: 480px) {
  .rec-search { max-width: 360px; width: auto; }
}

.rec-filter { flex-shrink: 0; }
.rec-select {
  min-width: 0;
  max-width: 100%;
  cursor: pointer;
}
@media (min-width: 480px) {
  .rec-select { min-width: 160px; max-width: none; }
}

.table-wrap {
  padding-bottom: 8px;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: hidden;
}
.data-table {
  table-layout: fixed;
  width: 100%;
  max-width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.data-table thead tr { border-bottom: 1px solid #f0f0f0; }
.data-table th {
  padding: 10px 20px;
  font-size: 11.5px;
  font-weight: 500;
  color: #aaa;
  text-align: left;
  overflow-wrap: anywhere;
}
.data-table tbody tr {
  border-bottom: 1px solid #f5f5f5;
  transition: background 0.12s;
}
.data-table tbody tr:hover { background: #fafafa; }
.data-table tbody tr:last-child { border-bottom: none; }
.data-table td {
  padding: 11px 20px;
  color: #444;
  vertical-align: middle;
  overflow-wrap: anywhere;
  word-wrap: break-word;
}

.align-right { text-align: right; }
.col-muted { color: #888; font-size: 12.5px; }
.td-strong { font-weight: 500; color: #1a1a1a; }

.rs-pill {
  display: inline-block;
  font-size: 11.5px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 6px;
}
.rs--open { background: #edf7f2; color: #2d6a4f; }
.rs--paused { background: #fef9ec; color: #b45309; }
.rs--closed { background: #f3f4f6; color: #6b7280; }

.st-pill {
  display: inline-block;
  font-size: 11.5px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 6px;
}
.st--new { background: #eef4ff; color: #3b6fd9; }
.st--screening { background: #f3e8ff; color: #7c3aed; }
.st--interview { background: #e0f2fe; color: #0369a1; }
.st--offer { background: #fef3c7; color: #b45309; }
.st--hired { background: #edf7f2; color: #2d6a4f; }
.st--rejected { background: #fef2f2; color: #b91c1c; }

.rec-interviews {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.rec-int-item {
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}
.rec-int-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}
.rec-int-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.rec-int-name {
  font-size: 13px;
  font-weight: 600;
  color: #222;
}
.rec-int-vac {
  font-size: 12px;
  color: #888;
}
.rec-int-meta {
  font-size: 11.5px;
  color: #aaa;
  margin-top: 6px;
}

.rec-empty {
  text-align: center;
  color: #999;
  font-size: 13px;
  padding: 20px;
  margin: 0;
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
</style>
