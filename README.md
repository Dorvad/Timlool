# תמלולון

A fully static, browser-based Hebrew audio transcription tool.
Upload an audio file and get a Hebrew transcript — all processing happens locally in your browser using [Whisper](https://openai.com/research/whisper) via [Transformers.js](https://huggingface.co/docs/transformers.js).
No server, no API keys, no data ever leaves your device.

## Features

- **Three Whisper models** — Tiny (39 MB), Base (74 MB, default), Small (244 MB)
- **WhatsApp voice note support** — accepts `.opus` files; helpful fallback message if the browser can't decode the codec
- **Editable transcript** — fix OCR mistakes before copying or downloading
- **Word count + character count**
- **Copy / Download as `.txt`**
- **Auto-save** — last transcript persists in `localStorage` across page reloads
- **"נקה טקסט"** — trims whitespace and collapses repeated blank lines
- **Fully offline after first model download** — model files are cached by the browser

## Tech stack

| Layer | Technology |
|---|---|
| UI | React 19 + TypeScript |
| Build | Vite 8 |
| Inference | `@huggingface/transformers` (Whisper, WebAssembly) |
| Audio decode | `OfflineAudioContext` (works in Web Workers) |
| Worker | Dedicated Web Worker (keeps UI responsive) |
| Fonts | Heebo (Google Fonts) |

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173/timlool/](http://localhost:5173/timlool/).

To build for production:

```bash
npm run build
```

Output goes to `dist/`. Serve with any static host (`npx serve dist` or GitHub Pages).

## Deploy to GitHub Pages

The Vite config sets `base: '/timlool/'`. Override with `VITE_BASE` env var if needed.

### Manual

```bash
npm run build
npx gh-pages -d dist
```

### GitHub Actions (recommended)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
      - id: deployment
        uses: actions/deploy-pages@v4
```

Enable **GitHub Pages** in repo Settings → Pages → Source: **GitHub Actions**.

## Project structure

```
src/
  components/
    Header.tsx / .css          — app title
    FileDropzone.tsx / .css    — drag-and-drop + file validation + duration
    ModelSelector.tsx / .css   — Tiny / Base / Small model picker
    ActionButtons.tsx / .css   — תמלל / נקה / העתק / הורד TXT / נקה טקסט
    StatusMessage.tsx / .css   — loading progress bar + done / error states
    TranscriptBox.tsx / .css   — editable textarea, word/char count, disclaimer
    Footer.tsx / .css          — privacy notice
    icons.tsx                  — SVG icon components
  hooks/
    useTranscriptionWorker.ts  — worker lifecycle, model switching, status state
  workers/
    transcriptionWorker.ts     — Whisper pipeline, audio decode, inference
  lib/
    audioUtils.ts              — decodeAudioBuffer (OfflineAudioContext, 16 kHz mono)
  types/
    transcription.ts           — WorkerRequest / WorkerResponse types, model list
  types.ts                     — TranscriptionStatus, AppState
  App.tsx                      — top-level state and layout
  index.css                    — global CSS variables and base styles
```

## QA checklist

Run through this before shipping a new version.

### File upload

- [ ] **Upload MP3** — file name and size shown; transcription completes
- [ ] **Upload WAV** — same
- [ ] **Upload OPUS** — WhatsApp voice note or standard `.opus`; either transcribes or shows the "הדפדפן לא הצליח לקרוא" message with instructions
- [ ] **File > 25 MB** — rejected at the dropzone with a Hebrew size error, transcription never starts
- [ ] **Wrong file type** (e.g. `.pdf`) — rejected with a Hebrew format error

### Model selector

- [ ] **Switch to Tiny** — next transcription uses the fast model; loading message appears on first use
- [ ] **Switch back to Base** — re-downloads if needed, then reuses cache on repeat
- [ ] **Selector disabled while transcribing** — cannot change model mid-run

### Transcript actions

- [ ] **Copy transcript** — clipboard receives the current (possibly edited) text; button briefly shows "הועתק!"
- [ ] **Download TXT** — file named after the audio file downloads with the transcript text
- [ ] **Edit transcript** — typing in the textarea updates word/char counts
- [ ] **"נקה טקסט"** — collapses multiple spaces and blank lines; does not alter words
- [ ] **Clear (נקה)** — dropzone resets, transcript clears, word count shows 0
- [ ] **localStorage restore** — reload the page; last transcript reappears in the textarea

### Error handling

- [ ] **Decode failure** — shows "הדפדפן לא הצליח לקרוא את הקובץ הזה. נסה להמיר אותו ל-MP3 או WAV ולהעלות שוב."
- [ ] **Model load failure** (disconnect network mid-download) — shows Hebrew error with hint to check connection

### Cross-device

- [ ] **Chrome desktop** — full flow works
- [ ] **Android Chrome** — upload, transcription, and copy all work on mobile
