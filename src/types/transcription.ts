/** Default model used on first load. */
export const DEFAULT_MODEL = 'Xenova/whisper-base';

/** Default transcription language (BCP-47 code). */
export const DEFAULT_LANGUAGE = 'he';

/** Whisper model options the user can choose from. */
export const SUPPORTED_MODELS = [
  { id: 'Xenova/whisper-tiny',  label: 'Tiny (39M) – מהיר מאוד'    },
  { id: 'Xenova/whisper-base',  label: 'Base (74M) – מומלץ'          },
  { id: 'Xenova/whisper-small', label: 'Small (244M) – מדויק יותר'   },
] as const satisfies ReadonlyArray<{ id: string; label: string }>;

export type ModelId = (typeof SUPPORTED_MODELS)[number]['id'];

// ── Worker protocol ──────────────────────────────────────────

/** Messages sent FROM the main thread TO the worker. */
export type WorkerRequest =
  | { type: 'load';       model?: string                         }
  | { type: 'transcribe'; audio: Float32Array; language?: string }
  | { type: 'abort'                                              };

/** Messages sent FROM the worker TO the main thread. */
export type WorkerResponse =
  | { type: 'model-loading'; progress: number; file: string     }
  | { type: 'model-ready';   model: string                      }
  | { type: 'transcribing'                                      }
  | { type: 'done';          text: string                       }
  | { type: 'error';         message: string                    };
