/**
 * Логика переходов по этапам воронки для канбана «Цикл».
 * После этапа «СБ и комплаенс» следующий линейный шаг — колонка «Передача в ANET».
 * Возврат на предыдущий этап отключён; колонка «Отказ» — отдельно.
 */
export const REC_LINEAR_STAGES = ['new', 'phone', 'manager', 'director', 'test', 'compliance', 'anet']

export function linearStageIndex(stageId) {
  return REC_LINEAR_STAGES.indexOf(stageId)
}

/** Следующий этап по линейной воронке или null (после ANET следующего нет). */
export function getNextLinearStageId(current) {
  const i = REC_LINEAR_STAGES.indexOf(current)
  if (i === -1 || i >= REC_LINEAR_STAGES.length - 1) return null
  return REC_LINEAR_STAGES[i + 1]
}

/**
 * @returns {{ allowed: boolean, reason?: string, decision?: string, fromStage?: string, toStage?: string }}
 */
export function evaluateStageDrop(fromStage, toStage) {
  if (fromStage === toStage) {
    return { allowed: true, decision: 'reorder' }
  }
  if (toStage === 'failed') {
    return { allowed: true, decision: 'reject' }
  }
  if (fromStage === 'failed') {
    return { allowed: true, decision: 'restore' }
  }
  const fi = linearStageIndex(fromStage)
  const ti = linearStageIndex(toStage)
  if (fi === -1 || ti === -1) {
    return { allowed: false, reason: 'Некорректный этап.' }
  }
  if (ti === fi + 1) {
    return { allowed: true, decision: 'forward', fromStage, toStage }
  }
  if (ti > fi + 1) {
    return {
      allowed: false,
      reason: 'Перемещайте кандидата по этапам последовательно, без пропусков вперёд.',
    }
  }
  return {
    allowed: false,
    reason: 'Возврат на предыдущий этап в воронке отключён.',
  }
}

/** Какой диалог показать при согласованном шаге вперёд (from → from+1). */
/** Колонки канбана, куда можно перейти с текущего этапа (без смены на тот же). */
export function listAllowedTargetStages(fromStage, stagesList) {
  return stagesList.filter((col) => {
    if (col.id === fromStage) return false
    return evaluateStageDrop(fromStage, col.id).allowed
  })
}

export function forwardModalKind(fromStage) {
  switch (fromStage) {
    case 'new':
      return 'forward_new'
    case 'phone':
    case 'manager':
    case 'director':
      return 'forward_interview'
    case 'test':
      return 'forward_test'
    case 'compliance':
      return 'forward_compliance'
    default:
      return 'forward_unknown'
  }
}
