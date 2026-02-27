import express from 'express'
import {
  getRecipes,
  getRecipeById,
  addRecipe,
  updateRecipe,
  deleteRecipe,
} from './recipe.controller.js'
import { requireAuth } from '../../middleware/auth.middleware.js'
import { validate } from '../../middleware/validate.middleware.js'

const router = express.Router()

const recipeSchema = {
  title: { required: true, minLength: 1 },
}

router.get('/', requireAuth, getRecipes)
router.get('/:id', requireAuth, getRecipeById)
router.post('/', requireAuth, validate(recipeSchema), addRecipe)
router.put('/:id', requireAuth, validate(recipeSchema), updateRecipe)
router.delete('/:id', requireAuth, deleteRecipe)

export const recipeRoutes = router
