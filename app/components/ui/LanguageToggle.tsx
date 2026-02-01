import { useI18n, type Language } from '~/lib/i18n'

export function LanguageToggle() {
    const { language, setLanguage } = useI18n()

    return (
        <button
            onClick={() => setLanguage(language === 'de' ? 'en' : 'de')}
            className="language-toggle"
            aria-label={`Switch to ${language === 'de' ? 'English' : 'German'}`}
            title={language === 'de' ? 'Switch to English' : 'Auf Deutsch wechseln'}
        >
            {language === 'de' ? '🇩🇪' : '🇬🇧'}
            <style>{`
        .language-toggle {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          background: var(--bg-tertiary);
          border: 1px solid var(--bg-elevated);
          border-radius: var(--radius-full);
          font-size: 1.25rem;
          cursor: pointer;
          transition: all var(--transition-base);
        }
        .language-toggle:hover {
          background: var(--bg-elevated);
          transform: scale(1.05);
        }
        .language-toggle:active {
          transform: scale(0.95);
        }
      `}</style>
        </button>
    )
}
