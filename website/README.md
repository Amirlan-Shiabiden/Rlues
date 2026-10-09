# Rlues — сайт с базой PostgreSQL

Express + PostgreSQL. Пользователи (`users`) и их записи (`posts`), REST API и страница для работы с ними.

## Запуск через Docker (проще всего)

```bash
cd website
docker compose up --build
```

Откройте http://localhost:3000. Миграции применяются автоматически.
Демо-данные: `docker compose exec app npm run seed`.

## Запуск без Docker

1. Установите PostgreSQL и создайте базу:
   ```sql
   CREATE USER rlues WITH PASSWORD 'rlues';
   CREATE DATABASE rlues OWNER rlues;
   ```
2. Настройте подключение и запустите:
   ```bash
   cd website
   cp .env.example .env      # при необходимости поправьте DATABASE_URL
   npm install
   npm run migrate           # создать таблицы
   npm run seed              # (необязательно) демо-данные
   npm start
   ```

Для облачной БД (Neon, Supabase, Render) укажите её строку в `DATABASE_URL` и `PGSSL=true`.

## Структура БД

| Таблица | Поля |
|---|---|
| `users` | `id`, `name`, `email` (уникальный), `created_at` |
| `posts` | `id`, `user_id` → `users.id` (каскадное удаление), `title`, `body`, `created_at`, `updated_at` |

Новые изменения схемы — новым файлом `db/migrations/002_*.sql`; `npm run migrate` применит только непримененные.

## API

| Метод | Путь | Описание |
|---|---|---|
| GET | `/api/health` | проверка связи с БД |
| GET / POST | `/api/users` | список / создать (`name`, `email`) |
| GET / DELETE | `/api/users/:id` | получить / удалить с записями |
| GET / POST | `/api/posts` | список (фильтр `?user_id=`) / создать (`user_id`, `title`, `body`) |
| GET / PUT / DELETE | `/api/posts/:id` | получить / изменить / удалить |
