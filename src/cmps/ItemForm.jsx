import { useRef } from 'react'
import { useTranslation } from 'react-i18next'

export function ItemForm({
  isOpen,
  isEditing,
  editingItem,
  isSaving,
  uniqueCategories,
  uniqueSuppliers,
  itemCount,
  onSubmit,
  onChange,
  onCancel,
}) {
  const { t } = useTranslation()
  const overlayMouseDownRef = useRef(false)

  if (!isOpen) return null

  return (
    <div
      className="form-overlay"
      onMouseDown={(e) => { overlayMouseDownRef.current = (e.target === e.currentTarget) }}
      onClick={(e) => {
        if (e.target === e.currentTarget && overlayMouseDownRef.current) onCancel()
        overlayMouseDownRef.current = false
      }}
    >
      <div className="form-container" onMouseDown={() => { overlayMouseDownRef.current = false }} onClick={(e) => e.stopPropagation()}>
        <h2>{isEditing ? t('editProduct') : t('addNewProduct')}</h2>
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label>{t('nameHe')}:</label>
            <input type="text" name="name" value={editingItem?.name || ''} onChange={onChange} required />
          </div>

          <div className="form-group">
            <label>{t('nameEn')}:</label>
            <input type="text" name="nameEn" value={editingItem?.nameEn || ''} onChange={onChange} />
          </div>

          <div className="form-group">
            <label>{t('category')}:</label>
            <select
              name="categoryId"
              value={editingItem?.categoryId || editingItem?.category || ''}
              onChange={onChange}
              required
            >
              <option value="">{t('selectCategory')}</option>
              {uniqueCategories.length > 0 ? (
                uniqueCategories.map((categoryName) => (
                  <option key={categoryName} value={categoryName}>{categoryName}</option>
                ))
              ) : (
                <option value="" disabled>{t('noCategoriesAvailable')}</option>
              )}
            </select>
            {uniqueCategories.length > 0 && (
              <div className="form-hint" style={{ color: '#666', fontSize: '0.85em', marginTop: '5px' }}>
                {t('categoriesFromProducts', { n: uniqueCategories.length })}
              </div>
            )}
            {uniqueCategories.length === 0 && itemCount > 0 && (
              <div className="form-hint" style={{ color: '#999', fontSize: '0.85em', marginTop: '5px' }}>
                {t('noCategoriesInProducts')}
              </div>
            )}
          </div>

          <div className="form-group">
            <label>{t('supplier')}:</label>
            <select name="supplier" value={editingItem?.supplier || ''} onChange={onChange}>
              <option value="">{t('noSupplier')}</option>
              {(() => {
                const opts = [...uniqueSuppliers]
                const current = (editingItem?.supplier || '').trim()
                if (current && !opts.includes(current)) opts.push(current)
                opts.sort()
                return opts.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))
              })()}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>{t('price')}:</label>
              <input type="number" name="price" value={editingItem?.price || 0} onChange={onChange} min="0" step="0.01" required />
            </div>
            <div className="form-group">
              <label>{t('stockQuantity')}:</label>
              <input type="number" name="stockQuantity" value={editingItem?.stockQuantity ?? ''} onChange={onChange} min="0" step="any" required />
            </div>
            <div className="form-group">
              <label>{t('alertThresholdLabel')}:</label>
              <input type="number" name="minStockLevel" value={editingItem?.minStockLevel ?? ''} onChange={onChange} min="0" step="any" />
            </div>
            <div className="form-group">
              <label>{t('optimalStock')}:</label>
              <input type="number" name="optimalStockLevel" value={editingItem?.optimalStockLevel ?? ''} onChange={onChange} min="0" step="any" required />
            </div>
          </div>

          <div className="form-group">
            <label>{t('imageUrl')}:</label>
            <input type="url" name="imageUrl" value={editingItem?.imageUrl || ''} onChange={onChange} />
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input type="checkbox" name="isAvailable" checked={editingItem?.isAvailable || false} onChange={onChange} />
              {t('availableForOrder')}
            </label>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-save" disabled={isSaving}>
              {isSaving ? t('loading') : isEditing ? t('update') : t('save')}
            </button>
            <button type="button" className="btn-cancel" onClick={onCancel}>
              {t('cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
