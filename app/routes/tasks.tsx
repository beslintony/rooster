import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useI18n } from '~/lib/i18n'
import { useAuth } from '~/lib/auth'

export const Route = createFileRoute('/tasks')({
    component: TasksPage,
})

interface Task {
    id: string
    title: string
    description?: string
    assigneeId?: string
    dueDate?: Date
    completed: boolean
    recurring?: 'DAILY' | 'WEEKLY' | 'MONTHLY'
}

interface ConnectedUser {
    id: string
    username: string
    displayName: string | null
    avatar: string | null
}

function TasksPage() {
    const { t, language } = useI18n()
    const { user, isAuthenticated } = useAuth()
    const [newTask, setNewTask] = useState('')
    const [newAssignee, setNewAssignee] = useState<string>('')
    const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([])
    const [tasks, setTasks] = useState<Task[]>([
        { id: '1', title: 'Take out trash', assigneeId: 'me', completed: false, recurring: 'WEEKLY' },
        { id: '2', title: 'Grocery shopping', assigneeId: '', dueDate: new Date(), completed: false },
        { id: '3', title: 'Pay electricity bill', dueDate: new Date(Date.now() + 86400000 * 3), completed: false },
        { id: '4', title: 'Clean bathroom', assigneeId: 'me', completed: true, recurring: 'WEEKLY' },
    ])

    useEffect(() => {
        if (isAuthenticated) {
            fetchConnections()
        }
    }, [isAuthenticated])

    const fetchConnections = async () => {
        try {
            const res = await fetch('/api/connections', { credentials: 'include' })
            if (res.ok) {
                const data = await res.json()
                const users = data.connections.map((conn: any) => {
                    return conn.sender.id === user?.id ? conn.receiver : conn.sender
                })
                setConnectedUsers(users)
            }
        } catch (error) {
            console.error('Failed to fetch connections:', error)
        }
    }

    const toggleCompleted = (id: string) => {
        setTasks(tasks.map(task =>
            task.id === id ? { ...task, completed: !task.completed } : task
        ))
    }

    const addTask = (e: React.FormEvent) => {
        e.preventDefault()
        if (!newTask.trim()) return

        const task: Task = {
            id: Date.now().toString(),
            title: newTask,
            assigneeId: newAssignee || undefined,
            completed: false,
        }
        setTasks([...tasks, task])
        setNewTask('')
        setNewAssignee('')
    }

    const deleteTask = (id: string) => {
        setTasks(tasks.filter(task => task.id !== id))
    }

    const assignTask = (taskId: string, assigneeId: string) => {
        setTasks(tasks.map(task =>
            task.id === taskId ? { ...task, assigneeId: assigneeId || undefined } : task
        ))
    }

    const pendingTasks = tasks.filter(t => !t.completed)
    const completedTasks = tasks.filter(t => t.completed)

    const getAssignee = (id?: string) => {
        if (!id) return null
        if (id === 'me') return { displayName: language === 'de' ? 'Du' : 'You', avatar: user?.avatar }
        const member = connectedUsers.find(u => u.id === id)
        return member ? { displayName: member.displayName || member.username, avatar: member.avatar } : null
    }

    const formatDueDate = (date?: Date) => {
        if (!date) return null
        const today = new Date()
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        if (date.toDateString() === today.toDateString()) return language === 'de' ? 'Heute' : 'Today'
        if (date.toDateString() === tomorrow.toDateString()) return language === 'de' ? 'Morgen' : 'Tomorrow'
        return date.toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US', { month: 'short', day: 'numeric' })
    }

    const recurringLabels: Record<string, Record<string, string>> = {
        de: { DAILY: 'täglich', WEEKLY: 'wöchentlich', MONTHLY: 'monatlich' },
        en: { DAILY: 'daily', WEEKLY: 'weekly', MONTHLY: 'monthly' },
    }

    return (
        <div className="tasks-page">
            <div className="tasks-header">
                <h1>✅ {t('tasks.title')}</h1>
                <div className="tasks-stats">
                    <span className="stat">{pendingTasks.length} {language === 'de' ? 'offen' : 'pending'}</span>
                    <span className="stat">{completedTasks.length} {language === 'de' ? 'erledigt' : 'done'}</span>
                </div>
            </div>

            <form onSubmit={addTask} className="add-task-form">
                <input
                    type="text"
                    className="input"
                    placeholder={t('tasks.addTask')}
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                />
                {isAuthenticated && (
                    <select
                        className="input assignee-select"
                        value={newAssignee}
                        onChange={(e) => setNewAssignee(e.target.value)}
                    >
                        <option value="">{language === 'de' ? 'Zuweisen...' : 'Assign to...'}</option>
                        <option value="me">{language === 'de' ? '👤 Du' : '👤 You'}</option>
                        {connectedUsers.map(u => (
                            <option key={u.id} value={u.id}>👥 {u.displayName || u.username}</option>
                        ))}
                    </select>
                )}
                <button type="submit" className="btn btn-primary">{t('common.add')}</button>
            </form>

            {!isAuthenticated && (
                <div className="login-prompt card">
                    <p>
                        {language === 'de'
                            ? '💡 Melde dich an, um Aufgaben mit Freunden und Familie zu teilen!'
                            : '💡 Sign in to share tasks with friends and family!'}
                    </p>
                    <Link to="/login" className="btn btn-secondary">
                        {language === 'de' ? 'Anmelden' : 'Sign In'}
                    </Link>
                </div>
            )}

            <div className="tasks-content">
                <div className="tasks-section">
                    <h2 className="section-title">📋 {t('tasks.todo')}</h2>
                    <div className="tasks-list">
                        {pendingTasks.map(task => {
                            const assignee = getAssignee(task.assigneeId)
                            return (
                                <div key={task.id} className="task-item">
                                    <label className="checkbox-wrapper">
                                        <input
                                            type="checkbox"
                                            className="checkbox"
                                            checked={task.completed}
                                            onChange={() => toggleCompleted(task.id)}
                                        />
                                        <div className="task-content">
                                            <span className="task-title">{task.title}</span>
                                            <div className="task-meta">
                                                {assignee && (
                                                    <span className="task-assignee">
                                                        {assignee.avatar ? '📷' : '👤'} {assignee.displayName}
                                                    </span>
                                                )}
                                                {task.dueDate && (
                                                    <span className="task-due">{formatDueDate(task.dueDate)}</span>
                                                )}
                                                {task.recurring && (
                                                    <span className="task-recurring">🔄 {recurringLabels[language][task.recurring]}</span>
                                                )}
                                            </div>
                                        </div>
                                    </label>
                                    {isAuthenticated && (
                                        <select
                                            className="mini-select"
                                            value={task.assigneeId || ''}
                                            onChange={(e) => assignTask(task.id, e.target.value)}
                                        >
                                            <option value="">{language === 'de' ? 'Nicht zugewiesen' : 'Unassigned'}</option>
                                            <option value="me">{language === 'de' ? 'Du' : 'You'}</option>
                                            {connectedUsers.map(u => (
                                                <option key={u.id} value={u.id}>{u.displayName || u.username}</option>
                                            ))}
                                        </select>
                                    )}
                                    <button
                                        onClick={() => deleteTask(task.id)}
                                        className="btn btn-ghost delete-btn"
                                    >
                                        ×
                                    </button>
                                </div>
                            )
                        })}
                        {pendingTasks.length === 0 && (
                            <div className="empty-state">
                                <div className="empty-state-icon">🎉</div>
                                <p>{t('dashboard.allCaughtUp')}</p>
                            </div>
                        )}
                    </div>
                </div>

                {completedTasks.length > 0 && (
                    <div className="tasks-section completed-section">
                        <h2 className="section-title">✅ {t('tasks.completed')} ({completedTasks.length})</h2>
                        <div className="tasks-list">
                            {completedTasks.map(task => (
                                <div key={task.id} className="task-item completed">
                                    <label className="checkbox-wrapper">
                                        <input
                                            type="checkbox"
                                            className="checkbox"
                                            checked={task.completed}
                                            onChange={() => toggleCompleted(task.id)}
                                        />
                                        <span className="task-title">{task.title}</span>
                                    </label>
                                    <button
                                        onClick={() => deleteTask(task.id)}
                                        className="btn btn-ghost delete-btn"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {isAuthenticated && connectedUsers.length > 0 && (
                <div className="responsibilities-section card">
                    <h2 className="card-title">👥 {t('tasks.weeklyResponsibilities')}</h2>
                    <div className="responsibilities-grid">
                        <div className="responsibility-card">
                            <div className="member-header">
                                <span className="member-emoji">👤</span>
                                <span className="member-name">{language === 'de' ? 'Du' : 'You'}</span>
                            </div>
                            <div className="member-tasks">
                                {tasks.filter(t => t.assigneeId === 'me' && !t.completed).slice(0, 3).map(task => (
                                    <div key={task.id} className="mini-task">{task.title}</div>
                                ))}
                                {tasks.filter(t => t.assigneeId === 'me' && !t.completed).length === 0 && (
                                    <div className="mini-task empty">
                                        {language === 'de' ? 'Keine Aufgaben' : 'No tasks'}
                                    </div>
                                )}
                            </div>
                        </div>
                        {connectedUsers.map(member => (
                            <div key={member.id} className="responsibility-card">
                                <div className="member-header">
                                    <span className="member-emoji">👥</span>
                                    <span className="member-name">{member.displayName || member.username}</span>
                                </div>
                                <div className="member-tasks">
                                    {tasks.filter(t => t.assigneeId === member.id && !t.completed).slice(0, 3).map(task => (
                                        <div key={task.id} className="mini-task">{task.title}</div>
                                    ))}
                                    {tasks.filter(t => t.assigneeId === member.id && !t.completed).length === 0 && (
                                        <div className="mini-task empty">
                                            {language === 'de' ? 'Keine Aufgaben' : 'No tasks'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <style>{`
        .tasks-page { max-width: 900px; margin: 0 auto; }
        .tasks-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-lg);
        }
        .tasks-header h1 { font-size: 1.5rem; }
        .tasks-stats {
          display: flex;
          gap: var(--space-md);
        }
        .stat {
          font-size: 0.875rem;
          color: var(--text-secondary);
          padding: var(--space-xs) var(--space-sm);
          background: var(--bg-tertiary);
          border-radius: var(--radius-full);
        }
        .add-task-form {
          display: flex;
          gap: var(--space-sm);
          margin-bottom: var(--space-lg);
        }
        .add-task-form .input { flex: 1; }
        .assignee-select { width: 160px; flex: none; }
        .login-prompt {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--space-lg);
          padding: var(--space-md);
        }
        .login-prompt p { margin: 0; }
        .section-title {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-secondary);
          margin-bottom: var(--space-md);
        }
        .tasks-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }
        .task-item {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: var(--space-sm);
          padding: var(--space-md);
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
          transition: all var(--transition-fast);
        }
        .task-item:hover { background: var(--bg-tertiary); }
        .task-item.completed { opacity: 0.5; }
        .task-item.completed .task-title { text-decoration: line-through; }
        .checkbox-wrapper { display: flex; align-items: flex-start; gap: var(--space-sm); flex: 1; }
        .task-content { display: flex; flex-direction: column; gap: var(--space-xs); }
        .task-title { font-weight: 500; }
        .task-meta {
          display: flex;
          gap: var(--space-sm);
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .task-assignee { color: var(--accent-secondary); }
        .task-due { color: var(--accent-warning); }
        .task-recurring { color: var(--text-muted); }
        .mini-select {
          padding: var(--space-xs) var(--space-sm);
          font-size: 0.75rem;
          background: var(--bg-tertiary);
          border: 1px solid var(--bg-elevated);
          border-radius: var(--radius-md);
          color: var(--text-primary);
        }
        .delete-btn {
          opacity: 0;
          font-size: 1.25rem;
          line-height: 1;
        }
        .task-item:hover .delete-btn { opacity: 1; }
        .completed-section { margin-top: var(--space-xl); opacity: 0.7; }
        .responsibilities-section { margin-top: var(--space-xl); }
        .responsibilities-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--space-md);
          margin-top: var(--space-md);
        }
        .responsibility-card {
          padding: var(--space-md);
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
        }
        .member-header {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          margin-bottom: var(--space-sm);
        }
        .member-emoji { font-size: 1.5rem; }
        .member-name { font-weight: 600; }
        .member-tasks { display: flex; flex-direction: column; gap: var(--space-xs); }
        .mini-task {
          font-size: 0.875rem;
          color: var(--text-secondary);
          padding: var(--space-xs) 0;
          border-bottom: 1px solid var(--bg-elevated);
        }
        .mini-task.empty { color: var(--text-muted); font-style: italic; border: none; }
        @media (max-width: 600px) {
          .add-task-form { flex-wrap: wrap; }
          .assignee-select { width: 100%; }
        }
      `}</style>
        </div>
    )
}
