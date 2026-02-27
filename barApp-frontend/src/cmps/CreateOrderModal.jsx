import { useTranslation } from 'react-i18next'

export function CreateOrderModal({
  isOpen,
  bySupplier,
  selectedSuppliers,
  createCombined,
  onToggleSupplier,
  onSetCombined,
  onConfirm,
  onClose,
}) {
  const { t } = useTranslation()

  if (!isOpen || !bySupplier) return null

  return (
    <div className="form-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="form-container create-order-modal" onClick={(e) => e.stopPropagation()}>
        <h2>{t('selectOrdersToCreate')}</h2>
        <p className="create-order-modal-desc">{t('createOrderModalDesc')}</p>
        <ul className="create-order-supplier-list">
          {Object.entries(bySupplier).map(([supplierName, orderItems]) => (
            <li key={supplierName} className="create-order-supplier-item">
              <label>
                <input
                  type="checkbox"
                  checked={!!selectedSuppliers[supplierName]}
                  onChange={() => onToggleSupplier(supplierName)}
                />
                <span className="supplier-name">{supplierName}</span>
                <span className="supplier-summary"> — {t('productsCount', { n: orderItems.length })}</span>
              </label>
            </li>
          ))}
        </ul>
        <label className="create-order-combined-option">
          <input
            type="checkbox"
            checked={!!createCombined}
            onChange={(e) => onSetCombined(e.target.checked)}
          />
          <span>{t('combinedOrderOption')}</span>
        </label>
        <div className="form-actions" style={{ marginTop: '1rem' }}>
          <button type="button" className="btn-save" onClick={onConfirm}>
            {t('createSelectedOrders')}
          </button>
          <button type="button" className="btn-cancel" onClick={onClose}>
            {t('cancel')}
          </button>
        </div>
      </div>
    </div>
  )
}
