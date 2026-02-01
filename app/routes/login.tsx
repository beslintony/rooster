import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useAuth } from '~/lib/auth'
import { useI18n } from '~/lib/i18n'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const { t, language } = useI18n()
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Redirect if already logged in
  if (isAuthenticated) {
    navigate({ to: '/' })
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    const result = await login(email, password)

    if (result.success) {
      navigate({ to: '/' })
    } else {
      setError(result.error || (language === 'de' ? 'Anmeldung fehlgeschlagen' : 'Login failed'))
    }

    setIsLoading(false)
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-logo">🐓</span>
          <h1>Rooster</h1>
          <p>{language === 'de' ? 'Melde dich bei deinem Konto an' : 'Sign in to your account'}</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">{language === 'de' ? 'Passwort' : 'Password'}</label>
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={isLoading}>
            {isLoading
              ? (language === 'de' ? 'Anmelden...' : 'Signing in...')
              : (language === 'de' ? 'Anmelden' : 'Sign In')}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {language === 'de' ? 'Noch kein Konto?' : "Don't have an account?"}{' '}
            <Link to="/register">{language === 'de' ? 'Registrieren' : 'Register'}</Link>
          </p>
        </div>
      </div>

      <style>{`
        .auth-page {
          min-height: calc(100vh - 80px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--space-lg);
        }
        .auth-card {
          width: 100%;
          max-width: 400px;
          background: var(--bg-secondary);
          border-radius: var(--radius-xl);
          padding: var(--space-xl);
          box-shadow: var(--shadow-xl);
        }
        .auth-header {
          text-align: center;
          margin-bottom: var(--space-xl);
        }
        .auth-logo {
          font-size: 3rem;
          display: block;
          margin-bottom: var(--space-sm);
        }
        .auth-header h1 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: var(--space-xs);
        }
        .auth-header p {
          color: var(--text-secondary);
          font-size: 0.875rem;
        }
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: var(--space-xs);
        }
        .form-group label {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-secondary);
        }
        .error-message {
          padding: var(--space-sm) var(--space-md);
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border-radius: var(--radius-md);
          font-size: 0.875rem;
        }
        .btn-full {
          width: 100%;
          padding: var(--space-md);
          font-size: 1rem;
        }
        .auth-footer {
          margin-top: var(--space-lg);
          text-align: center;
          font-size: 0.875rem;
          color: var(--text-secondary);
        }
        .auth-footer a {
          color: var(--accent-primary);
          font-weight: 500;
        }
      `}</style>
    </div>
  )
}
