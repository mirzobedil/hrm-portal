<script setup>
import { computed, inject } from 'vue'
import { UI_SWITCHER_KEY } from './switcherKey'

const props = defineProps({
  id: { type: [String, Number], required: true },
  title: { type: String, default: undefined },
})

const ctx = inject(UI_SWITCHER_KEY, null)

const isActive = computed(() => (ctx ? ctx.model.value === props.id : false))

function onClick() {
  if (!ctx) return
  ctx.model.value = props.id
}
</script>

<template>
  <button
    type="button"
    role="tab"
    class="ui-switcher__btn"
    :class="{ 'ui-switcher__btn--active': isActive }"
    :aria-selected="isActive"
    :title="title"
    @click="onClick"
  >
    <slot />
  </button>
</template>
