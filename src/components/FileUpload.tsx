import { useRef, useState, useCallback } from 'react';
import type { TranscriptionStatus } from '../types';
import './FileUpload.css';

const ACCEPTED_AUDIO_TYPES = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/mp4', 'audio/webm', 'audio/flac'];
const MAX_FILE_MB = 25;

interface FileUploadProps {
  status: TranscriptionStatus;
  onFileSelected: (file: File) => void;
  onTranscribe: () => void;
  audioFile: File | null;
}

export function FileUpload({ status, onFileSelected, onTranscribe, audioFile }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const validateAndSelect = useCallback((file: File) => {
    setFileError(null);
    const isAudio = ACCEPTED_AUDIO_TYPES.includes(file.type) || file.name.match(/\.(mp3|wav|ogg|m4a|mp4|webm|flac)$/i);
    if (!isAudio) {
      setFileError('הקובץ אינו קובץ אודיו תקין. יש לבחור קובץ mp3, wav, m4a, ogg או דומה.');
      return;
    }
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > MAX_FILE_MB) {
      setFileError(`הקובץ גדול מדי (${sizeMB.toFixed(1)} MB). הגבלה: ${MAX_FILE_MB} MB.`);
      return;
    }
    onFileSelected(file);
  }, [onFileSelected]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const isBusy = status === 'loading-model' || status === 'transcribing';

  return (
    <section className="file-upload-section">
      <div
        className={`drop-zone ${dragOver ? 'drop-zone--active' : ''} ${audioFile ? 'drop-zone--has-file' : ''}`}
        onClick={() => !isBusy && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setDragOver(false)}
        role="button"
        tabIndex={0}
        aria-label="אזור העלאת קובץ אודיו"
        onKeyDown={(e) => e.key === 'Enter' && !isBusy && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="audio/*"
          onChange={handleInputChange}
          className="file-input"
          aria-hidden="true"
          tabIndex={-1}
        />

        <div className="drop-zone-icon" aria-hidden="true">
          {audioFile ? '🎵' : '📂'}
        </div>

        {audioFile ? (
          <div className="drop-zone-file-info">
            <span className="drop-zone-filename">{audioFile.name}</span>
            <span className="drop-zone-filesize">
              {(audioFile.size / (1024 * 1024)).toFixed(2)} MB
            </span>
          </div>
        ) : (
          <div className="drop-zone-prompt">
            <span className="drop-zone-primary">גרור קובץ אודיו לכאן</span>
            <span className="drop-zone-secondary">או לחץ לבחירת קובץ</span>
            <span className="drop-zone-hint">mp3, wav, m4a, ogg – עד {MAX_FILE_MB} MB</span>
          </div>
        )}
      </div>

      {fileError && (
        <p className="file-error" role="alert">{fileError}</p>
      )}

      <button
        className="transcribe-btn"
        onClick={onTranscribe}
        disabled={!audioFile || isBusy}
        aria-busy={isBusy}
      >
        {isBusy ? 'מעבד...' : 'תמלל'}
      </button>
    </section>
  );
}
