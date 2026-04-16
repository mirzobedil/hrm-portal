/**
 * Демо-данные рекрутингового дашборда — позже заменяются API.
 */

export const REC_DASH_KPIS = {
  openVacancies: 12,
  activeCandidates: 47,
  interviewsWeek: 18,
  offersPending: 6,
  avgTimeToFillDays: 24,
  avgTimeToFillDelta: -4,
  offerConversionPct: 11,
}

/**
 * Воронка подбора — первый этап = 100% база (абсолютные числа убывают).
 */
export const REC_FUNNEL_STAGES = [
  { key: 'new', label: 'Новый кандидат', count: 104 },
  { key: 'search', label: 'Стратегия поиска (активный / пассивный)', count: 74 },
  { key: 'assess', label: 'Оценка и тестирование', count: 70 },
  { key: 'req', label: 'Заявка на подбор', count: 66 },
  { key: 'hr_int', label: 'Интервью HR', count: 59 },
  { key: 'resume', label: 'Первичный отбор резюме', count: 55 },
  { key: 'tech', label: 'Техническое интервью / встреча в офисе', count: 53 },
  { key: 'offer', label: 'Оффер отправлен', count: 50 },
  { key: 'onboard', label: 'Передача в адаптацию', count: 40 },
  { key: 'offer_ok', label: 'Оффер принят', count: 38 },
]

/** Причины отказа (демо) */
export const REC_REJECTION_REASONS = [
  { label: 'Опыт не подходит', count: 3 },
  { label: 'Не принял оффер', count: 2 },
  { label: 'Подбор не завершён', count: 1 },
  { label: 'Не пришёл на интервью', count: 1 },
]

/**
 * Кандидаты по источнику (нормализованные подписи).
 */
export const REC_SOURCES = [
  { label: 'hh.uz', count: 4 },
  { label: 'LinkedIn', count: 2 },
  { label: 'Рекомендация', count: 2 },
  { label: 'Сайт компании', count: 1 },
]

/**
 * Приток по датам (каждый источник — отдельная линия).
 */
export const REC_CANDIDATES_BY_DATE = {
  labels: ['15 июл', '18 июл', '23 июл', '2 авг', '9 авг'],
  series: [
    { key: 'hh', label: 'hh.uz', values: [0, 1.2, 0, 1, 0.3] },
    { key: 'hh_man', label: 'hh ручной поиск', values: [0.5, 0, 0.8, 0, 0] },
    { key: 'li', label: 'LinkedIn', values: [0, 0.4, 0, 0.6, 0] },
    { key: 'site', label: 'Сайт', values: [0.2, 0, 0, 0, 0.5] },
  ],
}

export const REC_TIME_TO_FILL_TREND = [
  { label: 'H1', days: 31 },
  { label: 'H2', days: 29 },
  { label: 'H3', days: 28 },
  { label: 'H4', days: 27 },
  { label: 'H5', days: 26 },
  { label: 'H6', days: 25 },
  { label: 'H7', days: 24 },
  { label: 'H8', days: 24 },
]

/**
 * Список вакансий (спека «Список вакансий» + внутренний статус).
 * Колонки: вакансия, регион, просмотры, отклики, в работе, истекает + статус.
 * status: open | paused | closed
 */
export const REC_VACANCIES = [
  {
    id: 'vac-1',
    title: 'Senior Backend (Go)',
    dept: 'ИТ',
    region: 'Ташкент',
    owner: 'Нилуфар Юсупова',
    views: 1240,
    responses: 12,
    responsesNew: 2,
    inPipeline: 5,
    expiresAt: '2026-05-01',
    daysOpen: 62,
    status: 'open',
    statusLabel: 'Открыта',
    employment: 'Полная ставка',
  },
  {
    id: 'vac-2',
    title: 'HR BP',
    dept: 'HR',
    region: 'Ташкент',
    owner: 'Зарина Хасанова',
    views: 890,
    responses: 8,
    responsesNew: 0,
    inPipeline: 4,
    expiresAt: '2026-04-28',
    daysOpen: 48,
    status: 'open',
    statusLabel: 'Открыта',
    employment: 'Полная ставка',
  },
  {
    id: 'vac-3',
    title: 'DevOps Engineer',
    dept: 'ИТ',
    region: 'Ташкент',
    owner: 'Нилуфар Юсупова',
    views: 720,
    responses: 6,
    responsesNew: 1,
    inPipeline: 3,
    expiresAt: '2026-05-10',
    daysOpen: 41,
    status: 'open',
    statusLabel: 'Открыта',
    employment: 'Полная ставка',
  },
  {
    id: 'vac-4',
    title: 'Бухгалтер',
    dept: 'Финансы',
    region: 'Ташкент',
    owner: 'Дилноза Атаева',
    views: 410,
    responses: 5,
    responsesNew: 0,
    inPipeline: 2,
    expiresAt: '2026-04-20',
    daysOpen: 35,
    status: 'open',
    statusLabel: 'Открыта',
    employment: 'Полная ставка',
  },
  {
    id: 'vac-5',
    title: 'Middle QA',
    dept: 'ИТ',
    region: 'Ташкент',
    owner: 'Нилуфар Юсупова',
    views: 560,
    responses: 9,
    responsesNew: 3,
    inPipeline: 4,
    expiresAt: '2026-04-25',
    daysOpen: 28,
    status: 'open',
    statusLabel: 'Открыта',
    employment: 'Полная ставка',
  },
  {
    id: 'vac-6',
    title: 'Senior Frontend Developer',
    dept: 'ИТ',
    region: 'Ташкент',
    owner: 'Нилуфар Юсупова',
    views: 2100,
    responses: 12,
    responsesNew: 1,
    inPipeline: 6,
    expiresAt: '2026-05-15',
    daysOpen: 22,
    status: 'open',
    statusLabel: 'Открыта',
    employment: 'Полная ставка',
  },
  {
    id: 'vac-7',
    title: 'HR-менеджер',
    dept: 'HR',
    region: 'Ташкент',
    owner: 'Зарина Хасанова',
    views: 380,
    responses: 8,
    responsesNew: 0,
    inPipeline: 4,
    expiresAt: '2026-04-18',
    daysOpen: 18,
    status: 'paused',
    statusLabel: 'На паузе',
    employment: 'Полная ставка',
  },
  {
    id: 'vac-8',
    title: 'Product Designer',
    dept: 'Продукт',
    region: 'Ташкент',
    owner: 'Нилуфар Юсупова',
    views: 1750,
    responses: 15,
    responsesNew: 2,
    inPipeline: 7,
    expiresAt: '2026-05-20',
    daysOpen: 14,
    status: 'open',
    statusLabel: 'Открыта',
    employment: 'Полная ставка',
  },
  {
    id: 'vac-9',
    title: 'Data Analyst',
    dept: 'ИТ',
    region: 'Ташкент',
    owner: 'Нилуфар Юсупова',
    views: 290,
    responses: 4,
    responsesNew: 0,
    inPipeline: 2,
    expiresAt: '2026-04-22',
    daysOpen: 11,
    status: 'open',
    statusLabel: 'Открыта',
    employment: '0,5 ставки',
  },
  {
    id: 'vac-10',
    title: 'Офис-менеджер',
    dept: 'HR',
    region: 'Ташкент',
    owner: 'Зарина Хасанова',
    views: 220,
    responses: 3,
    responsesNew: 0,
    inPipeline: 1,
    expiresAt: '2026-04-30',
    daysOpen: 9,
    status: 'open',
    statusLabel: 'Открыта',
    employment: 'Полная ставка',
  },
  {
    id: 'vac-11',
    title: 'Junior Mobile (Flutter)',
    dept: 'ИТ',
    region: 'Ташкент',
    owner: 'Нилуфар Юсупова',
    views: 980,
    responses: 7,
    responsesNew: 0,
    inPipeline: 0,
    expiresAt: '2026-03-28',
    daysOpen: 0,
    status: 'closed',
    statusLabel: 'Закрыта',
    employment: 'Полная ставка',
  },
  {
    id: 'vac-12',
    title: 'Маркетинг-менеджер',
    dept: 'Маркетинг',
    region: 'Ташкент',
    owner: 'Зарина Хасанова',
    views: 640,
    responses: 2,
    responsesNew: 0,
    inPipeline: 0,
    expiresAt: '2026-03-18',
    daysOpen: 0,
    status: 'closed',
    statusLabel: 'Закрыта',
    employment: 'Полная ставка',
  },
]

/** Дашборд: долго открытые (статус «открыта» и 28+ дней) */
export const REC_AGING_VACANCIES = REC_VACANCIES.filter(
  (v) => v.status === 'open' && v.daysOpen >= 28,
).sort((a, b) => b.daysOpen - a.daysOpen)

export function getRecruitingVacancyById(id) {
  return REC_VACANCIES.find((v) => v.id === id) ?? null
}
