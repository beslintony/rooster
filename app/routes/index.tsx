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
        daysUntilVacation: -1
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
            const statsRes = await fetch('/api/dashboard/stats')
            if (statsRes.ok) setStats(await statsRes.json())

            const start = new Date(today)
            start.setHours(0, 0, 0, 0)
            const end = new Date(today)
            end.setHours(23, 59, 59, 999)

            const shiftsRes = await fetch(`/api/shifts?start=${start.toISOString()}&end=${end.toISOString()}`)
            if (shiftsRes.ok) {
                const data = await shiftsRes.json()
                setTodayShifts(data.shifts)
            }

            const tasksRes = await fetch('/api/tasks')
            if (tasksRes.ok) {
                const data = await tasksRes.json()
                setQuickTasks(data.tasks.filter((t: any) => !t.completed).slice(0, 5))
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
        day: 'numeric',
        month: 'long',
    })

    return (
        <div className="dashboard">
            {/* Header */}
            <header className="dashboard-header">
                <h1>{greeting}{user?.displayName ? `, ${user.displayName}` : ''} 👋</h1>
                <p className="date-text">{formattedDate}</p>
            </header>

            {/* Stats Row - horizontal scroll on mobile */}
            <div className="stats-row">
                <div className="stat-card">
                    <span className="stat-icon">📅</span>
                    <div className="stat-content">
                        <span className="stat-value">{stats.shiftsThisWeek}</span>
                        <span className="stat-label">{t('dashboard.shiftsThisWeek')}</span>
                    </div>
                </div>
                <div className="stat-card">
                    <span className="stat-icon">✅</span>
                    <div className="stat-content">
                        <span className="stat-value">{stats.pendingTasks}</span>
                        <span className="stat-label">{t('dashboard.pendingTasks')}</span>
                    </div>
                </div>
                <div className="stat-card">
                    <span className="stat-icon">🛒</span>
                    <div className="stat-content">
                        <span className="stat-value">{stats.shoppingItems}</span>
                        <span className="stat-label">{t('dashboard.shoppingItems')}</span>
                    </div>
                </div>
                {stats.daysUntilVacation >= 0 && (
                    <div className="stat-card stat-vacation">
                        <span className="stat-icon">🏖️</span>
                        <div className="stat-content">
                            <span className="stat-value">{stats.daysUntilVacation}</span>
                            <span className="stat-label">{t('dashboard.daysUntilVacation')}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Main Content Grid */}
            <div className="dashboard-grid">
                {/* Today's Schedule */}
                <section className="dashboard-card">
                    <div className="card-header">
                        <h2>📅 {t('dashboard.todaySchedule')}</h2>
                        <Link to="/calendar" className="btn btn-ghost btn-sm">{t('common.viewAll')}</Link>
                    </div>
                    {todayShifts.length > 0 ? (
                        <ul className="schedule-list">
                            {todayShifts.map(shift => (
                                <li key={shift.id} className="schedule-item">
                                    <span className="time">{new Date(shift.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    <span className="type">{shift.shiftType}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="empty-state">
                            <span className="empty-icon">🌤️</span>
                            <p>{t('dashboard.noEvents')}</p>
                        </div>
                    )}
                </section>

                {/* Tasks Due */}
                <section className="dashboard-card">
                    <div className="card-header">
                        <h2>✅ {t('dashboard.tasksDueSoon')}</h2>
                        <Link to="/tasks" className="btn btn-ghost btn-sm">{t('common.viewAll')}</Link>
                    </div>
                    {quickTasks.length > 0 ? (
                        <ul className="task-list">
                            {quickTasks.map(task => (
                                <li key={task.id} className="task-item">
                                    <span className="task-marker">○</span>
                                    <span className="task-title">{task.title}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="empty-state">
                            <span className="empty-icon">🎉</span>
                            <p>{t('dashboard.allCaughtUp')}</p>
                        </div>
                    )}
                </section>

                {/* Quick Actions */}
                <section className="dashboard-card quick-actions">
                    <h2>{language === 'de' ? 'Schnellzugriff' : 'Quick Actions'}</h2>
                    <div className="action-buttons">
                        <Link to="/calendar" className="action-btn">
                            <span>📅</span>
                            <span>{language === 'de' ? 'Schicht planen' : 'Plan Shift'}</span>
                        </Link>
                        <Link to="/shopping" className="action-btn">
                            <span>🛒</span>
                            <span>{language === 'de' ? 'Einkaufen' : 'Shopping'}</span>
                        </Link>
                        <Link to="/tasks" className="action-btn">
                            <span>✅</span>
                            <span>{language === 'de' ? 'Aufgabe' : 'Add Task'}</span>
                        </Link>
                    </div>
                </section>
            </div>

            <style>{`
                .dashboard {
                    max-width: 900px;
                    margin: 0 auto;
                }
                
                .dashboard-header {
                    margin-bottom: var(--space-lg);
                }
                .dashboard-header h1 {
                    font-size: var(--font-xl);
                    font-weight: var(--font-weight-bold);
                    margin-bottom: var(--space-xs);
                }
                .date-text {
                    font-size: var(--font-sm);
                    color: var(--text-secondary);
                }
                
                /* Stats Row */
                .stats-row {
                    display: flex;
                    gap: var(--space-sm);
                    margin-bottom: var(--space-lg);
                    overflow-x: auto;
                    padding-bottom: var(--space-xs);
                    -webkit-overflow-scrolling: touch;
                    scrollbar-width: none;
                }
                .stats-row::-webkit-scrollbar { display: none; }
                
                .stat-card {
                    display: flex;
                    align-items: center;
                    gap: var(--space-sm);
                    padding: var(--space-md);
                    background: var(--bg-secondary);
                    border: 1px solid var(--bg-tertiary);
                    border-radius: var(--radius-lg);
                    min-width: 140px;
                    flex-shrink: 0;
                }
                .stat-icon { font-size: 1.5rem; }
                .stat-content { display: flex; flex-direction: column; }
                .stat-value { 
                    font-size: var(--font-xl); 
                    font-weight: var(--font-weight-bold);
                    color: var(--accent-primary);
                    line-height: 1;
                }
                .stat-label { 
                    font-size: var(--font-xs); 
                    color: var(--text-muted);
                    white-space: nowrap;
                }
                .stat-vacation { 
                    background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(6, 182, 212, 0.1));
                    border-color: var(--accent-primary);
                }
                
                /* Dashboard Grid */
                .dashboard-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: var(--space-md);
                }
                
                .dashboard-card {
                    background: var(--bg-secondary);
                    border: 1px solid var(--bg-tertiary);
                    border-radius: var(--radius-lg);
                    padding: var(--space-md);
                }
                .dashboard-card .card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: var(--space-md);
                }
                .dashboard-card h2 {
                    font-size: var(--font-sm);
                    font-weight: var(--font-weight-semibold);
                }
                
                /* Lists */
                .schedule-list, .task-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }
                .schedule-item, .task-item {
                    display: flex;
                    align-items: center;
                    gap: var(--space-sm);
                    padding: var(--space-sm) 0;
                    border-bottom: 1px solid var(--bg-tertiary);
                    font-size: var(--font-sm);
                }
                .schedule-item:last-child, .task-item:last-child { border-bottom: none; }
                .time { color: var(--text-muted); min-width: 50px; }
                .task-marker { color: var(--text-muted); }
                
                /* Empty State */
                .empty-state {
                    text-align: center;
                    padding: var(--space-lg) var(--space-md);
                    color: var(--text-muted);
                }
                .empty-icon { font-size: 2rem; display: block; margin-bottom: var(--space-xs); }
                .empty-state p { font-size: var(--font-sm); margin: 0; }
                
                /* Quick Actions */
                .quick-actions h2 { margin-bottom: var(--space-md); }
                .action-buttons {
                    display: flex;
                    gap: var(--space-sm);
                }
                .action-btn {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: var(--space-xs);
                    padding: var(--space-md);
                    background: var(--bg-primary);
                    border: 1px solid var(--bg-tertiary);
                    border-radius: var(--radius-md);
                    text-decoration: none;
                    color: var(--text-primary);
                    font-size: var(--font-xs);
                    transition: all var(--transition-fast);
                }
                .action-btn:hover {
                    border-color: var(--accent-primary);
                    background: rgba(139, 92, 246, 0.05);
                }
                .action-btn span:first-child { font-size: 1.25rem; }
                
                /* Mobile */
                @media (max-width: 640px) {
                    .dashboard-header h1 { font-size: var(--font-lg); }
                    .stat-card { 
                        min-width: 120px; 
                        padding: var(--space-sm); 
                    }
                    .stat-icon { font-size: 1.25rem; }
                    .stat-value { font-size: var(--font-lg); }
                    .dashboard-card { padding: var(--space-sm); }
                    .dashboard-card h2 { font-size: var(--font-xs); }
                }
            `}</style>
        </div>
    )
}

