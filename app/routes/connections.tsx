import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useAuth, RequireAuth } from '~/lib/auth'
import { useI18n } from '~/lib/i18n'

export const Route = createFileRoute('/connections')({
  component: ConnectionsPageWrapper,
})

function ConnectionsPageWrapper() {
  return (
    <RequireAuth>
      <ConnectionsPage />
    </RequireAuth>
  )
}

interface Connection {
  id: string
  sender: { id: string; username: string; displayName: string | null; avatar: string | null }
  receiver: { id: string; username: string; displayName: string | null; avatar: string | null }
  status: string
  permissions: string
}

interface PendingInvite {
  id: string
  sender: { id: string; username: string; displayName: string | null; avatar: string | null }
}

const PERMISSIONS = [
  { id: 'VIEW_CALENDAR', labelDE: 'Kalender sehen', labelEN: 'View Calendar' },
  { id: 'EDIT_CALENDAR', labelDE: 'Kalender bearbeiten', labelEN: 'Edit Calendar' },
  { id: 'VIEW_TASKS', labelDE: 'Aufgaben sehen', labelEN: 'View Tasks' },
  { id: 'ASSIGN_TASKS', labelDE: 'Aufgaben zuweisen', labelEN: 'Assign Tasks' },
]

function ConnectionsPage() {
  const { user } = useAuth()
  const { language } = useI18n()

  const [connections, setConnections] = useState<Connection[]>([])
  const [pending, setPending] = useState<PendingInvite[]>([])
  const [inviteInput, setInviteInput] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    fetchConnections()
  }, [])

  const fetchConnections = async () => {
    try {
      const res = await fetch('/api/connections', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setConnections(data.connections)
        setPending(data.pending)
      }
    } catch (error) {
      console.error('Failed to fetch connections:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const sendInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteInput.trim()) return

    setMessage({ type: '', text: '' })

    try {
      const res = await fetch('/api/connections/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ usernameOrEmail: inviteInput })
      })
      const data = await res.json()

      if (res.ok) {
        setMessage({
          type: 'success',
          text: language === 'de' ? 'Einladung gesendet!' : 'Invite sent!'
        })
        setInviteInput('')
        fetchConnections() // Refresh to show pending sent invite
      } else if (data.error === 'User not found') {
        setMessage({
          type: 'info',
          text: language === 'de'
            ? `"${inviteInput}" ist noch nicht registriert. Teile ihnen mit, dass sie sich anmelden und deinen Benutzernamen suchen sollen.`
            : `"${inviteInput}" hasn't joined yet. Ask them to sign up and search for your username.`
        })
      } else if (data.error === 'Connection already exists') {
        setMessage({
          type: 'info',
          text: language === 'de' ? 'Ihr seid bereits verbunden!' : 'You are already connected!'
        })
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: language === 'de' ? 'Fehler beim Senden' : 'Failed to send'
      })
    }
  }

  const handleInvite = async (id: string, accept: boolean) => {
    try {
      const res = await fetch(`/api/connections/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: accept ? 'ACCEPTED' : 'REJECTED' })
      })

      if (res.ok) {
        fetchConnections()
      }
    } catch (error) {
      console.error('Failed to respond to invite:', error)
    }
  }

  const updatePermissions = async (id: string, permissions: string[]) => {
    try {
      await fetch(`/api/connections/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ permissions: permissions.join(',') })
      })
    } catch (error) {
      console.error('Failed to update permissions:', error)
    }
  }

  const getConnectedUser = (conn: Connection) => {
    return conn.sender.id === user?.id ? conn.receiver : conn.sender
  }

  if (isLoading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <div className="connections-page">
      <div className="page-header">
        <h1>👥 {language === 'de' ? 'Verbindungen' : 'Connections'}</h1>
        <p>{language === 'de'
          ? 'Verbinde dich mit Familie und Freunden, um Kalender und Aufgaben zu teilen'
          : 'Connect with family and friends to share calendars and tasks'}</p>
      </div>

      {/* Invite Form */}
      <div className="card invite-card">
        <h2 className="card-title">
          ✉️ {language === 'de' ? 'Jemanden einladen' : 'Invite Someone'}
        </h2>
        <form onSubmit={sendInvite} className="invite-form">
          <input
            type="text"
            className="input"
            value={inviteInput}
            onChange={(e) => setInviteInput(e.target.value)}
            placeholder={language === 'de' ? 'Email oder Benutzername' : 'Email or username'}
          />
          <button type="submit" className="btn btn-primary">
            {language === 'de' ? 'Einladen' : 'Invite'}
          </button>
        </form>
        {message.text && (
          <div className={`message ${message.type}`}>{message.text}</div>
        )}
      </div>

      {/* Pending Invites */}
      {pending.length > 0 && (
        <div className="card pending-card">
          <h2 className="card-title">
            🔔 {language === 'de' ? 'Ausstehende Einladungen' : 'Pending Invites'} ({pending.length})
          </h2>
          <div className="pending-list">
            {pending.map(invite => (
              <div key={invite.id} className="pending-item">
                <div className="user-info">
                  <div className="avatar">
                    {invite.sender.avatar ? (
                      <img src={invite.sender.avatar} alt="" />
                    ) : (
                      <span>{(invite.sender.displayName || invite.sender.username)[0].toUpperCase()}</span>
                    )}
                  </div>
                  <div className="user-details">
                    <span className="name">{invite.sender.displayName || invite.sender.username}</span>
                    <span className="username">@{invite.sender.username}</span>
                  </div>
                </div>
                <div className="invite-actions">
                  <button
                    onClick={() => handleInvite(invite.id, true)}
                    className="btn btn-primary btn-sm"
                  >
                    {language === 'de' ? 'Annehmen' : 'Accept'}
                  </button>
                  <button
                    onClick={() => handleInvite(invite.id, false)}
                    className="btn btn-ghost btn-sm"
                  >
                    {language === 'de' ? 'Ablehnen' : 'Decline'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Connected Users */}
      <div className="card connections-card">
        <h2 className="card-title">
          🔗 {language === 'de' ? 'Deine Verbindungen' : 'Your Connections'} ({connections.length})
        </h2>

        {connections.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🤝</div>
            <p>{language === 'de'
              ? 'Noch keine Verbindungen. Lade Familie oder Freunde ein!'
              : 'No connections yet. Invite family or friends!'}</p>
          </div>
        ) : (
          <div className="connections-list">
            {connections.map(conn => {
              const connectedUser = getConnectedUser(conn)
              const currentPerms = conn.permissions.split(',')

              return (
                <div key={conn.id} className="connection-item">
                  <div className="user-info">
                    <div className="avatar">
                      {connectedUser.avatar ? (
                        <img src={connectedUser.avatar} alt="" />
                      ) : (
                        <span>{(connectedUser.displayName || connectedUser.username)[0].toUpperCase()}</span>
                      )}
                    </div>
                    <div className="user-details">
                      <span className="name">{connectedUser.displayName || connectedUser.username}</span>
                      <span className="username">@{connectedUser.username}</span>
                    </div>
                  </div>
                  <div className="permissions">
                    {PERMISSIONS.map(perm => (
                      <label key={perm.id} className="perm-toggle">
                        <input
                          type="checkbox"
                          checked={currentPerms.includes(perm.id)}
                          onChange={(e) => {
                            const newPerms = e.target.checked
                              ? [...currentPerms, perm.id]
                              : currentPerms.filter(p => p !== perm.id)
                            updatePermissions(conn.id, newPerms)
                          }}
                        />
                        <span>{language === 'de' ? perm.labelDE : perm.labelEN}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <style>{`
        .connections-page { max-width: 1000px; margin: 0 auto; padding: 0 var(--space-md); }
        .page-header { margin-bottom: var(--space-xl); }
        .page-header h1 { font-size: 1.5rem; margin-bottom: var(--space-xs); }
        .page-header p { color: var(--text-secondary); }
        
        .invite-card, .pending-card, .connections-card { margin-bottom: var(--space-lg); }
        
        .invite-form {
          display: flex;
          gap: var(--space-sm);
        }
        .invite-form .input { flex: 1; }
        
        .message {
          margin-top: var(--space-sm);
          padding: var(--space-sm) var(--space-md);
          border-radius: var(--radius-md);
          font-size: 0.875rem;
        }
        .message.success {
          background: rgba(34, 197, 94, 0.1);
          color: #22c55e;
        }
        .message.error {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }
        .message.info {
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
        }
        
        .pending-list, .connections-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }
        
        .pending-item, .connection-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-md);
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
        }
        
        .user-info {
          display: flex;
          align-items: center;
          gap: var(--space-md);
        }
        
        .avatar {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-full);
          background: var(--accent-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          overflow: hidden;
        }
        .avatar img { width: 100%; height: 100%; object-fit: cover; }
        
        .user-details {
          display: flex;
          flex-direction: column;
        }
        .name { font-weight: 600; }
        .username { font-size: 0.75rem; color: var(--text-muted); }
        
        .invite-actions {
          display: flex;
          gap: var(--space-sm);
        }
        
        .permissions {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-sm);
        }
        
        .perm-toggle {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
          font-size: 0.75rem;
          padding: var(--space-xs) var(--space-sm);
          background: var(--bg-secondary);
          border-radius: var(--radius-full);
          cursor: pointer;
        }
        .perm-toggle input { width: 14px; height: 14px; }
        
        .empty-state {
          text-align: center;
          padding: var(--space-xl);
          color: var(--text-muted);
        }
        .empty-icon { font-size: 3rem; margin-bottom: var(--space-sm); }
        
        .btn-sm {
          padding: var(--space-xs) var(--space-sm);
          font-size: 0.875rem;
        }
        
        @media (max-width: 600px) {
          .pending-item, .connection-item {
            flex-direction: column;
            gap: var(--space-md);
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  )
}
