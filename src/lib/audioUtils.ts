/** Sample rate (Hz) that Whisper models expect. */
export const WHISPER_SAMPLE_RATE = 16_000;

/** Formats a duration given in seconds as `m:ss`. */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Decodes an ArrayBuffer of audio data and resamples to 16 kHz mono.
 *
 * Uses only OfflineAudioContext (not AudioContext), so this function works
 * in both the main thread and a Web Worker.
 */
export async function decodeAudioBuffer(buffer: ArrayBuffer): Promise<Float32Array> {
  // A minimal OfflineAudioContext is sufficient to call decodeAudioData;
  // its length/sampleRate are irrelevant for decoding (only used for rendering).
  const decodeCtx = new OfflineAudioContext(1, 1, WHISPER_SAMPLE_RATE);
  const decoded = await decodeCtx.decodeAudioData(buffer);

  // Resample and down-mix to mono at 16 kHz
  const targetLength = Math.round(decoded.duration * WHISPER_SAMPLE_RATE);
  const offlineCtx = new OfflineAudioContext(1, targetLength, WHISPER_SAMPLE_RATE);
  const source = offlineCtx.createBufferSource();
  source.buffer = decoded;
  source.connect(offlineCtx.destination);
  source.start(0);

  const resampled = await offlineCtx.startRendering();
  return resampled.getChannelData(0).slice();
}
