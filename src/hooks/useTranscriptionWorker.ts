import { useEffect, useRef, useState, useCallback } from 'react';
import type { WorkerRequest, WorkerResponse } from '../types/transcription';
import { DEFAULT_MODEL, DEFAULT_LANGUAGE } from '../types/transcription';
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

export function useTranscriptionWorker() {
  const [workerState, setWorkerState] = useState<WorkerState>(INITIAL_STATE);
  const workerRef  = useRef<Worker | null>(null);
  const modelReady = useRef(false);
  const pendingBuf = useRef<ArrayBuffer | null>(null);
  const activeRef  = useRef(false);

  useEffect(() => {
    const worker = new Worker(
      new URL('../workers/transcriptionWorker.ts', import.meta.url),
      { type: 'module' },
    );
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const msg = event.data;

      // Track model readiness unconditionally so a post-reset transcription
      // can skip the load round-trip when the worker already has the pipeline.
      if (msg.type === 'model-ready') modelReady.current = true;

      if (!activeRef.current) return;

      switch (msg.type) {
        case 'model-loading': {
          const p = Math.round(msg.progress ?? 0);
          const label = msg.file ? ` (${msg.file.split('/').pop() ?? ''})` : '';
          setWorkerState(prev => ({
            ...prev,
            status: 'loading-model',
            statusMessage: p > 0
              ? `טוען מודל${label}... ${p}%`
              : 'מתחיל לטעון את מודל Whisper...',
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

    activeRef.current = true;
    pendingBuf.current = null;
    setWorkerState({ status: 'loading-model', statusMessage: 'קורא את הקובץ...', transcript: '' });

    const reader = new FileReader();
    reader.onload = () => {
      if (!activeRef.current) return;
      const buf = reader.result as ArrayBuffer;

      if (modelReady.current) {
        // Pipeline already loaded — send directly
        const req: WorkerRequest = {
          type: 'transcribe',
          audioBuffer: buf,
          language: DEFAULT_LANGUAGE,
        };
        worker.postMessage(req, [buf]);
      } else {
        // Store buffer; send when model-ready fires
        pendingBuf.current = buf;
        worker.postMessage({ type: 'load', model: DEFAULT_MODEL } satisfies WorkerRequest);
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
