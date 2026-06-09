import type { TranscriptionStatus } from '../types';
import './TranscriptBox.css';

interface TranscriptBoxProps {
  transcript: string;
  status: TranscriptionStatus;
  onTranscriptChange: (text: string) => void;
}

export function TranscriptBox({ transcript, status, onTranscriptChange }: TranscriptBoxProps) {
  const isBusy = status === 'loading-model' || status === 'transcribing';
  const wordCount = transcript.trim() ? transcript.trim().split(/\s+/).length : 0;
  const charCount = transcript.length;

  return (
    <section className="transcript-box" aria-labelledby="transcript-label">
      <h2 className="transcript-label" id="transcript-label">תמליל</h2>

      <div
        className="transcript-body"
        aria-live="polite"
        aria-atomic="false"
      >
        {isBusy && !transcript ? (
          <div className="transcript-skeleton" aria-hidden="true">
            <div className="skeleton-line" style={{ width: '90%' }} />
            <div className="skeleton-line" style={{ width: '78%' }} />
            <div className="skeleton-line" style={{ width: '65%' }} />
            <div className="skeleton-line" style={{ width: '82%' }} />
            <div className="skeleton-line" style={{ width: '55%' }} />
          </div>
        ) : (
          <textarea
            className="transcript-textarea"
            value={transcript}
            onChange={e => onTranscriptChange(e.target.value)}
            placeholder="התמליל יופיע כאן לאחר העיבוד"
            readOnly={isBusy}
            aria-label="תוכן התמלול (ניתן לעריכה)"
          />
        )}
      </div>

      {transcript && (
        <div className="transcript-footer">
          <span className="transcript-counts">{wordCount} מילים · {charCount} תווים</span>
        </div>
      )}

      {(transcript || isBusy) && (
        <p className="transcript-disclaimer" role="note">
          ייתכנו טעויות בתמלול, במיוחד באודיו עם רעש, דיבור מהיר או שמות פרטיים.
        </p>
      )}
    </section>
  );
}
