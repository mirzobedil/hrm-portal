<script setup>
import { computed } from 'vue'

defineOptions({ inheritAttrs: false })

const props = defineProps({
  /** primary | secondary | danger | reject */
  variant: { type: String, default: 'primary' },
  /** md | sm */
  size: { type: String, default: 'md' },
  type: { type: String, default: 'button' },
})

const btnClass = computed(() => [
  'ui-btn',
  `ui-btn--${props.variant}`,
  props.size === 'sm' && 'ui-btn--sm',
])
</script>

<template>
  <button :type="type" :class="btnClass" v-bind="$attrs">
    <slot />
  </button>
</template>
