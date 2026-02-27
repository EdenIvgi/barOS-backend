import { useTranslation } from 'react-i18next'

export function ItemFilters({
  filters,
  uniqueCategories,
  uniqueSuppliers,
  filteredCount,
  totalCount,
  onFilterChange,
  onClearFilters,
}) {
  const { t } = useTranslation()

  return (
    <div className="filters-container">
      <div>
        <label>{t('category')}</label>
        <select name="category" value={filters.category} onChange={onFilterChange}>
          <option value="">{t('allCategories')}</option>
          {uniqueCategories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div>
        <label>{t('supplier')}</label>
        <select name="supplier" value={filters.supplier} onChange={onFilterChange}>
          <option value="">{t('allSuppliers')}</option>
          {uniqueSuppliers.map((supplier) => (
            <option key={supplier} value={supplier}>{supplier}</option>
          ))}
        </select>
      </div>

      <div>
        <label>{t('stock')}</label>
        <select name="stockStatus" value={filters.stockStatus} onChange={onFilterChange}>
          <option value="">{t('all')}</option>
          <option value="inStock">{t('inStock')}</option>
          <option value="outOfStock">{t('outOfStock')}</option>
          <option value="lowStock">{t('lowStockFilter')}</option>
        </select>
      </div>

      <div className="filter-info">
        {t('showingProducts', { count: filteredCount, total: totalCount })}
      </div>

      <div>
        <button onClick={onClearFilters} className="clear-filters-btn">
          {t('clearFilters')}
        </button>
      </div>
    </div>
  )
}
