import type { TranscriptionStatus } from '../types';
import './StatusArea.css';

interface StatusAreaProps {
  status: TranscriptionStatus;
  message: string;
}

const STATUS_ICONS: Record<TranscriptionStatus, string> = {
  idle: '⏳',
  'loading-model': '⬇️',
  transcribing: '🎙️',
  done: '✅',
  error: '❌',
};

const STATUS_CLASS: Record<TranscriptionStatus, string> = {
  idle: 'status--idle',
  'loading-model': 'status--busy',
  transcribing: 'status--busy',
  done: 'status--done',
  error: 'status--error',
};

export function StatusArea({ status, message }: StatusAreaProps) {
  if (status === 'idle' && !message) return null;

  return (
    <div className={`status-area ${STATUS_CLASS[status]}`} role="status" aria-live="polite">
      <span className="status-icon" aria-hidden="true">{STATUS_ICONS[status]}</span>
      <span className="status-message">{message}</span>
      {(status === 'loading-model' || status === 'transcribing') && (
        <span className="status-spinner" aria-hidden="true" />
      )}
    </div>
  );
}
