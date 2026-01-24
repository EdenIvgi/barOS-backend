import { useState } from 'react'
import { itemService } from '../services/item.service'

export function ItemSearch({ filterBy, onSetFilter }) {
  const [searchTerm, setSearchTerm] = useState(filterBy.txt || '')

  function handleSearchChange(ev) {
    const value = ev.target.value
    setSearchTerm(value)
    onSetFilter({ txt: value, pageIdx: 0 })
  }

  function handleClearSearch() {
    setSearchTerm('')
    onSetFilter({ txt: '', pageIdx: 0 })
  }

  return (
    <section className="item-search">
      <div className="search-input-wrapper">
        <input
          type="text"
          placeholder="Search items..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="search-input"
        />
        {searchTerm && (
          <button className="clear-search-btn" onClick={handleClearSearch}>
            ✕
          </button>
        )}
      </div>
    </section>
  )
}
