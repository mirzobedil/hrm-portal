import { ref } from 'vue'
import { createInitialVacationRequests } from '@/data/vacationRequests'

const allRequests = ref(createInitialVacationRequests())

export function useVacationRequests() {
  return { allRequests }
}
