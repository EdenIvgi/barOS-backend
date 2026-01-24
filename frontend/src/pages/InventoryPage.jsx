import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { loadItems } from '../store/actions/item.actions'
import { Loader } from '../cmps/Loader'

export function InventoryPage() {
  const items = useSelector((storeState) => storeState.itemModule.items)
  const isLoading = useSelector((storeState) => storeState.itemModule.flag.isLoading)

  useEffect(() => {
    loadItems()
  }, [])

  if (isLoading) return <Loader />

  return (
    <div className="inventory-page">
      <h1>ניהול מלאי</h1>
      {items.length === 0 ? (
        <p>אין פריטים במלאי</p>
      ) : (
        <table className="inventory-table">
          <thead>
            <tr>
              <th>שם פריט</th>
              <th>כמות במלאי</th>
              <th>רף התראה</th>
              <th>פעולות</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item._id}>
                <td>{item.name}</td>
                <td>{item.stockQuantity}</td>
                <td>{item.minStockLevel || 'לא הוגדר'}</td>
                <td>
                  <button>עדכן מלאי</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
