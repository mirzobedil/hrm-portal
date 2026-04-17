<script setup>
import { X } from 'lucide-vue-next'
import { UiButton, UiIconButton, UiField, UiTextarea, UiSelect, UiInput } from '@/components/ui'

defineProps({
  title: { type: String, default: '' },
  /** @type {import('vue').PropType<object | null>} */
  pending: { type: Object, default: null },
  /** @type {import('vue').PropType<Record<string, unknown>>} */
  form: { type: Object, required: true },
  error: { type: String, default: '' },
  stageTitleFn: { type: Function, required: true },
})

const emit = defineEmits(['close', 'confirm'])
</script>

<template>
  <Teleport to="body">
    <div
      v-if="pending"
      class="rec-cycle-tr-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rec-cycle-tr-title"
      @click.self="emit('close')"
    >
      <div class="rec-cycle-tr-modal">
        <div class="rec-cycle-tr-head">
          <h2 id="rec-cycle-tr-title" class="rec-cycle-tr-title">{{ title }}</h2>
          <UiIconButton type="button" size="sm" aria-label="Закрыть" @click="emit('close')">
            <X :size="14" stroke-width="2" />
          </UiIconButton>
        </div>

        <div class="rec-cycle-tr-body">
          <p v-if="pending?.decision === 'forward_new'" class="rec-cycle-tr-lead">
            Перевести кандидата на этап «{{ stageTitleFn('phone') }}»? При необходимости добавьте комментарий HR.
          </p>

          <template v-if="pending?.decision === 'reject'">
            <UiField label="Причина отказа" :error="error">
              <UiTextarea
                v-model="form.rejectReason"
                rows="3"
                full-width
                placeholder="Обязательно для сохранения отказа"
              />
            </UiField>
          </template>

          <template v-else-if="pending?.decision === 'restore'">
            <p class="rec-cycle-tr-lead">
              Кандидат снова будет активен на этапе «{{ stageTitleFn(pending.toStage) }}». Отказ в найме будет снят.
            </p>
          </template>

          <template v-else-if="pending?.decision === 'forward_new'">
            <UiField label="Комментарий HR" hint="Необязательно">
              <UiTextarea v-model="form.newNote" rows="2" full-width placeholder="" />
            </UiField>
          </template>

          <template v-else-if="pending?.decision === 'forward_interview'">
            <UiField label="Результат">
              <div class="rec-cycle-tr-radio-row">
                <label class="rec-cycle-tr-radio">
                  <input v-model="form.passFail" type="radio" value="passed" />
                  Пройдено
                </label>
                <label class="rec-cycle-tr-radio">
                  <input v-model="form.passFail" type="radio" value="failed" />
                  Не пройдено
                </label>
              </div>
            </UiField>
            <UiField label="Комментарий">
              <UiTextarea
                v-model="form.comment"
                rows="3"
                full-width
                placeholder="Оценка и заметки по результатам (обязательно)"
              />
            </UiField>
          </template>

          <template v-else-if="pending?.decision === 'forward_test'">
            <UiField label="Результат">
              <div class="rec-cycle-tr-radio-row">
                <label class="rec-cycle-tr-radio">
                  <input v-model="form.passFail" type="radio" value="passed" />
                  Пройдено
                </label>
                <label class="rec-cycle-tr-radio">
                  <input v-model="form.passFail" type="radio" value="failed" />
                  Не пройдено
                </label>
              </div>
            </UiField>
            <UiField label="Балл (необязательно)" hint="0–100">
              <UiInput v-model="form.testScore" type="number" min="0" max="100" full-width />
            </UiField>
            <UiField label="Комментарий">
              <UiTextarea v-model="form.comment" rows="3" full-width placeholder="" />
            </UiField>
          </template>

          <template v-else-if="pending?.decision === 'forward_compliance'">
            <div class="rec-cycle-tr-split">
              <UiField label="Результат СБ">
                <UiSelect
                  v-model="form.sbResult"
                  full-width
                  :options="[
                    { value: 'approved', label: 'Одобрено' },
                    { value: 'rejected', label: 'Отклонено' },
                  ]"
                />
              </UiField>
              <UiField label="Результат комплаенс">
                <UiSelect
                  v-model="form.complianceResult"
                  full-width
                  :options="[
                    { value: 'approved', label: 'Одобрено' },
                    { value: 'rejected', label: 'Отклонено' },
                  ]"
                />
              </UiField>
            </div>
            <UiField label="Комментарий СБ">
              <UiTextarea v-model="form.sbComment" rows="2" full-width placeholder="" />
            </UiField>
            <UiField label="Комментарий комплаенс">
              <UiTextarea v-model="form.complianceComment" rows="2" full-width placeholder="" />
            </UiField>
          </template>

          <p v-if="error" class="rec-cycle-tr-err">{{ error }}</p>
        </div>

        <div class="rec-cycle-tr-foot">
          <UiButton variant="secondary" type="button" @click="emit('close')">Отмена</UiButton>
          <UiButton variant="primary" type="button" @click="emit('confirm')">Сохранить</UiButton>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style>
.rec-cycle-tr-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.28);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 110;
  padding: 20px;
}

.rec-cycle-tr-modal {
  width: 100%;
  max-width: 440px;
  max-height: min(90vh, 720px);
  overflow: auto;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.rec-cycle-tr-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 18px;
  border-bottom: 1px solid #f0f0f0;
}

.rec-cycle-tr-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #111827;
  line-height: 1.35;
}

.rec-cycle-tr-body {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.rec-cycle-tr-lead {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: #4b5563;
}

.rec-cycle-tr-radio-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.rec-cycle-tr-radio {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
}

.rec-cycle-tr-radio input {
  accent-color: #2563eb;
}

.rec-cycle-tr-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

@media (max-width: 520px) {
  .rec-cycle-tr-split {
    grid-template-columns: 1fr;
  }
}

.rec-cycle-tr-err {
  margin: 0;
  font-size: 12.5px;
  color: #b91c1c;
}

.rec-cycle-tr-foot {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 18px 16px;
  border-top: 1px solid #f0f0f0;
}
</style>
