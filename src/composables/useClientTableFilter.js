import { ref, computed, unref } from 'vue'

/**
 * Клиентский поиск и фильтры по полям строк (без запроса на сервер).
 *
 * @param {import('vue').Ref | ComputedRef | Array} baseRowsRef — массив или ref/computed с массивом
 * @param {object} [options]
 * @param {(row: object) => string} [options.searchText] — строка для поиска по полям
 */
/** Пересечение периода отпуска [row.from, row.to] с выбранным диапазоном дат (ISO YYYY-MM-DD). */
function rowOverlapsDateRange(row, fromStr, toStr) {
  if (!fromStr && !toStr) return true
  const dmin = fromStr || '0000-01-01'
  const dmax = toStr || '9999-12-31'
  return row.from <= dmax && row.to >= dmin
}

export function useClientTableFilter(baseRowsRef, options = {}) {
  const searchQuery = ref('')
  const statusFilter = ref('')
  const typeFilter = ref('')
  const dateRange = ref({ from: '', to: '' })

  const filteredRows = computed(() => {
    const raw = unref(baseRowsRef)
    const rows = Array.isArray(raw) ? raw : []
    let list = [...rows]

    if (statusFilter.value) {
      list = list.filter((r) => r.status === statusFilter.value)
    }
    if (typeFilter.value) {
      list = list.filter((r) => r.type === typeFilter.value)
    }
    const { from: df, to: dt } = dateRange.value
    if (df || dt) {
      list = list.filter((r) => rowOverlapsDateRange(r, df, dt))
    }

    const q = searchQuery.value.trim().toLowerCase()
    if (q) {
      const getText = options.searchText || ((r) =>
        [r.employee, r.type, r.status, r.from, r.to].filter(Boolean).join(' '))
      list = list.filter((r) => getText(r).toLowerCase().includes(q))
    }

    return list
  })

  return {
    searchQuery,
    statusFilter,
    typeFilter,
    dateRange,
    filteredRows,
  }
}
