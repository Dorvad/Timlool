import { useState } from 'react';
import type { TranscriptionStatus } from '../types';
import { WaveformIcon, TrashIcon, CopyIcon, DownloadIcon, CheckIcon } from './icons';
import './ActionButtons.css';

interface ActionButtonsProps {
  status: TranscriptionStatus;
  hasFile: boolean;
  hasTranscript: boolean;
  onTranscribe: () => void;
  onClear: () => void;
  onCopy: () => void;
  onDownload: () => void;
}

export function ActionButtons({
  status, hasFile, hasTranscript,
  onTranscribe, onClear, onCopy, onDownload,
}: ActionButtonsProps) {
  const [copied, setCopied] = useState(false);
  const isBusy = status === 'loading-model' || status === 'transcribing';
  const showSecondary = hasFile || hasTranscript;

  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="action-buttons">
      {/* Primary */}
      <button
        className="btn-primary"
        onClick={onTranscribe}
        disabled={!hasFile || isBusy}
        aria-busy={isBusy}
      >
        {isBusy ? (
          <>
            <span className="btn-spinner" aria-hidden="true" />
            <span>{status === 'loading-model' ? 'טוען מודל...' : 'מתמלל...'}</span>
          </>
        ) : (
          <>
            <WaveformIcon size={18} />
            <span>תמלל</span>
          </>
        )}
      </button>

      {/* Secondary — shown once a file is present */}
      {showSecondary && (
        <div className="action-secondary">
          <button
            className="btn-ghost btn-ghost--danger"
            onClick={onClear}
            disabled={isBusy}
            aria-label="נקה הכל"
          >
            <TrashIcon size={15} />
            <span>נקה</span>
          </button>

          {hasTranscript && (
            <>
              <button
                className={`btn-ghost ${copied ? 'btn-ghost--copied' : ''}`}
                onClick={handleCopy}
                aria-label="העתק תמלול"
              >
                {copied ? <CheckIcon size={15} /> : <CopyIcon size={15} />}
                <span>{copied ? 'הועתק!' : 'העתק תמלול'}</span>
              </button>

              <button
                className="btn-ghost"
                onClick={onDownload}
                aria-label="הורד כקובץ TXT"
              >
                <DownloadIcon size={15} />
                <span>הורד כקובץ TXT</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
