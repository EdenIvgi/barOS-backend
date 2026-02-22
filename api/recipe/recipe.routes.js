import express from 'express'
import {
  getRecipes,
  getRecipeById,
  addRecipe,
  updateRecipe,
  deleteRecipe,
  seedRecipes
} from './recipe.controller.js'
import { requireAuth } from '../../middleware/auth.middleware.js'
import { validate } from '../../middleware/validate.middleware.js'

const router = express.Router()

const recipeSchema = {
  title: { required: true, minLength: 1 },
}

router.get('/', getRecipes)
router.get('/seed', requireAuth, seedRecipes)
router.get('/:id', getRecipeById)
router.post('/', requireAuth, validate(recipeSchema), addRecipe)
router.put('/:id', requireAuth, validate(recipeSchema), updateRecipe)
router.delete('/:id', requireAuth, deleteRecipe)

export const recipeRoutes = router
