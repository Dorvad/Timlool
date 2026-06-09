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
import { decodeAudioBuffer } from '../lib/audioUtils';

// ── Transformers.js environment ──────────────────────────────
// Never read from local filesystem; rely on browser's Cache API
env.allowLocalModels = false;
env.useBrowserCache  = true;

// Disable ONNX multi-threading: GitHub Pages lacks COOP/COEP headers
// needed for SharedArrayBuffer, so the threaded WASM backend will fail.
// Single-threaded mode avoids SharedArrayBuffer entirely.
// @ts-expect-error – onnx backend config not in public types
env.backends.onnx.wasm.numThreads = 1;

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
      // q8 = int8 quantization; avoids q4/MatMulNBits format which the
      // bundled ONNX Runtime version doesn't support
      dtype: 'q8',
      // 'basic' skips the extended graph optimizer that triggers the
      // TransposeDQWeightsForMatMulNBits crash in onnxruntime-web 1.26.0-dev
      session_options: { graphOptimizationLevel: 'basic' },
      progress_callback: onProgress,
    });

    loadedModel = model;
    send({ type: 'model-ready', model });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    send({
      type: 'error',
      message: `שגיאה בטעינת המודל: ${detail}`,
    });
  }
}

async function transcribe(audioBuffer: ArrayBuffer, language: string): Promise<void> {
  if (pipe === null) {
    send({ type: 'error', message: 'המודל טרם נטען. יש לטעון מודל תחילה.' });
    return;
  }

  let audio: Float32Array;
  try {
    send({ type: 'decoding' });
    audio = await decodeAudioBuffer(audioBuffer);
  } catch (err) {
    send({
      type: 'error',
      message: err instanceof Error
        ? err.message
        : 'הדפדפן לא הצליח לקרוא את הקובץ הזה. נסה להמיר אותו ל-MP3 או WAV ולהעלות שוב.',
    });
    return;
  }

  try {
    send({ type: 'transcribing' });
    const result = await pipe(audio, {
      language,
      task: 'transcribe',
      chunk_length_s:  30,
      stride_length_s: 5,
    });

    const text = result.text.trim();
    send({ type: 'done', text });
  } catch (err) {
    send({
      type: 'error',
      message: err instanceof Error ? err.message : 'שגיאה בתהליך התמלול. יש לנסות שוב.',
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
      void transcribe(msg.audioBuffer, msg.language ?? 'he');
      break;
    case 'abort':
      // Abort support will be added when the pipeline exposes a cancellation
      // token. For now the in-flight call runs to completion.
      break;
  }
});
