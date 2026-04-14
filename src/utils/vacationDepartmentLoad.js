/**
 * Пиковая доля сотрудников подразделения в отпуске в один календарный день
 * внутри диапазона [rangeFrom, rangeTo] (для HR / планирования).
 */

function hasOverlap(a1, a2, b1, b2) {
  return a1 <= b2 && a2 >= b1
}

function enumerateDaysInclusive(fromStr, toStr) {
  const out = []
  const d = new Date(`${fromStr}T12:00:00`)
  const end = new Date(`${toStr}T12:00:00`)
  if (Number.isNaN(d.getTime()) || Number.isNaN(end.getTime())) return out
  while (d <= end) {
    out.push(d.toISOString().slice(0, 10))
    d.setDate(d.getDate() + 1)
  }
  return out
}

/**
 * @param {object} params
 * @param {string} params.rangeFrom - ISO date
 * @param {string} params.rangeTo - ISO date
 * @param {number} params.headcount - штат подразделения (>0)
 * @param {Array<{ empKey: string, from: string, to: string }>} params.absences - уже отфильтрованные отсутствия отдела
 * @returns {{ maxPercent: number, worstDay: string|null, maxConcurrent: number }}
 */
export function peakConcurrentLoadInRange({ rangeFrom, rangeTo, headcount, absences }) {
  if (!headcount || headcount < 1) {
    return { maxPercent: 0, worstDay: null, maxConcurrent: 0 }
  }
  const days = enumerateDaysInclusive(rangeFrom, rangeTo)
  let maxConcurrent = 0
  let worstDay = null
  for (const day of days) {
    const seen = new Set()
    for (const a of absences) {
      if (day >= a.from && day <= a.to) seen.add(a.empKey)
    }
    const n = seen.size
    if (n > maxConcurrent) {
      maxConcurrent = n
      worstDay = day
    }
  }
  return {
    maxPercent: (maxConcurrent / headcount) * 100,
    worstDay,
    maxConcurrent,
  }
}

/**
 * Заявки (имена сотрудников): пиковая нагрузка по отделу для HR.
 *
 * @param {Record<string, { dept: string }>} employeeData
 * @param {Array<{ id: string, employee: string, from: string, to: string, status: string }>} requests
 * @param {string} department
 * @param {string} rangeFrom
 * @param {string} rangeTo
 * @param {(status: string) => boolean} includeStatus
 * @param {Set<string>} [excludeIds]
 */
export function peakDeptLoadFromNamedRequests({
  employeeData,
  requests,
  department,
  rangeFrom,
  rangeTo,
  includeStatus,
  excludeIds = new Set(),
}) {
  const headcount = Object.values(employeeData).filter(e => e.dept === department).length
  const absences = []
  for (const r of requests) {
    if (excludeIds.has(r.id)) continue
    if (!includeStatus(r.status)) continue
    const dept = employeeData[r.employee]?.dept
    if (dept !== department) continue
    if (!hasOverlap(r.from, r.to, rangeFrom, rangeTo)) continue
    absences.push({ empKey: r.employee, from: r.from, to: r.to })
  }
  return peakConcurrentLoadInRange({ rangeFrom, rangeTo, headcount, absences })
}

/**
 * Планирование (empId): пиковая нагрузка по отделу за год / период.
 *
 * @param {Array<{ id: number, dept: string }>} employees
 * @param {Array<{ id: number, empId: number, from: string, to: string, status: string }>} vacations
 * @param {string} department
 * @param {string} rangeFrom
 * @param {string} rangeTo
 * @param {(status: string) => boolean} includeStatus
 */
export function peakDeptLoadFromPlanning({
  employees,
  vacations,
  department,
  rangeFrom,
  rangeTo,
  includeStatus,
}) {
  const headcount = employees.filter(e => e.dept === department).length
  const empIds = new Set(employees.filter(e => e.dept === department).map(e => e.id))
  const absences = []
  for (const v of vacations) {
    if (!includeStatus(v.status)) continue
    if (!empIds.has(v.empId)) continue
    if (!hasOverlap(v.from, v.to, rangeFrom, rangeTo)) continue
    absences.push({ empKey: String(v.empId), from: v.from, to: v.to })
  }
  return peakConcurrentLoadInRange({ rangeFrom, rangeTo, headcount, absences })
}
