<script setup>
import { provide } from 'vue'
import { UI_PILL_TABS_KEY } from './pillTabsKey'

const model = defineModel({ required: true })

provide(UI_PILL_TABS_KEY, { model })
</script>

<template>
  <div class="ui-pill-tabs" role="tablist">
    <slot />
  </div>
</template>
