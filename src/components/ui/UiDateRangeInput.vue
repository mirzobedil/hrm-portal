<script setup>
import { ref, watch, computed } from 'vue'
import { format } from 'date-fns'
import { VueDatePicker } from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import { ru, enUS } from 'date-fns/locale'

/**
 * Sana oralig‘i — bitta UI komponenti (boshqa maydonlar bilan .ui-field).
 * v-model: { from: 'YYYY-MM-DD', to: 'YYYY-MM-DD' }
 */
defineOptions({ inheritAttrs: false })

const model = defineModel({
  type: Object,
  default: () => ({ from: '', to: '' }),
})

const props = defineProps({
  ariaLabel: { type: String, default: 'Период отпуска' },
  allTimeLabel: { type: String, default: 'Все время' },
  locale: { type: String, default: 'ru-RU' },
  calendarsCount: { type: Number, default: 2 },
  fullWidth: { type: Boolean, default: false },
  invalid: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})

const dateFnsLocale = computed(() =>
  props.locale.toLowerCase().startsWith('en') ? enUS : ru,
)

/** Paket ichki holati: [Date, Date] | null */
const pickerValue = ref(null)

function toISODate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseISO(s) {
  if (!s) return null
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function syncFromModel() {
  const { from, to } = model.value
  if (!from && !to) {
    pickerValue.value = null
    return
  }
  if (from && to) {
    pickerValue.value = [parseISO(from), parseISO(to)]
  }
}

watch(() => ({ ...model.value }), syncFromModel, { deep: true, immediate: true })

function onPickerUpdate(val) {
  pickerValue.value = val
  if (!val) {
    model.value = { from: '', to: '' }
    return
  }
  if (Array.isArray(val) && val.length === 2 && val[0] && val[1]) {
    model.value = { from: toISODate(val[0]), to: toISODate(val[1]) }
  }
}

const pickerFormats = computed(() => {
  const L = dateFnsLocale.value
  return {
    input: (dates) => {
      if (!dates || !Array.isArray(dates)) return ''
      const a = dates[0]
      const b = dates[1]
      if (!a || !b) return ''
      return `${format(a, 'dd.MM.yyyy', { locale: L })} – ${format(b, 'dd.MM.yyyy', { locale: L })}`
    },
  }
})

const inputUiClass = computed(() => [
  'ui-field',
  props.fullWidth && 'ui-field--full',
  props.invalid && 'ui-field--invalid',
].filter(Boolean))

const pickerInputAttrs = computed(() => ({
  clearable: true,
  ...(props.invalid ? { state: false } : {}),
}))

const pickerUi = computed(() => ({
  input: inputUiClass.value,
  menu: 'ui-daterange-menu',
}))
</script>

<template>
  <div
    class="ui-daterange"
    :class="{ 'ui-daterange--full': fullWidth }"
    role="group"
    :aria-label="ariaLabel"
  >
    <VueDatePicker
      :model-value="pickerValue"
      range
      :multi-calendars="calendarsCount"
      :locale="dateFnsLocale"
      :formats="pickerFormats"
      :time-picker="false"
      :time-config="{ enableTimePicker: false }"
      :placeholder="allTimeLabel"
      :teleport="true"
      auto-apply
      week-start="1"
      :input-attrs="pickerInputAttrs"
      :disabled="disabled"
      :ui="pickerUi"
      class="ui-daterange__picker"
      @update:model-value="onPickerUpdate"
    />
  </div>
</template>

<style scoped>
.ui-daterange__picker {
  /* Chap kalendar ikonkasi uchun joy (main.css dagi default 35px o‘rniga) */
  --dp-input-icon-padding: 40px;
  width: 100%;
  min-width: 220px;
  max-width: min(100%, 340px);
}

.ui-daterange--full .ui-daterange__picker {
  max-width: 100%;
}
</style>
