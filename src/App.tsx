import { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { FileDropzone } from './components/FileDropzone';
import { ActionButtons } from './components/ActionButtons';
import { StatusMessage } from './components/StatusMessage';
import { TranscriptBox } from './components/TranscriptBox';
import { Footer } from './components/Footer';
import { useTranscriptionWorker } from './hooks/useTranscriptionWorker';
import './App.css';

function App() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const { workerState, transcribeFile, reset } = useTranscriptionWorker();

  const handleFileSelected = useCallback((file: File) => {
    setAudioFile(file);
    reset();
  }, [reset]);

  const handleTranscribe = useCallback(() => {
    if (!audioFile) return;
    transcribeFile(audioFile);
  }, [audioFile, transcribeFile]);

  const handleClear = useCallback(() => {
    setAudioFile(null);
    reset();
  }, [reset]);

  const handleCopy = useCallback(() => {
    if (workerState.transcript) navigator.clipboard.writeText(workerState.transcript);
  }, [workerState.transcript]);

  const handleDownload = useCallback(() => {
    if (!workerState.transcript) return;
    const baseName = audioFile?.name.replace(/\.[^.]+$/, '') ?? 'תמלול';
    const blob = new Blob([workerState.transcript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${baseName}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [workerState.transcript, audioFile]);

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
          hasTranscript={!!workerState.transcript}
          onTranscribe={handleTranscribe}
          onClear={handleClear}
          onCopy={handleCopy}
          onDownload={handleDownload}
        />
        <StatusMessage status={workerState.status} message={workerState.statusMessage} />
        <TranscriptBox transcript={workerState.transcript} status={workerState.status} />
      </main>
      <Footer />
    </div>
  );
}

export default App;
