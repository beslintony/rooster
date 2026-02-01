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

// Start server
app.listen(PORT, () => {
    console.log(`🐓 Rooster API running on port ${PORT}`)
})

export default app
