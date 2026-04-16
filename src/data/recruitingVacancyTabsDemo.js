/**
 * Минимальные демо-данные для вкладок карточки вакансии (не «Цикл»).
 */

export const VACANCY_TAB_OFFERS = [
  {
    id: 'of1',
    candidateName: 'Морозова Ольга',
    amount: 55_000_000,
    status: 'pending',
    statusLabel: 'Ожидает ответа',
    date: '2026-04-02',
  },
  {
    id: 'of2',
    candidateName: 'Фёдоров Игорь',
    amount: 48_000_000,
    status: 'approved',
    statusLabel: 'Согласован',
    date: '2026-04-01',
  },
  {
    id: 'of3',
    candidateName: 'Орлов Сергей',
    amount: 42_000_000,
    status: 'draft',
    statusLabel: 'Черновик',
    date: '2026-03-30',
  },
]

export const VACANCY_TAB_DOCUMENTS = [
  { id: 'd1', name: 'Описание позиции (PDF)', date: '2026-03-15' },
  { id: 'd2', name: 'Согласование бюджета', date: '2026-03-18' },
]

/** Демо-состояние интеграции по вакансии (вкладка «Интеграции»). */
const VACANCY_HH_STATE_BY_ID = {
  'vac-1': {
    externalVacancyId: '88421',
    vacancyUrl: 'https://hh.uz/vacancy/88421',
    publicationStatusLabel: 'Опубликована',
    publicationStatus: 'published',
    lastSyncAt: '2026-04-14T08:22:00',
    apiAccessOk: true,
  },
  'vac-6': {
    externalVacancyId: '90204',
    vacancyUrl: 'https://hh.uz/vacancy/90204',
    publicationStatusLabel: 'На модерации',
    publicationStatus: 'moderation',
    lastSyncAt: '2026-04-15T11:05:00',
    apiAccessOk: true,
  },
  'vac-7': {
    externalVacancyId: '',
    vacancyUrl: '',
    publicationStatusLabel: 'Публикация приостановлена',
    publicationStatus: 'paused',
    lastSyncAt: '2026-04-10T16:40:00',
    apiAccessOk: true,
  },
}

export function getVacancyHhIntegrationState(vacancyId) {
  const id = vacancyId || ''
  if (VACANCY_HH_STATE_BY_ID[id]) {
    return { ...VACANCY_HH_STATE_BY_ID[id] }
  }
  return {
    externalVacancyId: '',
    vacancyUrl: '',
    publicationStatusLabel: 'Не опубликована',
    publicationStatus: 'draft',
    lastSyncAt: null,
    apiAccessOk: true,
  }
}

/** Бейдж вкладки: одна внешняя интеграция по ТЗ (hh.uz). */
export const VACANCY_TAB_INTEGRATIONS_COUNT = 1

export const VACANCY_TAB_HISTORY = [
  { id: 'h1', at: '2026-04-12', text: 'Публикация обновлена на hh.uz' },
  { id: 'h2', at: '2026-04-08', text: 'Статус вакансии: открыта' },
  { id: 'h3', at: '2026-03-20', text: 'Создана карточка подбора' },
]

export const VACANCY_TAB_COMMENTS = [
  {
    id: 'cm1',
    author: 'Нилуфар Ю.',
    at: '2026-04-10',
    text: 'Нужен дополнительный скрининг по Go для двух кандидатов.',
  },
]
