import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { LanguageToggle } from '../components/ui/LanguageToggle'
import { useI18n } from '../lib/i18n'

export const Route = createRootRoute({
    component: RootComponent,
})

function RootComponent() {
    const { t } = useI18n()

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
                    <LanguageToggle />
                    <ThemeToggle />
                </div>
            </nav>
            <main className="main">
                <Outlet />
            </main>
        </div>
    )
}

