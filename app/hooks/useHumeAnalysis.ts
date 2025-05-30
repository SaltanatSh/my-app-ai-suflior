import { useState, useCallback } from 'react';

export interface HumeAnalysisState {
  isAnalyzing: boolean;
  error: string | null;
  results: any | null;
}

export function useHumeAnalysis() {
  const [state, setState] = useState<HumeAnalysisState>({
    isAnalyzing: false,
    error: null,
    results: null
  });

  const startAnalysis = useCallback(async (audioBlob: Blob, language: string) => {
    setState(prev => ({ ...prev, isAnalyzing: true, error: null, results: null }));

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

      // Начинаем опрос статуса задачи
      let attempts = 0;
      const maxAttempts = 30; // 5 минут максимум (10 секунд * 30)
      
      const pollStatus = async () => {
        if (attempts >= maxAttempts) {
          throw new Error('Превышено время ожидания анализа');
        }

        const statusResponse = await fetch(`/api/analyze-hume/status?jobId=${jobId}`);
        
        if (!statusResponse.ok) {
          const error = await statusResponse.json();
          throw new Error(error.error || 'Ошибка при проверке статуса анализа');
        }

        const result = await statusResponse.json();

        if (result.error) {
          throw new Error(result.error);
        }

        // Проверяем, завершен ли анализ
        if (result.status === 'completed') {
          setState(prev => ({
            ...prev,
            isAnalyzing: false,
            results: result.predictions
          }));
          return;
        }

        // Если анализ все еще идет, ждем 10 секунд и пробуем снова
        attempts++;
        setTimeout(pollStatus, 10000);
      };

      await pollStatus();

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