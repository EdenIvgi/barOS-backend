import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { loadItems, removeItem } from '../store/actions/item.actions'
// Categories are now loaded from items, so we don't need to load from backend
// import { loadCategories } from '../store/actions/category.actions'
import { itemService } from '../services/item.service'
import { Loader } from '../cmps/Loader'
import { showSuccessMsg, showErrorMsg } from '../services/event-bus.service'

export function ItemsManagementPage() {
  const items = useSelector((storeState) => storeState.itemModule.items)
  // Categories are now loaded from items, so we don't need categories from store
  // const categories = useSelector((storeState) => storeState.categoryModule.categories)
  const isLoading = useSelector((storeState) => storeState.itemModule.flag.isLoading)

  const [isEditing, setIsEditing] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [filters, setFilters] = useState({
    category: '',
    supplier: '',
    isAvailable: ''
  })

  useEffect(() => {
    loadItems()
    // Categories are now loaded from items, so we don't need to load from backend
    // loadCategories().catch((error) => {
    //   console.error('Failed to load categories:', error)
    //   // Don't show error - categories are loaded from items
    // })
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
    }
  }

  function handleEdit(item) {
    // Prepare item for editing
    const itemToEdit = { ...item }
    
    // Handle category - prioritize category string from items
    if (itemToEdit.category) {
      if (typeof itemToEdit.category === 'string') {
        // Use category string directly
        itemToEdit.categoryId = itemToEdit.category
      } else if (itemToEdit.category.name) {
        // If category is an object with name, use the name
        itemToEdit.categoryId = itemToEdit.category.name
      }
    } else if (itemToEdit.categoryId) {
      // If only categoryId exists, check if it's a string (category name) or ObjectId
      if (typeof itemToEdit.categoryId === 'object') {
        // If it's an ObjectId object, convert to string
        itemToEdit.categoryId = itemToEdit.categoryId.toString()
      } else if (typeof itemToEdit.categoryId !== 'string') {
        // If it's not a string, convert it
        itemToEdit.categoryId = String(itemToEdit.categoryId)
      }
      // If categoryId is a short string (not ObjectId), it's likely a category name
      // Keep it as is for the select
    }
    
    setEditingItem(itemToEdit)
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
      
      // Handle category - if categoryId is selected, use it as category string
      if (itemToSave.categoryId) {
        // If categoryId is a string (category name from items), save it as category
        if (typeof itemToSave.categoryId === 'string' && !itemToSave.categoryId.match(/^[0-9a-fA-F]{24}$/)) {
          // It's a category name, not ObjectId - save as category string
          itemToSave.category = itemToSave.categoryId
          // Keep categoryId for backward compatibility, or remove it
          // itemToSave.categoryId = undefined
        } else if (typeof itemToSave.categoryId === 'object') {
          // If it's an object, convert to string
          itemToSave.categoryId = itemToSave.categoryId._id || itemToSave.categoryId.toString()
        }
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

  // Extract unique category values from items
  const getUniqueCategoriesFromItems = () => {
    if (!items || !Array.isArray(items)) return []
    
    const categorySet = new Set()
    items.forEach((item) => {
      // Try to get category from different sources
      if (item.category) {
        if (typeof item.category === 'string') {
          categorySet.add(item.category)
        } else if (item.category.name) {
          categorySet.add(item.category.name)
        }
      }
      if (item.categoryId && typeof item.categoryId === 'string' && item.categoryId.length < 24) {
        // If categoryId is a short string (not ObjectId), it might be a category name
        categorySet.add(item.categoryId)
      }
    })
    
    return Array.from(categorySet).sort()
  }

  const uniqueCategories = getUniqueCategoriesFromItems()

  // Extract unique supplier values from items
  const getUniqueSuppliersFromItems = () => {
    if (!items || !Array.isArray(items)) return []
    
    const supplierSet = new Set()
    items.forEach((item) => {
      if (item.supplier && item.supplier.trim()) {
        supplierSet.add(item.supplier.trim())
      }
    })
    
    return Array.from(supplierSet).sort()
  }

  const uniqueSuppliers = getUniqueSuppliersFromItems()

  // Helper function to get category name from item
  const getCategoryName = (item) => {
    // First try to get category from embedded category object
    if (item?.category?.name) {
      return item.category.name
    }
    
    // If category is a string (from database), use it directly
    if (item?.category && typeof item.category === 'string') {
      return item.category
    }
    
    // Fallback: use categoryId if it's a string (category name)
    const categoryId = item?.categoryId
    if (categoryId) {
      if (typeof categoryId === 'string' && categoryId.length < 24) {
        // If categoryId is a short string (not ObjectId), it's likely a category name
        return categoryId
      } else if (typeof categoryId === 'string') {
        return categoryId
      } else if (typeof categoryId === 'object') {
        return categoryId.toString()
      }
    }
    
    return 'ללא קטגוריה'
  }

  // Filter items based on filters
  const filteredItems = items?.filter((item) => {
    // Category filter
    if (filters.category) {
      const categoryName = getCategoryName(item)
      if (categoryName !== filters.category) return false
    }

    // Supplier filter
    if (filters.supplier) {
      if (!item.supplier || item.supplier !== filters.supplier) {
        return false
      }
    }

    // Availability filter
    if (filters.isAvailable !== '') {
      const isAvailableFilter = filters.isAvailable === 'true'
      if (item.isAvailable !== isAvailableFilter) return false
    }

    return true
  }) || []

  function handleFilterChange(ev) {
    const { name, value } = ev.target
    setFilters((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  function handleClearFilters() {
    setFilters({
      category: '',
      supplier: '',
      isAvailable: ''
    })
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
                  value={editingItem?.categoryId || editingItem?.category || ''}
                  onChange={handleChange}
                  required
                >
                  <option value="">בחר קטגוריה</option>
                  {uniqueCategories.length > 0 ? (
                    uniqueCategories.map((categoryName) => (
                      <option key={categoryName} value={categoryName}>
                        {categoryName}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>
                      אין קטגוריות זמינות
                    </option>
                  )}
                </select>
                {uniqueCategories.length > 0 && (
                  <div className="form-hint" style={{ color: '#666', fontSize: '0.85em', marginTop: '5px' }}>
                    נמצאו {uniqueCategories.length} קטגוריות מהמוצרים הקיימים
                  </div>
                )}
                {uniqueCategories.length === 0 && items && items.length > 0 && (
                  <div className="form-hint" style={{ color: '#999', fontSize: '0.85em', marginTop: '5px' }}>
                    לא נמצאו קטגוריות במוצרים הקיימים
                  </div>
                )}
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

      {!items || items.length === 0 ? (
        <p className="empty-message">אין מוצרים במערכת</p>
      ) : (
        <>
          <div className="filters-container" style={{ 
            marginBottom: '20px', 
            padding: '15px', 
            backgroundColor: '#f5f5f5', 
            borderRadius: '8px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '15px',
            alignItems: 'flex-end'
          }}>
            <div style={{ flex: '1 1 150px', minWidth: '150px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em' }}>
                קטגוריה:
              </label>
              <select
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              >
                <option value="">כל הקטגוריות</option>
                {uniqueCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ flex: '1 1 150px', minWidth: '150px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em' }}>
                ספק:
              </label>
              <select
                name="supplier"
                value={filters.supplier}
                onChange={handleFilterChange}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              >
                <option value="">כל הספקים</option>
                {uniqueSuppliers.map((supplier) => (
                  <option key={supplier} value={supplier}>
                    {supplier}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ flex: '1 1 120px', minWidth: '120px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em' }}>
                זמינות:
              </label>
              <select
                name="isAvailable"
                value={filters.isAvailable}
                onChange={handleFilterChange}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              >
                <option value="">הכל</option>
                <option value="true">זמין</option>
                <option value="false">לא זמין</option>
              </select>
            </div>

            <div style={{ flex: '0 0 auto' }}>
              <button
                onClick={handleClearFilters}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                נקה פילטרים
              </button>
            </div>

            <div style={{ flex: '1 1 100%', marginTop: '10px', fontSize: '0.9em', color: '#666' }}>
              מציג {filteredItems.length} מתוך {items.length} מוצרים
            </div>
          </div>

          <div className="table-container">
            <table className="items-table">
            <thead>
              <tr>
                <th>שם</th>
                <th>קטגוריה</th>
                <th>ספק</th>
                <th>מחיר</th>
                <th>מלאי</th>
                <th>רף התראה</th>
                <th>זמין</th>
                <th>פעולות</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                    לא נמצאו מוצרים התואמים לפילטרים שנבחרו
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
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
                  <td>{getCategoryName(item)}</td>
                  <td>{item.supplier || '-'}</td>
                  <td>₪{item.price}</td>
                  <td>
                    <span
                      className={`stock-badge ${
                        item.stockQuantity <= (item.minStockLevel || 0)
                          ? 'low'
                          : 'ok'
                      }`}
                    >
                      {item.stockQuantity ?? 0}
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
                ))
              )}
            </tbody>
          </table>
        </div>
        </>
      )}
    </div>
  )
}
