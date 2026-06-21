# Notik

A production-ready Progressive Web Application for daily notes with calendar organization, offline-first sync, and markdown export.

<img src="public/icons/icon.svg" alt="Notik" width="150" />
## Features

- **Calendar-based organization** — Notes grouped by day with visual calendar dots
- **Rich text editor** — TipTap with markdown preview, formatting toolbar, drag-and-drop images
- **Offline-first** — IndexedDB local cache with background sync to PostgreSQL
- **PWA** — Installable on Windows, Android, and iOS with service worker caching
- **Tags** — Obsidian-style `#tags` with filtering
- **Search** — Fuzzy search across title, content, and tags (Ctrl+K)
- **Version history** — Every edit saved; compare and restore revisions
- **Export/Import** — Markdown files (`DD_MM_YYYY.md`) and ZIP archives
- **Dark/Light mode** — System-aware theming
- **Localization** — Ukrainian and English (UI, dates, calendar)
- **Keyboard shortcuts** — Ctrl+N (new), Ctrl+S (sync), Ctrl+K (search)

## Tech Stack

| Layer | Technology |
|-------|-------------|
| Framework | Next.js 15 (App Router), React 19 |
| Language | TypeScript |
| Styling | TailwindCSS 4, shadcn/ui |
| State | Zustand, TanStack Query |
| Editor | TipTap |
| Database | PostgreSQL, Prisma ORM |
| Auth | Auth.js (NextAuth v5) |
| Offline | IndexedDB (idb), Service Worker |
| Search | Fuse.js |
| Testing | Vitest |
| Deploy | Docker Compose |

## Project Structure

```
notik/
├── prisma/
│   └── schema.prisma          # Database schema
├── public/
│   ├── manifest.json          # PWA manifest
│   ├── sw.js                  # Service worker
│   └── icons/                 # App icons
├── src/
│   ├── app/
│   │   ├── api/               # REST API routes
│   │   ├── app/               # Main application
│   │   ├── login/             # Authentication
│   │   └── offline/           # Offline fallback page
│   ├── components/
│   │   ├── editor/            # TipTap editor
│   │   ├── layout/            # Sidebar, header, calendar
│   │   ├── search/            # Global search dialog
│   │   ├── export/            # Export/import dialog
│   │   ├── history/           # Version history
│   │   ├── pwa/               # Install prompt, SW register
│   │   └── ui/                # shadcn/ui components
│   ├── lib/
│   │   ├── auth.ts            # Auth.js configuration
│   │   ├── db.ts              # Prisma client
│   │   ├── markdown/          # Export/import logic
│   │   ├── sync/              # IndexedDB + sync manager
│   │   ├── search/            # Fuse.js search
│   │   ├── security/          # Sanitize, CSRF, rate limit
│   │   ├── services/          # Business logic
│   │   └── stores/            # Zustand stores
│   └── types/                 # TypeScript types
├── docker-compose.yml
├── Dockerfile
└── vitest.config.ts
```

## Getting Started

### Prerequisites

- Node.js 22+
- PostgreSQL 16+ (or Docker)

### 1. Clone and install

```bash
git clone <repo-url> notik
cd notik
npm install
```

### 2. Environment variables

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="postgresql://notik:notik_secret@localhost:5432/notik?schema=public"
AUTH_SECRET="your-secret-here"   # openssl rand -base64 32
AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Start PostgreSQL

```bash
docker compose up postgres -d
```

### 4. Database setup

```bash
npm run db:push
# or for migrations:
npm run db:migrate
```

#### WSL on Windows

If `npm run db:push` fails with a UNC path or `"prisma" is not recognized`, your shell is using **Windows npm** instead of **Linux Node**. Fix it:

```bash
# 1. Confirm — this must NOT point to /mnt/c/...
which npm

# 2. Load fnm (Node installed in WSL)
export PATH="$HOME/.local/share/fnm:$PATH"
eval "$(fnm env)"

# 3. Retry
npm run db:push
```

If `which npm` still shows a Windows path, open a **new WSL terminal** (not PowerShell/CMD) or run `source ~/.bashrc` first. fnm is already configured in `~/.bashrc` from project setup.

Alternative without local Node — push schema from a one-off container:

```bash
docker compose up postgres -d
docker run --rm --network notik_default \
  -v "$(pwd):/app" -w /app \
  -e DATABASE_URL="postgresql://notik:notik_secret@postgres:5432/notik?schema=public" \
  node:22-alpine sh -c "npm ci --ignore-scripts && npx prisma db push"
```

### 5. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), register an account, and start taking notes.

## Localization

Supported languages: **Ukrainian (uk)** and **English (en)**.

| File | Purpose |
|------|---------|
| `src/locales/uk.json` | Ukrainian translations |
| `src/locales/en.json` | English translations |
| `src/lib/i18n/config.ts` | Locale config and `translate()` |
| `src/lib/stores/locale-store.ts` | Persisted locale preference |

Default language is Ukrainian. The app detects browser language on first visit. Switch language via the globe icon in the header, or EN/UK buttons on login/register pages.

```tsx
import { useTranslation } from "@/lib/i18n/use-translation";

const { t, locale } = useTranslation();
t("auth.signIn"); // "Увійти" or "Sign in"
```

## Docker Deployment

Run the full stack:

```bash
# Set AUTH_SECRET in .env
docker compose up --build -d
```

Services:
- **app** — Next.js on port 3000
- **postgres** — PostgreSQL on port 5432

Volumes: `postgres_data`, `uploads_data`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notes` | List notes |
| POST | `/api/notes` | Create note |
| GET | `/api/notes/:id` | Get note |
| PUT | `/api/notes/:id` | Update note |
| DELETE | `/api/notes/:id` | Soft delete note |
| GET | `/api/tags` | List tags |
| GET | `/api/calendar?year=&month=` | Calendar data |
| POST | `/api/sync` | Sync offline changes |
| GET | `/api/history/:id` | Note revision history |
| POST | `/api/history/:id` | Restore revision |

## Sync Architecture

```
Editor → Zustand Store → IndexedDB → Sync Queue → REST API → PostgreSQL
```

Conflict resolution: **Last Updated Wins**, with previous version stored in revision history.

## Markdown Export Format

Daily files: `22_04_2025.md`

```markdown
# Daily Notes — 22 April 2025

## Project Ideas

Content here...

Tags:
#work #ideas

---

## Shopping List

Milk, eggs

Tags:
#personal
```

## Testing

```bash
npm test          # Run once
npm run test:watch  # Watch mode
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+N | New note |
| Ctrl+S | Force sync |
| Ctrl+K | Open search |

## PWA Installation

- **Chrome/Edge**: Click install icon in address bar or use the in-app prompt
- **Android**: "Add to Home Screen" from browser menu
- **iOS Safari**: Share → "Add to Home Screen"

## License

MIT
