import type { TranscriptionStatus } from '../types';
import { CheckIcon, AlertIcon } from './icons';
import './StatusMessage.css';

interface StatusMessageProps {
  status: TranscriptionStatus;
  message: string;
}

export function StatusMessage({ status, message }: StatusMessageProps) {
  if (status === 'idle' || !message) return null;

  const isBusy = status === 'loading-model' || status === 'transcribing';
  const variant = isBusy ? 'busy' : status;

  return (
    <div
      className={`status-msg status-msg--${variant}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {isBusy && (
        <div className="status-progress" aria-hidden="true">
          <div className="status-progress-bar" />
        </div>
      )}
      <div className="status-msg-inner">
        <span className="status-msg-icon">
          {status === 'done'  && <CheckIcon size={15} />}
          {status === 'error' && <AlertIcon size={15} />}
          {isBusy             && <span className="status-spinner" aria-hidden="true" />}
        </span>
        <span className="status-msg-text">{message}</span>
      </div>
    </div>
  );
}
