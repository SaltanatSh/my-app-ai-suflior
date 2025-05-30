import { useState, useCallback, useEffect } from 'react';

export interface HumeAnalysisState {
  isAnalyzing: boolean;
  error: string | null;
  results: any | null;
  jobId: string | null;
}

export function useHumeAnalysis() {
  const [state, setState] = useState<HumeAnalysisState>({
    isAnalyzing: false,
    error: null,
    results: null,
    jobId: null
  });

  // Функция для опроса статуса задачи
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    let attempts = 0;
    const maxAttempts = 60; // 5 минут максимум (5 секунд * 60)

    if (state.jobId && !state.results && !state.error) {
      intervalId = setInterval(async () => {
        try {
          if (attempts >= maxAttempts) {
            clearInterval(intervalId);
            setState(prev => ({
              ...prev,
              isAnalyzing: false,
              error: 'Превышено время ожидания анализа'
            }));
            return;
          }

          const response = await fetch(`/api/hume-status/${state.jobId}`);
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Ошибка при проверке статуса анализа');
          }

          if (data.state === 'COMPLETED') {
            clearInterval(intervalId);
            setState(prev => ({
              ...prev,
              isAnalyzing: false,
              results: data.predictions
            }));
          } else if (data.state === 'FAILED') {
            clearInterval(intervalId);
            setState(prev => ({
              ...prev,
              isAnalyzing: false,
              error: `Ошибка обработки задачи: ${data.error || 'Неизвестная ошибка'}`
            }));
          }

          attempts++;
        } catch (error) {
          console.error('Ошибка при проверке статуса:', error);
          // Не останавливаем опрос при одиночной ошибке
        }
      }, 5000); // Проверяем каждые 5 секунд
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [state.jobId, state.results, state.error]);

  const startAnalysis = useCallback(async (audioBlob: Blob, language: string) => {
    setState(prev => ({
      ...prev,
      isAnalyzing: true,
      error: null,
      results: null,
      jobId: null
    }));

    try {
      // Создаем FormData с аудио
      const formData = new FormData();
      formData.append('audio', audioBlob);
      formData.append('language', language);

      // Отправляем аудио на анализ
      const response = await fetch('/api/analyze-hume', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка при отправке аудио на анализ');
      }

      const { jobId } = await response.json();

      if (!jobId) {
        throw new Error('Не получен ID задачи от сервера');
      }

      setState(prev => ({
        ...prev,
        jobId
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка'
      }));
    }
  }, []);

  return {
    ...state,
    startAnalysis
  };
} 