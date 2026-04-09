<script setup>
import { computed, inject } from 'vue'
import { UI_PILL_TABS_KEY } from './pillTabsKey'

const props = defineProps({
  id: { type: [String, Number], required: true },
  /** Ixtiyoriy son (profil badge, «Заявки» soni) */
  badge: { type: [Number, String], default: undefined },
  /** `true` bo‘lsa, 0 ko‘rinmaydi */
  hideBadgeWhenZero: { type: Boolean, default: true },
  title: { type: String, default: undefined },
})

const ctx = inject(UI_PILL_TABS_KEY, null)

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
    class="ui-pill-tab"
    :class="{ 'ui-pill-tab--active': isActive }"
    :aria-selected="isActive"
    :title="title"
    @click="onClick"
  >
    <slot />
    <span v-if="showBadge" class="ui-pill-tab__count">{{ badge }}</span>
  </button>
</template>
