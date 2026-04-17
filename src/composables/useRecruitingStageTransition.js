import { ref, computed, onUnmounted } from 'vue'
import {
  REC_CYCLE_STAGES,
  touchRecruitmentCandidates,
} from '@/data/recruitingVacancyCycleDemo.js'
import { evaluateStageDrop, forwardModalKind } from '@/utils/recruitingStageTransitions.js'

/**
 * @param {object} ctx
 * @param {() => object[]} ctx.getPool тот же массив кандидатов, что и канбан (REC_CYCLE_CANDIDATES)
 * @param {() => string} ctx.getVacancyId id вакансии для фильтрации строки в пуле
 * @param {(c: object) => boolean} ctx.rowMatches фильтр строки (канбан или «только эта вакансия»)
 */
export function useRecruitingStageTransition({ getPool, getVacancyId, rowMatches }) {
  const cycleTransitionOpen = ref(false)
  const cyclePending = ref(null)
  const cycleTransitionForm = ref({
    passFail: 'passed',
    comment: '',
    testScore: '',
    sbResult: 'approved',
    complianceResult: 'approved',
    sbComment: '',
    complianceComment: '',
    rejectReason: '',
    newNote: '',
  })
  const cycleTransitionError = ref('')
  const cycleToast = ref('')
  let cycleToastTimer = null

  function showCycleToast(msg) {
    cycleToast.value = String(msg ?? '')
    if (cycleToastTimer) clearTimeout(cycleToastTimer)
    cycleToastTimer = setTimeout(() => {
      cycleToast.value = ''
    }, 4200)
  }

  onUnmounted(() => {
    if (cycleToastTimer) clearTimeout(cycleToastTimer)
  })

  function stageTitle(stageId) {
    const s = REC_CYCLE_STAGES.find((x) => x.id === stageId)
    return s?.label ?? stageId
  }

  function resetCycleTransitionForm() {
    cycleTransitionError.value = ''
    cycleTransitionForm.value = {
      passFail: 'passed',
      comment: '',
      testScore: '',
      sbResult: 'approved',
      complianceResult: 'approved',
      sbComment: '',
      complianceComment: '',
      rejectReason: '',
      newNote: '',
    }
  }

  function closeCycleTransition() {
    cycleTransitionOpen.value = false
    cyclePending.value = null
    cycleTransitionError.value = ''
  }

  const cycleModalTitle = computed(() => {
    const p = cyclePending.value
    if (!p) return ''
    if (p.decision === 'reject') return 'Отказ в найме'
    if (p.decision === 'restore') return 'Восстановить кандидата'
    if (p.decision === 'forward_new') return 'Переход на телефонное интервью'
    if (p.decision === 'forward_interview') return `Фиксация: ${stageTitle(p.fromStage)}`
    if (p.decision === 'forward_test') return 'Результаты тестирования'
    if (p.decision === 'forward_compliance') return 'Проверка СБ и комплаенс'
    return 'Смена этапа'
  })

  function stageOrderIndex(stageId) {
    const i = REC_CYCLE_STAGES.findIndex((s) => s.id === stageId)
    return i === -1 ? 999 : i
  }

  function applyStageToCandidate(moving, targetStageId) {
    if (targetStageId === 'failed') {
      moving.stageId = 'failed'
      moving.pipeline = 'rejected'
      if (!moving.failedReason) moving.failedReason = 'Переведено в отказ'
    } else {
      moving.stageId = targetStageId
      moving.pipeline = 'active'
      delete moving.failedReason
    }
  }

  function insertCandidateIntoPool(pool, moving, vid, targetStageId, insertAt) {
    const siblings = pool.filter(
      (c) => c.vacancyId === vid && rowMatches(c) && c.stageId === targetStageId,
    )
    const insertIdx = Math.min(Math.max(0, insertAt), siblings.length)

    if (siblings.length === 0) {
      let pos = pool.length
      for (let i = 0; i < pool.length; i++) {
        const c = pool[i]
        if (c.vacancyId !== vid || !rowMatches(c)) continue
        if (stageOrderIndex(c.stageId) > stageOrderIndex(targetStageId)) {
          pos = i
          break
        }
      }
      if (pos === pool.length) {
        for (let i = pool.length - 1; i >= 0; i--) {
          if (pool[i].vacancyId === vid) {
            pos = i + 1
            break
          }
        }
      }
      pool.splice(pos, 0, moving)
      return
    }

    if (insertIdx >= siblings.length) {
      const last = siblings[siblings.length - 1]
      const pos = pool.findIndex((c) => c.id === last.id)
      pool.splice(pos + 1, 0, moving)
    } else {
      const before = siblings[insertIdx]
      const pos = pool.findIndex((c) => c.id === before.id)
      pool.splice(pos, 0, moving)
    }
  }

  function mergePipelineResult(moving, stageKey, data) {
    if (!moving.pipelineResults) moving.pipelineResults = {}
    moving.pipelineResults[stageKey] = {
      ...data,
      at: new Date().toISOString(),
    }
  }

  function insertAtAppendFailed(pool, vid, targetStageId) {
    return pool.filter(
      (c) => c.vacancyId === vid && rowMatches(c) && c.stageId === targetStageId,
    ).length
  }

  function computeAppendInsertAt(pool, vid, targetStageId, excludeCandidateId) {
    return pool.filter(
      (c) =>
        c.vacancyId === vid &&
        rowMatches(c) &&
        c.stageId === targetStageId &&
        c.id !== excludeCandidateId,
    ).length
  }

  function confirmCycleTransition() {
    const p = cyclePending.value
    if (!p) return
    const vid = getVacancyId()
    const pool = getPool()
    const idx = pool.findIndex((x) => x.id === p.candidateId && x.vacancyId === vid)
    if (idx === -1) {
      closeCycleTransition()
      return
    }
    const moving = pool[idx]
    const f = cycleTransitionForm.value

    const done = () => {
      touchRecruitmentCandidates()
      closeCycleTransition()
    }

    if (p.decision === 'reject') {
      const reason = f.rejectReason.trim()
      if (reason.length < 3) {
        cycleTransitionError.value = 'Укажите причину отказа (не менее 3 символов).'
        return
      }
      pool.splice(idx, 1)
      applyStageToCandidate(moving, 'failed')
      moving.failedReason = reason
      insertCandidateIntoPool(pool, moving, vid, 'failed', p.insertAt)
      done()
      return
    }

    if (p.decision === 'restore') {
      pool.splice(idx, 1)
      applyStageToCandidate(moving, p.toStage)
      insertCandidateIntoPool(pool, moving, vid, p.toStage, p.insertAt)
      done()
      return
    }

    if (p.decision === 'forward_new') {
      const note = f.newNote.trim()
      pool.splice(idx, 1)
      if (note) mergePipelineResult(moving, 'new', { comment: note })
      applyStageToCandidate(moving, p.toStage)
      insertCandidateIntoPool(pool, moving, vid, p.toStage, p.insertAt)
      done()
      return
    }

    if (p.decision === 'forward_interview') {
      const comment = f.comment.trim()
      if (comment.length < 2) {
        cycleTransitionError.value = 'Введите комментарий по результату (ТЗ: обязательное поле).'
        return
      }
      const passed = f.passFail === 'passed'
      pool.splice(idx, 1)
      mergePipelineResult(moving, p.fromStage, { passed, comment })
      if (!passed) {
        applyStageToCandidate(moving, 'failed')
        moving.failedReason = comment.slice(0, 280) || 'Не пройдено'
        const insertFailed = insertAtAppendFailed(pool, vid, 'failed')
        insertCandidateIntoPool(pool, moving, vid, 'failed', insertFailed)
      } else {
        applyStageToCandidate(moving, p.toStage)
        insertCandidateIntoPool(pool, moving, vid, p.toStage, p.insertAt)
      }
      done()
      return
    }

    if (p.decision === 'forward_test') {
      const comment = f.comment.trim()
      if (comment.length < 2) {
        cycleTransitionError.value = 'Введите комментарий по тестированию.'
        return
      }
      const passed = f.passFail === 'passed'
      const scoreRaw = f.testScore.trim()
      const score = scoreRaw === '' ? null : Number(scoreRaw)
      pool.splice(idx, 1)
      mergePipelineResult(moving, 'test', {
        passed,
        comment,
        score: Number.isFinite(score) ? score : null,
      })
      if (!passed) {
        applyStageToCandidate(moving, 'failed')
        moving.failedReason = comment.slice(0, 280) || 'Тест не пройден'
        const insertFailed = insertAtAppendFailed(pool, vid, 'failed')
        insertCandidateIntoPool(pool, moving, vid, 'failed', insertFailed)
      } else {
        applyStageToCandidate(moving, p.toStage)
        insertCandidateIntoPool(pool, moving, vid, p.toStage, p.insertAt)
      }
      done()
      return
    }

    if (p.decision === 'forward_compliance') {
      const sb = f.sbResult
      const comp = f.complianceResult
      pool.splice(idx, 1)
      mergePipelineResult(moving, 'compliance', {
        sb,
        compliance: comp,
        sbComment: f.sbComment.trim() || null,
        complianceComment: f.complianceComment.trim() || null,
      })
      if (sb === 'rejected' || comp === 'rejected') {
        applyStageToCandidate(moving, 'failed')
        moving.failedReason = 'Отклонено СБ или комплаенс'
        const insertFailed = insertAtAppendFailed(pool, vid, 'failed')
        insertCandidateIntoPool(pool, moving, vid, 'failed', insertFailed)
      } else {
        applyStageToCandidate(moving, p.toStage)
        insertCandidateIntoPool(pool, moving, vid, p.toStage, p.insertAt)
      }
      done()
      return
    }

    closeCycleTransition()
  }

  /**
   * Смена этапа с карточки кандидата: вставка в конец колонки назначения.
   */
  function beginStageTransitionFromProfile(candidateId, targetStageId) {
    const pool = getPool()
    const vid = getVacancyId()
    const idx = pool.findIndex((x) => x.id === candidateId && x.vacancyId === vid)
    if (idx === -1) return false
    const oldStage = pool[idx].stageId
    if (oldStage === targetStageId) return false

    const ev = evaluateStageDrop(oldStage, targetStageId)
    if (!ev.allowed) {
      showCycleToast(ev.reason || 'Перемещение недоступно.')
      return false
    }

    const insertAt = computeAppendInsertAt(pool, vid, targetStageId, candidateId)

    if (ev.decision === 'reject') {
      cyclePending.value = {
        candidateId,
        fromStage: oldStage,
        toStage: 'failed',
        decision: 'reject',
        insertAt,
      }
      resetCycleTransitionForm()
      cycleTransitionOpen.value = true
      return true
    }

    if (ev.decision === 'restore') {
      cyclePending.value = {
        candidateId,
        fromStage: 'failed',
        toStage: targetStageId,
        decision: 'restore',
        insertAt,
      }
      resetCycleTransitionForm()
      cycleTransitionOpen.value = true
      return true
    }

    if (ev.decision === 'forward') {
      const fk = forwardModalKind(oldStage)
      if (fk === 'forward_unknown') {
        showCycleToast('Для этого этапа форма не настроена.')
        return false
      }
      cyclePending.value = {
        candidateId,
        fromStage: oldStage,
        toStage: targetStageId,
        decision: fk,
        insertAt,
      }
      resetCycleTransitionForm()
      cycleTransitionOpen.value = true
      return true
    }

    showCycleToast('Не удалось обработать перемещение.')
    return false
  }

  /**
   * Логика после drag-drop на канбане (insertAt уже рассчитан по курсору).
   */
  function beginStageTransitionFromKanban({ candidateId, targetStageId, insertAt }) {
    const pool = getPool()
    const vid = getVacancyId()
    const idx = pool.findIndex((x) => x.id === candidateId && x.vacancyId === vid)
    if (idx === -1) return false
    const oldStage = pool[idx].stageId
    if (oldStage === targetStageId) return false

    const ev = evaluateStageDrop(oldStage, targetStageId)
    if (!ev.allowed) {
      showCycleToast(ev.reason || 'Перемещение недоступно.')
      return false
    }

    if (ev.decision === 'reject') {
      cyclePending.value = {
        candidateId,
        fromStage: oldStage,
        toStage: 'failed',
        decision: 'reject',
        insertAt,
      }
      resetCycleTransitionForm()
      cycleTransitionOpen.value = true
      return true
    }

    if (ev.decision === 'restore') {
      cyclePending.value = {
        candidateId,
        fromStage: 'failed',
        toStage: targetStageId,
        decision: 'restore',
        insertAt,
      }
      resetCycleTransitionForm()
      cycleTransitionOpen.value = true
      return true
    }

    if (ev.decision === 'forward') {
      const fk = forwardModalKind(oldStage)
      if (fk === 'forward_unknown') {
        showCycleToast('Для этого этапа форма не настроена.')
        return false
      }
      cyclePending.value = {
        candidateId,
        fromStage: oldStage,
        toStage: targetStageId,
        decision: fk,
        insertAt,
      }
      resetCycleTransitionForm()
      cycleTransitionOpen.value = true
      return true
    }

    showCycleToast('Не удалось обработать перемещение.')
    return false
  }

  return {
    cycleTransitionOpen,
    cyclePending,
    cycleTransitionForm,
    cycleTransitionError,
    cycleToast,
    cycleModalTitle,
    stageTitle,
    showCycleToast,
    closeCycleTransition,
    confirmCycleTransition,
    resetCycleTransitionForm,
    beginStageTransitionFromKanban,
    beginStageTransitionFromProfile,
  }
}
