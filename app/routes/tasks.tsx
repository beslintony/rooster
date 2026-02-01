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
    const [tasks, setTasks] = useState<Task[]>([])

    useEffect(() => {
        if (isAuthenticated) {
            fetchConnections()
            fetchTasks()
        }
    }, [isAuthenticated])

    const fetchTasks = async () => {
        try {
            const res = await fetch('/api/tasks', { credentials: 'include' })
            if (res.ok) {
                const data = await res.json()
                const parsedTasks = data.tasks.map((t: any) => ({
                    ...t,
                    dueDate: t.dueDate ? new Date(t.dueDate) : undefined
                }))
                setTasks(parsedTasks)
            }
        } catch (error) {
            console.error('Failed to fetch tasks:', error)
        }
    }

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

    const toggleCompleted = async (id: string) => {
        const task = tasks.find(t => t.id === id)
        if (!task) return

        try {
            const res = await fetch(`/api/tasks/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ completed: !task.completed })
            })
            if (res.ok) {
                setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t))
            }
        } catch (error) {
            console.error('Failed to update task:', error)
        }
    }

    const addTask = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newTask.trim()) return

        try {
            const res = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newTask,
                    assigneeId: newAssignee || undefined,
                    recurring: undefined
                })
            })

            if (res.ok) {
                const data = await res.json()
                setTasks([data.task, ...tasks])
                setNewTask('')
                setNewAssignee('')
            }
        } catch (error) {
            console.error('Failed to create task:', error)
        }
    }

    const deleteTask = async (id: string) => {
        try {
            const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
            if (res.ok) {
                setTasks(tasks.filter(task => task.id !== id))
            }
        } catch (error) {
            console.error('Failed to delete task:', error)
        }
    }

    const assignTask = async (taskId: string, assigneeId: string) => {
        try {
            const res = await fetch(`/api/tasks/${taskId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assigneeId })
            })
            if (res.ok) {
                setTasks(tasks.map(t => t.id === taskId ? { ...t, assigneeId: assigneeId || undefined } : t))
            }
        } catch (error) {
            console.error('Failed to assign task:', error)
        }
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
        .tasks-page { max-width: 1000px; margin: 0 auto; padding: 0 var(--space-md); }
        
        /* Header */
        .tasks-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-md);
          flex-wrap: wrap;
          gap: var(--space-sm);
        }
        .tasks-header h1 { 
          font-size: var(--font-lg); 
          font-weight: var(--font-weight-bold);
        }
        .tasks-stats {
          display: flex;
          gap: var(--space-sm);
        }
        .stat {
          font-size: var(--font-xs);
          color: var(--text-secondary);
          padding: 4px 10px;
          background: var(--bg-tertiary);
          border-radius: var(--radius-full);
        }
        
        /* Add Task Form */
        .add-task-form {
          display: flex;
          gap: var(--space-sm);
          margin-bottom: var(--space-lg);
          position: sticky;
          top: 60px;
          background: var(--bg-primary);
          padding: var(--space-sm) 0;
          z-index: 10;
        }
        .add-task-form .input { 
          flex: 1;
          min-height: var(--touch-target-min);
        }
        .assignee-select { 
          width: 140px; 
          flex: none;
          min-height: var(--touch-target-min);
        }
        .add-task-form .btn {
          min-height: var(--touch-target-min);
        }
        
        /* Login Prompt */
        .login-prompt {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--space-md);
          padding: var(--space-md);
          gap: var(--space-md);
        }
        .login-prompt p { margin: 0; font-size: var(--font-sm); }
        
        /* Sections */
        .tasks-section {
          background: var(--bg-secondary);
          border: 1px solid var(--bg-tertiary);
          border-radius: var(--radius-lg);
          padding: var(--space-md);
          margin-bottom: var(--space-md);
        }
        .section-title {
          font-size: var(--font-sm);
          font-weight: var(--font-weight-semibold);
          color: var(--text-secondary);
          margin-bottom: var(--space-md);
        }
        
        /* Tasks List */
        .tasks-list {
          display: flex;
          flex-direction: column;
        }
        .task-item {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: var(--space-sm);
          padding: var(--space-sm) 0;
          border-bottom: 1px solid var(--bg-tertiary);
          min-height: var(--touch-target-min);
        }
        .task-item:last-child { border-bottom: none; }
        .task-item:hover { background: transparent; }
        .task-item.completed { opacity: 0.5; }
        .task-item.completed .task-title { text-decoration: line-through; }
        
        .checkbox-wrapper { 
          display: flex; 
          align-items: flex-start; 
          gap: var(--space-sm); 
          flex: 1;
          cursor: pointer;
        }
        .checkbox-wrapper input[type="checkbox"] {
          width: 22px;
          height: 22px;
          margin-top: 2px;
        }
        .task-content { display: flex; flex-direction: column; gap: 2px; }
        .task-title { font-weight: var(--font-weight-medium); font-size: var(--font-sm); }
        .task-meta {
          display: flex;
          gap: var(--space-sm);
          font-size: var(--font-xs);
          color: var(--text-muted);
          flex-wrap: wrap;
        }
        .task-assignee { color: var(--accent-secondary); }
        .task-due { color: var(--accent-warning); }
        .task-recurring { color: var(--text-muted); }
        
        .mini-select {
          padding: 4px 8px;
          font-size: var(--font-xs);
          background: var(--bg-tertiary);
          border: 1px solid var(--bg-elevated);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          min-height: 32px;
        }
        .delete-btn {
          opacity: 0.3;
          font-size: 1.25rem;
          min-width: 36px;
          min-height: 36px;
          padding: 0;
          color: var(--text-muted);
        }
        .task-item:hover .delete-btn,
        .delete-btn:focus { opacity: 1; color: var(--accent-danger); }
        
        .completed-section { opacity: 0.7; }
        
        /* Empty State */
        .empty-state {
          text-align: center;
          padding: var(--space-xl) var(--space-md);
          color: var(--text-muted);
        }
        .empty-state-icon { font-size: 2rem; margin-bottom: var(--space-xs); }
        .empty-state p { font-size: var(--font-sm); margin: 0; }
        
        /* Responsibilities */
        .responsibilities-section { margin-top: var(--space-lg); }
        .responsibilities-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: var(--space-sm);
          margin-top: var(--space-md);
        }
        .responsibility-card {
          padding: var(--space-sm);
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
        }
        .member-header {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
          margin-bottom: var(--space-xs);
        }
        .member-emoji { font-size: 1.25rem; }
        .member-name { font-weight: var(--font-weight-semibold); font-size: var(--font-sm); }
        .member-tasks { display: flex; flex-direction: column; gap: 2px; }
        .mini-task {
          font-size: var(--font-xs);
          color: var(--text-secondary);
          padding: 2px 0;
          border-bottom: 1px solid var(--bg-elevated);
        }
        .mini-task.empty { color: var(--text-muted); font-style: italic; border: none; }
        
        /* Mobile */
        @media (max-width: 640px) {
          .tasks-header { 
            flex-direction: column;
            align-items: stretch;
          }
          .tasks-header h1 { font-size: var(--font-md); }
          
          .add-task-form { 
            flex-wrap: wrap;
            top: 52px;
          }
          .assignee-select { width: 100%; }
          
          .login-prompt {
            flex-direction: column;
            text-align: center;
          }
          
          .tasks-section { padding: var(--space-sm); }
          .delete-btn { opacity: 0.5; }
          
          .responsibilities-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
        </div>
    )
}
