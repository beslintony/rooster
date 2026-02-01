import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { LanguageToggle } from '../components/ui/LanguageToggle'
import { useI18n } from '../lib/i18n'
import { useAuth } from '../lib/auth'

export const Route = createRootRoute({
    component: RootComponent,
})

function RootComponent() {
    const { t, language } = useI18n()
    const { user, isAuthenticated, isLoading } = useAuth()

    return (
        <div className="app">
            <nav className="nav">
                <div className="nav-brand">
                    <span className="nav-logo">🐓</span>
                    <span className="nav-title">Rooster</span>
                </div>
                <div className="nav-links">
                    <Link to="/" className="nav-link" activeProps={{ className: 'nav-link active' }}>
                        {t('nav.dashboard')}
                    </Link>
                    <Link to="/calendar" className="nav-link" activeProps={{ className: 'nav-link active' }}>
                        {t('nav.calendar')}
                    </Link>
                    <Link to="/shopping" className="nav-link" activeProps={{ className: 'nav-link active' }}>
                        {t('nav.shopping')}
                    </Link>
                    <Link to="/tasks" className="nav-link" activeProps={{ className: 'nav-link active' }}>
                        {t('nav.tasks')}
                    </Link>

                    <div className="nav-divider" />

                    <LanguageToggle />
                    <ThemeToggle />

                    {!isLoading && (
                        isAuthenticated ? (
                            <>
                                <Link to="/connections" className="nav-icon-link" title={language === 'de' ? 'Verbindungen' : 'Connections'}>
                                    👥
                                </Link>
                                <Link to="/profile" className="user-avatar" title={user?.displayName || user?.username}>
                                    {user?.avatar ? (
                                        <img src={user.avatar} alt="" />
                                    ) : (
                                        <span>{(user?.displayName || user?.username || '?')[0].toUpperCase()}</span>
                                    )}
                                </Link>
                            </>
                        ) : (
                            <Link to="/login" className="btn btn-primary btn-sm">
                                {language === 'de' ? 'Anmelden' : 'Sign In'}
                            </Link>
                        )
                    )}
                </div>
            </nav>
            <main className="main">
                <Outlet />
            </main>

            <style>{`
        .nav-divider {
          width: 1px;
          height: 24px;
          background: var(--bg-tertiary);
          margin: 0 var(--space-sm);
        }
        .user-avatar {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-full);
          background: var(--accent-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 0.875rem;
          overflow: hidden;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .user-avatar:hover {
          transform: scale(1.05);
          box-shadow: 0 0 0 2px var(--accent-primary);
        }
        .user-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .nav-icon-link {
          font-size: 1.25rem;
          opacity: 0.7;
          transition: all var(--transition-fast);
          text-decoration: none;
        }
        .nav-icon-link:hover {
          opacity: 1;
          transform: scale(1.1);
        }
        .btn-sm {
          padding: var(--space-xs) var(--space-md);
          font-size: 0.875rem;
        }
      `}</style>
        </div>
    )
}


