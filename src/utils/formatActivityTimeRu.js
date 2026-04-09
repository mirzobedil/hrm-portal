/** «Сегодня, 14:05» / «Вчера, …» / полная дата для ленты активности */
export function formatActivityTimeRu(input) {
  if (input == null || input === '') return ''
  const d = input instanceof Date ? input : new Date(input)
  if (Number.isNaN(d.getTime())) return ''

  const pad = n => String(n).padStart(2, '0')
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`

  const startOfDay = x => {
    const t = new Date(x)
    t.setHours(0, 0, 0, 0)
    return t
  }

  const today = startOfDay(new Date())
  const day = startOfDay(d)
  const diffDays = Math.round((day - today) / 86400000)

  if (diffDays === 0) return `Сегодня, ${time}`
  if (diffDays === -1) return `Вчера, ${time}`

  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}, ${time}`
}
