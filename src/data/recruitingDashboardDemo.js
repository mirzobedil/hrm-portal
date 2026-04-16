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

/**
 * Расширенные поля вкладки «Подробности» (демо). Сливаются с карточкой вакансии.
 */
const VACANCY_DETAIL_DEFAULTS = {
  position: null,
  grade: null,
  priorityLabel: 'Нормальный',
  openPositionsCount: 1,
  requestReason: null,
  salaryMin: null,
  salaryMax: null,
  experience: null,
  legalEntity: null,
  skills: null,
  desiredStartDate: null,
  note: null,
  createdAt: '2026-01-15T09:30:00',
  creator: null,
  hiringFilled: undefined,
  hiringTotal: undefined,
  linkedVacancyTitle: null,
  approvers: [],
}

/** Переопределения по id вакансии */
const VACANCY_DETAIL_BY_ID = {
  'vac-1': {
    position: 'Senior Backend Engineer',
    grade: 'Senior',
    openPositionsCount: 1,
    salaryMin: 28_000_000,
    salaryMax: 48_000_000,
    experience: '3+ лет',
    requestReason: 'Расширение платформенной команды',
    legalEntity: 'ООО «Техно Холдинг»',
    skills: 'Go, PostgreSQL, gRPC, Docker/Kubernetes',
    desiredStartDate: '2026-05-01',
    note: 'Возможен гибрид: 2 дня в офисе.',
    createdAt: '2026-01-12T11:20:00',
    creator: 'Нилуфар Юсупова',
    hiringTotal: 1,
    approvers: [
      {
        id: 'ap-v1-1',
        name: 'Хасанова Зарина',
        initials: 'ХЗ',
        line: 'Утверждено: Хасанова Зарина · 12.01.2026 14:05',
      },
      {
        id: 'ap-v1-2',
        name: 'Атаева Дилноза',
        initials: 'АД',
        line: 'Утверждено: Хасанова Зарина · 12.01.2026 14:05',
      },
    ],
  },
  'vac-2': {
    position: 'HR Business Partner',
    grade: 'Middle+',
    openPositionsCount: 1,
    salaryMin: 18_000_000,
    salaryMax: 28_000_000,
    experience: '4+ лет в HR',
    requestReason: 'Усиление HR BP по направлению',
    legalEntity: 'ООО «Техно Холдинг»',
    skills: 'HR BP, метрики, 1:1, проектные наймы',
    desiredStartDate: '2026-04-20',
    note: 'Приоритет — опыт в IT.',
    createdAt: '2026-01-08T09:15:00',
    creator: 'Зарина Хасанова',
    hiringTotal: 1,
    approvers: [
      {
        id: 'ap-v2-1',
        name: 'Юсупова Нилуфар',
        initials: 'ЮН',
        line: 'Утверждено: Юсупова Нилуфар · 09.01.2026 16:40',
      },
    ],
  },
  'vac-6': {
    position: 'Senior Frontend Developer',
    grade: 'Senior',
    openPositionsCount: 2,
    salaryMin: 24_000_000,
    salaryMax: 45_000_000,
    experience: '4+ лет (Vue/React)',
    requestReason: 'Нехватка фронтенда, простаивают задачи по продукту',
    legalEntity: 'ООО «Техно Холдинг»',
    skills: 'Vue 3, TypeScript, Pinia, Vite, тесты (Vitest)',
    desiredStartDate: '2026-05-15',
    note: 'Стек согласован с командой платформы.',
    createdAt: '2026-01-16T10:12:00',
    creator: 'Нилуфар Юсупова',
    hiringTotal: 2,
    approvers: [
      {
        id: 'ap-v6-1',
        name: 'Хасанова Зарина',
        initials: 'ХЗ',
        line: 'Утверждено: Хасанова Зарина · 17.01.2026 11:00',
      },
    ],
  },
  'vac-7': {
    position: 'HR-менеджер',
    grade: 'Middle',
    openPositionsCount: 1,
    salaryMin: 12_000_000,
    salaryMax: 20_000_000,
    requestReason: 'Заморозка бюджета до Q3',
    note: 'Вакансия на паузе, кандидаты в резерве.',
    hiringTotal: 1,
    hiringFilled: 0,
  },
}

function buildDefaultVacancyDetail(v) {
  const n = Number(String(v.id).replace(/\D/g, '')) || 1
  return {
    ...VACANCY_DETAIL_DEFAULTS,
    position: v.title,
    creator: v.owner,
    salaryMin: 12_000_000 + n * 800_000,
    salaryMax: 22_000_000 + n * 1_200_000,
    legalEntity: 'ООО «Техно Холдинг»',
    createdAt: `2026-${String((n % 9) + 1).padStart(2, '0')}-${String((n % 27) + 1).padStart(2, '0')}T09:00:00`,
    skills: n % 3 === 0 ? 'См. описание вакансии' : null,
    experience: n % 2 === 0 ? 'По вакансии' : null,
    requestReason: n % 4 === 0 ? 'Плановый найм' : null,
    note: null,
  }
}

/**
 * Карточка вакансии + блок detail для вкладки «Подробности».
 */
export function getVacancyDetailView(id) {
  const v = getRecruitingVacancyById(id)
  if (!v) return null
  const base = buildDefaultVacancyDetail(v)
  const extra = VACANCY_DETAIL_BY_ID[id] ?? {}
  const detail = { ...base, ...extra }
  if (detail.linkedVacancyTitle == null) detail.linkedVacancyTitle = v.title
  if (detail.hiringFilled === undefined) {
    detail.hiringTotal = detail.hiringTotal ?? Math.max(1, detail.openPositionsCount ?? 1)
    detail.hiringFilled = Math.min(v.inPipeline, detail.hiringTotal)
  }
  return { ...v, detail }
}
