<script setup>
import UiInput from './UiInput.vue'

/**
 * Bir qatorli matn maydoni (text, email, password, …).
 * Sana / vaqt uchun `UiInput` + `type="date"` ishlating.
 */
defineOptions({ inheritAttrs: false })

const model = defineModel({ default: '' })

defineProps({
  type: { type: String, default: 'text' },
  invalid: { type: Boolean, default: false },
  fullWidth: { type: Boolean, default: false },
})
</script>

<template>
  <UiInput v-model="model" :type="type" :invalid="invalid" :full-width="fullWidth" v-bind="$attrs" />
</template>
