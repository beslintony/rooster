import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useAuth } from '~/lib/auth'
import { useI18n } from '~/lib/i18n'

export const Route = createFileRoute('/register')({
  component: RegisterPage,
})

function RegisterPage() {
  const { language } = useI18n()
  const { register, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    email: '',
    username: '',
    displayName: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  if (isAuthenticated) {
    navigate({ to: '/' })
    return null
  }

  const updateForm = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError(language === 'de' ? 'Passwörter stimmen nicht überein' : 'Passwords do not match')
      return
    }

    if (form.password.length < 6) {
      setError(language === 'de' ? 'Passwort muss mindestens 6 Zeichen haben' : 'Password must be at least 6 characters')
      return
    }

    setIsLoading(true)

    const result = await register({
      email: form.email,
      username: form.username,
      password: form.password,
      displayName: form.displayName || form.username,
    })

    if (result.success) {
      navigate({ to: '/profile' })
    } else {
      setError(result.error || (language === 'de' ? 'Registrierung fehlgeschlagen' : 'Registration failed'))
    }

    setIsLoading(false)
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-logo">🐓</span>
          <h1>Rooster</h1>
          <p>{language === 'de' ? 'Erstelle dein Konto' : 'Create your account'}</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="input"
              value={form.email}
              onChange={(e) => updateForm('email', e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="username">{language === 'de' ? 'Benutzername' : 'Username'}</label>
            <input
              id="username"
              type="text"
              className="input"
              value={form.username}
              onChange={(e) => updateForm('username', e.target.value)}
              placeholder="maxmustermann"
              required
              pattern="[a-zA-Z0-9_]+"
            />
          </div>

          <div className="form-group">
            <label htmlFor="displayName">{language === 'de' ? 'Anzeigename' : 'Display Name'}</label>
            <input
              id="displayName"
              type="text"
              className="input"
              value={form.displayName}
              onChange={(e) => updateForm('displayName', e.target.value)}
              placeholder="Max Mustermann"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">{language === 'de' ? 'Passwort' : 'Password'}</label>
            <input
              id="password"
              type="password"
              className="input"
              value={form.password}
              onChange={(e) => updateForm('password', e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">{language === 'de' ? 'Passwort bestätigen' : 'Confirm Password'}</label>
            <input
              id="confirmPassword"
              type="password"
              className="input"
              value={form.confirmPassword}
              onChange={(e) => updateForm('confirmPassword', e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={isLoading}>
            {isLoading
              ? (language === 'de' ? 'Registrieren...' : 'Creating account...')
              : (language === 'de' ? 'Konto erstellen' : 'Create Account')}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {language === 'de' ? 'Bereits ein Konto?' : 'Already have an account?'}{' '}
            <Link to="/login">{language === 'de' ? 'Anmelden' : 'Sign In'}</Link>
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
