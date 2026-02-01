import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useI18n } from '~/lib/i18n'
import { useAuth } from '~/lib/auth'

export const Route = createFileRoute('/')({
    component: DashboardPage,
})

function DashboardPage() {
    const { t, language } = useI18n()
    const { user, isAuthenticated } = useAuth()
    const today = new Date()
    const hour = today.getHours()

    const [stats, setStats] = useState({
        shiftsThisWeek: 0,
        pendingTasks: 0,
        shoppingItems: 0,
        daysUntilVacation: 0
    })
    const [todayShifts, setTodayShifts] = useState<any[]>([])
    const [quickTasks, setQuickTasks] = useState<any[]>([])

    useEffect(() => {
        if (isAuthenticated) {
            fetchDashboardData()
        }
    }, [isAuthenticated])

    const fetchDashboardData = async () => {
        try {
            // Fetch stats
            const statsRes = await fetch('/api/dashboard/stats')
            if (statsRes.ok) {
                setStats(await statsRes.json())
            }

            // Fetch today's shifts
            const start = new Date(today)
            start.setHours(0, 0, 0, 0)
            const end = new Date(today)
            end.setHours(23, 59, 59, 999)

            const shiftsRes = await fetch(`/api/shifts?start=${start.toISOString()}&end=${end.toISOString()}`)
            if (shiftsRes.ok) {
                const data = await shiftsRes.json()
                setTodayShifts(data.shifts)
            }

            // Fetch tasks due soon
            const tasksRes = await fetch('/api/tasks')
            if (tasksRes.ok) {
                const data = await tasksRes.json()
                // Client-side filter for now for simplicity, ideally backend filter
                const dueSoon = data.tasks
                    .filter((t: any) => !t.completed)
                    .slice(0, 5)
                setQuickTasks(dueSoon)
            }

        } catch (error) {
            console.error('Dashboard fetch error:', error)
        }
    }

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
                <h1>{greeting} {user?.displayName ? `, ${user.displayName}` : ''} 👋</h1>
                <p>{formattedDate}</p>
            </div>

            <div className="grid grid-4">
                <div className="stat-card">
                    <div className="stat-value">{stats.shiftsThisWeek}</div>
                    <div className="stat-label">{t('dashboard.shiftsThisWeek')}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.pendingTasks}</div>
                    <div className="stat-label">{t('dashboard.pendingTasks')}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.shoppingItems}</div>
                    <div className="stat-label">{t('dashboard.shoppingItems')}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.daysUntilVacation}</div>
                    <div className="stat-label">{t('dashboard.daysUntilVacation')}</div>
                </div>
            </div>

            <div className="grid grid-2" style={{ marginTop: 'var(--space-xl)' }}>
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">📅 {t('dashboard.todaySchedule')}</h2>
                        <Link to="/calendar" className="btn btn-ghost">{t('common.viewAll')}</Link>
                    </div>
                    {todayShifts.length > 0 ? (
                        <div className="schedule-list">
                            {todayShifts.map(shift => (
                                <div key={shift.id} className="schedule-item">
                                    <span className="time">{new Date(shift.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    <span className="type">{shift.shiftType}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-state-icon">🌤️</div>
                            <p>{t('dashboard.noEvents')}</p>
                        </div>
                    )}
                </div>

                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">✅ {t('dashboard.tasksDueSoon')}</h2>
                        <Link to="/tasks" className="btn btn-ghost">{t('common.viewAll')}</Link>
                    </div>
                    {quickTasks.length > 0 ? (
                        <div className="task-preview-list">
                            {quickTasks.map(task => (
                                <div key={task.id} className="task-preview-item">
                                    <span className="marker">○</span>
                                    <span>{task.title}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-state-icon">🎉</div>
                            <p>{t('dashboard.allCaughtUp')}</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-2" style={{ marginTop: 'var(--space-lg)' }}>
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">🛒 {t('dashboard.shoppingList')}</h2>
                        <Link to="/shopping" className="btn btn-ghost">{t('common.viewAll')}</Link>
                    </div>
                    <div className="empty-state">
                        <div className="empty-state-icon">basket</div>
                        <p>{stats.shoppingItems} {language === 'de' ? 'Artikel' : 'Items'}</p>
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
            <style>{`
                .schedule-item { 
                    padding: var(--space-sm); border-bottom: 1px solid var(--bg-tertiary); display: flex; gap: var(--space-md);
                }
                .task-preview-item {
                    padding: var(--space-xs) 0; display: flex; gap: var(--space-sm); align-items: center;
                }
                .marker { color: var(--text-muted); }
            `}</style>
        </div>
    )
}
