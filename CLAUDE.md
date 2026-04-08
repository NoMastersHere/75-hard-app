# CLAUDE.md — No Masters: 75 Hard

## Project Overview
A fully customizable 75 Hard challenge tracker built under the No Masters brand (nomasters.biz).
Users define their own tasks, durations, and rules — the default is classic 75 Hard but nothing is hardcoded.
This app lives within the No Masters ecosystem as a fan-engagement and self-development tool.

---

## Brand: No Masters Design System

### Colors (CSS variables — define in index.css or tailwind.config.js)
```css
--nm-bg:           #0f0e0d;   /* near-black background */
--nm-surface:      #1a1917;   /* card / panel surfaces */
--nm-surface2:     #242220;   /* input fields, secondary surfaces */
--nm-gold:         #C9A96E;   /* primary accent — ALL CTAs, active states, highlights */
--nm-gold-dim:     #8a6e42;   /* muted gold — heatmap past days, secondary accents */
--nm-white:        #f0ede8;   /* warm off-white for primary text */
--nm-muted:        #6b6760;   /* secondary text, labels, metadata */
--nm-border:       rgba(201,169,110,0.15);   /* default border */
--nm-border-hover: rgba(201,169,110,0.35);   /* hover/focus border */
--nm-success:      #3a6b3a;   /* task complete background */
--nm-success-text: #7ec97e;   /* task complete text */
--nm-danger:       #6b3a3a;   /* missed task / restart warning */
--nm-danger-text:  #c97e7e;
```

### Typography
- **Wordmark / display headings**: `Georgia, 'Times New Roman', serif` — uppercase, tracked (letter-spacing: 0.12em), gold
- **Body / UI**: `'DM Sans', sans-serif` — import from Google Fonts
- **Day counter**: Georgia serif, 56px, gold — the hero number on the dashboard
- **Section labels**: 10–11px, uppercase, letter-spacing 0.10–0.12em, `--nm-muted`
- **Body text**: 13–14px DM Sans, `--nm-white`
- **Metadata / badges**: 11px, rounded pill, `--nm-surface2` background

### Component Patterns
- **Cards**: `background: --nm-surface`, `border: 1px solid --nm-border`, `border-radius: 8px`
- **CTA buttons**: `background: --nm-gold`, `color: --nm-bg`, uppercase, font-weight 600, letter-spacing 0.06em
- **Ghost buttons**: transparent bg, `border: 1px solid --nm-border-hover`, gold text on hover
- **Progress bar**: 3px height, `--nm-surface2` track, `--nm-gold` fill
- **Checkboxes**: circular 18px, border `--nm-border-hover` → filled `--nm-success` when done
- **Heatmap dots**: 10×10px, `border-radius: 2px` — `--nm-surface2` empty / `--nm-gold-dim` past / `--nm-gold` today
- **Day number**: Georgia serif, 56px, gold on near-black — the hero element

### Voice & Copy
- Terse. No fluff. Feels earned.
- "Current day" not "Your progress"
- "Submit today" not "Complete your check-in"
- "Day reset. Start again." not "Oops! Looks like you missed a task."
- Section labels in lowercase except wordmark (NO MASTERS in all-caps gold serif)

---

## Stack
- **Frontend**: React 18 + Vite + Tailwind CSS (`/client`)
- **Backend**: Express + Node.js REST API (`/server`)
- **Database**: PostgreSQL + Prisma ORM (`/prisma`)
- **Auth**: JWT + refresh tokens
- **Storage**: Supabase Storage (progress photos)
- **Frontend deploy**: Vercel (connected account)
- **Backend deploy**: Cloudflare Workers via Wrangler — fallback: Railway
- **Push Notifications**: web-push library

## Directory Structure
```
/
├── client/
│   ├── src/
│   │   ├── pages/        # Dashboard, Config, Log, History
│   │   ├── components/   # TaskItem, ProgressBar, HeatmapDots, StatCard
│   │   ├── hooks/        # useChallenge, useAuth, useDailyLog
│   │   ├── api/          # Axios instance + route helpers
│   │   ├── store/        # Zustand state
│   │   └── styles/       # index.css with --nm-* CSS vars + Tailwind config
│   └── vite.config.js
├── server/
│   ├── routes/           # auth, challenges, logs
│   ├── middleware/        # JWT auth, error handler
│   ├── services/         # business logic layer
│   └── index.js
├── prisma/
│   ├── schema.prisma
│   └── seed.js
├── .env.example
└── CLAUDE.md
```

## Database Models (Prisma)
- **User** — id, email, passwordHash, timezone, createdAt
- **Challenge** — id, userId, name, startDate, durationDays, isActive, restartOnFail, createdAt
- **Task** — id, challengeId, label, description, quantityTarget, quantityUnit, isRequired, order
- **DailyLog** — id, challengeId, userId, date, dayNumber, notes, completedAt
- **TaskCompletion** — id, dailyLogId, taskId, completedAt, value, photoUrl

## API Routes
```
POST   /auth/register
POST   /auth/login
POST   /auth/refresh
GET    /auth/me

GET    /challenges
POST   /challenges
GET    /challenges/:id
PUT    /challenges/:id
DELETE /challenges/:id

GET    /challenges/:id/log/today
POST   /challenges/:id/log/today
GET    /challenges/:id/log
```

All protected routes require `Authorization: Bearer <token>`.
All responses return `{ success: boolean, data: any, error?: string }`.

## Key Features
- **Fully customizable tasks**: label, description, quantity target, unit, required toggle
- **Flexible duration**: 30 / 45 / 60 / 75 / custom days
- **Restart rules**: strict (miss required task = reset day count, history preserved) or flexible
- **Daily check-in**: checkbox per task, quantity input where applicable
- **Streak + day tracking**: current streak, best streak, day X of Y
- **Progress photos**: optional per day, Supabase Storage
- **Push notifications**: user sets daily reminder time
- **Multi-challenge**: archive old, start new
- **Heatmap**: gold dot grid — 30-day view, clickable past days

## Default 75 Hard Tasks (seeded, all editable)
1. Morning workout — 45 min
2. Outdoor workout — 45 min
3. Read non-fiction — 10 pages
4. Drink water — 1 gallon
5. Follow diet · no alcohol — required
6. Progress photo — optional

## Environment Variables
```
DATABASE_URL=
JWT_SECRET=
JWT_REFRESH_SECRET=
PORT=3001
SUPABASE_URL=
SUPABASE_ANON_KEY=
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
CLIENT_URL=http://localhost:5173
```

## Dev Commands
```bash
cd client && npm install && npm run dev    # http://localhost:5173
cd server && npm install && npm run dev    # http://localhost:3001
npx prisma migrate dev
npx prisma db seed
npx prisma studio
```

## Coding Conventions
- All API calls go through `/client/src/api/` — no raw fetch in components
- Business logic in `/server/services/` — routes stay thin
- Async/await + try/catch everywhere
- Prisma queries only in services, never in routes
- JWT middleware attaches `req.user`

## Deploy
**Frontend → Vercel:**
```bash
cd client && vercel --prod
# Set VITE_API_URL in Vercel dashboard → production server URL
```

**Backend → Cloudflare Workers:**
```bash
cd server && wrangler deploy
wrangler secret put DATABASE_URL
wrangler secret put JWT_SECRET
wrangler secret put JWT_REFRESH_SECRET
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_ANON_KEY
wrangler secret put VAPID_PUBLIC_KEY
wrangler secret put VAPID_PRIVATE_KEY
wrangler secret put CLIENT_URL
DATABASE_URL=<prod_url> npx prisma migrate deploy
```

**Fallback (if Cloudflare Workers incompatible with Express):**
```bash
cd server && railway up
railway variables set KEY=VALUE ...
```

Confirm both live: hit GET /auth/me from the deployed frontend URL.

## Build Order
1. Scaffold + deps
2. Prisma schema + seed
3. Auth + API routes
4. Challenge config UI
5. Dashboard + daily check-in
6. Push notifications + photos + deploy

## Known Decisions
- No social features in v1 — single user, private
- Restart: `dayNumber` resets if required task missed and `restartOnFail` true — log history always preserved
- Progress photos never block day completion
- Timezone on User model — all date logic uses user local time
- No Masters wordmark: Georgia serif, uppercase, gold (#C9A96E), letter-spacing 0.12em
- All other UI: DM Sans
