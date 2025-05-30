interface LanguageSelectorProps {
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
  disabled?: boolean;
}

const languages = [
  { code: 'ru-RU', label: 'Русский' },
  { code: 'en-US', label: 'English' }
];

export function LanguageSelector({ 
  selectedLanguage, 
  onLanguageChange,
  disabled = false 
}: LanguageSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="language-select" className="font-medium">
        Язык:
      </label>
      <select
        id="language-select"
        value={selectedLanguage}
        onChange={(e) => onLanguageChange(e.target.value)}
        disabled={disabled}
        className={`px-3 py-1.5 rounded-lg border ${
          disabled 
            ? 'bg-gray-100 cursor-not-allowed' 
            : 'bg-white hover:border-blue-500'
        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
      >
        {languages.map(({ code, label }) => (
          <option key={code} value={code}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
} 