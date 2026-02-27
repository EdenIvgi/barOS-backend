import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import { loadRecipes, saveRecipe, removeRecipe } from '../store/actions/recipe.actions.js'
import i18n from '../services/i18.js'

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

function getRecipeSchema() {
  return Yup.object().shape({
    title: Yup.string().trim().required(i18n.t('recipeTitleRequired')),
    ingredientsText: Yup.string()
      .trim()
      .required(i18n.t('minOneIngredient'))
      .test('minLines', i18n.t('minOneIngredient'), (val) => linesToArray(val || '').length > 0),
    instructionsText: Yup.string()
      .trim()
      .required(i18n.t('minOneStep'))
      .test('minLines', i18n.t('minOneStep'), (val) => linesToArray(val || '').length > 0),
  })
}

export function RecipesPage() {
  const { t } = useTranslation()
  const recipes = useSelector((storeState) => storeState.recipeModule.recipes)
  const isLoading = useSelector((storeState) => storeState.recipeModule.flag.isLoading)
  const error = useSelector((storeState) => storeState.recipeModule.flag.error)
  const [formRecipe, setFormRecipe] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  useEffect(() => {
    loadRecipes()
  }, [])

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
    <section className="recipes-page">
      <h1 className="page-title">מתכונים</h1>
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
            <div className="empty-state">
              <p className="recipes-empty">{t('noRecipes')}</p>
              <button type="button" className="btn-add-recipe" onClick={openAddForm}>
                + {t('addFirstRecipe')}
              </button>
            </div>
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

      {isFormOpen && (
        <div className="recipe-form-overlay" onClick={(e) => e.target === e.currentTarget && closeForm()}>
          <div className="recipe-form-container" onClick={(e) => e.stopPropagation()}>
            <h2>{formRecipe ? t('editingRecipe') : t('addingRecipe')}</h2>
            <Formik
              initialValues={getInitialValues()}
              validationSchema={getRecipeSchema()}
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
