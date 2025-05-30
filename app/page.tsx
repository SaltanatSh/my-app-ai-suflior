'use client';

import { useState, useEffect } from 'react';
import { useAudioRecorder } from './hooks/useAudioRecorder';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { LanguageSelector } from './components/LanguageSelector';

export default function Home() {
  const [analysisResults, setAnalysisResults] = useState('');
  const [status, setStatus] = useState('Готов к записи');
  
  const { isRecording, error: recordingError, audioBlob } = useAudioRecorder();
  const {
    isListening,
    error: recognitionError,
    finalTranscript,
    interimTranscript,
    selectedLanguage,
    startListening,
    stopListening,
    resetTranscript,
    setLanguage
  } = useSpeechRecognition();

  // Update status based on recording state and errors
  useEffect(() => {
    if (recordingError) {
      setStatus(`Ошибка записи: ${recordingError}`);
    } else if (recognitionError) {
      setStatus(`Ошибка распознавания: ${recognitionError}`);
    } else if (isRecording && isListening) {
      setStatus('Запись и распознавание...');
    } else if (isRecording) {
      setStatus('Запись...');
    } else if (audioBlob) {
      setStatus('Запись завершена, готов к анализу');
    } else {
      setStatus('Готов к записи');
    }
  }, [isRecording, isListening, recordingError, recognitionError, audioBlob]);

  const handleStartRecording = async () => {
    resetTranscript();
    setAnalysisResults('');
    startListening();
  };

  const handleStopRecording = () => {
    stopListening();
  };

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center">
        ИИ-Суфлер для выступлений
      </h1>

      <div className="space-y-6">
        {/* Language and Recording Controls */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <LanguageSelector
            selectedLanguage={selectedLanguage}
            onLanguageChange={setLanguage}
            disabled={isListening || isRecording}
          />
          <div className="flex justify-center gap-4">
            <button
              onClick={handleStartRecording}
              disabled={isRecording || isListening}
              className={`px-4 py-2 rounded-lg ${
                isRecording || isListening
                  ? 'bg-gray-400'
                  : 'bg-blue-500 hover:bg-blue-600'
              } text-white font-medium transition-colors`}
            >
              Начать запись
            </button>
            <button
              onClick={handleStopRecording}
              disabled={!isRecording && !isListening}
              className={`px-4 py-2 rounded-lg ${
                !isRecording && !isListening
                  ? 'bg-gray-400'
                  : 'bg-red-500 hover:bg-red-600'
              } text-white font-medium transition-colors`}
            >
              Стоп запись
            </button>
          </div>
        </div>

        {/* Status Display */}
        <div className={`text-center text-lg font-medium ${
          recordingError || recognitionError ? 'text-red-500' : ''
        }`}>
          Статус: {status}
        </div>

        {/* Transcript Area */}
        <div className="space-y-2">
          <label htmlFor="transcript" className="block font-medium">
            Транскрипция:
          </label>
          <div
            className="w-full min-h-[8rem] p-3 border rounded-lg bg-gray-50 whitespace-pre-wrap"
          >
            {finalTranscript}
            <span className="text-gray-400">{interimTranscript}</span>
          </div>
        </div>

        {/* Analysis Results */}
        <div className="space-y-2">
          <h2 className="font-medium">Результаты анализа:</h2>
          <div className="p-4 border rounded-lg bg-gray-50 min-h-[200px]">
            {analysisResults || 'Анализ будет доступен после записи выступления'}
          </div>
        </div>
      </div>
    </main>
  );
}
