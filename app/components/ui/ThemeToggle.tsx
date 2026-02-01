import { useTheme } from '~/lib/theme'

export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme()

    return (
        <button
            onClick={toggleTheme}
            className="theme-toggle"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
            {theme === 'dark' ? '☀️' : '🌙'}
            <style>{`
        .theme-toggle {
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
        .theme-toggle:hover {
          background: var(--bg-elevated);
          transform: scale(1.05);
        }
        .theme-toggle:active {
          transform: scale(0.95);
        }
      `}</style>
        </button>
    )
}
