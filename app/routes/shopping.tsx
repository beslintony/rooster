import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/shopping')({
    component: ShoppingPage,
})

type ListType = 'shopping' | 'wishlist'

interface ShoppingItem {
    id: string
    name: string
    category: string
    quantity: number
    unit?: string
    purchased: boolean
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
}

const CATEGORIES = ['🥬 Produce', '🥛 Dairy', '🥩 Meat', '🍞 Bakery', '🥫 Pantry', '🧹 Household', '✨ Other']

function ShoppingPage() {
    const [listType, setListType] = useState<ListType>('shopping')
    const [newItem, setNewItem] = useState('')
    const [items, setItems] = useState<ShoppingItem[]>([
        { id: '1', name: 'Milk', category: '🥛 Dairy', quantity: 2, unit: 'L', purchased: false, priority: 'NORMAL' },
        { id: '2', name: 'Bread', category: '🍞 Bakery', quantity: 1, purchased: false, priority: 'HIGH' },
        { id: '3', name: 'Apples', category: '🥬 Produce', quantity: 6, purchased: true, priority: 'LOW' },
    ])

    const togglePurchased = (id: string) => {
        setItems(items.map(item =>
            item.id === id ? { ...item, purchased: !item.purchased } : item
        ))
    }

    const addItem = (e: React.FormEvent) => {
        e.preventDefault()
        if (!newItem.trim()) return

        const item: ShoppingItem = {
            id: Date.now().toString(),
            name: newItem,
            category: '✨ Other',
            quantity: 1,
            purchased: false,
            priority: 'NORMAL',
        }
        setItems([...items, item])
        setNewItem('')
    }

    const deleteItem = (id: string) => {
        setItems(items.filter(item => item.id !== id))
    }

    const unpurchasedItems = items.filter(i => !i.purchased)
    const purchasedItems = items.filter(i => i.purchased)

    const groupedItems = unpurchasedItems.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = []
        acc[item.category].push(item)
        return acc
    }, {} as Record<string, ShoppingItem[]>)

    return (
        <div className="shopping-page">
            <div className="shopping-header">
                <h1>🛒 {listType === 'shopping' ? 'Shopping List' : 'Wish List'}</h1>
                <div className="list-toggle">
                    <button
                        onClick={() => setListType('shopping')}
                        className={`btn ${listType === 'shopping' ? 'btn-primary' : 'btn-ghost'}`}
                    >
                        Shopping
                    </button>
                    <button
                        onClick={() => setListType('wishlist')}
                        className={`btn ${listType === 'wishlist' ? 'btn-primary' : 'btn-ghost'}`}
                    >
                        Wish List
                    </button>
                </div>
            </div>

            <form onSubmit={addItem} className="add-item-form">
                <input
                    type="text"
                    className="input"
                    placeholder="Add an item..."
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                />
                <button type="submit" className="btn btn-primary">Add</button>
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
                        <h3 className="category-title">✅ Purchased ({purchasedItems.length})</h3>
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

                {items.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-state-icon">🧺</div>
                        <p>Your {listType === 'shopping' ? 'shopping' : 'wish'} list is empty</p>
                    </div>
                )}
            </div>

            <style>{`
        .shopping-page { max-width: 800px; margin: 0 auto; }
        .shopping-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-lg);
        }
        .shopping-header h1 { font-size: 1.5rem; }
        .list-toggle {
          display: flex;
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
          padding: 2px;
        }
        .add-item-form {
          display: flex;
          gap: var(--space-sm);
          margin-bottom: var(--space-xl);
        }
        .add-item-form .input { flex: 1; }
        .category-group {
          margin-bottom: var(--space-lg);
        }
        .category-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-secondary);
          margin-bottom: var(--space-sm);
          padding-bottom: var(--space-xs);
          border-bottom: 1px solid var(--bg-tertiary);
        }
        .items-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-xs);
        }
        .shopping-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-sm) var(--space-md);
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
          border-left: 3px solid transparent;
          transition: all var(--transition-fast);
        }
        .shopping-item:hover { background: var(--bg-tertiary); }
        .shopping-item.priority-high { border-left-color: var(--accent-warning); }
        .shopping-item.priority-urgent { border-left-color: var(--accent-danger); }
        .shopping-item.purchased { opacity: 0.5; }
        .shopping-item.purchased .item-name { text-decoration: line-through; }
        .item-name { font-weight: 500; }
        .item-quantity {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-left: var(--space-sm);
        }
        .delete-btn {
          opacity: 0;
          font-size: 1.25rem;
          line-height: 1;
          padding: var(--space-xs);
        }
        .shopping-item:hover .delete-btn { opacity: 1; }
        .purchased-group { opacity: 0.7; }
      `}</style>
        </div>
    )
}
