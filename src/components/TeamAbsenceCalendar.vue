<script setup>
import { toRef, watch } from 'vue'
import {
  UiIconButton, UiSelect, UiSearchField, UiButton, UiField, UiTextField,
  UiSwitcher, UiSwitcherTab,
} from '@/components/ui'
import {
  ChevronLeft, ChevronRight, Settings, Users, Plus, Pencil, Trash2, Check, X,
} from 'lucide-vue-next'
import { useTeamAbsenceCalendar } from '@/composables/useTeamAbsenceCalendar'

const props = defineProps({
  /** ISO date YYYY-MM-DD — превью диапазона в форме новой заявки (только строка сотрудника) */
  draftFrom: { type: String, default: '' },
  draftTo: { type: String, default: '' },
  /** Тип из формы — для согласования с фильтром «Отпуск / больничный…» */
  draftType: { type: String, default: 'Ежегодный' },
})

const {
  COLLEAGUES,
  currentUser,
  teamSearchQuery,
  teamFilter,
  teamSubTab,
  showTeamListModal,
  myTeams,
  activeGroupKey,
  showTeamModal,
  editingTeam,
  teamModalName,
  teamModalMembers,
  teamSubTabCount,
  openCreateTeam,
  openEditTeam,
  saveTeamModal,
  deleteTeam,
  toggleTeamMember,
  teamMonthTitle,
  prevTeamMonth,
  nextTeamMonth,
  goTeamToday,
  syncTeamCalendarToIso,
  teamMonthDays,
  teamTimelineMinWidth,
  teamColleaguesFiltered,
  teamCalRowsOrdered,
  getTeamSegments,
  colleagueInitials,
  teamFilterOptions,
  teamGroupSelectOptions,
  teamConflictDates,
} = useTeamAbsenceCalendar({
  draftFrom: toRef(props, 'draftFrom'),
  draftTo: toRef(props, 'draftTo'),
  draftType: toRef(props, 'draftType'),
})

watch(
  () => props.draftFrom || props.draftTo,
  iso => {
    if (iso) syncTeamCalendarToIso(iso)
  },
)

/** Подсветка столбцов дней, попадающих в план заявки (сверху вниз) */
function isDraftPlanColumn(iso) {
  const a = props.draftFrom
  const b = props.draftTo
  if (!a || !b || a > b) return false
  return iso >= a && iso <= b
}
</script>

<template>
  <div class="card team-cal-card">
    <div class="team-cal-topbar">
      <div class="team-cal-topbar-names">
        <UiSwitcher v-model="teamSubTab" variant="text">
          <UiSwitcherTab id="dept">Отделение</UiSwitcherTab>
          <UiSwitcherTab id="team">Команда{{ teamSubTabCount ? ' ' + teamSubTabCount : '' }}</UiSwitcherTab>
        </UiSwitcher>
      </div>
      <div class="team-cal-topbar-tools">
        <div class="team-cal-tools-left">
          <button type="button" class="btn-team-today" @click="goTeamToday">Текущий месяц</button>
          <div class="team-cal-nav">
            <UiIconButton type="button" size="nav" aria-label="Предыдущий месяц" @click="prevTeamMonth">
              <ChevronLeft :size="14" stroke-width="2" />
            </UiIconButton>
            <span class="team-cal-month-label">{{ teamMonthTitle() }}</span>
            <UiIconButton type="button" size="nav" aria-label="Следующий месяц" @click="nextTeamMonth">
              <ChevronRight :size="14" stroke-width="2" />
            </UiIconButton>
          </div>
        </div>
        <div class="team-cal-tools-right">
          <label class="team-cal-filter-wrap">
            <span class="visually-hidden">Тип отсутствия</span>
            <UiSelect v-model="teamFilter" variant="teamFilter" :options="teamFilterOptions" />
          </label>
        </div>
      </div>
    </div>

    <div v-if="teamSubTab === 'dept' || (teamSubTab === 'team' && myTeams.length)" class="team-cal-body">
      <div class="team-cal-names-col">
        <div class="team-cal-corner">
          <template v-if="teamSubTab === 'team'">
            <div class="team-cal-selector">
              <div class="team-cal-select-grow">
                <UiSelect v-model="activeGroupKey" variant="toolbar" full-width :options="teamGroupSelectOptions" />
              </div>
              <div class="tc-gear-wrap">
                <button
                  type="button"
                  class="tc-gear-btn"
                  title="Управление командами"
                  @click="showTeamListModal = true"
                >
                  <Settings :size="15" stroke-width="2" />
                </button>
              </div>
            </div>
          </template>
          <UiSearchField
            v-else
            v-model="teamSearchQuery"
            variant="dense"
            class="team-cal-search"
            placeholder="Поиск"
            autocomplete="off"
          />
        </div>
        <div
          v-for="emp in teamCalRowsOrdered"
          :key="emp.id"
          class="team-cal-emp-row"
        >
          <div class="team-cal-avatar-col">
            <div class="team-cal-avatar-wrap">
              <div class="team-cal-avatar" aria-hidden="true">{{ colleagueInitials(emp.name) }}</div>
              <div
                v-if="emp.name === currentUser.name"
                class="team-cal-crown-badge"
                title="Вы"
              >
                <svg
                  class="team-cal-crown-fg"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="10"
                  height="10"
                  aria-hidden="true"
                >
                  <path
                    fill="currentColor"
                    d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"
                  />
                </svg>
              </div>
            </div>
          </div>
          <div class="team-cal-emp-meta">
            <div class="team-cal-emp-name">{{ emp.name }}</div>
            <div class="team-cal-emp-role">{{ emp.role }}</div>
          </div>
        </div>
      </div>
      <div class="team-cal-scroll">
        <div class="team-cal-timeline" :style="{ minWidth: teamTimelineMinWidth }">
          <div
            class="team-cal-days-header"
            :style="{ gridTemplateColumns: `repeat(${teamMonthDays.length}, minmax(22px, 1fr))` }"
          >
            <div
              v-for="d in teamMonthDays"
              :key="d.iso"
              :class="[
                'team-cal-day-h',
                {
                  weekend: d.isWeekend,
                  today: d.isToday,
                  conflict: teamConflictDates.has(d.iso),
                  'team-cal-day-h--draft-col': isDraftPlanColumn(d.iso),
                },
              ]"
            >
              <span class="team-cal-day-num">{{ d.dayNum }}</span>
              <span class="team-cal-day-dow">{{ d.dowShort }}</span>
            </div>
          </div>
          <div
            v-for="emp in teamCalRowsOrdered"
            :key="'tr-' + emp.id"
            class="team-cal-track-row"
          >
            <div class="team-cal-track">
              <div
                class="team-cal-cells"
                :style="{ gridTemplateColumns: `repeat(${teamMonthDays.length}, minmax(22px, 1fr))` }"
              >
                <div
                  v-for="d in teamMonthDays"
                  :key="d.iso"
                  :class="[
                    'team-cal-cell',
                    {
                      weekend: d.isWeekend,
                      'team-cal-cell--draft-col': isDraftPlanColumn(d.iso),
                    },
                  ]"
                />
              </div>
              <div
                v-for="(seg, si) in getTeamSegments(emp.name)"
                :key="seg.draft ? `draft-${emp.id}` : `seg-${emp.id}-${si}`"
                :class="['team-seg', seg.class, { 'team-seg--pending': seg.pending && !seg.draft, 'team-seg--draft': seg.draft }]"
                :style="{ left: seg.leftPct + '%', width: seg.widthPct + '%' }"
                v-tooltip="{ content: seg.tooltip, placement: 'top', delay: { show: 180, hide: 0 }, triggers: ['hover', 'focus'] }"
              >
                <span class="team-seg-txt">{{ seg.label }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <p v-if="teamColleaguesFiltered.length === 0 && teamSubTab === 'dept'" class="team-cal-empty">Никого не найдено — измените поиск.</p>
    <div v-if="teamSubTab === 'team' && !myTeams.length" class="team-cal-empty-state">
      <Users :size="32" stroke-width="1.5" class="team-cal-empty-ic" />
      <p class="team-cal-empty-title">У вас пока нет команд</p>
      <p class="team-cal-empty-desc">Создайте команду, чтобы отслеживать отсутствия коллег</p>
      <UiButton variant="primary" size="sm" @click="openCreateTeam">
        <Plus :size="14" stroke-width="2" /> Создать команду
      </UiButton>
    </div>
    <p v-if="teamSubTab === 'team' && myTeams.length && teamColleaguesFiltered.length === 0" class="team-cal-empty">В команде пока нет участников.</p>
  </div>

  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showTeamListModal" class="modal-overlay" @click.self="showTeamListModal = false">
        <div class="modal tc-modal tc-team-list-modal" role="dialog" aria-labelledby="tc-team-list-title">
          <div class="modal-header">
            <h3 id="tc-team-list-title" class="modal-title">Мои команды</h3>
            <UiIconButton type="button" size="sm" aria-label="Закрыть" @click="showTeamListModal = false"><X :size="16" stroke-width="2" /></UiIconButton>
          </div>
          <div class="modal-body tc-tlist-body">
            <template v-if="myTeams.length">
              <div class="tc-tlist">
                <div v-for="t in myTeams" :key="t.id" class="tc-tlist-item">
                  <div class="tc-tlist-icon" aria-hidden="true">
                    <Users :size="15" stroke-width="1.75" />
                  </div>
                  <div class="tc-tlist-info">
                    <span class="tc-tlist-name">{{ t.name }}</span>
                    <span class="tc-tlist-meta">{{ t.members.length }} {{ t.members.length === 1 ? 'участник' : t.members.length < 5 ? 'участника' : 'участников' }}</span>
                  </div>
                  <div class="tc-tlist-actions">
                    <button type="button" class="tc-tlist-btn" title="Редактировать" @click="openEditTeam(t)">
                      <Pencil :size="13" stroke-width="2" />
                    </button>
                    <button type="button" class="tc-tlist-btn tc-tlist-btn--del" title="Удалить" @click="deleteTeam(t.id)">
                      <Trash2 :size="13" stroke-width="2" />
                    </button>
                  </div>
                </div>
              </div>
            </template>
            <div v-else class="tc-tlist-empty">
              <div class="tc-tlist-empty-icon"><Users :size="28" stroke-width="1.5" /></div>
              <p class="tc-tlist-empty-title">Команд пока нет</p>
              <p class="tc-tlist-empty-desc">Создайте команду, чтобы следить за нужными коллегами</p>
            </div>
          </div>
          <div class="modal-footer">
            <UiButton variant="secondary" @click="showTeamListModal = false">Закрыть</UiButton>
            <UiButton variant="primary" @click="openCreateTeam">
              <Plus :size="14" stroke-width="2" /> Создать команду
            </UiButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showTeamModal" class="modal-overlay" @click.self="showTeamModal = false">
        <div class="modal tc-modal">
          <div class="modal-header">
            <h3 class="modal-title">{{ editingTeam ? 'Изменить команду' : 'Новая команда' }}</h3>
            <UiIconButton type="button" size="sm" aria-label="Закрыть" @click="showTeamModal = false"><X :size="16" stroke-width="2" /></UiIconButton>
          </div>
          <div class="modal-body">
            <UiField label="Название команды">
              <UiTextField
                v-model="teamModalName"
                placeholder="Например: Дизайн + Разработка"
                autofocus
                full-width
                @keydown.enter="saveTeamModal"
              />
            </UiField>
            <label class="form-label" style="margin-top: 14px">Участники</label>
            <div class="tc-members-list">
              <label
                v-for="c in COLLEAGUES"
                :key="c.id"
                :class="['tc-member-item', { selected: teamModalMembers.has(c.id) }]"
                @click="toggleTeamMember(c.id)"
              >
                <span class="tc-member-av">{{ colleagueInitials(c.name) }}</span>
                <span class="tc-member-info">
                  <span class="tc-member-name">{{ c.name }}</span>
                  <span class="tc-member-role">{{ c.role }}</span>
                </span>
                <span class="tc-member-check">
                  <Check v-if="teamModalMembers.has(c.id)" :size="13" stroke-width="2.5" />
                </span>
              </label>
            </div>
          </div>
          <div class="modal-footer">
            <UiButton variant="secondary" @click="showTeamModal = false">Отмена</UiButton>
            <UiButton variant="primary" :disabled="!teamModalName.trim() || !teamModalMembers.size" @click="saveTeamModal">
              {{ editingTeam ? 'Сохранить' : 'Создать' }}
            </UiButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* ── Team calendar (Gantt) ── */
.card.team-cal-card {
  padding: 0;
  overflow: visible;
}

.team-cal-topbar {
  display: flex;
  align-items: stretch;
  width: 100%;
  border-bottom: 1px solid #ececec;
  border-radius: 10px 10px 0 0;
  overflow: hidden;
}
.team-cal-topbar-names {
  flex: 0 0 240px;
  min-width: 0;
  display: flex;
  align-items: center;
  padding: 10px 12px;
  border-right: 1px solid #ececec;
  background: #fafafa;
  box-sizing: border-box;
}
.team-cal-topbar-tools {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px 16px;
  padding: 10px 20px 10px 14px;
  background: #fff;
}
.team-cal-tools-left {
  display: flex;
  align-items: center;
  gap: 12px 18px;
  flex-wrap: wrap;
  min-width: 0;
}
.team-cal-tools-right {
  flex-shrink: 0;
}
.team-cal-filter-wrap { display: block; }

.team-cal-selector {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  min-width: 0;
}
.team-cal-select-grow {
  flex: 1;
  min-width: 0;
}

.tc-gear-wrap {
  flex-shrink: 0;
}
.tc-gear-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px; height: 32px;
  border-radius: 6px;
  border: 1px solid #e5e5e5;
  background: #fff;
  color: #888;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.12s, color 0.12s, border-color 0.12s;
}
.tc-gear-btn:hover { background: #f5f5f5; color: #444; border-color: #ccc; }

.tc-team-list-modal {
  max-width: 420px;
  width: calc(100% - 32px);
}

.tc-tlist-body {
  padding: 8px 0 4px;
  max-height: min(380px, 65vh);
  overflow-y: auto;
}

.tc-tlist {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0 16px;
}
.tc-tlist-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 14px;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 10px;
  transition: background 0.12s, border-color 0.12s;
}
.tc-tlist-item:hover {
  background: #f5f0fc;
  border-color: #e0d4f7;
}
.tc-tlist-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: #ede8fc;
  color: #7c5cc4;
  flex-shrink: 0;
}
.tc-tlist-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.tc-tlist-name {
  font-size: 13.5px;
  font-weight: 600;
  color: #1a1a1a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.tc-tlist-meta {
  font-size: 11.5px;
  color: #999;
  font-weight: 400;
}
.tc-tlist-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}
.tc-tlist-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 7px;
  border: 1px solid transparent;
  background: transparent;
  color: #bbb;
  cursor: pointer;
  transition: background 0.12s, color 0.12s, border-color 0.12s;
  flex-shrink: 0;
}
.tc-tlist-btn:hover {
  background: #fff;
  border-color: #e5e5e5;
  color: #555;
}
.tc-tlist-btn--del:hover {
  background: #fff5f5;
  border-color: #fcd0d0;
  color: #e05a5a;
}

.tc-tlist-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 36px 24px;
  text-align: center;
}
.tc-tlist-empty-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: #f2eefb;
  color: #a88de8;
  margin-bottom: 4px;
}
.tc-tlist-empty-title {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
}
.tc-tlist-empty-desc {
  font-size: 12.5px;
  color: #999;
  margin: 0;
  max-width: 260px;
  line-height: 1.5;
}

.team-cal-nav { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.team-cal-month-label {
  font-size: 15px; font-weight: 600; color: #1a1a1a;
  min-width: 140px; text-align: center;
}
.btn-team-today {
  background: none;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 12.5px;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  font-family: inherit;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.12s, color 0.12s, border-color 0.12s;
}
.btn-team-today:hover {
  background: #f5f5f5;
  color: #444;
  border-color: #ddd;
}

.visually-hidden {
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap; border: 0;
}

.team-cal-body {
  display: flex;
  align-items: stretch;
  width: 100%;
  border: none;
  border-radius: 0;
  overflow: visible;
  background: #fff;
}
.team-cal-names-col {
  flex: 0 0 240px;
  border-right: 1px solid #ececec;
  background: #fafafa;
  min-width: 0;
  overflow: visible;
  border-bottom-left-radius: 10px;
}
.team-cal-corner {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid #ececec;
  min-height: 52px;
  justify-content: center;
  box-sizing: border-box;
  overflow: visible;
}

.team-cal-search {
  width: 100%;
}
.team-cal-emp-row {
  display: flex; align-items: center; gap: 10px;
  min-height: 52px;
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
}
.team-cal-emp-row:last-child { border-bottom: none; }
.team-cal-avatar-col {
  flex-shrink: 0;
}
.team-cal-avatar-wrap {
  position: relative;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
}
.team-cal-crown-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  border: 1px solid rgba(234, 88, 12, 0.22);
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  z-index: 1;
  color: #ea580c;
}
.team-cal-crown-fg {
  display: block;
  flex-shrink: 0;
}
.team-cal-avatar {
  width: 32px; height: 32px; border-radius: 50%;
  background: linear-gradient(135deg, #e8e8e8, #d4d4d4);
  color: #555;
  font-size: 11px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.team-cal-emp-meta { min-width: 0; }
.team-cal-emp-name {
  font-size: 12.5px; font-weight: 600; color: #222;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.team-cal-emp-role {
  font-size: 10.5px; color: #999;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.team-cal-scroll {
  flex: 1;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  background: #fff;
  border-bottom-right-radius: 10px;
}
.team-cal-timeline { padding-bottom: 0; }

.team-cal-days-header {
  display: grid;
  min-height: 52px;
  height: 52px;
  border-bottom: 1px solid #ececec;
  background: #fff;
  align-items: stretch;
}
.team-cal-day-h {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  font-size: 10px;
  color: #999;
  border-left: 1px solid #f3f3f3;
  box-sizing: border-box;
  transition: filter 0.12s ease;
}
.team-cal-day-h:hover {
  filter: brightness(0.98);
}
.team-cal-day-h:first-child { border-left: none; }
.team-cal-day-h.weekend { background: #f5f5f5; }
.team-cal-day-h.weekend:hover {
  filter: brightness(0.97);
}
.team-cal-day-h.today .team-cal-day-num {
  background: #1a1a1a; color: #fff;
  border-radius: 50%;
  width: 22px; height: 22px;
  display: flex; align-items: center; justify-content: center;
}
.team-cal-day-h.conflict { position: relative; }
.team-cal-day-h.conflict::after {
  content: '';
  position: absolute;
  bottom: 4px;
  left: 50%; transform: translateX(-50%);
  width: 5px; height: 5px;
  border-radius: 50%;
  background: #f97316;
}

/* Столбцы плана — лёгкий синий оверлей, без рамок */
.team-cal-day-h.team-cal-day-h--draft-col {
  background: rgba(59, 130, 246, 0.08);
}
.team-cal-day-h.team-cal-day-h--draft-col.weekend {
  background: rgba(59, 130, 246, 0.11);
}

.team-cal-day-num { font-weight: 600; color: #444; font-size: 11px; line-height: 1.2; }
.team-cal-day-dow { font-size: 9px; color: #bbb; margin-top: 2px; }

.team-cal-track-row { border-bottom: 1px solid #f0f0f0; min-height: 52px; }
.team-cal-track-row:last-child { border-bottom: none; }

.team-cal-track {
  position: relative;
  height: 100%;
  min-height: 52px;
}
.team-cal-cells {
  display: grid;
  height: 100%;
  min-height: 52px;
}
.team-cal-cell {
  border-left: 1px solid #f3f3f3;
  min-height: 52px;
  transition: filter 0.12s ease;
}
.team-cal-cell:hover {
  filter: brightness(0.98);
}
.team-cal-cell:first-child { border-left: none; }
.team-cal-cell.weekend { background: #fafafa; }
.team-cal-cell.weekend:hover {
  filter: brightness(0.97);
}

.team-cal-cell.team-cal-cell--draft-col {
  background: rgba(59, 130, 246, 0.06);
}
.team-cal-cell.team-cal-cell--draft-col.weekend {
  background: rgba(59, 130, 246, 0.09);
}

.team-seg {
  position: absolute;
  top: 8px;
  bottom: 8px;
  border-radius: 4px;
  display: flex; align-items: center;
  padding: 0 6px;
  min-width: 0;
  box-sizing: border-box;
  overflow: hidden;
  z-index: 1;
  transition: filter 0.12s ease;
  cursor: default;
}
.team-seg:hover {
  filter: brightness(0.97);
}
.team-seg--vacation { background: #ffe8cc; color: #b45309; }
.team-seg--sick { background: #ede9fe; color: #5b21b6; }
.team-seg--trip { background: #ccfbf1; color: #0f766e; }
.team-seg--remote { background: #dbeafe; color: #1d4ed8; }
.team-seg--pending {
  background-image: repeating-linear-gradient(
    -45deg,
    transparent,
    transparent 4px,
    rgba(255, 255, 255, 0.35) 4px,
    rgba(255, 255, 255, 0.35) 8px
  );
}

/* План заявки — тот же лёгкий синий тон, чуть заметнее полосы */
.team-seg.team-seg--draft {
  z-index: 2;
  background: rgba(191, 219, 254, 0.88);
  color: #1e40af;
  border: 1px dashed rgba(59, 130, 246, 0.45);
  box-sizing: border-box;
  box-shadow: none;
}
.team-seg.team-seg--draft:hover {
  filter: none;
  background: rgba(191, 219, 254, 0.95);
}

.team-seg-txt {
  font-size: 10px; font-weight: 600;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.team-cal-empty {
  text-align: center;
  color: #999;
  font-size: 13px;
  margin-top: 14px;
  padding-left: 20px;
  padding-right: 20px;
}
.team-cal-card > .team-cal-empty:last-child {
  border-radius: 0 0 10px 10px;
}
.team-cal-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 48px 20px;
  border-radius: 0 0 10px 10px;
  overflow: hidden;
}
.team-cal-empty-ic { color: #ccc; }
.team-cal-empty-title {
  font-size: 15px;
  font-weight: 600;
  color: #444;
  margin: 4px 0 0;
}
.team-cal-empty-desc {
  font-size: 13px;
  color: #999;
  margin: 0;
}

.tc-modal.modal { width: 420px; }
.tc-members-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 280px;
  overflow-y: auto;
  border: 1px solid #ececec;
  border-radius: 8px;
  padding: 6px;
}
.tc-member-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 7px;
  cursor: pointer;
  transition: background 0.1s;
  user-select: none;
}
.tc-member-item:hover { background: #f5f5f5; }
.tc-member-item.selected { background: #f0ecfb; }
.tc-member-av {
  width: 32px; height: 32px;
  border-radius: 8px;
  background: #e8e8e8;
  color: #555;
  font-size: 11px;
  font-weight: 600;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.tc-member-item.selected .tc-member-av { background: #d4c9f5; color: #6b46c1; }
.tc-member-info {
  display: flex; flex-direction: column; gap: 1px; flex: 1; min-width: 0;
}
.tc-member-name { font-size: 13px; font-weight: 500; color: #1a1a1a; }
.tc-member-role { font-size: 11.5px; color: #999; }
.tc-member-check {
  width: 20px; height: 20px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 5px;
  flex-shrink: 0;
  color: #7c5cc4;
}

.form-label {
  font-size: 12px;
  color: #888;
  font-weight: 450;
  display: block;
}

/* Modal base (teleported) */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.modal {
  background: #fff;
  border-radius: 12px;
  width: 360px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  overflow: hidden;
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}
.modal-title { font-size: 14px; font-weight: 500; color: #1a1a1a; }
.modal-body { padding: 20px; display: flex; flex-direction: column; gap: 14px; }
.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
}

.card {
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 10px;
}
</style>
