import {
    createRootRoute,
    Link,
    Outlet,
    HeadContent,
    Scripts,
} from '@tanstack/react-router'
import '../styles/globals.css'

export const Route = createRootRoute({
    head: () => ({
        meta: [
            { charSet: 'utf-8' },
            { name: 'viewport', content: 'width=device-width, initial-scale=1' },
            { title: 'Rooster - Family Calendar & Planner' },
            { name: 'description', content: 'Family calendar with shift planning, shopping lists, and Google Calendar sync' },
        ],
        links: [
            { rel: 'icon', href: '/favicon.ico' },
            { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
            { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
            { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap' },
        ],
    }),
    component: RootComponent,
})

function RootComponent() {
    return (
        <html lang="en">
            <head>
                <HeadContent />
            </head>
            <body>
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
                        </div>
                    </nav>
                    <main className="main">
                        <Outlet />
                    </main>
                </div>
                <Scripts />
            </body>
        </html>
    )
}
