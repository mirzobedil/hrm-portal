<script setup>
import { ref, computed, inject } from 'vue'
import {
  Phone, Mail, Copy, Pencil, Download, MoreVertical,
  Building2, Briefcase, Calendar, MapPin,
} from 'lucide-vue-next'
import { getProfileForUser } from '@/constants/profile'
import { UiPillTabs, UiPillTab } from '@/components/ui'

const sessionUser = inject('sessionUser')

const p = computed(() => getProfileForUser(sessionUser.value))

const activeTab = ref('general')

const tabs = [
  { id: 'general', label: 'Общие сведения' },
  { id: 'family', label: 'Состав семьи', badge: 7 },
  { id: 'tasks', label: 'Задачи', badge: 3 },
  { id: 'attendance', label: 'Присутствие' },
  { id: 'comp', label: 'Вознаграждение' },
  { id: 'career', label: 'Карьера' },
  { id: 'equipment', label: 'Оборудование' },
  { id: 'docs', label: 'Документы', badge: 8 },
]

function initialsAv(name) {
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

async function copyText(text) {
  if (!text || text === '—') return
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    /* ignore */
  }
}
</script>

<template>
  <div class="profile-page">
    <!-- Hero -->
    <div class="card profile-hero">
      <div class="hero-top">
        <div class="hero-avatar-block">
          <div class="hero-avatar" aria-hidden="true">{{ p.initials }}</div>
          <span class="hero-status">{{ p.statusLabel }}</span>
        </div>
        <div class="hero-center">
          <p class="hero-tab-num">Табельный номер: {{ p.tabNumber }}</p>
          <h2 class="hero-name">{{ p.fullName }}</h2>
          <p class="hero-position">{{ p.position }}</p>
          <div class="hero-inline-contact">
            <span class="hero-ic-line"><Phone :size="14" stroke-width="2" /> {{ p.workPhone }}</span>
            <span class="hero-ic-line"><Mail :size="14" stroke-width="2" /> {{ p.email }}</span>
          </div>
        </div>
        <div class="hero-actions">
          <button type="button" class="p-icon-btn" title="Скачать визитку" aria-label="Скачать">
            <Download :size="16" stroke-width="2" />
          </button>
          <button type="button" class="p-icon-btn" title="Ещё" aria-label="Меню">
            <MoreVertical :size="16" stroke-width="2" />
          </button>
        </div>
      </div>
      <div class="hero-summary">
        <div class="hero-sum-cell">
          <span class="hero-sum-label">Филиал</span>
          <span class="hero-sum-value">{{ p.branch }}</span>
        </div>
        <div class="hero-sum-cell">
          <span class="hero-sum-label">Руководитель</span>
          <span class="hero-sum-value hero-sum-link">{{ p.manager?.name }}</span>
        </div>
        <div class="hero-sum-cell">
          <span class="hero-sum-label">Подразделение</span>
          <span class="hero-sum-value">{{ p.dept }} · {{ p.subdept }}</span>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <UiPillTabs v-model="activeTab" class="profile-pill-tabs">
      <UiPillTab
        v-for="tab in tabs"
        :key="tab.id"
        :id="tab.id"
        :badge="tab.badge"
      >
        {{ tab.label }}
      </UiPillTab>
    </UiPillTabs>

    <div class="profile-layout">
      <!-- Main -->
      <div class="profile-main">
        <template v-if="activeTab === 'general'">
          <section class="card profile-block">
            <div class="block-head">
              <h3 class="block-title">Основное</h3>
              <button type="button" class="p-icon-btn p-icon-btn--sm" aria-label="Редактировать">
                <Pencil :size="14" stroke-width="2" />
              </button>
            </div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Статус</span>
                <span class="status-pill">{{ p.statusLabel }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Табельный номер</span>
                <span class="info-value mono">{{ p.tabNumber }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Филиал</span>
                <span class="info-value"><Building2 :size="13" class="info-ic" /> {{ p.branch }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Тип договора</span>
                <span class="info-value">{{ p.contractType }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Подразделение</span>
                <span class="info-value">{{ p.dept }} · {{ p.subdept }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Дирекция / направление</span>
                <span class="info-value">{{ p.directorate }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Внутренний телефон</span>
                <span class="info-value">{{ p.internalPhone }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Должность</span>
                <span class="info-value"><Briefcase :size="13" class="info-ic" /> {{ p.position }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Стаж в компании</span>
                <span class="info-value">{{ p.timeInCompany }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Дата приёма</span>
                <span class="info-value"><Calendar :size="13" class="info-ic" /> {{ p.hireDate }}</span>
              </div>
            </div>
          </section>

          <section class="card profile-block">
            <div class="block-head">
              <h3 class="block-title">Личные данные</h3>
              <button type="button" class="p-icon-btn p-icon-btn--sm" aria-label="Редактировать">
                <Pencil :size="14" stroke-width="2" />
              </button>
            </div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Фамилия</span>
                <span class="info-value">{{ p.lastName }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Имя</span>
                <span class="info-value">{{ p.firstName }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Отчество</span>
                <span class="info-value">{{ p.middleName }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Дата рождения</span>
                <span class="info-value">{{ p.birthDate }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Пол</span>
                <span class="info-value">{{ p.gender }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Возраст</span>
                <span class="info-value">{{ p.age }}</span>
              </div>
              <div class="info-item info-item--wide">
                <span class="info-label">ИНН / документ</span>
                <span class="info-value mono flex-row">
                  {{ p.idNumber }}
                  <button type="button" class="p-icon-btn p-icon-btn--sm" title="Копировать" @click="copyText(p.idNumber)">
                    <Copy :size="13" stroke-width="2" />
                  </button>
                </span>
              </div>
            </div>
          </section>

          <section class="card profile-block">
            <div class="block-head">
              <h3 class="block-title">Контакты</h3>
              <button type="button" class="p-icon-btn p-icon-btn--sm" aria-label="Редактировать">
                <Pencil :size="14" stroke-width="2" />
              </button>
            </div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Рабочий телефон</span>
                <span class="info-value">{{ p.workPhone }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Мобильный</span>
                <span class="info-value">{{ p.mobile }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Корпоративная почта</span>
                <span class="info-value break-all">{{ p.email }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Личная почта</span>
                <span class="info-value break-all">{{ p.personalEmail }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Место работы</span>
                <span class="info-value"><MapPin :size="13" class="info-ic" /> {{ p.workplace }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Telegram</span>
                <span class="info-value flex-row">
                  {{ p.telegram }}
                  <button
                    v-if="p.telegram && p.telegram !== '—'"
                    type="button"
                    class="p-icon-btn p-icon-btn--sm"
                    @click="copyText(p.telegram)"
                  >
                    <Copy :size="13" stroke-width="2" />
                  </button>
                </span>
              </div>
            </div>
          </section>
        </template>

        <div v-else class="card profile-stub">
          <p class="profile-stub-text">Раздел «{{ tabs.find(t => t.id === activeTab)?.label }}» — в разработке</p>
        </div>
      </div>

      <!-- Aside -->
      <aside class="profile-aside">
        <div class="card aside-card">
          <h4 class="aside-title">Руководители</h4>
          <ul class="aside-managers">
            <li v-for="(m, i) in p.managers" :key="i" class="aside-manager">
              <div class="aside-m-av">{{ initialsAv(m.name) }}</div>
              <div class="aside-m-text">
                <span class="aside-m-name">{{ m.name }}</span>
                <span class="aside-m-role">{{ m.role }}</span>
              </div>
            </li>
            <li v-if="!p.managers?.length" class="aside-empty">Нет данных</li>
          </ul>
        </div>

        <div class="card aside-card aside-points">
          <div class="points-icon" aria-hidden="true">◎</div>
          <div class="points-value">{{ p.points }} баллов</div>
          <p class="points-hint">Накапливайте баллы за активность и обменивайте в магазине.</p>
          <button type="button" class="btn-points">Корпоративный магазин</button>
        </div>

        <div class="card aside-card">
          <div class="aside-kudos-head">
            <h4 class="aside-title">Благодарности</h4>
            <button type="button" class="link-all">Все</button>
          </div>
          <div class="kudos-badges" aria-hidden="true">
            <span class="kb">🏅</span><span class="kb">⭐</span><span class="kb">❤️</span>
            <span class="kb kb--dot">14</span>
          </div>
          <ul class="kudos-feed">
            <li v-for="(k, i) in p.kudos" :key="i" class="kudos-item">
              <div class="kudos-av">{{ initialsAv(k.from) }}</div>
              <div class="kudos-body">
                <div class="kudos-title">{{ k.title }}</div>
                <div class="kudos-meta">{{ k.time }} · {{ k.from }}</div>
              </div>
            </li>
            <li v-if="!p.kudos?.length" class="aside-empty">Пока нет благодарностей</li>
          </ul>
          <button type="button" class="btn-points btn-points--outline">Все благодарности</button>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
  max-width: 1080px;
}

.card {
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 10px;
}

/* Hero */
.profile-hero {
  padding: 20px 22px 0;
  overflow: hidden;
}
.hero-top {
  display: flex;
  gap: 18px;
  align-items: flex-start;
  padding-bottom: 18px;
}
.hero-avatar-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.hero-avatar {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  background: linear-gradient(145deg, #e0e0e0, #c8c8c8);
  color: #444;
  font-size: 26px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}
.hero-status {
  font-size: 11px;
  font-weight: 600;
  color: #2d6a4f;
  background: #edf7f2;
  padding: 3px 10px;
  border-radius: 999px;
}
.hero-center {
  flex: 1;
  min-width: 0;
}
.hero-tab-num {
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}
.hero-name {
  font-size: 22px;
  font-weight: 600;
  color: #1a1a1a;
  letter-spacing: -0.3px;
  margin: 0 0 4px;
  line-height: 1.2;
}
.hero-position {
  font-size: 14px;
  color: #777;
  margin: 0 0 12px;
}
.hero-inline-contact {
  display: flex;
  flex-wrap: wrap;
  gap: 14px 20px;
  font-size: 13px;
  color: #555;
}
.hero-ic-line {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.hero-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}
.p-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  background: #fff;
  color: #666;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.p-icon-btn:hover {
  background: #f5f5f5;
  border-color: #ddd;
}
.p-icon-btn--sm {
  width: 28px;
  height: 28px;
}
.hero-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 14px 0 18px;
  border-top: 1px solid #f0f0f0;
}
.hero-sum-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.hero-sum-label {
  font-size: 11px;
  font-weight: 500;
  color: #aaa;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.hero-sum-value {
  font-size: 13.5px;
  color: #333;
  line-height: 1.35;
}
.hero-sum-link {
  color: #5b8ef0;
  cursor: default;
}

.profile-pill-tabs {
  padding: 2px 0;
}

/* Layout */
.profile-layout {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 20px;
  align-items: start;
}
@media (max-width: 900px) {
  .profile-layout {
    grid-template-columns: 1fr;
  }
  .hero-summary {
    grid-template-columns: 1fr;
  }
}

.profile-main {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.profile-block {
  padding: 18px 20px 20px;
}
.block-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.block-title {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px 24px;
}
@media (max-width: 640px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
}
.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.info-item--wide {
  grid-column: 1 / -1;
}
.info-label {
  font-size: 11.5px;
  color: #aaa;
  font-weight: 500;
}
.info-value {
  font-size: 13.5px;
  color: #333;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.info-ic {
  color: #bbb;
  flex-shrink: 0;
}
.mono { font-variant-numeric: tabular-nums; }
.break-all { word-break: break-all; }
.flex-row {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.status-pill {
  display: inline-block;
  align-self: flex-start;
  font-size: 11.5px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 6px;
  background: #edf7f2;
  color: #2d6a4f;
}

.profile-stub {
  padding: 48px 24px;
  text-align: center;
}
.profile-stub-text {
  font-size: 14px;
  color: #999;
  margin: 0;
}

/* Aside */
.profile-aside {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.aside-card {
  padding: 16px 18px;
}
.aside-title {
  font-size: 13px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 12px;
}
.aside-managers {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.aside-manager {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}
.aside-m-av {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e8e8e8, #d4d4d4);
  color: #555;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.aside-m-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.aside-m-name {
  font-size: 13px;
  font-weight: 600;
  color: #222;
}
.aside-m-role {
  font-size: 11.5px;
  color: #999;
  line-height: 1.35;
}
.aside-empty {
  font-size: 13px;
  color: #bbb;
  padding: 8px 0;
}

.aside-points {
  text-align: center;
}
.points-icon {
  font-size: 36px;
  line-height: 1;
  margin-bottom: 8px;
  opacity: 0.85;
  color: #5b8ef0;
}
.points-value {
  font-size: 22px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 8px;
}
.points-hint {
  font-size: 12px;
  color: #888;
  line-height: 1.45;
  margin: 0 0 14px;
}
.btn-points {
  width: 100%;
  padding: 9px 14px;
  font-size: 12.5px;
  font-weight: 500;
  font-family: inherit;
  color: #3b6fd9;
  background: #eef4ff;
  border: 1px solid #d6e4fd;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-points:hover {
  background: #e4ecfc;
}
.btn-points--outline {
  margin-top: 12px;
  background: #fff;
  color: #5b8ef0;
}

.aside-kudos-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.aside-kudos-head .aside-title {
  margin-bottom: 0;
}
.link-all {
  font-size: 12px;
  color: #5b8ef0;
  background: none;
  border: none;
  cursor: pointer;
  font-family: inherit;
}
.link-all:hover {
  text-decoration: underline;
}
.kudos-badges {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}
.kb {
  font-size: 20px;
  line-height: 1;
}
.kb--dot {
  font-size: 11px;
  background: #fee2e2;
  color: #b91c1c;
  padding: 2px 6px;
  border-radius: 999px;
}
.kudos-feed {
  list-style: none;
  margin: 0 0 12px;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.kudos-item {
  display: flex;
  gap: 10px;
}
.kudos-av {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e8e8e8;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #555;
}
.kudos-title {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}
.kudos-meta {
  font-size: 11.5px;
  color: #999;
  margin-top: 2px;
}
</style>
