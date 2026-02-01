import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useI18n } from '~/lib/i18n'
import { useAuth } from '~/lib/auth'

export const Route = createFileRoute('/shopping')({
    component: ShoppingPage,
})

type ListType = 'personal' | 'shared'

interface ShoppingItem {
    id: string
    name: string
    category: string
    quantity: number
    unit?: string
    purchased: boolean
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
    addedBy?: string
}

interface SharedList {
    id: string
    name: string
    members: { id: string; username: string; displayName: string | null }[]
}

interface ConnectedUser {
    id: string
    username: string
    displayName: string | null
}

const CATEGORIES = ['🥬 Produce', '🥛 Dairy', '🥩 Meat', '🍞 Bakery', '🥫 Pantry', '🧹 Household', '✨ Other']
const CATEGORIES_DE = ['🥬 Obst & Gemüse', '🥛 Milchprodukte', '🥩 Fleisch', '🍞 Bäckerei', '🥫 Vorrat', '🧹 Haushalt', '✨ Sonstiges']

function ShoppingPage() {
    const { t, language } = useI18n()
    const { user, isAuthenticated } = useAuth()
    const [listType, setListType] = useState<ListType>('personal')
    const [newItem, setNewItem] = useState('')
    const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([])
    const [sharedLists, setSharedLists] = useState<SharedList[]>([
        { id: 'family', name: language === 'de' ? 'Familieneinkauf' : 'Family Shopping', members: [] }
    ])
    const [currentListId, setCurrentListId] = useState<string>('personal')
    const [showShareModal, setShowShareModal] = useState(false)
    const [items, setItems] = useState<ShoppingItem[]>([])
    const [sharedItems, setSharedItems] = useState<ShoppingItem[]>([])

    useEffect(() => {
        if (isAuthenticated) {
            fetchConnections()
            fetchItems()
        }
    }, [isAuthenticated])

    const fetchItems = async () => {
        try {
            const res = await fetch('/api/shopping', { credentials: 'include' })
            if (res.ok) {
                const data = await res.json()
                // Split into personal/shared if needed, or just put all in items for now
                // Backend integration for Shared Lists is pending in phase 4/5 full scope.
                // For now, we put everything in 'items' (Personal view) or handle simple logic
                setItems(data.items)
            }
        } catch (error) {
            console.error('Failed to fetch items:', error)
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

    const currentItems = listType === 'personal' ? items : sharedItems
    const setCurrentItems = listType === 'personal' ? setItems : setSharedItems

    const togglePurchased = async (id: string) => {
        const item = currentItems.find(i => i.id === id)
        if (!item) return

        try {
            const res = await fetch(`/api/shopping/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ purchased: !item.purchased })
            })
            if (res.ok) {
                setCurrentItems(currentItems.map(i =>
                    i.id === id ? { ...i, purchased: !i.purchased } : i
                ))
            }
        } catch (error) {
            console.error('Failed to update item:', error)
        }
    }

    const addItem = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newItem.trim()) return

        try {
            const res = await fetch('/api/shopping', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newItem,
                    quantity: 1,
                    category: '✨ Other', // Default category
                    priority: 'NORMAL'
                })
            })

            if (res.ok) {
                const data = await res.json()
                setCurrentItems([...currentItems, data.item])
                setNewItem('')
            }
        } catch (error) {
            console.error('Failed to add item:', error)
        }
    }

    const deleteItem = async (id: string) => {
        try {
            const res = await fetch(`/api/shopping/${id}`, { method: 'DELETE' })
            if (res.ok) {
                setCurrentItems(currentItems.filter(item => item.id !== id))
            }
        } catch (error) {
            console.error('Failed to delete item:', error)
        }
    }

    const unpurchasedItems = currentItems.filter(i => !i.purchased)
    const purchasedItems = currentItems.filter(i => i.purchased)

    const groupedItems = unpurchasedItems.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = []
        acc[item.category].push(item)
        return acc
    }, {} as Record<string, ShoppingItem[]>)

    const categories = language === 'de' ? CATEGORIES_DE : CATEGORIES

    return (
        <div className="shopping-page">
            <div className="shopping-header">
                <h1>🛒 {t('shopping.title')}</h1>
                {isAuthenticated && (
                    <div className="list-toggle">
                        <button
                            onClick={() => setListType('personal')}
                            className={`btn ${listType === 'personal' ? 'btn-primary' : 'btn-ghost'}`}
                        >
                            👤 {language === 'de' ? 'Meine Liste' : 'My List'}
                        </button>
                        <button
                            onClick={() => setListType('shared')}
                            className={`btn ${listType === 'shared' ? 'btn-primary' : 'btn-ghost'}`}
                        >
                            👥 {language === 'de' ? 'Geteilt' : 'Shared'}
                        </button>
                    </div>
                )}
            </div>

            {listType === 'shared' && isAuthenticated && (
                <div className="shared-list-info card">
                    <div className="shared-header">
                        <span className="shared-title">
                            📋 {sharedLists[0]?.name || (language === 'de' ? 'Geteilte Liste' : 'Shared List')}
                        </span>
                        <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setShowShareModal(true)}
                        >
                            {language === 'de' ? '+ Teilen' : '+ Share'}
                        </button>
                    </div>
                    <div className="shared-members">
                        <span className="member-chip">👤 {language === 'de' ? 'Du' : 'You'}</span>
                        {connectedUsers.map(u => (
                            <span key={u.id} className="member-chip">👥 {u.displayName || u.username}</span>
                        ))}
                        {connectedUsers.length === 0 && (
                            <Link to="/connections" className="invite-link">
                                {language === 'de' ? '+ Freunde einladen' : '+ Invite friends'}
                            </Link>
                        )}
                    </div>
                </div>
            )}

            {!isAuthenticated && (
                <div className="login-prompt card">
                    <p>
                        {language === 'de'
                            ? '💡 Melde dich an, um Listen mit Freunden und Familie zu teilen!'
                            : '💡 Sign in to share lists with friends and family!'}
                    </p>
                    <Link to="/login" className="btn btn-secondary">
                        {language === 'de' ? 'Anmelden' : 'Sign In'}
                    </Link>
                </div>
            )}

            <form onSubmit={addItem} className="add-item-form">
                <input
                    type="text"
                    className="input"
                    placeholder={t('shopping.addItem')}
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                />
                <button type="submit" className="btn btn-primary">{t('common.add')}</button>
            </form>

            <div className="shopping-content">
                {Object.entries(groupedItems).map(([category, categoryItems]) => (
                    <div key={category} className="category-group">
                        <h3 className="category-title">{category}</h3>
                        <div className="items-list">
                            {categoryItems.map(item => (
                                <div key={item.id} className={`shopping-item priority-${item.priority.toLowerCase()}`}>
                                    <label className="checkbox-wrapper">
                                        <input
                                            type="checkbox"
                                            className="checkbox"
                                            checked={item.purchased}
                                            onChange={() => togglePurchased(item.id)}
                                        />
                                        <span className="item-name">{item.name}</span>
                                        {item.quantity > 1 && (
                                            <span className="item-quantity">
                                                × {item.quantity} {item.unit || ''}
                                            </span>
                                        )}
                                    </label>
                                    {item.addedBy && (
                                        <span className="added-by">
                                            {language === 'de' ? 'von' : 'by'} {item.addedBy}
                                        </span>
                                    )}
                                    <button
                                        onClick={() => deleteItem(item.id)}
                                        className="btn btn-ghost delete-btn"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {purchasedItems.length > 0 && (
                    <div className="category-group purchased-group">
                        <h3 className="category-title">✅ {t('shopping.purchased')} ({purchasedItems.length})</h3>
                        <div className="items-list">
                            {purchasedItems.map(item => (
                                <div key={item.id} className="shopping-item purchased">
                                    <label className="checkbox-wrapper">
                                        <input
                                            type="checkbox"
                                            className="checkbox"
                                            checked={item.purchased}
                                            onChange={() => togglePurchased(item.id)}
                                        />
                                        <span className="item-name">{item.name}</span>
                                    </label>
                                    <button
                                        onClick={() => deleteItem(item.id)}
                                        className="btn btn-ghost delete-btn"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {currentItems.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-state-icon">🛒</div>
                        <p>{t('shopping.emptyList')}</p>
                    </div>
                )}
            </div>

            {/* Share Modal */}
            {showShareModal && (
                <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>{language === 'de' ? 'Liste teilen' : 'Share List'}</h3>
                        <div className="share-options">
                            {connectedUsers.length > 0 ? (
                                connectedUsers.map(u => (
                                    <label key={u.id} className="share-option">
                                        <input type="checkbox" defaultChecked />
                                        <span>👥 {u.displayName || u.username}</span>
                                    </label>
                                ))
                            ) : (
                                <p className="no-connections">
                                    {language === 'de'
                                        ? 'Keine Verbindungen. Lade zuerst Freunde ein.'
                                        : 'No connections. Invite friends first.'}
                                </p>
                            )}
                        </div>
                        <div className="modal-actions">
                            <button className="btn btn-ghost" onClick={() => setShowShareModal(false)}>
                                {language === 'de' ? 'Abbrechen' : 'Cancel'}
                            </button>
                            <Link to="/connections" className="btn btn-secondary">
                                {language === 'de' ? '+ Einladen' : '+ Invite'}
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        .shopping-page { max-width: 700px; margin: 0 auto; }
        
        /* Header */
        .shopping-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-md);
          flex-wrap: wrap;
          gap: var(--space-sm);
        }
        .shopping-header h1 { 
          font-size: var(--font-lg); 
          font-weight: var(--font-weight-bold);
        }
        
        /* List Toggle */
        .list-toggle {
          display: flex;
          gap: 2px;
          background: var(--bg-tertiary);
          border-radius: var(--radius-lg);
          padding: 3px;
        }
        .list-toggle .btn {
          min-height: var(--touch-target-sm);
          padding: 6px 12px;
          font-size: var(--font-xs);
          border-radius: var(--radius-md);
        }
        
        /* Shared List Info */
        .shared-list-info {
          margin-bottom: var(--space-md);
          padding: var(--space-md);
        }
        .shared-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-sm);
        }
        .shared-title { font-weight: var(--font-weight-semibold); font-size: var(--font-sm); }
        .shared-members { display: flex; gap: var(--space-xs); flex-wrap: wrap; }
        .member-chip {
          padding: 4px 10px;
          background: var(--bg-tertiary);
          border-radius: var(--radius-full);
          font-size: var(--font-xs);
        }
        .invite-link {
          color: var(--accent-primary);
          font-size: var(--font-xs);
          padding: 4px 10px;
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
        
        /* Add Item Form */
        .add-item-form {
          display: flex;
          gap: var(--space-sm);
          margin-bottom: var(--space-lg);
          position: sticky;
          top: 60px;
          background: var(--bg-primary);
          padding: var(--space-sm) 0;
          z-index: 10;
        }
        .add-item-form .input { 
          flex: 1; 
          min-height: var(--touch-target-min);
        }
        .add-item-form .btn {
          min-height: var(--touch-target-min);
        }
        
        /* Category Groups */
        .category-group { 
          margin-bottom: var(--space-md);
          background: var(--bg-secondary);
          border: 1px solid var(--bg-tertiary);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }
        .category-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: var(--font-sm);
          font-weight: var(--font-weight-semibold);
          color: var(--text-secondary);
          padding: var(--space-sm) var(--space-md);
          background: var(--bg-tertiary);
          margin: 0;
        }
        .items-list {
          display: flex;
          flex-direction: column;
        }
        
        /* Shopping Items */
        .shopping-item {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-sm) var(--space-md);
          border-bottom: 1px solid var(--bg-tertiary);
          min-height: var(--touch-target-min);
          border-left: 3px solid transparent;
        }
        .shopping-item:last-child { border-bottom: none; }
        .shopping-item.priority-high { border-left-color: var(--accent-warning); }
        .shopping-item.priority-urgent { border-left-color: var(--accent-danger); }
        .shopping-item.purchased { opacity: 0.5; }
        .shopping-item.purchased .item-name { text-decoration: line-through; }
        
        .checkbox-wrapper {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          flex: 1;
          cursor: pointer;
        }
        .checkbox-wrapper input[type="checkbox"] {
          width: 22px;
          height: 22px;
        }
        .item-name { font-size: var(--font-sm); }
        .item-quantity {
          font-size: var(--font-xs);
          color: var(--text-muted);
          margin-left: var(--space-xs);
        }
        .added-by {
          font-size: var(--font-xs);
          color: var(--accent-secondary);
        }
        .delete-btn {
          opacity: 0.3;
          font-size: 1.25rem;
          min-width: 36px;
          min-height: 36px;
          padding: 0;
          color: var(--text-muted);
        }
        .shopping-item:hover .delete-btn,
        .delete-btn:focus { opacity: 1; color: var(--accent-danger); }
        
        .purchased-group { opacity: 0.7; }
        
        /* Empty State */
        .empty-state {
          text-align: center;
          padding: var(--space-2xl) var(--space-md);
          color: var(--text-muted);
        }
        .empty-state-icon { font-size: 3rem; margin-bottom: var(--space-sm); }
        .empty-state p { font-size: var(--font-sm); margin: 0; }
        
        /* Modal */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          padding: var(--space-md);
        }
        .modal {
          background: var(--bg-secondary);
          border-radius: var(--radius-xl);
          padding: var(--space-lg);
          width: 100%;
          max-width: 360px;
        }
        .modal h3 { 
          margin-bottom: var(--space-md); 
          font-size: var(--font-md);
        }
        .share-options {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
          margin-bottom: var(--space-lg);
        }
        .share-option {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-sm);
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
          cursor: pointer;
        }
        .no-connections {
          color: var(--text-muted);
          font-size: var(--font-sm);
        }
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: var(--space-sm);
        }
        
        /* Mobile */
        @media (max-width: 640px) {
          .shopping-header { 
            flex-direction: column;
            align-items: stretch;
          }
          .shopping-header h1 { font-size: var(--font-md); }
          .list-toggle { width: 100%; }
          .list-toggle .btn { flex: 1; }
          
          .add-item-form {
            top: 52px;
          }
          
          .login-prompt {
            flex-direction: column;
            text-align: center;
          }
          
          .delete-btn { opacity: 0.5; }
          
          .modal { padding: var(--space-md); }
        }
      `}</style>
        </div>
    )
}
