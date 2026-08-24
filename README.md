# TaskFlow

Kanban-приложение для управления задачами (Jira-lite): доски, колонки, карточки с drag-and-drop, совместный доступ и realtime-обновления.

**Стек:** React 18 + TypeScript + Vite + Tailwind CSS + Supabase (Postgres, Auth, Realtime, Storage) + React Query + @dnd-kit.

**Репозиторий:** [github.com/FreeTeme/taskflow](https://github.com/FreeTeme/taskflow)

## Реализованные уровни

| Уровень | Статус | Что есть |
| --- | --- | --- |
| **1. MVP** | Готово | Регистрация / вход / выход, защита роутов, доски, колонки, задачи, drag-and-drop, адаптивный UI, лоадеры и ошибки |
| **2. Full** | Готово | Детали задачи, комментарии, realtime, приглашение участников (owner / member), профиль и аватар |
| **3. Bonus** | Готово | Фильтры и поиск, лог активности, тёмная тема, Google OAuth, горячие клавиши `N` / `Esc` |

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

### База данных

В **SQL Editor** выполните по порядку:

1. [`supabase/migrations/001_initial.sql`](supabase/migrations/001_initial.sql) — таблицы, RLS, realtime
2. [`supabase/migrations/002_storage.sql`](supabase/migrations/002_storage.sql) — аватары и приглашение по email

### Auth

- Email + пароль: включите Email provider.
- Google OAuth (бонус): Authentication → Providers → Google, redirect `http://localhost:5173/**` и URL продакшена после деплоя.

## Деплой (Vercel)

1. Import репозитория на [vercel.com](https://vercel.com).
2. Framework: Vite, build: `npm run build`, output: `dist`.
3. Env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
4. В Supabase → Authentication → URL Configuration добавьте Vercel URL в Site URL и Redirect URLs.

Ссылка на продакшен: *будет добавлена после деплоя*.

Тестовый пользователь: зарегистрируйте аккаунт через форму Sign up (email + пароль). После применения миграций при создании доски появляются колонки To Do / In Progress / Done.

## Что бы улучшили при наличии времени

- Деплой на Vercel и демо-аккаунт в README
- Вложения файлов к задачам
- Постоянный audit log в БД вместо локальной ленты
- Юнит-тесты ключевых хуков (`useTasks`, фильтры)
- Уведомления о назначении задачи и новых комментариях
