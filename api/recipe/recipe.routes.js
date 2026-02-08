import express from 'express'
import {
  getRecipes,
  getRecipeById,
  addRecipe,
  updateRecipe,
  deleteRecipe,
  seedRecipes
} from './recipe.controller.js'

const router = express.Router()

router.get('/', getRecipes)
router.get('/seed', seedRecipes)
router.get('/:id', getRecipeById)
router.post('/', addRecipe)
router.put('/:id', updateRecipe)
router.delete('/:id', deleteRecipe)

export const recipeRoutes = router
