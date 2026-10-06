import express from 'express'
import {
    getRecipes,
    getRecipeById,
    getIngredients,
    parseRecipes,
    addRecipe,
    addRecipes,
    updateRecipe,
    deleteRecipe,
} from './recipe.controller.js'
import { requireAuth, requireManager } from '../../middleware/auth.middleware.js'
import { validate } from '../../middleware/validate.middleware.js'

const router = express.Router()

const recipeSchema = {
    title: { required: true },
}

// Before /:id, or the word "ingredients" is read as a recipe's id.
router.get('/ingredients', requireAuth, getIngredients)

router.get('/', requireAuth, getRecipes)

// Reading pasted text costs a model call and writes nothing, so it sits before
// the id routes and answers only managers.
router.post('/parse', requireAuth, requireManager, parseRecipes)
router.post('/bulk', requireAuth, requireManager, addRecipes)

router.get('/:id', requireAuth, getRecipeById)

// Writing a recipe is a manager's job, same as changing what the bar stocks.
// The shared library is not writable through any of these.
router.post('/', requireAuth, requireManager, validate(recipeSchema), addRecipe)
router.put('/:id', requireAuth, requireManager, validate(recipeSchema), updateRecipe)
router.delete('/:id', requireAuth, requireManager, deleteRecipe)

export const recipeRoutes = router
