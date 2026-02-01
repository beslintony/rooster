import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useI18n } from '~/lib/i18n'

export const Route = createFileRoute('/tasks')({
    component: TasksPage,
})

interface Task {
    id: string
    title: string
    description?: string
    assignee?: string
    dueDate?: Date
    completed: boolean
    recurring?: 'DAILY' | 'WEEKLY' | 'MONTHLY'
}

const FAMILY_MEMBERS = [
    { id: '1', name: 'You', nameDE: 'Du', emoji: '👤' },
    { id: '2', name: 'Partner', nameDE: 'Partner', emoji: '👩‍⚕️' },
]

function TasksPage() {
    const { t, language } = useI18n()
    const [newTask, setNewTask] = useState('')
    const [tasks, setTasks] = useState<Task[]>([
        { id: '1', title: 'Take out trash', assignee: '1', completed: false, recurring: 'WEEKLY' },
        { id: '2', title: 'Grocery shopping', assignee: '2', dueDate: new Date(), completed: false },
        { id: '3', title: 'Pay electricity bill', dueDate: new Date(Date.now() + 86400000 * 3), completed: false },
        { id: '4', title: 'Clean bathroom', assignee: '1', completed: true, recurring: 'WEEKLY' },
    ])

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
            completed: false,
        }
        setTasks([...tasks, task])
        setNewTask('')
    }

    const deleteTask = (id: string) => {
        setTasks(tasks.filter(task => task.id !== id))
    }

    const pendingTasks = tasks.filter(t => !t.completed)
    const completedTasks = tasks.filter(t => t.completed)

    const getAssignee = (id?: string) => {
        const member = FAMILY_MEMBERS.find(m => m.id === id)
        if (!member) return null
        return { ...member, displayName: language === 'de' ? member.nameDE : member.name }
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
                <button type="submit" className="btn btn-primary">{t('common.add')}</button>
            </form>

            <div className="tasks-content">
                <div className="tasks-section">
                    <h2 className="section-title">📋 {t('tasks.todo')}</h2>
                    <div className="tasks-list">
                        {pendingTasks.map(task => (
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
                                            {task.assignee && (
                                                <span className="task-assignee">
                                                    {getAssignee(task.assignee)?.emoji} {getAssignee(task.assignee)?.displayName}
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
                                <button
                                    onClick={() => deleteTask(task.id)}
                                    className="btn btn-ghost delete-btn"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
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

            <div className="responsibilities-section card" style={{ marginTop: 'var(--space-xl)' }}>
                <h2 className="card-title">👥 {t('tasks.weeklyResponsibilities')}</h2>
                <div className="responsibilities-grid">
                    {FAMILY_MEMBERS.map(member => (
                        <div key={member.id} className="responsibility-card">
                            <div className="member-header">
                                <span className="member-emoji">{member.emoji}</span>
                                <span className="member-name">{language === 'de' ? member.nameDE : member.name}</span>
                            </div>
                            <div className="member-tasks">
                                {tasks.filter(t => t.assignee === member.id && !t.completed).slice(0, 3).map(task => (
                                    <div key={task.id} className="mini-task">{task.title}</div>
                                ))}
                                {tasks.filter(t => t.assignee === member.id && !t.completed).length === 0 && (
                                    <div className="mini-task empty">
                                        {language === 'de' ? 'Keine Aufgaben zugewiesen' : 'No tasks assigned'}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

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
          margin-bottom: var(--space-xl);
        }
        .add-task-form .input { flex: 1; }
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
          padding: var(--space-md);
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
          transition: all var(--transition-fast);
        }
        .task-item:hover { background: var(--bg-tertiary); }
        .task-item.completed { opacity: 0.5; }
        .task-item.completed .task-title { text-decoration: line-through; }
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
        .delete-btn {
          opacity: 0;
          font-size: 1.25rem;
          line-height: 1;
        }
        .task-item:hover .delete-btn { opacity: 1; }
        .completed-section { margin-top: var(--space-xl); opacity: 0.7; }
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
      `}</style>
        </div>
    )
}
