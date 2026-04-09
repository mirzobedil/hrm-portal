<script setup>
import { computed } from 'vue'

defineOptions({ inheritAttrs: false })

const props = defineProps({
  type: { type: String, default: 'button' },
  /** md — sidebar; sm — modal yopish; nav — kalendar; tl — gantt timeline */
  size: { type: String, default: 'md' },
})

const btnClass = computed(() => [
  'ui-icon-btn',
  props.size === 'sm' && 'ui-icon-btn--sm',
  props.size === 'nav' && 'ui-icon-btn--nav',
  props.size === 'tl' && 'ui-icon-btn--tl',
])
</script>

<template>
  <button :type="type" :class="btnClass" v-bind="$attrs">
    <slot />
  </button>
</template>
