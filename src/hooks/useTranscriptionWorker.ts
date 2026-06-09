import { useEffect, useRef, useState, useCallback } from 'react';
import type { WorkerRequest, WorkerResponse } from '../types/transcription';
import { DEFAULT_LANGUAGE } from '../types/transcription';
import type { TranscriptionStatus } from '../types';

interface WorkerState {
  status: TranscriptionStatus;
  statusMessage: string;
  transcript: string;
}

const INITIAL_STATE: WorkerState = {
  status: 'idle',
  statusMessage: '',
  transcript: '',
};

export function useTranscriptionWorker(model: string) {
  const [workerState, setWorkerState] = useState<WorkerState>(INITIAL_STATE);
  const workerRef      = useRef<Worker | null>(null);
  const loadedModelRef = useRef<string | null>(null); // which model the worker currently has loaded
  const modelRef       = useRef(model);
  const pendingBuf     = useRef<ArrayBuffer | null>(null);
  const activeRef      = useRef(false);

  // Keep modelRef current without re-creating the worker
  modelRef.current = model;

  useEffect(() => {
    const worker = new Worker(
      new URL('../workers/transcriptionWorker.ts', import.meta.url),
      { type: 'module' },
    );
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const msg = event.data;

      // Always record which model the worker has ready, even between sessions,
      // so a post-reset transcription can skip the load round-trip when the
      // worker still holds the right pipeline.
      if (msg.type === 'model-ready') loadedModelRef.current = msg.model;

      if (!activeRef.current) return;

      switch (msg.type) {
        case 'model-loading': {
          const p = Math.round(msg.progress ?? 0);
          const fileHint = msg.file ? ` (${msg.file.split('/').pop() ?? ''})` : '';
          setWorkerState(prev => ({
            ...prev,
            status: 'loading-model',
            statusMessage: p > 0
              ? `טוען מודל${fileHint}... ${p}%`
              : 'מוריד מודל Whisper בפעם הראשונה...',
          }));
          break;
        }
        case 'model-ready': {
          const buf = pendingBuf.current;
          pendingBuf.current = null;
          if (buf !== null) {
            const req: WorkerRequest = {
              type: 'transcribe',
              audioBuffer: buf,
              language: DEFAULT_LANGUAGE,
            };
            worker.postMessage(req, [buf]);
          }
          break;
        }
        case 'decoding':
          setWorkerState(prev => ({
            ...prev,
            status: 'transcribing',
            statusMessage: 'מפענח את קובץ האודיו...',
          }));
          break;
        case 'transcribing':
          setWorkerState(prev => ({
            ...prev,
            status: 'transcribing',
            statusMessage: 'מתמלל... זה עשוי לקחת כמה דקות',
          }));
          break;
        case 'done':
          setWorkerState({
            status: 'done',
            statusMessage: 'התמלול הושלם בהצלחה',
            transcript: msg.text,
          });
          break;
        case 'error':
          setWorkerState({
            status: 'error',
            statusMessage: msg.message,
            transcript: '',
          });
          break;
      }
    };

    worker.onerror = (e) => {
      if (!activeRef.current) return;
      setWorkerState({
        status: 'error',
        statusMessage: `שגיאת עובד: ${e.message}`,
        transcript: '',
      });
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const transcribeFile = useCallback((file: File) => {
    const worker = workerRef.current;
    if (!worker) return;

    const currentModel = modelRef.current;
    activeRef.current = true;
    pendingBuf.current = null;
    setWorkerState({ status: 'loading-model', statusMessage: 'קורא את הקובץ...', transcript: '' });

    const reader = new FileReader();
    reader.onload = () => {
      if (!activeRef.current) return;
      const buf = reader.result as ArrayBuffer;

      if (loadedModelRef.current === currentModel) {
        // Worker already has the right model loaded — send transcribe directly
        const req: WorkerRequest = {
          type: 'transcribe',
          audioBuffer: buf,
          language: DEFAULT_LANGUAGE,
        };
        worker.postMessage(req, [buf]);
      } else {
        // Model not loaded yet (or a different model): store buffer and trigger load
        pendingBuf.current = buf;
        worker.postMessage({ type: 'load', model: currentModel } satisfies WorkerRequest);
      }
    };
    reader.onerror = () => {
      if (!activeRef.current) return;
      setWorkerState({ status: 'error', statusMessage: 'שגיאה בקריאת הקובץ', transcript: '' });
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const reset = useCallback(() => {
    activeRef.current = false;
    pendingBuf.current = null;
    setWorkerState(INITIAL_STATE);
  }, []);

  return { workerState, transcribeFile, reset };
}
