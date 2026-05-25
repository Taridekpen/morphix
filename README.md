# Morphix — Face & Voice Studio

Real-time face swap (Decart Lucy) + voice changer (Fish Audio) fused into one app.

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
Copy `.env.example` to `.env` and fill in your keys:
```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_DECART_API_KEY=your_decart_api_key_here
VITE_FISH_API_KEY=your_fish_audio_api_key_here
VITE_FISH_VOICE_ID=your_fish_voice_id_here
```

> You can also leave Fish keys blank and enter them directly in the app UI.

### 3. Run
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173)

---

## For Voice Changer → Zoom/Discord routing

**Windows:** Install [VB-Cable](https://vb-audio.com/Cable/) (free)  
**Mac:** Install [BlackHole](https://existential.audio/blackhole/) (free)

Then in Zoom/Discord: Settings → Audio → Microphone → select the virtual cable.

---

## How it works

```
Camera → Decart Lucy (cloud) → swapped face video in browser
Mic    → Fish Audio (cloud)  → converted voice → virtual cable → Zoom/Discord
```

Both run simultaneously and independently.
