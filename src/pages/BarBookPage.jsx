import { useState, useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import { loadRecipes, saveRecipe, removeRecipe } from '../store/actions/recipe.actions.js'
import { barBookService } from '../services/barBook.service.js'

function normalizeBarBookContent(data) {
  if (!data) return barBookService.getEmptyContent()
  return {
    checklists: data.checklists || barBookService.getEmptyContent().checklists,
    dailyTasks: Array.isArray(data.dailyTasks) ? data.dailyTasks : [],
    stockTable: data.stockTable || barBookService.getEmptyContent().stockTable,
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

const recipeSchema = Yup.object().shape({
  title: Yup.string().trim().required('שם המתכון חובה'),
  ingredientsText: Yup.string()
    .trim()
    .required('יש להזין לפחות מרכיב אחד')
    .test('minLines', 'יש להזין לפחות מרכיב אחד', (val) => linesToArray(val || '').length > 0),
  instructionsText: Yup.string()
    .trim()
    .required('יש להזין לפחות שלב אחד')
    .test('minLines', 'יש להזין לפחות שלב אחד', (val) => linesToArray(val || '').length > 0),
})

const TABS = [
  { id: 'checklists', label: 'צ\'קליסטים' },
  { id: 'pages', label: 'דפי מלאים' },
  { id: 'daily', label: 'משימות יומיות' },
  { id: 'recipes', label: 'מתכונים' },
]

export function BarBookPage() {
  const [activeTab, setActiveTab] = useState('recipes')
  const [content, setContent] = useState(null)
  const [isLoadingBarBook, setIsLoadingBarBook] = useState(true)
  const [barBookError, setBarBookError] = useState(null)
  const skipSaveRef = useRef(true)
  const [editingChecklist, setEditingChecklist] = useState({ key: null, index: null, value: '' })
  const [editingDaily, setEditingDaily] = useState({ dayIndex: null, taskIndex: null, value: '' })
  const [editingStockCell, setEditingStockCell] = useState({ row: null, col: null, value: '' })
  const [editingSectionTitle, setEditingSectionTitle] = useState({ key: null, value: '' })
  const [editingStockTitle, setEditingStockTitle] = useState(null)
  const [editingStockHeader, setEditingStockHeader] = useState({ index: null, value: '' })
  const [editingDayName, setEditingDayName] = useState({ index: null, value: '' })

  const recipes = useSelector((storeState) => storeState.recipeModule.recipes)
  const isLoading = useSelector((storeState) => storeState.recipeModule.flag.isLoading)
  const error = useSelector((storeState) => storeState.recipeModule.flag.error)
  const [formRecipe, setFormRecipe] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  useEffect(() => {
    loadRecipes()
  }, [])

  useEffect(() => {
    barBookService
      .getContent()
      .then((data) => {
        setContent(normalizeBarBookContent(data))
        setBarBookError(null)
      })
      .catch((err) => {
        setBarBookError(err?.response?.data?.error || err?.message || 'שגיאה בטעינת ספר הבר')
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

  async function clearBarBookContent() {
    if (!window.confirm('לנקות את כל תוכן ספר הבר? כל התוכן יימחק.')) return
    try {
      const content = await barBookService.clear()
      setContent(normalizeBarBookContent(content))
      setEditingChecklist({ key: null, index: null, value: '' })
      setEditingDaily({ dayIndex: null, taskIndex: null, value: '' })
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

  function saveDailyTaskEdit() {
    const { dayIndex, taskIndex, value } = editingDaily
    if (dayIndex == null || taskIndex == null) return
    const trimmed = (value ?? '').trim()
    dailyTasksUpdate((tasks) => {
      const next = tasks.map((d, i) =>
        i === dayIndex
          ? {
              ...d,
              items: trimmed
                ? d.items.map((item, j) => (j === taskIndex ? trimmed : item))
                : d.items.filter((_, j) => j !== taskIndex),
            }
          : d
      )
      return next
    })
    setEditingDaily({ dayIndex: null, taskIndex: null, value: '' })
  }

  function addDailyTask(dayIndex) {
    dailyTasksUpdate((tasks) => {
      const next = tasks.map((d, i) =>
        i === dayIndex ? { ...d, items: [...d.items, ''] } : d
      )
      return next
    })
    const len = content.dailyTasks[dayIndex]?.items?.length ?? 0
    setEditingDaily({ dayIndex, taskIndex: len, value: '' })
  }

  function removeDailyTask(dayIndex, taskIndex) {
    dailyTasksUpdate((tasks) =>
      tasks.map((d, i) =>
        i === dayIndex ? { ...d, items: d.items.filter((_, j) => j !== taskIndex) } : d
      )
    )
    setEditingDaily({ dayIndex: null, taskIndex: null, value: '' })
  }

  function addDailyDay() {
    dailyTasksUpdate((tasks) => [...tasks, { day: 'יום חדש', items: [''] }])
    setEditingDayName({ index: content.dailyTasks.length, value: 'יום חדש' })
    setEditingDaily({ dayIndex: content.dailyTasks.length, taskIndex: 0, value: '' })
  }

  function removeDailyDay(dayIndex) {
    dailyTasksUpdate((tasks) => tasks.filter((_, i) => i !== dayIndex))
    setEditingDayName({ index: null, value: '' })
    if (editingDaily.dayIndex === dayIndex) setEditingDaily({ dayIndex: null, taskIndex: null, value: '' })
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
    return {
      title: '',
      ingredientsText: '',
      instructionsText: '',
    }
  }

  async function handleSubmit(values) {
    const ingredients = linesToArray(values.ingredientsText)
    const instructions = linesToArray(values.instructionsText)
    if (ingredients.length === 0 || instructions.length === 0) return

    const payload = {
      title: values.title.trim(),
      ingredients,
      instructions,
    }

    try {
      if (formRecipe) {
        await saveRecipe({ ...formRecipe, ...payload })
      } else {
        await saveRecipe(payload)
      }
      closeForm()
    } catch (err) {
      console.error('Recipe save failed', err)
    }
  }

  async function handleDelete(recipe) {
    if (!window.confirm(`למחוק את המתכון "${recipe.title}"?`)) return
    const id = recipe._id
    try {
      await removeRecipe(id)
      if (formRecipe && String(formRecipe._id) === String(id)) closeForm()
    } catch (err) {
      console.error('Recipe delete failed', err)
    }
  }

  return (
    <section className="bar-book-page">
      <h1 className="page-title">ספר בר</h1>

      <div className="bar-book-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`bar-book-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bar-book-content">
        {isLoadingBarBook && (
          <p className="bar-book-loading">טוען ספר בר...</p>
        )}
        {!isLoadingBarBook && barBookError && (
          <p className="bar-book-error">{barBookError}</p>
        )}
        {!isLoadingBarBook && !barBookError && content && activeTab === 'checklists' && (
          <div className="bar-book-checklists">
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
                      className="checklist-title editable"
                      onClick={() => setEditingSectionTitle({ key, value: list.title })}
                      title="לחץ לעריכה"
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
                              className="editable"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                startEditChecklistItem(key, i, item)
                              }}
                              title="לחץ לעריכה"
                            >
                              {item || '(ריק)'}
                            </span>
                            <button
                              type="button"
                              className="btn-icon btn-delete-item"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                removeChecklistItem(key, i)
                              }}
                              title="מחק משימה"
                              aria-label="מחק"
                            >
                              ×
                            </button>
                          </label>
                        )}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    className="btn-add-item"
                    onClick={() => addChecklistItem(key)}
                  >
                    + הוסף משימה
                  </button>
                </section>
              )
            })}
            <div className="bar-book-reset-wrap">
              <button type="button" className="btn-reset-default" onClick={clearBarBookContent}>
                נקה תוכן
              </button>
            </div>
          </div>
        )}

        {!isLoadingBarBook && !barBookError && content && activeTab === 'daily' && (
          <div className="bar-book-full-pages">
            <section className="daily-tasks-section">
              <h2 className="section-title">משימות יומיות</h2>
              <p className="section-intro">משימות יומיות מתבצעות בכל משמרת. המשימה מתבצעת לפי יום בשבוע.</p>
              <div className="daily-tasks-table-wrap">
                <table className="daily-tasks-table daily-tasks-vertical editable-table">
                  <thead>
                    <tr>
                      <th>יום</th>
                      <th>משימה יומית</th>
                      <th className="th-actions"></th>
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
                              className="editable"
                              onClick={() => setEditingDayName({ index: i, value: d.day })}
                              title="לחץ לעריכה"
                            >
                              {d.day}
                            </span>
                          )}
                        </td>
                        <td className="daily-task-details-cell">
                          <ul className="daily-task-items">
                            {(d.items || []).map((item, j) => (
                              <li key={j}>
                                {editingDaily.dayIndex === i && editingDaily.taskIndex === j ? (
                                  <input
                                    type="text"
                                    value={editingDaily.value}
                                    onChange={(e) => setEditingDaily((p) => ({ ...p, value: e.target.value }))}
                                    onBlur={saveDailyTaskEdit}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') saveDailyTaskEdit()
                                      if (e.key === 'Escape') setEditingDaily({ dayIndex: null, taskIndex: null, value: '' })
                                    }}
                                    autoFocus
                                    className="edit-input inline-edit"
                                  />
                                ) : (
                                  <>
                                    <span
                                      className="editable"
                                      onClick={() => setEditingDaily({ dayIndex: i, taskIndex: j, value: item })}
                                      title="לחץ לעריכה"
                                    >
                                      {item || '(ריק)'}
                                    </span>
                                    <button
                                      type="button"
                                      className="btn-icon btn-delete-item"
                                      onClick={() => removeDailyTask(i, j)}
                                      title="מחק"
                                      aria-label="מחק"
                                    >
                                      ×
                                    </button>
                                  </>
                                )}
                              </li>
                            ))}
                            <li>
                              <button
                                type="button"
                                className="btn-add-task-inline"
                                onClick={() => addDailyTask(i)}
                              >
                                + הוסף משימה
                              </button>
                            </li>
                          </ul>
                        </td>
                        <td className="td-actions">
                          <button
                            type="button"
                            className="btn-icon btn-delete-row"
                            onClick={() => removeDailyDay(i)}
                            title="מחק יום"
                          >
                            מחק שורה
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button type="button" className="btn-add-item" onClick={addDailyDay}>
                + הוסף יום
              </button>
            </section>
            <div className="bar-book-reset-wrap">
              <button type="button" className="btn-reset-default" onClick={clearBarBookContent}>
                נקה תוכן
              </button>
            </div>
          </div>
        )}

        {!isLoadingBarBook && !barBookError && content && activeTab === 'pages' && (
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
                  className="section-title editable"
                  onClick={() => setEditingStockTitle(content.stockTable.title)}
                  title="לחץ לעריכה"
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
                              className="editable"
                              onClick={() => setEditingStockHeader({ index: i, value: h })}
                              title="לחץ לעריכה"
                            >
                              {h}
                            </span>
                          )}
                        </th>
                      ))}
                      <th className="th-actions"></th>
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
                                className="editable"
                                onClick={() =>
                                  setEditingStockCell({ row: rowIndex, col: colIndex, value: cell ?? '' })
                                }
                                title="לחץ לעריכה"
                              >
                                {cell ?? ''}
                              </span>
                            )}
                          </td>
                        ))}
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button type="button" className="btn-add-item" onClick={addStockRow}>
                + הוסף שורה
              </button>
            </section>
            <div className="bar-book-reset-wrap">
              <button type="button" className="btn-reset-default" onClick={clearBarBookContent}>
                נקה תוכן
              </button>
            </div>
          </div>
        )}

        {activeTab === 'recipes' && (
          <div className="recipes-page bar-book-recipes">
            <h2 className="section-title">מתכונים</h2>
            <div className="recipes-content">
              <div className="recipes-header-actions">
                <button type="button" className="btn-add-recipe" onClick={openAddForm}>
                  + הוסף מתכון
                </button>
              </div>
              <div className="recipes-grid">
                {isLoading ? (
                  <p className="recipes-loading">טוען מתכונים...</p>
                ) : error ? (
                  <p className="recipes-error">{error}</p>
                ) : recipes.length === 0 ? (
                  <p className="recipes-empty">אין מתכונים. הוסף מתכון ראשון.</p>
                ) : (
                  recipes.map((recipe) => (
                    <article key={recipe._id} className="recipe-card">
                      <div className="recipe-card-header">
                        <h2 className="recipe-title">{recipe.title}</h2>
                        <div className="recipe-card-actions">
                          <button
                            type="button"
                            className="btn-edit-recipe"
                            onClick={() => openEditForm(recipe)}
                            title="ערוך מתכון"
                          >
                            ערוך
                          </button>
                          <button
                            type="button"
                            className="btn-delete-recipe"
                            onClick={() => handleDelete(recipe)}
                            title="מחק מתכון"
                          >
                            מחק
                          </button>
                        </div>
                      </div>
                      <div className="recipe-section">
                        <h3>מרכיבים</h3>
                        <ul>
                          {(recipe.ingredients || []).map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="recipe-section">
                        <h3>אופן ההכנה</h3>
                        <ol>
                          {(recipe.instructions || []).map((step, i) => (
                            <li key={i}>{step}</li>
                          ))}
                        </ol>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {isFormOpen && (
        <div className="recipe-form-overlay" onClick={closeForm}>
          <div className="recipe-form-container" onClick={(e) => e.stopPropagation()}>
            <h2>{formRecipe ? 'עריכת מתכון' : 'הוספת מתכון'}</h2>
            <Formik
              initialValues={getInitialValues()}
              validationSchema={recipeSchema}
              onSubmit={handleSubmit}
              enableReinitialize
            >
              <Form className="recipe-form">
                <div className="form-group">
                  <label htmlFor="recipe-title">שם המתכון</label>
                  <Field id="recipe-title" name="title" type="text" className="form-input" placeholder="למשל: סירופ קינמון" />
                  <ErrorMessage name="title" component="div" className="form-error" />
                </div>
                <div className="form-group">
                  <label htmlFor="recipe-ingredients">מרכיבים (שורה אחת לכל מרכיב)</label>
                  <Field
                    id="recipe-ingredients"
                    name="ingredientsText"
                    as="textarea"
                    className="form-textarea"
                    rows={6}
                    placeholder={'מי סוכר\nכוסברה\nמחית פסיפלורה'}
                  />
                  <ErrorMessage name="ingredientsText" component="div" className="form-error" />
                </div>
                <div className="form-group">
                  <label htmlFor="recipe-instructions">אופן ההכנה (שורה אחת לכל שלב)</label>
                  <Field
                    id="recipe-instructions"
                    name="instructionsText"
                    as="textarea"
                    className="form-textarea"
                    rows={8}
                    placeholder={'נערבל את המרכיבים.\nנסנן ונסיים.'}
                  />
                  <ErrorMessage name="instructionsText" component="div" className="form-error" />
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn-save">
                    {formRecipe ? 'שמור שינויים' : 'הוסף מתכון'}
                  </button>
                  <button type="button" className="btn-cancel" onClick={closeForm}>
                    ביטול
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
