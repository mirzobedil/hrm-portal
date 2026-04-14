<script setup>
/**
 * HR / админ: сводка по планированию отпусков (демо-данные).
 * В проде — VACATION_PLANNING_API / аналитика по подразделениям и филиалам.
 */
import { computed } from 'vue'
import VacationHrDashboardCharts from '@/components/charts/VacationHrDashboardCharts.vue'
import { VHR_DEPT_ROWS, VHR_BRANCHES } from '@/data/vacationHrDashboardDemo.js'

const deptRows = VHR_DEPT_ROWS
const branches = VHR_BRANCHES

const orgTotals = computed(() => {
  let hc = 0, sub = 0, ns = 0, p = 0, a = 0, r = 0
  for (const row of deptRows) {
    hc += row.headcount
    sub += row.submitted
    ns += row.notSubmitted
    p += row.pending
    a += row.approved
    r += row.rejected
  }
  return { headcount: hc, submitted: sub, notSubmitted: ns, pending: p, approved: a, rejected: r }
})

function pct(n, d) {
  if (!d) return 0
  return Math.round((n / d) * 100)
}
</script>

<template>
  <div class="vhr-dash">
    <p class="vhr-dash-lead">
      Сводка по годовому планированию отпусков: подача планов и статусы согласования.
      Данные демонстрационные.
    </p>

    <!-- KPI -->
    <div class="vhr-kpi-grid">
      <div class="card vhr-kpi">
        <span class="vhr-kpi-label">План подан</span>
        <div class="vhr-kpi-val">
          {{ orgTotals.submitted }} <span class="vhr-kpi-of">/ {{ orgTotals.headcount }}</span>
        </div>
        <div class="vhr-kpi-bar" aria-hidden="true">
          <div
            class="vhr-kpi-fill vhr-kpi-fill--share"
            :style="{ width: `${pct(orgTotals.submitted, orgTotals.headcount)}%` }"
          />
        </div>
        <div class="vhr-kpi-sub">{{ pct(orgTotals.submitted, orgTotals.headcount) }}% сотрудников</div>
      </div>
      <div class="card vhr-kpi">
        <span class="vhr-kpi-label">Не подали</span>
        <div class="vhr-kpi-val">{{ orgTotals.notSubmitted }}</div>
        <div class="vhr-kpi-bar" aria-hidden="true">
          <div
            class="vhr-kpi-fill vhr-kpi-fill--share vhr-kpi-fill--soft"
            :style="{ width: `${pct(orgTotals.notSubmitted, orgTotals.headcount)}%` }"
          />
        </div>
      </div>
      <div class="card vhr-kpi">
        <span class="vhr-kpi-label">На согласовании</span>
        <div class="vhr-kpi-val">{{ orgTotals.pending }}</div>
      </div>
      <div class="card vhr-kpi">
        <span class="vhr-kpi-label">Одобрено</span>
        <div class="vhr-kpi-val">{{ orgTotals.approved }}</div>
      </div>
      <div class="card vhr-kpi">
        <span class="vhr-kpi-label">Отклонено</span>
        <div class="vhr-kpi-val vhr-kpi-val--rej">{{ orgTotals.rejected }}</div>
      </div>
    </div>

    <VacationHrDashboardCharts :dept-rows="deptRows" :branches="branches" />
  </div>
</template>

<style scoped>
.vhr-dash {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
}
.vhr-dash-lead {
  margin: 0;
  font-size: 13px;
  color: #888;
  line-height: 1.5;
  max-width: 52em;
}

.card {
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 10px;
  padding: 18px 20px;
}

/* KPI — минимальные карточки без иконок и цветных заголовков */
.vhr-kpi-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
}
@media (max-width: 1100px) {
  .vhr-kpi-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
@media (max-width: 640px) {
  .vhr-kpi-grid {
    grid-template-columns: 1fr 1fr;
  }
}
.vhr-kpi {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  border-color: #ebebeb;
  border-radius: 8px;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.03);
}
.vhr-kpi-label {
  font-size: 11px;
  font-weight: 500;
  color: #888;
  letter-spacing: 0.01em;
  line-height: 1.3;
}
.vhr-kpi-val {
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
  letter-spacing: -0.02em;
  line-height: 1.15;
  font-variant-numeric: tabular-nums;
}
.vhr-kpi-val--rej {
  color: #b84a4a;
  font-weight: 600;
}
.vhr-kpi-of {
  font-size: 13px;
  font-weight: 500;
  color: #a8a8a8;
  font-variant-numeric: tabular-nums;
}
.vhr-kpi-bar {
  height: 3px;
  border-radius: 2px;
  background: #eee;
  overflow: hidden;
  margin-top: 4px;
}
.vhr-kpi-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.25s ease;
}
.vhr-kpi-fill--share {
  background: #4a4a4a;
}
.vhr-kpi-fill--soft {
  background: #b0b0b0;
}
.vhr-kpi-sub {
  font-size: 11px;
  color: #a3a3a3;
  margin-top: 2px;
}

</style>
