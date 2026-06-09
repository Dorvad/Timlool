import { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { FileDropzone } from './components/FileDropzone';
import { ActionButtons } from './components/ActionButtons';
import { StatusMessage } from './components/StatusMessage';
import { TranscriptBox } from './components/TranscriptBox';
import { Footer } from './components/Footer';
import { useTranscriptionWorker } from './hooks/useTranscriptionWorker';
import './App.css';

const STORAGE_KEY = 'timlool-transcript';

function App() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const { workerState, transcribeFile, reset } = useTranscriptionWorker();
  const [editedTranscript, setEditedTranscript] = useState<string>(
    () => localStorage.getItem(STORAGE_KEY) ?? '',
  );

  // Populate editable transcript when a new transcription completes
  useEffect(() => {
    if (workerState.transcript) setEditedTranscript(workerState.transcript);
  }, [workerState.transcript]);

  // Auto-save edits to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, editedTranscript);
  }, [editedTranscript]);

  const handleFileSelected = useCallback((file: File) => {
    setAudioFile(file);
    reset();
  }, [reset]);

  const handleTranscribe = useCallback(() => {
    if (!audioFile) return;
    setEditedTranscript('');
    transcribeFile(audioFile);
  }, [audioFile, transcribeFile]);

  const handleClear = useCallback(() => {
    setAudioFile(null);
    setEditedTranscript('');
    reset();
  }, [reset]);

  const handleCopy = useCallback(() => {
    if (editedTranscript) void navigator.clipboard.writeText(editedTranscript);
  }, [editedTranscript]);

  const handleDownload = useCallback(() => {
    if (!editedTranscript) return;
    const baseName = audioFile?.name.replace(/\.[^.]+$/, '') ?? 'תמלול';
    const blob = new Blob([editedTranscript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${baseName}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [editedTranscript, audioFile]);

  const handleCleanup = useCallback(() => {
    setEditedTranscript(prev =>
      prev
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim(),
    );
  }, []);

  return (
    <div className="app">
      <Header />
      <main className="app-main">
        <FileDropzone
          status={workerState.status}
          audioFile={audioFile}
          onFileSelected={handleFileSelected}
        />
        <ActionButtons
          status={workerState.status}
          hasFile={!!audioFile}
          hasTranscript={!!editedTranscript}
          onTranscribe={handleTranscribe}
          onClear={handleClear}
          onCopy={handleCopy}
          onDownload={handleDownload}
          onCleanup={handleCleanup}
        />
        <StatusMessage status={workerState.status} message={workerState.statusMessage} />
        <TranscriptBox
          transcript={editedTranscript}
          status={workerState.status}
          onTranscriptChange={setEditedTranscript}
        />
      </main>
      <Footer />
    </div>
  );
}

export default App;
