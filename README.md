# Morphix — Face Swap Studio

Real-time face swap powered by Decart Lucy, with secure backend, SaaS billing, and a simple studio dashboard.

## Architecture

```
apps/web     — React 19 + TypeScript + Tailwind (Vite)
apps/api     — Fastify + Mongoose + MongoDB
packages/shared — Shared types and Zod schemas
packages/media  — MediaManager + LiveSessionController
```

## Prerequisites

- Node.js 20+
- pnpm (`npm install -g pnpm`)
- MongoDB (local install or [MongoDB Atlas](https://www.mongodb.com/atlas))

## Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure API environment

```bash
cp apps/api/.env.example apps/api/.env
```

Edit `apps/api/.env`:

- `MONGODB_URI` — e.g. `mongodb://127.0.0.1:27017/morphix` or your Atlas connection string
- `DECART_API_KEY`, `JWT_SECRET`

### 3. Seed the database

Ensure MongoDB is running, then:

```bash
pnpm db:seed
```

Creates admin user: `admin@morphix.local` / `admin123456` (with active Pro subscription).

### 4. Run development servers

```bash
pnpm dev
```

- Web: http://localhost:5173
- API: http://localhost:3001

## Features

- **Real-time face swap** — Decart Lucy with reference photo upload
- **Secure API keys** — Decart tokens issued server-side
- **Face gallery** — save and switch multiple reference faces
- **Before/after preview** — split view, PiP, or after-only
- **Recording** — export swapped video as WebM
- **Crypto billing** — submit tx hash, admin approves in dashboard
- **Dark mode** — light/dark/system theme

## Streaming with OBS Virtual Camera

Use the **Morphix Desktop** app to send the swapped face to OBS Virtual Camera (for Zoom, Discord, Teams, etc.):

1. Install [OBS Studio 28+](https://obsproject.com/) and enable **WebSocket Server** (Tools → WebSocket Server Settings)
2. Run `pnpm dev:desktop` (starts web, API, and Electron)
3. In Studio: select face → open camera → start swap → **Start OBS Virtual Camera**
4. In your call app, choose **OBS Virtual Camera** as the camera

See [`apps/desktop/README.md`](apps/desktop/README.md) for details.

## Desktop app

Electron wrapper in `apps/desktop/` — OBS Virtual Camera automation and dedicated swap output window.
