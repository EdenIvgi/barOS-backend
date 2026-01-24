import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { loadItems, removeItem } from '../store/actions/item.actions'
import { loadCategories } from '../store/actions/category.actions'
import { itemService } from '../services/item.service'
import { categoryService } from '../services/category.service'
import { Loader } from '../cmps/Loader'
import { showSuccessMsg, showErrorMsg } from '../services/event-bus.service'

export function ItemsManagementPage() {
  const items = useSelector((storeState) => storeState.itemModule.items)
  const categories = useSelector((storeState) => storeState.categoryModule.categories)
  const isLoading = useSelector((storeState) => storeState.itemModule.flag.isLoading)

  const [isEditing, setIsEditing] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    loadItems()
    loadCategories()
  }, [])

  async function handleDelete(itemId) {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק את הפריט?')) {
      return
    }

    try {
      await removeItem(itemId)
      showSuccessMsg('הפריט נמחק בהצלחה')
    } catch (error) {
      showErrorMsg('שגיאה במחיקת הפריט')
      console.error('Delete error:', error)
    }
  }

  function handleEdit(item) {
    setEditingItem({ ...item })
    setIsEditing(true)
    setShowForm(true)
  }

  function handleAdd() {
    setEditingItem(itemService.getEmptyItem())
    setIsEditing(false)
    setShowForm(true)
  }

  function handleCancel() {
    setShowForm(false)
    setEditingItem(null)
    setIsEditing(false)
  }

  async function handleSubmit(ev) {
    ev.preventDefault()
    try {
      const itemToSave = { ...editingItem }
      
      // Convert categoryId to string if it's an object
      if (itemToSave.categoryId && typeof itemToSave.categoryId === 'object') {
        itemToSave.categoryId = itemToSave.categoryId._id || itemToSave.categoryId
      }

      if (isEditing) {
        await itemService.save(itemToSave)
        showSuccessMsg('הפריט עודכן בהצלחה')
      } else {
        await itemService.save(itemToSave)
        showSuccessMsg('הפריט נוסף בהצלחה')
      }

      await loadItems()
      handleCancel()
    } catch (error) {
      showErrorMsg('שגיאה בשמירת הפריט')
      console.error('Save error:', error)
    }
  }

  function handleChange(ev) {
    const { name, value, type, checked } = ev.target
    setEditingItem((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? +value : value,
    }))
  }

  if (isLoading) return <Loader />

  const getCategoryName = (categoryId) => {
    if (!categoryId) return 'ללא קטגוריה'
    const category = categories.find((cat) => cat._id === categoryId)
    return category ? category.name : 'ללא קטגוריה'
  }

  return (
    <div className="items-management-page">
      <div className="page-header">
        <h1>ניהול מוצרים</h1>
        <button className="btn-add" onClick={handleAdd}>
          + הוסף מוצר חדש
        </button>
      </div>

      {showForm && (
        <div className="form-overlay" onClick={handleCancel}>
          <div className="form-container" onClick={(e) => e.stopPropagation()}>
            <h2>{isEditing ? 'ערוך מוצר' : 'הוסף מוצר חדש'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>שם (עברית):</label>
                <input
                  type="text"
                  name="name"
                  value={editingItem?.name || ''}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>שם (אנגלית):</label>
                <input
                  type="text"
                  name="nameEn"
                  value={editingItem?.nameEn || ''}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>תיאור:</label>
                <textarea
                  name="description"
                  value={editingItem?.description || ''}
                  onChange={handleChange}
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>קטגוריה:</label>
                <select
                  name="categoryId"
                  value={editingItem?.categoryId || ''}
                  onChange={handleChange}
                  required
                >
                  <option value="">בחר קטגוריה</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>מחיר:</label>
                  <input
                    type="number"
                    name="price"
                    value={editingItem?.price || 0}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>כמות במלאי:</label>
                  <input
                    type="number"
                    name="stockQuantity"
                    value={editingItem?.stockQuantity || 0}
                    onChange={handleChange}
                    min="0"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>רף התראה:</label>
                  <input
                    type="number"
                    name="minStockLevel"
                    value={editingItem?.minStockLevel || 0}
                    onChange={handleChange}
                    min="0"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>תמונה (URL):</label>
                <input
                  type="url"
                  name="imageUrl"
                  value={editingItem?.imageUrl || ''}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="isAvailable"
                    checked={editingItem?.isAvailable || false}
                    onChange={handleChange}
                  />
                  זמין להזמנה
                </label>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-save">
                  {isEditing ? 'עדכן' : 'שמור'}
                </button>
                <button type="button" className="btn-cancel" onClick={handleCancel}>
                  ביטול
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <p className="empty-message">אין מוצרים במערכת</p>
      ) : (
        <div className="table-container">
          <table className="items-table">
            <thead>
              <tr>
                <th>שם</th>
                <th>קטגוריה</th>
                <th>מחיר</th>
                <th>מלאי</th>
                <th>רף התראה</th>
                <th>זמין</th>
                <th>פעולות</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id}>
                  <td>
                    <div className="item-name-cell">
                      {item.imageUrl && (
                        <img src={item.imageUrl} alt={item.name} className="item-thumb" />
                      )}
                      <div>
                        <strong>{item.name}</strong>
                        {item.description && (
                          <div className="item-description">{item.description}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>{getCategoryName(item.categoryId)}</td>
                  <td>₪{item.price}</td>
                  <td>
                    <span
                      className={`stock-badge ${
                        item.stockQuantity === 0
                          ? 'unlimited'
                          : item.stockQuantity <= item.minStockLevel
                          ? 'low'
                          : 'ok'
                      }`}
                    >
                      {item.stockQuantity === 0 ? 'ללא הגבלה' : item.stockQuantity}
                    </span>
                  </td>
                  <td>{item.minStockLevel || '-'}</td>
                  <td>
                    <span className={`status-badge ${item.isAvailable ? 'available' : 'unavailable'}`}>
                      {item.isAvailable ? '✓ זמין' : '✗ לא זמין'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-edit"
                        onClick={() => handleEdit(item)}
                        title="ערוך"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(item._id)}
                        title="מחק"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
