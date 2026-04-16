import { REC_VACANCIES } from '@/data/recruitingDashboardDemo.js'

/** Подразделения для формы «Создание заявки» (спека 4.1.1) — из демо-вакансий. */
export const REC_HIRING_DEPT_OPTIONS = [
  ...new Map(REC_VACANCIES.map((v) => [v.dept, { value: v.dept, label: v.dept }])).values(),
]
