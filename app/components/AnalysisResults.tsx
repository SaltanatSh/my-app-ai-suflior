import { SpeechAnalysis } from '../utils/speechAnalysis';

interface AnalysisResultsProps extends SpeechAnalysis {
  language: string;
  humeResults?: any;
  isAnalyzing?: boolean;
  humeError?: string | null;
}

export function AnalysisResults({
  speechRate,
  fillerWords,
  wordCount,
  duration,
  recommendations,
  metrics,
  language,
  humeResults,
  isAnalyzing,
  humeError
}: AnalysisResultsProps) {
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const renderHumeAnalysis = () => {
    if (isAnalyzing) {
      return (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-blue-600">
            {language === 'ru-RU'
              ? 'Выполняется расширенный анализ выразительности речи...'
              : 'Performing extended speech expression analysis...'}
          </p>
        </div>
      );
    }

    if (humeError) {
      return (
        <div className="mt-4 p-4 bg-red-50 rounded-lg">
          <p className="text-red-600">
            {language === 'ru-RU'
              ? `Ошибка анализа: ${humeError}`
              : `Analysis error: ${humeError}`}
          </p>
        </div>
      );
    }

    if (!humeResults) {
      return null;
    }

    // Извлекаем и форматируем результаты Hume AI
    const prosodyResults = humeResults[0]?.results?.predictions?.[0]?.prosody;
    const languageResults = humeResults[0]?.results?.predictions?.[0]?.language;
    const burstResults = humeResults[0]?.results?.predictions?.[0]?.burst;

    return (
      <div className="mt-6 space-y-4">
        <h3 className="text-lg font-semibold">
          {language === 'ru-RU' ? 'Расширенный анализ речи' : 'Extended Speech Analysis'}
        </h3>
        
        {/* Просодический анализ */}
        {prosodyResults && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">
              {language === 'ru-RU' ? 'Просодические характеристики' : 'Prosodic Features'}
            </h4>
            <ul className="space-y-2">
              {prosodyResults.map((result: any, index: number) => (
                <li key={index} className="text-sm">
                  <span className="font-medium">
                    {result.name}:
                  </span>{' '}
                  {result.score.toFixed(2)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Языковой анализ */}
        {languageResults && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">
              {language === 'ru-RU' ? 'Языковые характеристики' : 'Language Features'}
            </h4>
            <div className="space-y-2">
              {languageResults.sentiment && (
                <p className="text-sm">
                  <span className="font-medium">
                    {language === 'ru-RU' ? 'Тональность' : 'Sentiment'}:
                  </span>{' '}
                  {languageResults.sentiment.score.toFixed(2)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Анализ эмоциональных всплесков */}
        {burstResults && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">
              {language === 'ru-RU' ? 'Эмоциональные всплески' : 'Emotional Bursts'}
            </h4>
            <ul className="space-y-2">
              {burstResults.map((burst: any, index: number) => (
                <li key={index} className="text-sm">
                  <span className="font-medium">
                    {burst.name}:
                  </span>{' '}
                  {burst.score.toFixed(2)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4 p-4">
      {/* Базовая статистика */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">
            {language === 'ru-RU' ? 'Общая статистика' : 'General Statistics'}
          </h4>
          <ul className="space-y-2 text-sm">
            <li>
              <span className="font-medium">
                {language === 'ru-RU' ? 'Длительность' : 'Duration'}:
              </span>{' '}
              {formatDuration(duration)}
            </li>
            <li>
              <span className="font-medium">
                {language === 'ru-RU' ? 'Количество слов' : 'Word count'}:
              </span>{' '}
              {wordCount}
            </li>
            <li>
              <span className="font-medium">
                {language === 'ru-RU' ? 'Темп речи' : 'Speech rate'}:
              </span>{' '}
              {speechRate} {language === 'ru-RU' ? 'слов/мин' : 'words/min'}
            </li>
          </ul>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">
            {language === 'ru-RU' ? 'Слова-паразиты' : 'Filler Words'}
          </h4>
          <ul className="space-y-2 text-sm">
            <li>
              <span className="font-medium">
                {language === 'ru-RU' ? 'Общее количество' : 'Total count'}:
              </span>{' '}
              {fillerWords.count}
            </li>
            <li>
              <span className="font-medium">
                {language === 'ru-RU' ? 'Процент от всех слов' : 'Percentage of all words'}:
              </span>{' '}
              {(metrics.fillerWordsRatio * 100).toFixed(1)}%
            </li>
          </ul>
          {Object.entries(fillerWords.details).length > 0 && (
            <div className="mt-2">
              <p className="text-sm font-medium mb-1">
                {language === 'ru-RU' ? 'Детали' : 'Details'}:
              </p>
              <ul className="text-sm space-y-1">
                {Object.entries(fillerWords.details)
                  .sort(([, a], [, b]) => b - a)
                  .map(([word, count]) => (
                    <li key={word}>
                      "{word}": {count}×
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Рекомендации */}
      {recommendations.length > 0 && (
        <div className="p-4 bg-yellow-50 rounded-lg">
          <h4 className="font-medium mb-2">
            {language === 'ru-RU' ? 'Рекомендации' : 'Recommendations'}
          </h4>
          <ul className="space-y-2 text-sm">
            {recommendations.map((rec, index) => (
              <li key={index} className="flex gap-2">
                <span>•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Результаты Hume AI */}
      {renderHumeAnalysis()}
    </div>
  );
} 