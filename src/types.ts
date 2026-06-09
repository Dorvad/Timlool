export type TranscriptionStatus =
  | 'idle'
  | 'loading-model'
  | 'transcribing'
  | 'done'
  | 'error';

export interface AppState {
  status: TranscriptionStatus;
  statusMessage: string;
  transcript: string;
  audioFile: File | null;
}
