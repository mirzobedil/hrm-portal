<script setup>
import { provide } from 'vue'
import { UI_LINE_TABS_KEY } from './lineTabsKey'

const model = defineModel({ required: true })

provide(UI_LINE_TABS_KEY, { model })
</script>

<template>
  <div class="ui-line-tabs" role="tablist">
    <slot />
  </div>
</template>
