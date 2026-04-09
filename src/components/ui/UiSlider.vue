<script setup>
import { computed } from 'vue'
import Slider from '@vueform/slider'

const props = defineProps({
  modelValue: { type: Number, required: true },
  min: { type: Number, default: 0 },
  max: { type: Number, default: 100 },
  step: { type: Number, default: 1 },
  disabled: { type: Boolean, default: false },
})

defineEmits(['update:modelValue'])

/** noUiSlider qayta init — min/max o‘zgarganda */
const sliderKey = computed(() => `${props.min}-${props.max}-${props.disabled ? 1 : 0}`)
</script>

<template>
  <div class="ui-slider-field" :class="{ 'ui-slider-field--disabled': disabled }">
    <Slider
      :key="sliderKey"
      :model-value="modelValue"
      :min="min"
      :max="max"
      :step="step"
      :disabled="disabled"
      :tooltips="false"
      :lazy="false"
      @update:model-value="$emit('update:modelValue', $event)"
    />
  </div>
</template>

<style src="@vueform/slider/themes/default.css"></style>

<style scoped>
/**
 * Standart palitra: to‘q binafsha track + progress, kulrang fon,
 * tutqich — binafsha, och halqa (maketdagi kabi).
 */
.ui-slider-field {
  --slider-bg: #e4e1ec;
  --slider-connect-bg: #3d2c55;
  --slider-connect-bg-disabled: #b5afc4;
  --slider-height: 10px;
  --slider-radius: 9999px;
  --slider-handle-bg: #3d2c55;
  --slider-handle-border: 2px solid #f2f0f7;
  --slider-handle-width: 22px;
  --slider-handle-height: 22px;
  --slider-handle-radius: 9999px;
  --slider-handle-shadow: 0 0 0 1px rgba(61, 44, 85, 0.12), 0 2px 6px rgba(61, 44, 85, 0.2);
  --slider-handle-shadow-active: 0 0 0 1px rgba(61, 44, 85, 0.2), 0 3px 8px rgba(61, 44, 85, 0.28);
  --slider-handle-ring-width: 0;
  --slider-handle-ring-color: transparent;
  width: 100%;
  min-width: 0;
}

.ui-slider-field--disabled {
  opacity: 0.55;
  pointer-events: none;
}
</style>
