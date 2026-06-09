# תמלולון

A simple, fully static browser-based audio transcription tool. Upload a short audio file and get a Hebrew transcription — all processing happens locally in your browser, with no server, no API keys, and no data sent anywhere.

## What it does

- Accepts audio files (mp3, wav, m4a, ogg, webm, flac — up to 25 MB)
- Transcribes speech to text using [Whisper](https://openai.com/research/whisper) via [Transformers.js](https://huggingface.co/docs/transformers.js) *(integration coming soon)*
- Runs entirely in the browser — completely private
- Hebrew UI with RTL layout, mobile-friendly

## Tech stack

- **React + TypeScript** — component structure and type safety
- **Vite** — fast dev server and build tool
- **Transformers.js** *(planned)* — runs Whisper in the browser via ONNX/WebAssembly

## Run locally

```bash
npm install
npm run dev
```

Then open [http://localhost:5173/timlool/](http://localhost:5173/timlool/) in your browser.

To build for production:

```bash
npm run build
```

Output goes to `dist/`.

## Deploy to GitHub Pages

The Vite config sets `base: '/timlool/'` to match the GitHub Pages URL structure.

### Option 1 — Manual deploy

```bash
npm run build
npx gh-pages -d dist
```

### Option 2 — GitHub Actions (recommended)

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

Enable **GitHub Pages** in your repo settings → Pages → Source: **GitHub Actions**.

## Project structure

```
src/
  components/
    Header.tsx / Header.css         — app title and subtitle
    FileUpload.tsx / FileUpload.css — drag-and-drop upload + transcribe button
    StatusArea.tsx / StatusArea.css — processing status indicator
    TranscriptArea.tsx / ...        — transcript display with copy button
    Footer.tsx / Footer.css         — privacy notice
  App.tsx                           — top-level state and orchestration
  types.ts                          — shared TypeScript types
  index.css                         — global styles, CSS variables
```

## Roadmap

- [ ] Integrate Whisper via Transformers.js for real transcription
- [ ] Show model download progress bar
- [ ] Support longer files with chunked processing
- [ ] Export transcript as `.txt`
