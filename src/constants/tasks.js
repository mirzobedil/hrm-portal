/**
 * Роли и возможности модуля «Задачи» (task management).
 * Демо-роли сайдбара маппятся на системные имена — см. demoSessionRoleToTaskSystemRole.
 */

/** Системные ключи ролей (API / права). */
export const TASK_SYSTEM_ROLES = {
  EMPLOYEE: 'employee',
  MANAGER: 'manager',
  HR_OFFICER: 'hr_officer',
  HR_ADMIN: 'hr_admin',
  SYSTEM: 'system',
}

/**
 * Описание ролей: продуктовое имя → системное имя → возможности.
 */
export const TASK_ROLE_DEFINITIONS = [
  {
    key: TASK_SYSTEM_ROLES.EMPLOYEE,
    productName: 'Employee',
    systemName: 'Employee',
    capabilities:
      'Свои задачи: просмотр, выполнение, комментарии, загрузка документов.',
  },
  {
    key: TASK_SYSTEM_ROLES.MANAGER,
    productName: 'Line Manager',
    systemName: 'Manager',
    capabilities:
      'Задачи команды: просмотр, согласование заявок, делегирование, ручное создание задач.',
  },
  {
    key: TASK_SYSTEM_ROLES.HR_OFFICER,
    productName: 'HR Specialist',
    systemName: 'HR Officer',
    capabilities:
      'Шаблоны, назначение задач, аналитика по подразделениям.',
  },
  {
    key: TASK_SYSTEM_ROLES.HR_ADMIN,
    productName: 'HR Administrator',
    systemName: 'HR Admin',
    capabilities:
      'Полный доступ: триггеры, шаблоны, правила эскалации.',
  },
  {
    key: TASK_SYSTEM_ROLES.SYSTEM,
    productName: 'System Bot',
    systemName: 'System',
    capabilities:
      'Автоматическое создание задач по триггерам, без участия пользователя.',
  },
]

/** Демо: activeRole из App.vue → системная роль задач. */
const DEMO_SESSION_TO_TASK = {
  staff: TASK_SYSTEM_ROLES.EMPLOYEE,
  manager: TASK_SYSTEM_ROLES.MANAGER,
  hr: TASK_SYSTEM_ROLES.HR_OFFICER,
  admin: TASK_SYSTEM_ROLES.HR_ADMIN,
}

export function demoSessionRoleToTaskSystemRole(sessionRoleId) {
  return DEMO_SESSION_TO_TASK[sessionRoleId] ?? TASK_SYSTEM_ROLES.EMPLOYEE
}

export function taskRoleDefinition(key) {
  return TASK_ROLE_DEFINITIONS.find(r => r.key === key) ?? null
}

/** Filtrlar (demo) — Tasks sahifasi */
export const TASK_FILTER_STATUS = [
  { value: '', label: 'Все статусы' },
  { value: 'open', label: 'Открыта' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'blocked', label: 'Блок' },
  { value: 'done', label: 'Выполнена' },
]

export const TASK_FILTER_PRIORITY = [
  { value: '', label: 'Все' },
  { value: 'high', label: 'Высокий' },
  { value: 'normal', label: 'Обычный' },
  { value: 'low', label: 'Низкий' },
]

export const TASK_FILTER_CATEGORY = [
  { value: '', label: 'Все' },
  { value: 'approvals', label: 'Согласования' },
  { value: 'onboarding', label: 'Онбординг' },
  { value: 'documents', label: 'Документы' },
  { value: 'vacations', label: 'Отпуска' },
  { value: 'evaluation', label: 'Оценка' },
]

/** Demo ijrochilar — filter «Исполнитель» */
export const TASK_FILTER_ASSIGNEES = [
  { value: '', label: 'Все' },
  { value: 'zh', label: 'Зарина Хасанова' },
  { value: 'rk', label: 'Руслан Камолов' },
  { value: 'mb', label: 'Мирзо Бедил' },
  { value: 'da', label: 'Дилноза Атаева' },
]

/** Ijrochi kaliti → ism va initials (yangi vazifa / modalka) */
export const TASK_ASSIGNEE_BY_KEY = {
  zh: { name: 'Зарина Хасанова', initials: 'ЗХ' },
  rk: { name: 'Руслан Камолов', initials: 'РК' },
  mb: { name: 'Мирзо Бедил', initials: 'МБ' },
  da: { name: 'Дилноза Атаева', initials: 'ДА' },
  aa: { name: 'Azizov Aziz', initials: 'AA' },
}

/** Yangi vazifa: shablonlar */
export const TASK_CREATE_TEMPLATES = [
  { value: '', label: '— Без шаблона —' },
  { value: 'onboarding_newbie', label: 'Онбординг новичка' },
  { value: 'vacation_approval', label: 'Согласование отпуска' },
  { value: 'review_q', label: 'Квартальная оценка' },
]

/** Тип задачи */
export const TASK_CREATE_TYPES = [
  { value: 'manual', label: 'Ручная' },
  { value: 'system', label: 'Системная' },
]

/**
 * Kategoriya chip (bir nechtasi tanlanishi mumkin).
 * id — filter `category` slug bilan mos (birinchi tanlangan asosiy).
 */
export const TASK_CATEGORY_CHIPS = [
  { id: 'onboarding', label: 'Онбординг', tone: 'blue' },
  { id: 'documents', label: 'Документ', tone: 'violet' },
  { id: 'approvals', label: 'Согласование', tone: 'teal' },
  { id: 'vacations', label: 'Отпуск', tone: 'sky' },
  { id: 'evaluation', label: 'Оценка', tone: 'rose' },
  { id: 'it', label: 'IT', tone: 'slate' },
]

export const TASK_CREATE_ASSIGNEES = [
  { value: 'zh', label: 'Зарина Хасанова' },
  { value: 'rk', label: 'Руслан Камолов' },
  { value: 'mb', label: 'Мирзо Бедил' },
  { value: 'da', label: 'Дилноза Атаева' },
  { value: 'aa', label: 'Azizov Aziz' },
]

/** Просрочка: кого уведомить */
export const TASK_ESCALATION_OPTIONS = [
  { value: 'none', label: '— Не уведомлять —' },
  { value: 'manager', label: 'Руководитель (эскалация)' },
  { value: 'hr', label: 'HR' },
  { value: 'assignee', label: 'Только исполнителю' },
]
