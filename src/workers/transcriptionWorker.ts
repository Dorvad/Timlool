/**
 * Transcription Web Worker
 *
 * Runs Whisper via @huggingface/transformers inside a dedicated worker so
 * the UI thread stays responsive during model loading and inference.
 *
 * Protocol
 *   Main → Worker  WorkerRequest  (load | transcribe | abort)
 *   Worker → Main  WorkerResponse (model-loading | model-ready | transcribing | done | error)
 */

import {
  pipeline,
  env,
  type AutomaticSpeechRecognitionPipeline,
  type ProgressInfo,
} from '@huggingface/transformers';
import type { WorkerRequest, WorkerResponse } from '../types/transcription';

// ── Transformers.js environment ──────────────────────────────
// Never read from local filesystem; rely on browser's Cache API
env.allowLocalModels = false;
env.useBrowserCache  = true;

// ── Module-level state ───────────────────────────────────────
let pipe: AutomaticSpeechRecognitionPipeline | null = null;
let loadedModel: string | null = null;

// ── Helpers ──────────────────────────────────────────────────

/** Type-safe wrapper around the worker's postMessage. */
function send(msg: WorkerResponse): void {
  // Both DOM and WebWorker libs declare postMessage; the worker-context
  // overload (single-arg) is used here.
  postMessage(msg);
}

/** Translates Transformers.js progress events into WorkerResponse messages. */
function onProgress(info: ProgressInfo): void {
  if (info.status === 'progress') {
    send({ type: 'model-loading', progress: info.progress, file: info.file });
  } else if (info.status === 'progress_total') {
    send({ type: 'model-loading', progress: info.progress, file: '' });
  }
}

// ── Core operations ──────────────────────────────────────────

async function loadModel(model: string): Promise<void> {
  // Re-use the already-loaded pipeline for the same model
  if (pipe !== null && loadedModel === model) {
    send({ type: 'model-ready', model });
    return;
  }

  // Discard any pipeline for a different model
  pipe = null;
  loadedModel = null;

  try {
    send({ type: 'model-loading', progress: 0, file: '' });

    pipe = await pipeline('automatic-speech-recognition', model, {
      progress_callback: onProgress,
    });

    loadedModel = model;
    send({ type: 'model-ready', model });
  } catch (err) {
    send({
      type: 'error',
      message: err instanceof Error ? err.message : 'שגיאה בטעינת המודל',
    });
  }
}

async function transcribe(audio: Float32Array, language: string): Promise<void> {
  if (pipe === null) {
    send({ type: 'error', message: 'המודל טרם נטען. יש לטעון מודל תחילה.' });
    return;
  }

  try {
    send({ type: 'transcribing' });

    const result = await pipe(audio, {
      language,
      task: 'transcribe',
      // Process audio in 30-second chunks with 5-second overlap so longer
      // recordings are handled gracefully even before streaming is wired up.
      chunk_length_s:  30,
      stride_length_s: 5,
    });

    // The pipeline returns a single output for a single input
    const text = result.text.trim();
    send({ type: 'done', text });
  } catch (err) {
    send({
      type: 'error',
      message: err instanceof Error ? err.message : 'שגיאה בתהליך התמלול',
    });
  }
}

// ── Message handler ──────────────────────────────────────────

addEventListener('message', (event: MessageEvent<WorkerRequest>) => {
  const msg = event.data;
  switch (msg.type) {
    case 'load':
      void loadModel(msg.model ?? 'Xenova/whisper-base');
      break;
    case 'transcribe':
      void transcribe(msg.audio, msg.language ?? 'he');
      break;
    case 'abort':
      // Abort support will be added when the pipeline exposes a cancellation
      // token. For now the in-flight call runs to completion.
      break;
  }
});
