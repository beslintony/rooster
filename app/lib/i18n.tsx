import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type Language = 'de' | 'en'

// Translation keys
export const translations = {
    de: {
        // Navigation
        'nav.dashboard': 'Dashboard',
        'nav.calendar': 'Kalender',
        'nav.shopping': 'Einkaufen',
        'nav.tasks': 'Aufgaben',

        // Common
        'common.today': 'Heute',
        'common.month': 'Monat',
        'common.week': 'Woche',
        'common.add': 'Hinzufügen',
        'common.edit': 'Bearbeiten',
        'common.delete': 'Löschen',
        'common.save': 'Speichern',
        'common.cancel': 'Abbrechen',
        'common.viewAll': 'Alle anzeigen',

        // Dashboard
        'dashboard.greeting.morning': 'Guten Morgen',
        'dashboard.greeting.afternoon': 'Guten Tag',
        'dashboard.greeting.evening': 'Guten Abend',
        'dashboard.shiftsThisWeek': 'Dienste diese Woche',
        'dashboard.pendingTasks': 'Offene Aufgaben',
        'dashboard.shoppingItems': 'Einkäufe',
        'dashboard.daysUntilVacation': 'Tage bis Urlaub',
        'dashboard.todaySchedule': 'Heutiger Zeitplan',
        'dashboard.tasksDueSoon': 'Aufgaben fällig',
        'dashboard.shoppingList': 'Einkaufsliste',
        'dashboard.upcomingVacations': 'Kommender Urlaub',
        'dashboard.planVacation': 'Urlaub planen',
        'dashboard.noEvents': 'Keine Termine heute',
        'dashboard.allCaughtUp': 'Alles erledigt!',
        'dashboard.shoppingEmpty': 'Einkaufsliste leer',
        'dashboard.noVacations': 'Kein Urlaub geplant',

        // Calendar
        'calendar.addShift': '+ Dienst',
        'calendar.shiftTypes': 'Dienstarten (Pflege)',

        // Shift types
        'shift.frueh': 'Frühdienst',
        'shift.spaet': 'Spätdienst',
        'shift.nacht': 'Nachtdienst',
        'shift.tag': 'Tagdienst',
        'shift.bereitschaft': 'Bereitschaft',
        'shift.krank': 'Krank',
        'shift.urlaub': 'Urlaub',
        'shift.frei': 'Frei',
        'shift.flexibel': 'Flexibel',

        // Days
        'day.sun': 'So',
        'day.mon': 'Mo',
        'day.tue': 'Di',
        'day.wed': 'Mi',
        'day.thu': 'Do',
        'day.fri': 'Fr',
        'day.sat': 'Sa',

        // Months
        'month.january': 'Januar',
        'month.february': 'Februar',
        'month.march': 'März',
        'month.april': 'April',
        'month.may': 'Mai',
        'month.june': 'Juni',
        'month.july': 'Juli',
        'month.august': 'August',
        'month.september': 'September',
        'month.october': 'Oktober',
        'month.november': 'November',
        'month.december': 'Dezember',

        // Shopping
        'shopping.title': 'Einkaufsliste',
        'shopping.addItem': 'Artikel hinzufügen...',
        'shopping.purchased': 'Gekauft',
        'shopping.wishlist': 'Wunschliste',
        'shopping.emptyList': 'Deine Einkaufsliste ist leer',

        // Tasks
        'tasks.title': 'Aufgaben',
        'tasks.addTask': 'Aufgabe hinzufügen...',
        'tasks.todo': 'Zu erledigen',
        'tasks.completed': 'Erledigt',
        'tasks.weeklyResponsibilities': 'Wöchentliche Aufgaben',
    },
    en: {
        // Navigation
        'nav.dashboard': 'Dashboard',
        'nav.calendar': 'Calendar',
        'nav.shopping': 'Shopping',
        'nav.tasks': 'Tasks',

        // Common
        'common.today': 'Today',
        'common.month': 'Month',
        'common.week': 'Week',
        'common.add': 'Add',
        'common.edit': 'Edit',
        'common.delete': 'Delete',
        'common.save': 'Save',
        'common.cancel': 'Cancel',
        'common.viewAll': 'View All',

        // Dashboard
        'dashboard.greeting.morning': 'Good morning',
        'dashboard.greeting.afternoon': 'Good afternoon',
        'dashboard.greeting.evening': 'Good evening',
        'dashboard.shiftsThisWeek': 'Shifts This Week',
        'dashboard.pendingTasks': 'Pending Tasks',
        'dashboard.shoppingItems': 'Shopping Items',
        'dashboard.daysUntilVacation': 'Days Until Vacation',
        'dashboard.todaySchedule': "Today's Schedule",
        'dashboard.tasksDueSoon': 'Tasks Due Soon',
        'dashboard.shoppingList': 'Shopping List',
        'dashboard.upcomingVacations': 'Upcoming Vacations',
        'dashboard.planVacation': 'Plan Vacation',
        'dashboard.noEvents': 'No events scheduled for today',
        'dashboard.allCaughtUp': 'All caught up!',
        'dashboard.shoppingEmpty': 'Shopping list is empty',
        'dashboard.noVacations': 'No vacations planned',

        // Calendar
        'calendar.addShift': '+ Add Shift',
        'calendar.shiftTypes': 'Shift Types (Nursing)',

        // Shift types
        'shift.frueh': 'Early Shift',
        'shift.spaet': 'Late Shift',
        'shift.nacht': 'Night Shift',
        'shift.tag': 'Day Shift',
        'shift.bereitschaft': 'On-Call',
        'shift.krank': 'Sick',
        'shift.urlaub': 'Vacation',
        'shift.frei': 'Off',
        'shift.flexibel': 'Flexible',

        // Days
        'day.sun': 'Sun',
        'day.mon': 'Mon',
        'day.tue': 'Tue',
        'day.wed': 'Wed',
        'day.thu': 'Thu',
        'day.fri': 'Fri',
        'day.sat': 'Sat',

        // Months
        'month.january': 'January',
        'month.february': 'February',
        'month.march': 'March',
        'month.april': 'April',
        'month.may': 'May',
        'month.june': 'June',
        'month.july': 'July',
        'month.august': 'August',
        'month.september': 'September',
        'month.october': 'October',
        'month.november': 'November',
        'month.december': 'December',

        // Shopping
        'shopping.title': 'Shopping List',
        'shopping.addItem': 'Add item...',
        'shopping.purchased': 'Purchased',
        'shopping.wishlist': 'Wishlist',
        'shopping.emptyList': 'Your shopping list is empty',

        // Tasks
        'tasks.title': 'Tasks',
        'tasks.addTask': 'Add a task...',
        'tasks.todo': 'To Do',
        'tasks.completed': 'Completed',
        'tasks.weeklyResponsibilities': 'Weekly Responsibilities',
    },
} as const

type TranslationKey = keyof typeof translations.de

interface I18nContextType {
    language: Language
    setLanguage: (lang: Language) => void
    t: (key: TranslationKey) => string
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

export function I18nProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Language>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('rooster-language') as Language
            if (saved) return saved
            // Detect browser language
            const browserLang = navigator.language.toLowerCase()
            return browserLang.startsWith('de') ? 'de' : 'en'
        }
        return 'de'
    })

    useEffect(() => {
        localStorage.setItem('rooster-language', language)
        document.documentElement.lang = language
    }, [language])

    const setLanguage = (lang: Language) => {
        setLanguageState(lang)
    }

    const t = (key: TranslationKey): string => {
        return translations[language][key] || key
    }

    return (
        <I18nContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </I18nContext.Provider>
    )
}

export function useI18n() {
    const context = useContext(I18nContext)
    if (!context) {
        throw new Error('useI18n must be used within an I18nProvider')
    }
    return context
}

// Helper arrays for calendar
export function getMonths(language: Language): string[] {
    const t = translations[language]
    return [
        t['month.january'], t['month.february'], t['month.march'],
        t['month.april'], t['month.may'], t['month.june'],
        t['month.july'], t['month.august'], t['month.september'],
        t['month.october'], t['month.november'], t['month.december'],
    ]
}

export function getDays(language: Language): string[] {
    const t = translations[language]
    return [
        t['day.sun'], t['day.mon'], t['day.tue'], t['day.wed'],
        t['day.thu'], t['day.fri'], t['day.sat'],
    ]
}
