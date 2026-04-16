/**
 * Демо: кандидаты и стадии воронки для вкладки «Цикл» (карточка вакансии).
 */

/** Цвета этапов воронки — таблица «Стадия» и канбан (заголовок колонки). */
export const REC_CYCLE_STAGES = [
  { id: 'new', label: 'Новый кандидат', failed: false, color: '#2563eb' },
  { id: 'hr', label: 'Интервью с HR', failed: false, color: '#4f46e5' },
  {
    id: 'tech',
    label: 'Техническое интервью или встреча в офисе',
    failed: false,
    color: '#7c3aed',
  },
  { id: 'decision', label: 'Принятие решения', failed: false, color: '#d97706' },
  { id: 'offer', label: 'Отправлен оффер', failed: false, color: '#059669' },
  { id: 'failed', label: 'Наем провален', failed: true, color: '#dc2626' },
]

/**
 * Сегменты 1–10 полосы прогресса: какому этапу соответствует цвет сегмента.
 * Согласовано с REC_CYCLE_STAGE_SEG_FILL (накопительный прогресс).
 */
export const REC_CYCLE_SEGMENT_STAGE_ID = [
  'new',
  'new',
  'new',
  'hr',
  'hr',
  'tech',
  'decision',
  'decision',
  'offer',
  'offer',
]

export function getStageColor(stageId) {
  const s = REC_CYCLE_STAGES.find((x) => x.id === stageId)
  return s?.color ?? '#94a3b8'
}

/** Сколько сегментов полосы «Стадия» закрасить (1–10), не failed */
export const REC_CYCLE_STAGE_SEG_FILL = {
  new: 3,
  hr: 4,
  tech: 5,
  decision: 6,
  offer: 8,
  failed: 0,
}

export const REC_CYCLE_CANDIDATES = [
  {
    id: 'cc1',
    name: 'Востриков Глеб',
    initials: 'ВГ',
    email: 'gleb.v@mail.ru',
    phone: '+7 900 111-22-33',
    vacancyHint: 'Senior Backend',
    stageId: 'new',
    pipeline: 'active',
    salary: 25000000,
    addedAt: '2026-03-28',
    responseTag: 'Активный поиск',
    tenure: '10 мес. / 10 мес.',
    metricLabel: 'Собеседования',
    metricValue: 2,
  },
  {
    id: 'cc2',
    name: 'Иванова Мария',
    initials: 'ИМ',
    email: 'm.ivanova@mail.ru',
    phone: '+7 901 222-33-44',
    vacancyHint: 'Senior Backend',
    stageId: 'new',
    pipeline: 'active',
    salary: 22000000,
    addedAt: '2026-03-27',
    responseTag: null,
    tenure: '5 мес. / 8 мес.',
    metricLabel: 'Собеседования',
    metricValue: 1,
  },
  {
    id: 'cc3',
    name: 'Петров Алексей',
    initials: 'ПА',
    email: 'a.petrov@mail.ru',
    phone: '+7 902 333-44-55',
    vacancyHint: 'Senior Backend',
    stageId: 'new',
    pipeline: 'active',
    salary: 50000000,
    addedAt: '2026-03-26',
    responseTag: null,
    tenure: '3 мес. / 12 мес.',
    metricLabel: 'Собеседования',
    metricValue: 0,
  },
  {
    id: 'cc4',
    name: 'Сидорова Анна',
    initials: 'СА',
    email: 'a.sidorova@mail.ru',
    phone: '+7 903 444-55-66',
    vacancyHint: 'Senior Backend',
    stageId: 'new',
    pipeline: 'active',
    salary: 19500000,
    addedAt: '2026-03-25',
    responseTag: 'Активный поиск',
    tenure: '7 мес. / 7 мес.',
    metricLabel: 'Собеседования',
    metricValue: 3,
  },
  {
    id: 'cc5',
    name: 'Козлов Дмитрий',
    initials: 'КД',
    email: 'd.kozlov@mail.ru',
    phone: '+7 904 555-66-77',
    vacancyHint: 'Senior Backend',
    stageId: 'hr',
    pipeline: 'active',
    salary: 35000000,
    addedAt: '2026-03-24',
    responseTag: null,
    tenure: '12 мес. / 12 мес.',
    metricLabel: 'Собеседования',
    metricValue: 2,
  },
  {
    id: 'cc6',
    name: 'Никитина Елена',
    initials: 'НЕ',
    email: 'e.nikitina@mail.ru',
    phone: '+7 905 666-77-88',
    vacancyHint: 'Senior Backend',
    stageId: 'hr',
    pipeline: 'active',
    salary: 28000000,
    addedAt: '2026-03-23',
    responseTag: null,
    tenure: '4 мес. / 10 мес.',
    metricLabel: 'Собеседования',
    metricValue: 1,
  },
  {
    id: 'cc7',
    name: 'Орлов Сергей',
    initials: 'ОС',
    email: 's.orlov@mail.ru',
    phone: '+7 906 777-88-99',
    vacancyHint: 'Senior Backend',
    stageId: 'tech',
    pipeline: 'active',
    salary: 42000000,
    addedAt: '2026-03-22',
    responseTag: null,
    tenure: '6 мес. / 9 мес.',
    metricLabel: 'Собеседования',
    metricValue: 2,
  },
  {
    id: 'cc8',
    name: 'Фёдоров Игорь',
    initials: 'ФИ',
    email: 'i.fedorov@mail.ru',
    phone: '+7 907 888-99-00',
    vacancyHint: 'Senior Backend',
    stageId: 'decision',
    pipeline: 'active',
    salary: 48000000,
    addedAt: '2026-03-20',
    responseTag: null,
    tenure: '8 мес. / 8 мес.',
    metricLabel: 'Офферы',
    metricValue: 0,
  },
  {
    id: 'cc9',
    name: 'Морозова Ольга',
    initials: 'МО',
    email: 'o.morozova@mail.ru',
    phone: '+7 908 999-00-11',
    vacancyHint: 'Senior Backend',
    stageId: 'offer',
    pipeline: 'active',
    salary: 55000000,
    addedAt: '2026-03-18',
    responseTag: null,
    tenure: '9 мес. / 9 мес.',
    metricLabel: 'Офферы',
    metricValue: 1,
  },
  {
    id: 'cc10',
    name: 'Белов Роман',
    initials: 'БР',
    email: 'r.belov@mail.ru',
    phone: '+7 909 000-11-22',
    vacancyHint: 'Senior Backend',
    stageId: 'failed',
    pipeline: 'rejected',
    salary: 18000000,
    addedAt: '2026-03-15',
    responseTag: null,
    tenure: '2 мес. / 6 мес.',
    metricLabel: 'Собеседования',
    metricValue: 0,
    failedReason: 'Не пришел на собеседование',
  },
]

export function formatCycleSalary(n) {
  return `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} сум`
}

export function formatCycleDate(iso) {
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}
