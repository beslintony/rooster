import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { SHIFT_TYPES } from '~/lib/shifts'
import { getHolidaysForMonth, GERMAN_STATES, type GermanState } from '~/lib/holidays'
import { useI18n, getMonths, getDays } from '~/lib/i18n'
import { useAuth } from '~/lib/auth'

export const Route = createFileRoute('/calendar')({
    component: CalendarPage,
})

type ViewMode = 'month' | 'week'

interface ConnectedUser {
    id: string
    username: string
    displayName: string | null
    avatar: string | null
    color: string
}

// User colors for calendar merge
const USER_COLORS = [
    '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#ec4899', '#14b8a6', '#f97316'
]

function CalendarPage() {
    const { t, language } = useI18n()
    const { isAuthenticated } = useAuth()
    const [currentDate, setCurrentDate] = useState(new Date())
    const [viewMode, setViewMode] = useState<ViewMode>('month')
    const [selectedState, setSelectedState] = useState<GermanState>('NW')
    const [showMergePanel, setShowMergePanel] = useState(false)
    const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([])
    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set(['me']))

    const DAYS = getDays(language)
    const MONTHS = getMonths(language)

    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startOffset = firstDay.getDay()
    const daysInMonth = lastDay.getDate()

    // Get holidays for this month
    const holidays = getHolidaysForMonth(year, month, selectedState)
    const holidayMap = new Map(holidays.map(h => [h.date.getDate(), h]))

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))
    const goToday = () => setCurrentDate(new Date())

    const calendarDays = []
    for (let i = 0; i < startOffset; i++) {
        calendarDays.push(null)
    }
    for (let day = 1; day <= daysInMonth; day++) {
        calendarDays.push(day)
    }

    const today = new Date()
    const isToday = (day: number) =>
        day === today.getDate() && month === today.getMonth() && year === today.getFullYear()

    // Fetch connected users for merge view
    useEffect(() => {
        if (isAuthenticated) {
            fetchConnectedUsers()
        }
    }, [isAuthenticated])

    const fetchConnectedUsers = async () => {
        try {
            const res = await fetch('/api/connections', { credentials: 'include' })
            if (res.ok) {
                const data = await res.json()
                const users = data.connections.map((conn: any, idx: number) => {
                    const user = conn.sender.id === 'me' ? conn.receiver : conn.sender
                    return {
                        ...user,
                        color: USER_COLORS[idx % USER_COLORS.length]
                    }
                })
                setConnectedUsers(users)
            }
        } catch (error) {
            console.error('Failed to fetch connections:', error)
        }
    }

    const toggleUser = (userId: string) => {
        const newSelected = new Set(selectedUsers)
        if (newSelected.has(userId)) {
            newSelected.delete(userId)
        } else {
            newSelected.add(userId)
        }
        setSelectedUsers(newSelected)
    }

    // Shift type translations
    const shiftTranslations: Record<string, string> = {
        FRUEH: t('shift.frueh'),
        SPAET: t('shift.spaet'),
        NACHT: t('shift.nacht'),
        TAG: t('shift.tag'),
        BEREITSCHAFT: t('shift.bereitschaft'),
        KRANK: t('shift.krank'),
        URLAUB: t('shift.urlaub'),
        FREI: t('shift.frei'),
        FLEXIBEL: t('shift.flexibel'),
    }

    return (
        <div className="calendar-page">
            <div className="calendar-header">
                <div className="calendar-nav">
                    <button onClick={prevMonth} className="btn btn-ghost">←</button>
                    <h1>{MONTHS[month]} {year}</h1>
                    <button onClick={nextMonth} className="btn btn-ghost">→</button>
                </div>
                <div className="calendar-actions">
                    <select
                        value={selectedState}
                        onChange={(e) => setSelectedState(e.target.value as GermanState)}
                        className="input state-select"
                    >
                        {Object.entries(GERMAN_STATES).map(([code, name]) => (
                            <option key={code} value={code}>{name}</option>
                        ))}
                    </select>
                    <button onClick={goToday} className="btn btn-secondary">{t('common.today')}</button>
                    <div className="view-toggle">
                        <button
                            onClick={() => setViewMode('month')}
                            className={`btn ${viewMode === 'month' ? 'btn-primary' : 'btn-ghost'}`}
                        >
                            {t('common.month')}
                        </button>
                        <button
                            onClick={() => setViewMode('week')}
                            className={`btn ${viewMode === 'week' ? 'btn-primary' : 'btn-ghost'}`}
                        >
                            {t('common.week')}
                        </button>
                    </div>
                    {isAuthenticated && (
                        <button
                            onClick={() => setShowMergePanel(!showMergePanel)}
                            className={`btn ${showMergePanel ? 'btn-primary' : 'btn-secondary'}`}
                            title={language === 'de' ? 'Kalender zusammenführen' : 'Merge Calendars'}
                        >
                            👥 {language === 'de' ? 'Merge' : 'Merge'}
                        </button>
                    )}
                    <button className="btn btn-primary">{t('calendar.addShift')}</button>
                </div>
            </div>

            <div className="calendar-layout">
                {/* Merge Panel */}
                {showMergePanel && (
                    <div className="merge-panel card">
                        <h3>{language === 'de' ? 'Kalender anzeigen' : 'Show Calendars'}</h3>
                        <div className="merge-users">
                            <label className="merge-user">
                                <input
                                    type="checkbox"
                                    checked={selectedUsers.has('me')}
                                    onChange={() => toggleUser('me')}
                                />
                                <span className="user-dot" style={{ background: '#8b5cf6' }} />
                                <span>{language === 'de' ? 'Mein Kalender' : 'My Calendar'}</span>
                            </label>
                            {connectedUsers.length > 0 ? (
                                connectedUsers.map(user => (
                                    <label key={user.id} className="merge-user">
                                        <input
                                            type="checkbox"
                                            checked={selectedUsers.has(user.id)}
                                            onChange={() => toggleUser(user.id)}
                                        />
                                        <span className="user-dot" style={{ background: user.color }} />
                                        <span>{user.displayName || user.username}</span>
                                    </label>
                                ))
                            ) : (
                                <p className="no-connections">
                                    <Link to="/connections">
                                        {language === 'de' ? '+ Freunde einladen' : '+ Invite friends'}
                                    </Link>
                                </p>
                            )}
                        </div>
                    </div>
                )}

                <div className="calendar-main">
                    <div className="card">
                        <div className="calendar-grid">
                            {DAYS.map(day => (
                                <div key={day} className="calendar-day-header">{day}</div>
                            ))}
                            {calendarDays.map((day, idx) => {
                                const holiday = day ? holidayMap.get(day) : null
                                return (
                                    <div
                                        key={idx}
                                        className={`calendar-day ${day ? 'has-day' : 'empty'} ${day && isToday(day) ? 'today' : ''} ${holiday ? 'is-holiday' : ''}`}
                                    >
                                        {day && (
                                            <>
                                                <span className="day-number">{day}</span>
                                                {holiday && (
                                                    <span className="holiday-badge" title={holiday.name}>
                                                        {holiday.name.substring(0, 10)}...
                                                    </span>
                                                )}
                                                <div className="day-events">
                                                    {/* Events will be rendered here with user colors */}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <div className="shift-legend">
                        <h3>{t('calendar.shiftTypes')}</h3>
                        <div className="shift-list">
                            {Object.values(SHIFT_TYPES).map(shift => (
                                <span key={shift.id} className={`shift-badge ${shift.cssClass}`}>
                                    {shift.shortName} - {shiftTranslations[shift.id] || shift.name}
                                    {shift.duration > 0 && ` (${shift.duration}h)`}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
        .calendar-page { max-width: 1200px; margin: 0 auto; }
        .calendar-header { 
          display: flex; 
          justify-content: space-between; 
          align-items: center;
          flex-wrap: wrap;
          gap: var(--space-md);
          margin-bottom: var(--space-lg);
        }
        .calendar-nav { 
          display: flex; 
          align-items: center; 
          gap: var(--space-md); 
        }
        .calendar-nav h1 { 
          font-size: 1.5rem; 
          font-weight: 600;
          min-width: 200px;
          text-align: center;
        }
        .calendar-actions { 
          display: flex; 
          gap: var(--space-sm); 
          align-items: center;
          flex-wrap: wrap;
        }
        .state-select {
          width: auto;
          min-width: 180px;
        }
        .view-toggle { 
          display: flex; 
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
          padding: 2px;
        }
        
        .calendar-layout {
          display: flex;
          gap: var(--space-lg);
        }
        
        .merge-panel {
          width: 220px;
          flex-shrink: 0;
          padding: var(--space-md);
          height: fit-content;
        }
        .merge-panel h3 {
          font-size: 0.875rem;
          margin-bottom: var(--space-md);
          color: var(--text-secondary);
        }
        .merge-users {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }
        .merge-user {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          font-size: 0.875rem;
          cursor: pointer;
        }
        .merge-user input { width: 16px; height: 16px; }
        .user-dot {
          width: 12px;
          height: 12px;
          border-radius: var(--radius-full);
        }
        .no-connections {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .no-connections a {
          color: var(--accent-primary);
        }
        
        .calendar-main { flex: 1; min-width: 0; }
        
        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 1px;
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
          overflow: hidden;
        }
        .calendar-day-header {
          padding: var(--space-sm);
          text-align: center;
          font-weight: 600;
          font-size: 0.75rem;
          text-transform: uppercase;
          color: var(--text-secondary);
          background: var(--bg-secondary);
        }
        .calendar-day {
          min-height: 100px;
          padding: var(--space-sm);
          background: var(--bg-secondary);
          transition: background var(--transition-fast);
        }
        .calendar-day.empty { background: var(--bg-primary); }
        .calendar-day.has-day:hover { background: var(--bg-tertiary); cursor: pointer; }
        .calendar-day.today { 
          background: rgba(139, 92, 246, 0.1);
          border: 2px solid var(--accent-primary);
        }
        .day-number {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          font-weight: 500;
          border-radius: var(--radius-full);
        }
        .today .day-number {
          background: var(--accent-primary);
          color: white;
        }
        .day-events { margin-top: var(--space-xs); }
        .shift-legend { 
          margin-top: var(--space-lg);
          padding: var(--space-md);
          background: var(--bg-secondary);
          border-radius: var(--radius-lg);
        }
        .shift-legend h3 { margin-bottom: var(--space-sm); font-size: 0.875rem; }
        .shift-list { display: flex; gap: var(--space-md); flex-wrap: wrap; }
        @media (max-width: 768px) {
          .calendar-layout { flex-direction: column; }
          .merge-panel { width: 100%; }
          .calendar-day { min-height: 60px; }
          .holiday-badge { display: none; }
        }
      `}</style>
        </div>
    )
}
