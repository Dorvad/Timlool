import { useRef, useState, useCallback, useEffect } from 'react';
import type { TranscriptionStatus } from '../types';
import { formatDuration } from '../lib/audioUtils';
import { CloudUploadIcon, AudioFileIcon } from './icons';
import './FileDropzone.css';

const MAX_FILE_MB = 25;

interface FileDropzoneProps {
  status: TranscriptionStatus;
  audioFile: File | null;
  onFileSelected: (file: File) => void;
}

export function FileDropzone({ status, audioFile, onFileSelected }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);

  useEffect(() => {
    if (!audioFile) { setDuration(null); return; }
    let alive = true;
    const url = URL.createObjectURL(audioFile);
    const audio = new Audio();
    audio.onloadedmetadata = () => {
      if (alive) setDuration(audio.duration);
      URL.revokeObjectURL(url);
    };
    audio.onerror = () => URL.revokeObjectURL(url);
    audio.src = url;
    return () => { alive = false; URL.revokeObjectURL(url); };
  }, [audioFile]);

  const isBusy = status === 'loading-model' || status === 'transcribing';

  const validateAndSelect = useCallback((file: File) => {
    setFileError(null);
    const isAudio = file.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|mp4|webm|flac|opus)$/i.test(file.name);
    if (!isAudio) {
      setFileError('הקובץ אינו קובץ אודיו תקין. יש לבחור קובץ mp3, wav, m4a, ogg, opus, webm או דומה.');
      return;
    }
    const sizeMB = file.size / 1048576;
    if (sizeMB > MAX_FILE_MB) {
      setFileError(`הקובץ גדול מדי (${sizeMB.toFixed(1)} MB). הגבלה: ${MAX_FILE_MB} MB.`);
      return;
    }
    onFileSelected(file);
  }, [onFileSelected]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (!isBusy) {
      const file = e.dataTransfer.files?.[0];
      if (file) validateAndSelect(file);
    }
  };

  const zoneState =
    isBusy      ? 'busy'   :
    dragOver    ? 'drag'   :
    audioFile   ? 'filled' :
                  'empty';

  return (
    <div className="dropzone-wrapper">
      <div
        className={`dropzone dropzone--${zoneState}`}
        onClick={() => !isBusy && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); if (!isBusy) setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        role="button"
        tabIndex={isBusy ? -1 : 0}
        aria-label={audioFile
          ? `קובץ נבחר: ${audioFile.name}. לחץ/י להחלפה`
          : 'בחר/י קובץ אודיו לתמלול'}
        aria-disabled={isBusy}
        onKeyDown={(e) => e.key === 'Enter' && !isBusy && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="audio/*,.opus"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) validateAndSelect(f);
            e.target.value = '';
          }}
          className="dropzone-input"
          tabIndex={-1}
          aria-hidden="true"
        />

        <div className="dropzone-content">
          {audioFile ? (
            <>
              <div className="dropzone-icon dropzone-icon--file">
                <AudioFileIcon size={44} />
              </div>
              <div className="dropzone-file-info">
                <span className="dropzone-filename">{audioFile.name}</span>
                <span className="dropzone-meta">
                  {(audioFile.size / 1048576).toFixed(2)} MB
                  {duration !== null && <span> · {formatDuration(duration)}</span>}
                  {!isBusy && <span className="dropzone-replace-hint"> · לחץ/י להחלפה</span>}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="dropzone-icon dropzone-icon--upload">
                <CloudUploadIcon size={52} />
              </div>
              <div className="dropzone-text">
                <span className="dropzone-primary">גרור/י קובץ אודיו לכאן</span>
                <span className="dropzone-secondary">או לחץ/י לבחירת קובץ</span>
                <span className="dropzone-formats">mp3 · wav · m4a · ogg · opus · webm &nbsp;—&nbsp; עד {MAX_FILE_MB} MB</span>
              </div>
            </>
          )}
        </div>
      </div>

      {fileError && (
        <div className="dropzone-error" role="alert">{fileError}</div>
      )}

      <p className="dropzone-whatsapp-tip">
        קבצי וואטסאפ בדרך כלל עובדים, אבל התמיכה תלויה בדפדפן.
        אם יש בעיה, מומלץ להמיר ל-MP3 או WAV.
      </p>
    </div>
  );
}
