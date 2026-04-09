<script setup>
/**
 * Label + slot (input/select/textarea) + ixtiyoriy xato / izoh.
 */
defineProps({
  label: { type: String, default: '' },
  hint: { type: String, default: '' },
  error: { type: String, default: '' },
})
</script>

<template>
  <div
    class="ui-form-field"
    :class="{ 'ui-form-field--invalid': !!error }"
  >
    <label v-if="label" class="ui-form-field__label">{{ label }}</label>
    <slot />
    <p v-if="error" class="ui-form-field__error">{{ error }}</p>
    <p v-else-if="hint" class="ui-form-field__hint">{{ hint }}</p>
  </div>
</template>
