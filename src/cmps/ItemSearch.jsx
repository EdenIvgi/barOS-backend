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
        <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <input
          type="text"
          placeholder="חפש מוצרים..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="search-input"
        />
        {searchTerm && (
          <button className="clear-search-btn" onClick={handleClearSearch} title="נקה חיפוש">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
      </div>
    </section>
  )
}
