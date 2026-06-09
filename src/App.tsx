import { useState, useCallback } from 'react';
import type { AppState } from './types';
import { Header } from './components/Header';
import { FileUpload } from './components/FileUpload';
import { StatusArea } from './components/StatusArea';
import { TranscriptArea } from './components/TranscriptArea';
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
    setState((prev) => ({
      ...prev,
      audioFile: file,
      status: 'idle',
      statusMessage: '',
      transcript: '',
    }));
  }, []);

  // Placeholder transcription handler — will be replaced with Whisper/Transformers.js
  const handleTranscribe = useCallback(async () => {
    if (!state.audioFile) return;

    setState((prev) => ({
      ...prev,
      status: 'loading-model',
      statusMessage: 'טוען מודל תמלול...',
      transcript: '',
    }));

    // Simulated delay to demonstrate the loading state
    await new Promise((resolve) => setTimeout(resolve, 1200));

    setState((prev) => ({
      ...prev,
      status: 'transcribing',
      statusMessage: 'מתמלל את הקובץ...',
    }));

    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Placeholder result until Whisper is integrated
    setState((prev) => ({
      ...prev,
      status: 'done',
      statusMessage: 'התמלול הושלם בהצלחה',
      transcript: '[כאן יופיע התמליל לאחר שילוב מנוע Whisper]',
    }));
  }, [state.audioFile]);

  return (
    <div className="app">
      <Header />
      <main className="app-main">
        <FileUpload
          status={state.status}
          audioFile={state.audioFile}
          onFileSelected={handleFileSelected}
          onTranscribe={handleTranscribe}
        />
        <StatusArea status={state.status} message={state.statusMessage} />
        <TranscriptArea transcript={state.transcript} />
      </main>
      <Footer />
    </div>
  );
}

export default App;
