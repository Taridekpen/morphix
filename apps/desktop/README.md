# Morphix Desktop
## Development
From the repo root, run API, web, and desktop tpgether:

```bash
pnpm dev:desktop
```

Or separately:

```bash
pnpm dev:api
pnpm dev:web
pnpm --filter @morphix/desktop dev
```

The desktop app loads `http://127.0.0.1:5173/studio` and waits for the web dev server.

## Usage

1. Log in and open **Studio**
2. Select a reference face → **Open camera** → **Start swap**
3. Click **Start OBS Virtual Camera**
4. In Zoom/Discord, choose **OBS Virtual Camera** as your camera

## Build installer

```bash
pnpm --filter @morphix/desktop dist
```

Output is written to `apps/desktop/release/`.