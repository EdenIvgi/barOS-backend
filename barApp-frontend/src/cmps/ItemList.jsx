import { useTranslation } from 'react-i18next'
import { ItemPreview } from './ItemPreview'

export function ItemList({ items }) {
  const { t } = useTranslation()
  if (!items || !items.length) {
    return (
      <div className="item-list empty">
        <p>{t('noItemsFound')}</p>
      </div>
    )
  }

  return (
    <section className="item-list">
      <div className="items-grid">
        {items.map((item) => (
          <ItemPreview key={item._id} item={item} />
        ))}
      </div>
    </section>
  )
}
