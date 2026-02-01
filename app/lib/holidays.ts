// German Federal States (Bundesländer)
export const GERMAN_STATES = {
    BW: 'Baden-Württemberg',
    BY: 'Bayern',
    BE: 'Berlin',
    BB: 'Brandenburg',
    HB: 'Bremen',
    HH: 'Hamburg',
    HE: 'Hessen',
    MV: 'Mecklenburg-Vorpommern',
    NI: 'Niedersachsen',
    NW: 'Nordrhein-Westfalen',
    RP: 'Rheinland-Pfalz',
    SL: 'Saarland',
    SN: 'Sachsen',
    ST: 'Sachsen-Anhalt',
    SH: 'Schleswig-Holstein',
    TH: 'Thüringen',
} as const

export type GermanState = keyof typeof GERMAN_STATES

// Fixed holidays (same date every year)
const FIXED_HOLIDAYS: Record<string, string> = {
    '01-01': 'Neujahr',
    '05-01': 'Tag der Arbeit',
    '10-03': 'Tag der Deutschen Einheit',
    '12-25': '1. Weihnachtstag',
    '12-26': '2. Weihnachtstag',
}

// State-specific fixed holidays
const STATE_HOLIDAYS: Record<string, GermanState[]> = {
    '01-06': ['BW', 'BY', 'ST'], // Heilige Drei Könige
    '03-08': ['BE'], // Internationaler Frauentag
    '08-15': ['BY', 'SL'], // Mariä Himmelfahrt
    '10-31': ['BB', 'HB', 'HH', 'MV', 'NI', 'SN', 'ST', 'SH', 'TH'], // Reformationstag
    '11-01': ['BW', 'BY', 'NW', 'RP', 'SL'], // Allerheiligen
}

// Calculate Easter Sunday for a given year (Anonymous Gregorian algorithm)
function calculateEaster(year: number): Date {
    const a = year % 19
    const b = Math.floor(year / 100)
    const c = year % 100
    const d = Math.floor(b / 4)
    const e = b % 4
    const f = Math.floor((b + 8) / 25)
    const g = Math.floor((b - f + 1) / 3)
    const h = (19 * a + b - d - g + 15) % 30
    const i = Math.floor(c / 4)
    const k = c % 4
    const l = (32 + 2 * e + 2 * i - h - k) % 7
    const m = Math.floor((a + 11 * h + 22 * l) / 451)
    const month = Math.floor((h + l - 7 * m + 114) / 31) - 1
    const day = ((h + l - 7 * m + 114) % 31) + 1
    return new Date(year, month, day)
}

// Add days to a date
function addDays(date: Date, days: number): Date {
    const result = new Date(date)
    result.setDate(result.getDate() + days)
    return result
}

// Format date as MM-DD
function formatMMDD(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${month}-${day}`
}

export interface Holiday {
    date: Date
    name: string
    isNationwide: boolean
}

// Get all holidays for a given year and state
export function getHolidays(year: number, state: GermanState): Holiday[] {
    const holidays: Holiday[] = []
    const easter = calculateEaster(year)

    // Fixed nationwide holidays
    for (const [mmdd, name] of Object.entries(FIXED_HOLIDAYS)) {
        const [month, day] = mmdd.split('-').map(Number)
        holidays.push({
            date: new Date(year, month - 1, day),
            name,
            isNationwide: true,
        })
    }

    // State-specific fixed holidays
    for (const [mmdd, states] of Object.entries(STATE_HOLIDAYS)) {
        if (states.includes(state)) {
            const [month, day] = mmdd.split('-').map(Number)
            const name = getHolidayName(mmdd)
            holidays.push({
                date: new Date(year, month - 1, day),
                name,
                isNationwide: false,
            })
        }
    }

    // Easter-based holidays (nationwide)
    const easterHolidays: [number, string][] = [
        [-2, 'Karfreitag'],
        [0, 'Ostersonntag'],
        [1, 'Ostermontag'],
        [39, 'Christi Himmelfahrt'],
        [49, 'Pfingstsonntag'],
        [50, 'Pfingstmontag'],
    ]

    for (const [offset, name] of easterHolidays) {
        holidays.push({
            date: addDays(easter, offset),
            name,
            isNationwide: true,
        })
    }

    // Fronleichnam (60 days after Easter) - state specific
    const fronleichnamStates: GermanState[] = ['BW', 'BY', 'HE', 'NW', 'RP', 'SL', 'SN', 'TH']
    if (fronleichnamStates.includes(state)) {
        holidays.push({
            date: addDays(easter, 60),
            name: 'Fronleichnam',
            isNationwide: false,
        })
    }

    // Buß- und Bettag (Wednesday before Nov 23) - Saxony only
    if (state === 'SN') {
        const nov23 = new Date(year, 10, 23)
        const dayOfWeek = nov23.getDay()
        const daysToWednesday = ((dayOfWeek + 7) - 3) % 7 || 7
        holidays.push({
            date: addDays(nov23, -daysToWednesday),
            name: 'Buß- und Bettag',
            isNationwide: false,
        })
    }

    // Sort by date
    holidays.sort((a, b) => a.date.getTime() - b.date.getTime())

    return holidays
}

function getHolidayName(mmdd: string): string {
    const names: Record<string, string> = {
        '01-06': 'Heilige Drei Könige',
        '03-08': 'Internationaler Frauentag',
        '08-15': 'Mariä Himmelfahrt',
        '10-31': 'Reformationstag',
        '11-01': 'Allerheiligen',
    }
    return names[mmdd] || 'Feiertag'
}

// Check if a date is a holiday
export function isHoliday(date: Date, state: GermanState): Holiday | null {
    const holidays = getHolidays(date.getFullYear(), state)
    const dateStr = formatMMDD(date)

    for (const holiday of holidays) {
        if (formatMMDD(holiday.date) === dateStr) {
            return holiday
        }
    }

    return null
}

// Get holidays for a month
export function getHolidaysForMonth(year: number, month: number, state: GermanState): Holiday[] {
    const holidays = getHolidays(year, state)
    return holidays.filter(h => h.date.getMonth() === month)
}
