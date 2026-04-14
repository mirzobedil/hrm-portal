<script setup>
import { inject, computed, onMounted, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { AlertCircle, ChevronRight } from 'lucide-vue-next'
import StatusBadge from '@/components/StatusBadge.vue'
import { STATUS_LABELS } from '@/constants/vacation.js'
import {
  EMPLOYEE_DATA,
  filterRequestsActiveOnDate,
  localDateIso,
  formatIsoDateRu,
  dashboardManagerPendingRows,
  dashboardHrConfirmRows,
  dashboardTeamScheduleAprMay,
  dashboardHrUpcomingRows,
} from '@/data/vacationRequests'
import { useVacationRequests } from '@/composables/useVacationRequests'

const { allRequests } = useVacationRequests()

const activeRole  = inject('activeRole')
const sessionUser = inject('sessionUser')
const router      = useRouter()
const route       = useRoute()

function goApprovals() {
  router.push({ name: 'vacations-approvals' })
}

function focusHrTodaySummary() {
  nextTick(() => {
    document.getElementById('hr-absences-today')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

function scrollIfHashHrToday() {
  if (route.hash === '#hr-absences-today') {
    nextTick(() => {
      document.getElementById('hr-absences-today')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }
}
onMounted(scrollIfHashHrToday)
watch(() => route.hash, scrollIfHashHrToday)

// ── STAFF: те же заявки, что в /vacations (единый реестр) ─────────────────
const staffBalance = computed(() => {
  const b = EMPLOYEE_DATA[sessionUser.value.name]?.balance
  return b ? { total: b.total, used: b.used, planned: 0 } : { total: 28, used: 0, planned: 0 }
})
const staffRemaining = computed(
  () => staffBalance.value.total - staffBalance.value.used - staffBalance.value.planned,
)

const staffRequests = computed(() =>
  allRequests.value
    .filter(r => r.employee === sessionUser.value.name)
    .sort((a, b) => b.from.localeCompare(a.from))
    .slice(0, 5)
    .map(r => ({
      id: r.id,
      type: r.type,
      from: formatIsoDateRu(r.from),
      to: formatIsoDateRu(r.to),
      days: r.days,
      status: r.status,
    })),
)

const staffEvents = [
  { label: 'Начало отпуска',    date: '15 апр',  daysLeft: 8,  color: 'green'  },
  { label: 'Конец отпуска',     date: '23 апр',  daysLeft: 16, color: 'green'  },
  { label: 'Следующая зарплата',date: '25 апр',  daysLeft: 18, color: 'blue'   },
]

// ── MANAGER / HR: очереди из того же реестра, что /vacations/approvals ────
const pendingApprovals = computed(() => dashboardManagerPendingRows(allRequests.value))

const teamSchedule = computed(() => dashboardTeamScheduleAprMay(allRequests.value))

function initials(name) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('')
}

const hrConfirmQueue = computed(() => dashboardHrConfirmRows(allRequests.value))

const upcomingVacations = computed(() => dashboardHrUpcomingRows(allRequests.value, { limit: 8 }))

const deptStats = [
  { dept: 'ИТ',       total: 42, onVacation: 2, pending: 2, coverage: 95 },
  { dept: 'HR',       total: 8,  onVacation: 0, pending: 1, coverage: 100},
  { dept: 'Финансы',  total: 15, onVacation: 1, pending: 1, coverage: 93 },
  { dept: 'Продажи',  total: 31, onVacation: 3, pending: 0, coverage: 90 },
  { dept: 'Операции', total: 22, onVacation: 1, pending: 0, coverage: 95 },
]

/** Сводка «сегодня в отпуске» по тем же заявкам, что и /vacations */
const hrTodayAbsences = computed(() =>
  filterRequestsActiveOnDate(allRequests.value, localDateIso()),
)
const hrTodayDateTitle = computed(() => {
  const d = new Date()
  return d.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
})

// ── ADMIN mock data ───────────────────────────────────────────────────────
const recentActivity = [
  { actor: 'Руслан Камолов',  action: 'одобрил заявку',     subject: 'Малика Рахимова',  time: '10 мин. назад', icon: 'approved'  },
  { actor: 'Зарина Хасанова', action: 'подтвердила приказ', subject: 'Mirzo Bedil',      time: '1 ч. назад',    icon: 'confirmed' },
  { actor: 'Сардор Тошматов', action: 'подал заявку',       subject: null,               time: '2 ч. назад',    icon: 'pending'   },
  { actor: 'Руслан Камолов',  action: 'отклонил заявку',    subject: 'Жасур Мирзаев',   time: '4 ч. назад',    icon: 'rejected'  },
  { actor: 'Зарина Хасанова', action: 'создала приказ',     subject: 'Нилуфар Юсупова', time: 'вчера',         icon: 'confirmed' },
]
</script>

<template>
  <div class="dashboard">

    <!-- ══════════════════════════════════════════════════════════════ STAFF -->
    <template v-if="activeRole === 'staff'">

      <!-- Stat cards -->
      <div class="stats-grid">
        <div class="card stat-card">
          <span class="stat-label">Остаток отпуска</span>
          <div class="stat-value green">{{ staffRemaining }}</div>
          <div class="stat-sub">дней из {{ staffBalance.total }}</div>
        </div>
        <div class="card stat-card">
          <span class="stat-label">Использовано</span>
          <div class="stat-value muted">{{ staffBalance.used }}</div>
          <div class="stat-sub">дней в этом году</div>
        </div>
        <div class="card stat-card">
          <span class="stat-label">Следующий отпуск</span>
          <div class="stat-value">15 апр</div>
          <div class="stat-sub">через 8 дней</div>
        </div>
        <div class="card stat-card">
          <span class="stat-label">Посещаемость</span>
          <div class="stat-value">98%</div>
          <div class="stat-sub">в этом месяце</div>
        </div>
      </div>

      <!-- Two-column row -->
      <div class="two-col">

        <!-- My requests -->
        <div class="card panel">
          <div class="panel-head">
            <span class="panel-title">Мои заявки</span>
            <button class="link-btn" @click="router.push('/vacations')">
              Все заявки <ChevronRight :size="13" stroke-width="2" />
            </button>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>Тип</th>
                <th>Период</th>
                <th class="align-right">Дней</th>
                <th class="align-right">Статус</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in staffRequests" :key="r.id">
                <td class="col-muted">{{ r.type }}</td>
                <td class="col-date">{{ r.from }} — {{ r.to }}</td>
                <td class="align-right col-muted">{{ r.days }}</td>
                <td class="align-right">
                  <StatusBadge :status="r.status" :label="STATUS_LABELS[r.status]" small />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Upcoming events -->
        <div class="card panel">
          <div class="panel-head">
            <span class="panel-title">Ближайшие события</span>
          </div>
          <div class="events-list">
            <div v-for="ev in staffEvents" :key="ev.label" class="event-row">
              <div :class="['event-dot', `dot-${ev.color}`]"></div>
              <div class="event-info">
                <div class="event-label">{{ ev.label }}</div>
                <div class="event-date">{{ ev.date }}</div>
              </div>
              <div class="event-days-left">через {{ ev.daysLeft }} дн.</div>
            </div>
          </div>

          <div class="balance-mini">
            <div class="bm-bar">
              <div class="bm-seg bm-used"    :style="{ flex: staffBalance.used    }"></div>
              <div class="bm-seg bm-remaining" :style="{ flex: staffRemaining       }"></div>
            </div>
            <div class="bm-labels">
              <span class="bm-label">{{ staffBalance.used }} исп.</span>
              <span class="bm-label green">{{ staffRemaining }} ост.</span>
            </div>
          </div>
        </div>

      </div>
    </template>

    <!-- ══════════════════════════════════════════════════════════ MANAGER -->
    <template v-else-if="activeRole === 'manager'">

      <div class="stats-grid">
        <div class="card stat-card" :class="{ 'stat-alert': pendingApprovals.length }">
          <span class="stat-label">Ждут вашего решения</span>
          <div class="stat-value" :class="pendingApprovals.length ? 'orange' : 'muted'">
            {{ pendingApprovals.length }}
          </div>
          <div class="stat-sub">
            {{ pendingApprovals.length ? 'заявки на согласование' : 'всё согласовано' }}
          </div>
        </div>
        <div class="card stat-card">
          <span class="stat-label">В отпуске сейчас</span>
          <div class="stat-value muted">0</div>
          <div class="stat-sub">из {{ teamSchedule.length }} чел. команды</div>
        </div>
        <div class="card stat-card">
          <span class="stat-label">Отпуска в апреле</span>
          <div class="stat-value">{{ teamSchedule.length }}</div>
          <div class="stat-sub">запланировано</div>
        </div>
        <div class="card stat-card">
          <span class="stat-label">Посещаемость команды</span>
          <div class="stat-value">95%</div>
          <div class="stat-sub">в этом месяце</div>
        </div>
      </div>

      <!-- Pending approvals -->
      <div v-if="pendingApprovals.length" class="card panel">
        <div class="panel-head">
          <div class="panel-title-row">
            <AlertCircle :size="15" stroke-width="2" class="panel-alert-icon" />
            <span class="panel-title">Ожидают вашего согласования</span>
          </div>
          <button class="link-btn" @click="router.push('/vacations/approvals')">
            Перейти <ChevronRight :size="13" stroke-width="2" />
          </button>
        </div>
        <div class="approval-queue">
          <div v-for="r in pendingApprovals" :key="r.id" class="approval-row">
            <div class="appr-avatar">{{ initials(r.name) }}</div>
            <div class="appr-info">
              <div class="appr-name">{{ r.name }}</div>
              <div class="appr-meta">{{ r.type }} · {{ r.from }} — {{ r.to }} · {{ r.days }} дн.</div>
            </div>
            <div class="appr-time">{{ r.submittedAgo }}</div>
            <button class="btn-review" @click="router.push('/vacations/approvals')">
              Рассмотреть
            </button>
          </div>
        </div>
      </div>

      <!-- Team schedule -->
      <div class="card panel">
        <div class="panel-head">
          <span class="panel-title">Отпуска команды — апрель/май</span>
          <button class="link-btn" @click="router.push('/vacations')">
            График <ChevronRight :size="13" stroke-width="2" />
          </button>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Сотрудник</th>
              <th>Период</th>
              <th class="align-right">Дней</th>
              <th class="align-right">Статус</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in teamSchedule" :key="r.name">
              <td>
                <div class="emp-cell">
                  <div class="emp-av-sm">{{ initials(r.name) }}</div>
                  <span class="col-name">{{ r.name }}</span>
                </div>
              </td>
              <td class="col-date">{{ r.from }} — {{ r.to }}</td>
              <td class="align-right col-muted">{{ r.days }}</td>
              <td class="align-right">
                <StatusBadge :status="r.status" :label="STATUS_LABELS[r.status]" small />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </template>

    <!-- ══════════════════════════════════════════════════════════════ HR -->
    <template v-else-if="activeRole === 'hr'">

      <div class="dash-hr-intro">
        <div class="dash-hr-intro-textblock">
          <h2 class="dash-hr-intro-title">Отпуска и отсутствия</h2>
          <p class="dash-hr-intro-desc">
            Здесь — краткая сводка: кто сегодня в отпуске и что требует внимания.
            Полный реестр заявок, фильтры и очереди согласования — на странице заявок.
          </p>
        </div>
        <div class="dash-hr-intro-actions">
          <button type="button" class="dash-hr-btn dash-hr-btn--primary" @click="goApprovals">
            Работа с заявками
            <ChevronRight :size="14" stroke-width="2" />
          </button>
          <button type="button" class="dash-hr-btn dash-hr-btn--secondary" @click="focusHrTodaySummary">
            Кто сегодня в отпуске
          </button>
        </div>
      </div>

      <div class="stats-grid dash-hr-stats">
        <div class="card stat-card">
          <span class="stat-label">Всего сотрудников</span>
          <div class="stat-value">248</div>
          <div class="stat-sub">+3 в этом месяце</div>
        </div>
        <button type="button" class="card stat-card stat-card--interactive" title="Прокрутить к списку ниже" @click="focusHrTodaySummary">
          <span class="stat-label">В отпуске сейчас</span>
          <div class="stat-value">{{ hrTodayAbsences.length }}</div>
          <div class="stat-sub">по заявкам на сегодня · список ниже</div>
        </button>
        <button type="button" class="card stat-card stat-card--interactive" :class="{ 'stat-alert': hrConfirmQueue.length }" title="Открыть страницу заявок" @click="goApprovals">
          <span class="stat-label">Ждут подтверждения HR</span>
          <div class="stat-value" :class="hrConfirmQueue.length ? 'orange' : 'muted'">
            {{ hrConfirmQueue.length }}
          </div>
          <div class="stat-sub">
            {{ hrConfirmQueue.length ? 'требуют действия' : 'очередь пуста' }}
          </div>
        </button>
        <button type="button" class="card stat-card stat-card--interactive" title="Открыть страницу заявок" @click="goApprovals">
          <span class="stat-label">Заявок в апреле</span>
          <div class="stat-value">14</div>
          <div class="stat-sub">5 одобрено · 2 отклонено</div>
        </button>
      </div>

      <!-- Детальная таблица «сегодня» только на главной (сводка HR) -->
      <div id="hr-absences-today" class="card panel dash-hr-today-panel">
        <div class="dash-hr-today-bar">
          <div class="dash-hr-today-bar-text">
            <span class="dash-hr-today-bar-title">Сегодня в отпуске и отсутствиях</span>
            <span class="dash-hr-today-bar-date">{{ hrTodayDateTitle }}</span>
          </div>
          <div class="dash-hr-today-bar-actions">
            <span class="dash-hr-today-pill">{{ hrTodayAbsences.length }}</span>
            <button type="button" class="link-btn" @click="goApprovals">
              Реестр и очереди <ChevronRight :size="13" stroke-width="2" />
            </button>
          </div>
        </div>
        <table v-if="hrTodayAbsences.length" class="data-table dash-hr-today-table">
          <thead>
            <tr>
              <th>Сотрудник</th>
              <th>Отдел</th>
              <th>Период</th>
              <th>Тип</th>
              <th class="align-right">Статус</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in hrTodayAbsences" :key="r.id">
              <td>
                <div class="dash-hr-today-namecell">
                  <span class="dash-hr-today-av">{{ initials(r.employee) }}</span>
                  <span class="dash-hr-today-nametext">{{ r.employee }}</span>
                </div>
              </td>
              <td class="col-muted">{{ EMPLOYEE_DATA[r.employee]?.dept ?? '—' }}</td>
              <td class="col-date">{{ formatIsoDateRu(r.from) }} — {{ formatIsoDateRu(r.to) }}</td>
              <td class="col-muted">{{ r.type }}</td>
              <td class="align-right">
                <StatusBadge :status="r.status" :label="STATUS_LABELS[r.status]" small />
              </td>
            </tr>
          </tbody>
        </table>
        <p v-else class="dash-hr-today-empty">На сегодня нет активных отсутствий по заявкам.</p>
      </div>

      <!-- HR confirmation queue -->
      <div v-if="hrConfirmQueue.length" class="card panel">
        <div class="panel-head">
          <div class="panel-title-row">
            <AlertCircle :size="15" stroke-width="2" class="panel-alert-icon" />
            <span class="panel-title">Требуют подтверждения HR</span>
          </div>
          <button class="link-btn" @click="router.push('/vacations/approvals')">
            Перейти <ChevronRight :size="13" stroke-width="2" />
          </button>
        </div>
        <div class="approval-queue">
          <div v-for="r in hrConfirmQueue" :key="r.id" class="approval-row">
            <div class="appr-avatar appr-avatar--hr">{{ initials(r.name) }}</div>
            <div class="appr-info">
              <div class="appr-name">{{ r.name }}</div>
              <div class="appr-meta">{{ r.dept }} · {{ r.from }} — {{ r.to }} · {{ r.days }} дн.</div>
              <div class="appr-chain">Одобрено: {{ r.manager }}</div>
            </div>
            <button class="btn-review btn-review--hr" @click="router.push('/vacations/approvals')">
              Подтвердить
            </button>
          </div>
        </div>
      </div>

      <!-- Two columns: upcoming + departments -->
      <div class="two-col">

        <div class="card panel">
          <div class="panel-head">
            <span class="panel-title">Ближайшие отпуска</span>
            <button class="link-btn" @click="router.push('/vacations')">
              Все <ChevronRight :size="13" stroke-width="2" />
            </button>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>Сотрудник</th>
                <th>Отдел</th>
                <th>Период</th>
                <th class="align-right">Статус</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in upcomingVacations" :key="r.id">
                <td class="col-name">{{ r.name }}</td>
                <td><span class="dept-tag">{{ r.dept }}</span></td>
                <td class="col-date">{{ r.from }} — {{ r.to }}</td>
                <td class="align-right">
                  <StatusBadge :status="r.status" :label="STATUS_LABELS[r.status]" small />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="card panel">
          <div class="panel-head">
            <span class="panel-title">По отделам</span>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>Отдел</th>
                <th class="align-right">Штат</th>
                <th class="align-right">В отпуске</th>
                <th class="align-right">Охват</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="d in deptStats" :key="d.dept">
                <td><span class="dept-tag">{{ d.dept }}</span></td>
                <td class="align-right col-muted">{{ d.total }}</td>
                <td class="align-right">
                  <span :class="d.onVacation > 2 ? 'col-orange' : 'col-muted'">{{ d.onVacation }}</span>
                </td>
                <td class="align-right">
                  <span :class="d.coverage >= 95 ? 'col-green' : d.coverage >= 90 ? 'col-muted' : 'col-orange'">
                    {{ d.coverage }}%
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </template>

    <!-- ══════════════════════════════════════════════════════════ ADMIN -->
    <template v-else>

      <div class="stats-grid">
        <div class="card stat-card">
          <span class="stat-label">Всего сотрудников</span>
          <div class="stat-value">248</div>
          <div class="stat-sub">+3 в этом месяце</div>
        </div>
        <div class="card stat-card">
          <span class="stat-label">В отпуске сейчас</span>
          <div class="stat-value">7</div>
          <div class="stat-sub">2.8% от штата</div>
        </div>
        <div class="card stat-card">
          <span class="stat-label">Ожидают действий</span>
          <div class="stat-value orange">3</div>
          <div class="stat-sub">согласования/приказы</div>
        </div>
        <div class="card stat-card">
          <span class="stat-label">Посещаемость</span>
          <div class="stat-value">94.3%</div>
          <div class="stat-sub">+1.2% к прошлому мес.</div>
        </div>
      </div>

      <div class="two-col">

        <!-- Dept breakdown -->
        <div class="card panel">
          <div class="panel-head">
            <span class="panel-title">Отделы</span>
            <button class="link-btn" @click="router.push('/structure')">
              Структура <ChevronRight :size="13" stroke-width="2" />
            </button>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>Отдел</th>
                <th class="align-right">Штат</th>
                <th class="align-right">В отпуске</th>
                <th class="align-right">Ожидают</th>
                <th class="align-right">Охват</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="d in deptStats" :key="d.dept">
                <td><span class="dept-tag">{{ d.dept }}</span></td>
                <td class="align-right col-muted">{{ d.total }}</td>
                <td class="align-right col-muted">{{ d.onVacation }}</td>
                <td class="align-right">
                  <span :class="d.pending ? 'col-orange' : 'col-muted'">{{ d.pending }}</span>
                </td>
                <td class="align-right">
                  <span :class="d.coverage >= 95 ? 'col-green' : d.coverage >= 90 ? 'col-muted' : 'col-orange'">
                    {{ d.coverage }}%
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Recent activity -->
        <div class="card panel">
          <div class="panel-head">
            <span class="panel-title">Последние действия</span>
          </div>
          <div class="activity-list">
            <div v-for="(a, i) in recentActivity" :key="i" class="activity-row">
              <div :class="['act-dot-sm', `dot-sm-${a.icon}`]"></div>
              <div class="act-text">
                <span class="act-actor">{{ a.actor }}</span>
                <span class="act-action"> {{ a.action }}</span>
                <span v-if="a.subject" class="act-subject"> {{ a.subject }}</span>
              </div>
              <div class="act-time-sm">{{ a.time }}</div>
            </div>
          </div>
        </div>

      </div>
    </template>

  </div>
</template>

<style scoped>
.dashboard { display: flex; flex-direction: column; gap: 20px; min-width: 0; }

/* ── HR: вводный блок (сводка vs страница заявок) ── */
.dash-hr-intro {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
  border-radius: 10px;
  border: 1px solid #e5e5e5;
  background: #fff;
}
.dash-hr-intro-textblock { flex: 1; min-width: 0; max-width: 640px; }
.dash-hr-intro-title {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  letter-spacing: -0.3px;
}
.dash-hr-intro-desc {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: #666;
}
.dash-hr-intro-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  flex-shrink: 0;
}
.dash-hr-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 14px;
  min-height: 36px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}
.dash-hr-btn--primary {
  border: none;
  background: #1a1a1a;
  color: #fff;
}
.dash-hr-btn--primary:hover { background: #333; }
.dash-hr-btn--secondary {
  border: 1px solid #e0e0e0;
  background: #fff;
  color: #333;
}
.dash-hr-btn--secondary:hover { background: #fafafa; border-color: #ccc; }

.dash-hr-stats .stat-card--interactive {
  text-align: left;
  cursor: pointer;
  font: inherit;
  color: inherit;
  appearance: none;
  width: 100%;
  transition: border-color 0.12s ease;
}
.dash-hr-stats .stat-card--interactive:hover {
  border-color: #ddd;
}

.card {
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 10px;
  padding: 18px 20px;
}

/* ── Stat cards (minimal) ── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}
.stats-grid > .card {
  padding: 12px 14px;
  border-radius: 8px;
  border-color: #ebebeb;
  background: #fff;
}
.stat-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}
.stat-label {
  font-size: 11px;
  color: #8a8a8a;
  font-weight: 500;
  letter-spacing: 0.01em;
  line-height: 1.3;
}
.stat-value {
  font-size: 20px;
  font-weight: 500;
  color: #1a1a1a;
  letter-spacing: -0.02em;
  line-height: 1.15;
}
.stat-value.green  { color: #3d9a6e; }
.stat-value.muted  { color: #b8b8b8; }
.stat-value.orange { color: #c98a18; }
.stat-sub {
  font-size: 11px;
  color: #9a9a9a;
  line-height: 1.35;
}
.stat-alert {
  border-color: #ebebeb;
  background: #fff;
  box-shadow: inset 3px 0 0 0 #e8c96a;
}

/* ── Two-column layout ── */
.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

/* ── Panel (card without padding) ── */
.panel { padding: 0; overflow: hidden; }
.panel-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 20px 12px;
  border-bottom: 1px solid #f5f5f5;
}
.panel-title     { font-size: 13px; font-weight: 500; color: #1a1a1a; }
.panel-title-row { display: flex; align-items: center; gap: 7px; }
.panel-alert-icon { color: #e8a020; }
#hr-absences-today { scroll-margin-top: 20px; }
.dash-hr-today-panel { padding: 0; overflow: hidden; }
.dash-hr-today-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 14px 20px 12px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
}
.dash-hr-today-bar-text {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px 14px;
  min-width: 0;
}
.dash-hr-today-bar-title {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
}
.dash-hr-today-bar-date {
  font-size: 12px;
  color: #999;
}
.dash-hr-today-bar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}
.dash-hr-today-pill {
  min-width: 28px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  text-align: center;
  background: #eef6f4;
  color: #1a7a6e;
}
.dash-hr-today-table { margin: 0; }
.dash-hr-today-namecell {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.dash-hr-today-av {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #eef2f7;
  color: #5c6bc0;
  font-size: 11px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.dash-hr-today-nametext {
  font-weight: 500;
  color: #1a1a1a;
}
.dash-hr-today-empty {
  padding: 16px 20px 18px;
  margin: 0;
  font-size: 13px;
  color: #888;
}

.link-btn {
  display: flex; align-items: center; gap: 2px;
  background: none; border: none; cursor: pointer;
  font-size: 12px; color: #888; font-family: inherit;
  padding: 3px 4px; border-radius: 5px;
  transition: color 0.15s, background 0.15s;
}
.link-btn:hover { color: #1a1a1a; background: #f5f5f5; }

/* ── Table ── */
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table thead tr { border-bottom: 1px solid #f0f0f0; }
.data-table th { padding: 10px 20px; font-size: 11.5px; font-weight: 500; color: #aaa; text-align: left; }
.data-table tbody tr { border-bottom: 1px solid #f5f5f5; transition: background 0.12s; }
.data-table tbody tr:last-child { border-bottom: none; }
.data-table tbody tr:hover { background: #fafafa; }
.data-table td { padding: 11px 20px; color: #444; }

.align-right { text-align: right; }
.col-name  { color: #222; font-weight: 450; }
.col-date  { color: #666; font-size: 12.5px; }
.col-muted { color: #aaa; }
.col-green { color: #4caf7d; font-weight: 500; }
.col-orange{ color: #e8a020; font-weight: 500; }
.dept-tag  { font-size: 11.5px; color: #5b8ef0; font-weight: 500; background: #ebf1fd; padding: 2px 7px; border-radius: 10px; }

/* ── Approval queue ── */
.approval-queue { display: flex; flex-direction: column; }
.approval-row {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 20px;
  border-bottom: 1px solid #f5f5f5;
  transition: background 0.12s;
}
.approval-row:last-child { border-bottom: none; }
.approval-row:hover { background: #fafafa; }

.appr-avatar {
  width: 32px; height: 32px; border-radius: 8px;
  background: #e8eaf6; color: #5c6bc0;
  font-size: 11.5px; font-weight: 600;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.appr-avatar--hr { background: #e6f7f4; color: #2ba896; }

.appr-info   { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.appr-name   { font-size: 13px; font-weight: 500; color: #1a1a1a; }
.appr-meta   { font-size: 11.5px; color: #aaa; }
.appr-chain  { font-size: 11px; color: #bbb; }
.appr-time   { font-size: 11.5px; color: #bbb; white-space: nowrap; }

.btn-review {
  box-sizing: border-box;
  min-height: 32px;
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #f4f0fb; color: #7c5cc4;
  border: 1px solid #ddd6f5;
  border-radius: 7px;
  font-size: 12px; font-family: inherit;
  cursor: pointer; white-space: nowrap;
  transition: background 0.15s;
  flex-shrink: 0;
}
.btn-review:hover { background: #ede8fb; }
.btn-review--hr   { background: #e6f7f4; color: #2ba896; border-color: #b2e8e2; }
.btn-review--hr:hover { background: #d3f2ee; }

/* ── Employee cell ── */
.emp-cell { display: flex; align-items: center; gap: 8px; }
.emp-av-sm {
  width: 28px; height: 28px; border-radius: 7px;
  background: #f0f0f0; color: #888;
  font-size: 10px; font-weight: 600;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

/* ── Staff events ── */
.events-list { display: flex; flex-direction: column; gap: 0; padding: 4px 20px 12px; }
.event-row {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #f5f5f5;
}
.event-row:last-child { border-bottom: none; }
.event-dot {
  width: 8px; height: 8px; border-radius: 50%;
  flex-shrink: 0;
}
.dot-green { background: #4caf7d; }
.dot-blue  { background: #5b8ef0; }
.event-info { flex: 1; display: flex; flex-direction: column; gap: 1px; }
.event-label { font-size: 12.5px; color: #444; }
.event-date  { font-size: 11.5px; color: #aaa; }
.event-days-left { font-size: 11.5px; color: #bbb; white-space: nowrap; }

/* ── Balance mini bar ── */
.balance-mini { padding: 14px 20px 16px; border-top: 1px solid #f5f5f5; }
.bm-bar {
  display: flex; height: 6px; border-radius: 4px; overflow: hidden; gap: 2px; margin-bottom: 6px;
}
.bm-seg { border-radius: 4px; }
.bm-used      { background: #ddd; }
.bm-remaining { background: #6fcf9a; }
.bm-labels    { display: flex; justify-content: space-between; }
.bm-label     { font-size: 11px; color: #bbb; }
.bm-label.green { color: #4caf7d; }

/* ── Activity list ── */
.activity-list { display: flex; flex-direction: column; padding: 4px 0; }
.activity-row {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 10px 20px;
  border-bottom: 1px solid #f5f5f5;
  transition: background 0.12s;
}
.activity-row:last-child { border-bottom: none; }
.activity-row:hover { background: #fafafa; }

.act-dot-sm {
  width: 8px; height: 8px; border-radius: 50%;
  flex-shrink: 0; margin-top: 5px;
}
.dot-sm-approved  { background: #4caf7d; }
.dot-sm-confirmed { background: #2ba896; }
.dot-sm-pending   { background: #e8a020; }
.dot-sm-rejected  { background: #e05a5a; }

.act-text    { flex: 1; font-size: 12.5px; line-height: 1.5; color: #555; }
.act-actor   { font-weight: 500; color: #1a1a1a; }
.act-action  { color: #666; }
.act-subject { color: #5b8ef0; }
.act-time-sm { font-size: 11px; color: #bbb; white-space: nowrap; margin-top: 3px; flex-shrink: 0; }
</style>
