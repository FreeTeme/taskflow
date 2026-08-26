# TaskFlow

Адаптивное Kanban-приложение для командной работы: доски, колонки, задачи, drag-and-drop, комментарии, роли, realtime и внутренние уведомления.

## Live demo

**Production:** [https://taskflow-one-livid-94.vercel.app](https://taskflow-one-livid-94.vercel.app)

**Repository:** [https://github.com/FreeTeme/taskflow](https://github.com/FreeTeme/taskflow)

Для проверки зарегистрируйте два аккаунта через интерфейс. Владелец может пригласить второй аккаунт по email: приглашённая доска сразу появится у участника в списке, а в шапке отобразится внутреннее уведомление.

## Что реализовано

### MVP

- регистрация, вход и выход по email/password через Supabase Auth;
- защищённые роуты;
- создание и удаление досок;
- создание, переименование и удаление колонок;
- создание, редактирование и удаление задач;
- drag-and-drop задач внутри колонки и между колонками;
- состояния загрузки, ошибок и пустых списков;
- адаптивный интерфейс для desktop и mobile.

### Полная версия

- модальное окно задачи: название, описание, приоритет, дедлайн и исполнитель;
- комментарии с realtime-обновлением;
- роли `owner` и `member`;
- управление участниками владельцем доски;
- приглашение существующего пользователя по email;
- внутренний центр уведомлений без SMTP;
- автоматическое появление приглашённой доски в списке участника;
- профиль пользователя и загрузка аватара в Supabase Storage;
- строгие RLS-политики и проверка целостности assignee на уровне БД.

### Дополнительно

- поиск и фильтры по задачам;
- локальная лента активности;
- светлая и тёмная темы;
- горячие клавиши `N` и `Esc`;
- скрытые нативные полосы прокрутки с сохранением прокрутки мышью, клавиатурой и касанием;
- realtime-синхронизация задач, колонок, комментариев, участников и уведомлений.

## Сценарий проверки

1. Зарегистрируйте аккаунт владельца и создайте доску.
2. Создайте колонки и несколько задач.
3. Проверьте перемещение карточек между колонками.
4. Откройте задачу, измените поля, назначьте участника и добавьте комментарий.
5. Зарегистрируйте второй аккаунт TaskFlow.
6. Под владельцем откройте **Members** и добавьте email второго аккаунта.
7. Войдите вторым аккаунтом: доска появится в **Boards**, а приглашение — под значком уведомлений.

## Технологии

- React 19, TypeScript, Vite;
- Tailwind CSS 4;
- Supabase Auth, Postgres, Realtime и Storage;
- TanStack React Query;
- `@dnd-kit`;
- Phosphor Icons;
- Vitest и Oxlint;
- Vercel.

## Архитектура и безопасность

- запросы к данным вынесены в `src/services`;
- серверное состояние и мутации управляются через React Query;
- пользовательские query keys изолированы по `user.id`;
- доступ к доскам и связанным данным ограничен PostgreSQL RLS;
- приглашение, добавление участника и создание уведомления выполняются одной транзакцией RPC;
- изменение порядка задач выполняется атомарной PostgreSQL-функцией;
- удалённый участник автоматически снимается с назначенных задач;
- секретный Supabase key не используется во frontend.

Подробные результаты: [технический аудит](./AUDIT_REPORT.md) и [design QA](./design-qa.md).

## Локальный запуск

Требования: Node.js 20.19+ или 22.12+ и npm.

```bash
git clone https://github.com/FreeTeme/taskflow.git
cd taskflow
npm ci
cp .env.example .env
npm run dev
```

Заполните `.env`:

```dotenv
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-key
```

Приложение откроется на [http://localhost:5173](http://localhost:5173).

## Настройка Supabase

1. Создайте проект в [Supabase Dashboard](https://supabase.com/dashboard).
2. Включите Email provider в **Authentication → Sign In / Providers**.
3. Привяжите проект через Supabase CLI.
4. Примените все миграции:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

Миграции в [`supabase/migrations`](./supabase/migrations) создают схему, RLS, Storage, realtime, атомарный DnD и внутренние уведомления. Приглашения работают для уже зарегистрированных аккаунтов TaskFlow и не требуют SMTP.

### Полностью локальный backend

Требуется Docker Desktop или совместимый runtime.

```bash
npx supabase start
npx supabase db reset
npx supabase status
```

Добавьте локальные значения `API_URL` и `PUBLISHABLE_KEY` из `supabase status` в `.env.development.local`:

```dotenv
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=your-local-publishable-key
```

## Проверки

```bash
npm run lint
npm test
npm run build
```

Текущее состояние:

- production build — успешно;
- unit tests — 6/6 успешно;
- lint — без ошибок;
- Supabase migrations — применены к production;
- responsive QA — проверен на desktop и mobile.

Дополнительная интеграционная проверка с локальным Supabase:

```bash
npm run test:local
```

Она покрывает Auth, RLS, owner/member-права, Realtime, Storage, комментарии, порядок задач и целостность назначений.

## Деплой на Vercel

- Framework preset: `Vite`;
- Build command: `npm run build`;
- Output directory: `dist`;
- переменные окружения: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

В Supabase → **Authentication → URL Configuration** добавьте production URL в Site URL и Redirect URLs. Файл `vercel.json` содержит SPA rewrite для прямого открытия вложенных роутов.

## Ограничения и дальнейшие улучшения

- вложения файлов непосредственно к задачам;
- постоянный серверный audit log вместо локальной ленты;
- уведомления о назначении задачи и новых комментариях;
- отдельный автоматически сбрасываемый demo-проект Supabase.
