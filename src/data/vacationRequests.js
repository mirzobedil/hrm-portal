/**
 * Демо-данные заявок на отпуск / отсутствия (единый источник для Vacations.vue и Dashboard HR).
 */

import { MANAGER_TEAM, LINE_MANAGER } from '@/constants/vacation'

/**
 * dept — крупный блок; subdept — реальное подразделение (напр. разработка ПО, ИБ);
 * position — грейд / роль: ведущий и главный специалист, эксперт и т.д.
 */
export const EMPLOYEE_DATA = {
  'Mirzo Bedil': {
    dept: 'ИТ',
    subdept: 'Разработка программного обеспечения',
    position: 'Ведущий специалист',
    /** Демо: принят в июне — в первый год полный лимит 28 дн. сразу недоступен */
    hireDate: '2025-06-01',
    balance: { total: 28, used: 9 },
  },
  'Сардор Тошматов': {
    dept: 'ИТ',
    subdept: 'Разработка программного обеспечения',
    position: 'Главный специалист',
    hireDate: '2019-04-10',
    balance: { total: 28, used: 5 },
  },
  'Нилуфар Юсупова': {
    dept: 'HR',
    subdept: 'Подбор и адаптация персонала',
    position: 'Ведущий специалист',
    hireDate: '2018-02-01',
    balance: { total: 28, used: 3 },
  },
  'Жасур Мирзаев': {
    dept: 'HR',
    subdept: 'Кадровый учёт и кадровое делопроизводство',
    position: 'Специалист',
    hireDate: '2020-09-14',
    balance: { total: 28, used: 6 },
  },
  'Малика Рахимова': {
    dept: 'ИТ',
    subdept: 'Обеспечение качества и тестирование',
    position: 'Эксперт',
    hireDate: '2021-11-20',
    balance: { total: 28, used: 2 },
  },
  'Бобур Хасанов': {
    dept: 'Финансы',
    subdept: 'Бухгалтерский учёт и отчётность',
    position: 'Главный специалист',
    hireDate: '2017-05-03',
    balance: { total: 28, used: 7 },
  },
  'Руслан Камолов': {
    dept: 'ИТ',
    subdept: 'Разработка программного обеспечения',
    position: 'Руководитель направления',
    hireDate: '2015-01-12',
    balance: { total: 28, used: 4 },
  },
  'Зарина Хасанова': {
    dept: 'HR',
    subdept: 'Обучение и корпоративная политика',
    position: 'Ведущий специалист',
    hireDate: '2016-08-22',
    balance: { total: 28, used: 8 },
  },
  'Дилноза Атаева': {
    dept: 'ИТ',
    subdept: 'Информационная безопасность',
    position: 'Главный специалист',
    hireDate: '2019-07-01',
    balance: { total: 28, used: 5 },
  },
}

/**
 * Полных календарных месяцев с даты приёма до asOf (сравнение по дню месяца как у даты приёма).
 */
export function completedWorkMonthsFromHire(hireIso, asOfIso) {
  if (!hireIso || asOfIso < hireIso) return 0
  const [hy, hm, hd] = hireIso.split('-').map(Number)
  const [ay, am, ad] = asOfIso.split('-').map(Number)
  let months = (ay - hy) * 12 + (am - hm)
  if (ad < hd) months -= 1
  return Math.max(0, months)
}

/**
 * Целые дни годового отпуска «по стажу» к дате: первые 12 полных месяцев — ⌊28×мес/12⌋, далее — полный лимит.
 */
export function earnedAnnualVacationDaysFromHire(hireIso, asOfIso, annualTotal) {
  const m = completedWorkMonthsFromHire(hireIso, asOfIso)
  if (m <= 0) return 0
  if (m >= 12) return annualTotal
  return Math.min(annualTotal, Math.floor((annualTotal * m) / 12))
}

/** Статусы, когда отсутствие уже действует в календаре (для блока «сегодня в отпуске»). */
export const VACATION_ACTIVE_ABSENCE_STATUSES = ['approved', 'confirmed', 'planned']

export function localDateIso(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function formatIsoDateRu(iso) {
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}

export function filterRequestsActiveOnDate(requests, iso) {
  return requests
    .filter(
      r =>
        VACATION_ACTIVE_ABSENCE_STATUSES.includes(r.status) &&
        r.from <= iso &&
        r.to >= iso,
    )
    .sort((a, b) => a.employee.localeCompare(b.employee, 'ru'))
}

function activitySubmittedTime(r) {
  const sub = r.activity?.find(a => a.action === 'submitted')
  return sub?.time instanceof Date ? sub.time : null
}

/** Демо-подпись «N мин. назад» по дате подачи (для очереди руководителя на Dashboard). */
export function requestSubmittedAgoRu(r) {
  const t = activitySubmittedTime(r)
  if (!t) return 'недавно'
  const ms = Date.now() - t.getTime()
  const mins = Math.floor(ms / 60000)
  if (mins < 1) return 'только что'
  if (mins < 60) return `${mins} мин. назад`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} ч. назад`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'вчера'
  return `${days} дн. назад`
}

export function formatIsoShortDdMm(iso) {
  const [, m, d] = iso.split('-')
  return `${d}.${m}`
}

/** Очередь руководителя: те же заявки, что на /vacations/approvals (команда демо-менеджера). */
export function dashboardManagerPendingRows(requests) {
  return requests
    .filter(r => r.status === 'pending_manager' && MANAGER_TEAM.has(r.employee))
    .sort((a, b) => {
      const ta = activitySubmittedTime(a)?.getTime() ?? 0
      const tb = activitySubmittedTime(b)?.getTime() ?? 0
      return tb - ta
    })
    .map(r => ({
      id: r.id,
      name: r.employee,
      from: formatIsoDateRu(r.from),
      to: formatIsoDateRu(r.to),
      days: r.days,
      type: r.type,
      submittedAgo: requestSubmittedAgoRu(r),
    }))
}

/** Очередь HR: утверждено менеджером, ждёт кадрового оформления (как на странице заявок). */
export function dashboardHrConfirmRows(requests) {
  return requests
    .filter(r => r.status === 'approved_by_manager')
    .sort((a, b) => a.from.localeCompare(b.from))
    .map(r => {
      const emp = EMPLOYEE_DATA[r.employee]
      const deptLabel = emp ? `${emp.dept} · ${emp.subdept}` : '—'
      const mgr =
        r.activity?.find(a => a.role === 'manager' && a.action === 'approved')?.actor ??
        LINE_MANAGER.name
      return {
        id: r.id,
        name: r.employee,
        dept: deptLabel,
        from: formatIsoDateRu(r.from),
        to: formatIsoDateRu(r.to),
        days: r.days,
        manager: mgr,
      }
    })
}

/** График команды на Dashboard (апрель–май): те же сотрудники и статусы, что в реестре. */
export function dashboardTeamScheduleAprMay(requests, { limit = 12 } = {}) {
  const winStart = '2026-04-01'
  const winEnd = '2026-05-31'
  return requests
    .filter(r => {
      if (!MANAGER_TEAM.has(r.employee)) return false
      return r.from <= winEnd && r.to >= winStart
    })
    .sort((a, b) => a.from.localeCompare(b.from))
    .slice(0, limit)
    .map(r => ({
      name: r.employee,
      from: formatIsoShortDdMm(r.from),
      to: formatIsoShortDdMm(r.to),
      days: r.days,
      status: r.status,
    }))
}

/** Ближайшие отпуска для сводки HR: сортировка по дате начала, без дублей по сотруднику+периоду. */
export function dashboardHrUpcomingRows(requests, { limit = 8 } = {}) {
  const today = localDateIso()
  const seen = new Set()
  return [...requests]
    .filter(r => r.to >= today && !['rejected'].includes(r.status))
    .sort((a, b) => a.from.localeCompare(b.from))
    .filter(r => {
      const k = `${r.employee}|${r.from}|${r.to}`
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })
    .slice(0, limit)
    .map(r => {
      const emp = EMPLOYEE_DATA[r.employee]
      return {
        id: r.id,
        name: r.employee,
        dept: emp?.dept ?? '—',
        from: formatIsoShortDdMm(r.from),
        to: formatIsoShortDdMm(r.to),
        days: r.days,
        status: r.status,
      }
    })
}

/**
 * Начальное состояние заявок (каждый вызов — новые объекты Date в activity).
 */
export function createInitialVacationRequests() {
  return [
    { id: 1, employee: 'Mirzo Bedil', from: '2026-04-15', to: '2026-04-23', days: 9, type: 'Ежегодный', status: 'approved',
      activity: [
        { actor: 'Mirzo Bedil', role: 'staff', action: 'submitted', time: new Date('2026-04-04T09:15:00'), note: 'Плановый ежегодный отпуск' },
        { actor: 'Руслан Камолов', role: 'manager', action: 'approved', time: new Date('2026-04-04T14:30:00'), note: '' },
      ] },
    { id: 2, employee: 'Сардор Тошматов', from: '2026-04-18', to: '2026-04-26', days: 9, type: 'Больничный', status: 'pending_manager',
      comment:
        'Пересечение с отпусками коллег (в этот период уже утверждены отпуска Mirzo Bedil и Малики Рахимовой).',
      activity: [
        { actor: 'Сардор Тошматов', role: 'staff', action: 'submitted', time: new Date('2026-04-06T08:20:00'), note: '' },
      ] },
    { id: 3, employee: 'Нилуфар Юсупова', from: '2026-05-05', to: '2026-05-16', days: 12, type: 'Ежегодный', status: 'approved_by_manager',
      activity: [
        { actor: 'Нилуфар Юсупова', role: 'staff', action: 'submitted', time: new Date('2026-04-05T11:00:00'), note: 'Основной ежегодный отпуск' },
        { actor: 'Руслан Камолов', role: 'manager', action: 'approved', time: new Date('2026-04-06T09:45:00'), note: '' },
      ] },
    { id: 4, employee: 'Жасур Мирзаев', from: '2026-03-18', to: '2026-03-23', days: 6, type: 'За свой счёт', status: 'rejected',
      rejectReason: 'Нет замены на данный период',
      activity: [
        { actor: 'Жасур Мирзаев', role: 'staff', action: 'submitted', time: new Date('2026-03-14T10:00:00'), note: '' },
        { actor: 'Руслан Камолов', role: 'manager', action: 'rejected', time: new Date('2026-03-15T11:30:00'), note: 'Нет замены на данный период' },
      ] },
    { id: 5, employee: 'Малика Рахимова', from: '2026-04-28', to: '2026-05-01', days: 4, type: 'Ежегодный', status: 'pending_manager',
      activity: [
        { actor: 'Малика Рахимова', role: 'staff', action: 'submitted', time: new Date('2026-04-08T11:20:00'), note: '' },
      ] },
    { id: 6, employee: 'Бобур Хасанов', from: '2026-05-12', to: '2026-05-14', days: 3, type: 'Больничный', status: 'pending',
      activity: [
        { actor: 'Бобур Хасанов', role: 'staff', action: 'submitted', time: new Date('2026-04-06T07:30:00'), note: '' },
      ] },
    { id: 7, employee: 'Нилуфар Юсупова', from: '2026-04-08', to: '2026-04-10', days: 3, type: 'Командировка', status: 'approved',
      activity: [
        { actor: 'Нилуфар Юсупова', role: 'staff', action: 'submitted', time: new Date('2026-03-28T10:00:00'), note: '' },
        { actor: 'Руслан Камолов', role: 'manager', action: 'approved', time: new Date('2026-03-29T09:00:00'), note: '' },
      ] },
    { id: 8, employee: 'Жасур Мирзаев', from: '2026-04-11', to: '2026-04-14', days: 4, type: 'Удалённая работа', status: 'approved',
      activity: [
        { actor: 'Жасур Мирзаев', role: 'staff', action: 'submitted', time: new Date('2026-04-01T08:00:00'), note: '' },
      ] },
    { id: 9, employee: 'Руслан Камолов', from: '2026-06-03', to: '2026-06-14', days: 12, type: 'Ежегодный', status: 'planned' },
    { id: 10, employee: 'Зарина Хасанова', from: '2026-07-01', to: '2026-07-05', days: 5, type: 'Ежегодный', status: 'pending_manager',
      activity: [
        { actor: 'Зарина Хасанова', role: 'staff', action: 'submitted', time: new Date('2026-04-01T10:00:00'), note: '' },
      ] },
    { id: 11, employee: 'Дилноза Атаева', from: '2026-05-20', to: '2026-05-22', days: 3, type: 'Больничный', status: 'approved',
      activity: [
        { actor: 'Дилноза Атаева', role: 'staff', action: 'submitted', time: new Date('2026-04-05T10:00:00'), note: '' },
        { actor: 'Руслан Камолов', role: 'manager', action: 'approved', time: new Date('2026-04-06T11:00:00'), note: '' },
      ] },
    { id: 12, employee: 'Руслан Камолов', from: '2026-04-05', to: '2026-04-18', days: 14, type: 'Ежегодный', status: 'approved',
      activity: [
        { actor: 'Руслан Камолов', role: 'staff', action: 'submitted', time: new Date('2026-03-10T09:00:00'), note: '' },
        { actor: 'Руслан Камолов', role: 'manager', action: 'approved', time: new Date('2026-03-11T10:00:00'), note: '' },
      ] },
    { id: 13, employee: 'Зарина Хасанова', from: '2026-04-06', to: '2026-04-11', days: 6, type: 'Командировка', status: 'approved',
      activity: [
        { actor: 'Зарина Хасанова', role: 'staff', action: 'submitted', time: new Date('2026-04-01T08:00:00'), note: '' },
        { actor: 'Руслан Камолов', role: 'manager', action: 'approved', time: new Date('2026-04-02T09:00:00'), note: '' },
      ] },
    { id: 14, employee: 'Дилноза Атаева', from: '2026-04-10', to: '2026-04-12', days: 3, type: 'Ежегодный', status: 'approved',
      activity: [
        { actor: 'Дилноза Атаева', role: 'staff', action: 'submitted', time: new Date('2026-04-01T10:00:00'), note: '' },
        { actor: 'Руслан Камолов', role: 'manager', action: 'approved', time: new Date('2026-04-02T11:00:00'), note: '' },
      ] },
    { id: 15, employee: 'Малика Рахимова', from: '2026-04-18', to: '2026-04-22', days: 5, type: 'Ежегодный', status: 'approved',
      activity: [
        { actor: 'Малика Рахимова', role: 'staff', action: 'submitted', time: new Date('2026-04-01T09:00:00'), note: '' },
        { actor: 'Руслан Камолов', role: 'manager', action: 'approved', time: new Date('2026-04-02T10:00:00'), note: '' },
      ] },
    { id: 16, employee: 'Нилуфар Юсупова', from: '2026-05-10', to: '2026-05-12', days: 3, type: 'Командировка', status: 'confirmed',
      activity: [
        { actor: 'Нилуфар Юсупова', role: 'staff', action: 'submitted', time: new Date('2026-04-20T10:00:00'), note: '' },
        { actor: 'Руслан Камолов', role: 'manager', action: 'approved', time: new Date('2026-04-21T09:00:00'), note: '' },
        { actor: 'Зарина Хасанова', role: 'hr', action: 'confirmed', time: new Date('2026-04-22T11:00:00'), note: '' },
      ] },
    { id: 17, employee: 'Малика Рахимова', from: '2026-04-21', to: '2026-04-24', days: 4, type: 'Ежегодный', status: 'approved_by_manager',
      activity: [
        { actor: 'Малика Рахимова', role: 'staff', action: 'submitted', time: new Date('2026-04-05T11:00:00'), note: 'Перенос части дней' },
        { actor: 'Руслан Камолов', role: 'manager', action: 'approved', time: new Date('2026-04-06T14:00:00'), note: '' },
      ] },
    { id: 18, employee: 'Mirzo Bedil', from: '2026-08-01', to: '2026-08-07', days: 7, type: 'Ежегодный', status: 'rejected',
      rejectReason: 'Пик нагрузки в отделе, перенесите на после релиза',
      activity: [
        { actor: 'Mirzo Bedil', role: 'staff', action: 'submitted', time: new Date('2026-04-08T09:00:00'), note: 'Летний отпуск' },
        { actor: 'Руслан Камолов', role: 'manager', action: 'rejected', time: new Date('2026-04-09T16:00:00'), note: 'Пик нагрузки в отделе, перенесите на после релиза' },
      ] },
    { id: 19, employee: 'Сардор Тошматов', from: '2026-09-15', to: '2026-09-17', days: 3, type: 'За свой счёт', status: 'rejected',
      rejectReason: 'Совпадает с запланированным релизом',
      activity: [
        { actor: 'Сардор Тошматов', role: 'staff', action: 'submitted', time: new Date('2026-04-07T11:30:00'), note: '' },
        { actor: 'Руслан Камолов', role: 'manager', action: 'rejected', time: new Date('2026-04-08T10:15:00'), note: 'Совпадает с запланированным релизом' },
      ] },
    /** Пересечение загрузки команды: в модалке руководителя — блок «План загрузки» (несколько коллег с approved/planned). */
    { id: 20, employee: 'Mirzo Bedil', from: '2026-06-05', to: '2026-06-10', days: 6, type: 'Ежегодный', status: 'pending_manager',
      comment: 'Пересекается с плановым отпуском руководителя (12 дн. с 03.06) — высокая нагрузка на срок.',
      activity: [
        { actor: 'Mirzo Bedil', role: 'staff', action: 'submitted', time: new Date('2026-04-09T10:00:00'), note: '' },
      ] },
    { id: 21, employee: 'Малика Рахимова', from: '2026-04-17', to: '2026-04-20', days: 4, type: 'Ежегодный', status: 'pending_manager',
      comment: 'Даты пересекаются с уже утверждённым отпуском Mirzo Bedil в команде.',
      activity: [
        { actor: 'Малика Рахимова', role: 'staff', action: 'submitted', time: new Date('2026-04-09T14:30:00'), note: '' },
      ] },
    /** Утверждённый отпуск — база для HR-конфликта с id 23 (тот же сотрудник, пересекающиеся даты). */
    { id: 22, employee: 'Жасур Мирзаев', from: '2026-06-08', to: '2026-06-20', days: 13, type: 'Ежегодный', status: 'approved',
      activity: [
        { actor: 'Жасур Мирзаев', role: 'staff', action: 'submitted', time: new Date('2026-04-01T09:00:00'), note: '' },
        { actor: 'Руслан Камолов', role: 'manager', action: 'approved', time: new Date('2026-04-02T11:00:00'), note: '' },
      ] },
    { id: 23, employee: 'Жасур Мирзаев', from: '2026-06-12', to: '2026-06-16', days: 5, type: 'За свой счёт', status: 'approved_by_manager',
      comment: 'Демо: пересечение с уже утверждённой заявкой id 22 — проверка «Конфликт дат» у HR.',
      activity: [
        { actor: 'Жасур Мирзаев', role: 'staff', action: 'submitted', time: new Date('2026-04-10T08:00:00'), note: '' },
        { actor: 'Руслан Камолов', role: 'manager', action: 'approved', time: new Date('2026-04-10T15:00:00'), note: '' },
      ] },
    { id: 24, employee: 'Бобур Хасанов', from: '2026-05-13', to: '2026-05-17', days: 5, type: 'Командировка', status: 'approved',
      activity: [
        { actor: 'Бобур Хасанов', role: 'staff', action: 'submitted', time: new Date('2026-04-05T09:00:00'), note: '' },
        { actor: 'Руслан Камолов', role: 'manager', action: 'approved', time: new Date('2026-04-06T10:00:00'), note: '' },
      ] },
    { id: 25, employee: 'Бобур Хасанов', from: '2026-05-15', to: '2026-05-19', days: 5, type: 'Ежегодный', status: 'approved_by_manager',
      comment: 'Демо HR: даты пересекаются с командировкой id 24 (уже одобрена).',
      activity: [
        { actor: 'Бобур Хасанов', role: 'staff', action: 'submitted', time: new Date('2026-04-08T09:00:00'), note: '' },
        { actor: 'Руслан Камолов', role: 'manager', action: 'approved', time: new Date('2026-04-09T11:00:00'), note: '' },
      ] },
  ]
}
