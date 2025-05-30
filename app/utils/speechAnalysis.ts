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
}

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

const SPEECH_RATE_RANGES = {
  'ru-RU': { min: 100, max: 140 },
  'en-US': { min: 120, max: 160 }
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
  language: string
): SpeechAnalysis {
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const speechRate = calculateSpeechRate(text, durationInSeconds);
  const fillerWords = countFillerWords(text, language);
  
  const recommendations: string[] = [];
  
  // Анализ темпа речи
  const rateRange = SPEECH_RATE_RANGES[language as keyof typeof SPEECH_RATE_RANGES] || 
                   SPEECH_RATE_RANGES['en-US'];
  
  if (speechRate < rateRange.min) {
    recommendations.push(
      language === 'ru-RU' 
        ? 'Темп речи слишком медленный. Попробуйте говорить немного быстрее для лучшего восприятия.'
        : 'Speech rate is too slow. Try speaking a bit faster for better engagement.'
    );
  } else if (speechRate > rateRange.max) {
    recommendations.push(
      language === 'ru-RU'
        ? 'Темп речи слишком быстрый. Постарайтесь говорить медленнее для лучшей ясности.'
        : 'Speech rate is too fast. Try speaking slower for better clarity.'
    );
  }

  // Анализ слов-паразитов
  if (fillerWords.count > 0) {
    const fillerWordsRatio = fillerWords.count / wordCount;
    if (fillerWordsRatio > 0.1) { // Более 10% слов - паразиты
      recommendations.push(
        language === 'ru-RU'
          ? `Слишком много слов-паразитов (${fillerWords.count}). Постарайтесь избегать: ${
              Object.entries(fillerWords.details)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3)
                .map(([word, count]) => `"${word}" (${count}×)`)
                .join(', ')
            }`
          : `Too many filler words (${fillerWords.count}). Try to avoid: ${
              Object.entries(fillerWords.details)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3)
                .map(([word, count]) => `"${word}" (${count}×)`)
                .join(', ')
            }`
      );
    }
  }

  // Анализ длительности
  if (durationInSeconds < 30) {
    recommendations.push(
      language === 'ru-RU'
        ? 'Слишком короткое выступление для полноценного анализа. Попробуйте говорить дольше.'
        : 'Speech is too short for meaningful analysis. Try speaking longer.'
    );
  }

  return {
    speechRate,
    fillerWords,
    wordCount,
    duration: durationInSeconds,
    recommendations
  };
} 