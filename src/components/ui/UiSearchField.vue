<script setup>
import { Search } from 'lucide-vue-next'

defineOptions({ inheritAttrs: false })

const model = defineModel({ default: '' })

defineProps({
  /** default — katalog qidiruv; dense — kalendar yon paneli */
  variant: { type: String, default: 'default' },
})
</script>

<template>
  <div
    :class="[
      'ui-search-field',
      variant === 'dense' && 'ui-search-field--dense',
    ]"
  >
    <span class="ui-search-field__ic" aria-hidden="true">
      <slot name="icon">
        <Search :size="variant === 'dense' ? 15 : 16" stroke-width="2" />
      </slot>
    </span>
    <input
      v-model="model"
      type="search"
      class="ui-search-field__input"
      v-bind="$attrs"
    >
  </div>
</template>
