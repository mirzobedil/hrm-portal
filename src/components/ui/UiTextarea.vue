<script setup>
import { computed } from 'vue'

defineOptions({ inheritAttrs: false })

const model = defineModel({ default: '' })

const props = defineProps({
  invalid: { type: Boolean, default: false },
  fullWidth: { type: Boolean, default: false },
})

const areaClass = computed(() => [
  'ui-field',
  'ui-field--textarea',
  props.fullWidth && 'ui-field--full',
  props.invalid && 'ui-field--invalid',
])
</script>

<template>
  <textarea v-model="model" :class="areaClass" v-bind="$attrs" />
</template>
