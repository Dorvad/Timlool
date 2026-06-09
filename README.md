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

The workflow file is already included at `.github/workflows/deploy.yml`.
The Vite config uses `base: '/timlool/'` which matches this repository name.

### Setup steps

1. Push this project to a GitHub repository named **`timlool`**.
2. Open the repository on GitHub and go to **Settings**.
3. In the left sidebar click **Pages**.
4. Under **Source**, select **GitHub Actions**.
5. Push a commit to the **`main`** branch (or trigger the workflow manually under **Actions → Deploy to GitHub Pages → Run workflow**).
6. Wait for the deploy action to finish (usually under a minute).
7. Open the URL shown in Pages settings — it will be `https://USERNAME.github.io/timlool/`.

> **Different repository name?** Set the `VITE_BASE` environment variable in the workflow's build step to match your repo name, e.g. `VITE_BASE=/my-repo/ npm run build`.

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
