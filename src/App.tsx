import { useState, useCallback } from 'react';
import type { AppState } from './types';
import { Header } from './components/Header';
import { FileDropzone } from './components/FileDropzone';
import { ActionButtons } from './components/ActionButtons';
import { StatusMessage } from './components/StatusMessage';
import { TranscriptBox } from './components/TranscriptBox';
import { Footer } from './components/Footer';
import './App.css';

const initialState: AppState = {
  status: 'idle',
  statusMessage: '',
  transcript: '',
  audioFile: null,
};

function App() {
  const [state, setState] = useState<AppState>(initialState);

  const handleFileSelected = useCallback((file: File) => {
    setState({ ...initialState, audioFile: file });
  }, []);

  // Placeholder — will be replaced with Whisper/Transformers.js
  const handleTranscribe = useCallback(async () => {
    if (!state.audioFile) return;
    try {
      setState(prev => ({ ...prev, status: 'loading-model', statusMessage: 'טוען מודל תמלול...', transcript: '' }));
      await new Promise(r => setTimeout(r, 1400));
      setState(prev => ({ ...prev, status: 'transcribing', statusMessage: 'מתמלל את הקובץ...' }));
      await new Promise(r => setTimeout(r, 1800));
      setState(prev => ({
        ...prev,
        status: 'done',
        statusMessage: 'התמלול הושלם בהצלחה',
        transcript: '[כאן יופיע התמליל לאחר שילוב מנוע Whisper]',
      }));
    } catch {
      setState(prev => ({
        ...prev,
        status: 'error',
        statusMessage: 'אירעה שגיאה בתהליך התמלול. אפשר לנסות שוב.',
      }));
    }
  }, [state.audioFile]);

  const handleClear = useCallback(() => {
    setState(initialState);
  }, []);

  const handleCopy = useCallback(() => {
    if (state.transcript) navigator.clipboard.writeText(state.transcript);
  }, [state.transcript]);

  const handleDownload = useCallback(() => {
    if (!state.transcript) return;
    const baseName = state.audioFile?.name.replace(/\.[^.]+$/, '') ?? 'תמלול';
    const blob = new Blob([state.transcript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${baseName}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [state.transcript, state.audioFile]);

  return (
    <div className="app">
      <Header />
      <main className="app-main">
        <FileDropzone
          status={state.status}
          audioFile={state.audioFile}
          onFileSelected={handleFileSelected}
        />
        <ActionButtons
          status={state.status}
          hasFile={!!state.audioFile}
          hasTranscript={!!state.transcript}
          onTranscribe={handleTranscribe}
          onClear={handleClear}
          onCopy={handleCopy}
          onDownload={handleDownload}
        />
        <StatusMessage status={state.status} message={state.statusMessage} />
        <TranscriptBox transcript={state.transcript} status={state.status} />
      </main>
      <Footer />
    </div>
  );
}

export default App;
