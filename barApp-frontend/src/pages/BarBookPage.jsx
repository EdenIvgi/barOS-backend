import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import { barBookService } from '../services/barBook.service.js'

function normalizeBarBookContent(data) {
  if (!data) return barBookService.getEmptyContent()
  const rawDaily = Array.isArray(data.dailyTasks) ? data.dailyTasks : []
  const dailyTasks = rawDaily.map((d) => {
    if (d.task !== undefined) return { day: d.day || '', task: String(d.task ?? '') }
    if (Array.isArray(d.items)) return { day: d.day || '', task: d.items.join('\n') }
    return { day: d.day || '', task: '' }
  })
  return {
    checklists: data.checklists || barBookService.getEmptyContent().checklists,
    dailyTasks,
    stockTable: data.stockTable || barBookService.getEmptyContent().stockTable,
    recipes: Array.isArray(data.recipes) ? data.recipes : [],
  }
}

function linesToArray(text) {
  if (!text || typeof text !== 'string') return []
  return text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function arrayToLines(arr) {
  return Array.isArray(arr) ? arr.join('\n') : ''
}

function getRecipeSchema(t) {
  return Yup.object().shape({
    title: Yup.string().trim().required(t('recipeTitleRequired')),
    ingredientsText: Yup.string()
      .trim()
      .required(t('minOneIngredient'))
      .test('minLines', t('minOneIngredient'), (val) => linesToArray(val || '').length > 0),
    instructionsText: Yup.string()
      .trim()
      .required(t('minOneStep'))
      .test('minLines', t('minOneStep'), (val) => linesToArray(val || '').length > 0),
  })
}

const TAB_IDS = ['checklists', 'pages', 'daily', 'recipes']

const NAV_ITEMS = [
  { id: 'checklists', labelKey: 'tabChecklists', symbol: '✓' },
  { id: 'pages',      labelKey: 'tabPages',      symbol: '▤' },
  { id: 'daily',      labelKey: 'tabDaily',       symbol: '◷' },
  { id: 'recipes',    labelKey: 'tabRecipes',     symbol: '✦' },
]

export function BarBookPage() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('checklists')
  const [content, setContent] = useState(null)
  const [isLoadingBarBook, setIsLoadingBarBook] = useState(true)
  const [barBookError, setBarBookError] = useState(null)
  const [barBookShowTabs, setBarBookShowTabs] = useState(false)
  const skipSaveRef = useRef(true)
  const [editingChecklist, setEditingChecklist] = useState({ key: null, index: null, value: '' })
  const [editingDailyTask, setEditingDailyTask] = useState({ dayIndex: null, value: '' })
  const [editingStockCell, setEditingStockCell] = useState({ row: null, col: null, value: '' })
  const [editingSectionTitle, setEditingSectionTitle] = useState({ key: null, value: '' })
  const [editingStockTitle, setEditingStockTitle] = useState(null)
  const [editingStockHeader, setEditingStockHeader] = useState({ index: null, value: '' })
  const [editingDayName, setEditingDayName] = useState({ index: null, value: '' })

  const [formRecipe, setFormRecipe] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedRecipeId, setSelectedRecipeId] = useState(null)

  const selectedRecipe = (content?.recipes || []).find(
    (r) => String(r._id) === String(selectedRecipeId)
  ) || null

  useEffect(() => {
    setIsEditMode(false)
    setEditingChecklist({ key: null, index: null, value: '' })
    setEditingDailyTask({ dayIndex: null, value: '' })
    setEditingStockCell({ row: null, col: null, value: '' })
    setEditingSectionTitle({ key: null, value: '' })
    setEditingStockTitle(null)
    setEditingStockHeader({ index: null, value: '' })
    setEditingDayName({ index: null, value: '' })
  }, [activeTab])

  useEffect(() => {
    barBookService
      .getContent()
      .then((data) => {
        const normalized = normalizeBarBookContent(data)
        setContent(normalized)
        setBarBookError(null)
        if (!isBarBookEmpty(normalized)) setBarBookShowTabs(true)
      })
      .catch((err) => {
        setBarBookError(err?.response?.data?.error || err?.message || t('errorLoadBarBook'))
      })
      .finally(() => setIsLoadingBarBook(false))
  }, [])

  useEffect(() => {
    if (skipSaveRef.current || !content) return
    const timer = setTimeout(() => {
      barBookService.saveContent(content).catch((err) => {
        console.error('Bar book save failed', err)
      })
    }, 600)
    return () => clearTimeout(timer)
  }, [content])

  useEffect(() => {
    if (content) skipSaveRef.current = false
  }, [content])

  function isBarBookEmpty(c) {
    if (!c) return true
    const allChecklistsEmpty = ['opening', 'closing', 'deep'].every(
      (k) => !c.checklists?.[k]?.items?.length
    )
    return allChecklistsEmpty && !c.dailyTasks?.length && !c.stockTable?.rows?.length && !c.recipes?.length
  }

  function handleInitBarBook() {
    setBarBookShowTabs(true)
  }

  function toggleEditMode() {
    if (isEditMode) {
      setEditingChecklist({ key: null, index: null, value: '' })
      setEditingDailyTask({ dayIndex: null, value: '' })
      setEditingStockCell({ row: null, col: null, value: '' })
      setEditingSectionTitle({ key: null, value: '' })
      setEditingStockTitle(null)
      setEditingStockHeader({ index: null, value: '' })
      setEditingDayName({ index: null, value: '' })
    }
    setIsEditMode(prev => !prev)
  }

  async function clearBarBookContent() {
    if (!window.confirm(t('confirmClearBarBook'))) return
    try {
      const content = await barBookService.clear()
      setContent(normalizeBarBookContent(content))
      setEditingChecklist({ key: null, index: null, value: '' })
      setEditingDailyTask({ dayIndex: null, value: '' })
      setEditingStockCell({ row: null, col: null, value: '' })
      setEditingSectionTitle({ key: null, value: '' })
      setEditingStockTitle(null)
      setEditingStockHeader({ index: null, value: '' })
      setEditingDayName({ index: null, value: '' })
    } catch (err) {
      console.error('Clear bar book failed', err)
    }
  }

  function checklistUpdate(key, updater) {
    setContent((prev) => ({
      ...prev,
      checklists: {
        ...prev.checklists,
        [key]: typeof updater === 'function' ? updater(prev.checklists[key]) : updater,
      },
    }))
  }

  function startEditChecklistItem(key, index, value) {
    setEditingChecklist({ key, index, value: value ?? content.checklists[key].items[index] ?? '' })
  }

  function saveEditChecklistItem() {
    const { key, index, value } = editingChecklist
    if (key == null || index == null) return
    const trimmed = (value ?? '').trim()
    checklistUpdate(key, (list) => {
      const items = [...list.items]
      if (trimmed) items[index] = trimmed
      else items.splice(index, 1)
      return { ...list, items }
    })
    setEditingChecklist({ key: null, index: null, value: '' })
  }

  function addChecklistItem(key) {
    checklistUpdate(key, (list) => ({ ...list, items: [...list.items, ''] }))
    setEditingChecklist({ key, index: content.checklists[key].items.length, value: '' })
  }

  function removeChecklistItem(key, index) {
    checklistUpdate(key, (list) => ({
      ...list,
      items: list.items.filter((_, i) => i !== index),
    }))
    setEditingChecklist({ key: null, index: null, value: '' })
  }

  function saveSectionTitle(key) {
    const v = (editingSectionTitle.value ?? '').trim()
    if (editingSectionTitle.key === key && v) {
      checklistUpdate(key, (list) => ({ ...list, title: v }))
    }
    setEditingSectionTitle({ key: null, value: '' })
  }

  function saveStockCell() {
    const { row, col, value } = editingStockCell
    if (row == null || col == null) return
    setContent((prev) => {
      const rows = prev.stockTable.rows.map((r) => [...r])
      if (!rows[row]) return prev
      rows[row] = [...rows[row]]
      rows[row][col] = value ?? ''
      return { ...prev, stockTable: { ...prev.stockTable, rows } }
    })
    setEditingStockCell({ row: null, col: null, value: '' })
  }

  function addStockRow() {
    const cols = content.stockTable.headers.length
    setContent((prev) => ({
      ...prev,
      stockTable: {
        ...prev.stockTable,
        rows: [...prev.stockTable.rows, Array(cols).fill('')],
      },
    }))
  }

  function removeStockRow(rowIndex) {
    setContent((prev) => ({
      ...prev,
      stockTable: {
        ...prev.stockTable,
        rows: prev.stockTable.rows.filter((_, i) => i !== rowIndex),
      },
    }))
    if (editingStockCell.row === rowIndex) setEditingStockCell({ row: null, col: null, value: '' })
  }

  function saveStockTitle() {
    if (editingStockTitle !== null && editingStockTitle.trim()) {
      setContent((prev) => ({
        ...prev,
        stockTable: { ...prev.stockTable, title: editingStockTitle.trim() },
      }))
    }
    setEditingStockTitle(null)
  }

  function saveStockHeader(index) {
    const v = (editingStockHeader.value ?? '').trim()
    if (editingStockHeader.index === index) {
      setContent((prev) => {
        const headers = [...prev.stockTable.headers]
        headers[index] = v || prev.stockTable.headers[index]
        return { ...prev, stockTable: { ...prev.stockTable, headers } }
      })
    }
    setEditingStockHeader({ index: null, value: '' })
  }

  function dailyTasksUpdate(updater) {
    setContent((prev) => ({ ...prev, dailyTasks: updater(prev.dailyTasks) }))
  }

  function saveDailyTask(dayIndex) {
    const { value } = editingDailyTask
    if (editingDailyTask.dayIndex !== dayIndex) return
    dailyTasksUpdate((tasks) =>
      tasks.map((d, i) => (i === dayIndex ? { ...d, task: value ?? '' } : d))
    )
    setEditingDailyTask({ dayIndex: null, value: '' })
  }

  function addDailyDay() {
    dailyTasksUpdate((tasks) => [...tasks, { day: t('newDay'), task: '' }])
    setEditingDayName({ index: content.dailyTasks.length, value: t('newDay') })
  }

  function removeDailyDay(dayIndex) {
    dailyTasksUpdate((tasks) => tasks.filter((_, i) => i !== dayIndex))
    setEditingDayName({ index: null, value: '' })
    if (editingDailyTask.dayIndex === dayIndex) setEditingDailyTask({ dayIndex: null, value: '' })
  }

  function saveDayName(index) {
    const v = (editingDayName.value ?? '').trim()
    if (editingDayName.index === index && v) {
      dailyTasksUpdate((tasks) =>
        tasks.map((d, i) => (i === index ? { ...d, day: v } : d))
      )
    }
    setEditingDayName({ index: null, value: '' })
  }

  function openAddForm() {
    setFormRecipe(null)
    setIsFormOpen(true)
  }

  function openEditForm(recipe) {
    setFormRecipe(recipe)
    setIsFormOpen(true)
  }

  function closeForm() {
    setFormRecipe(null)
    setIsFormOpen(false)
  }

  function getInitialValues() {
    if (formRecipe) {
      return {
        title: formRecipe.title,
        ingredientsText: arrayToLines(formRecipe.ingredients),
        instructionsText: arrayToLines(formRecipe.instructions),
      }
    }
    return { title: '', ingredientsText: '', instructionsText: '' }
  }

  function handleSubmit(values) {
    const ingredients = linesToArray(values.ingredientsText)
    const instructions = linesToArray(values.instructionsText)
    if (ingredients.length === 0 || instructions.length === 0) return

    const payload = { title: values.title.trim(), ingredients, instructions }

    if (formRecipe) {
      setContent(prev => ({
        ...prev,
        recipes: (prev.recipes || []).map(r =>
          String(r._id) === String(formRecipe._id)
            ? { ...r, ...payload, updatedAt: Date.now() }
            : r
        )
      }))
    } else {
      const newRecipe = {
        _id: Date.now().toString(),
        ...payload,
        createdAt: Date.now(),
      }
      setContent(prev => ({
        ...prev,
        recipes: [newRecipe, ...(prev.recipes || [])]
      }))
      setSelectedRecipeId(newRecipe._id)
    }
    closeForm()
  }

  function handleDelete(recipe) {
    if (!window.confirm(`${t('confirmDeleteRecipe')} "${recipe.title}"?`)) return
    const id = recipe._id
    setContent(prev => ({
      ...prev,
      recipes: (prev.recipes || []).filter(r => String(r._id) !== String(id))
    }))
    if (formRecipe && String(formRecipe._id) === String(id)) closeForm()
    if (String(selectedRecipeId) === String(id)) setSelectedRecipeId(null)
  }

  return (
    <section className="bar-book-page">
      <div className="bar-book-layout">

        {/* ── SIDEBAR ── */}
        <aside className="bar-book-sidebar">
          {barBookShowTabs && (
            <nav className="sidebar-nav">
              {NAV_ITEMS.map(({ id, labelKey, symbol }) => (
                <button
                  key={id}
                  type="button"
                  className={`sidebar-nav-item ${activeTab === id ? 'active' : ''}`}
                  onClick={() => setActiveTab(id)}
                >
                  <span className="nav-symbol">{symbol}</span>
                  <span className="nav-label">{t(labelKey)}</span>
                </button>
              ))}
            </nav>
          )}
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="bar-book-main">

          {barBookShowTabs && (
            <div className="content-topbar">
              <span className="content-topbar-title">
                {t(NAV_ITEMS.find(n => n.id === activeTab)?.labelKey || '')}
              </span>
              <button
                type="button"
                className={`topbar-edit-btn ${isEditMode ? 'active' : ''}`}
                onClick={toggleEditMode}
                title={isEditMode ? t('exitEditMode') : t('editMode')}
              >
                {isEditMode ? t('exitEditMode') : t('editMode')}
              </button>
            </div>
          )}

          {isLoadingBarBook && (
            <p className="bar-book-loading">{t('loadingBarBook')}</p>
          )}
          {!isLoadingBarBook && barBookError && (
            <p className="bar-book-error">{barBookError}</p>
          )}
          {!isLoadingBarBook && !barBookError && content && !barBookShowTabs && (
            <div className="empty-state">
              <p>{t('barBookEmpty')}</p>
              <button type="button" className="btn-add" onClick={handleInitBarBook}>
                {t('initBarBook')}
              </button>
            </div>
          )}

          {/* ── CHECKLISTS — 3-column grid ── */}
          {!isLoadingBarBook && !barBookError && content && barBookShowTabs && activeTab === 'checklists' && (
            <div className="bar-book-checklists">
              <div className="checklists-grid">
                {['opening', 'closing', 'deep'].map((key) => {
                  const list = content.checklists[key]
                  if (!list) return null
                  const isEditingTitle = editingSectionTitle.key === key
                  return (
                    <section key={key} className="checklist-section">
                      {isEditingTitle ? (
                        <div className="checklist-title-edit">
                          <input
                            type="text"
                            value={editingSectionTitle.value}
                            onChange={(e) => setEditingSectionTitle((p) => ({ ...p, value: e.target.value }))}
                            onBlur={() => saveSectionTitle(key)}
                            onKeyDown={(e) => e.key === 'Enter' && saveSectionTitle(key)}
                            autoFocus
                            className="edit-input title-input"
                          />
                        </div>
                      ) : (
                        <h2
                          className={`checklist-title ${isEditMode ? 'editable' : ''}`}
                          onClick={() => isEditMode && setEditingSectionTitle({ key, value: list.title })}
                          title={isEditMode ? t('clickToEdit') : ''}
                        >
                          {list.title}
                        </h2>
                      )}
                      <ul className="checklist-list">
                        {(list.items || []).map((item, i) => (
                          <li key={i} className="checklist-item">
                            {editingChecklist.key === key && editingChecklist.index === i ? (
                              <div className="checklist-item-edit">
                                <input
                                  type="text"
                                  value={editingChecklist.value}
                                  onChange={(e) => setEditingChecklist((p) => ({ ...p, value: e.target.value }))}
                                  onBlur={saveEditChecklistItem}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveEditChecklistItem()
                                    if (e.key === 'Escape') setEditingChecklist({ key: null, index: null, value: '' })
                                  }}
                                  autoFocus
                                  className="edit-input"
                                />
                              </div>
                            ) : (
                              <label>
                                <input type="checkbox" />
                                <span
                                  className={isEditMode ? 'editable' : ''}
                                  onClick={(e) => {
                                    if (!isEditMode) return
                                    e.preventDefault()
                                    e.stopPropagation()
                                    startEditChecklistItem(key, i, item)
                                  }}
                                  title={isEditMode ? t('clickToEdit') : ''}
                                >
                                  {item || t('emptyCell')}
                                </span>
                                {isEditMode && (
                                  <button
                                    type="button"
                                    className="btn-icon btn-delete-item"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      removeChecklistItem(key, i)
                                    }}
                                    title={t('deleteItem')}
                                    aria-label={t('delete')}
                                  >
                                    ×
                                  </button>
                                )}
                              </label>
                            )}
                          </li>
                        ))}
                      </ul>
                      {isEditMode && (
                        <button
                          type="button"
                          className="btn-add-item"
                          onClick={() => addChecklistItem(key)}
                        >
                          + {t('addTask')}
                        </button>
                      )}
                    </section>
                  )
                })}
              </div>
              {isEditMode && (
                <div className="bar-book-reset-wrap">
                  <button type="button" className="btn-reset-default" onClick={clearBarBookContent}>
                    {t('clearContent')}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── DAILY TASKS ── */}
          {!isLoadingBarBook && !barBookError && content && barBookShowTabs && activeTab === 'daily' && (
            <div className="bar-book-full-pages">
              <section className="daily-tasks-section">
                <h2 className="section-title">{t('dailyTasksTitle')}</h2>
                <p className="section-intro">{t('dailyTasksIntro')}</p>
                <div className="daily-tasks-table-wrap">
                  <table className="daily-tasks-table daily-tasks-vertical editable-table">
                    <thead>
                      <tr>
                        <th>{t('dayColumn')}</th>
                        <th>{t('dailyTaskColumn')}</th>
                        {isEditMode && <th className="th-actions"></th>}
                      </tr>
                    </thead>
                    <tbody>
                      {(content.dailyTasks || []).map((d, i) => (
                        <tr key={i}>
                          <td className="daily-task-day-cell">
                            {editingDayName.index === i ? (
                              <input
                                type="text"
                                value={editingDayName.value}
                                onChange={(e) => setEditingDayName((p) => ({ ...p, value: e.target.value }))}
                                onBlur={() => saveDayName(i)}
                                onKeyDown={(e) => e.key === 'Enter' && saveDayName(i)}
                                autoFocus
                                className="edit-input cell-input"
                              />
                            ) : (
                              <span
                                className={isEditMode ? 'editable' : ''}
                                onClick={() => isEditMode && setEditingDayName({ index: i, value: d.day })}
                                title={isEditMode ? t('clickToEdit') : ''}
                              >
                                {d.day}
                              </span>
                            )}
                          </td>
                          <td className="daily-task-details-cell">
                            {editingDailyTask.dayIndex === i ? (
                              <textarea
                                value={editingDailyTask.value}
                                onChange={(e) => setEditingDailyTask((p) => ({ ...p, value: e.target.value }))}
                                onBlur={() => saveDailyTask(i)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Escape') setEditingDailyTask({ dayIndex: null, value: '' })
                                }}
                                autoFocus
                                className="edit-input daily-task-textarea"
                                rows={6}
                                placeholder={t('dailyTaskPlaceholder')}
                              />
                            ) : (
                              <div
                                className={`daily-task-text ${isEditMode ? 'editable' : ''}`}
                                onClick={() => isEditMode && setEditingDailyTask({ dayIndex: i, value: d.task ?? '' })}
                                title={isEditMode ? t('clickToEdit') : ''}
                              >
                                {(d.task ?? '').trim() || t('emptyClickEdit')}
                              </div>
                            )}
                          </td>
                          {isEditMode && (
                            <td className="td-actions">
                              <button
                                type="button"
                                className="btn-icon btn-delete-row"
                                onClick={() => removeDailyDay(i)}
                                title={t('deleteDay')}
                              >
                                {t('deleteRow')}
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {isEditMode && (
                  <button type="button" className="btn-add-item" onClick={addDailyDay}>
                    + {t('addDay')}
                  </button>
                )}
              </section>
              {isEditMode && (
                <div className="bar-book-reset-wrap">
                  <button type="button" className="btn-reset-default" onClick={clearBarBookContent}>
                    {t('clearContent')}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── STOCK / PAGES ── */}
          {!isLoadingBarBook && !barBookError && content && barBookShowTabs && activeTab === 'pages' && (
            <div className="bar-book-full-pages">
              <section className="stock-section">
                {editingStockTitle !== null ? (
                  <div className="section-title-edit">
                    <input
                      type="text"
                      value={editingStockTitle}
                      onChange={(e) => setEditingStockTitle(e.target.value)}
                      onBlur={saveStockTitle}
                      onKeyDown={(e) => e.key === 'Enter' && saveStockTitle()}
                      autoFocus
                      className="edit-input title-input"
                    />
                  </div>
                ) : (
                  <h2
                    className={`section-title ${isEditMode ? 'editable' : ''}`}
                    onClick={() => isEditMode && setEditingStockTitle(content.stockTable.title)}
                    title={isEditMode ? t('clickToEdit') : ''}
                  >
                    {content.stockTable.title}
                  </h2>
                )}
                <div className="stock-table-wrap">
                  <table className="stock-table editable-table">
                    <thead>
                      <tr>
                        {(content.stockTable.headers || []).map((h, i) => (
                          <th key={i}>
                            {editingStockHeader.index === i ? (
                              <input
                                type="text"
                                value={editingStockHeader.value}
                                onChange={(e) => setEditingStockHeader((p) => ({ ...p, value: e.target.value }))}
                                onBlur={() => saveStockHeader(i)}
                                onKeyDown={(e) => e.key === 'Enter' && saveStockHeader(i)}
                                autoFocus
                                className="edit-input cell-input"
                              />
                            ) : (
                              <span
                                className={isEditMode ? 'editable' : ''}
                                onClick={() => isEditMode && setEditingStockHeader({ index: i, value: h })}
                                title={isEditMode ? t('clickToEdit') : ''}
                              >
                                {h}
                              </span>
                            )}
                          </th>
                        ))}
                        {isEditMode && <th className="th-actions"></th>}
                      </tr>
                    </thead>
                    <tbody>
                      {(content.stockTable.rows || []).map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {(row || []).map((cell, colIndex) => (
                            <td key={colIndex}>
                              {editingStockCell.row === rowIndex && editingStockCell.col === colIndex ? (
                                <input
                                  type="text"
                                  value={editingStockCell.value}
                                  onChange={(e) => setEditingStockCell((p) => ({ ...p, value: e.target.value }))}
                                  onBlur={saveStockCell}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveStockCell()
                                    if (e.key === 'Escape') setEditingStockCell({ row: null, col: null, value: '' })
                                  }}
                                  autoFocus
                                  className="edit-input cell-input"
                                />
                              ) : (
                                <span
                                  className={isEditMode ? 'editable' : ''}
                                  onClick={() =>
                                    isEditMode && setEditingStockCell({ row: rowIndex, col: colIndex, value: cell ?? '' })
                                  }
                                  title={isEditMode ? t('clickToEdit') : ''}
                                >
                                  {cell ?? ''}
                                </span>
                              )}
                            </td>
                          ))}
                          {isEditMode && (
                            <td className="td-actions">
                              <button
                                type="button"
                                className="btn-icon btn-delete-row"
                                onClick={() => removeStockRow(rowIndex)}
                                title="מחק שורה"
                              >
                                מחק
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {isEditMode && (
                  <button type="button" className="btn-add-item" onClick={addStockRow}>
                    + הוסף שורה
                  </button>
                )}
              </section>
              {isEditMode && (
                <div className="bar-book-reset-wrap">
                  <button type="button" className="btn-reset-default" onClick={clearBarBookContent}>
                    {t('clearContent')}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── RECIPES — Master / Detail ── */}
          {barBookShowTabs && activeTab === 'recipes' && (
            <div className="bar-book-recipes">
              <div className="recipes-layout">

                {/* Recipe index list */}
                <div className="recipes-list-panel">
                  {isEditMode && (
                    <div className="recipes-panel-header">
                      <button type="button" className="btn-add-recipe" onClick={openAddForm}>
                        + {t('addRecipe')}
                      </button>
                    </div>
                  )}
                  <div className="recipes-index">
                    {(content?.recipes || []).length === 0 ? (
                      <p className="recipes-empty">{t('noRecipes')}</p>
                    ) : (
                      (content?.recipes || []).map((recipe) => (
                        <button
                          key={recipe._id}
                          type="button"
                          className={`recipe-index-item ${selectedRecipeId === recipe._id ? 'active' : ''}`}
                          onClick={() => setSelectedRecipeId(recipe._id)}
                        >
                          <span className="recipe-index-title">{recipe.title}</span>
                          <span className="recipe-index-meta">
                            {recipe.ingredients?.length} {t('ingredients')}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Recipe detail */}
                <div className="recipes-detail-panel">
                  {selectedRecipe ? (
                    <article className="recipe-detail">
                      <div className="recipe-detail-header">
                        <h2 className="recipe-detail-title">{selectedRecipe.title}</h2>
                        {isEditMode && (
                          <div className="recipe-detail-actions">
                            <button
                              type="button"
                              className="btn-edit-recipe"
                              onClick={() => openEditForm(selectedRecipe)}
                            >
                              {t('edit')}
                            </button>
                            <button
                              type="button"
                              className="btn-delete-recipe"
                              onClick={() => handleDelete(selectedRecipe)}
                            >
                              {t('delete')}
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="recipe-detail-body">
                        <div className="recipe-detail-section ingredients-section">
                          <h3>{t('ingredients')}</h3>
                          <ul>
                            {(selectedRecipe.ingredients || []).map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="recipe-detail-section instructions-section">
                          <h3>{t('instructions')}</h3>
                          <ol>
                            {(selectedRecipe.instructions || []).map((step, i) => (
                              <li key={i}>{step}</li>
                            ))}
                          </ol>
                        </div>
                      </div>
                    </article>
                  ) : (
                    <div className="recipe-detail-placeholder">
                      <p>{t('selectRecipePrompt')}</p>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

        </main>
      </div>

      {/* Recipe Form Modal */}
      {isFormOpen && (
        <div className="recipe-form-overlay" onClick={(e) => e.target === e.currentTarget && closeForm()}>
          <div className="recipe-form-container" onClick={(e) => e.stopPropagation()}>
            <h2>{formRecipe ? t('editingRecipe') : t('addingRecipe')}</h2>
            <Formik
              initialValues={getInitialValues()}
              validationSchema={getRecipeSchema(t)}
              onSubmit={handleSubmit}
              enableReinitialize
            >
              <Form className="recipe-form">
                <div className="form-group">
                  <label htmlFor="recipe-title">{t('recipeNameLabel')}</label>
                  <Field id="recipe-title" name="title" type="text" className="form-input" placeholder={t('recipeNamePlaceholder')} />
                  <ErrorMessage name="title" component="div" className="form-error" />
                </div>
                <div className="form-group">
                  <label htmlFor="recipe-ingredients">{t('ingredientsLabel')}</label>
                  <Field
                    id="recipe-ingredients"
                    name="ingredientsText"
                    as="textarea"
                    className="form-textarea"
                    rows={6}
                    placeholder={t('ingredientsPlaceholder')}
                  />
                  <ErrorMessage name="ingredientsText" component="div" className="form-error" />
                </div>
                <div className="form-group">
                  <label htmlFor="recipe-instructions">{t('instructionsLabel')}</label>
                  <Field
                    id="recipe-instructions"
                    name="instructionsText"
                    as="textarea"
                    className="form-textarea"
                    rows={8}
                    placeholder={t('instructionsPlaceholder')}
                  />
                  <ErrorMessage name="instructionsText" component="div" className="form-error" />
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn-save">
                    {formRecipe ? t('saveChanges') : t('addRecipe')}
                  </button>
                  <button type="button" className="btn-cancel" onClick={closeForm}>
                    {t('cancel')}
                  </button>
                </div>
              </Form>
            </Formik>
          </div>
        </div>
      )}
    </section>
  )
}
