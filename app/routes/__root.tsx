import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { LanguageToggle } from '../components/ui/LanguageToggle'
import { BottomNav } from '../components/ui/BottomNav'
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
            {/* Desktop Navigation */}
            <nav className="nav desktop-nav">
                <Link to="/" className="nav-brand" style={{ textDecoration: 'none' }}>
                    <span className="nav-logo">🐓</span>
                    <span className="nav-title">Rooster</span>
                </Link>
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
                            <Link to="/profile" className="user-avatar" title={user?.displayName || user?.username}>
                                {user?.avatar ? (
                                    <img src={user.avatar} alt="" />
                                ) : (
                                    <span>{(user?.displayName || user?.username || '?')[0].toUpperCase()}</span>
                                )}
                            </Link>
                        ) : (
                            <Link to="/login" className="btn btn-primary btn-sm">
                                {language === 'de' ? 'Anmelden' : 'Sign In'}
                            </Link>
                        )
                    )}
                </div>
            </nav>

            {/* Mobile Header */}
            <header className="mobile-header">
                <Link to="/" className="nav-brand" style={{ textDecoration: 'none' }}>
                    <span className="nav-logo">🐓</span>
                    <span className="nav-title">Rooster</span>
                </Link>
                <div className="mobile-header-actions">
                    <LanguageToggle />
                    <ThemeToggle />
                    {!isLoading && (
                        isAuthenticated ? (
                            <Link to="/profile" className="user-avatar-sm">
                                {user?.avatar ? (
                                    <img src={user.avatar} alt="" />
                                ) : (
                                    <span>{(user?.displayName || user?.username || '?')[0].toUpperCase()}</span>
                                )}
                            </Link>
                        ) : (
                            <Link to="/login" className="btn btn-primary btn-sm">
                                {language === 'de' ? 'Anmelden' : 'Sign In'}
                            </Link>
                        )
                    )}
                </div>
            </header>

            <main className="main">
                <Outlet />
            </main>

            {/* Mobile Bottom Navigation */}
            <BottomNav />
        </div>
    )
}


