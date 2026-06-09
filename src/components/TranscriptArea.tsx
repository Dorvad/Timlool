import './TranscriptArea.css';

interface TranscriptAreaProps {
  transcript: string;
}

export function TranscriptArea({ transcript }: TranscriptAreaProps) {
  const handleCopy = () => {
    if (transcript) {
      navigator.clipboard.writeText(transcript);
    }
  };

  return (
    <section className="transcript-section">
      <div className="transcript-header">
        <h2 className="transcript-title">תמליל</h2>
        {transcript && (
          <button className="copy-btn" onClick={handleCopy} aria-label="העתק תמליל">
            העתק
          </button>
        )}
      </div>
      <div
        className={`transcript-body ${transcript ? 'transcript-body--filled' : 'transcript-body--empty'}`}
        dir="rtl"
        aria-label="אזור תמליל"
        aria-live="polite"
      >
        {transcript ? (
          <p className="transcript-text">{transcript}</p>
        ) : (
          <p className="transcript-placeholder">
            התמליל יופיע כאן לאחר העיבוד...
          </p>
        )}
      </div>
    </section>
  );
}
