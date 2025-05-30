'use client';

import { useState } from 'react';

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [analysisResults, setAnalysisResults] = useState('');
  const [status, setStatus] = useState('Готов к записи');

  const startRecording = () => {
    setIsRecording(true);
    setStatus('Запись...');
    // TODO: Implement actual recording logic
  };

  const stopRecording = () => {
    setIsRecording(false);
    setStatus('Анализ записи...');
    // TODO: Implement stop recording and analysis logic
  };

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center">
        ИИ-Суфлер для выступлений
      </h1>

      <div className="space-y-6">
        {/* Recording Controls */}
        <div className="flex justify-center gap-4">
          <button
            onClick={startRecording}
            disabled={isRecording}
            className={`px-4 py-2 rounded-lg ${
              isRecording
                ? 'bg-gray-400'
                : 'bg-blue-500 hover:bg-blue-600'
            } text-white font-medium`}
          >
            Начать запись
          </button>
          <button
            onClick={stopRecording}
            disabled={!isRecording}
            className={`px-4 py-2 rounded-lg ${
              !isRecording
                ? 'bg-gray-400'
                : 'bg-red-500 hover:bg-red-600'
            } text-white font-medium`}
          >
            Стоп запись
          </button>
        </div>

        {/* Status Display */}
        <div className="text-center text-lg font-medium">
          Статус: {status}
        </div>

        {/* Transcript Area */}
        <div className="space-y-2">
          <label htmlFor="transcript" className="block font-medium">
            Транскрипция:
          </label>
          <textarea
            id="transcript"
            value={transcript}
            readOnly
            className="w-full h-32 p-3 border rounded-lg bg-gray-50"
            placeholder="Здесь появится текст вашего выступления..."
          />
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
