<script setup>
import { computed } from 'vue'
import { Check, X, Clock } from 'lucide-vue-next'
import { formatActivityTimeRu } from '@/utils/formatActivityTimeRu'

const props = defineProps({
  /** success — одобрено/отправлено; danger — отклонено; pending — ждёт действия; waiting — ещё не наступил этап */
  variant: {
    type: String,
    required: true,
    validator: v => ['success', 'danger', 'pending', 'waiting'].includes(v),
  },
  personName: { type: String, required: true },
  /** Короткая фраза действия (серая часть строки) */
  action: { type: String, required: true },
  time: { type: [Date, String, Number], default: null },
  comment: { type: String, default: '' },
  isLast: { type: Boolean, default: false },
  /** Приглушить ФИО и действие (будущий этап) */
  muted: { type: Boolean, default: false },
})

const initials = computed(() => {
  const parts = props.personName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  return parts.slice(0, 2).map(p => p[0]).join('').toUpperCase()
})

const timeText = computed(() => formatActivityTimeRu(props.time))

const showPendingHint = computed(
  () => props.variant === 'pending' && !timeText.value,
)
</script>

<template>
  <div
    class="af-item"
    :class="{ 'af-item--muted': muted }"
    role="listitem"
  >
    <div class="af-track" aria-hidden="true">
      <div
        class="af-node-outer"
        :class="{
          'af-node-outer--success': variant === 'success',
          'af-node-outer--danger': variant === 'danger',
          'af-node-outer--pending': variant === 'pending',
          'af-node-outer--waiting': variant === 'waiting',
        }"
      >
        <div
          class="af-node-inner"
          :class="{
            'af-node-inner--success': variant === 'success',
            'af-node-inner--danger': variant === 'danger',
            'af-node-inner--pending': variant === 'pending',
            'af-node-inner--waiting': variant === 'waiting',
          }"
        >
          <Check v-if="variant === 'success'" :size="14" stroke-width="2.5" class="af-ic" />
          <X v-else-if="variant === 'danger'" :size="14" stroke-width="2.5" class="af-ic" />
          <Clock v-else-if="variant === 'pending'" :size="14" stroke-width="2" class="af-ic" />
          <Clock v-else :size="13" stroke-width="2" class="af-ic af-ic--muted" />
        </div>
      </div>
      <div v-if="!isLast" class="af-connector" />
    </div>

    <div class="af-main">
      <div class="af-row">
        <div class="af-avatar" aria-hidden="true">{{ initials }}</div>
        <div class="af-text">
          <span class="af-name">{{ personName }}</span>
          <span class="af-action"> {{ action }}</span>
          <template v-if="timeText">
            <span class="af-sep"> · </span>
            <span class="af-time">{{ timeText }}</span>
          </template>
          <template v-else-if="showPendingHint">
            <span class="af-sep"> · </span>
            <span class="af-pending-hint">Ожидает действия</span>
          </template>
        </div>
      </div>
      <div v-if="comment" class="af-comment">
        {{ comment }}
      </div>
      <div class="af-slot">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.af-item {
  display: flex;
  gap: 14px;
  align-items: stretch;
  min-width: 0;
}

.af-item--muted .af-name,
.af-item--muted .af-action {
  color: #a8a8a8;
}

.af-item--muted .af-avatar {
  background: #f3f3f3;
  color: #c4c4c4;
}

.af-track {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  width: 44px;
}

.af-node-outer {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.af-node-outer--success {
  background: #e6f0ff;
}
.af-node-outer--danger {
  background: #ffe6e6;
}
.af-node-outer--pending {
  background: #fff6e0;
}
.af-node-outer--waiting {
  background: #f0f0f0;
}

.af-node-inner {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.af-node-inner--success {
  background: #2f70e9;
  color: #fff;
}
.af-node-inner--danger {
  background: #e94f4f;
  color: #fff;
}
.af-node-inner--pending {
  background: #e69f00;
  color: #fff;
}
.af-node-inner--waiting {
  background: #fff;
  border: 2px solid #d1d5db;
  color: #9ca3af;
}

.af-ic {
  flex-shrink: 0;
}
.af-ic--muted {
  opacity: 0.85;
}

.af-connector {
  flex: 1;
  width: 2px;
  min-height: 16px;
  margin: 4px 0 2px;
  background: #e5e5e5;
}

.af-main {
  flex: 1;
  min-width: 0;
  padding-bottom: 20px;
}

.af-item:last-child .af-main {
  padding-bottom: 0;
}

.af-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.af-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #eef2f7;
  color: #5a6b82;
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.af-text {
  font-size: 13px;
  line-height: 1.45;
  min-width: 0;
}

.af-name {
  font-weight: 600;
  color: #1a1a1a;
}

.af-action {
  font-weight: 400;
  color: #5c5c5c;
}

.af-sep {
  color: #b0b0b0;
  font-weight: 400;
}

.af-time {
  font-weight: 400;
  color: #9a9a9a;
  font-size: 12.5px;
}

.af-pending-hint {
  font-weight: 500;
  color: #2f70e9;
  font-size: 12.5px;
}

.af-comment {
  margin-top: 10px;
  margin-left: 42px;
  padding: 10px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 12.5px;
  line-height: 1.45;
  color: #444;
  background: #fafafa;
}

.af-slot:empty {
  display: none;
}

.af-slot:not(:empty) {
  margin-top: 10px;
  margin-left: 42px;
}
</style>
