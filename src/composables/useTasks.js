import { ref } from 'vue'
import { createDemoTasks } from '@/data/tasksDemo'

/** Bitta demo manba — ro‘yxat, kanban va detail sahifa uchun. */
const tasks = ref(createDemoTasks())

export function useTasks() {
  function taskById(rawId) {
    const id = Number(rawId)
    if (Number.isNaN(id)) return null
    return tasks.value.find(t => t.id === id) ?? null
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
