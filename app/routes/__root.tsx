import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { ThemeToggle } from '../components/ui/ThemeToggle'

export const Route = createRootRoute({
    component: RootComponent,
})

function RootComponent() {
    return (
        <div className="app">
            <nav className="nav">
                <div className="nav-brand">
                    <span className="nav-logo">🐓</span>
                    <span className="nav-title">Rooster</span>
                </div>
                <div className="nav-links">
                    <Link to="/" className="nav-link" activeProps={{ className: 'nav-link active' }}>
                        Dashboard
                    </Link>
                    <Link to="/calendar" className="nav-link" activeProps={{ className: 'nav-link active' }}>
                        Calendar
                    </Link>
                    <Link to="/shopping" className="nav-link" activeProps={{ className: 'nav-link active' }}>
                        Shopping
                    </Link>
                    <Link to="/tasks" className="nav-link" activeProps={{ className: 'nav-link active' }}>
                        Tasks
                    </Link>
                    <ThemeToggle />
                </div>
            </nav>
            <main className="main">
                <Outlet />
            </main>
        </div>
    )
}
