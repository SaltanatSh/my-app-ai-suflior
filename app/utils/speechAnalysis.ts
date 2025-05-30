export interface FillerWordsAnalysis {
  count: number;
  words: string[];
  details: { [key: string]: number };
}

export interface SpeechAnalysis {
  speechRate: number;
  fillerWords: FillerWordsAnalysis;
  wordCount: number;
  duration: number;
  recommendations: string[];
  metrics: {
    fillerWordsRatio: number;
    speechRateDeviation: number;
  };
}

export interface AnalysisThresholds {
  minDuration: number;          // Минимальная длительность для полного анализа (в секундах)
  maxFillerWordsRatio: number;  // Максимально допустимая доля слов-паразитов (0-1)
  optimalSpeechRate: {          // Оптимальный темп речи
    min: number;                // Минимум слов в минуту
    max: number;                // Максимум слов в минуту
    criticalDeviation: number;  // Критическое отклонение от среднего значения (в процентах)
  };
}

const DEFAULT_THRESHOLDS: { [key: string]: AnalysisThresholds } = {
  'ru-RU': {
    minDuration: 30,           // 30 секунд минимум
    maxFillerWordsRatio: 0.08, // Не более 8% слов-паразитов
    optimalSpeechRate: {
      min: 100,
      max: 140,
      criticalDeviation: 20    // 20% отклонение считается критическим
    }
  },
  'en-US': {
    minDuration: 30,           // 30 секунд минимум
    maxFillerWordsRatio: 0.06, // Не более 6% слов-паразитов (в английском обычно меньше)
    optimalSpeechRate: {
      min: 120,
      max: 160,
      criticalDeviation: 20    // 20% отклонение считается критическим
    }
  }
};

const FILLER_WORDS = {
  'ru-RU': [
    "ну", "эм", "ээ", "типа", "как бы", "вот", "значит", "короче", "так сказать",
    "собственно", "в общем", "как говорится", "так скажем", "допустим"
  ],
  'en-US': [
    "um", "uh", "like", "you know", "sort of", "kind of", "basically", "actually",
    "literally", "well", "so", "right", "okay", "i mean"
  ]
};

export function countFillerWords(text: string, language: string): FillerWordsAnalysis {
  const fillerWordsList = FILLER_WORDS[language as keyof typeof FILLER_WORDS] || FILLER_WORDS['en-US'];
  
  // Приводим текст к нижнему регистру и очищаем от лишних пробелов
  const cleanText = text.toLowerCase().trim();
  
  const foundWordsArray: string[] = [];
  const detailsCountMap: { [key: string]: number } = {};

  // Сначала ищем составные слова-паразиты (из нескольких слов)
  const multiWordFillers = fillerWordsList.filter(word => word.includes(' '));
  multiWordFillers.forEach(filler => {
    let startIndex = 0;
    while (true) {
      const index = cleanText.indexOf(filler, startIndex);
      if (index === -1) break;
      
      // Проверяем, что это отдельное выражение, а не часть другого слова
      const beforeChar = index === 0 ? ' ' : cleanText[index - 1];
      const afterChar = index + filler.length >= cleanText.length ? ' ' : cleanText[index + filler.length];
      
      if (/[\s.,!?]/.test(beforeChar) && /[\s.,!?]/.test(afterChar)) {
        foundWordsArray.push(filler);
        detailsCountMap[filler] = (detailsCountMap[filler] || 0) + 1;
      }
      startIndex = index + 1;
    }
  });

  // Затем ищем одиночные слова-паразиты
  const singleWordFillers = fillerWordsList.filter(word => !word.includes(' '));
  const words = cleanText
    .split(/[\s.,!?]+/) // Разбиваем по пробелам и знакам препинания
    .filter(Boolean);   // Удаляем пустые строки

  words.forEach(word => {
    if (singleWordFillers.includes(word)) {
      foundWordsArray.push(word);
      detailsCountMap[word] = (detailsCountMap[word] || 0) + 1;
    }
  });

  return {
    count: foundWordsArray.length,
    words: foundWordsArray,
    details: detailsCountMap
  };
}

export function calculateSpeechRate(text: string, durationInSeconds: number): number {
  const words = text.split(/\s+/).filter(Boolean);
  return Math.round((words.length / durationInSeconds) * 60);
}

export function analyzeSpeech(
  text: string,
  durationInSeconds: number,
  language: string,
  customThresholds?: Partial<AnalysisThresholds>
): SpeechAnalysis {
  // Получаем пороговые значения с учетом пользовательских настроек
  const defaultThresholds = DEFAULT_THRESHOLDS[language as keyof typeof DEFAULT_THRESHOLDS] || 
                          DEFAULT_THRESHOLDS['en-US'];
  const thresholds: AnalysisThresholds = {
    ...defaultThresholds,
    ...customThresholds,
    optimalSpeechRate: {
      ...defaultThresholds.optimalSpeechRate,
      ...(customThresholds?.optimalSpeechRate || {})
    }
  };

  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const speechRate = calculateSpeechRate(text, durationInSeconds);
  const fillerWords = countFillerWords(text, language);
  const fillerWordsRatio = wordCount > 0 ? fillerWords.count / wordCount : 0;
  
  // Вычисляем отклонение от оптимального темпа речи
  const optimalMean = (thresholds.optimalSpeechRate.max + thresholds.optimalSpeechRate.min) / 2;
  const speechRateDeviation = Math.abs((speechRate - optimalMean) / optimalMean) * 100;
  
  const recommendations: string[] = [];

  // Анализ длительности
  if (durationInSeconds < thresholds.minDuration) {
    recommendations.push(
      language === 'ru-RU'
        ? `Слишком короткое выступление (${Math.round(durationInSeconds)} сек). Для полноценного анализа нужно минимум ${thresholds.minDuration} секунд.`
        : `Speech is too short (${Math.round(durationInSeconds)} sec). For meaningful analysis, speak for at least ${thresholds.minDuration} seconds.`
    );
  }
  
  // Анализ темпа речи
  if (speechRateDeviation > thresholds.optimalSpeechRate.criticalDeviation) {
    if (speechRate < thresholds.optimalSpeechRate.min) {
      recommendations.push(
        language === 'ru-RU' 
          ? `Темп речи слишком медленный (${speechRate} слов/мин). Оптимальный темп: ${thresholds.optimalSpeechRate.min}-${thresholds.optimalSpeechRate.max} слов/мин.`
          : `Speech rate is too slow (${speechRate} words/min). Optimal range: ${thresholds.optimalSpeechRate.min}-${thresholds.optimalSpeechRate.max} words/min.`
      );
    } else if (speechRate > thresholds.optimalSpeechRate.max) {
      recommendations.push(
        language === 'ru-RU'
          ? `Темп речи слишком быстрый (${speechRate} слов/мин). Оптимальный темп: ${thresholds.optimalSpeechRate.min}-${thresholds.optimalSpeechRate.max} слов/мин.`
          : `Speech rate is too fast (${speechRate} words/min). Optimal range: ${thresholds.optimalSpeechRate.min}-${thresholds.optimalSpeechRate.max} words/min.`
      );
    }
  }

  // Анализ слов-паразитов
  if (fillerWordsRatio > thresholds.maxFillerWordsRatio) {
    const percentage = Math.round(fillerWordsRatio * 100);
    recommendations.push(
      language === 'ru-RU'
        ? `Слишком много слов-паразитов (${percentage}% от всех слов). Постарайтесь избегать: ${
            Object.entries(fillerWords.details)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 3)
              .map(([word, count]) => `"${word}" (${count}×)`)
              .join(', ')
          }`
        : `Too many filler words (${percentage}% of all words). Try to avoid: ${
            Object.entries(fillerWords.details)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 3)
              .map(([word, count]) => `"${word}" (${count}×)`)
              .join(', ')
          }`
    );
  }

  return {
    speechRate,
    fillerWords,
    wordCount,
    duration: durationInSeconds,
    recommendations,
    metrics: {
      fillerWordsRatio,
      speechRateDeviation
    }
  };
} 