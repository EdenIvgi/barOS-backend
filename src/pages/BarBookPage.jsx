import { useState, useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import { loadRecipes, saveRecipe, removeRecipe } from '../store/actions/recipe.actions.js'
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

const TAB_IDS = ['recipes', 'checklists', 'pages', 'daily']

export function BarBookPage() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('checklists')
  const [content, setContent] = useState(null)
  const [isLoadingBarBook, setIsLoadingBarBook] = useState(true)
  const [barBookError, setBarBookError] = useState(null)
  const skipSaveRef = useRef(true)
  const [editingChecklist, setEditingChecklist] = useState({ key: null, index: null, value: '' })
  const [editingDailyTask, setEditingDailyTask] = useState({ dayIndex: null, value: '' })
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
    if (!window.confirm(`${t('confirmDeleteRecipe')} "${recipe.title}"?`)) return
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
      <h1 className="page-title">{t('barBookTitle')}</h1>

      <div className="bar-book-tabs">
        {TAB_IDS.map((tabId) => (
          <button
            key={tabId}
            type="button"
            className={`bar-book-tab ${activeTab === tabId ? 'active' : ''}`}
            onClick={() => setActiveTab(tabId)}
          >
            {t(tabId === 'checklists' ? 'tabChecklists' : tabId === 'pages' ? 'tabPages' : tabId === 'daily' ? 'tabDaily' : 'tabRecipes')}
          </button>
        ))}
      </div>

      <div className="bar-book-content">
        {isLoadingBarBook && (
          <p className="bar-book-loading">{t('loadingBarBook')}</p>
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
                      title={t('clickToEdit')}
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
                              title={t('clickToEdit')}
                            >
                              {item || t('emptyCell')}
                            </span>
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
                    + {t('addTask')}
                  </button>
                </section>
              )
            })}
            <div className="bar-book-reset-wrap">
              <button type="button" className="btn-reset-default" onClick={clearBarBookContent}>
                {t('clearContent')}
              </button>
            </div>
          </div>
        )}

        {!isLoadingBarBook && !barBookError && content && activeTab === 'daily' && (
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
                              title={t('clickToEdit')}
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
                              className="daily-task-text editable"
                              onClick={() => setEditingDailyTask({ dayIndex: i, value: d.task ?? '' })}
                              title={t('clickToEdit')}
                            >
                              {(d.task ?? '').trim() || t('emptyClickEdit')}
                            </div>
                          )}
                        </td>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button type="button" className="btn-add-item" onClick={addDailyDay}>
                + {t('addDay')}
              </button>
            </section>
            <div className="bar-book-reset-wrap">
              <button type="button" className="btn-reset-default" onClick={clearBarBookContent}>
                {t('clearContent')}
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
                {t('clearContent')}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'recipes' && (
          <div className="recipes-page bar-book-recipes">
            <h2 className="section-title">{t('recipesTitle')}</h2>
            <div className="recipes-content">
              <div className="recipes-header-actions">
                <button type="button" className="btn-add-recipe" onClick={openAddForm}>
                  + {t('addRecipe')}
                </button>
              </div>
              <div className="recipes-grid">
                {isLoading ? (
                  <p className="recipes-loading">{t('loadingRecipes')}</p>
                ) : error ? (
                  <p className="recipes-error">{error}</p>
                ) : recipes.length === 0 ? (
                  <p className="recipes-empty">{t('noRecipes')}</p>
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
                            title={t('editRecipe')}
                          >
                            {t('edit')}
                          </button>
                          <button
                            type="button"
                            className="btn-delete-recipe"
                            onClick={() => handleDelete(recipe)}
                            title={t('deleteRecipe')}
                          >
                            {t('delete')}
                          </button>
                        </div>
                      </div>
                      <div className="recipe-section">
                        <h3>{t('ingredients')}</h3>
                        <ul>
                          {(recipe.ingredients || []).map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="recipe-section">
                        <h3>{t('instructions')}</h3>
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
