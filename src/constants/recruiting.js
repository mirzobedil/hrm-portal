/**
 * Демо-данные модуля «Рекрутинг» (HR).
 */

export const VACANCY_STATUS = {
  open: { label: 'Открыта', class: 'rs--open' },
  paused: { label: 'На паузе', class: 'rs--paused' },
  closed: { label: 'Закрыта', class: 'rs--closed' },
}

export const CANDIDATE_STAGE = {
  new: { label: 'Новый', class: 'st--new' },
  screening: { label: 'Скрининг', class: 'st--screening' },
  interview: { label: 'Собеседование', class: 'st--interview' },
  offer: { label: 'Оффер', class: 'st--offer' },
  hired: { label: 'Принят', class: 'st--hired' },
  rejected: { label: 'Отказ', class: 'st--rejected' },
}

export const VACANCIES = [
  {
    id: 1,
    title: 'Senior Frontend Developer',
    dept: 'ИТ',
    location: 'Ташкент · офис',
    status: 'open',
    owner: 'Нилуфар Юсупова',
    applicants: 12,
    updatedAt: '2026-04-05',
  },
  {
    id: 2,
    title: 'HR-менеджер',
    dept: 'HR',
    location: 'Гибрид',
    status: 'open',
    owner: 'Зарина Хасанова',
    applicants: 8,
    updatedAt: '2026-04-03',
  },
  {
    id: 3,
    title: 'Бухгалтер',
    dept: 'Финансы',
    location: 'Ташкент',
    status: 'paused',
    owner: 'Дилноза Атаева',
    applicants: 5,
    updatedAt: '2026-03-28',
  },
  {
    id: 4,
    title: 'Middle QA Engineer',
    dept: 'ИТ',
    location: 'Удалённо',
    status: 'open',
    owner: 'Нилуфар Юсупова',
    applicants: 6,
    updatedAt: '2026-04-06',
  },
]

export const CANDIDATES = [
  {
    id: 101,
    name: 'Алишер Каримов',
    vacancy: 'Senior Frontend Developer',
    vacancyId: 1,
    stage: 'interview',
    source: 'hh.ru',
    updatedAt: '2026-04-06',
  },
  {
    id: 102,
    name: 'Dilnoza R.',
    vacancy: 'Senior Frontend Developer',
    vacancyId: 1,
    stage: 'screening',
    source: 'Рекомендация',
    updatedAt: '2026-04-05',
  },
  {
    id: 103,
    name: 'Bobur T.',
    vacancy: 'HR-менеджер',
    vacancyId: 2,
    stage: 'offer',
    source: 'LinkedIn',
    updatedAt: '2026-04-04',
  },
  {
    id: 104,
    name: 'Madina S.',
    vacancy: 'Middle QA Engineer',
    vacancyId: 4,
    stage: 'new',
    source: 'Сайт',
    updatedAt: '2026-04-07',
  },
  {
    id: 105,
    name: 'Jasur M.',
    vacancy: 'Бухгалтер',
    vacancyId: 3,
    stage: 'rejected',
    source: 'hh.ru',
    updatedAt: '2026-03-20',
  },
  {
    id: 106,
    name: 'Lola K.',
    vacancy: 'HR-менеджер',
    vacancyId: 2,
    stage: 'hired',
    source: 'Кадровое агентство',
    updatedAt: '2026-03-15',
  },
]

export const INTERVIEWS_WEEK = [
  { id: 1, candidate: 'Алишер Каримов', vacancy: 'Senior Frontend', when: '08.04.2026 11:00', format: 'Офис' },
  { id: 2, candidate: 'Dilnoza R.', vacancy: 'Senior Frontend', when: '09.04.2026 15:30', format: 'Google Meet' },
  { id: 3, candidate: 'Madina S.', vacancy: 'Middle QA', when: '10.04.2026 10:00', format: 'Офис' },
]
