import { createFileRoute, Link } from '@tanstack/react-router'
import { useI18n } from '~/lib/i18n'

export const Route = createFileRoute('/')({
    component: DashboardPage,
})

function DashboardPage() {
    const { t, language } = useI18n()
    const today = new Date()
    const hour = today.getHours()

    const greeting = hour < 12
        ? t('dashboard.greeting.morning')
        : hour < 17
            ? t('dashboard.greeting.afternoon')
            : t('dashboard.greeting.evening')

    const formattedDate = today.toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    })

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1>{greeting} 👋</h1>
                <p>{formattedDate}</p>
            </div>

            <div className="grid grid-4">
                <div className="stat-card">
                    <div className="stat-value">0</div>
                    <div className="stat-label">{t('dashboard.shiftsThisWeek')}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">0</div>
                    <div className="stat-label">{t('dashboard.pendingTasks')}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">0</div>
                    <div className="stat-label">{t('dashboard.shoppingItems')}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">0</div>
                    <div className="stat-label">{t('dashboard.daysUntilVacation')}</div>
                </div>
            </div>

            <div className="grid grid-2" style={{ marginTop: 'var(--space-xl)' }}>
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">📅 {t('dashboard.todaySchedule')}</h2>
                        <Link to="/calendar" className="btn btn-ghost">{t('common.viewAll')}</Link>
                    </div>
                    <div className="empty-state">
                        <div className="empty-state-icon">🌤️</div>
                        <p>{t('dashboard.noEvents')}</p>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">✅ {t('dashboard.tasksDueSoon')}</h2>
                        <Link to="/tasks" className="btn btn-ghost">{t('common.viewAll')}</Link>
                    </div>
                    <div className="empty-state">
                        <div className="empty-state-icon">🎉</div>
                        <p>{t('dashboard.allCaughtUp')}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-2" style={{ marginTop: 'var(--space-lg)' }}>
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">🛒 {t('dashboard.shoppingList')}</h2>
                        <Link to="/shopping" className="btn btn-ghost">{t('common.viewAll')}</Link>
                    </div>
                    <div className="empty-state">
                        <div className="empty-state-icon">🧺</div>
                        <p>{t('dashboard.shoppingEmpty')}</p>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">🏖️ {t('dashboard.upcomingVacations')}</h2>
                        <Link to="/calendar" className="btn btn-ghost">{t('dashboard.planVacation')}</Link>
                    </div>
                    <div className="empty-state">
                        <div className="empty-state-icon">✈️</div>
                        <p>{t('dashboard.noVacations')}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
