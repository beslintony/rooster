import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'
import * as jwt from 'jsonwebtoken'

const prisma = new PrismaClient()
const app = express()
const PORT = process.env.PORT || 3001

// JWT secret - in production, use a proper secret from env
const JWT_SECRET = process.env.JWT_SECRET || 'rooster-dev-secret-change-in-production'

// Middleware
app.use(cors({ origin: true, credentials: true }))
app.use(express.json())
app.use(cookieParser())

// Auth middleware
interface AuthRequest extends express.Request {
    user?: { id: string; email: string; username: string }
}

const authMiddleware = (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
    const token = req.cookies.token
    if (!token) {
        return res.status(401).json({ error: 'Not authenticated' })
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; username: string }
        req.user = decoded
        next()
    } catch {
        return res.status(401).json({ error: 'Invalid token' })
    }
}

// ============ AUTH ROUTES ============

// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, username, password, displayName } = req.body

        if (!email || !username || !password) {
            return res.status(400).json({ error: 'Email, username, and password are required' })
        }

        // Check if user exists
        const existing = await prisma.user.findFirst({
            where: { OR: [{ email }, { username }] }
        })

        if (existing) {
            return res.status(400).json({
                error: existing.email === email ? 'Email already registered' : 'Username taken'
            })
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 12)

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                username,
                passwordHash,
                displayName: displayName || username,
            },
            select: {
                id: true,
                email: true,
                username: true,
                displayName: true,
                avatar: true,
                state: true,
                language: true,
                theme: true,
                occupationType: true,
            }
        })

        // Create JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email, username: user.username },
            JWT_SECRET,
            { expiresIn: '7d' }
        )

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        })

        res.json({ user: { ...user, watchedStates: [] } })
    } catch (error) {
        console.error('Register error:', error)
        res.status(500).json({ error: 'Registration failed' })
    }
})

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' })
        }

        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                username: true,
                passwordHash: true,
                displayName: true,
                avatar: true,
                state: true,
                language: true,
                theme: true,
                occupationType: true,
            }
        })

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' })
        }

        const valid = await bcrypt.compare(password, user.passwordHash)
        if (!valid) {
            return res.status(401).json({ error: 'Invalid credentials' })
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, username: user.username },
            JWT_SECRET,
            { expiresIn: '7d' }
        )

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        })

        const { passwordHash, ...userWithoutPassword } = user
        res.json({ user: { ...userWithoutPassword, watchedStates: [] } })
    } catch (error) {
        console.error('Login error:', error)
        res.status(500).json({ error: 'Login failed' })
    }
})

// Logout
app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token')
    res.json({ success: true })
})

// Get current user
app.get('/api/auth/me', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.id },
            select: {
                id: true,
                email: true,
                username: true,
                displayName: true,
                avatar: true,
                state: true,
                language: true,
                theme: true,
                occupationType: true,
            }
        })

        if (!user) {
            return res.status(404).json({ error: 'User not found' })
        }

        res.json({ user: { ...user, watchedStates: [] } })
    } catch (error) {
        console.error('Get user error:', error)
        res.status(500).json({ error: 'Failed to get user' })
    }
})

// ============ USER PROFILE ROUTES ============

// Update profile
app.put('/api/users/profile', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { displayName, state, language, theme, occupationType } = req.body

        const user = await prisma.user.update({
            where: { id: req.user!.id },
            data: {
                ...(displayName !== undefined && { displayName }),
                ...(state !== undefined && { state }),
                ...(language !== undefined && { language }),
                ...(theme !== undefined && { theme }),
                ...(occupationType !== undefined && { occupationType }),
            },
            select: {
                id: true,
                email: true,
                username: true,
                displayName: true,
                avatar: true,
                state: true,
                language: true,
                theme: true,
                occupationType: true,
            }
        })

        res.json({ user: { ...user, watchedStates: [] } })
    } catch (error) {
        console.error('Update profile error:', error)
        res.status(500).json({ error: 'Failed to update profile' })
    }
})

// ============ SHIFT TEMPLATES ============

// Get user's shift templates
app.get('/api/shift-templates', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const templates = await prisma.shiftTemplate.findMany({
            where: { userId: req.user!.id },
            orderBy: { createdAt: 'asc' }
        })
        res.json({ templates })
    } catch (error) {
        res.status(500).json({ error: 'Failed to get templates' })
    }
})

// Create shift template
app.post('/api/shift-templates', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { name, shortName, startTime, endTime, duration, color } = req.body

        const template = await prisma.shiftTemplate.create({
            data: {
                userId: req.user!.id,
                name,
                shortName,
                startTime,
                endTime,
                duration,
                color,
            }
        })

        res.json({ template })
    } catch (error) {
        res.status(500).json({ error: 'Failed to create template' })
    }
})

// ============ CONNECTIONS ============

// Get user's connections
app.get('/api/connections', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const connections = await prisma.connection.findMany({
            where: {
                OR: [
                    { senderId: req.user!.id, status: 'ACCEPTED' },
                    { receiverId: req.user!.id, status: 'ACCEPTED' }
                ]
            },
            include: {
                sender: { select: { id: true, username: true, displayName: true, avatar: true } },
                receiver: { select: { id: true, username: true, displayName: true, avatar: true } }
            }
        })

        // Get pending requests received
        const pending = await prisma.connection.findMany({
            where: { receiverId: req.user!.id, status: 'PENDING' },
            include: {
                sender: { select: { id: true, username: true, displayName: true, avatar: true } }
            }
        })

        res.json({ connections, pending })
    } catch (error) {
        res.status(500).json({ error: 'Failed to get connections' })
    }
})

// Send connection invite
app.post('/api/connections/invite', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { usernameOrEmail } = req.body

        const targetUser = await prisma.user.findFirst({
            where: {
                OR: [{ username: usernameOrEmail }, { email: usernameOrEmail }]
            }
        })

        if (!targetUser) {
            return res.status(404).json({ error: 'User not found' })
        }

        if (targetUser.id === req.user!.id) {
            return res.status(400).json({ error: 'Cannot connect to yourself' })
        }

        // Check if connection exists
        const existing = await prisma.connection.findFirst({
            where: {
                OR: [
                    { senderId: req.user!.id, receiverId: targetUser.id },
                    { senderId: targetUser.id, receiverId: req.user!.id }
                ]
            }
        })

        if (existing) {
            return res.status(400).json({ error: 'Connection already exists' })
        }

        const connection = await prisma.connection.create({
            data: {
                senderId: req.user!.id,
                receiverId: targetUser.id,
                status: 'PENDING',
                permissions: 'VIEW_CALENDAR'
            },
            include: {
                receiver: { select: { id: true, username: true, displayName: true, avatar: true } }
            }
        })

        res.json({ connection })
    } catch (error) {
        res.status(500).json({ error: 'Failed to send invite' })
    }
})

// Accept/reject connection
app.put('/api/connections/:id', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params
        const { status, permissions } = req.body

        const connection = await prisma.connection.findUnique({ where: { id } })

        if (!connection || connection.receiverId !== req.user!.id) {
            return res.status(404).json({ error: 'Connection not found' })
        }

        const updated = await prisma.connection.update({
            where: { id },
            data: {
                ...(status && { status }),
                ...(permissions && { permissions })
            }
        })

        res.json({ connection: updated })
    } catch (error) {
        res.status(500).json({ error: 'Failed to update connection' })
    }
})

// ============ PUBLIC HOLIDAYS API ============

// Fetch holidays from Nager.Date API
app.get('/api/holidays/:year/:state', async (req, res) => {
    try {
        const { year, state } = req.params

        // Nager.Date uses ISO country codes, Germany is DE
        const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/DE`)

        if (!response.ok) {
            return res.status(response.status).json({ error: 'Failed to fetch holidays' })
        }

        const allHolidays = await response.json()

        // Filter by state (counties in Nager.Date API)
        // State codes: BW, BY, BE, BB, HB, HH, HE, MV, NI, NW, RP, SL, SN, ST, SH, TH
        const stateMap: Record<string, string> = {
            'BW': 'DE-BW', 'BY': 'DE-BY', 'BE': 'DE-BE', 'BB': 'DE-BB',
            'HB': 'DE-HB', 'HH': 'DE-HH', 'HE': 'DE-HE', 'MV': 'DE-MV',
            'NI': 'DE-NI', 'NW': 'DE-NW', 'RP': 'DE-RP', 'SL': 'DE-SL',
            'SN': 'DE-SN', 'ST': 'DE-ST', 'SH': 'DE-SH', 'TH': 'DE-TH'
        }

        const stateCode = stateMap[state.toUpperCase()]

        const holidays = allHolidays.filter((h: any) => {
            // National holidays (no counties) apply everywhere
            if (!h.counties || h.counties.length === 0) return true
            // State-specific holidays
            return h.counties.includes(stateCode)
        })

        res.json({ holidays })
    } catch (error) {
        console.error('Holidays fetch error:', error)
        res.status(500).json({ error: 'Failed to fetch holidays' })
    }
})

// ============ SHIFTS ============

// Get shifts (optionally filter by range or user)
app.get('/api/shifts', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { start, end, userId } = req.query

        const where: any = { userId: req.user!.id }

        // If requesting other user's shifts (for team view)
        if (userId && userId !== 'me') {
            // Check connections/permissions (simplified for now: allow if connected)
            where.userId = userId
            where.visibility = { in: ['CONNECTIONS', 'PUBLIC'] }
        }

        if (start && end) {
            where.date = {
                gte: new Date(start as string),
                lte: new Date(end as string)
            }
        }

        const shifts = await prisma.shift.findMany({
            where,
            orderBy: { date: 'asc' }
        })

        res.json({ shifts })
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch shifts' })
    }
})

// Create shift
app.post('/api/shifts', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { date, type, notes } = req.body

        const shift = await prisma.shift.create({
            data: {
                userId: req.user!.id,
                date: new Date(date),
                shiftType: type,
                notes,
                visibility: 'CONNECTIONS'
            }
        })

        res.json({ shift })
    } catch (error) {
        console.error('Create shift error:', error)
        res.status(500).json({ error: 'Failed to create shift' })
    }
})

// Update shift
app.put('/api/shifts/:id', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params
        const { date, type, notes } = req.body

        const existing = await prisma.shift.findUnique({ where: { id } })
        if (!existing || existing.userId !== req.user!.id) {
            return res.status(403).json({ error: 'Not authorized' })
        }

        const shift = await prisma.shift.update({
            where: { id },
            data: {
                date: new Date(date),
                shiftType: type,
                notes
            }
        })

        res.json({ shift })
    } catch (error) {
        res.status(500).json({ error: 'Failed to update shift' })
    }
})

// Delete shift
app.delete('/api/shifts/:id', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params

        const existing = await prisma.shift.findUnique({ where: { id } })
        if (!existing || existing.userId !== req.user!.id) {
            return res.status(403).json({ error: 'Not authorized' })
        }

        await prisma.shift.delete({ where: { id } })
        res.json({ success: true })
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete shift' })
    }
})

// ============ TASKS ============

app.get('/api/tasks', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const tasks = await prisma.task.findMany({
            where: {
                OR: [
                    { createdById: req.user!.id },
                    { assigneeId: req.user!.id }
                ]
            },
            include: {
                assignee: { select: { id: true, username: true, displayName: true, avatar: true } }
            },
            orderBy: { createdAt: 'desc' }
        })
        res.json({ tasks })
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch tasks' })
    }
})

app.post('/api/tasks', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { title, assigneeId, dueDate, recurring } = req.body
        const task = await prisma.task.create({
            data: {
                title,
                assigneeId: assigneeId === 'me' ? req.user!.id : assigneeId,
                createdById: req.user!.id,
                dueDate: dueDate ? new Date(dueDate) : null,
                recurring
            },
            include: {
                assignee: { select: { id: true, username: true, displayName: true, avatar: true } }
            }
        })
        res.json({ task })
    } catch (error) {
        res.status(500).json({ error: 'Failed to create task' })
    }
})

app.put('/api/tasks/:id', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params
        const { completed, assigneeId } = req.body

        const task = await prisma.task.update({
            where: { id },
            data: {
                ...(completed !== undefined && { completed }),
                ...(assigneeId !== undefined && { assigneeId: assigneeId === 'me' ? req.user!.id : assigneeId }),
            },
            include: {
                assignee: { select: { id: true, username: true, displayName: true, avatar: true } }
            }
        })
        res.json({ task })
    } catch (error) {
        res.status(500).json({ error: 'Failed to update task' })
    }
})

app.delete('/api/tasks/:id', authMiddleware, async (req: AuthRequest, res) => {
    try {
        await prisma.task.delete({ where: { id: req.params.id } })
        res.json({ success: true })
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete task' })
    }
})

// ============ SHOPPING ============

app.get('/api/shopping', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const items = await prisma.shoppingItem.findMany({
            where: {
                // Simplified: show items added by user or where user is in shared list
                // For MVP, just showing items created by user or generally available
                OR: [
                    { addedById: req.user!.id },
                    // In a real app, join with SharedList
                ]
            },
            orderBy: { createdAt: 'desc' }
        })
        res.json({ items })
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch items' })
    }
})

app.post('/api/shopping', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { name, quantity, category, priority } = req.body
        const item = await prisma.shoppingItem.create({
            data: {
                name,
                quantity: quantity || 1,
                category,
                priority,
                addedById: req.user!.id,
            }
        })
        res.json({ item })
    } catch (error) {
        res.status(500).json({ error: 'Failed to add item' })
    }
})

app.put('/api/shopping/:id', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params
        const { purchased } = req.body
        const item = await prisma.shoppingItem.update({
            where: { id },
            data: { purchased }
        })
        res.json({ item })
    } catch (error) {
        res.status(500).json({ error: 'Failed to update item' })
    }
})

app.delete('/api/shopping/:id', authMiddleware, async (req: AuthRequest, res) => {
    try {
        await prisma.shoppingItem.delete({ where: { id: req.params.id } })
        res.json({ success: true })
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete item' })
    }
})

// ============ DASHBOARD STATS ============

app.get('/api/dashboard/stats', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id
        const now = new Date()
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - now.getDay()) // Sunday
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 7)

        const [
            shiftsThisWeek,
            pendingTasks,
            shoppingItems,
            vacations
        ] = await Promise.all([
            prisma.shift.count({
                where: {
                    userId,
                    date: { gte: weekStart, lt: weekEnd }
                }
            }),
            prisma.task.count({
                where: {
                    OR: [{ assigneeId: userId }, { assigneeId: null, createdById: userId }],
                    completed: false
                }
            }),
            prisma.shoppingItem.count({
                where: { purchased: false } // Global for MVP
            }),
            prisma.vacation.count({
                where: {
                    userId,
                    startDate: { gte: now }
                }
            })
        ])

        res.json({
            shiftsThisWeek,
            pendingTasks,
            shoppingItems,
            daysUntilVacation: vacations > 0 ? 5 : 0 // Mock calculation for now
        })

    } catch (error) {
        console.error('Stats error:', error)
        res.status(500).json({ error: 'Failed to fetch stats' })
    }
})

// ============ SHIFT TEMPLATES ============

app.get('/api/users/shift-templates', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const templates = await prisma.shiftTemplate.findMany({
            where: { userId: req.user!.id },
            orderBy: { name: 'asc' }
        })
        res.json({ templates })
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch templates' })
    }
})

app.post('/api/users/shift-templates', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { name, shortName, startTime, endTime, duration, color } = req.body
        const template = await prisma.shiftTemplate.create({
            data: {
                userId: req.user!.id,
                name,
                shortName,
                startTime,
                endTime,
                duration: duration ? parseInt(duration) : null,
                color
            }
        })
        res.json({ template })
    } catch (error) {
        console.error('Create template error:', error)
        res.status(500).json({ error: 'Failed to create template' })
    }
})

app.put('/api/users/shift-templates/:id', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params
        const { name, shortName, startTime, endTime, duration, color } = req.body

        const existing = await prisma.shiftTemplate.findUnique({ where: { id } })
        if (!existing || existing.userId !== req.user!.id) {
            return res.status(403).json({ error: 'Not authorized' })
        }

        const template = await prisma.shiftTemplate.update({
            where: { id },
            data: {
                name,
                shortName,
                startTime,
                endTime,
                duration: duration ? parseInt(duration) : null,
                color
            }
        })
        res.json({ template })
    } catch (error) {
        res.status(500).json({ error: 'Failed to update template' })
    }
})

app.delete('/api/users/shift-templates/:id', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params
        const existing = await prisma.shiftTemplate.findUnique({ where: { id } })
        if (!existing || existing.userId !== req.user!.id) {
            return res.status(403).json({ error: 'Not authorized' })
        }

        await prisma.shiftTemplate.delete({ where: { id } })
        res.json({ success: true })
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete template' })
    }
})

// Start server
app.listen(PORT, () => {
    console.log(`🐓 Rooster API running on port ${PORT}`)
})

export default app
