import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { loadCategories } from '../store/actions/category.actions'

export function CategoryFilter({ filterBy, onSetFilter, selectedCategoryId }) {
  const categories = useSelector(
    (storeState) => storeState.categoryModule.categories
  )

  useEffect(() => {
    loadCategories()
  }, [])

  function handleCategoryClick(categoryId) {
    const newCategoryId = selectedCategoryId === categoryId ? '' : categoryId
    onSetFilter({ categoryId: newCategoryId, pageIdx: 0 })
  }

  return (
    <section className="category-filter">
      <div className="category-buttons flex">
        <button
          className={`category-btn ${!selectedCategoryId ? 'active' : ''}`}
          onClick={() => handleCategoryClick('')}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category._id}
            className={`category-btn ${
              selectedCategoryId === category._id ? 'active' : ''
            }`}
            onClick={() => handleCategoryClick(category._id)}
          >
            <span className="category-icon">{category.icon}</span>
            {category.name}
          </button>
        ))}
      </div>
    </section>
  )
}
