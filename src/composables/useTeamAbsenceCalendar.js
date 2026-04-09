import { ref, computed, watch, inject } from 'vue'
import { useVacationRequests } from '@/composables/useVacationRequests'
import { COLLEAGUES } from '@/data/colleagues'
import {
  STATUS_LABELS as statusLabel,
  teamAbsenceCategory,
  teamAbsenceShortLabel,
  teamSegClass,
} from '@/constants/vacation'

const MONTHS_RU = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
]
const DAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

const TEAMS_STORE_KEY = 'hrm_my_teams'
function loadMyTeams() {
  try {
    return JSON.parse(localStorage.getItem(TEAMS_STORE_KEY) || '[]')
  } catch {
    return []
  }
}

/** Общее состояние календаря команды (месяц, фильтры, «Мои команды») — одно на приложение */
const teamCalYear = ref(new Date().getFullYear())
const teamCalMonth = ref(new Date().getMonth())
const teamSearchQuery = ref('')
const teamFilter = ref('all')
const teamSubTab = ref('dept')
const showTeamListModal = ref(false)
const myTeams = ref(loadMyTeams())
const activeGroupKey = ref('dept')
const showTeamModal = ref(false)
const editingTeam = ref(null)
const teamModalName = ref('')
const teamModalMembers = ref(new Set())

watch(myTeams, t => localStorage.setItem(TEAMS_STORE_KEY, JSON.stringify(t)), { deep: true })

watch(teamSubTab, tab => {
  if (tab === 'dept') {
    activeGroupKey.value = 'dept'
  } else if (tab === 'team') {
    if (myTeams.value.length && activeGroupKey.value === 'dept') {
      activeGroupKey.value = myTeams.value[0].id
    }
  }
})

function fmtDate(iso) {
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}

function clipRangeToMonth(fromIso, toIso, y, m) {
  const pad = n => String(n).padStart(2, '0')
  const lastDay = new Date(y, m + 1, 0).getDate()
  const monthStart = `${y}-${pad(m + 1)}-01`
  const monthEnd = `${y}-${pad(m + 1)}-${pad(lastDay)}`
  const a = fromIso > monthStart ? fromIso : monthStart
  const b = toIso < monthEnd ? toIso : monthEnd
  if (a > b) return null
  return { a, b }
}

function teamSegPending(status) {
  return ['pending', 'pending_manager', 'planned'].includes(status)
}

export function useTeamAbsenceCalendar(options = {}) {
  const draftFrom = options.draftFrom ?? ref('')
  const draftTo = options.draftTo ?? ref('')
  const draftType = options.draftType ?? ref('Ежегодный')

  const sessionUser = inject('sessionUser')
  const { allRequests } = useVacationRequests()

  const currentUser = computed(() => ({
    name: sessionUser.value.name,
    isTopLevel: sessionUser.value.isTopLevel,
  }))

  const activeTeam = computed(() =>
    activeGroupKey.value === 'dept' ? null : (myTeams.value.find(t => t.id === activeGroupKey.value) ?? null),
  )

  const teamSubTabCount = computed(() => activeTeam.value?.members?.length ?? 0)

  function openCreateTeam() {
    showTeamListModal.value = false
    editingTeam.value = null
    teamModalName.value = ''
    teamModalMembers.value = new Set()
    showTeamModal.value = true
  }
  function openEditTeam(team) {
    showTeamListModal.value = false
    editingTeam.value = team
    teamModalName.value = team.name
    teamModalMembers.value = new Set(team.members)
    showTeamModal.value = true
  }
  function saveTeamModal() {
    const name = teamModalName.value.trim()
    if (!name) return
    const members = [...teamModalMembers.value]
    if (editingTeam.value) {
      const t = myTeams.value.find(x => x.id === editingTeam.value.id)
      if (t) {
        t.name = name
        t.members = members
      }
    } else {
      const id = Date.now()
      myTeams.value.push({ id, name, members })
      activeGroupKey.value = id
      teamSubTab.value = 'team'
    }
    showTeamModal.value = false
  }
  function deleteTeam(id) {
    if (!confirm('Удалить команду?')) return
    myTeams.value = myTeams.value.filter(t => t.id !== id)
    if (activeGroupKey.value === id) {
      const fallback = myTeams.value[0]?.id
      if (fallback) {
        activeGroupKey.value = fallback
      } else {
        activeGroupKey.value = 'dept'
        teamSubTab.value = 'dept'
      }
    }
  }
  function toggleTeamMember(id) {
    const s = teamModalMembers.value
    if (s.has(id)) s.delete(id)
    else s.add(id)
  }

  function teamMonthTitle() {
    return `${MONTHS_RU[teamCalMonth.value]}, ${teamCalYear.value}`
  }
  function prevTeamMonth() {
    if (teamCalMonth.value === 0) {
      teamCalMonth.value = 11
      teamCalYear.value--
    } else teamCalMonth.value--
  }
  function nextTeamMonth() {
    if (teamCalMonth.value === 11) {
      teamCalMonth.value = 0
      teamCalYear.value++
    } else teamCalMonth.value++
  }
  function goTeamToday() {
    const d = new Date()
    teamCalYear.value = d.getFullYear()
    teamCalMonth.value = d.getMonth()
  }

  /** Показать месяц, в котором лежит дата ISO (для превью формы заявки) */
  function syncTeamCalendarToIso(iso) {
    if (!iso || typeof iso !== 'string' || iso.length < 7) return
    const [yStr, mStr] = iso.split('-')
    const y = parseInt(yStr, 10)
    const m = parseInt(mStr, 10) - 1
    if (Number.isNaN(y) || m < 0 || m > 11) return
    teamCalYear.value = y
    teamCalMonth.value = m
  }

  const teamMonthDays = computed(() => {
    const y = teamCalYear.value
    const m = teamCalMonth.value
    const last = new Date(y, m + 1, 0).getDate()
    const pad = n => String(n).padStart(2, '0')
    const td = new Date()
    const todayIso = `${td.getFullYear()}-${pad(td.getMonth() + 1)}-${pad(td.getDate())}`
    const days = []
    for (let dNum = 1; dNum <= last; dNum++) {
      const iso = `${y}-${pad(m + 1)}-${pad(dNum)}`
      const jsD = new Date(y, m, dNum).getDay()
      const eu = jsD === 0 ? 6 : jsD - 1
      days.push({
        iso,
        dayNum: dNum,
        dowShort: DAYS_SHORT[eu],
        isWeekend: eu >= 5,
        isToday: iso === todayIso,
      })
    }
    return days
  })

  const teamTimelineMinWidth = computed(
    () => `${Math.max(teamMonthDays.value.length * 26, 560)}px`,
  )

  const teamColleaguesFiltered = computed(() => {
    const team = activeTeam.value
    const pool = team ? COLLEAGUES.filter(c => team.members.includes(c.id)) : COLLEAGUES
    const q = teamSearchQuery.value.trim().toLowerCase()
    if (!q) return pool
    return pool.filter(
      c => c.name.toLowerCase().includes(q) || (c.role && c.role.toLowerCase().includes(q)),
    )
  })

  const teamCalRowsOrdered = computed(() => {
    const list = [...teamColleaguesFiltered.value]
    const i = list.findIndex(c => c.name === currentUser.value.name)
    if (i > 0) {
      const [me] = list.splice(i, 1)
      list.unshift(me)
    }
    return list
  })

  function getTeamSegments(empName) {
    const y = teamCalYear.value
    const m = teamCalMonth.value
    const totalDays = new Date(y, m + 1, 0).getDate()
    const out = []
    for (const r of allRequests.value) {
      if (r.employee !== empName || r.status === 'rejected') continue
      const clipped = clipRangeToMonth(r.from, r.to, y, m)
      if (!clipped) continue
      const cat = teamAbsenceCategory(r.type)
      if (teamFilter.value !== 'all' && cat !== teamFilter.value) continue
      const startDay = parseInt(clipped.a.split('-')[2], 10)
      const endDay = parseInt(clipped.b.split('-')[2], 10)
      const span = endDay - startDay + 1
      const leftPct = ((startDay - 1) / totalDays) * 100
      const widthPct = (span / totalDays) * 100
      const st = statusLabel[r.status] ?? r.status
      const lines = [r.type, st, `${fmtDate(r.from)} — ${fmtDate(r.to)}`, `${r.days} дн.`]
      if (teamSegPending(r.status)) lines.push('на согласовании')
      const tooltip = lines.join('\n')
      out.push({
        leftPct,
        widthPct,
        label: teamAbsenceShortLabel(r.type),
        pending: teamSegPending(r.status),
        class: teamSegClass(cat),
        tooltip,
        draft: false,
      })
    }

    /* Превью выбранных дат в форме заявки (только строка текущего пользователя, не в данных) */
    const dFrom = draftFrom.value
    const dTo = draftTo.value
    const dType = draftType.value || 'Ежегодный'
    if (
      empName === currentUser.value.name &&
      dFrom &&
      dTo &&
      dFrom <= dTo
    ) {
      const catDraft = teamAbsenceCategory(dType)
      if (teamFilter.value === 'all' || catDraft === teamFilter.value) {
        const clipped = clipRangeToMonth(dFrom, dTo, y, m)
        if (clipped) {
          const startDay = parseInt(clipped.a.split('-')[2], 10)
          const endDay = parseInt(clipped.b.split('-')[2], 10)
          const span = endDay - startDay + 1
          const leftPct = ((startDay - 1) / totalDays) * 100
          const widthPct = (span / totalDays) * 100
          const lines = [
            'План заявки (не отправлено)',
            dType,
            `${fmtDate(dFrom)} — ${fmtDate(dTo)}`,
            `${span} дн.`,
          ]
          out.push({
            leftPct,
            widthPct,
            label: 'План',
            pending: false,
            class: 'team-seg--draft',
            tooltip: lines.join('\n'),
            draft: true,
          })
        }
      }
    }

    return out
  }

  function colleagueInitials(name) {
    const p = name.split(/\s+/).filter(Boolean)
    if (p.length >= 2) return (p[0][0] + p[1][0]).toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }

  const teamFilterCounts = computed(() => {
    const y = teamCalYear.value
    const m = teamCalMonth.value
    const pad = n => String(n).padStart(2, '0')
    const lastDay = new Date(y, m + 1, 0).getDate()
    const monthStart = `${y}-${pad(m + 1)}-01`
    const monthEnd = `${y}-${pad(m + 1)}-${pad(lastDay)}`
    const counts = { vacation: 0, sick: 0, trip: 0, remote: 0 }
    for (const r of allRequests.value) {
      if (r.status === 'rejected') continue
      if (r.from > monthEnd || r.to < monthStart) continue
      const cat = teamAbsenceCategory(r.type)
      if (Object.prototype.hasOwnProperty.call(counts, cat)) counts[cat]++
    }
    return counts
  })

  const teamFilterMonthTotal = computed(() => {
    const c = teamFilterCounts.value
    return c.vacation + c.sick + c.trip + c.remote
  })

  const teamFilterOptions = computed(() => {
    const c = teamFilterCounts.value
    const t = teamFilterMonthTotal.value
    return [
      { value: 'all', label: `Все (${t})` },
      { value: 'vacation', label: `Отпуск (${c.vacation})` },
      { value: 'sick', label: `Больничный (${c.sick})` },
      { value: 'trip', label: `Командировка (${c.trip})` },
      { value: 'remote', label: `Удалённо (${c.remote})` },
    ]
  })

  const teamGroupSelectOptions = computed(() => {
    if (!myTeams.value.length) {
      return [{ value: 'dept', label: 'Нет команд', disabled: true }]
    }
    return myTeams.value.map(tm => ({ value: tm.id, label: tm.name }))
  })

  const teamConflictDates = computed(() => {
    const pool = teamColleaguesFiltered.value
    const y = teamCalYear.value
    const m = teamCalMonth.value
    const pad = n => String(n).padStart(2, '0')
    const dayCounts = {}
    for (const emp of pool) {
      for (const r of allRequests.value) {
        if (r.employee !== emp.name || r.status === 'rejected') continue
        const clipped = clipRangeToMonth(r.from, r.to, y, m)
        if (!clipped) continue
        if (teamFilter.value !== 'all' && teamAbsenceCategory(r.type) !== teamFilter.value) continue
        const startD = parseInt(clipped.a.split('-')[2], 10)
        const endD = parseInt(clipped.b.split('-')[2], 10)
        for (let d = startD; d <= endD; d++) {
          const iso = `${y}-${pad(m + 1)}-${pad(d)}`
          dayCounts[iso] = (dayCounts[iso] ?? 0) + 1
        }
      }
    }
    return new Set(Object.keys(dayCounts).filter(k => dayCounts[k] >= 2))
  })

  return {
    COLLEAGUES,
    currentUser,
    teamCalYear,
    teamCalMonth,
    teamSearchQuery,
    teamFilter,
    teamSubTab,
    showTeamListModal,
    myTeams,
    activeGroupKey,
    showTeamModal,
    editingTeam,
    teamModalName,
    teamModalMembers,
    activeTeam,
    teamSubTabCount,
    openCreateTeam,
    openEditTeam,
    saveTeamModal,
    deleteTeam,
    toggleTeamMember,
    teamMonthTitle,
    prevTeamMonth,
    nextTeamMonth,
    goTeamToday,
    syncTeamCalendarToIso,
    teamMonthDays,
    teamTimelineMinWidth,
    teamColleaguesFiltered,
    teamCalRowsOrdered,
    getTeamSegments,
    colleagueInitials,
    teamFilterOptions,
    teamGroupSelectOptions,
    teamConflictDates,
  }
}
