import type { TranscriptionStatus } from '../types';
import './TranscriptBox.css';

interface TranscriptBoxProps {
  transcript: string;
  status: TranscriptionStatus;
}

export function TranscriptBox({ transcript, status }: TranscriptBoxProps) {
  const isBusy = status === 'loading-model' || status === 'transcribing';

  return (
    <section className="transcript-box" aria-labelledby="transcript-label">
      <h2 className="transcript-label" id="transcript-label">תמליל</h2>

      <div
        className={[
          'transcript-body',
          transcript           ? 'transcript-body--filled'  : '',
          isBusy && !transcript ? 'transcript-body--loading' : '',
          !transcript && !isBusy ? 'transcript-body--empty'  : '',
        ].filter(Boolean).join(' ')}
        aria-live="polite"
        aria-atomic="false"
        dir="rtl"
      >
        {isBusy && !transcript ? (
          <div className="transcript-skeleton" aria-hidden="true">
            <div className="skeleton-line" style={{ width: '90%' }} />
            <div className="skeleton-line" style={{ width: '78%' }} />
            <div className="skeleton-line" style={{ width: '65%' }} />
            <div className="skeleton-line" style={{ width: '82%' }} />
            <div className="skeleton-line" style={{ width: '55%' }} />
          </div>
        ) : transcript ? (
          <p className="transcript-text">{transcript}</p>
        ) : (
          <p className="transcript-empty">התמליל יופיע כאן לאחר העיבוד</p>
        )}
      </div>
    </section>
  );
}
