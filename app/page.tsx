'use client';

import { useState, useEffect, useRef } from 'react';
import { useAudioRecorder } from './hooks/useAudioRecorder';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { useHumeAnalysis } from './hooks/useHumeAnalysis';
import { LanguageSelector } from './components/LanguageSelector';
import { AnalysisResults } from './components/AnalysisResults';
import { analyzeSpeech, type SpeechAnalysis } from './utils/speechAnalysis';

export default function Home() {
  const [analysisResults, setAnalysisResults] = useState<SpeechAnalysis | null>(null);
  const [status, setStatus] = useState('Готов к записи');
  const [humeJobId, setHumeJobId] = useState<string | null>(null);
  const [isProcessingHume, setIsProcessingHume] = useState(false);
  const [humeResults, setHumeResults] = useState<any>(null);
  
  const startTimeRef = useRef<number>(0);
  const wasListeningRef = useRef(false);
  
  const { 
    isRecording,
    error: recordingError,
    audioBlob,
    startRecording: startAudioRecording,
    stopRecording: stopAudioRecording
  } = useAudioRecorder();
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

  const {
    isAnalyzing: isHumeAnalyzing,
    error: humeError,
    results: humeAnalysisResults,
    startAnalysis: startHumeAnalysis
  } = useHumeAnalysis();

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
      setStatus('Запись завершена, анализ...');
    } else {
      setStatus('Готов к записи');
    }
  }, [isRecording, isListening, recordingError, recognitionError, audioBlob]);

  // Анализ речи после остановки записи
  useEffect(() => {
    if (wasListeningRef.current && !isListening && finalTranscript) {
      const endTime = Date.now();
      const durationInSeconds = (endTime - startTimeRef.current) / 1000;
      
      const results = analyzeSpeech(
        finalTranscript,
        durationInSeconds,
        selectedLanguage
      );
      
      setAnalysisResults(results);

      // УБРАН АВТОМАТИЧЕСКИЙ ВЫЗОВ:
      // if (audioBlob) {
      //   handleStartHumeAnalysis();
      // }
    }
    wasListeningRef.current = isListening;
  }, [isListening, finalTranscript, selectedLanguage, audioBlob]);

  const handleStartHumeAnalysis = async () => {
    if (!audioBlob) {
      setStatus('Аудиофайл не готов для анализа Hume.');
      return;
    }

    setIsProcessingHume(true);
    setHumeJobId(null);
    setHumeResults(null);
    setStatus('Отправка аудио для анализа Hume AI...');

    try {
      await startHumeAnalysis(audioBlob, selectedLanguage);
    } catch (error) {
      console.error('Ошибка при отправке запроса на анализ Hume:', error);
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      setStatus(`Ошибка анализа Hume: ${errorMessage}`);
    } finally {
      setIsProcessingHume(false);
    }
  };

  const handleStartRecording = async () => {
    resetTranscript();
    setAnalysisResults(null);
    setHumeJobId(null);
    setHumeResults(null);
    startTimeRef.current = Date.now();
    await startAudioRecording();
    startListening();
  };

  const handleStopRecording = () => {
    stopAudioRecording();
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

        {/* Hume AI Analysis Button */}
        {audioBlob && !isRecording && (
          <div className="flex justify-center">
            <button
              onClick={handleStartHumeAnalysis}
              disabled={isProcessingHume || isHumeAnalyzing}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors disabled:bg-gray-400"
            >
              {isProcessingHume || isHumeAnalyzing ? 'Анализ эмоций...' : 'Анализировать эмоции (Hume AI)'}
            </button>
          </div>
        )}

        {/* Status Display */}
        <div className={`text-center text-lg font-medium ${
          recordingError || recognitionError || humeError ? 'text-red-500' : ''
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
          <div className="rounded-lg bg-gray-50">
            {analysisResults ? (
              <AnalysisResults
                {...analysisResults}
                language={selectedLanguage}
                humeResults={humeAnalysisResults}
                isAnalyzing={isHumeAnalyzing}
                humeError={humeError}
              />
            ) : (
              <div className="p-4 text-gray-500">
                {selectedLanguage === 'ru-RU' 
                  ? 'Анализ будет доступен после записи выступления'
                  : 'Analysis will be available after recording'
                }
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
