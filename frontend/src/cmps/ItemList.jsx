import { ItemPreview } from './ItemPreview'

export function ItemList({ items }) {
  if (!items || !items.length) {
    return (
      <div className="item-list empty">
        <p>No items found</p>
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
