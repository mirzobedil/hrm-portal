import { createRouter, createWebHistory } from 'vue-router'

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/',          name: 'dashboard', component: () => import('../views/Dashboard.vue') },
    {
      path: '/vacations',
      name: 'vacations',
      component: () => import('../views/Vacations.vue'),
    },
    {
      path: '/vacations/new',
      name: 'vacations-new',
      component: () => import('../views/VacationRequest.vue'),
      meta: { title: 'Новая заявка', parent: { name: 'Отпуска', to: '/vacations' } },
    },
    {
      path: '/vacations/plan',
      name: 'vacations-plan',
      component: () => import('../views/VacationStaffPlanning.vue'),
      meta: { title: 'Планирование отпуска', parent: { name: 'Отпуска', to: '/vacations' } },
    },
    {
      path: '/vacations/approvals',
      name: 'vacations-approvals',
      component: () => import('../views/Vacations.vue'),
    },
    { path: '/profile',    name: 'profile',     component: () => import('../views/Profile.vue'),   meta: { title: 'Мой профиль'  } },
    { path: '/attendance', name: 'attendance',  component: () => import('../views/Stub.vue'),      meta: { title: 'Посещаемость' } },
    { path: '/salary',     name: 'salary',      component: () => import('../views/Stub.vue'),      meta: { title: 'Зарплата'     } },
    { path: '/employees',  name: 'employees',   component: () => import('../views/Employees.vue'), meta: { title: 'Сотрудники'   } },
    { path: '/employees/:id', name: 'employee-profile', component: () => import('../views/EmployeeProfile.vue'), meta: { title: 'Профиль сотрудника', parent: { name: 'Сотрудники', to: '/employees' } } },
    { path: '/recruiting', name: 'recruiting',  component: () => import('../views/Recruiting.vue'), meta: { title: 'Рекрутинг'    } },
    { path: '/reports',    name: 'reports',     component: () => import('../views/Stub.vue'),      meta: { title: 'Отчёты'       } },
    { path: '/structure',  name: 'structure',   component: () => import('../views/Stub.vue'),      meta: { title: 'Структура'    } },
    { path: '/users',      name: 'users',       component: () => import('../views/Stub.vue'),      meta: { title: 'Пользователи' } },
    { path: '/settings',   name: 'settings',    component: () => import('../views/Stub.vue'),      meta: { title: 'Настройки'    } },
  ],
})
