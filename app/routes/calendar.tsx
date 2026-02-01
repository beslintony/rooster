import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { SHIFT_TYPES } from '~/lib/shifts'
import { GERMAN_STATES, type GermanState } from '~/lib/holidays'
import { useI18n, getMonths, getDays } from '~/lib/i18n'
import { useAuth } from '~/lib/auth'

export const Route = createFileRoute('/calendar')({
    component: CalendarPage,
})

type ViewMode = 'month' | 'week'

interface Shift {
    id: string
    date: Date
    type: string // Front-end uses 'type', backend uses 'shiftType'. We map it.
    notes?: string
    userId: string
    visibility?: string
}

interface ShiftTemplate {
    id: string
    name: string
    shortName: string
    startTime: string | null
    endTime: string | null
    duration: number | null
    color: string
    isDefault?: boolean
    cssClass?: string
}

interface ConnectedUser {
    id: string
    username: string
    displayName: string | null
    avatar: string | null
    color: string
}

interface Holiday {
    date: string // YYYY-MM-DD
    name: string
    localName: string
    countryCode: string
    fixed: boolean
    global: boolean
    counties: string[] | null
    launchYear: number | null
    types: string[]
    applicableStates: string[] // 'ALL' or list of state codes like 'NW', 'BY'
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
    const [selectedVisibility, setSelectedVisibility] = useState('CONNECTIONS')
    const [editingShiftId, setEditingShiftId] = useState<string | null>(null)
    const [shifts, setShifts] = useState<Shift[]>([])
    const [customTemplates, setCustomTemplates] = useState<ShiftTemplate[]>([])
    const [holidays, setHolidays] = useState<Holiday[]>([])

    const DAYS = getDays(language)
    const MONTHS = getMonths(language)

    // Sync state with user profile
    useEffect(() => {
        if (user?.state && GERMAN_STATES[user.state as GermanState]) {
            setSelectedState(user.state as GermanState)
        }
    }, [user])

    // Fetch data
    useEffect(() => {
        if (isAuthenticated) {
            fetchConnectedUsers()
            fetchConnectedUsers()
            fetchShifts()
            fetchTemplates()
            fetchHolidays()
        }
    }, [isAuthenticated, user?.state, user?.watchedStates, currentDate.getFullYear()]) // Re-fetch on year change

    const fetchHolidays = async () => {
        if (!user) return
        try {
            const states = [user.state || 'NW']
            if (user.watchedStates && Array.isArray(user.watchedStates)) {
                user.watchedStates.forEach(s => {
                    if (!states.includes(s)) states.push(s)
                })
            }
            // Add selected state from dropdown if it differs? 
            // The dropdown 'selectedState' seems to only be local UI state for calculation in previous version.
            // Let's stick to user preferences for now.

            const year = currentDate.getFullYear()
            const res = await fetch(`/api/holidays/batch?year=${year}&states=${states.join(',')}`)
            if (res.ok) {
                const data = await res.json()
                setHolidays(data.holidays)
            }
        } catch (e) { console.error('Failed to fetch holidays:', e) }
    }

    const fetchTemplates = async () => {
        try {
            const res = await fetch('/api/users/shift-templates', { credentials: 'include' })
            if (res.ok) {
                const data = await res.json()
                setCustomTemplates(data.templates)
            }
        } catch (e) { console.error(e) }
    }

    const fetchShifts = async () => {
        try {
            // Fetching all shifts for now for simplicity. 
            // In a real app, we'd filter by range (e.g. current view).
            const res = await fetch('/api/shifts', { credentials: 'include' })
            if (res.ok) {
                const data = await res.json()
                // Map backend shiftType to frontend type and string date to Date object
                const parsedShifts = data.shifts.map((s: any) => ({
                    ...s,
                    date: new Date(s.date),
                    type: s.shiftType
                }))
                setShifts(parsedShifts)
            }
        } catch (error) {
            console.error('Failed to fetch shifts:', error)
        }
    }

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

    // Map holidays to days
    // holidays array has String dates YYYY-MM-DD. We need to match precise dates.
    const getHolidayForDate = (date: Date) => {
        // Construct YYYY-MM-DD from local date to avoid timezone shifts from toISOString()
        const offset = date.getTimezoneOffset()
        const localDate = new Date(date.getTime() - (offset * 60 * 1000))
        const dateStr = localDate.toISOString().split('T')[0]

        // OR simpler manual construction:
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const localDateStr = `${year}-${month}-${day}`

        // Filter holidays that fall on this date
        const matches = holidays.filter(h => h.date === localDateStr)
        if (matches.length === 0) return null

        // Return matching holidays. If multiple, distinct them or join names?
        // Let's return the most relevant one (National > Primary State > Watched State)
        // Or all of them? 
        // For UI, let's just return matches
        return matches
    }

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
        setSelectedVisibility('CONNECTIONS')
        setEditingShiftId(null)
        setShowShiftModal(true)
    }

    const editShift = (shift: Shift) => {
        setSelectedDate(shift.date)
        setSelectedShiftType(shift.type)
        setSelectedVisibility(shift.visibility || 'CONNECTIONS')
        setEditingShiftId(shift.id)
        setShowShiftModal(true)
    }

    const saveShift = async () => {
        if (!selectedDate || !selectedShiftType) return

        try {
            if (editingShiftId) {
                // Update existing shift
                const res = await fetch(`/api/shifts/${editingShiftId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        date: selectedDate,
                        type: selectedShiftType,
                        notes: '', // Add notes support later
                        visibility: selectedVisibility
                    })
                })

                if (res.ok) {
                    const updated = await res.json()
                    // Update state locally
                    setShifts(shifts.map(s => s.id === editingShiftId ? {
                        ...s,
                        date: new Date(updated.shift.date),
                        type: updated.shift.shiftType,
                        visibility: updated.shift.visibility
                    } : s))
                }
            } else {
                // Add new shift
                const res = await fetch('/api/shifts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        date: selectedDate,
                        type: selectedShiftType,
                        notes: '',
                        visibility: selectedVisibility
                    })
                })

                if (res.ok) {
                    const created = await res.json()
                    const newShift: Shift = {
                        id: created.shift.id,
                        date: new Date(created.shift.date),
                        type: created.shift.shiftType,
                        userId: 'me', // or created.shift.userId
                        visibility: created.shift.visibility
                    }
                    setShifts([...shifts, newShift])
                }
            }

            setShowShiftModal(false)
            setSelectedDate(null)
            setEditingShiftId(null)
        } catch (error) {
            console.error('Failed to save shift:', error)
        }
    }

    const deleteShift = async () => {
        if (editingShiftId) {
            try {
                const res = await fetch(`/api/shifts/${editingShiftId}`, {
                    method: 'DELETE'
                })

                if (res.ok) {
                    setShifts(shifts.filter(s => s.id !== editingShiftId))
                    setShowShiftModal(false)
                    setSelectedDate(null)
                    setEditingShiftId(null)
                }
            } catch (error) {
                console.error('Failed to delete shift:', error)
            }
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

    // Merge defaults with custom templates
    const getAllShiftTypes = () => {
        const defaults = Object.values(SHIFT_TYPES).map(s => ({
            ...s,
            isDefault: true
        }))
        // Custom templates override defaults if needed, or append
        // We'll just append for now.
        // Map custom templates to match shape if needed
        const custom = customTemplates.map(t => ({
            ...t,
            id: t.id, // Custom ID
            // use custom color logic later
        }))

        return [...defaults, ...custom]
    }
    const allShiftTypes = getAllShiftTypes()

    const getShiftInfo = (typeId: string) => {
        return allShiftTypes.find(s => s.id === typeId) || SHIFT_TYPES[typeId as keyof typeof SHIFT_TYPES]
    }

    // Header Date Label
    const headerLabel = viewMode === 'month'
        ? `${MONTHS[month]} ${year}`
        : `${currentDate.getDate()}. ${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`
    // Approximate week label, improve if needed

    return (
        <div className="calendar-page">
            {/* Main Navigation Row */}
            <div className="calendar-header">
                <div className="calendar-nav">
                    <button onClick={prev} className="btn btn-ghost btn-icon">←</button>
                    <h1>{headerLabel}</h1>
                    <button onClick={next} className="btn btn-ghost btn-icon">→</button>
                </div>
                <div className="calendar-controls">
                    <button onClick={goToday} className="btn btn-secondary btn-sm">{t('common.today')}</button>
                    <div className="view-toggle">
                        <button
                            onClick={() => setViewMode('month')}
                            className={`toggle-btn ${viewMode === 'month' ? 'active' : ''}`}
                        >
                            {t('common.month')}
                        </button>
                        <button
                            onClick={() => setViewMode('week')}
                            className={`toggle-btn ${viewMode === 'week' ? 'active' : ''}`}
                        >
                            {t('common.week')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Secondary Controls Row (collapsible on mobile) */}
            <div className="calendar-toolbar">
                <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value as GermanState)}
                    className="input state-select"
                >
                    {Object.entries(GERMAN_STATES).map(([code, name]) => (
                        <option key={code} value={code}>{name}</option>
                    ))}
                </select>
                {isAuthenticated && (
                    <button
                        onClick={() => setShowTeamPanel(!showTeamPanel)}
                        className={`btn ${showTeamPanel ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                    >
                        👥 {language === 'de' ? 'Team' : 'Team'}
                    </button>
                )}
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
                                const dayHolidays = date ? getHolidayForDate(date) : null
                                const isHoliday = dayHolidays && dayHolidays.length > 0

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
                                                {dayHolidays && dayHolidays.map((h, i) => (
                                                    <span key={i} className="holiday-badge" title={`${h.name} (${h.applicableStates.join(', ')})`}>
                                                        {h.applicableStates.includes('ALL') ? '🎉' : '📍'} {h.name.substring(0, 15)}
                                                    </span>
                                                ))}
                                                <div className="day-shifts">
                                                    {dayShifts.map(shift => {
                                                        const shiftInfo = getShiftInfo(shift.type)
                                                        // Handle null checking for start/end time
                                                        const timeLabel = shiftInfo?.startTime && shiftInfo?.endTime
                                                            ? `${shiftInfo.startTime}-${shiftInfo.endTime}`
                                                            : null

                                                        const style = shiftInfo?.cssClass ? {} : { backgroundColor: shiftInfo?.color || '#22c55e', color: '#fff' }

                                                        return (
                                                            <div
                                                                key={shift.id}
                                                                className={`shift-chip ${shiftInfo?.cssClass || ''}`}
                                                                style={style}
                                                                onClick={(e) => { e.stopPropagation(); editShift(shift) }}
                                                                title={timeLabel ? `${shiftInfo?.name} (${timeLabel})` : shiftInfo?.name}
                                                            >
                                                                <span className="shift-chip-code">{shiftInfo?.shortName || shift.type}</span>
                                                                {shift.visibility === 'PRIVATE' && <span className="shift-private-icon">🔒</span>}
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

                    {/* Collapsible Legend - hidden by default on mobile */}
                    <details className="shift-legend" open>
                        <summary className="legend-toggle">
                            <span className="legend-title">{t('calendar.shiftTypes')}</span>
                            <span className="legend-chevron">▼</span>
                        </summary>
                        <div className="shift-list">
                            {allShiftTypes.map(shift => {
                                const timeLabel = shift.startTime ? `${shift.startTime}-${shift.endTime}` : ''
                                const style = shift.cssClass ? {} : { backgroundColor: shift.color, color: '#fff' }
                                return (
                                    <span key={shift.id} className={`shift-badge ${shift.cssClass || ''}`} style={style}>
                                        <strong>{shift.shortName}</strong> {timeLabel}
                                    </span>
                                )
                            })}
                        </div>
                    </details>
                </div>
            </div>

            {/* Shift Creation/Edit Modal */}
            {showShiftModal && selectedDate && (
                <div className="modal-overlay" onClick={() => setShowShiftModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>
                                {editingShiftId
                                    ? (language === 'de' ? 'Schicht bearbeiten' : 'Edit Shift')
                                    : (language === 'de' ? 'Schicht hinzufügen' : 'Add Shift')
                                }
                            </h3>
                            <button className="btn-close" onClick={() => setShowShiftModal(false)}>×</button>
                        </div>

                        <div className="modal-body">
                            <div className="selected-date-display">
                                <span className="calendar-icon">📅</span>
                                {selectedDate.getDate()}. {MONTHS[selectedDate.getMonth()]} {selectedDate.getFullYear()}
                            </div>

                            <div className="section-label">{language === 'de' ? 'Schichtart' : 'Shift Type'}</div>
                            <div className="shift-options">
                                {allShiftTypes.map(shift => {
                                    const isActive = selectedShiftType === shift.id
                                    const customStyle = !shift.cssClass ? {
                                        borderColor: isActive ? shift.color : 'var(--bg-tertiary)',
                                        backgroundColor: isActive ? `${shift.color}15` : 'var(--bg-primary)'
                                    } : {}

                                    return (
                                        <button
                                            key={shift.id}
                                            onClick={() => setSelectedShiftType(shift.id)}
                                            className={`shift-option ${shift.cssClass || ''} ${isActive ? 'selected' : ''}`}
                                            style={customStyle}
                                        >
                                            <span className="shift-short" style={!shift.cssClass ? { color: shift.color, fontWeight: 'bold' } : {}}>{shift.shortName}</span>
                                            <div className="shift-details">
                                                <span className="shift-name">{shiftTranslations[shift.id] || shift.name}</span>
                                                {shift.startTime ? (
                                                    <span className="shift-time">{shift.startTime} - {shift.endTime}</span>
                                                ) : (
                                                    shift.duration === 0 ? <span className="shift-duration">All Day</span> : null
                                                )}
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>

                            <div className="section-label">{language === 'de' ? 'Sichtbarkeit' : 'Visibility'}</div>
                            <div className="visibility-selector">
                                <div className="toggle-group">
                                    <button
                                        onClick={() => setSelectedVisibility('PRIVATE')}
                                        className={`toggle-option ${selectedVisibility === 'PRIVATE' ? 'active' : ''}`}
                                    >
                                        <span className="icon">🔒</span>
                                        <span className="label">{language === 'de' ? 'Privat' : 'Private'}</span>
                                    </button>
                                    <button
                                        onClick={() => setSelectedVisibility('CONNECTIONS')}
                                        className={`toggle-option ${selectedVisibility === 'CONNECTIONS' ? 'active' : ''}`}
                                    >
                                        <span className="icon">👥</span>
                                        <span className="label">{language === 'de' ? 'Freunde' : 'Friends'}</span>
                                    </button>
                                    <button
                                        onClick={() => setSelectedVisibility('PUBLIC')}
                                        className={`toggle-option ${selectedVisibility === 'PUBLIC' ? 'active' : ''}`}
                                    >
                                        <span className="icon">🌍</span>
                                        <span className="label">{language === 'de' ? 'Öffentlich' : 'Public'}</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            {editingShiftId && (
                                <button
                                    className="btn btn-ghost btn-delete"
                                    onClick={deleteShift}
                                >
                                    {language === 'de' ? 'Löschen' : 'Delete'}
                                </button>
                            )}
                            <div className="spacer" />
                            <button className="btn btn-secondary" onClick={() => setShowShiftModal(false)}>
                                {language === 'de' ? 'Abbrechen' : 'Cancel'}
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={saveShift}
                                disabled={!selectedShiftType}
                            >
                                {editingShiftId
                                    ? (language === 'de' ? 'Speichern' : 'Save Changes')
                                    : (language === 'de' ? 'Schicht erstellen' : 'Create Shift')
                                }
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .calendar-page { max-width: 1200px; margin: 0 auto; }
                
                /* Header Layout */
                .calendar-header {
                    display: flex; justify-content: space-between; align-items: center;
                    gap: var(--space-md); margin-bottom: var(--space-md);
                    flex-wrap: wrap;
                }
                .calendar-nav { 
                    display: flex; align-items: center; gap: var(--space-sm);
                }
                .calendar-nav h1 { 
                    font-size: 1.5rem; font-weight: 700; min-width: 200px; text-align: center;
                    background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
                    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
                }
                .btn-icon { 
                    width: 40px; height: 40px; padding: 0; font-size: 1.25rem;
                    border-radius: var(--radius-full);
                }
                .calendar-controls { 
                    display: flex; align-items: center; gap: var(--space-sm);
                }
                
                /* View Toggle */
                .view-toggle {
                    display: flex; background: var(--bg-tertiary); padding: 3px;
                    border-radius: var(--radius-lg); gap: 2px;
                }
                .toggle-btn {
                    padding: 6px 12px; border: none; background: transparent;
                    border-radius: var(--radius-md); font-size: 0.8rem; font-weight: 500;
                    color: var(--text-secondary); cursor: pointer; transition: all 0.2s;
                }
                .toggle-btn:hover { color: var(--text-primary); }
                .toggle-btn.active { 
                    background: var(--accent-primary); color: white;
                    box-shadow: 0 2px 4px rgba(139, 92, 246, 0.3);
                }
                
                /* Toolbar */
                .calendar-toolbar {
                    display: flex; align-items: center; gap: var(--space-sm);
                    margin-bottom: var(--space-md); flex-wrap: wrap;
                }
                .state-select {
                    max-width: 180px; font-size: 0.85rem;
                    padding: 8px 12px;
                }
                
                /* Layout */
                .calendar-layout { display: flex; gap: var(--space-lg); }
                .calendar-main { flex: 1; min-width: 0; }
                .team-panel { width: 220px; flex-shrink: 0; }
                .team-users { display: flex; flex-direction: column; gap: var(--space-sm); margin-top: var(--space-md); }
                .team-user { display: flex; align-items: center; gap: var(--space-sm); cursor: pointer; }
                .user-dot { width: 12px; height: 12px; border-radius: var(--radius-full); }

                /* Calendar Grid */
                .calendar-grid {
                    display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px;
                    background: var(--bg-tertiary); border-radius: var(--radius-lg); overflow: hidden;
                    border: 1px solid var(--bg-tertiary);
                }
                .calendar-day-header {
                    padding: 10px; text-align: center; font-weight: 600;
                    font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em;
                    color: var(--text-secondary); background: var(--bg-secondary);
                }
                .calendar-day {
                    min-height: 110px; padding: 8px;
                    background: var(--bg-secondary); cursor: pointer;
                    transition: all var(--transition-fast);
                    display: flex; flex-direction: column;
                }
                .calendar-day.empty { background: var(--bg-primary); cursor: default; opacity: 0.5; }
                .calendar-day.has-day:hover { background: var(--bg-tertiary); }
                .calendar-day.today { background: rgba(139, 92, 246, 0.08); }
                .calendar-day.is-holiday { background: rgba(245, 158, 11, 0.05); }
                
                .day-number {
                    display: inline-flex; align-items: center; justify-content: center;
                    width: 28px; height: 28px; font-weight: 600; font-size: 0.9rem;
                    border-radius: var(--radius-full); margin-bottom: 6px;
                }
                .today .day-number { 
                    background: var(--accent-primary); color: white; 
                    box-shadow: 0 2px 8px rgba(139, 92, 246, 0.4); 
                }
                .holiday-badge {
                    display: inline-block; font-size: 0.6rem; color: var(--accent-warning);
                    background: rgba(245, 158, 11, 0.15); padding: 2px 6px; border-radius: 4px;
                    margin-bottom: 4px; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                }
                .day-shifts { display: flex; flex-direction: column; gap: 4px; flex: 1; }
                .shift-chip {
                    padding: 5px 8px; border-radius: 6px; font-size: 0.75rem;
                    font-weight: 600; cursor: pointer; transition: all 0.15s;
                    display: flex; justify-content: space-between; align-items: center;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }
                .shift-chip:hover { transform: translateY(-1px); box-shadow: 0 3px 6px rgba(0,0,0,0.15); }

                /* Modal - now uses global styles, just add calendar-specific overrides */
                .selected-date-display {
                    display: flex; align-items: center; gap: var(--space-sm);
                    font-size: 1.1rem; font-weight: 500; color: var(--text-primary);
                    padding: var(--space-sm) 0; border-bottom: 1px dashed var(--bg-tertiary);
                }
                .section-label { 
                    font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); 
                    text-transform: uppercase; letter-spacing: 0.05em; margin-top: var(--space-md);
                }
                .shift-options { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-sm); margin-top: var(--space-sm); }
                .shift-option {
                    display: flex; align-items: center; gap: var(--space-sm);
                    padding: 12px; border-radius: var(--radius-md);
                    border: 2px solid var(--bg-tertiary); background: var(--bg-primary);
                    cursor: pointer; transition: all 0.2s; text-align: left;
                }
                .shift-option:hover { border-color: var(--accent-primary); background: rgba(139,92,246,0.05); }
                .shift-option.selected { border-color: var(--accent-primary); background: rgba(139,92,246,0.1); }
                .shift-short {
                    width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
                    background: var(--bg-secondary); border-radius: var(--radius-full);
                    font-weight: 700; font-size: 0.85rem; flex-shrink: 0;
                }
                .shift-details { display: flex; flex-direction: column; min-width: 0; }
                .shift-name { font-weight: 600; font-size: 0.85rem; }
                .shift-time { font-size: 0.7rem; color: var(--text-secondary); }
                
                /* Visibility Toggle */
                .visibility-selector { margin-top: var(--space-sm); }
                .toggle-group { display: flex; background: var(--bg-primary); padding: 4px; border-radius: var(--radius-lg); border: 1px solid var(--bg-tertiary); }
                .toggle-option {
                    flex: 1; display: flex; align-items: center; justify-content: center; gap: 4px;
                    padding: 8px; border: none; background: none; border-radius: var(--radius-md);
                    cursor: pointer; font-size: 0.8rem; color: var(--text-secondary); transition: all 0.2s;
                }
                .toggle-option .icon { font-size: 1rem; }
                .toggle-option .label { font-size: 0.7rem; }
                .toggle-option.active { background: var(--bg-secondary); color: var(--text-primary); box-shadow: 0 1px 3px rgba(0,0,0,0.1); font-weight: 600; }
                
                .spacer { flex: 1; }
                .btn-delete { color: var(--accent-danger); }
                .btn-delete:hover { background: rgba(239, 68, 68, 0.1); }
                
                /* Collapsible Legend */
                .shift-legend {
                    margin-top: var(--space-md);
                    background: var(--bg-secondary);
                    border: 1px solid var(--bg-tertiary);
                    border-radius: var(--radius-md);
                    overflow: hidden;
                }
                .legend-toggle {
                    display: flex; align-items: center; justify-content: space-between;
                    padding: var(--space-sm) var(--space-md);
                    cursor: pointer; user-select: none;
                    background: var(--bg-tertiary);
                    list-style: none;
                }
                .legend-toggle::-webkit-details-marker { display: none; }
                .legend-title { font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); }
                .legend-chevron { 
                    font-size: 0.6rem; color: var(--text-muted);
                    transition: transform 0.2s;
                }
                .shift-legend[open] .legend-chevron { transform: rotate(180deg); }
                .shift-list {
                    display: flex; flex-wrap: wrap; gap: 6px;
                    padding: var(--space-sm) var(--space-md);
                }
                .shift-badge {
                    display: inline-flex; align-items: center; gap: 4px;
                    padding: 3px 8px; border-radius: 4px;
                    font-size: 0.7rem; white-space: nowrap;
                }

                /* Mobile Responsive */
                @media (max-width: 768px) {
                    .calendar-page { padding-bottom: 0; }
                    
                    .calendar-header { 
                        flex-direction: column; align-items: stretch; 
                        gap: var(--space-xs); margin-bottom: var(--space-xs);
                        padding: 0 var(--space-xs);
                    }
                    .calendar-nav { justify-content: center; gap: var(--space-xs); }
                    .calendar-nav h1 { font-size: 1.1rem; min-width: auto; }
                    .btn-icon { width: 36px; height: 36px; font-size: 1rem; }
                    .calendar-controls { justify-content: center; gap: var(--space-xs); }
                    .view-toggle { padding: 2px; }
                    .toggle-btn { padding: 4px 10px; font-size: 0.7rem; }
                    
                    .calendar-toolbar { display: none; }
                    .calendar-layout { flex-direction: column; gap: var(--space-sm); }
                    .team-panel { width: 100%; }
                    
                    .calendar-grid { border-radius: var(--radius-sm); }
                    .calendar-day-header { padding: 4px 2px; font-size: 0.55rem; letter-spacing: 0; }
                    .calendar-day { min-height: 56px; padding: 2px; }
                    .day-number { width: 18px; height: 18px; font-size: 0.65rem; margin-bottom: 2px; }
                    .holiday-badge { display: none; } /* Hide on mobile to save space */
                    .shift-chip { 
                        padding: 2px 4px; font-size: 0.6rem; 
                        justify-content: center; border-radius: 3px;
                    }
                    .shift-chip-time { display: none; }
                    
                    /* Collapsed legend on mobile */
                    .shift-legend { margin-top: var(--space-sm); }
                    .shift-legend:not([open]) { margin-bottom: 0; }
                    .legend-toggle { padding: var(--space-xs) var(--space-sm); }
                    .legend-title { font-size: 0.7rem; }
                    .shift-list { padding: var(--space-xs) var(--space-sm); gap: 4px; }
                    .shift-badge { padding: 2px 6px; font-size: 0.6rem; }
                    
                    .shift-options { grid-template-columns: 1fr; }
                    .shift-option { padding: 10px; }
                }
            `}</style>
        </div>
    )
}
