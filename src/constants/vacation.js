/**
 * Общие константы отпусков (один источник для подписей статусов и демо-команды руководителя).
 */

/** Демо: подчинённые руководителя (ИТ‑разработка) */
export const MANAGER_TEAM_NAMES = [
  'Mirzo Bedil',
  'Сардор Тошматов',
  'Малика Рахимова',
]

export const MANAGER_TEAM = new Set(MANAGER_TEAM_NAMES)

export function isInManagerTeam(name) {
  return MANAGER_TEAM.has(name)
}

export const VACATION_TYPES = ['Ежегодный', 'За свой счёт', 'Учебный']

/** Демо: непосредственный руководитель в цепочке согласования заявок */
export const LINE_MANAGER = {
  name: 'Руслан Камолов',
  initials: 'РК',
  role: 'Руководитель',
}

/**
 * При годовом планировании эти статусы занимают даты в календаре (нельзя пересечь).
 * Черновик planned и отклонённые rejected — не блокируют: можно выбрать период заново.
 */
export const VACATION_PLANNING_BLOCKING_STATUSES = [
  'pending',
  'pending_manager',
  'approved_by_manager',
  'approved',
  'confirmed',
]

/** HR / планирование: предупреждение, если в какой-либо день доля отдела в отпуске превышает этот % */
export const DEPT_VACATION_COVERAGE_LIMIT_PERCENT = 30

/** Заявки: статусы, при которых отпуск уже «занимает слот» в календаре отдела (расчёт перегруза) */
export const DEPT_LOAD_REQUEST_STATUSES = [
  'planned',
  'pending_manager',
  'approved_by_manager',
  'approved',
  'confirmed',
]

/** Подписи статусов заявок (ключ = class / status в данных) */
export const STATUS_LABELS = {
  approved: 'Одобрено',
  confirmed: 'Подтверждено',
  pending: 'На рассмотрении',
  rejected: 'Отклонено',
  planned: 'Запланировано',
  pending_manager: 'Ожидает менеджера',
  approved_by_manager: 'Утверждено менеджером',
}

/** Категория отсутствия для фильтра «календарь команды» */
export function teamAbsenceCategory(type) {
  if (['Ежегодный', 'За свой счёт', 'Учебный', 'Компенсация'].includes(type)) return 'vacation'
  if (type === 'Больничный') return 'sick'
  if (type === 'Командировка') return 'trip'
  if (type === 'Удалённая работа') return 'remote'
  return 'vacation'
}

export function teamAbsenceShortLabel(type) {
  const map = {
    Ежегодный: 'Отпуск',
    'За свой счёт': 'Отпуск',
    Учебный: 'Учёба',
    Компенсация: 'Компенс.',
    Больничный: 'Больничный',
    Командировка: 'Командировка',
    'Удалённая работа': 'Удалённо',
  }
  return map[type] || type
}

export function teamSegClass(cat) {
  const m = {
    vacation: 'team-seg--vacation',
    sick: 'team-seg--sick',
    trip: 'team-seg--trip',
    remote: 'team-seg--remote',
  }
  return m[cat] || 'team-seg--vacation'
}
