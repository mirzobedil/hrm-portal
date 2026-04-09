<script setup>
import { computed } from 'vue'

/**
 * Matn, sana, raqam va boshqa `input` turlari — `.ui-field`.
 * Matn uchun `UiTextField` ham mavjud.
 */
defineOptions({ inheritAttrs: false })

const model = defineModel({ default: '' })

const props = defineProps({
  type: { type: String, default: 'text' },
  invalid: { type: Boolean, default: false },
  fullWidth: { type: Boolean, default: false },
})

const inputClass = computed(() => [
  'ui-field',
  props.fullWidth && 'ui-field--full',
  props.invalid && 'ui-field--invalid',
])
</script>

<template>
  <input v-model="model" :type="type" :class="inputClass" v-bind="$attrs" />
</template>
