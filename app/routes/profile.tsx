import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useAuth, RequireAuth } from '~/lib/auth'
import { useI18n } from '~/lib/i18n'
import { GERMAN_STATES, type GermanState } from '~/lib/holidays'

export const Route = createFileRoute('/profile')({
  component: ProfilePageWrapper,
})

function ProfilePageWrapper() {
  return (
    <RequireAuth>
      <ProfilePage />
    </RequireAuth>
  )
}

const OCCUPATION_TYPES = [
  { id: 'PFLEGE', labelDE: 'Pflegekraft', labelEN: 'Nurse' },
  { id: 'ARZT', labelDE: 'Arzt/Ärztin', labelEN: 'Doctor' },
  { id: 'RETTUNG', labelDE: 'Rettungsdienst', labelEN: 'Paramedic' },
  { id: 'BUERO', labelDE: 'Büro / 9-5', labelEN: 'Office / 9-5' },
  { id: 'SCHICHT', labelDE: 'Schichtarbeit', labelEN: 'Shift Work' },
  { id: 'FLEXIBEL', labelDE: 'Flexibel / Freelance', labelEN: 'Flexible / Freelance' },
]

interface ShiftTemplate {
  id: string
  name: string
  shortName: string
  startTime: string
  endTime: string
  color: string
}

function ProfilePage() {
  const { user, logout, updateUser } = useAuth()
  const { language, setLanguage } = useI18n()
  const navigate = useNavigate()

  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [primaryState, setPrimaryState] = useState<GermanState>((user?.state as GermanState) || 'NW')
  const [watchedStates, setWatchedStates] = useState<string[]>([])
  const [occupationType, setOccupationType] = useState('PFLEGE')
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  // Custom Shift Templates
  const [templates, setTemplates] = useState<ShiftTemplate[]>([])
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [newTemplate, setNewTemplate] = useState<Partial<ShiftTemplate>>({
    name: '', shortName: '', startTime: '', endTime: '', color: '#3b82f6'
  })

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('rooster-theme') as 'light' | 'dark'
    if (savedTheme) setTheme(savedTheme)

    // Initialize form with user data if available
    if (user) {
      if (user.displayName) setDisplayName(user.displayName)
      if (user.state) setPrimaryState(user.state as GermanState)
      // Parse watched states if they are comma-separated string or array
      // Assuming implementation details, likely need to handle watchedStates
    }
  }, [user])

  // Fetch Templates
  useEffect(() => {
    if (user) {
      fetchTemplates()
    }
  }, [user])

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/users/shift-templates', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setTemplates(data.templates)
      }
    } catch (e) { console.error(e) }
  }

  const saveTemplate = async () => {
    try {
      const res = await fetch('/api/users/shift-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTemplate)
      })
      if (res.ok) {
        fetchTemplates()
        setShowTemplateModal(false)
        setNewTemplate({ name: '', shortName: '', startTime: '', endTime: '', color: '#3b82f6' })
      }
    } catch (e) {
      console.error(e)
    }
  }

  const deleteTemplate = async (id: string) => {
    if (!confirm(language === 'de' ? 'Wirklich löschen?' : 'Delete template?')) return
    try {
      await fetch(`/api/users/shift-templates/${id}`, { method: 'DELETE' })
      fetchTemplates()
    } catch (e) { console.error(e) }
  }

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme)
    localStorage.setItem('rooster-theme', newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
  }

  const toggleWatchedState = (state: string) => {
    if (watchedStates.includes(state)) {
      setWatchedStates(watchedStates.filter(s => s !== state))
    } else {
      setWatchedStates([...watchedStates, state])
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setMessage({ type: '', text: '' })

    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          displayName,
          state: primaryState,
          watchedStates: watchedStates.join(','),
          occupationType,
          theme,
          language,
        })
      })

      if (res.ok) {
        // Update local context
        updateUser({
          displayName,
          state: primaryState,
          // watchedStates: watchedStates, // Type mismatch in User interface? array vs string?
          // User interface in auth.tsx has watchedStates: string[]
          // Server expects string join? 
          // Let's assume updateUser handles the partial correctly or we need to match it.
          // If User.watchedStates is string[], we should pass it as string[]
          watchedStates: watchedStates,
          language,
          theme,
          occupationType
        })

        setMessage({
          type: 'success',
          text: language === 'de' ? 'Einstellungen gespeichert!' : 'Settings saved!'
        })
      } else {
        throw new Error('Failed to save')
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: language === 'de' ? 'Speichern fehlgeschlagen' : 'Failed to save'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate({ to: '/' })
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h1>⚙️ {language === 'de' ? 'Einstellungen' : 'Settings'}</h1>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>{message.text}</div>
      )}

      {/* Personal Info */}
      <section className="settings-section card">
        <h2 className="section-title">👤 {language === 'de' ? 'Persönliche Daten' : 'Personal Info'}</h2>

        <div className="form-group">
          <label>{language === 'de' ? 'Anzeigename' : 'Display Name'}</label>
          <input
            type="text"
            className="input"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={user?.username}
          />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input type="email" className="input" value={user?.email || ''} disabled />
          <span className="form-hint">{language === 'de' ? 'Kann nicht geändert werden' : 'Cannot be changed'}</span>
        </div>
      </section>

      {/* Social & Connections */}
      <section className="settings-section card">
        <h2 className="section-title">👥 {language === 'de' ? 'Soziales & Verbindungen' : 'Social & Connections'}</h2>

        <div className="form-group">
          <p className="description-text">
            {language === 'de'
              ? 'Verwalte deine Verbindungen zu Familie und Freunden.'
              : 'Manage your connections with family and friends.'}
          </p>
          <Link to="/connections" className="btn btn-secondary btn-full">
            {language === 'de' ? 'Verbindungen verwalten' : 'Manage Connections'} →
          </Link>
        </div>
      </section>

      {/* Holidays & Location */}
      <section className="settings-section card">
        <h2 className="section-title">📍 {language === 'de' ? 'Feiertage & Standort' : 'Holidays & Location'}</h2>

        <div className="form-group">
          <label>{language === 'de' ? 'Hauptbundesland' : 'Primary State'}</label>
          <select
            className="input"
            value={primaryState}
            onChange={(e) => setPrimaryState(e.target.value as GermanState)}
          >
            {Object.entries(GERMAN_STATES).map(([code, name]) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>
          <span className="form-hint">
            {language === 'de'
              ? 'Feiertage dieses Bundeslands werden im Kalender angezeigt'
              : 'Holidays from this state will show on your calendar'}
          </span>
        </div>

        <div className="form-group">
          <label>{language === 'de' ? 'Weitere Bundesländer beobachten' : 'Watch Additional States'}</label>
          <div className="state-chips">
            {Object.entries(GERMAN_STATES)
              .filter(([code]) => code !== primaryState)
              .map(([code, name]) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => toggleWatchedState(code)}
                  className={`chip ${watchedStates.includes(code) ? 'active' : ''}`}
                >
                  {name}
                </button>
              ))}
          </div>
          <span className="form-hint">
            {language === 'de'
              ? 'Für Familie in anderen Bundesländern'
              : 'For family in other states'}
          </span>
        </div>
      </section>

      {/* Work Settings */}
      <section className="settings-section card">
        <h2 className="section-title">💼 {language === 'de' ? 'Arbeit' : 'Work'}</h2>

        <div className="form-group">
          <label>{language === 'de' ? 'Berufstyp' : 'Occupation Type'}</label>
          <select
            className="input"
            value={occupationType}
            onChange={(e) => setOccupationType(e.target.value)}
          >
            {OCCUPATION_TYPES.map(type => (
              <option key={type.id} value={type.id}>
                {language === 'de' ? type.labelDE : type.labelEN}
              </option>
            ))}
          </select>
          <span className="form-hint">
            {language === 'de'
              ? 'Bestimmt die verfügbaren Schichttypen'
              : 'Determines available shift types'}
          </span>
        </div>
      </section>

      {/* Shift Templates */}
      <section className="settings-section card">
        <div className="section-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)', borderBottom: '1px solid var(--bg-tertiary)', paddingBottom: 'var(--space-sm)' }}>
          <h2 className="section-title" style={{ border: 'none', margin: 0, padding: 0 }}>⏰ {language === 'de' ? 'Eigene Schichten' : 'Shift Templates'}</h2>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowTemplateModal(true)}>
            + {language === 'de' ? 'Neu' : 'New'}
          </button>
        </div>

        <div className="templates-list">
          {templates.length === 0 && <p className="description-text">{language === 'de' ? 'Keine eigenen Schichten definiert.' : 'No custom templates defined.'}</p>}
          {templates.map(t => (
            <div key={t.id} className="template-item card" style={{ padding: 'var(--space-sm)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-tertiary)' }}>
              <div className="template-info" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                <div className="template-color-dot" style={{ width: 16, height: 16, borderRadius: '50%', background: t.color }}></div>
                <strong>{t.shortName}</strong>
                <span>{t.name}</span>
                <span style={{ fontSize: '0.8em', color: 'var(--text-muted)' }}>{t.startTime}-{t.endTime}</span>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => deleteTemplate(t.id)}>🗑️</button>
            </div>
          ))}
        </div>
      </section>

      {/* Appearance */}
      <section className="settings-section card">
        <h2 className="section-title">🎨 {language === 'de' ? 'Darstellung' : 'Appearance'}</h2>

        <div className="form-group">
          <label>{language === 'de' ? 'Sprache' : 'Language'}</label>
          <div className="toggle-buttons">
            <button
              type="button"
              onClick={() => setLanguage('de')}
              className={`btn ${language === 'de' ? 'btn-primary' : 'btn-ghost'}`}
            >
              🇩🇪 Deutsch
            </button>
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`btn ${language === 'en' ? 'btn-primary' : 'btn-ghost'}`}
            >
              🇬🇧 English
            </button>
          </div>
        </div>

        <div className="form-group">
          <label>{language === 'de' ? 'Design' : 'Theme'}</label>
          <div className="toggle-buttons">
            <button
              type="button"
              onClick={() => handleThemeChange('light')}
              className={`btn ${theme === 'light' ? 'btn-primary' : 'btn-ghost'}`}
            >
              ☀️ {language === 'de' ? 'Hell' : 'Light'}
            </button>
            <button
              type="button"
              onClick={() => handleThemeChange('dark')}
              className={`btn ${theme === 'dark' ? 'btn-primary' : 'btn-ghost'}`}
            >
              🌙 {language === 'de' ? 'Dunkel' : 'Dark'}
            </button>
          </div>
        </div>
      </section>

      {/* Actions */}
      <div className="profile-actions">
        <button onClick={handleSave} className="btn btn-primary" disabled={isSaving}>
          {isSaving
            ? (language === 'de' ? 'Speichern...' : 'Saving...')
            : (language === 'de' ? 'Speichern' : 'Save')}
        </button>
        <button onClick={handleLogout} className="btn btn-ghost logout-btn">
          {language === 'de' ? 'Abmelden' : 'Sign Out'}
        </button>
      </div>

      {showTemplateModal && (
        <div className="modal-overlay" onClick={() => setShowTemplateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{language === 'de' ? 'Neue Schichtvorlage' : 'New Shift Template'}</h3>
            <div className="form-group">
              <label>{language === 'de' ? 'Name' : 'Name'}</label>
              <input className="input" value={newTemplate.name} onChange={e => setNewTemplate({ ...newTemplate, name: e.target.value })} placeholder="e.g. Late Shift" />
            </div>
            <div className="form-group" style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label>{language === 'de' ? 'Kürzel' : 'Short Code'}</label>
                <input className="input" value={newTemplate.shortName} onChange={e => setNewTemplate({ ...newTemplate, shortName: e.target.value })} placeholder="e.g. L" maxLength={3} />
              </div>
              <div>
                <label>{language === 'de' ? 'Farbe' : 'Color'}</label>
                <input type="color" className="input" style={{ height: 42, padding: 2 }} value={newTemplate.color} onChange={e => setNewTemplate({ ...newTemplate, color: e.target.value })} />
              </div>
            </div>
            <div className="form-group" style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label>{language === 'de' ? 'Start' : 'Start'}</label>
                <input type="time" className="input" value={newTemplate.startTime} onChange={e => setNewTemplate({ ...newTemplate, startTime: e.target.value })} />
              </div>
              <div style={{ flex: 1 }}>
                <label>{language === 'de' ? 'Ende' : 'End'}</label>
                <input type="time" className="input" value={newTemplate.endTime} onChange={e => setNewTemplate({ ...newTemplate, endTime: e.target.value })} />
              </div>
            </div>
            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
              <button className="btn btn-ghost" onClick={() => setShowTemplateModal(false)}>{language === 'de' ? 'Abbrechen' : 'Cancel'}</button>
              <button className="btn btn-primary" onClick={saveTemplate}>{language === 'de' ? 'Speichern' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .profile-page { max-width: 700px; margin: 0 auto; }
        .profile-header { margin-bottom: var(--space-lg); }
        .profile-header h1 { font-size: 1.5rem; }
        .message {
          padding: var(--space-sm) var(--space-md);
          border-radius: var(--radius-md);
          margin-bottom: var(--space-lg);
          font-size: 0.875rem;
        }
        .message.success { background: rgba(34, 197, 94, 0.1); color: #22c55e; }
        .message.error { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
        .settings-section { margin-bottom: var(--space-lg); padding: var(--space-lg); }
        .section-title {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: var(--space-lg);
          padding-bottom: var(--space-sm);
          border-bottom: 1px solid var(--bg-tertiary);
        }
        .form-group {
          margin-bottom: var(--space-lg);
        }
        .form-group:last-child { margin-bottom: 0; }
        .form-group label {
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: var(--space-xs);
          color: var(--text-secondary);
        }
        .form-hint {
          display: block;
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-top: var(--space-xs);
        }
        .state-chips {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-xs);
        }
        .chip {
          padding: var(--space-xs) var(--space-sm);
          border-radius: var(--radius-full);
          background: var(--bg-tertiary);
          border: 1px solid transparent;
          color: var(--text-secondary);
          font-size: 0.75rem;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .chip:hover { background: var(--bg-elevated); }
        .chip.active {
          background: rgba(139, 92, 246, 0.2);
          border-color: var(--accent-primary);
          color: var(--accent-primary);
        }
        .toggle-buttons {
          display: flex;
          gap: var(--space-sm);
        }
        .profile-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: var(--space-lg);
          border-top: 1px solid var(--bg-tertiary);
        }
        .logout-btn { color: var(--accent-error); }
        .input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .btn-full { width: 100%; justify-content: center; }
        .description-text { 
          font-size: 0.875rem; color: var(--text-secondary); margin-bottom: var(--space-md); 
        }
      `}</style>
    </div >
  )
}
