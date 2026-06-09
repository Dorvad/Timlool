/** Sample rate (Hz) that Whisper models expect. */
export const WHISPER_SAMPLE_RATE = 16_000;

/**
 * Reads an audio File and returns a 16 kHz mono Float32Array suitable
 * for passing directly to a Whisper pipeline.
 *
 * Uses Web Audio API to decode and OfflineAudioContext to resample +
 * down-mix to mono in a single pass — no manual math needed.
 */
export async function fileToFloat32Array(file: File): Promise<Float32Array> {
  const arrayBuffer = await file.arrayBuffer();

  // Decode at the file's native sample rate
  const ctx = new AudioContext();
  let decoded: AudioBuffer;
  try {
    // slice(0) avoids detaching the buffer on some older browsers
    decoded = await ctx.decodeAudioData(arrayBuffer.slice(0));
  } finally {
    void ctx.close();
  }

  // Resample and down-mix to mono at 16 kHz
  const targetLength = Math.round(decoded.duration * WHISPER_SAMPLE_RATE);
  const offline = new OfflineAudioContext(1, targetLength, WHISPER_SAMPLE_RATE);
  const source = offline.createBufferSource();
  source.buffer = decoded;
  source.connect(offline.destination);
  source.start(0);

  const resampled = await offline.startRendering();
  // .slice() ensures we own the buffer (not a view into a shared block)
  return resampled.getChannelData(0).slice();
}

/** Formats a duration given in seconds as `m:ss`. */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
