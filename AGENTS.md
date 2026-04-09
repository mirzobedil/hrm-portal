# HRM Portal — контекст для разработки и AI

## Стек

- **Vue 3** (Composition API, `<script setup>`)
- **Vue Router 5**, **Vite 8**
- **Стили:** scoped CSS в SFC; общие карточки статистики — паттерн `stat-card` / `stats-grid` (как на `Dashboard.vue`)
- **Алиас:** `@` → `src/`

## Структура `src/`

| Путь | Назначение |
|------|------------|
| `App.vue` | Shell: сайдбар, роли (`staff` / `manager` / `hr` / `admin`), `provide('activeRole')`, уведомления |
| `router/index.js` | Маршруты; тяжёлые view — **lazy** (`import()`) |
| `views/Vacations.vue` | Крупный модуль отпусков (заявки, согласования, drawer, модалки). При больших изменениях — выносить в `components/vacations/*` или composables |
| `views/VacationPlanning.vue` | Планирование (Gantt) для HR |
| `components/StatusBadge.vue` | Бейджи статусов: одна строка, ellipsis, `title` |
| `constants/vacation.js` | `STATUS_LABELS`, `MANAGER_TEAM`, `VACATION_TYPES`, `isInManagerTeam` |

## Соглашения

- UI-тексты основного приложения — **русский** (как в макете).
- Роли: демо-переключатель в сайдбаре; в проде заменить на сессию/API.
- Новые общие подписи статусов — только в `constants/vacation.js` + при необходимости классы в `StatusBadge.vue`.
- Не раздувать diff: правки только по задаче; не рефакторить `Vacations.vue` целиком без запроса.

## Команды

```bash
npm run dev      # разработка
npm run build    # прод-сборка
npm run preview  # просмотр build
```

## Заметки для AI

- Перед правкой больших view — уточнить **файл и область** (например «только таблица заявок HR»).
- `Vacations.vue` очень большой: предпочтительно точечные правки или новые файлы рядом, а не переписывание всего модуля за один раз.
