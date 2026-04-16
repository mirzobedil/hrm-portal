<script setup>
import { computed, ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Briefcase,
  Users,
  CalendarClock,
  FileSignature,
  Timer,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  Filter,
  Plus,
} from 'lucide-vue-next'
import { UiPillTabs, UiPillTab, UiSearchField, UiButton, UiSelect } from '@/components/ui'
import RecruitingDashboardCharts from '@/components/charts/RecruitingDashboardCharts.vue'
import {
  REC_DASH_KPIS,
  REC_AGING_VACANCIES,
  REC_VACANCIES,
} from '@/data/recruitingDashboardDemo.js'
import { REC_CYCLE_STAGES, formatCycleSalary } from '@/data/recruitingVacancyCycleDemo.js'
import {
  REC_CANDIDATES_LIST,
  stageLabelForCandidate,
  pipelineLabel,
  formatCycleDate,
} from '@/data/recruitingCandidatesDemo.js'

const REC_TAB_IDS = ['dashboard', 'vacancies', 'candidates']

const recTab = ref('dashboard')
const route = useRoute()
const router = useRouter()

function syncRecTabFromRoute() {
  if (route.path !== '/recruiting') return
  const t = route.query.tab
  if (typeof t === 'string' && REC_TAB_IDS.includes(t)) {
    if (recTab.value !== t) recTab.value = t
  } else if (recTab.value !== 'dashboard') {
    recTab.value = 'dashboard'
  }
}

onMounted(syncRecTabFromRoute)
watch(() => [route.path, route.query.tab], syncRecTabFromRoute)

watch(recTab, (tab) => {
  if (route.path !== '/recruiting') return
  const want = tab === 'dashboard' ? undefined : tab
  const have = route.query.tab === undefined ? undefined : String(route.query.tab)
  if (have === want || (have === undefined && tab === 'dashboard')) return
  router.replace({ path: '/recruiting', query: tab === 'dashboard' ? {} : { tab } })
})

const kpis = REC_DASH_KPIS
const agingVacancies = REC_AGING_VACANCIES
const allVacancies = REC_VACANCIES

const vacSearchQuery = ref('')
const vacStatusFilter = ref('all')

const vacStatusOptions = [
  { value: 'all', label: 'Все статусы' },
  { value: 'open', label: 'Открыта' },
  { value: 'paused', label: 'На паузе' },
  { value: 'closed', label: 'Закрыта' },
]

const filteredVacancies = computed(() => {
  let list = allVacancies
  if (vacStatusFilter.value !== 'all') {
    list = list.filter((v) => v.status === vacStatusFilter.value)
  }
  const q = vacSearchQuery.value.trim().toLowerCase()
  if (q) {
    list = list.filter((v) => {
      const blob = `${v.title} ${v.dept} ${v.region} ${v.owner} ${v.statusLabel}`.toLowerCase()
      return blob.includes(q)
    })
  }
  return list
})

const fillDeltaAbs = computed(() => Math.abs(kpis.avgTimeToFillDelta))
const fillDeltaPositive = computed(() => kpis.avgTimeToFillDelta > 0)

function vacancyDetailTo(row) {
  return {
    name: 'recruiting-vacancy',
    params: { id: row.id },
    query: { tab: 'vacancies' },
  }
}

/** Переход в карточку: в истории перед деталю остаётся /recruiting?tab=vacancies — «Назад» открывает вкладку «Вакансии». */
function goVacancy(row) {
  const target = vacancyDetailTo(row)
  if (route.path === '/recruiting' && route.query.tab !== 'vacancies') {
    router.replace({ path: '/recruiting', query: { tab: 'vacancies' } }).then(() => router.push(target))
  } else {
    router.push(target)
  }
}

function onNewVacancy() {
  router.push({ name: 'recruiting-hiring-request' })
}

function formatRecDate(iso) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}

const candSearchQuery = ref('')
const candVacancyFilter = ref('all')
const candPipelineFilter = ref('all')
const candStageFilter = ref('all')

const candVacancyOptions = computed(() => [
  { value: 'all', label: 'Все вакансии' },
  ...REC_VACANCIES.map((v) => ({ value: v.id, label: v.title })),
])

const candPipelineOptions = [
  { value: 'all', label: 'Все статусы' },
  { value: 'active', label: 'В подборе' },
  { value: 'rejected', label: 'Отклонён' },
]

const candStageOptions = computed(() => [
  { value: 'all', label: 'Все этапы' },
  ...REC_CYCLE_STAGES.map((s) => ({ value: s.id, label: s.label })),
])

const filteredCandidates = computed(() => {
  let list = REC_CANDIDATES_LIST
  if (candVacancyFilter.value !== 'all') {
    list = list.filter((c) => c.vacancyId === candVacancyFilter.value)
  }
  if (candPipelineFilter.value !== 'all') {
    list = list.filter((c) => c.pipeline === candPipelineFilter.value)
  }
  if (candStageFilter.value !== 'all') {
    list = list.filter((c) => c.stageId === candStageFilter.value)
  }
  const q = candSearchQuery.value.trim().toLowerCase()
  if (q) {
    list = list.filter((c) => {
      const blob = `${c.name} ${c.email} ${c.phone} ${c.vacancyTitle ?? ''} ${stageLabelForCandidate(c)}`.toLowerCase()
      return blob.includes(q)
    })
  }
  return list
})

function goCandidate(row) {
  const target = { name: 'recruiting-candidate', params: { id: row.id } }
  if (route.path === '/recruiting' && route.query.tab !== 'candidates') {
    router.replace({ path: '/recruiting', query: { tab: 'candidates' } }).then(() => router.push(target))
  } else {
    router.push(target)
  }
}
</script>

<template>
  <div class="recruiting">
    <UiPillTabs v-model="recTab" class="rec-page-tabs">
      <UiPillTab id="dashboard">Дашборд</UiPillTab>
      <UiPillTab id="vacancies">Вакансии</UiPillTab>
      <UiPillTab id="candidates">Кандидаты</UiPillTab>
    </UiPillTabs>

    <template v-if="recTab === 'dashboard'">
      <div class="rec-kpi-grid">
        <div class="card rec-kpi">
          <div class="rec-kpi-top">
            <span class="rec-kpi-label">Открытые вакансии</span>
            <Briefcase :size="15" stroke-width="1.5" class="rec-kpi-ic" aria-hidden="true" />
          </div>
          <div class="rec-kpi-val">{{ kpis.openVacancies }}</div>
        </div>
        <div class="card rec-kpi">
          <div class="rec-kpi-top">
            <span class="rec-kpi-label">Активные кандидаты</span>
            <Users :size="15" stroke-width="1.5" class="rec-kpi-ic" aria-hidden="true" />
          </div>
          <div class="rec-kpi-val rec-kpi-val--teal">{{ kpis.activeCandidates }}</div>
        </div>
        <div class="card rec-kpi">
          <div class="rec-kpi-top">
            <span class="rec-kpi-label">Интервью на этой неделе</span>
            <CalendarClock :size="15" stroke-width="1.5" class="rec-kpi-ic" aria-hidden="true" />
          </div>
          <div class="rec-kpi-val">{{ kpis.interviewsWeek }}</div>
        </div>
        <div class="card rec-kpi">
          <div class="rec-kpi-top">
            <span class="rec-kpi-label">Ожидающие офферы</span>
            <FileSignature :size="15" stroke-width="1.5" class="rec-kpi-ic" aria-hidden="true" />
          </div>
          <div class="rec-kpi-val rec-kpi-val--amber">{{ kpis.offersPending }}</div>
        </div>
        <div class="card rec-kpi">
          <div class="rec-kpi-top">
            <span class="rec-kpi-label">Среднее время закрытия</span>
            <Timer :size="15" stroke-width="1.5" class="rec-kpi-ic" aria-hidden="true" />
          </div>
          <div class="rec-kpi-val">{{ kpis.avgTimeToFillDays }} <span class="rec-kpi-unit">дн.</span></div>
          <div
            class="rec-kpi-delta"
            :class="fillDeltaPositive ? 'rec-kpi-delta--warn' : 'rec-kpi-delta--ok'"
          >
            <TrendingUp v-if="fillDeltaPositive" :size="14" stroke-width="2" aria-hidden="true" />
            <TrendingDown v-else :size="14" stroke-width="2" aria-hidden="true" />
            <span v-if="fillDeltaPositive">К месяцу: +{{ fillDeltaAbs }} дн.</span>
            <span v-else>К месяцу: −{{ fillDeltaAbs }} дн.</span>
          </div>
        </div>
        <div class="card rec-kpi">
          <div class="rec-kpi-top">
            <span class="rec-kpi-label">Кандидат → оффер (оценка)</span>
          </div>
          <div class="rec-kpi-val">{{ kpis.offerConversionPct }}%</div>
          <p class="rec-kpi-note">Конверсия зависит от воронки и качества источников</p>
        </div>
      </div>

      <RecruitingDashboardCharts />

      <div class="card rec-aging">
        <div class="rec-aging-pad">
          <div class="rec-aging-head">
            <h3 class="rec-aging-title">Долго открытые вакансии</h3>
            <span class="rec-aging-badge">
              <AlertCircle :size="14" stroke-width="2" aria-hidden="true" />
              Aging
            </span>
          </div>
          <p class="rec-aging-hint">Позиции, требующие контроля (по дням открытия)</p>
        </div>
        <div class="table-card">
          <table class="data-table">
            <thead>
              <tr>
                <th scope="col">Вакансия</th>
                <th scope="col">Подразделение</th>
                <th scope="col">Рекрутер</th>
                <th scope="col" class="align-right">Дней открыта</th>
                <th scope="col" class="align-right">Статус</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in agingVacancies"
                :key="row.id"
                class="row-clickable"
                @click="goVacancy(row)"
              >
                <td class="col-name">{{ row.title }}</td>
                <td class="col-muted">{{ row.dept }}</td>
                <td>{{ row.owner }}</td>
                <td class="align-right rec-aging-days-cell">{{ row.daysOpen }} дн.</td>
                <td class="align-right">
                  <span :class="['rec-vac-status-pill', `rec-vac-status-pill--${row.status}`]">{{
                    row.statusLabel
                  }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <template v-else-if="recTab === 'vacancies'">
      <div class="rec-tab-panel" aria-label="Вакансии">
        <div class="card rec-vac-list-card">
          <div class="rec-vac-toolbar" role="search" aria-label="Поиск и фильтры вакансий">
            <div class="rec-vac-toolbar-left">
              <div class="rec-vac-search-wrap">
                <UiSearchField
                  v-model="vacSearchQuery"
                  placeholder="Вакансия, отдел, регион, рекрутер…"
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
                <span class="visually-hidden">Статус вакансии</span>
                <UiSelect
                  v-model="vacStatusFilter"
                  class="rec-vac-status-select"
                  :options="vacStatusOptions"
                />
              </label>
              <UiButton variant="primary" size="sm" type="button" @click="onNewVacancy">
                <Plus :size="14" stroke-width="2" aria-hidden="true" />
                Новая вакансия
              </UiButton>
            </div>
          </div>

          <div class="table-card rec-vac-table-outer">
            <table class="data-table rec-vac-table-wide">
            <colgroup>
              <col span="6" />
              <col class="rec-vac-c-status" />
            </colgroup>
            <thead>
              <tr>
                <th scope="col">Вакансия</th>
                <th scope="col">Регион</th>
                <th scope="col" class="align-right">Просмотры</th>
                <th scope="col" class="align-right">Отклики</th>
                <th scope="col" class="align-right">В работе</th>
                <th scope="col">Истекает</th>
                <th scope="col" class="align-right">Статус</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in filteredVacancies"
                :key="row.id"
                class="row-clickable"
                @click="goVacancy(row)"
              >
                <td class="col-name">{{ row.title }}</td>
                <td class="col-muted">{{ row.region }}</td>
                <td class="align-right rec-vac-num">{{ row.views }}</td>
                <td class="align-right">
                  <span class="rec-vac-num">{{ row.responses }}</span>
                  <span v-if="row.responsesNew" class="rec-vac-new">+{{ row.responsesNew }}</span>
                </td>
                <td class="align-right rec-vac-num">{{ row.inPipeline }}</td>
                <td class="col-muted">{{ formatRecDate(row.expiresAt) }}</td>
                <td class="align-right">
                  <span :class="['rec-vac-status-pill', `rec-vac-status-pill--${row.status}`]">{{
                    row.statusLabel
                  }}</span>
                </td>
              </tr>
              <tr v-if="filteredVacancies.length === 0">
                <td colspan="7" class="rec-vac-empty">Ничего не найдено — измените поиск или фильтры.</td>
              </tr>
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </template>

    <template v-else-if="recTab === 'candidates'">
      <div class="rec-tab-panel" aria-label="Кандидаты">
        <div class="card rec-vac-list-card">
          <div class="rec-vac-toolbar" role="search" aria-label="Поиск и фильтры кандидатов">
            <div class="rec-vac-toolbar-left">
              <div class="rec-vac-search-wrap">
                <UiSearchField
                  v-model="candSearchQuery"
                  placeholder="Имя, email, телефон, вакансия…"
                  autocomplete="off"
                />
              </div>
              <UiButton variant="secondary" size="sm" type="button" class="rec-cand-filters-btn">
                <span class="rec-vac-filters-toggle-inner">
                  <Filter :size="14" stroke-width="2" aria-hidden="true" />
                  Фильтры
                </span>
              </UiButton>
            </div>
            <div class="rec-vac-toolbar-right rec-cand-toolbar-filters">
              <label class="rec-vac-status-field">
                <span class="visually-hidden">Вакансия</span>
                <UiSelect
                  v-model="candVacancyFilter"
                  class="rec-vac-status-select rec-cand-filter-select"
                  :options="candVacancyOptions"
                />
              </label>
              <label class="rec-vac-status-field">
                <span class="visually-hidden">Статус воронки</span>
                <UiSelect
                  v-model="candPipelineFilter"
                  class="rec-vac-status-select rec-cand-filter-select"
                  :options="candPipelineOptions"
                />
              </label>
              <label class="rec-vac-status-field">
                <span class="visually-hidden">Этап воронки</span>
                <UiSelect
                  v-model="candStageFilter"
                  class="rec-vac-status-select rec-cand-filter-select"
                  :options="candStageOptions"
                />
              </label>
            </div>
          </div>
          <div class="table-card rec-vac-table-outer">
            <table class="data-table rec-vac-table-wide rec-cand-table">
              <thead>
                <tr>
                  <th scope="col">Кандидат</th>
                  <th scope="col">Вакансия</th>
                  <th scope="col">Этап</th>
                  <th scope="col">Статус</th>
                  <th scope="col" class="align-right">Зарплата</th>
                  <th scope="col">Отклик</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in filteredCandidates"
                  :key="row.id"
                  class="row-clickable"
                  @click="goCandidate(row)"
                >
                  <td class="col-name">{{ row.name }}</td>
                  <td class="col-muted">{{ row.vacancyTitle }}</td>
                  <td>{{ stageLabelForCandidate(row) }}</td>
                  <td>
                    <span
                      :class="[
                        'rec-cand-pill',
                        row.pipeline === 'rejected' ? 'rec-cand-pill--muted' : 'rec-cand-pill--active',
                      ]"
                    >{{ pipelineLabel(row.pipeline) }}</span>
                  </td>
                  <td class="align-right rec-vac-num">{{ formatCycleSalary(row.salary) }}</td>
                  <td class="col-muted">{{ formatCycleDate(row.addedAt) }}</td>
                </tr>
                <tr v-if="filteredCandidates.length === 0">
                  <td colspan="6" class="rec-vac-empty">Ничего не найдено — измените поиск или фильтры.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>
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

.rec-page-tabs {
  margin-bottom: 4px;
}

.card {
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 10px;
}

.rec-kpi-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
  min-width: 0;
}
@media (max-width: 1100px) {
  .rec-kpi-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
@media (max-width: 640px) {
  .rec-kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.rec-kpi {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}
.rec-kpi-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}
.rec-kpi-label {
  font-size: 11.5px;
  color: #999;
  font-weight: 500;
  line-height: 1.35;
  min-width: 0;
}
.rec-kpi-ic {
  color: #bbb;
  flex-shrink: 0;
}
.rec-kpi-val {
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.5px;
  color: #1a1a1a;
  line-height: 1.1;
}
.rec-kpi-val--teal {
  color: #2ba896;
}
.rec-kpi-val--amber {
  color: #d97706;
}
.rec-kpi-unit {
  font-size: 13px;
  font-weight: 500;
  color: #999;
}

.rec-kpi-delta {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-top: 2px;
  font-size: 11.5px;
  font-weight: 500;
}
.rec-kpi-delta--ok {
  color: #2d6a4f;
}
.rec-kpi-delta--warn {
  color: #b45309;
}

.rec-kpi-note {
  margin: 0;
  font-size: 10.5px;
  color: #b0b0b0;
  line-height: 1.35;
}

.rec-tab-panel {
  min-height: 120px;
}

.rec-vac-list-card {
  padding: 0;
  overflow: hidden;
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

.rec-cand-toolbar-filters .rec-cand-filter-select {
  min-width: 140px;
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

.rec-vac-table-outer {
  border-radius: 0;
}

.rec-vac-empty {
  text-align: center;
  padding: 28px 20px !important;
  color: #999;
  font-size: 13px;
}

@media (max-width: 720px) {
  .rec-vac-toolbar-right {
    margin-left: 0;
    width: 100%;
  }
}

.rec-aging {
  padding: 0;
  min-width: 0;
  overflow: hidden;
}
.rec-aging-pad {
  padding: 16px 18px 12px;
}
.rec-aging-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.rec-aging-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
}
.rec-aging-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 600;
  color: #b45309;
  background: #fffbeb;
  border: 1px solid #fde68a;
  padding: 4px 8px;
  border-radius: 6px;
}
.rec-aging-hint {
  margin: 6px 0 0;
  font-size: 11px;
  color: #aaa;
}

.row-clickable {
  cursor: pointer;
}

.rec-aging-days-cell {
  font-weight: 600;
  color: #c2410c;
  font-variant-numeric: tabular-nums;
}

/* Таблица вакансий: фиксированная ширина последнего столбца (статус) */
.data-table.rec-vac-table-wide {
  width: 100%;
  min-width: 880px;
  table-layout: fixed;
}

.rec-vac-num {
  font-variant-numeric: tabular-nums;
}

.rec-vac-new {
  margin-left: 5px;
  font-size: 11px;
  font-weight: 700;
  color: #2ba896;
}

.data-table.rec-vac-table-wide col.rec-vac-c-status {
  width: 104px;
}

.data-table.rec-vac-table-wide th:last-child,
.data-table.rec-vac-table-wide td:last-child {
  padding-right: 12px;
}

.rec-vac-status-pill {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 6px;
  border: 1px solid transparent;
}
.rec-vac-status-pill--open {
  color: #2d6a4f;
  background: #edf7f2;
  border-color: #c6e9dc;
}
.rec-vac-status-pill--paused {
  color: #b45309;
  background: #fffbeb;
  border-color: #fde68a;
}
.rec-vac-status-pill--closed {
  color: #6b7280;
  background: #f3f4f6;
  border-color: #e5e7eb;
}

.data-table.rec-cand-table {
  min-width: 820px;
}

.rec-cand-pill {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 6px;
  border: 1px solid transparent;
}
.rec-cand-pill--active {
  color: #1d4ed8;
  background: #eff6ff;
  border-color: #bfdbfe;
}
.rec-cand-pill--muted {
  color: #6b7280;
  background: #f3f4f6;
  border-color: #e5e7eb;
}
</style>
