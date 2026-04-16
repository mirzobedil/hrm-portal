import { ref } from 'vue'
import { createDemoTasks } from '@/data/tasksDemo'

/** Bitta demo manba — ro‘yxat, kanban va detail sahifa uchun. */
const tasks = ref(createDemoTasks())

/** Заголовок в шапке (App) и везде, где нужен доступ без вызова composable. */
export function resolveTaskById(rawId) {
  const id = Number(rawId)
  if (Number.isNaN(id)) return null
  return tasks.value.find((t) => t.id === id) ?? null
}

export function useTasks() {
  function taskById(rawId) {
    return resolveTaskById(rawId)
  }

  function nextTaskId() {
    return tasks.value.reduce((m, t) => Math.max(m, t.id), 0) + 1
  }

  /** To‘liq task obyektini qo‘shish (modalkadan) */
  function addTask(task) {
    tasks.value.push(task)
  }

  return { tasks, taskById, nextTaskId, addTask }
}
