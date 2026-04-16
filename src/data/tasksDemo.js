/**
 * Demo tasks — Tasks layout (list + detail). Keyin API bilan almashtiriladi.
 */

export function todayIsoLocal() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Boshlang‘ich ro‘yxat (deep clone qilish uchun) */
export function createDemoTasks() {
  return [
    {
      id: 1,
      title: 'Согласовать отпуск — Нилуфар Юсупова',
      summary: 'Финальное подтверждение HR после руководителя.',
      description:
        'Проверить баланс дней, отсутствие пересечений с другими подтверждёнными отпусками и оформить приказ в АНЕТ.',
      status: 'in_progress',
      priority: 'high',
      category: 'vacations',
      categoryLabel: 'Отпуска',
      assigneeKey: 'zh',
      assignee: { name: 'Зарина Хасанова', initials: 'ЗХ' },
      due: '2026-04-10',
      checklist: [
        { id: '1a', text: 'Проверить баланс', done: true },
        { id: '1b', text: 'Проверить пересечения дат', done: false },
        { id: '1c', text: 'Создать приказ', done: false },
      ],
      comments: [
        { id: 'c1', author: 'Руслан Камолов', text: 'С моей стороны одобрено.', at: '2026-04-11T09:30:00' },
      ],
    },
    {
      id: 2,
      title: 'Пакет документов онбординга — А. Каримов',
      summary: 'Подписание договора и NDA.',
      description: 'Собрать подписи, загрузить сканы в кадровый архив.',
      status: 'open',
      priority: 'normal',
      category: 'onboarding',
      categoryLabel: 'Онбординг',
      assigneeKey: 'da',
      assignee: { name: 'Дилноза Атаева', initials: 'ДА' },
      due: '2026-04-08',
      checklist: [
        { id: '2a', text: 'Договор', done: false },
        { id: '2b', text: 'NDA', done: false },
      ],
      comments: [],
    },
    {
      id: 3,
      title: 'Согласование командировки — Р. Камолов',
      summary: 'Проверка бюджета и цели поездки.',
      description: 'Сверить с политикой командировок и лимитами подразделения.',
      status: 'in_progress',
      priority: 'normal',
      category: 'approvals',
      categoryLabel: 'Согласования',
      assigneeKey: 'rk',
      assignee: { name: 'Руслан Камолов', initials: 'РК' },
      due: '2026-04-20',
      checklist: [{ id: '3a', text: 'Согласовать даты', done: true }],
      comments: [{ id: 'c2', author: 'Система', text: 'Напоминание за 3 дня.', at: '2026-04-17T08:00:00' }],
    },
    {
      id: 4,
      title: 'Проверка кадровых документов — продажи',
      summary: 'Актуализация личных дел.',
      description: 'Выборочная проверка папок по списку отдела.',
      status: 'blocked',
      priority: 'low',
      category: 'documents',
      categoryLabel: 'Документы',
      assigneeKey: 'zh',
      assignee: { name: 'Зарина Хасанова', initials: 'ЗХ' },
      due: '2026-04-25',
      checklist: [],
      comments: [],
    },
    {
      id: 5,
      title: 'Промежуточная оценка ИПР',
      summary: 'Заполнить форму до дедлайна HR.',
      description: 'Оценка целей Q1, комментарии руководителя.',
      status: 'open',
      priority: 'high',
      category: 'evaluation',
      categoryLabel: 'Оценка',
      assigneeKey: 'mb',
      assignee: { name: 'Мирзо Бедил', initials: 'МБ' },
      due: '2026-04-13',
      checklist: [
        { id: '5a', text: 'Самооценка', done: false },
        { id: '5b', text: 'Встреча с руководителем', done: false },
      ],
      comments: [],
    },
    {
      id: 6,
      title: 'Автонапоминание: медосмотр',
      summary: 'Ежегодный осмотр по графику.',
      description: 'Записаться в клинику партнёра, прикрепить справку.',
      status: 'done',
      priority: 'low',
      category: 'vacations',
      categoryLabel: 'Отпуска',
      assigneeKey: 'mb',
      assignee: { name: 'Мирзо Бедил', initials: 'МБ' },
      due: '2026-03-01',
      checklist: [{ id: '6a', text: 'Пройти осмотр', done: true }],
      comments: [{ id: 'c3', author: 'HR', text: 'Закрыто автоматически.', at: '2026-03-02T12:00:00' }],
    },
  ]
}
