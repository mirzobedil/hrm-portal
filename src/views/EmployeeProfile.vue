<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Phone, Mail, Copy, Calendar,
  Briefcase, Building2, MapPin, FileText, Send,
} from 'lucide-vue-next'
import { UiPillTabs, UiPillTab, UiButton, UiTextarea } from '@/components/ui'
import StatusBadge from '@/components/StatusBadge.vue'
import { EMPLOYEES, EMPLOYEE_STATUS_LABELS } from '@/constants/employees'
import { STATUS_LABELS } from '@/constants/vacation'

const route = useRoute()
const router = useRouter()

const empId = computed(() => Number(route.params.id))
const emp = computed(() => EMPLOYEES.find(e => e.id === empId.value))

function initials(name) {
  const p = (name || '').split(/\s+/).filter(Boolean)
  if (p.length >= 2) return (p[0][0] + p[1][0]).toUpperCase()
  return (name || '??').slice(0, 2).toUpperCase()
}

const bal = computed(() => emp.value?.vacationBalance ?? { total: 28, used: 0 })
const balRemain = computed(() => bal.value.total - bal.value.used)

const DEMO_VACATIONS = [
  { id: 1, empId: 1, from: '2025-04-10', to: '2025-04-18', days: 9, type: 'Ежегодный', status: 'approved' },
  { id: 2, empId: 2, from: '2025-04-14', to: '2025-04-22', days: 9, type: 'Ежегодный', status: 'planned' },
  { id: 3, empId: 3, from: '2025-04-22', to: '2025-04-26', days: 5, type: 'Ежегодный', status: 'approved' },
  { id: 4, empId: 4, from: '2025-05-01', to: '2025-05-12', days: 12, type: 'Ежегодный', status: 'planned' },
  { id: 5, empId: 5, from: '2025-04-28', to: '2025-05-02', days: 5, type: 'За свой счёт', status: 'approved' },
  { id: 6, empId: 6, from: '2025-05-05', to: '2025-05-09', days: 5, type: 'Ежегодный', status: 'planned' },
  { id: 7, empId: 7, from: '2025-05-12', to: '2025-05-23', days: 12, type: 'Ежегодный', status: 'planned' },
  { id: 8, empId: 8, from: '2025-06-01', to: '2025-06-14', days: 14, type: 'Ежегодный', status: 'planned' },
  { id: 9, empId: 9, from: '2025-06-09', to: '2025-06-20', days: 12, type: 'Ежегодный', status: 'planned' },
  { id: 10, empId: 1, from: '2025-06-23', to: '2025-06-30', days: 8, type: 'Ежегодный', status: 'planned' },
]

const empVacations = computed(() =>
  DEMO_VACATIONS.filter(v => v.empId === empId.value),
)

const DEMO_DOCS = [
  { id: 1, name: 'Трудовой договор', date: '01.09.2022', type: 'contract' },
  { id: 2, name: 'Приказ о приёме', date: '01.09.2022', type: 'order' },
  { id: 3, name: 'Дополнительное соглашение №1', date: '15.03.2024', type: 'amendment' },
]

function fmtDate(iso) {
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}

const managerEmp = computed(() => {
  if (!emp.value?.manager) return null
  return EMPLOYEES.find(e => e.name === emp.value.manager) || null
})

const activeTab = ref('general')
const tabs = [
  { id: 'general', label: 'Общие сведения' },
  { id: 'vacation', label: 'Отпуска' },
  { id: 'docs', label: 'Документы' },
]

const hrNote = ref('')

async function copyText(text) {
  if (!text || text === '—') return
  try { await navigator.clipboard.writeText(text) } catch { /* */ }
}

function goBack() {
  router.push('/employees')
}
</script>

<template>
  <div class="ep">
    <div v-if="!emp" class="ep-not-found card">
      <p class="ep-not-found-text">Сотрудник не найден</p>
      <UiButton variant="secondary" @click="goBack">Назад к списку</UiButton>
    </div>

    <template v-else>
      <!-- Hero -->
      <div class="card ep-hero">
        <div class="ep-hero-top">
          <div class="ep-hero-avatar-block">
            <div class="ep-hero-avatar" aria-hidden="true">{{ initials(emp.name) }}</div>
            <span class="ep-hero-status">{{ EMPLOYEE_STATUS_LABELS[emp.status] || emp.status }}</span>
          </div>
          <div class="ep-hero-center">
            <p class="ep-hero-dept">{{ emp.dept }} · {{ emp.subdept }}</p>
            <h2 class="ep-hero-name">{{ emp.name }}</h2>
            <p class="ep-hero-position">{{ emp.position }}</p>
            <div class="ep-hero-contact">
              <span class="ep-hero-ic-line"><Mail :size="14" stroke-width="2" /> {{ emp.email }}</span>
              <span v-if="emp.mobile" class="ep-hero-ic-line"><Phone :size="14" stroke-width="2" /> {{ emp.mobile }}</span>
            </div>
          </div>
        </div>
        <div class="ep-hero-summary">
          <div class="ep-hero-sum-cell">
            <span class="ep-hero-sum-label">Дата приёма</span>
            <span class="ep-hero-sum-value">{{ emp.hireDate }}</span>
          </div>
          <div class="ep-hero-sum-cell">
            <span class="ep-hero-sum-label">Тип договора</span>
            <span class="ep-hero-sum-value">{{ emp.contractType }}</span>
          </div>
          <div class="ep-hero-sum-cell">
            <span class="ep-hero-sum-label">Руководитель</span>
            <span class="ep-hero-sum-value ep-hero-sum-link">{{ emp.manager || '—' }}</span>
          </div>
          <div class="ep-hero-sum-cell">
            <span class="ep-hero-sum-label">Баланс отпуска</span>
            <span class="ep-hero-sum-value">
              <strong>{{ balRemain }}</strong> из {{ bal.total }} дн.
            </span>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <UiPillTabs v-model="activeTab" class="ep-tabs">
        <UiPillTab
          v-for="tab in tabs"
          :key="tab.id"
          :id="tab.id"
        >
          {{ tab.label }}
        </UiPillTab>
      </UiPillTabs>

      <div class="ep-layout">
        <!-- Main -->
        <div class="ep-main">
          <!-- Tab: Общие сведения -->
          <template v-if="activeTab === 'general'">
            <section class="card ep-block">
              <h3 class="ep-block-title">Основное</h3>
              <div class="ep-info-grid">
                <div class="ep-info-item">
                  <span class="ep-info-label">Статус</span>
                  <span class="ep-status-pill">{{ EMPLOYEE_STATUS_LABELS[emp.status] || emp.status }}</span>
                </div>
                <div class="ep-info-item">
                  <span class="ep-info-label">Должность</span>
                  <span class="ep-info-value"><Briefcase :size="13" class="ep-info-ic" /> {{ emp.position }}</span>
                </div>
                <div class="ep-info-item">
                  <span class="ep-info-label">Подразделение</span>
                  <span class="ep-info-value">{{ emp.dept }} · {{ emp.subdept }}</span>
                </div>
                <div class="ep-info-item">
                  <span class="ep-info-label">Тип договора</span>
                  <span class="ep-info-value">{{ emp.contractType }}</span>
                </div>
                <div class="ep-info-item">
                  <span class="ep-info-label">Дата приёма</span>
                  <span class="ep-info-value"><Calendar :size="13" class="ep-info-ic" /> {{ emp.hireDate }}</span>
                </div>
                <div class="ep-info-item">
                  <span class="ep-info-label">Руководитель</span>
                  <span class="ep-info-value">{{ emp.manager || '—' }}</span>
                </div>
              </div>
            </section>

            <section class="card ep-block">
              <h3 class="ep-block-title">Личные данные</h3>
              <div class="ep-info-grid">
                <div class="ep-info-item">
                  <span class="ep-info-label">Дата рождения</span>
                  <span class="ep-info-value">{{ emp.birthDate }}</span>
                </div>
                <div class="ep-info-item">
                  <span class="ep-info-label">Пол</span>
                  <span class="ep-info-value">{{ emp.gender }}</span>
                </div>
              </div>
            </section>

            <section class="card ep-block">
              <h3 class="ep-block-title">Контакты</h3>
              <div class="ep-info-grid">
                <div class="ep-info-item">
                  <span class="ep-info-label">Корпоративная почта</span>
                  <span class="ep-info-value ep-break-all">
                    {{ emp.email }}
                    <button type="button" class="ep-copy-btn" title="Копировать" @click="copyText(emp.email)">
                      <Copy :size="13" stroke-width="2" />
                    </button>
                  </span>
                </div>
                <div class="ep-info-item">
                  <span class="ep-info-label">Мобильный</span>
                  <span class="ep-info-value">
                    {{ emp.mobile || '—' }}
                    <button v-if="emp.mobile" type="button" class="ep-copy-btn" title="Копировать" @click="copyText(emp.mobile)">
                      <Copy :size="13" stroke-width="2" />
                    </button>
                  </span>
                </div>
                <div class="ep-info-item">
                  <span class="ep-info-label">Telegram</span>
                  <span class="ep-info-value">
                    {{ emp.telegram || '—' }}
                    <button v-if="emp.telegram && emp.telegram !== '—'" type="button" class="ep-copy-btn" title="Копировать" @click="copyText(emp.telegram)">
                      <Copy :size="13" stroke-width="2" />
                    </button>
                  </span>
                </div>
              </div>
            </section>
          </template>

          <!-- Tab: Отпуска -->
          <template v-if="activeTab === 'vacation'">
            <div class="ep-vac-cards">
              <div class="card ep-vac-card">
                <span class="ep-vac-card-label">Всего</span>
                <span class="ep-vac-card-value">{{ bal.total }}</span>
                <span class="ep-vac-card-unit">дней / год</span>
              </div>
              <div class="card ep-vac-card">
                <span class="ep-vac-card-label">Использовано</span>
                <span class="ep-vac-card-value ep-vac-card-value--used">{{ bal.used }}</span>
                <span class="ep-vac-card-unit">дней</span>
              </div>
              <div class="card ep-vac-card">
                <span class="ep-vac-card-label">Остаток</span>
                <span class="ep-vac-card-value ep-vac-card-value--remain">{{ balRemain }}</span>
                <span class="ep-vac-card-unit">дней</span>
              </div>
            </div>

            <!-- Как employees-card / recruiting: таблица на всю ширину карточки, без бокового padding у блока -->
            <div class="card ep-table-card">
              <div class="ep-table-card-head">
                <h3 class="ep-block-title">История отпусков</h3>
              </div>
              <div v-if="empVacations.length" class="table-wrap">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>С</th>
                      <th>По</th>
                      <th class="align-right">Дней</th>
                      <th>Тип</th>
                      <th class="align-right">Статус</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="v in empVacations" :key="v.id">
                      <td>{{ fmtDate(v.from) }}</td>
                      <td>{{ fmtDate(v.to) }}</td>
                      <td class="align-right">{{ v.days }}</td>
                      <td class="col-muted">{{ v.type }}</td>
                      <td class="align-right">
                        <StatusBadge :status="v.status" :label="STATUS_LABELS[v.status] || v.status" small />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p v-else class="ep-empty ep-table-card-empty">Нет данных об отпусках.</p>
            </div>
          </template>

          <!-- Tab: Документы -->
          <template v-if="activeTab === 'docs'">
            <div class="card ep-block">
              <h3 class="ep-block-title">Документы сотрудника</h3>
              <ul class="ep-docs-list">
                <li v-for="doc in DEMO_DOCS" :key="doc.id" class="ep-doc-item">
                  <FileText :size="16" stroke-width="1.5" class="ep-doc-ic" />
                  <div class="ep-doc-text">
                    <span class="ep-doc-name">{{ doc.name }}</span>
                    <span class="ep-doc-date">{{ doc.date }}</span>
                  </div>
                </li>
              </ul>
            </div>
          </template>
        </div>

        <!-- Aside -->
        <aside class="ep-aside">
          <div class="card ep-aside-card">
            <h4 class="ep-aside-title">Руководитель</h4>
            <div v-if="managerEmp" class="ep-aside-manager">
              <div class="ep-aside-m-av">{{ initials(managerEmp.name) }}</div>
              <div class="ep-aside-m-text">
                <span class="ep-aside-m-name">{{ managerEmp.name }}</span>
                <span class="ep-aside-m-role">{{ managerEmp.position }}</span>
              </div>
            </div>
            <div v-else-if="emp.manager && emp.manager !== '—'" class="ep-aside-manager">
              <div class="ep-aside-m-av">{{ initials(emp.manager) }}</div>
              <div class="ep-aside-m-text">
                <span class="ep-aside-m-name">{{ emp.manager }}</span>
              </div>
            </div>
            <p v-else class="ep-aside-empty">Нет данных</p>
          </div>

          <div class="card ep-aside-card">
            <h4 class="ep-aside-title">HR-заметка</h4>
            <UiTextarea
              v-model="hrNote"
              placeholder="Внутренняя заметка..."
              rows="4"
              full-width
            />
            <UiButton
              variant="secondary"
              size="sm"
              class="ep-note-save"
              :disabled="!hrNote.trim()"
            >
              <Send :size="12" stroke-width="2" /> Сохранить
            </UiButton>
          </div>
        </aside>
      </div>
    </template>
  </div>
</template>

<style scoped>
.ep {
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

/* Not found */
.ep-not-found {
  padding: 48px 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}
.ep-not-found-text {
  font-size: 15px;
  color: #999;
  margin: 0;
}

/* Hero */
.ep-hero {
  padding: 20px 22px 0;
  overflow: hidden;
}
.ep-hero-top {
  display: flex;
  gap: 18px;
  align-items: flex-start;
  padding-bottom: 18px;
}
.ep-hero-avatar-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.ep-hero-avatar {
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
.ep-hero-status {
  font-size: 11px;
  font-weight: 600;
  color: #2d6a4f;
  background: #edf7f2;
  padding: 3px 10px;
  border-radius: 999px;
}
.ep-hero-center {
  flex: 1;
  min-width: 0;
}
.ep-hero-dept {
  font-size: 12px;
  color: #999;
  margin: 0 0 4px;
}
.ep-hero-name {
  font-size: 22px;
  font-weight: 600;
  color: #1a1a1a;
  letter-spacing: -0.3px;
  margin: 0 0 4px;
  line-height: 1.2;
}
.ep-hero-position {
  font-size: 14px;
  color: #777;
  margin: 0 0 12px;
}
.ep-hero-contact {
  display: flex;
  flex-wrap: wrap;
  gap: 14px 20px;
  font-size: 13px;
  color: #555;
}
.ep-hero-ic-line {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.ep-hero-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  padding: 14px 0 18px;
  border-top: 1px solid #f0f0f0;
}
.ep-hero-sum-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.ep-hero-sum-label {
  font-size: 11px;
  font-weight: 500;
  color: #aaa;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.ep-hero-sum-value {
  font-size: 13.5px;
  color: #333;
  line-height: 1.35;
}
.ep-hero-sum-link {
  color: #5b8ef0;
}

/* Tabs */
.ep-tabs { padding: 2px 0; }

/* Layout */
.ep-layout {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 20px;
  align-items: start;
}
@media (max-width: 900px) {
  .ep-layout { grid-template-columns: 1fr; }
  .ep-hero-summary { grid-template-columns: repeat(2, 1fr); }
}

.ep-main {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

/* Blocks */
.ep-block {
  padding: 18px 20px 20px;
}
.ep-block-title {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 16px;
}

/* Как .employees-card: заголовок с отступом, таблица — на полную ширину карточки */
.ep-table-card {
  padding: 0;
  overflow: hidden;
}
.ep-table-card-head {
  padding: 18px 20px 0;
}
.ep-table-card-head .ep-block-title {
  margin: 0 0 12px;
}
.ep-table-card .table-wrap {
  padding: 0 0 8px;
}
.ep-table-card-empty {
  padding: 24px 20px 28px;
  margin: 0;
}

/* Info grid */
.ep-info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px 24px;
}
@media (max-width: 640px) {
  .ep-info-grid { grid-template-columns: 1fr; }
}
.ep-info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.ep-info-label {
  font-size: 11.5px;
  color: #aaa;
  font-weight: 500;
}
.ep-info-value {
  font-size: 13.5px;
  color: #333;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.ep-info-ic { color: #bbb; flex-shrink: 0; }
.ep-break-all { word-break: break-all; }
.ep-status-pill {
  display: inline-block;
  align-self: flex-start;
  font-size: 11.5px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 6px;
  background: #edf7f2;
  color: #2d6a4f;
}

.ep-copy-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #bbb;
  cursor: pointer;
  transition: color 0.15s, background 0.15s;
  flex-shrink: 0;
}
.ep-copy-btn:hover { color: #666; background: #f0f0f0; }

/* Vacation tab */
.ep-vac-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.ep-vac-card {
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  text-align: center;
}
.ep-vac-card-label {
  font-size: 11.5px;
  color: #999;
  font-weight: 500;
}
.ep-vac-card-value {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
  line-height: 1;
}
.ep-vac-card-value--used { color: #e05a5a; }
.ep-vac-card-value--remain { color: #4caf7d; }
.ep-vac-card-unit {
  font-size: 11px;
  color: #bbb;
}

/* Как на Recruiting / списках: фиксированная раскладка — строка на всю ширину карточки */
.table-wrap {
  padding: 0 0 8px;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: auto;
}
.data-table {
  table-layout: fixed;
  width: 100%;
  max-width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.data-table thead tr { border-bottom: 1px solid #f0f0f0; }
.data-table th {
  padding: 10px 20px;
  font-size: 11.5px;
  font-weight: 500;
  color: #aaa;
  text-align: left;
  overflow-wrap: anywhere;
}
.data-table tbody tr {
  border-bottom: 1px solid #f5f5f5;
  transition: background 0.12s;
}
.data-table tbody tr:last-child { border-bottom: none; }
.data-table tbody tr:hover { background: #fafafa; }
.data-table td {
  padding: 11px 20px;
  color: #444;
  vertical-align: middle;
  overflow-wrap: anywhere;
  word-wrap: break-word;
}
.align-right { text-align: right; }
.col-muted { color: #888; font-size: 12.5px; }

.ep-empty {
  text-align: center;
  color: #bbb;
  font-size: 13px;
  padding: 20px 0;
  margin: 0;
}

/* Docs tab */
.ep-docs-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}
.ep-doc-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
}
.ep-doc-item:last-child { border-bottom: none; }
.ep-doc-ic { color: #bbb; flex-shrink: 0; }
.ep-doc-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.ep-doc-name {
  font-size: 13px;
  font-weight: 500;
  color: #1a1a1a;
}
.ep-doc-date {
  font-size: 11.5px;
  color: #999;
}

/* Aside */
.ep-aside {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.ep-aside-card {
  padding: 16px 18px;
}
.ep-aside-title {
  font-size: 13px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 12px;
}
.ep-aside-manager {
  display: flex;
  gap: 10px;
  align-items: center;
}
.ep-aside-m-av {
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
.ep-aside-m-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.ep-aside-m-name {
  font-size: 13px;
  font-weight: 600;
  color: #222;
}
.ep-aside-m-role {
  font-size: 11.5px;
  color: #999;
  line-height: 1.35;
}
.ep-aside-empty {
  font-size: 13px;
  color: #bbb;
  margin: 0;
}

.ep-note-save {
  margin-top: 10px;
  align-self: flex-end;
}
</style>
