import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
    component: DashboardPage,
})

function DashboardPage() {
    const today = new Date()
    const greeting = getGreeting()

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1>{greeting} 👋</h1>
                <p>{formatDate(today)}</p>
            </div>

            <div className="grid grid-4">
                <div className="stat-card">
                    <div className="stat-value">0</div>
                    <div className="stat-label">Shifts This Week</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">0</div>
                    <div className="stat-label">Pending Tasks</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">0</div>
                    <div className="stat-label">Shopping Items</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">0</div>
                    <div className="stat-label">Days Until Vacation</div>
                </div>
            </div>

            <div className="grid grid-2" style={{ marginTop: 'var(--space-xl)' }}>
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">📅 Today's Schedule</h2>
                        <Link to="/calendar" className="btn btn-ghost">View All</Link>
                    </div>
                    <div className="empty-state">
                        <div className="empty-state-icon">🌤️</div>
                        <p>No events scheduled for today</p>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">✅ Tasks Due Soon</h2>
                        <Link to="/tasks" className="btn btn-ghost">View All</Link>
                    </div>
                    <div className="empty-state">
                        <div className="empty-state-icon">🎉</div>
                        <p>All caught up!</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-2" style={{ marginTop: 'var(--space-lg)' }}>
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">🛒 Shopping List</h2>
                        <Link to="/shopping" className="btn btn-ghost">View All</Link>
                    </div>
                    <div className="empty-state">
                        <div className="empty-state-icon">🧺</div>
                        <p>Shopping list is empty</p>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">🏖️ Upcoming Vacations</h2>
                        <Link to="/calendar" className="btn btn-ghost">Plan Vacation</Link>
                    </div>
                    <div className="empty-state">
                        <div className="empty-state-icon">✈️</div>
                        <p>No vacations planned</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

function getGreeting(): string {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
}

function formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    })
}
