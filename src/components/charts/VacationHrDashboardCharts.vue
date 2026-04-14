<script setup>
/**
 * HR-дашборд: головной офис (горизонтальные диаграммы) + филиалы.
 */
import { computed, ref, onMounted, nextTick, watch } from 'vue'
import { Bar } from 'vue-chartjs'
import { Building2 } from 'lucide-vue-next'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from 'chart.js'
import { VHR_DEPT_ROWS, VHR_BRANCHES } from '@/data/vacationHrDashboardDemo.js'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const COL = {
  subYes: 'rgba(74, 127, 232, 0.95)',
  subNo: 'rgba(180, 186, 198, 0.95)',
  pend: 'rgba(232, 160, 32, 0.95)',
  ok: 'rgba(58, 166, 115, 0.95)',
  rej: 'rgba(220, 100, 100, 0.95)',
  branch: 'rgba(91, 142, 240, 0.88)',
  grid: 'rgba(0, 0, 0, 0.06)',
  text: '#888',
}

const props = defineProps({
  deptRows: {
    type: Array,
    default: () => VHR_DEPT_ROWS,
  },
  branches: {
    type: Array,
    default: () => VHR_BRANCHES,
  },
})

const deptLabels = computed(() => props.deptRows.map((r) => r.dept))

/** Высота под горизонтальные bar: по одной полосе на отдел */
const deptChartHeightPx = computed(() => {
  const n = props.deptRows.length || 1
  return Math.min(400, Math.max(168, 52 + n * 36))
})

const submissionChartData = computed(() => ({
  labels: deptLabels.value,
  datasets: [
    {
      label: 'Подано',
      data: props.deptRows.map((r) => r.submitted),
      backgroundColor: COL.subYes,
      borderRadius: 5,
      borderSkipped: false,
    },
    {
      label: 'Не подано',
      data: props.deptRows.map((r) => r.notSubmitted),
      backgroundColor: COL.subNo,
      borderRadius: 5,
      borderSkipped: false,
    },
  ],
}))

const approvalChartData = computed(() => ({
  labels: deptLabels.value,
  datasets: [
    {
      label: 'Ожидает',
      data: props.deptRows.map((r) => r.pending),
      backgroundColor: COL.pend,
      borderRadius: 5,
      borderSkipped: false,
    },
    {
      label: 'Одобрено',
      data: props.deptRows.map((r) => r.approved),
      backgroundColor: COL.ok,
      borderRadius: 5,
      borderSkipped: false,
    },
    {
      label: 'Отклонено',
      data: props.deptRows.map((r) => r.rejected),
      backgroundColor: COL.rej,
      borderRadius: 5,
      borderSkipped: false,
    },
  ],
}))

const branchesChartData = computed(() => ({
  labels: props.branches.map((b) => b.name),
  datasets: [
    {
      label: '% планов подано',
      data: props.branches.map((b) => b.submittedPct),
      backgroundColor: COL.branch,
      borderRadius: 6,
      borderSkipped: false,
      barPercentage: 0.62,
      categoryPercentage: 0.72,
    },
  ],
}))

const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  animation: { duration: 420, easing: 'easeOutQuart' },
  plugins: {
    legend: {
      position: 'bottom',
      align: 'start',
      labels: {
        boxWidth: 10,
        boxHeight: 10,
        padding: 10,
        font: { size: 11 },
        color: COL.text,
        usePointStyle: true,
      },
    },
    tooltip: {
      backgroundColor: 'rgba(255,255,255,0.98)',
      titleColor: '#222',
      bodyColor: '#555',
      borderColor: '#e8e8e8',
      borderWidth: 1,
      padding: 10,
      cornerRadius: 8,
      displayColors: true,
    },
  },
}

/** Горизонтальные stacked bar — отделы на оси Y */
const deptHorizontalStackedOptions = {
  ...baseOptions,
  indexAxis: 'y',
  datasets: {
    bar: { barThickness: 'flex', maxBarThickness: 22 },
  },
  scales: {
    x: {
      stacked: true,
      beginAtZero: true,
      grid: { color: COL.grid, drawBorder: false },
      border: { display: false },
      ticks: { font: { size: 10 }, color: COL.text, padding: 4 },
    },
    y: {
      stacked: true,
      grid: { display: false },
      border: { display: false },
      ticks: { font: { size: 12 }, color: '#444', padding: 8 },
    },
  },
}

const submissionChartRef = ref(null)
const approvalChartRef = ref(null)

function chartInstance(vm) {
  const c = vm?.chart
  if (!c) return null
  return typeof c.resize === 'function' ? c : c.value ?? null
}

function resizeDeptCharts() {
  nextTick(() => {
    requestAnimationFrame(() => {
      chartInstance(submissionChartRef.value)?.resize()
      chartInstance(approvalChartRef.value)?.resize()
    })
  })
}

onMounted(resizeDeptCharts)
watch(deptChartHeightPx, resizeDeptCharts)

const branchesBarOptions = computed(() => ({
  ...baseOptions,
  scales: {
    x: {
      grid: { display: false },
      ticks: { font: { size: 11 }, color: '#555', maxRotation: 0 },
    },
    y: {
      min: 0,
      max: 100,
      grid: { color: COL.grid },
      ticks: {
        font: { size: 11 },
        color: COL.text,
        callback: (v) => `${v}%`,
      },
    },
  },
  plugins: {
    ...baseOptions.plugins,
    tooltip: {
      ...baseOptions.plugins.tooltip,
      callbacks: {
        label: (ctx) => {
          const b = props.branches[ctx.dataIndex]
          const emp = b?.employees != null ? ` · ${b.employees} сотр.` : ''
          return ` ${ctx.dataset.label}: ${ctx.raw}%${emp}`
        },
      },
    },
  },
}))
</script>

<template>
  <div class="vhr-charts">
    <!-- Головной офис: только диаграммы, без таблицы -->
    <div class="card vhr-office">
      <div class="vhr-office-head">
        <Building2 :size="18" stroke-width="1.75" class="vhr-office-ic" aria-hidden="true" />
        <div class="vhr-office-head-text">
          <h2 class="vhr-office-title">Головной офис — по подразделениям</h2>
          <p class="vhr-office-lead">
            Горизонтальные диаграммы: слева направо — объёмы по отделам. Наведите для точных значений.
          </p>
        </div>
      </div>

      <div class="vhr-office-grid">
        <div class="vhr-office-panel">
          <h3 class="vhr-panel-title">Подача плана</h3>
          <p class="vhr-panel-hint">Подано и не подано, чел.</p>
          <div
            class="vhr-chart-canvas"
            :style="{ height: `${deptChartHeightPx}px` }"
          >
            <Bar
              ref="submissionChartRef"
              :data="submissionChartData"
              :options="deptHorizontalStackedOptions"
            />
          </div>
        </div>
        <div class="vhr-office-panel">
          <h3 class="vhr-panel-title">Согласование</h3>
          <p class="vhr-panel-hint">Ожидает / одобрено / отклонено</p>
          <div
            class="vhr-chart-canvas"
            :style="{ height: `${deptChartHeightPx}px` }"
          >
            <Bar
              ref="approvalChartRef"
              :data="approvalChartData"
              :options="deptHorizontalStackedOptions"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="card vhr-branch-card">
      <h3 class="vhr-branch-title">Филиалы — доля поданных планов</h3>
      <p class="vhr-branch-hint">Процент от штата (демо)</p>
      <div class="vhr-chart-canvas vhr-chart-canvas--branch">
        <Bar :data="branchesChartData" :options="branchesBarOptions" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.vhr-charts {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}
.card {
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  padding: 18px 20px 14px;
  min-width: 0;
}

.vhr-office-head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 14px;
}
.vhr-office-ic {
  color: #7a7a7a;
  flex-shrink: 0;
  margin-top: 2px;
}
.vhr-office-title {
  margin: 0 0 4px;
  font-size: 16px;
  font-weight: 600;
  color: #141414;
  letter-spacing: -0.02em;
  line-height: 1.25;
}
.vhr-office-lead {
  margin: 0;
  font-size: 12px;
  color: #9a9a9a;
  line-height: 1.45;
  max-width: 48em;
}

.vhr-office-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 20px;
}
@media (max-width: 900px) {
  .vhr-office-grid {
    grid-template-columns: 1fr;
  }
}

.vhr-office-panel {
  min-width: 0;
  padding: 12px 14px 8px;
  background: linear-gradient(180deg, #fafafa 0%, #fff 48%);
  border: 1px solid #efefef;
  border-radius: 10px;
}
.vhr-panel-title {
  margin: 0 0 2px;
  font-size: 13px;
  font-weight: 600;
  color: #333;
}
.vhr-panel-hint {
  margin: 0 0 8px;
  font-size: 11px;
  color: #b0b0b0;
}

.vhr-chart-canvas {
  position: relative;
  width: 100%;
  min-height: 0;
}
.vhr-chart-canvas :deep(> div) {
  position: relative;
  height: 100%;
  width: 100%;
}
.vhr-chart-canvas :deep(canvas) {
  display: block;
  max-height: 100%;
}

.vhr-branch-title {
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
}
.vhr-branch-hint {
  margin: 0 0 8px;
  font-size: 11px;
  color: #aaa;
}
.vhr-chart-canvas--branch {
  height: 200px;
}
</style>
