# No Masters: 75 Hard — Project Briefing
> For Claude Opus 4.6 — read this entire file before writing a single line of code.

---

## What This Is

A fully customizable 75 Hard challenge tracker built under the **No Masters** brand (nomasters.biz). Users define their own tasks, durations, and rules. The default is the classic 75 Hard protocol but nothing is hardcoded. This is a fan-engagement and self-development tool within the No Masters ecosystem.

**Live URL (target):** https://challenge.nomasters.biz  
**API URL (target):** https://api.nomasters.biz  

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Express + Node.js |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT + refresh tokens |
| Storage | Supabase Storage (progress photos) |
| Frontend deploy | Vercel (connected account) |
| Backend deploy | Cloudflare Workers via Wrangler (connected account) |
| DNS | Cloudflare — nomasters.biz zone |
| Push notifications | web-push library |
| Fallback deploy | Railway (if Express incompatible with CF Workers) |

---

## Directory Structure

```
/Users/godschild/Documents/75 Hard App/
├── client/
│   ├── src/
│   │   ├── pages/         # Dashboard, Config, Log, History
│   │   ├── components/    # TaskItem, ProgressBar, HeatmapDots, StatCard, DurationPicker
│   │   ├── hooks/         # useChallenge, useAuth, useDailyLog
│   │   ├── api/           # Axios instance + all route helpers
│   │   ├── store/         # Zustand state
│   │   └── styles/        # index.css — No Masters CSS vars + Tailwind config
│   └── vite.config.js
├── server/
│   ├── routes/            # auth, challenges, logs
│   ├── middleware/         # JWT auth, error handler
│   ├── services/          # all business logic (routes stay thin)
│   └── index.js
├── prisma/
│   ├── schema.prisma
│   └── seed.js
├── .env.example
├── CLAUDE.md              # persistent context for Claude Code sessions
└── README.md              # this file
```

---

## No Masters Design System

### Color Tokens
Define these in `/client/src/styles/index.css`:

```css
:root {
  --nm-bg:           #0f0e0d;
  --nm-surface:      #1a1917;
  --nm-surface2:     #242220;
  --nm-gold:         #C9A96E;
  --nm-gold-dim:     #8a6e42;
  --nm-white:        #f0ede8;
  --nm-muted:        #6b6760;
  --nm-border:       rgba(201,169,110,0.15);
  --nm-border-hover: rgba(201,169,110,0.35);
  --nm-success:      #3a6b3a;
  --nm-success-text: #7ec97e;
  --nm-danger:       #6b3a3a;
  --nm-danger-text:  #c97e7e;
}
```

### Typography
- **Wordmark + day counter**: `Georgia, 'Times New Roman', serif` — gold, uppercase, letter-spacing 0.12em
- **All UI + body copy**: `'DM Sans', sans-serif` — import from Google Fonts
- Day counter: 56px Georgia, gold — the hero number on the dashboard
- Section labels: 10–11px, uppercase, letter-spacing 0.10–0.12em, `--nm-muted`
- Body text: 13–14px DM Sans, `--nm-white`
- Metadata badges: 11px pill, `--nm-surface2` background

### Key Components
- **Cards**: `bg --nm-surface`, `1px solid --nm-border`, `border-radius 8px`
- **CTA button**: `bg --nm-gold`, `color --nm-bg`, uppercase, font-weight 600, letter-spacing 0.06em
- **Ghost button**: transparent, `1px solid --nm-border-hover`, gold text on hover
- **Duration pill selector**: pills for 75 / 90 / 120 / 150 / Custom
  - Active: gold filled (`--nm-gold`), dark text (`--nm-bg`)
  - Inactive: transparent, gold border, muted text
  - "Custom" pill reveals a number input for any positive integer
- **Progress bar**: 3px height, `--nm-surface2` track, `--nm-gold` fill
- **Task checkbox**: circular 18px — empty border → fills `--nm-success` on complete
- **Heatmap dots**: 10×10px, `border-radius 2px` — `--nm-surface2` empty / `--nm-gold-dim` past / `--nm-gold` today

### Copy & Voice
- Terse. No fluff.
- "Current day" not "Your progress today"
- "Submit today" not "Complete your check-in"
- "Day reset. Start again." not "Oops! You missed a task."
- Wordmark always: **NO MASTERS** — all caps, Georgia, `--nm-gold`

---

## Database Schema (Prisma)

```prisma
model User {
  id           String      @id @default(cuid())
  email        String      @unique
  passwordHash String
  timezone     String      @default("America/Chicago")
  createdAt    DateTime    @default(now())
  challenges   Challenge[]
  logs         DailyLog[]
}

model Challenge {
  id           String     @id @default(cuid())
  userId       String
  name         String
  startDate    DateTime
  durationDays Int        // plain Int — no enum, no constraint. 75, 90, 120, 150, or any custom positive integer.
  isActive     Boolean    @default(true)
  restartOnFail Boolean   @default(true)
  createdAt    DateTime   @default(now())
  user         User       @relation(fields: [userId], references: [id])
  tasks        Task[]
  logs         DailyLog[]
}

model Task {
  id             String            @id @default(cuid())
  challengeId    String
  label          String
  description    String?
  quantityTarget Float?
  quantityUnit   String?
  isRequired     Boolean           @default(true)
  order          Int
  challenge      Challenge         @relation(fields: [challengeId], references: [id])
  completions    TaskCompletion[]
}

model DailyLog {
  id          String           @id @default(cuid())
  challengeId String
  userId      String
  date        DateTime
  dayNumber   Int
  notes       String?
  completedAt DateTime?
  challenge   Challenge        @relation(fields: [challengeId], references: [id])
  user        User             @relation(fields: [userId], references: [id])
  completions TaskCompletion[]
}

model TaskCompletion {
  id         String    @id @default(cuid())
  dailyLogId String
  taskId     String
  completedAt DateTime @default(now())
  value      Float?
  photoUrl   String?
  log        DailyLog  @relation(fields: [dailyLogId], references: [id])
  task       Task      @relation(fields: [taskId], references: [id])
}
```

### Seed Data
One test user + a 75-day challenge with these default tasks (all editable in UI):
1. Morning workout — 45 min, required
2. Outdoor workout — 45 min, required
3. Read non-fiction — 10 pages, required
4. Drink water — 1 gallon, required
5. Follow diet · no alcohol — required
6. Progress photo — optional

---

## API Routes

All responses: `{ success: boolean, data: any, error?: string }`  
Protected routes require: `Authorization: Bearer <token>`

```
POST   /auth/register
POST   /auth/login
POST   /auth/refresh
GET    /auth/me                         protected

GET    /challenges                      protected
POST   /challenges                      protected — body: { name, startDate, durationDays, restartOnFail, tasks[] }
GET    /challenges/:id                  protected
PUT    /challenges/:id                  protected
DELETE /challenges/:id                  protected

GET    /challenges/:id/log/today        protected
POST   /challenges/:id/log/today        protected
GET    /challenges/:id/log              protected
```

---

## Features

### Core
- Fully customizable task list — label, description, quantity target, unit, required toggle
- Flexible duration — preset pills: 75 / 90 / 120 / 150 / Custom (any positive integer)
- Restart rules — strict (miss required task = reset `dayNumber`, history preserved) or flexible
- Daily check-in — checkbox per task, quantity input where needed
- Streak tracking — current streak + best streak
- Day counter — Day X of Y, Georgia serif, gold, 56px

### Extended
- Progress photos — optional per day, Supabase Storage, shown in log history
- Push notifications — user sets daily reminder time, server pushes via web-push
- Multi-challenge — archive old challenges, start new ones, view full history
- Calendar heatmap — 30-day dot grid, gold on completion

### Restart Logic
If `restartOnFail = true` and user submits a day with a required task incomplete:
- Show confirmation warning before submitting
- On confirm: `dayNumber` resets to 1
- Log history is always preserved — never deleted

---

## Environment Variables

```bash
# /server/.env (copy from .env.example)
DATABASE_URL=
JWT_SECRET=
JWT_REFRESH_SECRET=
PORT=3001
SUPABASE_URL=
SUPABASE_ANON_KEY=
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
CLIENT_URL=https://challenge.nomasters.biz   # production
# CLIENT_URL=http://localhost:5173           # local dev

# /client/.env
VITE_API_URL=https://api.nomasters.biz       # production
# VITE_API_URL=http://localhost:3001         # local dev
```

---

## Dev Commands

```bash
# Install
cd client && npm install
cd server && npm install

# Run locally
cd client && npm run dev    # http://localhost:5173
cd server && npm run dev    # http://localhost:3001

# Database
npx prisma migrate dev
npx prisma db seed
npx prisma studio
```

---

## Deploy Instructions

### Frontend → Vercel
```bash
cd client
vercel --prod
# In Vercel dashboard: add custom domain challenge.nomasters.biz
# Set env var: VITE_API_URL = https://api.nomasters.biz
```

### DNS (Cloudflare — nomasters.biz zone)
```
Type   Name        Value                      Proxy
CNAME  challenge   cname.vercel-dns.com       DNS only (grey cloud)
CNAME  api         <project>.workers.dev      Proxied (orange cloud)
```

### Backend → Cloudflare Workers
```bash
cd server
wrangler deploy

# Set all secrets
wrangler secret put DATABASE_URL
wrangler secret put JWT_SECRET
wrangler secret put JWT_REFRESH_SECRET
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_ANON_KEY
wrangler secret put VAPID_PUBLIC_KEY
wrangler secret put VAPID_PRIVATE_KEY
wrangler secret put CLIENT_URL   # → https://challenge.nomasters.biz

# In wrangler.toml set custom domain: api.nomasters.biz

# Run production migration
DATABASE_URL=<prod_url> npx prisma migrate deploy
```

### Fallback (if Express incompatible with CF Workers)
```bash
cd server
railway up
railway variables set KEY=VALUE ...
# Update Cloudflare DNS: api CNAME → Railway domain
```

### Confirm Live
```
https://challenge.nomasters.biz        — frontend loads
https://api.nomasters.biz/auth/me      — returns 401 (unauthorized) = API is up
```

---

## Build Prompts — Run in Claude Code in This Order

Start every session with:
```
Read CLAUDE.md and confirm you have the project context before we start.
```

---

### Prompt 1 — Scaffold
```
Create a new full-stack web app in the current directory with this structure:

/client  — React 18 + Vite + Tailwind CSS
/server  — Express + Node.js
/prisma  — schema + migrations

Install all dependencies for both client and server. Set up the No Masters CSS variables and import DM Sans from Google Fonts in the client. Create a .env.example with placeholders for DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, PORT, SUPABASE_URL, SUPABASE_ANON_KEY, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, CLIENT_URL.
```

---

### Prompt 2 — Database
```
In prisma/schema.prisma create these models:

User (id, email, passwordHash, timezone, createdAt)
Challenge (id, userId, name, startDate, durationDays, isActive, restartOnFail, createdAt)
Task (id, challengeId, label, description, quantityTarget, quantityUnit, isRequired, order)
DailyLog (id, challengeId, userId, date, dayNumber, notes, completedAt)
TaskCompletion (id, dailyLogId, taskId, completedAt, value, photoUrl)

durationDays is a plain Int — no enum, no constraint, accepts any positive integer.

Run the migration. Seed one test user with a default 75-day challenge with these tasks: morning workout 45min, outdoor workout 45min, read non-fiction 10 pages, drink water 1 gallon, follow diet/no alcohol (required), progress photo (optional).
```

---

### Prompt 3 — Auth + API
```
Build these Express routes in /server:

POST   /auth/register
POST   /auth/login
POST   /auth/refresh
GET    /auth/me (protected)

GET    /challenges
POST   /challenges
GET    /challenges/:id
PUT    /challenges/:id
DELETE /challenges/:id

GET    /challenges/:id/log/today
POST   /challenges/:id/log/today
GET    /challenges/:id/log

All protected routes use JWT middleware that attaches req.user. Business logic goes in /server/services/ — routes stay thin. All responses return { success, data, error }.
```

---

### Prompt 4 — Challenge Config UI
```
Build the Challenge Configuration page at /client/src/pages/Config.jsx using the No Masters design system from CLAUDE.md.

Fields:
- Challenge name (text input)
- Start date (date picker)
- Duration pill selector: pills for 75 / 90 / 120 / 150 / Custom
  - Active pill: gold filled (#C9A96E), dark text
  - Inactive pill: transparent, gold border, muted text
  - Selecting Custom reveals a number input for any positive integer
- Restart on fail toggle (gold when on)
- Dynamic task list — add, remove, reorder
  - Each task: label, description (optional), quantity target, unit, required toggle
- Pre-populated with the 6 default tasks from CLAUDE.md, all editable

On save: POST /challenges with { name, startDate, durationDays, restartOnFail, tasks[] }
```

---

### Prompt 5 — Dashboard + Check-in
```
Build the Dashboard page at /client/src/pages/Dashboard.jsx using the No Masters design system.

Layout:
- Top: NO MASTERS wordmark (Georgia serif, gold, uppercase, letter-spacing 0.12em)
- Hero: large day counter (Georgia 56px gold) + "of X days" label + current streak
- Gold progress bar (3px, shows % of challenge complete)
- Section label "today's tasks" (11px uppercase muted)
- Task list — each task is a card with circular checkbox, task name, quantity metadata
  - Incomplete: dark surface, ghost border
  - Complete: green tint background, checkmark filled, name struck through
- Stats grid: completion %, days left
- Heatmap dot grid (30 days) — empty/past/today = surface2/gold-dim/gold
- "Submit today" CTA button (gold, full width, uppercase)

If a required task is incomplete when Submit is pressed and restartOnFail is true, show a confirmation warning before submitting.

Wire everything to the API routes from Prompt 3.
```

---

### Prompt 6 — Polish + Deploy
```
Add:
1. Web push notifications — user sets a daily reminder time in profile settings, server sends push at that time via the web-push library
2. Progress photo upload — optional per day, stored in Supabase Storage, displayed in log history
3. Multiple challenge support — user can archive a challenge and start a new one, view full history
4. Mobile responsive layout across all pages

Then deploy:

FRONTEND → Vercel:
- Use my connected Vercel account
- Run vercel --prod from /client
- Add challenge.nomasters.biz as a custom domain in the Vercel dashboard
- Set VITE_API_URL = https://api.nomasters.biz

DNS → Cloudflare (nomasters.biz zone):
- CNAME: name = challenge, value = cname.vercel-dns.com, proxy = DNS only
- CNAME: name = api, value = <project>.workers.dev, proxy = Proxied

BACKEND → Cloudflare Workers:
- Use my connected Cloudflare account
- Run wrangler deploy from /server
- Set custom domain api.nomasters.biz in wrangler.toml
- Set all secrets via wrangler secret put: DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, SUPABASE_URL, SUPABASE_ANON_KEY, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, CLIENT_URL (= https://challenge.nomasters.biz)
- Run final migration: DATABASE_URL=<prod_url> npx prisma migrate deploy

If Express is not compatible with Cloudflare Workers, deploy the server to Railway instead using my connected Railway account, then update the Cloudflare DNS api CNAME to point to the Railway domain.

Confirm live:
- https://challenge.nomasters.biz loads the app
- https://api.nomasters.biz/auth/me returns 401 (API is up)
```

---

## Coding Conventions
- All API calls go through `/client/src/api/` — no raw fetch in components
- Business logic in `/server/services/` — routes stay thin
- Async/await + try/catch everywhere — no unhandled rejections
- Prisma queries only in services, never directly in routes
- JWT middleware attaches `req.user` — always validate it exists in protected routes
- Timezone: stored on User model, all date comparisons use user's local timezone not UTC

## Non-Negotiables
- `durationDays` is a plain `Int` — never add an enum or a fixed set of allowed values
- Progress photos never block day submission — always optional
- Restart resets `dayNumber` only — log history is never deleted
- No social or public features in v1 — all data is private per user
- No Masters wordmark is always Georgia serif, uppercase, `#C9A96E`
