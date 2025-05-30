import { FillerWordsAnalysis } from '../utils/speechAnalysis';

interface AnalysisResultsProps {
  speechRate: number;
  fillerWords: FillerWordsAnalysis;
  wordCount: number;
  duration: number;
  recommendations: string[];
  language: string;
}

export function AnalysisResults({
  speechRate,
  fillerWords,
  wordCount,
  duration,
  recommendations,
  language
}: AnalysisResultsProps) {
  return (
    <div className="space-y-4">
      {/* Основные метрики */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 bg-white rounded-lg border">
          <h3 className="font-medium text-gray-700">
            {language === 'ru-RU' ? 'Темп речи' : 'Speech Rate'}
          </h3>
          <p className="text-2xl font-bold text-blue-600">
            {speechRate} {language === 'ru-RU' ? 'слов/мин' : 'words/min'}
          </p>
        </div>
        <div className="p-4 bg-white rounded-lg border">
          <h3 className="font-medium text-gray-700">
            {language === 'ru-RU' ? 'Слова-паразиты' : 'Filler Words'}
          </h3>
          <p className="text-2xl font-bold text-blue-600">
            {fillerWords.count}
          </p>
        </div>
      </div>

      {/* Детальная статистика */}
      <div className="p-4 bg-white rounded-lg border">
        <h3 className="font-medium text-gray-700 mb-2">
          {language === 'ru-RU' ? 'Детальная статистика' : 'Detailed Statistics'}
        </h3>
        <ul className="space-y-1 text-sm text-gray-600">
          <li>
            {language === 'ru-RU' ? 'Всего слов' : 'Total words'}: {wordCount}
          </li>
          <li>
            {language === 'ru-RU' ? 'Длительность' : 'Duration'}: {duration.toFixed(1)}{' '}
            {language === 'ru-RU' ? 'сек.' : 'sec.'}
          </li>
          {fillerWords.count > 0 && (
            <li>
              {language === 'ru-RU' ? 'Частые слова-паразиты' : 'Common filler words'}:{' '}
              {Object.entries(fillerWords.details)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3)
                .map(([word, count]) => `${word} (${count}×)`)
                .join(', ')}
            </li>
          )}
        </ul>
      </div>

      {/* Рекомендации */}
      {recommendations.length > 0 && (
        <div className="p-4 bg-white rounded-lg border">
          <h3 className="font-medium text-gray-700 mb-2">
            {language === 'ru-RU' ? 'Рекомендации' : 'Recommendations'}
          </h3>
          <ul className="space-y-2">
            {recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                <span className="text-gray-600">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 