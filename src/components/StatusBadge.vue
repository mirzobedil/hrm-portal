<script setup>
defineProps({
  /** Класс статуса: approved, pending_manager, … */
  status: { type: String, required: true },
  /** Текст бейджа (дублируется в title для подсказки при обрезке) */
  label: { type: String, required: true },
  /** Уменьшенный шрифт (таблицы, вложенные блоки) */
  small: { type: Boolean, default: false },
})
</script>

<template>
  <span
    :class="['status-badge', status, { 'status-badge--sm': small }]"
    :title="label"
  >{{ label }}</span>
</template>

<style scoped>
.status-badge {
  display: inline-block;
  max-width: min(100%, 11.5rem);
  padding: 3px 9px;
  border-radius: 20px;
  font-weight: 500;
  font-size: 11.5px;
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: middle;
}

.status-badge--sm {
  font-size: 11px;
  padding: 2px 7px;
  max-width: min(100%, 9.5rem);
}

.status-badge.approved {
  background: #edf7f2;
  color: #4caf7d;
}
.status-badge.confirmed {
  background: #e6f7f4;
  color: #2ba896;
}
.status-badge.pending {
  background: #fef9ec;
  color: #e8a020;
}
.status-badge.rejected {
  background: #fdf0f0;
  color: #e05a5a;
}
.status-badge.planned {
  background: #ebf1fd;
  color: #5b8ef0;
}
.status-badge.pending_manager {
  background: #f4f0fb;
  color: #7c5cc4;
}
.status-badge.approved_by_manager {
  background: #e6f7f4;
  color: #2ba896;
}
</style>
