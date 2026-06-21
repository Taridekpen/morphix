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
pnpm run build:packages
```

`build:packages` compiles `@morphix/shared` and `@morphix/media`. The `pnpm dev` and `pnpm dev:desktop` scripts run this automatically.

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

- Web: http://127.0.0.1:5173
- API: http://localhost:3001

## Troubleshooting

### `Failed to resolve import "@morphix/media"`

This usually means workspace packages were not built or the repo is incomplete.

1. Pull the latest code and reinstall from the **repo root** (not `apps/web`):

```bash
git pull
pnpm install
```

2. Confirm the packages exist and were compiled:

```powershell
Test-Path packages\media\src\index.ts
Test-Path packages\media\dist\index.js
pnpm run build:packages
```

3. Start dev from the repo root:

```bash
pnpm dev
```

Do **not** use `npm install` — this is a pnpm monorepo. If `packages/` is missing, re-clone the repository.

If `packages/media/dist/index.js` is missing but `packages/media/src` exists, build it manually:

```bash
pnpm --filter @morphix/media build
```

### `ERR_PNPM_EPERM` on Electron during install

Windows often blocks Electron's postinstall (antivirus, file lock, or permissions). The install aborts before workspace packages finish building.

**Option A — Web only (skip Electron/desktop):**

```powershell
pnpm run install:web
pnpm run build:packages
pnpm dev
```

**Option B — Fix Electron install:**

1. Close Morphix, Electron, and terminals using the project folder.
2. Delete the partial Electron folder:

```powershell
Remove-Item -Recurse -Force "node_modules\.pnpm\electron@35.7.5" -ErrorAction SilentlyContinue
```

3. Add a Windows Defender exclusion for `C:\Users\Hp\Documents\morphix` (or your clone path).
4. Run PowerShell **as Administrator**, then:

```powershell
pnpm install
```

5. If Electron still fails but you only need the browser app, use Option A.

### `EADDRINUSE` on port 3001

Another API process is already running. Stop other `pnpm dev` terminals, or on Windows:

```powershell
netstat -ano | findstr :3001
taskkill /PID <pid> /F
```

### Electron failed to install correctly

From the repo root, allow Electron's postinstall script and reinstall:

```bash
pnpm install
pnpm --filter @morphix/desktop rebuild electron
```

On pnpm 9+, ensure `electron: true` is set under `allowBuilds` in `pnpm-workspace.yaml`, then reinstall. Verify the binary exists:

```powershell
Test-Path apps\desktop\node_modules\electron\dist\electron.exe
```

## Features

- **Real-time face swap** — Decart Lucy with reference photo upload
- **Secure API keys** — Decart tokens issued server-side
- **Face gallery** — save and switch multiple reference faces
- **Before/after preview** — split view, PiP, or after-only
- **Recording** — export swapped video as WebM
- **Crypto billing** — submit tx hash, admin approves in dashboard
- **Dark mode** — light/dark/system theme

## Streaming with OBS Virtual Camera

Use Morphix with **OBS Studio** on the same PC to expose the swapped face as **OBS Virtual Camera** (for Zoom, Discord, Teams, etc.):

1. Install [OBS Studio 28+](https://obsproject.com/) and enable **WebSocket Server** (Tools → WebSocket Server Settings)
2. Run `pnpm dev` and open http://127.0.0.1:5173/studio **or** run `pnpm dev:desktop` for the Electron app
3. In Studio: select face → open camera → start swap → **Start OBS Virtual Camera** (allow popups in the browser)
4. In your call app, choose **OBS Virtual Camera** as the camera

Browser OBS control works on **localhost only** (`127.0.0.1:5173`). The desktop app uses window capture; the browser uses an OBS browser source.

See [`apps/desktop/README.md`](apps/desktop/README.md) for details.

## Desktop app

Electron wrapper in `apps/desktop/` — OBS Virtual Camera automation and dedicated swap output window.
