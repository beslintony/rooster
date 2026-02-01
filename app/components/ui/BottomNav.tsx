import { Link, useRouterState } from '@tanstack/react-router'
import { useI18n } from '../../lib/i18n'

interface NavItem {
    to: string
    icon: string
    label: string
}

export function BottomNav() {
    const { t } = useI18n()
    const router = useRouterState()
    const currentPath = router.location.pathname

    const navItems: NavItem[] = [
        { to: '/', icon: '🏠', label: t('nav.dashboard') },
        { to: '/calendar', icon: '📅', label: t('nav.calendar') },
        { to: '/shopping', icon: '🛒', label: t('nav.shopping') },
        { to: '/tasks', icon: '✅', label: t('nav.tasks') },
    ]

    const isActive = (path: string) => {
        if (path === '/') return currentPath === '/'
        return currentPath.startsWith(path)
    }

    return (
        <nav className="bottom-nav">
            {navItems.map((item) => (
                <Link
                    key={item.to}
                    to={item.to}
                    className={`bottom-nav-item ${isActive(item.to) ? 'active' : ''}`}
                >
                    <span className="bottom-nav-icon">{item.icon}</span>
                    <span className="bottom-nav-label">{item.label}</span>
                    {isActive(item.to) && <span className="bottom-nav-indicator" />}
                </Link>
            ))}
        </nav>
    )
}
