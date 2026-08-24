# TaskFlow

TaskFlow — kanban-доска для командной работы над задачами. Проект построен на **React 18**, **TypeScript**, **Vite**, **Tailwind CSS** и **Supabase** (PostgreSQL, Auth, Realtime, Storage).

Пользователи создают доски, управляют колонками и карточками задач, назначают исполнителей, оставляют комментарии и приглашают участников по email.

## Реализованные уровни

### Level 1 — MVP

- [x] Аутентификация (email/password, Google OAuth)
- [x] Защита роутов (`ProtectedRoute`)
- [x] Список досок и CRUD
- [x] Kanban с drag-and-drop (`@dnd-kit`)
- [x] Колонки: создание, переименование, удаление (3 колонки по умолчанию через триггер БД)
- [x] Схема БД и RLS (`supabase/migrations/001_initial.sql`)

### Level 2 — Full (реализовано в этом модуле)

- [x] **Комментарии к задачам** — `src/services/comments.ts`, `useComments`, `CommentList`, `CommentForm`
- [x] **Модальное окно задачи** — редактирование title, description, priority, due_date, assignee; удаление задачи
- [x] **Участники доски** — просмотр, приглашение по email (RPC), удаление (только owner)
- [x] **Профиль пользователя** — имя, аватар (Storage bucket `avatars`)
- [x] **Realtime** — подписки на tasks, columns, comments, board_members с инвалидацией React Query

### Level 3 — Bonus (реализовано)

- [x] **Фильтрация задач** — по priority, assignee, due date (`TaskFilters`, `useTaskFilters`)
- [x] **Поиск по названию** — `TaskSearch`
- [x] **Activity log** — локальная лента событий из Realtime (`ActivityLog`)
- [x] **Тёмная тема** — `ThemeProvider`, переключатель, класс `dark` на `<html>`
- [x] **Горячие клавиши** — `N` создаёт задачу в первой колонке, `Esc` закрывает модалку
- [x] **Google OAuth** — `OAuthButton` (`supabase.auth.signInWithOAuth`)

## Быстрый старт

### 1. Клонирование и зависимости

```bash
git clone <repo-url>
cd taskflow
npm install
```

### 2. Переменные окружения

```bash
cp .env.example .env
```

Заполните в `.env`:

| Переменная | Описание |
|---|---|
| `VITE_SUPABASE_URL` | URL проекта Supabase (Settings → API) |
| `VITE_SUPABASE_ANON_KEY` | Anon/public key (Settings → API) |

### 3. Миграции Supabase

В **Supabase SQL Editor** выполните по порядку:

1. `supabase/migrations/001_initial.sql` — таблицы, RLS, Realtime
2. `supabase/migrations/002_storage.sql` — bucket `avatars`, RPC `invite_member_by_email`

### 4. Google OAuth (опционально)

В Supabase Dashboard → Authentication → Providers → Google:

- Включите провайдер Google
- Добавьте redirect URL: `http://localhost:5173/` (и production URL после деплоя)

### 5. Запуск

```bash
npm run dev
```

Приложение: `http://localhost:5173`

## Структура ключевых модулей

```
src/
├── services/          # comments, members, profiles, tasks
├── hooks/             # useComments, useMembers, useProfile, useRealtimeBoard, useTaskFilters
├── components/
│   ├── task/          # TaskModal, TaskCard, TaskFilters, TaskSearch, Comment*
│   ├── board/         # BoardMembersModal, ActivityLog, BoardPageFeatures
│   └── auth/          # OAuthButton
├── pages/             # ProfilePage
└── providers/         # ThemeProvider
```

## Интеграция с BoardPage

Компонент `BoardPageFeatures` объединяет фильтры, поиск, realtime, activity log, hotkeys и модалки:

```tsx
import { BoardPageFeatures } from './components/board/BoardPageFeatures'
import { TaskCard } from './components/board/TaskCard'

function BoardPage() {
  const { selectedTask, openTask, closeTask } = useTaskModalSelection()
  const tasks = /* из useQuery */

  return (
    <>
      <BoardPageFeatures
        boardId={board.id}
        ownerId={board.owner_id}
        tasks={tasks}
        firstColumnId={columns[0]?.id}
        onCreateTask={(columnId) => createTask({ columnId, title: 'New task' })}
      />
      {/* Kanban columns — передайте filteredTasks из useTaskFilters или фильтруйте локально */}
      <TaskCard task={task} onTaskClick={openTask} />
      <TaskModal task={selectedTask} boardId={board.id} open={!!selectedTask} onClose={closeTask} />
    </>
  )
}
```

`TaskCard` (`src/components/board/TaskCard.tsx`) принимает `onTaskClick` для открытия `TaskModal`.

Для входа через Google добавьте в форму логина:

```tsx
import { OAuthButton } from './components/auth/OAuthButton'
```

Оберните приложение в провайдеры:

```tsx
<ThemeProvider>
  <QueryProvider>
    <AuthProvider>
      <ToastProvider>{/* routes */}</ToastProvider>
    </AuthProvider>
  </QueryProvider>
</ThemeProvider>
```

## Деплой на Vercel

1. Подключите репозиторий в [Vercel](https://vercel.com)
2. Framework Preset: **Vite**
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. В Supabase Auth → URL Configuration добавьте production URL в **Site URL** и **Redirect URLs**
7. Для Google OAuth добавьте production redirect URL

```bash
npm run build   # локальная проверка сборки
```

## Скрипты

| Команда | Описание |
|---|---|
| `npm run dev` | Dev-сервер Vite |
| `npm run build` | Typecheck + production build |
| `npm run preview` | Превью production-сборки |
| `npm run lint` | Oxlint |

## Будущие улучшения

- Уведомления по email при назначении задачи или новом комментарии
- Вложения к задачам (Storage bucket `attachments`)
- @mentions в комментариях с автодополнением участников доски
- История изменений задачи (audit log в БД вместо локального ActivityLog)
- Offline-first / optimistic updates для DnD
- E2E-тесты (Playwright) и unit-тесты для фильтров
- Push-уведомления через Supabase Edge Functions
- Экспорт доски в CSV/JSON

## Лицензия

MIT
