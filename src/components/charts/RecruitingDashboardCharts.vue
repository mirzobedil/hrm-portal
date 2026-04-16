<script setup>
/**
 * Рекрутинг: горизонтальная воронка, donut причин/источников, линия по датам.
 */
import { computed } from 'vue'
import { Bar, Line, Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  BarController,
  LineElement,
  PointElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  Filler,
} from 'chart.js'
import {
  REC_FUNNEL_STAGES,
  REC_REJECTION_REASONS,
  REC_SOURCES,
  REC_CANDIDATES_BY_DATE,
} from '@/data/recruitingDashboardDemo.js'

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarController,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  Filler,
)

const COL = {
  grid: 'rgba(0, 0, 0, 0.06)',
  text: '#888',
  textDark: '#444',
}

/** Цвета столбцов воронки (Chart.js без градиента — сплошные) */
const FUNNEL_BAR_COLORS = [
  '#3b82f6',
  '#2563eb',
  '#64748b',
  '#8b5cf6',
  '#65a30d',
  '#bef264',
  '#0ea5e9',
  '#6366f1',
  '#db2777',
  '#059669',
]

/** Chart.js: справа от бара подпись `104 (100%)` — плагин после отрисовки */
const funnelBarEndLabelsPlugin = {
  id: 'recFunnelBarEndLabels',
  afterDatasetsDraw(chart) {
    const meta = chart.getDatasetMeta(0)
    const ds = chart.data.datasets[0]
    if (!meta?.data?.length || !ds?.data?.length) return

    const values = ds.data.map((v) => Number(v))
    const base = values[0] || 1
    const xScale = chart.scales.x
    if (!xScale) return

    const { ctx, chartArea } = chart
    ctx.save()
    ctx.font = '600 12px system-ui, -apple-system, Segoe UI, sans-serif'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#4a4a4a'

    meta.data.forEach((bar, i) => {
      if (bar.skip) return
      const v = values[i]
      const pct = Math.round((v / base) * 100)
      const text = `${v} (${pct}%)`
      const xEnd = xScale.getPixelForValue(v)
      const yCenter = bar.getProps(['y'], true).y
      if (typeof yCenter !== 'number' || Number.isNaN(yCenter)) return

      const pad = 8
      const tw = ctx.measureText(text).width
      let tx = xEnd + pad
      if (tx + tw > chartArea.right - 4) {
        ctx.textAlign = 'right'
        tx = chartArea.right - 4
      } else {
        ctx.textAlign = 'left'
      }
      ctx.fillText(text, tx, yCenter)
      ctx.textAlign = 'left'
    })
    ctx.restore()
  },
}

const REJ_BG = [
  'rgba(185, 28, 28, 0.92)',
  'rgba(220, 100, 100, 0.95)',
  'rgba(239, 68, 68, 0.88)',
  'rgba(248, 113, 113, 0.85)',
]

const SOURCE_BG = [
  'rgba(59, 111, 232, 0.9)',
  'rgba(34, 197, 94, 0.88)',
  'rgba(245, 158, 11, 0.9)',
  'rgba(168, 85, 247, 0.88)',
]

const LINE_COLORS = [
  'rgba(59, 111, 232, 0.95)',
  'rgba(34, 197, 94, 0.95)',
  'rgba(245, 158, 11, 0.95)',
  'rgba(168, 85, 247, 0.95)',
]

const props = defineProps({
  funnelStages: {
    type: Array,
    default: () => REC_FUNNEL_STAGES,
  },
  rejectionReasons: {
    type: Array,
    default: () => REC_REJECTION_REASONS,
  },
  sources: {
    type: Array,
    default: () => REC_SOURCES,
  },
  candidatesByDate: {
    type: Object,
    default: () => REC_CANDIDATES_BY_DATE,
  },
})

const funnelBase = computed(() => props.funnelStages[0]?.count || 1)

function funnelPct(count) {
  return Math.round((count / funnelBase.value) * 100)
}

const funnelData = computed(() => ({
  labels: props.funnelStages.map((s) => s.label),
  datasets: [
    {
      label: 'Кандидаты',
      data: props.funnelStages.map((s) => s.count),
      backgroundColor: props.funnelStages.map((_, i) => FUNNEL_BAR_COLORS[i % FUNNEL_BAR_COLORS.length]),
      borderRadius: { topRight: 7, bottomRight: 7, topLeft: 0, bottomLeft: 0 },
      borderSkipped: false,
      barPercentage: 0.78,
      categoryPercentage: 0.88,
      maxBarThickness: 26,
    },
  ],
}))

const funnelChartHeightPx = computed(() => {
  const n = props.funnelStages.length || 1
  return Math.min(520, Math.max(220, 36 + n * 38))
})

const funnelOptions = computed(() => ({
  indexAxis: 'y',
  responsive: true,
  maintainAspectRatio: false,
  layout: { padding: { right: 12, left: 4, top: 4, bottom: 4 } },
  animation: { duration: 440, easing: 'easeOutQuart' },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(255,255,255,0.98)',
      titleColor: '#222',
      bodyColor: '#555',
      borderColor: '#e8e8e8',
      borderWidth: 1,
      padding: 10,
      cornerRadius: 8,
      callbacks: {
        title: (items) => {
          const i = items[0]?.dataIndex
          return i != null ? props.funnelStages[i]?.label : ''
        },
        label: (ctx) => {
          const v = ctx.raw
          const p = funnelPct(v)
          const i = ctx.dataIndex
          const lines = [`${v} — ${p}% (от первого этапа)`]
          if (i > 0 && props.funnelStages[i - 1]) {
            const prev = props.funnelStages[i - 1].count
            if (prev > 0) lines.push(`От предыдущего этапа: ${Math.round((v / prev) * 100)}%`)
          }
          return lines
        },
      },
    },
  },
  scales: {
    x: {
      beginAtZero: true,
      grace: '10%',
      grid: { color: COL.grid, drawBorder: false },
      border: { display: false },
      ticks: { font: { size: 10 }, color: COL.text, padding: 6 },
    },
    y: {
      grid: { display: false },
      border: { display: false },
      ticks: {
        font: { size: 11 },
        color: COL.textDark,
        padding: 8,
        autoSkip: false,
      },
    },
  },
}))

const rejectionData = computed(() => ({
  labels: props.rejectionReasons.map((r) => r.label),
  datasets: [
    {
      data: props.rejectionReasons.map((r) => r.count),
      backgroundColor: props.rejectionReasons.map((_, i) => REJ_BG[i % REJ_BG.length]),
      borderWidth: 0,
      hoverOffset: 4,
    },
  ],
}))

const doughnutBase = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '62%',
  animation: { duration: 420, easing: 'easeOutQuart' },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(255,255,255,0.98)',
      titleColor: '#222',
      bodyColor: '#555',
      borderColor: '#e8e8e8',
      borderWidth: 1,
      padding: 10,
      cornerRadius: 8,
      callbacks: {
        label: (ctx) => {
          const total = ctx.dataset.data.reduce((a, b) => a + b, 0) || 1
          const v = ctx.raw
          const p = Math.round((v / total) * 100)
          return ` ${v} (${p}%)`
        },
      },
    },
  },
}

const rejectionDonutOptions = { ...doughnutBase }

const sourcesTotal = computed(() => props.sources.reduce((a, s) => a + s.count, 0))

const sourcesData = computed(() => ({
  labels: props.sources.map((s) => s.label),
  datasets: [
    {
      data: props.sources.map((s) => s.count),
      backgroundColor: props.sources.map((_, i) => SOURCE_BG[i % SOURCE_BG.length]),
      borderWidth: 0,
      hoverOffset: 4,
    },
  ],
}))

const sourcesDonutOptions = { ...doughnutBase }

const byDateData = computed(() => ({
  labels: props.candidatesByDate.labels,
  datasets: props.candidatesByDate.series.map((s, i) => {
    const c = LINE_COLORS[i % LINE_COLORS.length]
    return {
      label: s.label,
      data: s.values,
      showLine: false,
      borderColor: c,
      backgroundColor: c,
      borderWidth: 0,
      pointBackgroundColor: c,
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 6,
      pointHoverRadius: 8,
      fill: false,
    }
  }),
}))

const byDateOptions = {
  responsive: true,
  maintainAspectRatio: false,
  layout: {
    padding: { bottom: 4, top: 2 },
  },
  interaction: { mode: 'nearest', axis: 'x', intersect: false },
  animation: { duration: 480, easing: 'easeOutQuart' },
  plugins: {
    legend: {
      position: 'bottom',
      align: 'center',
      labels: {
        usePointStyle: true,
        pointStyle: 'circle',
        boxWidth: 8,
        boxHeight: 8,
        padding: 14,
        font: { size: 11 },
        color: COL.text,
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
    },
  },
  scales: {
    x: {
      grid: { display: false },
      border: { display: false },
      ticks: { font: { size: 10 }, color: '#666', maxRotation: 0 },
    },
    y: {
      beginAtZero: true,
      suggestedMax: 2,
      grid: { color: COL.grid, drawBorder: false },
      border: { display: false },
      ticks: { font: { size: 10 }, color: COL.text },
    },
  },
}
</script>

<template>
  <div class="rec-charts">
    <div class="card rec-chart-card rec-chart-card--wide">
      <h3 class="rec-chart-title">Воронка подбора</h3>
      <p class="rec-chart-hint">
        Горизонтальный bar Chart.js: этап на оси Y, значения — в подсказке и справа от бара (плагин)
      </p>
      <div
        class="rec-chart-canvas rec-chart-canvas--funnel-h"
        :style="{ height: `${funnelChartHeightPx}px` }"
      >
        <Bar
          :data="funnelData"
          :options="funnelOptions"
          :plugins="[funnelBarEndLabelsPlugin]"
        />
      </div>
    </div>

    <div class="rec-charts-split">
      <div class="card rec-chart-card rec-dual">
        <h3 class="rec-chart-title">Причины отказов</h3>
        <p class="rec-chart-hint">За последний период — агрегат</p>
        <div class="rec-dual-body">
          <div class="rec-donut-side">
            <div class="rec-donut-wrap">
              <Doughnut :data="rejectionData" :options="rejectionDonutOptions" />
            </div>
          </div>
          <ul class="rec-legend-list" aria-label="Список причин">
            <li v-for="(r, i) in rejectionReasons" :key="r.label" class="rec-legend-row">
              <span class="rec-legend-dot" :style="{ background: REJ_BG[i % REJ_BG.length] }" />
              <span class="rec-legend-label">{{ r.label }}</span>
              <span class="rec-legend-count">{{ r.count }}</span>
            </li>
          </ul>
        </div>
      </div>

      <div class="card rec-chart-card rec-dual">
        <h3 class="rec-chart-title">Кандидаты по источнику</h3>
        <p class="rec-chart-hint">Все сегменты перечислены в списке</p>
        <div class="rec-dual-body">
          <div class="rec-donut-side rec-donut-side--centered">
            <div class="rec-donut-wrap rec-donut-wrap--with-center">
              <Doughnut :data="sourcesData" :options="sourcesDonutOptions" />
              <div class="rec-donut-center" aria-hidden="true">
                <span class="rec-donut-center-lbl">Итого</span>
                <span class="rec-donut-center-num">{{ sourcesTotal }}</span>
              </div>
            </div>
          </div>
          <ul class="rec-legend-list" aria-label="Доля источников">
            <li v-for="(s, i) in sources" :key="s.label" class="rec-legend-row">
              <span class="rec-legend-dot" :style="{ background: SOURCE_BG[i % SOURCE_BG.length] }" />
              <span class="rec-legend-label">{{ s.label }}</span>
              <span class="rec-legend-count">
                {{ s.count }}
                <span class="rec-legend-pct">
                  ({{ sourcesTotal ? Math.round((s.count / sourcesTotal) * 100) : 0 }}%)
                </span>
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div class="card rec-chart-card rec-chart-card--wide">
      <h3 class="rec-chart-title">Кандидаты по дате</h3>
      <p class="rec-chart-hint">Приток по источникам — точки без линий (демо)</p>
      <div class="rec-chart-canvas rec-chart-canvas--lines">
        <Line :data="byDateData" :options="byDateOptions" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.rec-charts {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.rec-charts-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  min-width: 0;
}
@media (max-width: 960px) {
  .rec-charts-split {
    grid-template-columns: 1fr;
  }
}

.card {
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  padding: 16px 18px 14px;
  min-width: 0;
}

.rec-chart-card--wide {
  width: 100%;
}

.rec-chart-title {
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
}
.rec-chart-hint {
  margin: 0 0 12px;
  font-size: 11px;
  color: #aaa;
}

.rec-chart-canvas {
  position: relative;
  width: 100%;
  min-height: 0;
}
.rec-chart-canvas :deep(> div) {
  position: relative;
  height: 100%;
  width: 100%;
}
.rec-chart-canvas :deep(canvas) {
  display: block;
  max-height: 100%;
}

.rec-chart-canvas--funnel-h {
  width: 100%;
  min-height: 220px;
}

.rec-chart-canvas--lines {
  height: 280px;
}

.rec-dual-body {
  display: grid;
  grid-template-columns: minmax(0, 160px) minmax(0, 1fr);
  gap: 16px;
  align-items: start;
  min-width: 0;
}
@media (max-width: 520px) {
  .rec-dual-body {
    grid-template-columns: 1fr;
  }
}

.rec-donut-side {
  min-width: 0;
}
.rec-donut-side--centered {
  display: flex;
  justify-content: center;
}

.rec-donut-wrap {
  position: relative;
  width: 100%;
  max-width: 180px;
  height: 180px;
  margin: 0 auto;
}
.rec-donut-wrap--with-center {
  max-width: 200px;
  height: 200px;
}

.rec-donut-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  padding-bottom: 4%;
}
.rec-donut-center-lbl {
  font-size: 11px;
  color: #999;
  font-weight: 500;
}
.rec-donut-center-num {
  font-size: 22px;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: -0.03em;
  line-height: 1.1;
}

.rec-legend-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.rec-legend-row {
  display: grid;
  grid-template-columns: 10px 1fr auto;
  gap: 10px;
  align-items: baseline;
  font-size: 12.5px;
  color: #444;
}
.rec-legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 3px;
}
.rec-legend-label {
  min-width: 0;
  overflow-wrap: anywhere;
}
.rec-legend-count {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: #222;
  white-space: nowrap;
}
.rec-legend-pct {
  font-weight: 500;
  color: #888;
  font-size: 11.5px;
}
</style>
