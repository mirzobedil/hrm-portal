<script setup>
import {
  ref, computed, watch, nextTick, onUnmounted,
} from 'vue'
import { computePosition, autoUpdate, offset, flip, shift } from '@floating-ui/dom'
import { ChevronDown, Check } from 'lucide-vue-next'

defineOptions({ inheritAttrs: false })

const model = defineModel({ default: '' })

const props = defineProps({
  /** { value: string | number, label: string, disabled?: boolean }[] */
  options: { type: Array, required: true },
  placeholder: { type: String, default: '' },
  /** '' | 'teamFilter' | 'toolbar' | 'calendarWide' */
  variant: { type: String, default: '' },
  fullWidth: { type: Boolean, default: false },
  invalid: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})

const open = ref(false)
const triggerRef = ref(null)
const panelRef = ref(null)
const listRef = ref(null)
const activeIdx = ref(-1)

const triggerClass = computed(() => [
  'ui-dropdown-trigger',
  'ui-field',
  'ui-field--select',
  props.fullWidth && 'ui-field--full',
  props.invalid && 'ui-field--invalid',
  props.variant === 'teamFilter' && 'ui-field--team-filter',
  props.variant === 'toolbar' && 'ui-field--toolbar',
  props.variant === 'calendarWide' && 'ui-field--calendar-wide',
  open.value && 'ui-dropdown-trigger--open',
  props.disabled && 'ui-dropdown-trigger--disabled',
].filter(Boolean))

function valuesEqual(a, b) {
  if (a === b) return true
  if (a === '' || a === null || a === undefined) {
    return b === '' || b === null || b === undefined
  }
  return String(a) === String(b)
}

const selectedLabel = computed(() => {
  const opt = props.options.find(o => !o.disabled && valuesEqual(o.value, model.value))
  if (opt) return opt.label
  if (model.value === '' || model.value === null || model.value === undefined) {
    return props.placeholder || '—'
  }
  return String(model.value)
})

const panelStyle = ref({})

/** Floating UI: birinchi ochilishda ham trigger bilan bir xil (fixed + scroll konteynerlar) */
let cleanupAutoUpdate = null

async function syncPanelPosition() {
  const reference = triggerRef.value
  const floating = panelRef.value
  if (!reference || !floating) return
  const { x, y } = await computePosition(reference, floating, {
    placement: 'bottom-start',
    strategy: 'fixed',
    middleware: [
      offset(4),
      flip(),
      shift({ padding: 8 }),
    ],
  })
  const rw = reference.getBoundingClientRect()
  panelStyle.value = {
    position: 'fixed',
    left: `${Math.round(x)}px`,
    top: `${Math.round(y)}px`,
    width: `${Math.round(rw.width)}px`,
    zIndex: '10050',
  }
}

function close() {
  open.value = false
  activeIdx.value = -1
}

function toggle() {
  if (props.disabled) return
  open.value = !open.value
}

function selectOption(opt) {
  if (opt.disabled) return
  model.value = opt.value
  close()
}

function onDocPointerDown(e) {
  if (!open.value) return
  const tr = triggerRef.value
  const pan = panelRef.value
  if (tr?.contains(e.target) || pan?.contains(e.target)) return
  close()
}

function onKeydownTrigger(e) {
  if (props.disabled) return
  if (e.key === 'Escape' && open.value) {
    e.preventDefault()
    close()
    return
  }
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    toggle()
    return
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (!open.value) {
      open.value = true
      nextTick(() => {
        activeIdx.value = firstEnabledIndex()
      })
    } else {
      moveActive(1)
    }
  }
  if (e.key === 'ArrowUp' && open.value) {
    e.preventDefault()
    moveActive(-1)
  }
}

function firstEnabledIndex() {
  const opts = props.options
  for (let i = 0; i < opts.length; i++) {
    if (!opts[i].disabled) return i
  }
  return -1
}

function moveActive(delta) {
  const opts = props.options
  let i = activeIdx.value < 0 ? firstEnabledIndex() : activeIdx.value
  const n = opts.length
  if (n === 0) return
  for (let step = 0; step < n + 1; step++) {
    i = (i + delta + n) % n
    if (!opts[i]?.disabled) {
      activeIdx.value = i
      scrollOptionIntoView(i)
      return
    }
  }
}

function scrollOptionIntoView(index) {
  nextTick(() => {
    const root = listRef.value
    if (!root) return
    const row = root.querySelector(`[data-idx="${index}"]`)
    row?.scrollIntoView({ block: 'nearest' })
  })
}

function onKeydownPanel(e) {
  if (e.key === 'Escape') {
    e.preventDefault()
    close()
    triggerRef.value?.focus()
    return
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    moveActive(1)
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault()
    moveActive(-1)
  }
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    const opt = props.options[activeIdx.value]
    if (opt && !opt.disabled) selectOption(opt)
  }
  if (e.key === 'Home') {
    e.preventDefault()
    activeIdx.value = firstEnabledIndex()
    scrollOptionIntoView(activeIdx.value)
  }
  if (e.key === 'End') {
    e.preventDefault()
    const opts = props.options
    for (let i = opts.length - 1; i >= 0; i--) {
      if (!opts[i].disabled) {
        activeIdx.value = i
        scrollOptionIntoView(i)
        return
      }
    }
  }
}

watch(open, async (v) => {
  if (v) {
    await nextTick()
    await nextTick()
    await syncPanelPosition()
    const sel = props.options.findIndex(o => !o.disabled && valuesEqual(o.value, model.value))
    activeIdx.value = sel >= 0 ? sel : firstEnabledIndex()
    const refEl = triggerRef.value
    const floatEl = panelRef.value
    if (refEl && floatEl) {
      cleanupAutoUpdate = autoUpdate(refEl, floatEl, () => {
        syncPanelPosition()
      })
    }
    document.addEventListener('pointerdown', onDocPointerDown, true)
    await nextTick()
    panelRef.value?.focus()
  } else {
    cleanupAutoUpdate?.()
    cleanupAutoUpdate = null
    panelStyle.value = {}
    document.removeEventListener('pointerdown', onDocPointerDown, true)
  }
})

onUnmounted(() => {
  cleanupAutoUpdate?.()
  cleanupAutoUpdate = null
  document.removeEventListener('pointerdown', onDocPointerDown, true)
})
</script>

<template>
  <div class="ui-dropdown" :class="{ 'ui-dropdown--full': fullWidth }" v-bind="$attrs">
    <button
      ref="triggerRef"
      type="button"
      class="ui-dropdown-trigger-inner"
      :class="triggerClass"
      :disabled="disabled"
      :aria-expanded="open"
      aria-haspopup="listbox"
      @click.stop="toggle"
      @keydown="onKeydownTrigger"
    >
      <span class="ui-dropdown-trigger-label">{{ selectedLabel }}</span>
      <span
        class="ui-dropdown-chevron-wrap"
        :class="{ 'ui-dropdown-chevron-wrap--sm': variant === 'teamFilter' }"
        aria-hidden="true"
      >
        <ChevronDown
          class="ui-dropdown-chevron"
          :size="variant === 'teamFilter' ? 12 : 16"
          :stroke-width="2"
        />
      </span>
    </button>

    <Teleport to="body">
      <Transition name="ui-dropdown-fade">
        <div
          v-show="open"
          ref="panelRef"
          class="ui-dropdown-panel"
          :style="panelStyle"
          role="listbox"
          :aria-activedescendant="activeIdx >= 0 ? `ui-opt-${activeIdx}` : undefined"
          tabindex="-1"
          @keydown="onKeydownPanel"
        >
          <div ref="listRef" class="ui-dropdown-list">
            <button
              v-for="(opt, idx) in options"
              :id="`ui-opt-${idx}`"
              :key="`${String(opt.value)}-${idx}`"
              type="button"
              class="ui-dropdown-option"
              :class="{
                'ui-dropdown-option--selected': valuesEqual(opt.value, model),
                'ui-dropdown-option--active': activeIdx === idx,
                'ui-dropdown-option--disabled': opt.disabled,
              }"
              :data-idx="idx"
              role="option"
              :aria-selected="valuesEqual(opt.value, model)"
              :disabled="opt.disabled"
              @click.stop="selectOption(opt)"
              @mouseenter="activeIdx = idx"
            >
              <span class="ui-dropdown-option-label">{{ opt.label }}</span>
              <span class="ui-dropdown-option-check" aria-hidden="true">
                <Check
                  v-if="valuesEqual(opt.value, model) && !opt.disabled"
                  class="ui-dropdown-check"
                  :size="14"
                  stroke-width="2.5"
                />
              </span>
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.ui-dropdown {
  position: relative;
  display: inline-block;
  vertical-align: middle;
  max-width: 100%;
}
.ui-dropdown--full {
  display: block;
  width: 100%;
}

.ui-dropdown-trigger-inner {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  text-align: left;
  cursor: pointer;
  font-family: inherit;
  margin: 0;
  /* button reset + global .ui-field padding override (chevron endi flexda) */
  border-style: solid;
  background-image: none !important;
  line-height: 1.25;
}
/* Oddiy select: matn + chevron, o‘ngdan ~10px bo‘shliq */
.ui-dropdown-trigger-inner.ui-field.ui-field--select:not(.ui-field--team-filter):not(.ui-field--toolbar) {
  padding: 0 10px 0 12px;
  height: var(--ui-control-height);
  min-height: var(--ui-control-height);
  line-height: calc(var(--ui-control-height) - 2px);
}
/* Kalendar toolbar: vertikal tekislash + umumiy balandlik */
.ui-dropdown-trigger-inner.ui-field.ui-field--select.ui-field--team-filter {
  padding: 0 10px 0 10px;
  height: var(--ui-control-height);
  min-height: var(--ui-control-height);
  line-height: calc(var(--ui-control-height) - 2px);
  align-items: center;
  font-size: var(--ui-control-font-size);
  font-weight: 500;
  color: #333;
}
.ui-dropdown-trigger-inner.ui-field.ui-field--select.ui-field--toolbar {
  padding: 0 10px 0 8px;
  height: var(--ui-control-height);
  min-height: var(--ui-control-height);
  line-height: calc(var(--ui-control-height) - 2px);
  align-items: center;
}
.ui-dropdown--full .ui-dropdown-trigger-inner {
  width: 100%;
}
.ui-dropdown-trigger-inner:disabled,
.ui-dropdown-trigger--disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.ui-dropdown-trigger-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.35;
  align-self: center;
}

.ui-dropdown-chevron-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  align-self: center;
  width: 20px;
  height: 20px;
  transform-origin: 50% 50%;
  transition: transform 0.18s ease;
  color: #94a3b8;
  /* SVG baseline / bo‘sh joy ostidagi “bo‘shliq” */
  line-height: 0;
}
.ui-dropdown-chevron-wrap--sm {
  width: 16px;
  height: 16px;
}
.ui-dropdown-chevron {
  display: block;
  flex-shrink: 0;
}
.ui-dropdown-trigger--open .ui-dropdown-chevron-wrap {
  transform: rotate(180deg);
}

.ui-dropdown-panel {
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.06),
    0 10px 24px -4px rgba(0, 0, 0, 0.1);
  padding: 4px;
  max-height: min(320px, calc(100vh - 24px));
  overflow: hidden;
  outline: none;
}

.ui-dropdown-list {
  max-height: 300px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.ui-dropdown-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  padding: 9px 10px;
  margin: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  font-family: inherit;
  font-size: 13px;
  line-height: 1.35;
  color: #1a1a1a;
  text-align: left;
  cursor: pointer;
  transition: background 0.1s ease;
}
.ui-dropdown-option:hover:not(:disabled),
.ui-dropdown-option--active:not(.ui-dropdown-option--disabled) {
  background: #f3f4f6;
}
.ui-dropdown-option--selected:not(.ui-dropdown-option--disabled) {
  font-weight: 500;
  color: #111827;
}
.ui-dropdown-option--disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.ui-dropdown-option-label {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ui-dropdown-option-check {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  flex-shrink: 0;
}

.ui-dropdown-check {
  flex-shrink: 0;
  color: #6b7280;
}

/* transform olib tashlandi — birinchi frame’da fixed panel bilan ziddiyat bermasligi uchun */
.ui-dropdown-fade-enter-active,
.ui-dropdown-fade-leave-active {
  transition: opacity 0.12s ease;
}
.ui-dropdown-fade-enter-from,
.ui-dropdown-fade-leave-to {
  opacity: 0;
}
</style>
