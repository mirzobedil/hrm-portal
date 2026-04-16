<script setup>
import { computed, inject } from 'vue'
import { UI_LINE_TABS_KEY } from './lineTabsKey'

const props = defineProps({
  id: { type: [String, Number], required: true },
  badge: { type: [Number, String], default: undefined },
  hideBadgeWhenZero: { type: Boolean, default: true },
  title: { type: String, default: undefined },
})

const ctx = inject(UI_LINE_TABS_KEY, null)

const isActive = computed(() => (ctx ? ctx.model.value === props.id : false))

const showBadge = computed(() => {
  const b = props.badge
  if (b === undefined || b === null || b === '') return false
  if (props.hideBadgeWhenZero && Number(b) === 0) return false
  return true
})

function onClick() {
  if (!ctx) return
  ctx.model.value = props.id
}
</script>

<template>
  <button
    type="button"
    role="tab"
    class="ui-line-tab"
    :class="{ 'ui-line-tab--active': isActive }"
    :aria-selected="isActive"
    :title="title"
    @click="onClick"
  >
    <slot />
    <span v-if="showBadge" class="ui-line-tab__badge">{{ badge }}</span>
  </button>
</template>
