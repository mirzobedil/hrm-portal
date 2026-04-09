<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Users } from 'lucide-vue-next'
import { UiSearchField, UiSelect } from '@/components/ui'
import { EMPLOYEES, EMPLOYEE_STATUS_LABELS } from '@/constants/employees'

const router = useRouter()

const searchQuery = ref('')
const filterDept = ref('')

const departments = computed(() => {
  const s = new Set(EMPLOYEES.map(e => e.dept))
  return [...s].sort((a, b) => a.localeCompare(b, 'ru'))
})

const filtered = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return EMPLOYEES.filter(e => {
    if (filterDept.value && e.dept !== filterDept.value) return false
    if (!q) return true
    const blob = `${e.name} ${e.position} ${e.dept} ${e.subdept} ${e.email}`.toLowerCase()
    return blob.includes(q)
  }).sort((a, b) => a.name.localeCompare(b.name, 'ru'))
})

const deptFilterOptions = computed(() => [
  { value: '', label: 'Все подразделения' },
  ...departments.value.map(d => ({ value: d, label: d })),
])

function initials(name) {
  const p = name.split(/\s+/).filter(Boolean)
  if (p.length >= 2) return (p[0][0] + p[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}
</script>

<template>
  <div class="employees">
    <div class="employees-stats">
      <div class="card stat-card">
        <div class="stat-top">
          <span class="stat-label">Всего в справочнике</span>
          <Users :size="15" stroke-width="1.5" class="stat-icon" />
        </div>
        <div class="stat-value">{{ EMPLOYEES.length }}</div>
      </div>
      <div class="card stat-card">
        <div class="stat-top">
          <span class="stat-label">Показано</span>
          <Users :size="15" stroke-width="1.5" class="stat-icon" />
        </div>
        <div class="stat-value stat-value--teal">{{ filtered.length }}</div>
      </div>
    </div>

    <div class="card employees-card">
      <div class="employees-toolbar">
        <div class="employees-search-wrap">
          <UiSearchField
            v-model="searchQuery"
            placeholder="Поиск по имени, должности, email..."
            autocomplete="off"
          />
        </div>
        <label class="employees-filter">
          <span class="visually-hidden">Подразделение</span>
          <UiSelect v-model="filterDept" :options="deptFilterOptions" />
        </label>
      </div>

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Сотрудник</th>
              <th>Подразделение</th>
              <th>Должность</th>
              <th>Email</th>
              <th class="align-right">Статус</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="emp in filtered" :key="emp.id" class="row-clickable" @click="router.push('/employees/' + emp.id)">
              <td>
                <div class="emp-cell">
                  <div class="emp-avatar" aria-hidden="true">{{ initials(emp.name) }}</div>
                  <span class="emp-name">{{ emp.name }}</span>
                </div>
              </td>
              <td class="col-muted">{{ emp.dept }} · {{ emp.subdept }}</td>
              <td>{{ emp.position }}</td>
              <td class="col-muted emp-email">{{ emp.email }}</td>
              <td class="align-right">
                <span class="status-pill">{{ EMPLOYEE_STATUS_LABELS[emp.status] || emp.status }}</span>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="filtered.length === 0" class="employees-empty">Никого не найдено — измените фильтр или поиск.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.employees {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.employees-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  max-width: 480px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px 18px;
}
.stat-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.stat-label {
  font-size: 12px;
  color: #999;
  font-weight: 450;
}
.stat-icon { color: #bbb; flex-shrink: 0; }
.stat-value {
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.5px;
  color: #1a1a1a;
  line-height: 1;
}
.stat-value--teal { color: #2ba896; }

.card {
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 10px;
}

.employees-card {
  padding: 0;
  overflow: hidden;
}

.employees-toolbar {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}
/* Wrapper cheklaydi: global .ui-search-field { width: 100% } faqat shu kenglikni to‘ldiradi */
.employees-search-wrap {
  width: 280px;
  max-width: min(100%, 320px);
  flex: 0 0 auto;
}
.employees-search-wrap :deep(.ui-search-field) {
  width: 100%;
  max-width: 100%;
}
.employees-filter {
  margin-left: auto;
  flex-shrink: 0;
}

.table-wrap { padding: 0 0 8px; }

.data-table {
  width: 100%;
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
}
.data-table tbody tr {
  border-bottom: 1px solid #f5f5f5;
  transition: background 0.12s;
}
.data-table tbody tr:last-child { border-bottom: none; }
.data-table tbody tr:hover { background: #fafafa; }
.data-table td { padding: 11px 20px; color: #444; vertical-align: middle; }

.align-right { text-align: right; }
.col-muted { color: #888; font-size: 12.5px; }

.emp-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}
.emp-avatar {
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
.emp-name { font-weight: 500; color: #1a1a1a; }
.emp-email { word-break: break-all; max-width: 220px; }

.status-pill {
  display: inline-block;
  font-size: 11.5px;
  font-weight: 500;
  padding: 3px 8px;
  border-radius: 6px;
  background: #edf7f2;
  color: #2d6a4f;
}

.row-clickable { cursor: pointer; }

.employees-empty {
  text-align: center;
  color: #999;
  font-size: 13px;
  padding: 28px 20px 24px;
  margin: 0;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
