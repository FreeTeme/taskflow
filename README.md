# TaskFlow

Kanban-приложение для управления задачами (Jira-lite): доски, колонки, карточки с drag-and-drop, совместный доступ и realtime-обновления.

**Стек:** React 19 + TypeScript + Vite + Tailwind CSS + Supabase (Postgres, Auth, Realtime, Storage) + React Query + @dnd-kit.

**Репозиторий:** [github.com/FreeTeme/taskflow](https://github.com/FreeTeme/taskflow)

**Production:** [taskflow-one-livid-94.vercel.app](https://taskflow-one-livid-94.vercel.app)

## Реализованные уровни

| Уровень | Статус | Что есть |
| --- | --- | --- |
| **1. MVP** | Готово | Регистрация / вход / выход, защита роутов, доски, колонки, задачи, drag-and-drop, адаптивный UI, лоадеры и ошибки |
| **2. Full** | Готово | Детали задачи, комментарии, realtime, приглашение участников (owner / member), профиль и аватар |
| **3. Bonus** | Готово | Фильтры и поиск, лог активности, тёмная тема, горячие клавиши `N` / `Esc` |

Не сделано из бонусов: прикрепление файлов к задачам (есть только аватар в Storage).

## Запуск

```bash
git clone https://github.com/FreeTeme/taskflow.git
cd taskflow
npm install
cp .env.example .env   # заполнить ключи Supabase
npm run dev
```

Приложение откроется на `http://localhost:5173`.

### Как заполнить `.env`

1. Откройте проект в [Supabase Dashboard](https://supabase.com/dashboard).
2. `VITE_SUPABASE_URL` — **Settings → Data API → Project URL**  
   (вид `https://xxxx.supabase.co`).
3. `VITE_SUPABASE_ANON_KEY` — **Settings → API Keys**  
   скопируйте **publishable** ключ (`sb_publishable_...`).  
   Если клиент ругается на формат — на той же странице откройте **Legacy API keys** и возьмите **anon** (`eyJ...`).
4. Secret key (`sb_secret_...`) во фронтенд **не** кладите.

### Локальный Supabase

Нужны Supabase CLI и Docker-compatible runtime. Для macOS можно использовать Docker Desktop либо Colima.

```bash
supabase start
supabase db reset
supabase status
```

Создайте игнорируемый файл `.env.development.local` и перенесите в него `API_URL` и `PUBLISHABLE_KEY` из `supabase status`:

```dotenv
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<local publishable key>
```

После этого `npm run dev` использует только локальный backend. Production build не читает `.env.development.local`.

### База данных

В **SQL Editor** выполните по порядку:

1. [`supabase/migrations/001_initial.sql`](supabase/migrations/001_initial.sql) — таблицы, RLS, realtime
2. [`supabase/migrations/002_storage.sql`](supabase/migrations/002_storage.sql) — аватары и приглашение по email
3. [`supabase/migrations/003_data_integrity_and_rls.sql`](supabase/migrations/003_data_integrity_and_rls.sql) — owner/member-права, защита комментариев и assignee, атомарный DnD
4. [`supabase/migrations/004_data_api_privileges.sql`](supabase/migrations/004_data_api_privileges.sql) — явные минимальные права Data API для новых Supabase-проектов
5. [`supabase/migrations/005_owner_board_visibility.sql`](supabase/migrations/005_owner_board_visibility.sql) — корректный `insert().select()` при создании доски владельцем

### Auth

- Email + пароль: включите Email provider.
- Для писем-приглашений настройте собственный SMTP в **Authentication → Emails → SMTP Settings**. Встроенный SMTP Supabase отправляет письма только участникам команды проекта и ограничен двумя письмами в час.
- Разверните защищённую функцию приглашений: `supabase functions deploy invite-board-member`.

## Деплой (Vercel)

1. Import репозитория на [vercel.com](https://vercel.com).
2. Framework: Vite, build: `npm run build`, output: `dist`.
3. Env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
4. В Supabase → Authentication → URL Configuration добавьте Vercel URL в Site URL и Redirect URLs.

`vercel.json` уже содержит SPA rewrite, поэтому прямые переходы и обновление вложенных роутов отдаются через `index.html`.

Ссылка на продакшен: [https://taskflow-one-livid-94.vercel.app](https://taskflow-one-livid-94.vercel.app).

Тестовый пользователь: зарегистрируйте аккаунт через форму Sign up (email + пароль). После применения миграций при создании доски появляются колонки To Do / In Progress / Done.

## Проверки

```bash
npm run lint
npm test
npm run test:local
npm run build
```

`npm run test:local` требует запущенный локальный Supabase и проверяет Auth, RLS, роли owner/member, Realtime, Storage, комментарии, task reorder и целостность assignee. Unit-тесты покрывают фильтрацию, user-scoped query keys и расчёт DnD-позиций при активном фильтре.

## Что бы улучшили при наличии времени

- Отдельный безопасный demo-проект Supabase с автоматически сбрасываемыми данными
- Вложения файлов к задачам
- Постоянный audit log в БД вместо локальной ленты
- Интеграционные тесты RLS/Realtime против отдельного Supabase test project
- Уведомления о назначении задачи и новых комментариях
