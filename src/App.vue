<script setup>
import { ref, computed, provide, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute, useRouter, RouterLink, RouterView } from 'vue-router'
import {
  PanelLeftClose, Search, Bell, Home,
  LayoutDashboard, Palmtree, MoreHorizontal,
  UserCircle, CalendarCheck, Banknote,
  Users, FileBarChart2, Building2, UserCog, Settings, ListChecks, UserPlus,
  ListTodo,
} from 'lucide-vue-next'
import { UiIconButton, UiButton } from '@/components/ui'
import { getRecruitingVacancyById } from '@/data/recruitingDashboardDemo.js'
import { getRecruitingCandidateById } from '@/data/recruitingCandidatesDemo.js'
import { resolveTaskById } from '@/composables/useTasks.js'
import brandLogo from '@/assets/logo.svg'

/** Demo: переключатель ролей в сайдбаре (в проде — из сессии) */
const roles = [
  { id: 'staff', label: 'Сотр.', title: 'Сотрудник' },
  { id: 'hr', label: 'HR', title: 'HR' },
  { id: 'manager', label: 'Рук.', title: 'Руководитель' },
  { id: 'admin', label: 'Адм.', title: 'Администратор' },
]
const activeRole = ref('staff')

/**
 * Демо: при переключении роли в сайдбаре меняется «вошедший» пользователь.
 * В проде роль и пользователь приходят из сессии независимо; здесь — 1:1 для удобства демо.
 */
const ROLE_SESSION_USERS = {
  staff:   { name: 'Мирзо Бедил',       initials: 'МБ', isTopLevel: true },
  manager: { name: 'Руслан Камолов',    initials: 'РК', isTopLevel: true },
  hr:      { name: 'Зарина Хасанова',   initials: 'ЗХ', isTopLevel: false },
  admin:   { name: 'Дилноза Атаева',    initials: 'ДА', isTopLevel: true },
}

const sessionUser = computed(
  () => ROLE_SESSION_USERS[activeRole.value] || ROLE_SESSION_USERS.staff,
)

provide('activeRole', activeRole)
provide('sessionUser', sessionUser)

const route  = useRoute()
const router = useRouter()

const isTasksFullPage = computed(() => route.meta.tasksFullPage === true)
const isFullWidthPage = computed(() => route.meta.fullWidth === true)

/** Сброс горизонтального скролла области контента (иначе после широких страниц контент «уезжает» вправо). */
const mainScrollRef = ref(null)
router.afterEach(() => {
  nextTick(() => {
    const el = mainScrollRef.value
    if (!el) return
    el.scrollLeft = 0
    el.scrollTop = 0
  })
})

/** Общие пункты (все роли) и дополнительные по роли — группы в сайдбаре с заголовками */
const navByRole = {
  staff: {
    general: [
      { name: 'Главная',         to: '/',              icon: LayoutDashboard },
      { name: 'Задачи',          to: '/tasks',         icon: ListTodo        },
      { name: 'Мой профиль',     to: '/profile',       icon: UserCircle      },
      { name: 'Отпуска',         to: '/vacations',     icon: Palmtree        },
      { name: 'Посещаемость',    to: '/attendance',    icon: CalendarCheck   },
      { name: 'Зарплата',        to: '/salary',        icon: Banknote        },
    ],
    role: [],
  },
  manager: {
    general: [
      { name: 'Главная',         to: '/',                      icon: LayoutDashboard },
      { name: 'Задачи',          to: '/tasks',                 icon: ListTodo        },
      { name: 'Мой профиль',     to: '/profile',               icon: UserCircle      },
      { name: 'Отпуска',         to: '/vacations',             icon: Palmtree        },
      { name: 'Посещаемость',    to: '/attendance',            icon: CalendarCheck   },
      { name: 'Зарплата',        to: '/salary',                icon: Banknote        },
    ],
    role: [
      { name: 'Согласования',    to: '/vacations/approvals',   icon: ListChecks      },
    ],
  },
  hr: {
    general: [
      { name: 'Главная',         to: '/',                      icon: LayoutDashboard },
      { name: 'Задачи',          to: '/tasks',                 icon: ListTodo        },
      { name: 'Мой профиль',     to: '/profile',               icon: UserCircle      },
      { name: 'Отпуска',         to: '/vacations',             icon: Palmtree        },
      { name: 'Посещаемость',    to: '/attendance',            icon: CalendarCheck   },
      { name: 'Зарплата',        to: '/salary',                icon: Banknote        },
    ],
    role: [
      { name: 'Сотрудники',      to: '/employees',             icon: Users           },
      { name: 'Рекрутинг',       to: '/recruiting',            icon: UserPlus        },
      { name: 'Согласования',    to: '/vacations/approvals',   icon: ListChecks      },
      { name: 'Отчёты',          to: '/reports',               icon: FileBarChart2   },
    ],
  },
  admin: {
    general: [
      { name: 'Главная',         to: '/',                      icon: LayoutDashboard },
      { name: 'Задачи',          to: '/tasks',                 icon: ListTodo        },
      { name: 'Мой профиль',     to: '/profile',               icon: UserCircle      },
      { name: 'Отпуска',         to: '/vacations',             icon: Palmtree        },
      { name: 'Посещаемость',    to: '/attendance',            icon: CalendarCheck   },
      { name: 'Зарплата',        to: '/salary',                icon: Banknote        },
    ],
    role: [
      { name: 'Сотрудники',      to: '/employees',             icon: Users           },
      { name: 'Рекрутинг',       to: '/recruiting',            icon: UserPlus        },
      { name: 'Согласования',    to: '/vacations/approvals',   icon: ListChecks      },
      { name: 'Отчёты',          to: '/reports',               icon: FileBarChart2   },
      { name: 'Структура',       to: '/structure',             icon: Building2       },
      { name: 'Пользователи',    to: '/users',                 icon: UserCog         },
      { name: 'Настройки',       to: '/settings',              icon: Settings        },
    ],
  },
}

const navGeneral = computed(() => navByRole[activeRole.value].general)
const navRole = computed(() => navByRole[activeRole.value].role)
const showNavRoleItems = computed(() => navRole.value.length > 0)

const allPages = [...new Map(
  Object.values(navByRole).flatMap(block => [...block.general, ...block.role].map(i => [i.to, i]))
).values()]

const currentPage = computed(() => {
  const block = navByRole[activeRole.value]
  const flat = [...block.general, ...block.role]
  const exact = flat.find(i => i.to === route.path)
  if (exact) return exact
  const meta = route.meta
  if (route.name === 'recruiting-hiring-request' && meta?.parent) {
    return {
      name: meta.title ?? 'Создание заявки',
      to: route.path,
      parents: [
        { name: 'Рекрутинг', to: '/recruiting' },
        { name: 'Вакансии', to: { path: '/recruiting', query: { tab: 'vacancies' } } },
      ],
    }
  }
  if (route.name === 'recruiting-vacancy' && route.params.id && meta?.parent) {
    const vac = getRecruitingVacancyById(String(route.params.id))
    return {
      name: vac?.title ?? meta.title ?? 'Вакансия',
      to: route.path,
      parents: [
        { name: 'Рекрутинг', to: '/recruiting' },
        { name: 'Вакансии', to: { path: '/recruiting', query: { tab: 'vacancies' } } },
      ],
    }
  }
  if (route.name === 'recruiting-candidate' && route.params.id && meta?.parent) {
    const cand = getRecruitingCandidateById(String(route.params.id))
    const vacId = route.query.vacancy != null && route.query.vacancy !== '' ? String(route.query.vacancy) : null
    const vacFromQuery = vacId ? getRecruitingVacancyById(vacId) : null
    if (vacId && vacFromQuery) {
      return {
        name: cand?.name ?? meta.title ?? 'Кандидат',
        to: route.path,
        parents: [
          { name: 'Рекрутинг', to: '/recruiting' },
          { name: vacFromQuery.title, to: { name: 'recruiting-vacancy', params: { id: vacId } } },
        ],
      }
    }
    return {
      name: cand?.name ?? meta.title ?? 'Кандидат',
      to: route.path,
      parents: [
        { name: 'Рекрутинг', to: '/recruiting' },
        { name: 'Кандидаты', to: { path: '/recruiting', query: { tab: 'candidates' } } },
      ],
    }
  }
  if (route.name === 'task-detail' && route.params.id && meta?.parent) {
    const task = resolveTaskById(route.params.id)
    return {
      name: task?.title ?? meta.title ?? 'Задача',
      to: route.path,
      parent: meta.parent,
    }
  }
  if (meta?.parent) return { name: meta.title || 'Страница', to: route.path, parent: meta.parent }
  return flat[0]
})

/** Цепочка ссылок перед заголовком страницы (один `parent` или несколько `parents`). */
const breadcrumbAncestors = computed(() => {
  const cp = currentPage.value
  if (cp.parents?.length) return cp.parents
  if (cp.parent) return [cp.parent]
  return []
})

const taskDetailTask = computed(() =>
  route.name === 'task-detail' && route.params.id
    ? resolveTaskById(route.params.id)
    : null,
)

const showTaskCompleteInHeader = computed(
  () => taskDetailTask.value && taskDetailTask.value.status !== 'done',
)

function completeTaskFromHeader() {
  const t = taskDetailTask.value
  if (t) t.status = 'done'
}

// ── Notifications ────────────────────────────────────────────────────────
const allNotifications = ref([
  {
    id: 1,
    title: 'Новая заявка на рассмотрение',
    body: 'Сардор Тошматов — 20.04–22.04 · 3 дн.',
    time: new Date(Date.now() - 8 * 60000),
    read: false,
    roles: ['manager', 'hr', 'admin'],
    requestId: 2,
    cta: 'Рассмотреть',
    ctaAction: 'approve',
  },
  {
    id: 2,
    title: 'Заявка ожидает подтверждения HR',
    body: 'Нилуфар Юсупова — 05.05–16.05 · 12 дн.',
    time: new Date(Date.now() - 25 * 60000),
    read: false,
    roles: ['hr', 'admin'],
    requestId: 3,
    cta: 'Подтвердить',
    ctaAction: 'hr_confirm',
  },
  {
    id: 3,
    title: 'Заявка одобрена руководителем',
    body: 'Ваш отпуск 15.04–23.04 передан на подтверждение HR',
    time: new Date(Date.now() - 60 * 60000),
    read: false,
    roles: ['staff'],
    requestId: 1,
    cta: null,
  },
])

const notifications = computed(() =>
  allNotifications.value.filter(n => n.roles.includes(activeRole.value))
)
const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)

function addNotification(notif) {
  allNotifications.value.unshift({ id: Date.now(), read: false, time: new Date(), ...notif })
}
function markRead(id) {
  const n = allNotifications.value.find(n => n.id === id)
  if (n) n.read = true
}
function markAllRead() {
  allNotifications.value
    .filter(n => n.roles.includes(activeRole.value))
    .forEach(n => (n.read = true))
}
function fmtTime(date) {
  const diff = Math.floor((Date.now() - date) / 60000)
  if (diff < 1) return 'только что'
  if (diff < 60) return `${diff} мин. назад`
  const h = Math.floor(diff / 60)
  if (h < 24) return `${h} ч. назад`
  return `${Math.floor(h / 24)} дн. назад`
}

provide('addNotification', addNotification)

const pendingOpen = ref(null)
provide('pendingOpen', pendingOpen)

// Bell dropdown
const notifOpen = ref(false)
const notifRef  = ref(null)

function toggleNotif() { notifOpen.value = !notifOpen.value }

function handleNotifCta(notif) {
  markRead(notif.id)
  notifOpen.value = false
  pendingOpen.value = { id: notif.requestId, action: notif.ctaAction }
  const approvals = ['manager', 'hr', 'admin'].includes(activeRole.value)
  router.push(approvals ? '/vacations/approvals' : '/vacations')
}

function onClickOutside(e) {
  if (notifRef.value && !notifRef.value.contains(e.target)) notifOpen.value = false
}
onMounted(() => document.addEventListener('mousedown', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('mousedown', onClickOutside))
</script>

<template>
  <div class="layout">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-top">
        <RouterLink class="sidebar-brand" to="/" title="На главную" aria-label="На главную">
          <img
            class="sidebar-brand-img"
            :src="brandLogo"
            alt=""
            width="194"
            height="48"
            decoding="async"
          />
        </RouterLink>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section">
          <div class="nav-section-title">Основное</div>
          <RouterLink
            v-for="item in navGeneral"
            :key="`g-${item.to}-${item.name}`"
            :to="item.to"
            class="nav-item"
            :class="{ active: route.path === item.to }"
          >
            <component :is="item.icon" :size="15" stroke-width="1.5" />
            {{ item.name }}
          </RouterLink>
        </div>
        <div v-if="showNavRoleItems" class="nav-section">
          <div class="nav-section-title">По роли</div>
          <RouterLink
            v-for="item in navRole"
            :key="`r-${item.to}-${item.name}`"
            :to="item.to"
            class="nav-item"
            :class="{ active: route.path === item.to }"
          >
            <component :is="item.icon" :size="15" stroke-width="1.5" />
            {{ item.name }}
          </RouterLink>
        </div>
      </nav>


      <div class="sidebar-spacer"></div>

      <div class="role-tabs">
        <button
          v-for="role in roles"
          :key="role.id"
          type="button"
          class="role-tab"
          :class="{ active: activeRole === role.id }"
          :title="role.title"
          @click="activeRole = role.id"
        >{{ role.label }}</button>
      </div>

      <div class="sidebar-footer">
        <div class="user-info">
          <div class="avatar">{{ sessionUser.initials }}</div>
          <div class="user-text">
            <span class="user-name">{{ sessionUser.name }}</span>
            <span class="user-plan">Бесплатно</span>
          </div>
        </div>
        <div class="footer-actions">
          <UiIconButton type="button" aria-label="Ещё"><MoreHorizontal :size="14" stroke-width="1.5" /></UiIconButton>
        </div>
      </div>
    </aside>

    <!-- Main -->
    <main class="main">
      <header class="navbar">
        <div class="navbar-left">
          <UiIconButton type="button" aria-label="Свернуть панель">
            <PanelLeftClose :size="16" stroke-width="1.5" />
          </UiIconButton>
          <button class="search-btn">
            <Search :size="14" stroke-width="1.5" />
            <span>Поиск...</span>
          </button>
        </div>
        <div class="navbar-right">
          <div class="notif-wrapper" ref="notifRef">
            <UiIconButton type="button" class="notif-btn" aria-label="Уведомления" @click.stop="toggleNotif">
              <Bell :size="16" stroke-width="1.5" />
              <span v-if="unreadCount > 0" class="notif-badge">{{ unreadCount }}</span>
            </UiIconButton>
            <Transition name="notif-drop">
              <div v-if="notifOpen" class="notif-panel">
                <div class="notif-panel-header">
                  <span class="notif-panel-title">Уведомления</span>
                  <button v-if="unreadCount > 0" class="notif-mark-all" @click="markAllRead">
                    Прочитать все
                  </button>
                </div>
                <div class="notif-list">
                  <div v-if="notifications.length === 0" class="notif-empty">
                    Нет уведомлений
                  </div>
                  <div
                    v-for="n in notifications"
                    :key="n.id"
                    :class="['notif-item', { unread: !n.read }]"
                    @click="markRead(n.id)"
                  >
                    <div class="notif-item-content">
                      <div class="notif-item-title">{{ n.title }}</div>
                      <div class="notif-item-body">{{ n.body }}</div>
                      <div class="notif-item-time">{{ fmtTime(n.time) }}</div>
                    </div>
                    <button v-if="n.cta" class="notif-cta" @click.stop="handleNotifCta(n)">
                      {{ n.cta }}
                    </button>
                  </div>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </header>

      <div ref="mainScrollRef" class="main-scroll">
        <div v-if="!isTasksFullPage" class="page-header">
          <div class="page-header-inner" id="page-header-inner">
            <div class="page-header-left">
              <nav class="breadcrumb">
                <Home :size="12" stroke-width="1.5" class="breadcrumb-home" />
                <span class="breadcrumb-sep">/</span>
                <template v-for="(seg, idx) in breadcrumbAncestors" :key="idx">
                  <RouterLink :to="seg.to" class="breadcrumb-item breadcrumb-link">{{ seg.name }}</RouterLink>
                  <span class="breadcrumb-sep">/</span>
                </template>
                <span class="breadcrumb-item active">{{ currentPage.name }}</span>
              </nav>
              <h1 class="page-title">{{ currentPage.name }}</h1>
            </div>
            <div v-if="showTaskCompleteInHeader" class="page-header-actions">
              <UiButton
                type="button"
                variant="primary"
                class="page-header-task-complete"
                @click="completeTaskFromHeader"
              >
                Завершить
              </UiButton>
            </div>
          </div>
        </div>

        <div class="main-content" :class="{ 'main-content--tasks-full': isTasksFullPage }">
          <div class="page-wrapper" :class="{ 'page-wrapper--full': isFullWidthPage }">
            <RouterView />
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
/* Bitta scroll: faqat .main-scroll; body/html ichkarida emas */
html {
  height: 100%;
  overflow: hidden;
}
body {
  height: 100%;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #f5f5f5;
  color: #1a1a1a;
}
#app {
  height: 100%;
  max-height: 100%;
  min-width: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Кнопки: src/assets/ui-buttons.css + UiButton / UiIconButton */
/* Поля ввода: src/assets/ui-fields.css + UiInput / UiSelect / UiDateRangeInput / UiTextarea / UiSearchField */
</style>

<style scoped>
.layout {
  display: flex;
  flex: 1;
  min-height: 0;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
}

/* ── Sidebar ── */
.sidebar {
  width: 280px;
  min-width: 280px;
  background: #ebebeb;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #d8d8d8;
  padding: 10px 0;
}

.sidebar-top {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px 10px 8px;
  min-height: 34px;
}

.sidebar-brand {
  display: block;
  min-width: 0;
  text-decoration: none;
  user-select: none;
}

.sidebar-brand-img {
  display: block;
  height: 26px;
  width: auto;
  max-width: 100%;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  padding: 4px 8px;
  gap: 1px;
}

.nav-section {
  display: flex;
  flex-direction: column;
  gap: 1px;
  margin-bottom: 10px;
}
.nav-section:last-child {
  margin-bottom: 0;
}
.nav-section-title {
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #888;
  padding: 5px 10px 3px;
  line-height: 1.15;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 6px 10px;
  border-radius: 6px;
  text-decoration: none;
  color: #555;
  font-size: 13px;
  font-weight: 450;
  transition: background 0.15s;
}
.nav-item:hover  { background: #e0e0e0; color: #1a1a1a; }
.nav-item.active { background: #e0e0e0; color: #1a1a1a; }

.sidebar-spacer { flex: 1; }

/* Role tabs */
.role-tabs {
  display: flex;
  margin: 0 8px 8px;
  background: #e0e0e0;
  border-radius: 7px;
  padding: 3px;
  gap: 2px;
}
.role-tab {
  flex: 1;
  min-width: 0;
  background: none;
  border: none;
  padding: 5px 4px;
  border-radius: 5px;
  font-size: 10.5px;
  font-family: inherit;
  color: #888;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  line-height: 1.2;
}
.role-tab:hover { color: #555; }
.role-tab.active {
  background: #fff;
  color: #1a1a1a;
  font-weight: 500;
  box-shadow: 0 1px 2px rgba(0,0,0,0.08);
}

/* Footer */
.sidebar-footer {
  padding: 8px 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.user-info { display: flex; align-items: center; gap: 9px; }
.avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #bbb;
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}
.user-text { display: flex; flex-direction: column; }
.user-name { font-size: 12.5px; font-weight: 500; color: #222; line-height: 1.3; }
.user-plan { font-size: 11px; color: #888; line-height: 1.3; }
.footer-actions { display: flex; gap: 2px; }

/* ── Main ── */
.main {
  flex: 1 1 0%;
  min-width: 0;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 48px;
  background: #f5f5f5;
  border-bottom: 1px solid #e2e2e2;
  flex-shrink: 0;
}
.navbar-left  { display: flex; align-items: center; gap: 8px; }
.navbar-right { display: flex; align-items: center; gap: 8px; }

.search-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 7px;
  padding: 5px 12px;
  color: #999;
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  width: 200px;
  transition: border-color 0.15s, color 0.15s;
}
.search-btn:hover { border-color: #ccc; color: #777; }

.main-scroll {
  flex: 1 1 0%;
  min-height: 0;
  min-width: 0;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior-x: none;
}

.page-header {
  padding: 20px 24px 0;
  display: flex;
  justify-content: center;
  min-width: 0;
  box-sizing: border-box;
}
.page-header-inner {
  width: 100%;
  max-width: 1080px;
  min-width: 0;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}
.page-header-left {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.page-header-actions {
  flex-shrink: 0;
  padding-bottom: 2px;
}

.page-header-task-complete {
  flex-shrink: 0;
}

.breadcrumb { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }
.breadcrumb-home { color: #999; }
.breadcrumb-sep  { font-size: 12px; color: #ccc; }
.breadcrumb-item { font-size: 12.5px; color: #999; }
.breadcrumb-item.active { color: #555; }
.breadcrumb-link {
  color: #5b8ef0;
  text-decoration: none;
  cursor: pointer;
}
.breadcrumb-link:hover { text-decoration: underline; }

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
  letter-spacing: -0.3px;
  min-width: 0;
}

.main-content {
  padding: 24px 24px 64px;
  display: flex;
  justify-content: center;
  min-width: 0;
  box-sizing: border-box;
}

.page-wrapper {
  width: 100%;
  max-width: 1080px;
  min-width: 0;
}

.page-wrapper--full {
  max-width: none;
}

.main-content--tasks-full {
  padding-top: 0;
}

/* ── Notifications ── */
.notif-wrapper { position: relative; }
.notif-btn     { position: relative; }

.notif-badge {
  position: absolute;
  top: 1px;
  right: 1px;
  background: #ef4444;
  color: #fff;
  font-size: 9px;
  font-weight: 700;
  min-width: 14px;
  height: 14px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 3px;
  pointer-events: none;
  line-height: 1;
}

.notif-panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 320px;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  box-shadow: 0 8px 28px rgba(0,0,0,0.13);
  z-index: 300;
  overflow: hidden;
}

.notif-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 16px 10px;
  border-bottom: 1px solid #f0f0f0;
}
.notif-panel-title {
  font-size: 13px;
  font-weight: 600;
  color: #1a1a1a;
}
.notif-mark-all {
  background: none;
  border: none;
  font-size: 11.5px;
  color: #999;
  cursor: pointer;
  font-family: inherit;
  padding: 0;
}
.notif-mark-all:hover { color: #555; }

.notif-list {
  max-height: 360px;
  overflow-y: auto;
}
.notif-empty {
  padding: 28px 16px;
  text-align: center;
  color: #ccc;
  font-size: 13px;
}

.notif-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 16px;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  transition: background 0.12s;
}
.notif-item:last-child { border-bottom: none; }
.notif-item:hover { background: #fafafa; }
.notif-item.unread { background: #f6f7ff; border-left: 2px solid #818cf8; }
.notif-item.unread:hover { background: #eff0ff; }

.notif-item-content { flex: 1; min-width: 0; }
.notif-item-title {
  font-size: 12.5px;
  font-weight: 500;
  color: #1a1a1a;
  margin-bottom: 2px;
}
.notif-item-body {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.notif-item-time { font-size: 11px; color: #bbb; }

.notif-cta {
  flex-shrink: 0;
  background: #1a1a1a;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 5px 11px;
  font-size: 11.5px;
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s;
}
.notif-cta:hover { background: #333; }

.notif-drop-enter-active,
.notif-drop-leave-active { transition: opacity 0.15s, transform 0.15s; }
.notif-drop-enter-from,
.notif-drop-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
