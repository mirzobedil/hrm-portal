<script setup>
import { provide, computed } from 'vue'
import { UI_SWITCHER_KEY } from './switcherKey'

const model = defineModel({ required: true })

const props = defineProps({
  /** text — сегменты с подписью; icon — только иконки */
  variant: { type: String, default: 'text' },
})

const variantClass = computed(() =>
  props.variant === 'icon' ? 'ui-switcher--icon' : 'ui-switcher--text',
)

provide(UI_SWITCHER_KEY, { model })
</script>

<template>
  <div class="ui-switcher" :class="variantClass" role="tablist">
    <slot />
  </div>
</template>
