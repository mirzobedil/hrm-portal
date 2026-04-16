/**
 * Демо: кандидаты для списка «Кандидаты» и карточки профиля (данные согласованы с REC_CYCLE_CANDIDATES).
 */
import {
  REC_CYCLE_CANDIDATES,
  REC_CYCLE_STAGES,
  formatCycleDate,
} from '@/data/recruitingVacancyCycleDemo.js'
import { getRecruitingVacancyById } from '@/data/recruitingDashboardDemo.js'

const DEFAULT_PROFILE = {
  city: 'Ташкент',
}

/** Поля профиля, которых нет в цикле вакансии */
const PROFILE_EXTRA = {
  cc1: {
    source: 'hh.uz',
    birthDate: '12.05.1992',
    gender: 'М',
    telegram: '@glebv',
    lastContactAt: '2026-04-10',
  },
  cc2: {
    source: 'LinkedIn',
    birthDate: '03.11.1995',
    gender: 'Ж',
    telegram: '—',
    lastContactAt: '2026-04-09',
  },
  cc3: {
    source: 'Рекомендация',
    birthDate: '22.01.1988',
    gender: 'М',
    telegram: '@alexpetrov',
    lastContactAt: '2026-04-08',
  },
  cc4: {
    source: 'Сайт компании',
    birthDate: '07.09.1993',
    gender: 'Ж',
    telegram: '—',
    lastContactAt: '2026-04-07',
  },
  cc5: {
    source: 'hh.uz',
    birthDate: '18.04.1990',
    gender: 'М',
    telegram: '@dkozlov',
    lastContactAt: '2026-04-06',
  },
  cc6: {
    source: 'hh.uz',
    birthDate: '30.12.1996',
    gender: 'Ж',
    telegram: '@elenan',
    lastContactAt: '2026-04-05',
  },
  cc7: {
    source: 'LinkedIn',
    birthDate: '05.06.1991',
    gender: 'М',
    telegram: '—',
    lastContactAt: '2026-04-04',
  },
  cc8: {
    source: 'hh.uz',
    birthDate: '14.02.1987',
    gender: 'М',
    telegram: '@ifedorov',
    lastContactAt: '2026-04-03',
  },
  cc9: {
    source: 'Рекомендация',
    birthDate: '25.08.1994',
    gender: 'Ж',
    telegram: '@olgam',
    lastContactAt: '2026-04-02',
  },
  cc10: {
    source: 'hh.uz',
    birthDate: '01.03.1999',
    gender: 'М',
    telegram: '—',
    lastContactAt: '2026-03-20',
  },
  cc11: { source: 'hh.uz', birthDate: '14.02.1994', gender: 'Ж', telegram: '@d_alimova', lastContactAt: '2026-04-12' },
  cc12: { source: 'LinkedIn', birthDate: '03.08.1991', gender: 'М', telegram: '—', lastContactAt: '2026-04-10' },
  cc13: { source: 'Рекомендация', birthDate: '22.11.1996', gender: 'Ж', telegram: '@skim', lastContactAt: '2026-04-08' },
  cc14: { source: 'hh.uz', birthDate: '19.05.1998', gender: 'М', telegram: '—', lastContactAt: '2026-04-05' },
  cc15: { source: 'hh.uz', birthDate: '07.01.1990', gender: 'М', telegram: '@mzaytsev', lastContactAt: '2026-04-11' },
  cc16: { source: 'Сайт компании', birthDate: '30.06.1992', gender: 'М', telegram: '—', lastContactAt: '2026-04-09' },
  cc17: { source: 'LinkedIn', birthDate: '11.12.1988', gender: 'М', telegram: '@rhasanov', lastContactAt: '2026-04-04' },
  cc18: { source: 'hh.uz', birthDate: '25.04.1987', gender: 'Ж', telegram: '—', lastContactAt: '2026-04-13' },
  cc19: { source: 'Рекомендация', birthDate: '08.09.1993', gender: 'М', telegram: '@omirzaev', lastContactAt: '2026-04-07' },
  cc20: { source: 'hh.uz', birthDate: '17.03.1997', gender: 'Ж', telegram: '—', lastContactAt: '2026-04-12' },
  cc21: { source: 'hh.uz', birthDate: '02.10.1995', gender: 'М', telegram: '@iyunusov', lastContactAt: '2026-04-10' },
  cc22: { source: 'LinkedIn', birthDate: '29.12.1999', gender: 'Ж', telegram: '—', lastContactAt: '2026-04-06' },
  cc23: { source: 'hh.uz', birthDate: '16.06.1991', gender: 'М', telegram: '@psokolov', lastContactAt: '2026-04-14' },
  cc24: { source: 'Рекомендация', birthDate: '04.07.1994', gender: 'Ж', telegram: '—', lastContactAt: '2026-04-11' },
  cc25: { source: 'hh.uz', birthDate: '21.01.1989', gender: 'М', telegram: '@dgrin', lastContactAt: '2026-04-09' },
  cc26: { source: 'LinkedIn', birthDate: '13.05.1992', gender: 'Ж', telegram: '@ivolkova', lastContactAt: '2026-04-08' },
}

/** События воронки (вкладка «Воронка») */
export const REC_CANDIDATE_TIMELINE = [
  { id: 'tl1', candidateId: 'cc1', at: '2026-04-10', title: 'Первичный контакт', detail: 'Уточнены ожидания по проекту и формат работы' },
  { id: 'tl2', candidateId: 'cc1', at: '2026-04-08', title: 'Отклик получен', detail: 'Источник: hh.uz' },
  { id: 'tl3', candidateId: 'cc5', at: '2026-04-06', title: 'Интервью HR', detail: 'Запланировано тех. интервью' },
  { id: 'tl4', candidateId: 'cc5', at: '2026-03-24', title: 'Отклик получен', detail: 'Резюме передано заказчику' },
  { id: 'tl5', candidateId: 'cc7', at: '2026-04-04', title: 'Техническое интервью', detail: 'Системный дизайн, 90 мин.' },
  { id: 'tl6', candidateId: 'cc9', at: '2026-04-01', title: 'Оффер отправлен', detail: 'Ожидание ответа до 20.04' },
  { id: 'tl7', candidateId: 'cc10', at: '2026-03-16', title: 'Отказ', detail: 'Не пришёл на собеседование' },
]

/** Документы кандидата */
export const REC_CANDIDATE_DOCS = [
  { id: 'cd1', candidateId: 'cc1', name: 'Резюме (PDF)', date: '28.03.2026' },
  { id: 'cd2', candidateId: 'cc1', name: 'Портфолио (ссылка)', date: '28.03.2026' },
  { id: 'cd3', candidateId: 'cc2', name: 'Резюме (PDF)', date: '27.03.2026' },
  { id: 'cd4', candidateId: 'cc3', name: 'Резюме (PDF)', date: '26.03.2026' },
  { id: 'cd5', candidateId: 'cc4', name: 'Резюме (PDF)', date: '25.03.2026' },
  { id: 'cd6', candidateId: 'cc5', name: 'Резюме (PDF)', date: '24.03.2026' },
  { id: 'cd7', candidateId: 'cc6', name: 'Резюме (PDF)', date: '23.03.2026' },
  { id: 'cd8', candidateId: 'cc7', name: 'Резюме (PDF)', date: '22.03.2026' },
  { id: 'cd9', candidateId: 'cc7', name: 'Тестовое задание', date: '23.03.2026' },
  { id: 'cd10', candidateId: 'cc8', name: 'Резюме (PDF)', date: '20.03.2026' },
  { id: 'cd11', candidateId: 'cc9', name: 'Резюме (PDF)', date: '18.03.2026' },
  { id: 'cd12', candidateId: 'cc10', name: 'Резюме (PDF)', date: '15.03.2026' },
  { id: 'cd13', candidateId: 'cc11', name: 'Резюме (PDF)', date: '12.04.2026' },
  { id: 'cd14', candidateId: 'cc12', name: 'Резюме (PDF)', date: '10.04.2026' },
  { id: 'cd15', candidateId: 'cc15', name: 'Резюме (PDF)', date: '11.04.2026' },
  { id: 'cd16', candidateId: 'cc18', name: 'Резюме (PDF)', date: '13.04.2026' },
  { id: 'cd17', candidateId: 'cc20', name: 'Резюме (PDF)', date: '12.04.2026' },
  { id: 'cd18', candidateId: 'cc23', name: 'Резюме (PDF)', date: '14.04.2026' },
]

export function stageLabelForCandidate(row) {
  if (!row) return '—'
  if (row.stageId === 'failed') return row.failedReason || 'Наём провален'
  const s = REC_CYCLE_STAGES.find((x) => x.id === row.stageId)
  return s?.label ?? '—'
}

/** active/rejected — статус воронки, не занятость на работе (избегаем «В работе» = как у сотрудника). */
export function pipelineLabel(pipeline) {
  if (pipeline === 'rejected') return 'Отклонён'
  if (pipeline === 'active') return 'В подборе'
  return pipeline || '—'
}

/** Дни в воронке от даты отклика до «сегодня» (демо: 2026-04-16) */
export function daysInPipeline(addedAtIso) {
  const end = new Date('2026-04-16')
  const start = new Date(addedAtIso)
  const d = Math.round((end - start) / 86400000)
  return Math.max(0, d)
}

export function getRecruitingCandidateById(id) {
  const base = REC_CYCLE_CANDIDATES.find((c) => c.id === id)
  if (!base) return null
  const extra = { ...DEFAULT_PROFILE, ...(PROFILE_EXTRA[id] || {}) }
  const vid = base.vacancyId || 'vac-1'
  extra.vacancyId = vid
  const vac = getRecruitingVacancyById(vid)
  if (vac) {
    extra.vacancyTitle = vac.title
    extra.dept = vac.dept
    extra.region = vac.region
    extra.recruiterName = vac.owner
  } else {
    extra.vacancyTitle = base.vacancyHint
    extra.recruiterName = '—'
  }
  return { ...base, ...extra }
}

export function getCandidateTimeline(id) {
  const rows = REC_CANDIDATE_TIMELINE.filter((e) => e.candidateId === id).sort((a, b) => b.at.localeCompare(a.at))
  if (rows.length) return rows
  const c = getRecruitingCandidateById(id)
  if (!c) return []
  return [
    {
      id: `fallback-${id}`,
      candidateId: id,
      at: c.addedAt,
      title: 'Отклик получен',
      detail: c.source && c.source !== '—' ? `Источник: ${c.source}` : 'Запись воронки',
    },
  ]
}

export function getCandidateDocs(id) {
  return REC_CANDIDATE_DOCS.filter((d) => d.candidateId === id)
}

/** Список для вкладки «Кандидаты» */
export const REC_CANDIDATES_LIST = REC_CYCLE_CANDIDATES.map((c) => getRecruitingCandidateById(c.id))

export { formatCycleDate }
