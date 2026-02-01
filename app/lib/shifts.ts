// German shift types for nurse schedules
export const SHIFT_TYPES = {
    FRUEH: {
        id: 'FRUEH',
        name: 'Frühdienst',
        shortName: 'F',
        startTime: '06:00',
        endTime: '14:00',
        duration: 8,
        color: '#22c55e', // green
        cssClass: 'shift-frueh',
    },
    SPAET: {
        id: 'SPAET',
        name: 'Spätdienst',
        shortName: 'S',
        startTime: '14:00',
        endTime: '22:00',
        duration: 8,
        color: '#f59e0b', // amber
        cssClass: 'shift-spaet',
    },
    NACHT: {
        id: 'NACHT',
        name: 'Nachtdienst',
        shortName: 'N',
        startTime: '22:00',
        endTime: '06:00',
        duration: 8,
        color: '#8b5cf6', // purple
        cssClass: 'shift-nacht',
    },
    TAG: {
        id: 'TAG',
        name: 'Tagdienst',
        shortName: 'T',
        startTime: '08:00',
        endTime: '16:00',
        duration: 8,
        color: '#06b6d4', // cyan
        cssClass: 'shift-tag',
    },
    BEREITSCHAFT: {
        id: 'BEREITSCHAFT',
        name: 'Bereitschaft',
        shortName: 'B',
        startTime: '00:00',
        endTime: '23:59',
        duration: 24,
        color: '#ef4444', // red
        cssClass: 'shift-bereitschaft',
    },
    KRANK: {
        id: 'KRANK',
        name: 'Krank',
        shortName: 'K',
        startTime: null,
        endTime: null,
        duration: 0,
        color: '#f43f5e', // rose
        cssClass: 'shift-krank',
    },
    URLAUB: {
        id: 'URLAUB',
        name: 'Urlaub',
        shortName: 'U',
        startTime: null,
        endTime: null,
        duration: 0,
        color: '#10b981', // emerald
        cssClass: 'shift-urlaub',
    },
    FREI: {
        id: 'FREI',
        name: 'Frei',
        shortName: '-',
        startTime: null,
        endTime: null,
        duration: 0,
        color: '#6b7280', // gray
        cssClass: 'shift-frei',
    },
    FLEXIBEL: {
        id: 'FLEXIBEL',
        name: 'Flexibel',
        shortName: 'FL',
        startTime: null,
        endTime: null,
        duration: 8, // default 8 hours, can be customized
        color: '#a855f7', // purple
        cssClass: 'shift-flexibel',
    },
} as const

export type ShiftTypeId = keyof typeof SHIFT_TYPES
export type ShiftType = (typeof SHIFT_TYPES)[ShiftTypeId]

// Office work types
export const OFFICE_TYPES = {
    OFFICE: {
        id: 'OFFICE',
        name: 'Büro',
        shortName: 'B',
        duration: 8,
        color: '#3b82f6', // blue
        cssClass: 'work-office',
    },
    HOME_OFFICE: {
        id: 'HOME_OFFICE',
        name: 'Home Office',
        shortName: 'HO',
        duration: 8,
        color: '#14b8a6', // teal
        cssClass: 'work-homeoffice',
    },
    FLEXIBEL: {
        id: 'FLEXIBEL',
        name: 'Flexibel',
        shortName: 'FL',
        duration: null, // flexible hours
        color: '#a855f7', // purple
        cssClass: 'work-flexibel',
    },
    URLAUB: {
        id: 'URLAUB',
        name: 'Urlaub',
        shortName: 'U',
        duration: 0,
        color: '#10b981', // emerald
        cssClass: 'work-urlaub',
    },
    KRANK: {
        id: 'KRANK',
        name: 'Krank',
        shortName: 'K',
        duration: 0,
        color: '#f43f5e', // rose
        cssClass: 'work-krank',
    },
    FREI: {
        id: 'FREI',
        name: 'Frei',
        shortName: '-',
        duration: 0,
        color: '#6b7280', // gray
        cssClass: 'work-frei',
    },
} as const
