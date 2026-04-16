<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import {
  Phone, Mail, Copy, Calendar, Briefcase, MapPin, FileText, Send,
} from 'lucide-vue-next'
import { UiPillTabs, UiPillTab, UiButton, UiTextarea } from '@/components/ui'
import { formatCycleSalary } from '@/data/recruitingVacancyCycleDemo.js'
import {
  getRecruitingCandidateById,
  getCandidateTimeline,
  getCandidateDocs,
  daysInPipeline,
  pipelineLabel,
  stageLabelForCandidate,
  formatCycleDate,
} from '@/data/recruitingCandidatesDemo.js'

const route = useRoute()
const router = useRouter()

const candId = computed(() => String(route.params.id))
const cand = computed(() => getRecruitingCandidateById(candId.value))

function initials(name) {
  const p = (name || '').split(/\s+/).filter(Boolean)
  if (p.length >= 2) return (p[0][0] + p[1][0]).toUpperCase()
  return (name || '??').slice(0, 2).toUpperCase()
}

const timeline = computed(() => getCandidateTimeline(candId.value))
const docs = computed(() => getCandidateDocs(candId.value))
const pipelineDays = computed(() => (cand.value ? daysInPipeline(cand.value.addedAt) : 0))

const activeTab = ref('general')
const tabs = [
  { id: 'general', label: 'Общие сведения' },
  { id: 'pipeline', label: 'Воронка и интервью' },
  { id: 'docs', label: 'Документы' },
]

const hrNote = ref('')

async function copyText(text) {
  if (!text || text === '—') return
  try { await navigator.clipboard.writeText(text) } catch { /* */ }
}

const backVacancyId = computed(() => {
  const v = route.query.vacancy
  if (v == null || v === '') return null
  return String(v)
})

const backLabel = computed(() =>
  backVacancyId.value ? 'Назад к вакансии' : 'Назад к списку кандидатов',
)

function goBack() {
  if (backVacancyId.value) {
    router.push({ name: 'recruiting-vacancy', params: { id: backVacancyId.value } })
  } else {
    router.push({ path: '/recruiting', query: { tab: 'candidates' } })
  }
}

function fmtTimelineDate(iso) {
  return formatCycleDate(iso)
}
</script>

<template>
  <div class="ep">
    <div v-if="!cand" class="ep-not-found card">
      <p class="ep-not-found-text">Кандидат не найден</p>
      <UiButton variant="secondary" @click="goBack">{{ backLabel }}</UiButton>
    </div>

    <template v-else>
      <div class="card ep-hero">
        <div class="ep-hero-top">
          <div class="ep-hero-avatar-block">
            <div class="ep-hero-avatar" aria-hidden="true">{{ initials(cand.name) }}</div>
            <span
              class="ep-hero-status"
              :class="cand.pipeline === 'rejected' ? 'ep-hero-status--muted' : ''"
            >{{ pipelineLabel(cand.pipeline) }}</span>
          </div>
          <div class="ep-hero-center">
            <p class="ep-hero-dept">
              {{ cand.dept }} · {{ cand.region }}
              <template v-if="cand.vacancyTitle"> · {{ cand.vacancyTitle }}</template>
            </p>
            <h2 class="ep-hero-name">{{ cand.name }}</h2>
            <p class="ep-hero-position">{{ cand.vacancyHint || 'Кандидат' }}</p>
            <div class="ep-hero-contact">
              <span class="ep-hero-ic-line"><Mail :size="14" stroke-width="2" /> {{ cand.email }}</span>
              <span v-if="cand.phone" class="ep-hero-ic-line"><Phone :size="14" stroke-width="2" /> {{ cand.phone }}</span>
            </div>
          </div>
        </div>
        <div class="ep-hero-summary ep-hero-summary--4">
          <div class="ep-hero-sum-cell">
            <span class="ep-hero-sum-label">Этап</span>
            <span class="ep-hero-sum-value">{{ stageLabelForCandidate(cand) }}</span>
          </div>
          <div class="ep-hero-sum-cell">
            <span class="ep-hero-sum-label">Источник</span>
            <span class="ep-hero-sum-value">{{ cand.source }}</span>
          </div>
          <div class="ep-hero-sum-cell">
            <span class="ep-hero-sum-label">Дата отклика</span>
            <span class="ep-hero-sum-value">{{ formatCycleDate(cand.addedAt) }}</span>
          </div>
          <div class="ep-hero-sum-cell">
            <span class="ep-hero-sum-label">Ожидания по ЗП</span>
            <span class="ep-hero-sum-value">{{ formatCycleSalary(cand.salary) }}</span>
          </div>
        </div>
      </div>

      <UiPillTabs v-model="activeTab" class="ep-tabs">
        <UiPillTab
          v-for="tab in tabs"
          :key="tab.id"
          :id="tab.id"
        >
          {{ tab.label }}
        </UiPillTab>
      </UiPillTabs>

      <div class="ep-layout">
        <div class="ep-main">
          <template v-if="activeTab === 'general'">
            <section class="card ep-block">
              <h3 class="ep-block-title">Подбор</h3>
              <div class="ep-info-grid">
                <div class="ep-info-item">
                  <span class="ep-info-label">Статус воронки</span>
                  <span class="ep-status-pill" :class="cand.pipeline === 'rejected' ? 'ep-status-pill--muted' : ''">
                    {{ pipelineLabel(cand.pipeline) }}
                  </span>
                </div>
                <div class="ep-info-item">
                  <span class="ep-info-label">Этап</span>
                  <span class="ep-info-value">{{ stageLabelForCandidate(cand) }}</span>
                </div>
                <div class="ep-info-item">
                  <span class="ep-info-label">Вакансия</span>
                  <span class="ep-info-value ep-info-value--wrap">
                    <RouterLink
                      v-if="cand.vacancyId"
                      class="ep-vac-link"
                      :to="{ name: 'recruiting-vacancy', params: { id: cand.vacancyId } }"
                    >
                      {{ cand.vacancyTitle }}
                    </RouterLink>
                    <template v-else>{{ cand.vacancyTitle || '—' }}</template>
                  </span>
                </div>
                <div class="ep-info-item">
                  <span class="ep-info-label">Желаемая зарплата</span>
                  <span class="ep-info-value">{{ formatCycleSalary(cand.salary) }}</span>
                </div>
                <div class="ep-info-item">
                  <span class="ep-info-label">Дата отклика</span>
                  <span class="ep-info-value"><Calendar :size="13" class="ep-info-ic" /> {{ formatCycleDate(cand.addedAt) }}</span>
                </div>
                <div class="ep-info-item">
                  <span class="ep-info-label">Последний контакт</span>
                  <span class="ep-info-value">{{ cand.lastContactAt ? formatCycleDate(cand.lastContactAt) : '—' }}</span>
                </div>
              </div>
            </section>

            <section class="card ep-block">
              <h3 class="ep-block-title">Личные данные</h3>
              <div class="ep-info-grid">
                <div class="ep-info-item">
                  <span class="ep-info-label">Дата рождения</span>
                  <span class="ep-info-value">{{ cand.birthDate }}</span>
                </div>
                <div class="ep-info-item">
                  <span class="ep-info-label">Пол</span>
                  <span class="ep-info-value">{{ cand.gender }}</span>
                </div>
                <div class="ep-info-item">
                  <span class="ep-info-label">Город</span>
                  <span class="ep-info-value"><MapPin :size="13" class="ep-info-ic" /> {{ cand.city }}</span>
                </div>
              </div>
            </section>

            <section class="card ep-block">
              <h3 class="ep-block-title">Контакты</h3>
              <div class="ep-info-grid">
                <div class="ep-info-item">
                  <span class="ep-info-label">Email</span>
                  <span class="ep-info-value ep-break-all">
                    {{ cand.email }}
                    <button type="button" class="ep-copy-btn" title="Копировать" @click="copyText(cand.email)">
                      <Copy :size="13" stroke-width="2" />
                    </button>
                  </span>
                </div>
                <div class="ep-info-item">
                  <span class="ep-info-label">Телефон</span>
                  <span class="ep-info-value">
                    {{ cand.phone || '—' }}
                    <button v-if="cand.phone" type="button" class="ep-copy-btn" title="Копировать" @click="copyText(cand.phone)">
                      <Copy :size="13" stroke-width="2" />
                    </button>
                  </span>
                </div>
                <div class="ep-info-item">
                  <span class="ep-info-label">Telegram</span>
                  <span class="ep-info-value">
                    {{ cand.telegram || '—' }}
                    <button
                      v-if="cand.telegram && cand.telegram !== '—'"
                      type="button"
                      class="ep-copy-btn"
                      title="Копировать"
                      @click="copyText(cand.telegram)"
                    >
                      <Copy :size="13" stroke-width="2" />
                    </button>
                  </span>
                </div>
              </div>
            </section>
          </template>

          <template v-if="activeTab === 'pipeline'">
            <div class="ep-vac-cards">
              <div class="card ep-vac-card">
                <span class="ep-vac-card-label">{{ cand.metricLabel }}</span>
                <span class="ep-vac-card-value">{{ cand.metricValue }}</span>
                <span class="ep-vac-card-unit">по данным воронки</span>
              </div>
              <div class="card ep-vac-card">
                <span class="ep-vac-card-label">Дней в подборе</span>
                <span class="ep-vac-card-value ep-vac-card-value--remain">{{ pipelineDays }}</span>
                <span class="ep-vac-card-unit">с даты отклика</span>
              </div>
              <div class="card ep-vac-card">
                <span class="ep-vac-card-label">Текущий этап</span>
                <span class="ep-vac-card-value ep-vac-card-value--sm">{{ stageLabelForCandidate(cand) }}</span>
                <span class="ep-vac-card-unit"> </span>
              </div>
            </div>

            <div class="card ep-table-card">
              <div class="ep-table-card-head">
                <h3 class="ep-block-title">Хронология</h3>
              </div>
              <div v-if="timeline.length" class="table-wrap">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Дата</th>
                      <th>Событие</th>
                      <th>Комментарий</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="ev in timeline" :key="ev.id">
                      <td>{{ fmtTimelineDate(ev.at) }}</td>
                      <td>{{ ev.title }}</td>
                      <td class="col-muted">{{ ev.detail }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p v-else class="ep-empty ep-table-card-empty">Событий пока нет.</p>
            </div>
          </template>

          <template v-if="activeTab === 'docs'">
            <div class="card ep-block">
              <h3 class="ep-block-title">Документы кандидата</h3>
              <ul class="ep-docs-list">
                <li v-for="doc in docs" :key="doc.id" class="ep-doc-item">
                  <FileText :size="16" stroke-width="1.5" class="ep-doc-ic" />
                  <div class="ep-doc-text">
                    <span class="ep-doc-name">{{ doc.name }}</span>
                    <span class="ep-doc-date">{{ doc.date }}</span>
                  </div>
                </li>
              </ul>
              <p v-if="!docs.length" class="ep-empty">Нет прикреплённых файлов.</p>
            </div>
          </template>
        </div>

        <aside class="ep-aside">
          <div class="card ep-aside-card">
            <h4 class="ep-aside-title">Рекрутер</h4>
            <div class="ep-aside-manager">
              <div class="ep-aside-m-av">{{ initials(cand.recruiterName) }}</div>
              <div class="ep-aside-m-text">
                <span class="ep-aside-m-name">{{ cand.recruiterName }}</span>
                <span class="ep-aside-m-role"><Briefcase :size="12" class="ep-aside-m-ic" /> Подбор</span>
              </div>
            </div>
          </div>

          <div class="card ep-aside-card">
            <h4 class="ep-aside-title">Источник и отклик</h4>
            <div class="ep-aside-kv">
              <span class="ep-aside-k">Источник</span>
              <span class="ep-aside-v">{{ cand.source }}</span>
            </div>
            <div v-if="cand.responseTag" class="ep-aside-tag">{{ cand.responseTag }}</div>
            <p v-else class="ep-aside-empty">Тип отклика: стандартный</p>
          </div>

          <div class="card ep-aside-card">
            <h4 class="ep-aside-title">HR-заметка</h4>
            <UiTextarea
              v-model="hrNote"
              placeholder="Внутренняя заметка по кандидату..."
              rows="4"
              full-width
            />
            <UiButton
              variant="secondary"
              size="sm"
              class="ep-note-save"
              :disabled="!hrNote.trim()"
            >
              <Send :size="12" stroke-width="2" /> Сохранить
            </UiButton>
          </div>
        </aside>
      </div>
    </template>
  </div>
</template>

<style scoped>
.ep {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
  max-width: 1080px;
}
.card {
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 10px;
}

.ep-not-found {
  padding: 48px 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}
.ep-not-found-text {
  font-size: 15px;
  color: #999;
  margin: 0;
}

.ep-hero {
  padding: 20px 22px 0;
  overflow: hidden;
}
.ep-hero-top {
  display: flex;
  gap: 18px;
  align-items: flex-start;
  padding-bottom: 18px;
}
.ep-hero-avatar-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.ep-hero-avatar {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  background: linear-gradient(145deg, #dbeafe, #93c5fd);
  color: #1e3a5f;
  font-size: 26px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ep-hero-status {
  font-size: 11px;
  font-weight: 600;
  color: #1d4ed8;
  background: #eff6ff;
  padding: 3px 10px;
  border-radius: 999px;
}
.ep-hero-status--muted {
  color: #6b7280;
  background: #f3f4f6;
}
.ep-hero-center {
  flex: 1;
  min-width: 0;
}
.ep-hero-dept {
  font-size: 12px;
  color: #999;
  margin: 0 0 4px;
}
.ep-hero-name {
  font-size: 22px;
  font-weight: 600;
  color: #1a1a1a;
  letter-spacing: -0.3px;
  margin: 0 0 4px;
  line-height: 1.2;
}
.ep-hero-position {
  font-size: 14px;
  color: #777;
  margin: 0 0 12px;
}
.ep-hero-contact {
  display: flex;
  flex-wrap: wrap;
  gap: 14px 20px;
  font-size: 13px;
  color: #555;
}
.ep-hero-ic-line {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.ep-hero-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  padding: 14px 0 18px;
  border-top: 1px solid #f0f0f0;
}
.ep-hero-summary--4 {
  grid-template-columns: repeat(4, 1fr);
}
.ep-hero-sum-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.ep-hero-sum-label {
  font-size: 11px;
  font-weight: 500;
  color: #aaa;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.ep-hero-sum-value {
  font-size: 13.5px;
  color: #333;
  line-height: 1.35;
}

.ep-tabs { padding: 2px 0; }

.ep-layout {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 20px;
  align-items: start;
}
@media (max-width: 900px) {
  .ep-layout { grid-template-columns: 1fr; }
  .ep-hero-summary--4 { grid-template-columns: repeat(2, 1fr); }
}

.ep-main {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.ep-block {
  padding: 18px 20px 20px;
}
.ep-block-title {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 16px;
}

.ep-table-card {
  padding: 0;
  overflow: hidden;
}
.ep-table-card-head {
  padding: 18px 20px 0;
}
.ep-table-card-head .ep-block-title {
  margin: 0 0 12px;
}
.ep-table-card .table-wrap {
  padding: 0 0 8px;
}
.ep-table-card-empty {
  padding: 24px 20px 28px;
  margin: 0;
}

.ep-info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px 24px;
}
@media (max-width: 640px) {
  .ep-info-grid { grid-template-columns: 1fr; }
}
.ep-info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.ep-info-label {
  font-size: 11.5px;
  color: #aaa;
  font-weight: 500;
}
.ep-info-value {
  font-size: 13.5px;
  color: #333;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.ep-info-value--wrap {
  align-items: flex-start;
}
.ep-info-ic { color: #bbb; flex-shrink: 0; }
.ep-break-all { word-break: break-all; }
.ep-status-pill {
  display: inline-block;
  align-self: flex-start;
  font-size: 11.5px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 6px;
  background: #eff6ff;
  color: #1d4ed8;
}
.ep-status-pill--muted {
  background: #f3f4f6;
  color: #6b7280;
}

.ep-vac-link {
  color: #2563eb;
  text-decoration: none;
  font-weight: 500;
}
.ep-vac-link:hover {
  text-decoration: underline;
}

.ep-copy-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #bbb;
  cursor: pointer;
  transition: color 0.15s, background 0.15s;
  flex-shrink: 0;
}
.ep-copy-btn:hover { color: #666; background: #f0f0f0; }

.ep-vac-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.ep-vac-card {
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  text-align: center;
}
.ep-vac-card-label {
  font-size: 11.5px;
  color: #999;
  font-weight: 500;
}
.ep-vac-card-value {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
  line-height: 1;
}
.ep-vac-card-value--sm {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.3;
  text-align: center;
}
.ep-vac-card-value--remain { color: #2563eb; }
.ep-vac-card-unit {
  font-size: 11px;
  color: #bbb;
}

.table-wrap {
  padding: 0 0 8px;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: auto;
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
.data-table tbody tr:last-child { border-bottom: none; }
.data-table tbody tr:hover { background: #fafafa; }
.data-table td {
  padding: 11px 20px;
  color: #444;
  vertical-align: middle;
  overflow-wrap: anywhere;
  word-wrap: break-word;
}
.col-muted { color: #888; font-size: 12.5px; }

.ep-empty {
  text-align: center;
  color: #bbb;
  font-size: 13px;
  padding: 20px 0;
  margin: 0;
}

.ep-docs-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}
.ep-doc-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
}
.ep-doc-item:last-child { border-bottom: none; }
.ep-doc-ic { color: #bbb; flex-shrink: 0; }
.ep-doc-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.ep-doc-name {
  font-size: 13px;
  font-weight: 500;
  color: #1a1a1a;
}
.ep-doc-date {
  font-size: 11.5px;
  color: #999;
}

.ep-aside {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.ep-aside-card {
  padding: 16px 18px;
}
.ep-aside-title {
  font-size: 13px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 12px;
}
.ep-aside-manager {
  display: flex;
  gap: 10px;
  align-items: center;
}
.ep-aside-m-av {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  color: #1e3a8a;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.ep-aside-m-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.ep-aside-m-name {
  font-size: 13px;
  font-weight: 600;
  color: #222;
}
.ep-aside-m-role {
  font-size: 11.5px;
  color: #999;
  line-height: 1.35;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.ep-aside-m-ic { flex-shrink: 0; color: #bbb; }
.ep-aside-empty {
  font-size: 13px;
  color: #bbb;
  margin: 0;
}
.ep-aside-kv {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
}
.ep-aside-k {
  font-size: 11px;
  color: #aaa;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.ep-aside-v {
  font-size: 13.5px;
  color: #333;
}
.ep-aside-tag {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  color: #2ba896;
  background: #ecfdf5;
  padding: 4px 10px;
  border-radius: 6px;
}

.ep-note-save {
  margin-top: 10px;
  align-self: flex-end;
}
</style>
