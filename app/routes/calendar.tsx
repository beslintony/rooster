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

interface Shift {
    id: string
    date: Date
    type: string
    userId: string
}

interface ConnectedUser {
    id: string
    username: string
    displayName: string | null
    avatar: string | null
    color: string
}

const USER_COLORS = [
    '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#ec4899', '#14b8a6', '#f97316'
]

function CalendarPage() {
    const { t, language } = useI18n()
    const { user, isAuthenticated } = useAuth()
    const [currentDate, setCurrentDate] = useState(new Date())
    const [viewMode, setViewMode] = useState<ViewMode>('month')
    const [selectedState, setSelectedState] = useState<GermanState>('NW')
    const [showTeamPanel, setShowTeamPanel] = useState(false)
    const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([])
    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set(['me']))

    // Shift creation/editing state
    const [showShiftModal, setShowShiftModal] = useState(false)
    const [selectedDay, setSelectedDay] = useState<number | null>(null)
    const [selectedShiftType, setSelectedShiftType] = useState('')
    const [editingShiftId, setEditingShiftId] = useState<string | null>(null)
    const [shifts, setShifts] = useState<Shift[]>([])

    const DAYS = getDays(language)
    const MONTHS = getMonths(language)

    // Sync state with user profile
    useEffect(() => {
        if (user?.state && GERMAN_STATES[user.state as GermanState]) {
            setSelectedState(user.state as GermanState)
        }
    }, [user])

    // Fetch connections
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
                    const u = conn.sender.id === user?.id ? conn.receiver : conn.sender
                    return { ...u, color: USER_COLORS[idx % USER_COLORS.length] }
                })
                setConnectedUsers(users)
            }
        } catch (error) {
            console.error('Failed to fetch connections:', error)
        }
    }

    // Navigation Logic
    const prev = () => {
        if (viewMode === 'month') {
            setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
        } else {
            const newDate = new Date(currentDate)
            newDate.setDate(currentDate.getDate() - 7)
            setCurrentDate(newDate)
        }
    }

    const next = () => {
        if (viewMode === 'month') {
            setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
        } else {
            const newDate = new Date(currentDate)
            newDate.setDate(currentDate.getDate() + 7)
            setCurrentDate(newDate)
        }
    }

    const goToday = () => setCurrentDate(new Date())

    // Grid Calculation
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth() // 0-based

    // Calendar days array
    let calendarDays: (Date | null)[] = []

    if (viewMode === 'month') {
        const firstDayOfMonth = new Date(year, month, 1)
        const lastDayOfMonth = new Date(year, month + 1, 0)
        const startOffset = firstDayOfMonth.getDay() // 0 = Sunday
        const daysInMonth = lastDayOfMonth.getDate()

        // Pad empty days at start
        for (let i = 0; i < startOffset; i++) {
            calendarDays.push(null)
        }
        // Days
        for (let day = 1; day <= daysInMonth; day++) {
            calendarDays.push(new Date(year, month, day))
        }
    } else {
        // Week View
        // Find start of week (Sunday)
        const dayOfWeek = currentDate.getDay() // 0-6
        const startOfWeek = new Date(currentDate)
        startOfWeek.setDate(currentDate.getDate() - dayOfWeek)

        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek)
            day.setDate(startOfWeek.getDate() + i)
            calendarDays.push(day)
        }
    }

    // Pre-calculate holidays for the visible range
    // Simple optimization: just get holidays for the month of the first visible day
    // (In week view crossing months this might miss some, but acceptable for now)
    const displayMonth = calendarDays.find(d => d !== null)?.getMonth() ?? month
    const displayYear = calendarDays.find(d => d !== null)?.getFullYear() ?? year
    const holidays = getHolidaysForMonth(displayYear, displayMonth, selectedState)
    const holidayMap = new Map(holidays.map(h => [h.date.getDate(), h]))

    // Also check next month if week overlaps? 
    // Let's just stick to simpler month-based holiday fetch for now or fetch for both if split.
    // Ideally getHolidays should handle range, but existing helper is by month.

    const today = new Date()
    const isToday = (date: Date) =>
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()

    const toggleUser = (userId: string) => {
        const newSelected = new Set(selectedUsers)
        if (newSelected.has(userId)) {
            newSelected.delete(userId)
        } else {
            newSelected.add(userId)
        }
        setSelectedUsers(newSelected)
    }

    const openShiftModal = (date: Date) => {
        setSelectedDay(date.getDate()) // This relies on month-context, need to be careful with crossing months
        // Ideally modal should take full Date object now
        // But for now let's keep it simple, assumes logic holds for "selectedDay" (it's display only mostly)

        // Quick fix: update component to work with full dates or just pass the date to modal
        // But existing addShift needs year/month from state. 
        // Let's update addShift to use the passed date.

        // Wait, let's refactor modal to work with the specific selected Date object
        // to support Week View crossing months properly.
        setSelectedDay(date.getDate()) // kept for modal display if needed
        // Store the actual date we clicked on
        // We can just use a new state: selectedDateFull
        // But let's hack it: temporarily set currentDate to the clicked date's month/year for context?
        // No, better to refactor properly.

        // Changing state: selectedDay -> selectedDate: Date | null
    }

    // REFACTOR: Use selectedDate instead of selectedDay (number)
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)

    const handleDayClick = (date: Date) => {
        setSelectedDate(date)
        setSelectedShiftType('')
        setEditingShiftId(null)
        setShowShiftModal(true)
    }

    const editShift = (shift: Shift) => {
        setSelectedDate(shift.date)
        setSelectedShiftType(shift.type)
        setEditingShiftId(shift.id)
        setShowShiftModal(true)
    }

    const saveShift = () => {
        if (!selectedDate || !selectedShiftType) return

        if (editingShiftId) {
            // Update existing shift
            setShifts(shifts.map(s => s.id === editingShiftId ? {
                ...s,
                date: selectedDate, // potentially moved?
                type: selectedShiftType
            } : s))
        } else {
            // Add new shift
            const newShift: Shift = {
                id: Date.now().toString(),
                date: selectedDate,
                type: selectedShiftType,
                userId: 'me',
            }
            setShifts([...shifts, newShift])
        }

        setShowShiftModal(false)
        setSelectedDate(null)
        setEditingShiftId(null)
    }

    const deleteShift = () => {
        if (editingShiftId) {
            setShifts(shifts.filter(s => s.id !== editingShiftId))
            setShowShiftModal(false)
            setSelectedDate(null)
            setEditingShiftId(null)
        }
    }

    const getShiftsForDate = (date: Date) => {
        return shifts.filter(s =>
            s.date.getFullYear() === date.getFullYear() &&
            s.date.getMonth() === date.getMonth() &&
            s.date.getDate() === date.getDate()
        )
    }

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

    // Header Date Label
    const headerLabel = viewMode === 'month'
        ? `${MONTHS[month]} ${year}`
        : `${currentDate.getDate()}. ${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`
    // Approximate week label, improve if needed

    return (
        <div className="calendar-page">
            <div className="calendar-header">
                <div className="calendar-nav">
                    <button onClick={prev} className="btn btn-ghost">←</button>
                    <h1>{headerLabel}</h1>
                    <button onClick={next} className="btn btn-ghost">→</button>
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
                            onClick={() => setShowTeamPanel(!showTeamPanel)}
                            className={`btn ${showTeamPanel ? 'btn-primary' : 'btn-ghost'}`}
                            title={language === 'de' ? 'Teamkalender anzeigen' : 'Show Team Calendar'}
                        >
                            👥 {language === 'de' ? 'Team' : 'Team'}
                        </button>
                    )}
                </div>
            </div>

            <div className="calendar-layout">
                {/* Team Panel */}
                {showTeamPanel && (
                    <div className="team-panel card">
                        <h3>👥 {language === 'de' ? 'Team-Kalender' : 'Team Calendar'}</h3>
                        <div className="team-users">
                            <label className="team-user">
                                <input
                                    type="checkbox"
                                    checked={selectedUsers.has('me')}
                                    onChange={() => toggleUser('me')}
                                />
                                <span className="user-dot" style={{ background: '#8b5cf6' }} />
                                <span>{language === 'de' ? 'Mein Kalender' : 'My Calendar'}</span>
                            </label>
                            {connectedUsers.map(u => (
                                <label key={u.id} className="team-user">
                                    <input
                                        type="checkbox"
                                        checked={selectedUsers.has(u.id)}
                                        onChange={() => toggleUser(u.id)}
                                    />
                                    <span className="user-dot" style={{ background: u.color }} />
                                    <span>{u.displayName || u.username}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                <div className="calendar-main">
                    <div className="card">
                        <div className={`calendar-grid ${viewMode === 'week' ? 'view-week' : ''}`}>
                            {DAYS.map(day => (
                                <div key={day} className="calendar-day-header">{day}</div>
                            ))}
                            {calendarDays.map((date, idx) => {
                                const dayShifts = date ? getShiftsForDate(date) : []
                                const isHoliday = date ? holidayMap.has(date.getDate()) : false
                                const holiday = date ? holidayMap.get(date.getDate()) : null

                                return (
                                    <div
                                        key={idx}
                                        className={`calendar-day ${date ? 'has-day' : 'empty'} ${date && isToday(date) ? 'today' : ''} ${isHoliday ? 'is-holiday' : ''}`}
                                        onClick={() => date && handleDayClick(date)}
                                        style={viewMode === 'week' ? { minHeight: '300px' } : {}}
                                    >
                                        {date && (
                                            <>
                                                <span className="day-number">{date.getDate()}</span>
                                                {holiday && (
                                                    <span className="holiday-badge" title={holiday.name}>
                                                        🎉 {holiday.name.substring(0, 15)}
                                                    </span>
                                                )}
                                                <div className="day-shifts">
                                                    {dayShifts.map(shift => {
                                                        const shiftInfo = SHIFT_TYPES[shift.type]
                                                        const timeLabel = shiftInfo?.startTime
                                                            ? `${shiftInfo.startTime}-${shiftInfo.endTime}`
                                                            : null
                                                        return (
                                                            <div
                                                                key={shift.id}
                                                                className={`shift-chip ${shiftInfo?.cssClass || ''}`}
                                                                onClick={(e) => { e.stopPropagation(); editShift(shift) }}
                                                                title={timeLabel ? `${shiftInfo?.name} (${timeLabel})` : shiftInfo?.name}
                                                            >
                                                                <span className="shift-chip-code">{shiftInfo?.shortName || shift.type}</span>
                                                                {timeLabel && <span className="shift-chip-time">{timeLabel}</span>}
                                                            </div>
                                                        )
                                                    })}
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
                            {Object.values(SHIFT_TYPES).map(shift => {
                                const timeLabel = shift.startTime ? `(${shift.startTime} - ${shift.endTime})` : ''
                                return (
                                    <span key={shift.id} className={`shift-badge ${shift.cssClass}`}>
                                        <strong>{shift.shortName}</strong> {shiftTranslations[shift.id] || shift.name} {timeLabel}
                                    </span>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Shift Creation/Edit Modal */}
            {showShiftModal && selectedDate && (
                <div className="modal-overlay" onClick={() => setShowShiftModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>
                            {editingShiftId
                                ? (language === 'de' ? 'Schicht bearbeiten' : 'Edit Shift')
                                : (language === 'de' ? 'Schicht hinzufügen' : 'Add Shift')
                            }
                            <span className="modal-date">
                                {selectedDate.getDate()}. {MONTHS[selectedDate.getMonth()]} {selectedDate.getFullYear()}
                            </span>
                        </h3>
                        <div className="shift-options">
                            {Object.values(SHIFT_TYPES).map(shift => {
                                const isActive = selectedShiftType === shift.id
                                return (
                                    <button
                                        key={shift.id}
                                        onClick={() => setSelectedShiftType(shift.id)}
                                        className={`shift-option ${shift.cssClass} ${isActive ? 'selected' : ''}`}
                                    >
                                        <span className="shift-short">{shift.shortName}</span>
                                        <span className="shift-name">{shiftTranslations[shift.id] || shift.name}</span>
                                        {shift.startTime ? (
                                            <span className="shift-time">{shift.startTime} - {shift.endTime}</span>
                                        ) : (
                                            shift.duration > 0 && <span className="shift-duration">{shift.duration}h</span> || <span className="shift-duration">-</span>
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                        <div className="modal-actions">
                            {editingShiftId && (
                                <button
                                    className="btn btn-ghost btn-delete"
                                    onClick={deleteShift}
                                >
                                    {language === 'de' ? '🗑️ Löschen' : '🗑️ Delete'}
                                </button>
                            )}
                            <div className="spacer" style={{ flex: 1 }} />
                            <button className="btn btn-ghost" onClick={() => setShowShiftModal(false)}>
                                {language === 'de' ? 'Abbrechen' : 'Cancel'}
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={saveShift}
                                disabled={!selectedShiftType}
                            >
                                {editingShiftId
                                    ? (language === 'de' ? 'Speichern' : 'Save')
                                    : (language === 'de' ? 'Hinzufügen' : 'Add')
                                }
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        .calendar-page { max-width: 1200px; margin: 0 auto; }
        .calendar-header { 
          display: flex; justify-content: space-between; align-items: center;
          flex-wrap: wrap; gap: var(--space-md); margin-bottom: var(--space-lg);
        }
        .calendar-nav { display: flex; align-items: center; gap: var(--space-md); }
        .calendar-nav h1 { font-size: 1.5rem; font-weight: 600; min-width: 240px; text-align: center; }
        .calendar-actions { display: flex; gap: var(--space-sm); align-items: center; flex-wrap: wrap; }
        .state-select { width: auto; min-width: 180px; }
        .view-toggle { display: flex; background: var(--bg-tertiary); border-radius: var(--radius-md); padding: 2px; }
        
        .calendar-layout { display: flex; flex-direction: column; gap: var(--space-lg); }
        @media (min-width: 768px) {
           .calendar-layout { flex-direction: row; }
        }
        
        .team-panel { width: 100%; padding: var(--space-md); height: fit-content; }
        @media (min-width: 768px) {
           .team-panel { width: 240px; flex-shrink: 0; }
        }
        .team-users { display: flex; gap: var(--space-md); flex-wrap: wrap; }
        @media (min-width: 768px) {
           .team-users { flex-direction: column; gap: var(--space-sm); }
        }
        .team-user { display: flex; align-items: center; gap: var(--space-sm); font-size: 0.875rem; cursor: pointer; }
        .team-user input { width: 16px; height: 16px; }
        .user-dot { width: 12px; height: 12px; border-radius: var(--radius-full); }
        
        .calendar-main { flex: 1; min-width: 0; }
        
        .calendar-grid {
          display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px;
          background: var(--bg-tertiary); border-radius: var(--radius-md); overflow: hidden;
        }
        .calendar-day-header {
          padding: var(--space-sm); text-align: center; font-weight: 600;
          font-size: 0.75rem; text-transform: uppercase; color: var(--text-secondary);
          background: var(--bg-secondary);
        }
        .calendar-day {
          min-height: 100px; padding: var(--space-xs);
          background: var(--bg-secondary); cursor: pointer;
          transition: background var(--transition-fast);
        }
        .calendar-day.empty { background: var(--bg-primary); cursor: default; }
        .calendar-day.has-day:hover { background: var(--bg-tertiary); }
        .calendar-day.today { background: rgba(139, 92, 246, 0.1); border: 2px solid var(--accent-primary); }
        .day-number {
          display: inline-flex; align-items: center; justify-content: center;
          width: 24px; height: 24px; font-weight: 500; font-size: 0.875rem;
          border-radius: var(--radius-full);
        }
        .today .day-number { background: var(--accent-primary); color: white; }
        .holiday-badge {
          display: block; font-size: 0.625rem; color: var(--accent-success);
          margin-top: var(--space-xs); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .day-shifts { margin-top: var(--space-xs); display: flex; flex-direction: column; gap: 4px; }
        .shift-chip {
          padding: 3px 6px; border-radius: var(--radius-sm); font-size: 0.75rem;
          font-weight: 600; cursor: pointer; transition: opacity 0.2s;
          display: flex; justify-content: space-between; align-items: center;
          overflow: hidden;
        }
        .shift-chip:hover { opacity: 0.9; transform: scale(1.02); }
        .shift-chip-time { 
          font-size: 0.65rem; font-weight: 400; margin-left: 4px; opacity: 0.9; 
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        
        .shift-legend { margin-top: var(--space-lg); padding: var(--space-md); background: var(--bg-secondary); border-radius: var(--radius-lg); }
        .shift-legend h3 { margin-bottom: var(--space-sm); font-size: 0.875rem; }
        .shift-list { display: flex; gap: var(--space-sm); flex-wrap: wrap; }
        .shift-badge { white-space: nowrap; }
        
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.6);
          display: flex; align-items: center; justify-content: center; z-index: 100;
        }
        .modal {
          background: var(--bg-secondary); border-radius: var(--radius-xl);
          padding: var(--space-xl); min-width: 420px; max-width: 95vw;
        }
        .modal h3 { margin-bottom: var(--space-lg); display: flex; justify-content: space-between; align-items: center; }
        .shift-options {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-sm);
          margin-bottom: var(--space-lg);
        }
        .shift-option {
          display: flex; flex-direction: column; align-items: center; gap: 2px;
          padding: var(--space-md); border-radius: var(--radius-md);
          border: 2px solid transparent; cursor: pointer; transition: all 0.2s;
        }
        .shift-option:hover { transform: scale(1.02); }
        .shift-option.selected { border-color: var(--accent-primary); box-shadow: 0 0 0 2px rgba(139,92,246,0.3); }
        
        @media (max-width: 768px) {
          .team-panel { width: 100%; }
          .calendar-day { min-height: 70px; }
          .shift-options { grid-template-columns: repeat(3, 1fr); }
          .shift-chip-time { display: none; } 
        }
      `}</style>
        </div>
    )
}
