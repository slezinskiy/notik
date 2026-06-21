# Notik — Опис проекту

> Нотатки з календарем, офлайн-синхронізацією та підтримкою PWA

---

## Зміст

1. [Загальний огляд](#загальний-огляд)
2. [Технологічний стек](#технологічний-стек)
3. [Архітектура проекту](#архітектура-проекту)
4. [Структура файлів](#структура-файлів)
5. [База даних](#база-даних)
6. [API маршрути](#api-маршрути)
7. [Компоненти](#компоненти)
8. [Управління станом](#управління-станом)
9. [Автентифікація](#автентифікація)
10. [Офлайн-режим та PWA](#офлайн-режим-та-pwa)
11. [Синхронізація даних](#синхронізація-даних)
12. [Локалізація](#локалізація)
13. [Безпека](#безпека)
14. [Розгортання](#розгортання)
15. [Архітектурна схема](#архітектурна-схема)

---

## Загальний огляд

**Notik** — це Progressive Web Application (PWA) для ведення щоденних нотаток.
Додаток побудований за принципом **offline-first**: усі зміни зберігаються локально
в IndexedDB і фонового синхронізуються з PostgreSQL-базою на сервері.

### Ключові можливості

| Функція | Опис |
|---|---|
| Календарна організація | Нотатки прив'язані до конкретного дня; крапки на календарі показують активні дні |
| Багатий редактор | TipTap із форматуванням, markdown-прев'ю, drag-and-drop зображень |
| Офлайн-режим | IndexedDB кеш + фонова синхронізація через Service Worker |
| PWA | Встановлюється на Windows, Android, iOS |
| Теги | Синтаксис `#тег` у стилі Obsidian із фільтрацією |
| Пошук | Fuzzy-пошук по заголовку, вмісту та тегах (Ctrl+K) |
| Версійна історія | Кожне збереження створює знімок; можна відновити будь-яку версію |
| Експорт | Markdown-файли або ZIP-архів |
| Теми | Темна / світла / системна |
| Локалізація | Українська та англійська мови |
| Клавіатурні скорочення | Ctrl+N, Ctrl+S, Ctrl+K |

---

## Технологічний стек

| Рівень | Технологія | Версія |
|---|---|---|
| Фреймворк | Next.js (App Router) | 15 |
| Бібліотека UI | React | 19 |
| Мова | TypeScript | 5 |
| Стилізація | TailwindCSS + shadcn/ui (Radix UI) | 4 |
| Стан клієнта | Zustand | 5 |
| Серверний стан | TanStack Query | 5 |
| Редактор | TipTap | 3 |
| База даних | PostgreSQL | 16 |
| ORM | Prisma | 6 |
| Автентифікація | Auth.js (NextAuth v5) | beta |
| Офлайн-сховище | IndexedDB (idb) | 8 |
| Service Worker | Нативний SW | — |
| Пошук | Fuse.js | 7 |
| Валідація | Zod | 4 |
| Санітизація | DOMPurify (isomorphic) | 3 |
| Тестування | Vitest + Testing Library | — |
| Розгортання | Docker Compose | — |

---

## Архітектура проекту

Додаток побудований за **трирівневою архітектурою** з чітким розмежуванням відповідальності:

```
┌─────────────────────────────────────────────────────────────────┐
│                        БРАУЗЕР (Client)                         │
│                                                                 │
│  ┌─────────────┐   ┌─────────────┐   ┌──────────────────────┐  │
│  │  React UI   │   │  Zustand    │   │    IndexedDB         │  │
│  │ Components  │◄──│   Stores    │◄──│  (офлайн-кеш)        │  │
│  └──────┬──────┘   └──────┬──────┘   └──────────────────────┘  │
│         │                 │                    ▲                │
│         │                 └────────────────────┘                │
│         │                        syncManager                    │
└─────────┼───────────────────────────────────────────────────────┘
          │ HTTP (REST)
┌─────────┼───────────────────────────────────────────────────────┐
│         ▼          СЕРВЕР (Next.js API Routes)                  │
│  ┌──────────────┐   withAuth()                                  │
│  │  API Routes  │──► session + CSRF + rate limit                │
│  └──────┬───────┘                                               │
│         │                                                       │
│  ┌──────▼───────┐                                               │
│  │ notes-service│  (бізнес-логіка, санітизація)                 │
│  └──────┬───────┘                                               │
│         │                                                       │
│  ┌──────▼───────┐                                               │
│  │    Prisma    │  (ORM)                                        │
│  └──────┬───────┘                                               │
└─────────┼───────────────────────────────────────────────────────┘
          │
┌─────────┼───────────────────────────────────────────────────────┐
│         ▼           DATABASE (PostgreSQL 16)                    │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  User · Account · Session · Note · NoteRevision · Tag ·   │ │
│  │  NoteTag · SyncQueueItem · Attachment                     │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Принципи архітектури

- **Offline-first** — усі записи йдуть спочатку до IndexedDB, сервер — лише для синхронізації
- **Service Layer** — `notes-service.ts` централізує всі Prisma-запити із санітизацією
- **Zustand як єдине джерело правди** — нотатки завантажуються в пам'ять один раз; похідні вигляди (фільтри, статистика, календар) — обчислювані геттери
- **Thin controllers** — API-маршрути лише делегують до сервісного шару
- **Автоматична версійна історія** — кожне оновлення нотатки зберігає попередню версію в `NoteRevision`

---

## Структура файлів

```
notik/
├── prisma/
│   ├── schema.prisma              # Схема БД (9 моделей)
│   └── migrations/                # SQL-міграції
├── public/
│   ├── manifest.json              # PWA маніфест
│   ├── sw.js                      # Service Worker
│   └── icons/                     # Іконки застосунку
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── [...nextauth]/ # NextAuth catch-all
│   │   │   │   └── register/      # Реєстрація користувача
│   │   │   ├── notes/             # CRUD нотаток
│   │   │   │   └── [id]/          # Операції з окремою нотаткою
│   │   │   ├── tags/              # Список тегів
│   │   │   ├── calendar/          # Дані для календаря
│   │   │   ├── sync/              # Синхронізація офлайн-черги
│   │   │   └── history/[id]/      # Версійна історія нотатки
│   │   ├── app/                   # Головна сторінка (захищена)
│   │   ├── login/                 # Сторінка входу
│   │   ├── register/              # Сторінка реєстрації
│   │   ├── offline/               # Сторінка офлайн-режиму
│   │   ├── layout.tsx             # Кореневий layout
│   │   └── globals.css            # Глобальні стилі
│   ├── components/
│   │   ├── editor/
│   │   │   ├── tiptap-editor.tsx  # Головний редактор
│   │   │   └── editor-toolbar.tsx # Панель форматування
│   │   ├── layout/
│   │   │   ├── app-shell.tsx      # Кореневий layout застосунку
│   │   │   ├── sidebar.tsx        # Бічна панель
│   │   │   ├── app-header.tsx     # Заголовок
│   │   │   ├── calendar-widget.tsx# Віджет календаря
│   │   │   ├── notes-list.tsx     # Список нотаток
│   │   │   ├── fab.tsx            # Кнопка "+" (мобільна)
│   │   │   └── language-switcher.tsx
│   │   ├── search/
│   │   │   └── search-dialog.tsx  # Fuzzy-пошук (Ctrl+K)
│   │   ├── export/
│   │   │   └── export-dialog.tsx  # Експорт у Markdown/ZIP
│   │   ├── history/
│   │   │   └── history-dialog.tsx # Версійна історія
│   │   ├── pwa/
│   │   │   ├── install-prompt.tsx # Банер встановлення PWA
│   │   │   └── service-worker-register.tsx
│   │   ├── providers/
│   │   │   ├── providers.tsx      # Кореневий провайдер
│   │   │   ├── app-initializer.tsx# Ініціалізація при старті
│   │   │   ├── locale-provider.tsx# Виявлення мови браузера
│   │   │   └── error-boundary.tsx # Обробка помилок
│   │   └── ui/                    # shadcn/ui примітиви
│   ├── lib/
│   │   ├── auth.ts                # NextAuth конфігурація
│   │   ├── auth.config.ts         # JWT стратегія, callbacks
│   │   ├── db.ts                  # Prisma client (singleton)
│   │   ├── validations.ts         # Zod-схеми
│   │   ├── utils.ts               # Утиліти (generateId, etc.)
│   │   ├── api/
│   │   │   └── helpers.ts         # withAuth() middleware
│   │   ├── services/
│   │   │   └── notes-service.ts   # Бізнес-логіка нотаток
│   │   ├── stores/
│   │   │   ├── notes-store.ts     # Zustand: нотатки
│   │   │   ├── ui-store.ts        # Zustand: UI-стан
│   │   │   └── locale-store.ts    # Zustand: мова (localStorage)
│   │   ├── sync/
│   │   │   ├── indexed-db.ts      # IndexedDB обгортка
│   │   │   └── sync-manager.ts    # Менеджер синхронізації
│   │   ├── hooks/
│   │   │   └── use-notes-selectors.ts # Мемоізовані селектори
│   │   ├── i18n/
│   │   │   ├── config.ts          # Локалі, translate()
│   │   │   ├── use-translation.ts # Хук useTranslation()
│   │   │   └── date-locale.ts     # Форматування дат
│   │   ├── security/
│   │   │   ├── csrf.ts            # CSRF-захист
│   │   │   ├── rate-limit.ts      # Ліміт запитів
│   │   │   └── sanitize.ts        # Санітизація HTML/тексту
│   │   ├── search/
│   │   │   └── fuse-search.ts     # Fuse.js обгортка
│   │   ├── markdown/
│   │   │   └── export.ts          # Markdown/ZIP експорт
│   │   └── notes/
│   │       └── normalize.ts       # Нормалізація відповіді API
│   ├── locales/
│   │   ├── en.json                # Англійські переклади
│   │   └── uk.json                # Українські переклади
│   └── types/
│       └── note.ts                # TypeScript типи
├── docker-compose.yml             # Docker stack (app + postgres)
├── Dockerfile                     # Multi-stage build
├── next.config.ts                 # Next.js конфігурація
└── prisma/schema.prisma           # Схема БД
```

---

## База даних

PostgreSQL 16 з 9 моделями Prisma.

### Схема моделей

```
┌──────────────────────────────────────────────────────────────────┐
│                         User                                     │
│  id · name · email (unique) · password · image                   │
│  createdAt · updatedAt                                           │
└────┬──────────────┬──────────────┬──────────────┬───────────────┘
     │              │              │              │
     │1:N           │1:N           │1:N           │1:N
     ▼              ▼              ▼              ▼
┌─────────┐  ┌──────────┐  ┌───────────┐  ┌──────────────────┐
│ Account │  │ Session  │  │    Tag    │  │  SyncQueueItem   │
│ (OAuth) │  │  (JWT)   │  │ name·user │  │ entityType·op·   │
└─────────┘  └──────────┘  └─────┬─────┘  │ payload·processed│
                                  │        └──────────────────┘
                                  │M:N (via NoteTag)
┌──────────────────────────────── │ ───────────────────────────┐
│                Note              │                            │
│  id · title · content · noteDate │                            │
│  userId · deletedAt · syncedAt  │                            │
└────┬──────────────┬──────────── │ ───────────────────────────┘
     │1:N           │1:N          │
     ▼              ▼             ▼
┌──────────────┐ ┌───────────┐ ┌─────────┐
│ NoteRevision │ │Attachment │ │ NoteTag │
│ title·content│ │ filename  │ │ noteId  │
│ tags·created │ │ mimeType  │ │ tagId   │
└──────────────┘ │ url·size  │ └─────────┘
                 └───────────┘
```

### Опис таблиць

| Модель | Призначення |
|---|---|
| `User` | Ідентифікація користувача; email унікальний, пароль — bcrypt-хеш |
| `Account` | OAuth-акаунти (стандарт NextAuth) |
| `Session` | Активні JWT-сесії |
| `VerificationToken` | Токени для підтвердження email |
| `Note` | Ядро системи — заголовок, HTML-вміст, дата нотатки, м'яке видалення |
| `NoteRevision` | Незмінні знімки версій; зберігаються автоматично при кожній зміні |
| `Tag` | Теги, унікальні для кожного користувача `(userId, name)` |
| `NoteTag` | Many-to-many зв'язок між Note і Tag |
| `SyncQueueItem` | Журнал операцій синхронізації (create/update/delete/restore) |
| `Attachment` | Файлові вкладення до нотаток |

### Ключові індекси

```
Note(userId, noteDate)     — вибірка нотаток за датою
Note(userId, deletedAt)    — фільтр кошика
Note(userId, updatedAt)    — сортування за датою зміни
NoteRevision(noteId, createdAt) — список версій
SyncQueueItem(userId, processedAt) — черга синхронізації
```

---

## API маршрути

Усі маршрути (крім `/api/auth/register`) захищені `withAuth()`:  
**Перевірка сесії → CSRF-захист → Rate limiting**

### Нотатки

| Метод | Маршрут | Опис |
|---|---|---|
| `GET` | `/api/notes` | Список усіх нотаток користувача |
| `POST` | `/api/notes` | Створити нотатку (Zod-валідація, санітизація, автоматичний тег і ревізія) |
| `GET` | `/api/notes/:id` | Отримати нотатку за ID |
| `PUT` | `/api/notes/:id` | Оновити нотатку |
| `DELETE` | `/api/notes/:id` | М'яке видалення (встановлює `deletedAt`) |

### Теги і календар

| Метод | Маршрут | Опис |
|---|---|---|
| `GET` | `/api/tags` | Усі теги користувача з кількістю нотаток |
| `GET` | `/api/calendar?year=&month=` | Нотатки по днях за місяць |

### Синхронізація і версії

| Метод | Маршрут | Опис |
|---|---|---|
| `GET` | `/api/sync` | Отримати всі нотатки з сервера (перша завантаженість) |
| `POST` | `/api/sync` | Обробити офлайн-чергу (Last Updated Wins) |
| `GET` | `/api/history/:id` | Список ревізій нотатки |
| `POST` | `/api/history/:id` | Відновити нотатку до конкретної ревізії |

### Автентифікація

| Метод | Маршрут | Опис |
|---|---|---|
| `POST` | `/api/auth/register` | Реєстрація нового користувача |
| `GET/POST` | `/api/auth/[...nextauth]` | NextAuth catch-all (вхід, вихід, сесія) |

---

## Компоненти

### Layout

```
AppShell
├── Sidebar (320px, overlay на мобільних)
│   ├── CalendarWidget   — місячний календар з крапками активності
│   └── NotesList        — відфільтрований список нотаток + статистика
├── AppHeader
│   ├── SearchTrigger    — відкриває SearchDialog (Ctrl+K)
│   ├── SyncButton       — примусова синхронізація
│   ├── ExportButton     — відкриває ExportDialog
│   ├── ThemeToggle      — темна/світла/системна тема
│   ├── LanguageSwitcher — EN / UK
│   └── UserMenu         — вихід з системи
└── TipTapEditor         — головний редактор
```

### Редактор (TipTapEditor)

- Автозбереження з debounce (300 мс) через Zustand
- Підтримка форматування: **жирний**, *курсив*, підкреслення, закреслення, H1–H3, списки, цитати, блоки коду з підсвіткою синтаксису
- Drag-and-drop завантаження зображень
- Автовилучення тегів `#назва` з тексту
- Перемикання між режимом редагування і прев'ю

### Діалоги

| Компонент | Функція |
|---|---|
| `SearchDialog` | Fuzzy-пошук Fuse.js по всіх нотатках |
| `ExportDialog` | Вибір об'єму (нотатка/день/місяць/все) → Markdown або ZIP |
| `HistoryDialog` | Перегляд і відновлення попередніх версій |

---

## Управління станом

Три Zustand-сховища:

### `notesStore` — основний стан

```typescript
// Стан
notes: Note[]
selectedNoteId: string | null
selectedDate: Date
activeTagFilter: string | null
searchQuery: string
showTrash: boolean
isLoading: boolean
isSaving: boolean

// Обчислювані геттери
getFilteredNotes()     // фільтр за датою + тегом + пошуком
getNotesForCalendar()  // Map<dateKey, count> для крапок
getDailyStats()        // { noteCount, tagCount, wordCount }
getAllTags()            // теги відсортовані за частотою
getTrashNotes()        // видалені нотатки

// Дії (пишуть у сховище + ставлять у чергу синхронізації)
createNote(noteDate?)
updateNote(id, updates)
deleteNote(id)         // м'яке видалення
restoreNote(id)
```

### `uiStore` — ефемерний UI-стан

```typescript
sidebarOpen, searchOpen, exportOpen, historyOpen
previewMode, currentTime
```

### `localeStore` — збережена мова

```typescript
locale: 'uk' | 'en'   // зберігається в localStorage
```

### Потік даних

```
Дія користувача
    │
    ▼
notesStore.updateNote()
    ├── оновлює Zustand (миттєво)
    └── queueNoteSync()
            ├── saveNoteLocally()     → IndexedDB (notes)
            └── enqueueSyncOperation() → IndexedDB (syncQueue)
                        │
                        ▼ (async, кожні 30с або при online)
                syncWithServer()
                        │
                        ▼
                POST /api/sync
                        │
                        ▼
                PostgreSQL
```

---

## Автентифікація

### Схема автентифікації

```
Користувач вводить email + пароль
          │
          ▼
POST /api/auth/register або /api/auth/signin
          │
          ▼
NextAuth Credentials Provider
          │
          ▼
prisma.user.findUnique({ where: { email } })
          │
          ▼
bcrypt.compare(password, user.password)  [cost=12]
          │
          ▼
JWT-токен зберігається в cookie (httpOnly)
          │
          ▼
Кожен API-запит: auth() → session.user.id
```

### Деталі реалізації

| Аспект | Рішення |
|---|---|
| Провайдер | Credentials (email + пароль) |
| Хешування | bcrypt cost=12 |
| Стратегія | JWT (stateless) |
| Адаптер | `@auth/prisma-adapter` → зберігає Account/Session у PostgreSQL |
| Захист маршрутів | Server-side `auth()` на сторінці `/app` → редирект на `/login` |
| Кастомні сторінки | `/login`, `/register` |
| Довіра хосту | `trustHost: true` для Docker/reverse-proxy |

---

## Офлайн-режим та PWA

### Service Worker (`public/sw.js`)

```
Встановлення (install)
    └── кешує: /offline, /manifest.json, /icons/icon.svg

Активація (activate)
    └── видаляє старі кеші (версіонування: "notik-v2")

Перехоплення запитів (fetch)
    ├── API-маршрути (/api/*) — НІКОЛИ не кешуються
    ├── /_next/static/, /icons/ — Cache-First
    └── navigate → fallback на /offline при відсутності мережі

Background Sync
    └── тег "notik-sync" → GET /api/sync
```

### PWA маніфест

```json
{
  "name": "Notik",
  "display": "standalone",
  "start_url": "/app",
  "theme_color": "#7c3aed",
  "shortcuts": [{ "name": "New Note", "url": "/app" }]
}
```

### IndexedDB схема (`notik-offline`, версія 1)

```
├── notes      { id, ...Note, pendingSync? }
│   ├── index: by-date
│   └── index: by-updated
├── syncQueue  { id, ...SyncOperation }
│   └── index: by-created
└── meta       { key, value }  (напр. lastSyncAt)
```

---

## Синхронізація даних

### Повна схема синхронізації

```
┌──────────────────────────────────────────────────────────────────┐
│                    ОФЛАЙН-ПОТІК                                  │
│                                                                  │
│  Редактор ──► notesStore ──► IndexedDB (notes)                   │
│                    │                                             │
│                    └──► IndexedDB (syncQueue)                    │
│                              │                                   │
└──────────────────────────────┼───────────────────────────────────┘
                               │
         Тригери синхронізації:│
         • кожні 30 секунд     │
         • подія "online"      │
         • Ctrl+S              │
         • Background Sync SW  │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                    СЕРВЕРНИЙ ПОТІК                               │
│                                                                  │
│  POST /api/sync                                                  │
│  { operations: [...], lastSyncAt }                               │
│           │                                                      │
│           ▼                                                      │
│  для кожної операції:                                            │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │  create  → createNoteForUser() якщо не існує            │     │
│  │  update  → Last Updated Wins:                           │     │
│  │            clientUpdated >= serverUpdated → оновити     │     │
│  │            інакше → конфлікт → зберегти як NoteRevision │     │
│  │  delete  → встановити deletedAt                         │     │
│  │  restore → скинути deletedAt                            │     │
│  └─────────────────────────────────────────────────────────┘     │
│           │                                                      │
│           └──► повертає { success, conflicts, notes[] }          │
└──────────────────────────────────────────────────────────────────┘
```

### Вирішення конфліктів

Стратегія: **Last Updated Wins**

- Якщо `clientUpdatedAt >= serverUpdatedAt` → клієнтська версія перемагає
- Якщо сервер новіший → серверна версія зберігається, клієнтська зберігається як `NoteRevision`
- Конфлікти рахуються і повертаються у відповіді

---

## Локалізація

### Підтримувані мови

| Код | Назва | За замовчуванням |
|---|---|---|
| `uk` | Українська | ✅ |
| `en` | English | — |

### Архітектура i18n

```
src/locales/
├── uk.json    ← переклади (вкладена структура)
└── en.json

translate(locale, 'auth.signIn')
    │
    ├── dot-notation lookup у JSON
    ├── підтримка параметрів: {count}, {name}
    └── type-safe TranslationKey (TypeScript mapped type)

useTranslation() hook
    └── читає locale з localeStore (Zustand)
        └── зберігається в localStorage
```

### Виявлення мови

```
LocaleProvider (client)
    └── navigator.language.startsWith('uk') → 'uk'
        navigator.language.startsWith('en') → 'en'
        інакше → 'uk' (дефолт)
```

### Локалізація дат

`date-fns` з відповідними локалями для форматування дат у календарі, заголовках і списку нотаток.

---

## Безпека

### Багаторівневий захист

```
Запит від браузера
        │
        ▼
1. Автентифікація (JWT-сесія)
   └── auth() перевіряє токен → відхиляє без сесії (401)
        │
        ▼
2. CSRF-захист
   └── Origin == Host? → відхиляє при розбіжності (403)
        │
        ▼
3. Rate Limiting
   └── 100 запитів/хв на userId:IP → відхиляє при перевищенні (429)
        │
        ▼
4. Валідація вхідних даних (Zod)
   └── noteSchema, registerSchema, syncSchema → 400 при помилці
        │
        ▼
5. Санітизація контенту (DOMPurify)
   ├── sanitizeHtml()  — allowlist HTML тегів/атрибутів
   ├── sanitizeText()  — видаляє < і >
   └── sanitizeTags()  — lowercase, max 50 символів, max 50 тегів
        │
        ▼
6. Перевірка власності
   └── усі Prisma-запити включають { userId } → ізоляція даних
```

### Таблиця заходів безпеки

| Загроза | Захист |
|---|---|
| Несанкціонований доступ | JWT + перевірка сесії |
| XSS | DOMPurify на всіх полях вводу |
| CSRF | Origin vs Host header comparison |
| Brute force / DoS | Rate limiting 100 req/хв |
| SQL injection | Prisma ORM (параметризовані запити) |
| Витік даних між користувачами | userId scope у всіх запитах |
| Слабкі паролі | bcrypt cost=12 |
| Незахищені секрети | AUTH_SECRET у env, не в коді |

---

## Розгортання

### Docker Compose

```yaml
services:
  postgres:
    image: postgres:16-alpine
    ports: ["5432:5432"]
    volumes: [postgres_data:/var/lib/postgresql/data]
    healthcheck: pg_isready

  app:
    build: .   # multi-stage Dockerfile
    ports: ["3000:3000"]
    depends_on: postgres (healthy)
    volumes: [uploads_data:/app/public/uploads]

volumes:
  postgres_data:   # постійне зберігання БД
  uploads_data:    # завантажені файли
```

### Команди розгортання

```bash
# Локальна розробка
npm install
cp .env.example .env
docker compose up postgres -d
npm run db:migrate
npm run dev

# Продакшн (Docker)
docker compose up --build -d

# Робота з БД
npm run db:studio    # Prisma Studio GUI
npm run db:migrate   # запуск міграцій
npm run db:generate  # регенерація Prisma Client

# Тести
npm test             # одноразовий запуск
npm run test:watch   # режим спостереження
```

### Змінні оточення

| Змінна | Призначення |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | Секрет для підпису JWT (`openssl rand -base64 32`) |
| `AUTH_URL` | Публічна URL застосунку |
| `RATE_LIMIT_MAX` | Макс. запитів за хвилину (default: 100) |

---

## Архітектурна схема

### Повна схема взаємодії компонентів

```
╔══════════════════════════════════════════════════════════════════════╗
║                        БРАУЗЕР                                      ║
║                                                                      ║
║  ┌─────────────────────────────────────────────────────────────┐    ║
║  │                    React-дерево компонентів                 │    ║
║  │                                                             │    ║
║  │  Providers                                                  │    ║
║  │  └── SessionProvider (NextAuth)                             │    ║
║  │      └── QueryClientProvider (TanStack Query)               │    ║
║  │          └── ThemeProvider (next-themes)                    │    ║
║  │              └── LocaleProvider                             │    ║
║  │                  └── AppErrorBoundary                       │    ║
║  │                      └── AppShell                           │    ║
║  │                          ├── AppInitializer ──┐             │    ║
║  │                          ├── Sidebar          │             │    ║
║  │                          │   ├── CalendarWidget             │    ║
║  │                          │   └── NotesList                  │    ║
║  │                          ├── AppHeader        │             │    ║
║  │                          ├── TipTapEditor     │             │    ║
║  │                          ├── SearchDialog     │             │    ║
║  │                          ├── ExportDialog     │             │    ║
║  │                          └── HistoryDialog    │             │    ║
║  └────────────────────────────────────────────── │ ───────────┘    ║
║                                                  │                  ║
║  ┌───────────────────────────┐   ┌───────────────▼──────────────┐  ║
║  │      Zustand Stores       │   │     AppInitializer           │  ║
║  │                           │   │                              │  ║
║  │  notesStore               │◄──│  pullFromServer() on mount   │  ║
║  │  ├── notes[]              │   │  startAutoSync() → 30s timer │  ║
║  │  ├── selectedNoteId       │   │  Ctrl+N/S/K shortcuts        │  ║
║  │  ├── selectedDate         │   └──────────────────────────────┘  ║
║  │  └── filters/search       │                                     ║
║  │                           │                                     ║
║  │  uiStore                  │   ┌──────────────────────────────┐  ║
║  │  └── dialogs, theme       │   │    IndexedDB (notik-offline) │  ║
║  │                           │   │                              │  ║
║  │  localeStore (persisted)  │   │  notes {} ← saveNoteLocally  │  ║
║  │  └── locale → localStorage│   │  syncQueue {} ← enqueue      │  ║
║  └───────────────────────────┘   │  meta { lastSyncAt }         │  ║
║              │                   └──────────────┬───────────────┘  ║
║              │ write                            │ read             ║
║              ▼                                  ▼                  ║
║  ┌───────────────────────────────────────────────────────────────┐ ║
║  │                     sync-manager.ts                           │ ║
║  │  queueNoteSync()  saveNoteLocally + enqueueSyncOperation      │ ║
║  │  syncWithServer() POST /api/sync з IndexedDB чергою           │ ║
║  │  pullFromServer() GET /api/notes → оновлює IndexedDB          │ ║
║  └───────────────────────────────┬───────────────────────────────┘ ║
║                                  │ HTTP fetch                      ║
╚══════════════════════════════════│══════════════════════════════════╝
                                   │
╔══════════════════════════════════│══════════════════════════════════╗
║              СЕРВЕР (Next.js)    │                                  ║
║                                  ▼                                  ║
║  ┌───────────────────────────────────────────────────────────────┐ ║
║  │                      API Routes                               │ ║
║  │                                                               │ ║
║  │  /api/notes  /api/sync  /api/tags  /api/calendar              │ ║
║  │  /api/history/:id  /api/auth/[...nextauth]                    │ ║
║  └───────────────────┬───────────────────────────────────────────┘ ║
║                      │                                             ║
║              withAuth() middleware                                  ║
║              ├── auth() → перевірка JWT-сесії                      ║
║              ├── csrfGuard() → Origin == Host?                     ║
║              └── rateLimit() → 100 req/хв per userId:IP           ║
║                      │                                             ║
║  ┌───────────────────▼───────────────────────────────────────────┐ ║
║  │                   notes-service.ts                            │ ║
║  │                                                               │ ║
║  │  getNotesForUser()   createNoteForUser()                      │ ║
║  │  updateNoteForUser() softDeleteNote()                         │ ║
║  │  getTagsForUser()    getCalendarData()                        │ ║
║  │  getNoteHistory()    restoreRevision()                        │ ║
║  │                                                               │ ║
║  │  sanitizeHtml() / sanitizeText() / sanitizeTags()             │ ║
║  └───────────────────┬───────────────────────────────────────────┘ ║
║                      │                                             ║
║  ┌───────────────────▼───────────────────────────────────────────┐ ║
║  │                    Prisma ORM                                 │ ║
║  └───────────────────┬───────────────────────────────────────────┘ ║
╚══════════════════════│══════════════════════════════════════════════╝
                       │
╔══════════════════════│══════════════════════════════════════════════╗
║     PostgreSQL 16    │                                              ║
║                      ▼                                              ║
║  User ── Note ── NoteRevision                                       ║
║          │                                                          ║
║          ├── NoteTag ── Tag                                         ║
║          ├── Attachment                                             ║
║          └── (SyncQueueItem, Account, Session)                      ║
╚═════════════════════════════════════════════════════════════════════╝
```

### Схема PWA та офлайн-потоку

```
┌─────────────────────────────────────────────────────────────────┐
│                    Service Worker (sw.js)                       │
│                                                                 │
│  install  → кеш: /offline, /manifest.json, /icons/*            │
│  activate → видалення старих кешів                             │
│                                                                 │
│  fetch (GET):                                                   │
│  ├── /api/*          → bypass (без кешування)                  │
│  ├── /_next/static/* → Cache-First                             │
│  └── navigate        → offline fallback при помилці мережі    │
│                                                                 │
│  sync (background):                                            │
│  └── "notik-sync" → GET /api/sync                              │
└─────────────────────────────────────────────────────────────────┘

Встановлення PWA:
  beforeinstallprompt → InstallPrompt компонент → банер
  Platforms: Chrome/Edge (desktop) · Android · iOS Safari
```

---

*Документацію згенеровано: червень 2026*
