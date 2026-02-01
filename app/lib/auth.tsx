import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

interface User {
    id: string
    email: string
    username: string
    displayName: string | null
    avatar: string | null
    state: string | null
    watchedStates: string[]
    language: string
    theme: string
    occupationType: string | null
}

interface AuthContextType {
    user: User | null
    isLoading: boolean
    isAuthenticated: boolean
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
    register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>
    logout: () => Promise<void>
    updateUser: (data: Partial<User>) => void
}

interface RegisterData {
    email: string
    username: string
    password: string
    displayName?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // Check for existing session on mount
        checkAuth()
    }, [])

    const checkAuth = async () => {
        try {
            const res = await fetch('/api/auth/me', { credentials: 'include' })
            if (res.ok) {
                const data = await res.json()
                setUser(data.user)
            }
        } catch (error) {
            console.error('Auth check failed:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const login = async (email: string, password: string) => {
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email, password }),
            })
            const data = await res.json()

            if (res.ok) {
                setUser(data.user)
                return { success: true }
            }
            return { success: false, error: data.error || 'Login failed' }
        } catch (error) {
            return { success: false, error: 'Network error' }
        }
    }

    const register = async (data: RegisterData) => {
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(data),
            })
            const result = await res.json()

            if (res.ok) {
                setUser(result.user)
                return { success: true }
            }
            return { success: false, error: result.error || 'Registration failed' }
        } catch (error) {
            return { success: false, error: 'Network error' }
        }
    }

    const logout = async () => {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include',
            })
        } finally {
            setUser(null)
        }
    }

    const updateUser = (data: Partial<User>) => {
        if (user) {
            setUser({ ...user, ...data })
        }
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: !!user,
                login,
                register,
                logout,
                updateUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

// Protected route wrapper component
export function RequireAuth({ children }: { children: ReactNode }) {
    const { isAuthenticated, isLoading } = useAuth()

    if (isLoading) {
        return (
            <div className="auth-loading">
                <div className="spinner" />
                <style>{`
          .auth-loading {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 50vh;
          }
          .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid var(--bg-tertiary);
            border-top-color: var(--accent-primary);
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
            </div>
        )
    }

    if (!isAuthenticated) {
        // Redirect to login
        window.location.href = '/login'
        return null
    }

    return <>{children}</>
}
