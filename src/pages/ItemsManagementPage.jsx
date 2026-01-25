import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { loadItems, removeItem } from '../store/actions/item.actions'
// Categories are now loaded from items, so we don't need to load from backend
// import { loadCategories } from '../store/actions/category.actions'
import { itemService } from '../services/item.service'
import { orderService } from '../services/order.service'
import { Loader } from '../cmps/Loader'
import { showSuccessMsg, showErrorMsg } from '../services/event-bus.service'

export function ItemsManagementPage() {
  const items = useSelector((storeState) => storeState.itemModule.items)
  const user = useSelector((storeState) => storeState.userModule.loggedInUser)
  // Categories are now loaded from items, so we don't need categories from store
  // const categories = useSelector((storeState) => storeState.categoryModule.categories)
  const isLoading = useSelector((storeState) => storeState.itemModule.flag.isLoading)
  const navigate = useNavigate()

  const [isEditing, setIsEditing] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [filters, setFilters] = useState({
    category: '',
    supplier: '',
    stockStatus: ''
  })
  const [editingToOrder, setEditingToOrder] = useState({}) // Track which items are being edited

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

    // Stock status filter (in stock / out of stock / low stock)
    if (filters.stockStatus !== '') {
      const stockQuantity = item.stockQuantity ?? 0
      const minStockLevel = item.minStockLevel || 0
      
      if (filters.stockStatus === 'inStock' && stockQuantity <= 0) return false
      if (filters.stockStatus === 'outOfStock' && stockQuantity > 0) return false
      if (filters.stockStatus === 'lowStock' && stockQuantity > minStockLevel) return false
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
      stockStatus: ''
    })
  }

  async function handleToOrderChange(item, newToOrderValue) {
    try {
      const newToOrder = Math.max(0, Number(newToOrderValue) || 0)
      const currentStock = item.stockQuantity || 0
      const newOptimalStock = currentStock + newToOrder
      
      // Update the item's optimalStockLevel
      const updatedItem = {
        ...item,
        optimalStockLevel: newOptimalStock
      }
      
      await itemService.save(updatedItem)
      await loadItems()
      showSuccessMsg('כמות אופטימלית עודכנה')
    } catch (error) {
      showErrorMsg('שגיאה בעדכון הכמות האופטימלית')
    }
  }

  async function handleCreateOrder() {
    try {
      // Collect all items that need to be ordered (toOrder > 0)
      const itemsToOrder = filteredItems
        .map((item) => {
          const optimalStock = item.optimalStockLevel || 0
          const currentStock = item.stockQuantity || 0
          const toOrder = Math.max(0, optimalStock - currentStock)
          
          if (toOrder > 0) {
            return {
              itemId: item._id,
              name: item.name,
              quantity: toOrder,
              price: item.price || 0,
              subtotal: (item.price || 0) * toOrder
            }
          }
          return null
        })
        .filter(item => item !== null)

      if (itemsToOrder.length === 0) {
        showErrorMsg('אין מוצרים להזמין')
        return
      }

      // Create order
      const order = {
        items: itemsToOrder,
        userId: user?._id || null,
        status: 'pending',
        type: 'stock_order' // Mark as stock order
      }

      await orderService.save(order)
      showSuccessMsg(`הזמנה נוצרה בהצלחה עם ${itemsToOrder.length} מוצרים`)
      
      // Navigate to orders page
      navigate('/orders')
    } catch (error) {
      showErrorMsg('שגיאה ביצירת ההזמנה')
    }
  }

  // Calculate total items to order
  const totalItemsToOrder = filteredItems.reduce((sum, item) => {
    const optimalStock = item.optimalStockLevel || 0
    const currentStock = item.stockQuantity || 0
    const toOrder = Math.max(0, optimalStock - currentStock)
    return sum + (toOrder > 0 ? 1 : 0)
  }, 0)

  return (
    <div className="items-management-page">
      {!items || items.length === 0 ? (
        <p className="empty-message">אין מוצרים במערכת</p>
      ) : (
        <>
          <div className="filters-container">
            <div>
              <label>
                קטגוריה
              </label>
              <select
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
              >
                <option value="">כל הקטגוריות</option>
                {uniqueCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>
                ספק
              </label>
              <select
                name="supplier"
                value={filters.supplier}
                onChange={handleFilterChange}
              >
                <option value="">כל הספקים</option>
                {uniqueSuppliers.map((supplier) => (
                  <option key={supplier} value={supplier}>
                    {supplier}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>
                מלאי
              </label>
              <select
                name="stockStatus"
                value={filters.stockStatus}
                onChange={handleFilterChange}
              >
                <option value="">הכל</option>
                <option value="inStock">במלאי</option>
                <option value="outOfStock">לא במלאי</option>
                <option value="lowStock">מלאי נמוך</option>
              </select>
            </div>

            <div className="filter-info">
              מציג {filteredItems.length} מתוך {items.length} מוצרים
            </div>

            <div>
              <button
                onClick={handleClearFilters}
                className="clear-filters-btn"
              >
                נקה פילטרים
              </button>
            </div>
          </div>

          <div className="header-actions">
            {totalItemsToOrder > 0 && (
              <button 
                className="btn-create-order" 
                onClick={handleCreateOrder}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 7L12 3L4 7M20 7L12 11M20 7V17L12 21M12 11L4 7M12 11V21M4 7V17L12 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                צור הזמנה ({totalItemsToOrder})
              </button>
            )}
            <button className="btn-add" onClick={handleAdd}>
              + הוסף מוצר
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

                <div className="form-group">
                  <label>כמות אופטימלית למלאי:</label>
                  <input
                    type="number"
                    name="optimalStockLevel"
                    value={editingItem?.optimalStockLevel || 0}
                    onChange={handleChange}
                    min="0"
                    required
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

          <div className="table-container">
            <table className="items-table">
            <thead>
              <tr>
                <th>שם</th>
                <th>קטגוריה</th>
                <th>ספק</th>
                <th>מחיר</th>
                <th>מלאי</th>
                <th>כמה להזמין</th>
                <th>פעולות</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-table-message">
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
                  <td>
                    {(() => {
                      const optimalStock = item.optimalStockLevel || 0
                      const currentStock = item.stockQuantity || 0
                      const toOrder = Math.max(0, optimalStock - currentStock)
                      const itemId = item._id
                      const isEditing = editingToOrder[itemId]
                      
                      if (isEditing) {
                        return (
                          <input
                            type="number"
                            min="0"
                            defaultValue={toOrder}
                            onBlur={(e) => {
                              const newValue = e.target.value
                              handleToOrderChange(item, newValue)
                              setEditingToOrder(prev => {
                                const newState = { ...prev }
                                delete newState[itemId]
                                return newState
                              })
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.target.blur()
                              } else if (e.key === 'Escape') {
                                setEditingToOrder(prev => {
                                  const newState = { ...prev }
                                  delete newState[itemId]
                                  return newState
                                })
                                e.target.blur()
                              }
                            }}
                            autoFocus
                            className="order-quantity-input"
                          />
                        )
                      }
                      
                      return (
                        <span
                          className={`order-badge ${
                            toOrder > 0 ? 'needs-order' : 'ok'
                          }`}
                          onClick={() => {
                            setEditingToOrder(prev => ({ ...prev, [itemId]: true }))
                          }}
                          title="לחץ לעריכה"
                        >
                          {toOrder}
                        </span>
                      )
                    })()}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-edit"
                        onClick={() => handleEdit(item)}
                        title="ערוך"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M11.333 2.00001C11.5084 1.82445 11.7163 1.68506 11.9447 1.59123C12.1731 1.4974 12.4173 1.45117 12.6637 1.45534C12.9101 1.45951 13.1523 1.51398 13.3763 1.61538C13.6003 1.71678 13.8012 1.8628 13.9667 2.04445C14.1321 2.2261 14.2585 2.43937 14.3384 2.67091C14.4182 2.90245 14.4497 3.14762 14.4307 3.39068C14.4117 3.63374 14.3426 3.86975 14.2277 4.08334L6.12001 13.3333L2.00001 14L2.66668 9.88001L10.7733 0.63001C10.8882 0.416421 11.0439 0.228215 11.2313 0.0764062C11.4187 -0.0754026 11.6339 -0.188281 11.8637 -0.25534C12.0935 -0.322399 12.3333 -0.342399 12.57 -0.31423C12.8067 -0.286061 13.0353 -0.21023 13.24 -0.09134L11.333 2.00001Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(item._id)}
                        title="מחק"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M2 4H14M12.6667 4V13.3333C12.6667 13.687 12.5262 14.0261 12.2761 14.2761C12.0261 14.5262 11.687 14.6667 11.3333 14.6667H4.66667C4.31305 14.6667 3.97391 14.5262 3.72386 14.2761C3.47381 14.0261 3.33333 13.687 3.33333 13.3333V4M5.33333 4V2.66667C5.33333 2.31305 5.47381 1.97391 5.72386 1.72386C5.97391 1.47381 6.31305 1.33333 6.66667 1.33333H9.33333C9.68696 1.33333 10.0261 1.47381 10.2761 1.72386C10.5262 1.97391 10.6667 2.31305 10.6667 2.66667V4M6.66667 7.33333V11.3333M9.33333 7.33333V11.3333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
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
