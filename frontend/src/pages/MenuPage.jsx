import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Loader } from '../cmps/Loader'
import { CategoryFilter } from '../cmps/CategoryFilter'
import { ItemSearch } from '../cmps/ItemSearch'
import { ItemList } from '../cmps/ItemList'
import { PaginationButtons } from '../cmps/PaginationButtons'
import { loadItems, setFilterBy } from '../store/actions/item.actions'
import { showErrorMsg } from '../services/event-bus.service'

export function MenuPage() {
  const items = useSelector((storeState) => storeState.itemModule.items)
  const filterBy = useSelector((storeState) => storeState.itemModule.filterBy)
  const maxPage = useSelector((storeState) => storeState.itemModule.maxPage)
  const isLoading = useSelector(
    (storeState) => storeState.itemModule.flag.isLoading
  )

  useEffect(() => {
    fetchItems()
  }, [filterBy])

  async function fetchItems() {
    try {
      await loadItems()
    } catch (error) {
      showErrorMsg('Cannot load menu items')
    }
  }

  function onSetFilter(newFilter) {
    setFilterBy({ ...filterBy, ...newFilter })
  }

  function onChangePageIdx(diff) {
    let newPageIdx = +filterBy.pageIdx + diff
    if (newPageIdx < 0) newPageIdx = maxPage - 1
    if (newPageIdx >= maxPage) newPageIdx = 0
    onSetFilter({ pageIdx: newPageIdx })
  }

  return (
    <section className="menu-page">
      <h1 className="page-title">Menu</h1>
      <ItemSearch filterBy={filterBy} onSetFilter={onSetFilter} />
      <CategoryFilter
        filterBy={filterBy}
        onSetFilter={onSetFilter}
        selectedCategoryId={filterBy.categoryId}
      />
      {isLoading && <Loader />}
      {!isLoading && <ItemList items={items} />}
      {!!items.length && maxPage > 1 && (
        <PaginationButtons
          pageIdx={filterBy.pageIdx}
          onChangePageIdx={onChangePageIdx}
        />
      )}
    </section>
  )
}
